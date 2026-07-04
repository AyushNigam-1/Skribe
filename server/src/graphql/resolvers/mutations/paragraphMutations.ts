import Notification from "../../../models/Notification";
import { GraphQLError } from "graphql";
import { getIO } from "../../../utils/socket";

// 🚨 IMPORT REPOSITORIES
import { ParagraphRepository } from "../../../repositories/paragraphRepository";
import { ScriptRepository } from "../../../repositories/scriptRepository";

const enforceRateLimit = async (redis: any, identifier: string, action: string, limit: number, windowSeconds: number) => {
  if (!redis) return;
  const key = `ratelimit:${action}:${identifier}`;
  const currentCount = await redis.incr(key);
  if (currentCount === 1) await redis.expire(key, windowSeconds);
  if (currentCount > limit) {
    throw new GraphQLError(`Too many requests for ${action}. Please try again later.`, {
      extensions: { code: "TOO_MANY_REQUESTS", http: { status: 429 } },
    });
  }
};

const invalidateParagraphCache = async (redis: any, scriptId: string, paragraphId: string) => {
  if (!redis) return;
  try {
    const scriptKeys = await redis.keys(`*${scriptId}*`);
    const paragraphKeys = await redis.keys(`*${paragraphId}*`);
    const keysToDelete = [...new Set([...scriptKeys, ...paragraphKeys])];
    if (keysToDelete.length > 0) await redis.del(keysToDelete);
  } catch (err) {
    console.error("Redis cache clearing failed", err);
  }
};

const dispatchNotification = (recipientId: any, senderId: any, type: string, message: string, link: string, draftTitle?: string) => {
  const recipientStr = recipientId.toString();
  if (recipientStr === senderId.toString()) return;

  Notification.create({
    recipient: recipientId, sender: senderId, type, message, draftTitle, link,
  }).then(async (newNotif: any) => {
    const populatedNotif = await newNotif.populate("sender", "id name");
    const obj = populatedNotif.toObject({ virtuals: true });
    const payload = { ...obj, id: obj.id || newNotif._id.toString(), createdAt: newNotif.createdAt.getTime().toString() };
    getIO().to(recipientStr).emit("new notification", payload);
  }).catch(console.error);
};

const getCleanTitle = (scriptDoc: any) => {
  if (!scriptDoc) return "Untitled Draft";
  try {
    const obj = scriptDoc.toObject({ virtuals: true });
    return obj.title || "Untitled Draft";
  } catch (err) {
    return scriptDoc.title || "Untitled Draft";
  }
};

const getFirstName = (fullName: string | undefined) => {
  if (!fullName) return "Someone";
  return fullName.split(" ")[0];
};

export const paragraphMutations = {
  approveParagraph: async (_: any, { paragraphId }: { paragraphId: string }, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");

    await enforceRateLimit(context.redis, userId, "approve_paragraph", 60, 60);

    const paragraph = await ParagraphRepository.updateStatus(paragraphId, "approved");
    if (!paragraph) throw new GraphQLError("Paragraph not found");

    // paragraph.script is already the populated Script doc — use it directly
    const script = paragraph.script as any;
    if (!script) throw new GraphQLError("Script not found");

    const paragraphAuthorId = paragraph.author.toString();
    const scriptOwnerId = script.author.toString();

    const existingCollab = script.collaborators?.find((c: any) => c.user.toString() === paragraphAuthorId);

    if (existingCollab) {
      await ScriptRepository.forceAcceptCollaboratorAndAddParagraph(String(script._id), paragraphAuthorId, String(paragraph._id));
    } else if (paragraphAuthorId !== scriptOwnerId) {
      await ScriptRepository.addAcceptedContributorAndAddParagraph(String(script._id), paragraphAuthorId, String(paragraph._id));
    } else {
      await ScriptRepository.addParagraphId(String(script._id), String(paragraph._id));
    }

    await invalidateParagraphCache(context.redis, String(script._id), paragraphId);

    if (context.redis) {
      try {
        const exactScriptKeys = await context.redis.keys(`*${String(script._id)}*`);
        if (exactScriptKeys.length > 0) await context.redis.del(exactScriptKeys);
      } catch (err) { }
    }

    const firstName = getFirstName(context.user?.name);
    const draftTitle = getCleanTitle(script);
    await dispatchNotification(paragraph.author, userId, "INFO", `${firstName} approved your contribution`, `/contribution/${script._id}/${paragraph._id}`, draftTitle);

    return { status: true };
  },

  rejectParagraph: async (_: any, { paragraphId }: { paragraphId: string }, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");

    await enforceRateLimit(context.redis, userId, "reject_paragraph", 60, 60);

    // 🚨 REPO CALL
    const paragraph: any = await ParagraphRepository.updateStatus(paragraphId, "rejected");

    if (paragraph) {
      await invalidateParagraphCache(context.redis, paragraph.script._id.toString(), paragraphId);
      const firstName = getFirstName(context.user?.name);
      const draftTitle = getCleanTitle(paragraph.script);
      await dispatchNotification(paragraph.author, userId, "INFO", `${firstName} declined your submission`, `/contribution/${paragraph.script._id}/${paragraph._id}`, draftTitle);
    }

    return { status: true };
  },

  editParagraph: async (_: any, { paragraphId, text }: { paragraphId: string; text: string }, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");

    await enforceRateLimit(context.redis, userId, "edit_paragraph", 30, 60);

    // 🚨 REPO CALL
    const paragraph = await ParagraphRepository.findByIdWithScript(paragraphId);
    if (!paragraph) throw new GraphQLError("Paragraph not found");

    const script: any = paragraph.script;
    const paragraphAuthorId = paragraph.author.toString();

    const isParagraphAuthor = paragraphAuthorId === userId;
    const isScriptOwner = script.author.toString() === userId;
    const isEditor = script.collaborators?.some((c: any) => c.user.toString() === userId && (c.role === "EDITOR" || c.role === "OWNER"));

    if (!isParagraphAuthor && !isScriptOwner && !isEditor) {
      throw new GraphQLError("Not authorized to edit this paragraph");
    }

    if (!text || text.trim() === "") throw new GraphQLError("Paragraph text cannot be empty");

    // 🚨 REPO CALL
    const updatedParagraph = await ParagraphRepository.updateText(paragraphId, text);
    await invalidateParagraphCache(context.redis, script._id.toString(), paragraphId);

    return updatedParagraph;
  },

  deleteParagraph: async (_: any, { paragraphId }: { paragraphId: string }, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");

    await enforceRateLimit(context.redis, userId, "delete_paragraph", 20, 60);

    // 🚨 REPO CALL
    const paragraph = await ParagraphRepository.findByIdWithScript(paragraphId);
    if (!paragraph) throw new GraphQLError("Paragraph not found");

    const script: any = paragraph.script;
    const isParagraphAuthor = paragraph.author.toString() === userId;
    const isScriptOwner = script.author?.toString() === userId;
    const isEditor = script.collaborators?.some((c: any) => c.user?.toString() === userId && (c.role === "OWNER" || c.role === "EDITOR"));

    if (!isParagraphAuthor && !isScriptOwner && !isEditor) {
      throw new GraphQLError("Not authorized to delete this paragraph");
    }

    // 🚨 REPO CALLS
    await ParagraphRepository.deleteById(paragraphId);
    await ScriptRepository.removeParagraphId(script._id.toString(), paragraphId);

    await invalidateParagraphCache(context.redis, script._id.toString(), paragraphId);
    return { status: true };
  },

  likeParagraph: async (_: any, { paragraphId }: { paragraphId: string }, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");

    await enforceRateLimit(context.redis, userId, "like_paragraph", 60, 60);

    // 🚨 REPO CALL
    const paragraph: any = await ParagraphRepository.findByIdWithScript(paragraphId);
    if (!paragraph) throw new GraphQLError("Paragraph not found");

    const hasLiked = paragraph.likes?.includes(userId) || false;

    // 🚨 REPO CALLS
    if (hasLiked) {
      await ParagraphRepository.removeLike(paragraphId, userId);
    } else {
      await ParagraphRepository.addLike(paragraphId, userId);
      const firstName = getFirstName(context.user?.name);
      const draftTitle = getCleanTitle(paragraph.script);
      await dispatchNotification(paragraph.author, userId, "LIKE", `${firstName} liked your contribution`, `/contribution/${paragraph.script._id}/${paragraph._id}`, draftTitle);
    }

    await invalidateParagraphCache(context.redis, paragraph.script._id.toString(), paragraphId);
    return { status: true };
  },

  dislikeParagraph: async (_: any, { paragraphId }: { paragraphId: string }, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");

    await enforceRateLimit(context.redis, userId, "dislike_paragraph", 60, 60);

    // 🚨 REPO CALL
    const paragraph = await ParagraphRepository.findByIdWithScript(paragraphId);
    if (!paragraph) throw new GraphQLError("Paragraph not found");

    const hasDisliked = paragraph.dislikes?.includes(userId) || false;

    // 🚨 REPO CALLS
    if (hasDisliked) {
      await ParagraphRepository.removeDislike(paragraphId, userId);
    } else {
      await ParagraphRepository.addDislike(paragraphId, userId);
    }

    await invalidateParagraphCache(context.redis, paragraph.script.toString(), paragraphId);
    return { status: true };
  },

  addComment: async (_: any, { paragraphId, text }: { paragraphId: string; text: string }, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");

    await enforceRateLimit(context.redis, userId, "add_comment", 30, 60);

    if (!text || text.trim() === "") throw new GraphQLError("Comment cannot be empty");

    // 🚨 REPO CALL
    const updatedParagraph: any = await ParagraphRepository.addComment(paragraphId, userId, text);
    if (!updatedParagraph) throw new GraphQLError("Paragraph not found");

    await invalidateParagraphCache(context.redis, updatedParagraph.script._id.toString(), paragraphId);

    const firstName = getFirstName(context.user?.name);
    const draftTitle = getCleanTitle(updatedParagraph.script);
    await dispatchNotification(updatedParagraph.author, userId, "COMMENT", `${firstName} commented on your contribution`, `/contribution/${updatedParagraph.script._id}/${updatedParagraph._id}`, draftTitle);

    return updatedParagraph;
  },
};