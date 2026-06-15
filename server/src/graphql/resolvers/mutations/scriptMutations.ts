import mongoose from "mongoose";
import Notification from "../../../models/Notification";
import { getIO } from "../../../utils/socket";
import { GraphQLError } from "graphql";

// 🚨 IMPORT REPOSITORIES
import { ScriptRepository } from "../../../repositories/scriptRepository";
import { ParagraphRepository } from "../../../repositories/paragraphRepository";
import { UserRepository } from "../../../repositories/userRepository";

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

const dispatchNotification = (recipientId: any, senderId: any, type: string, message: string, link: string, draftTitle?: string) => {
  const recipientStr = recipientId.toString();
  if (recipientStr === senderId.toString()) return;

  Notification.create({
    recipient: recipientId,
    sender: senderId,
    type,
    message,
    draftTitle,
    link,
  }).then(async (newNotif: any) => {
    const populatedNotif = await newNotif.populate("sender", "id name");
    const obj = populatedNotif.toObject({ virtuals: true });
    const payload = { ...obj, id: obj.id || newNotif._id.toString(), createdAt: newNotif.createdAt.getTime().toString() };
    getIO().to(recipientStr).emit("new notification", payload);
  }).catch(console.error);
};

const enforceRateLimit = async (redis: any, identifier: string, action: string, limit: number, windowSeconds: number) => {
  if (!redis) return;
  const key = `ratelimit:${action}:${identifier}`;
  const currentCount = await redis.incr(key);
  if (currentCount === 1) await redis.expire(key, windowSeconds);
  if (currentCount > limit) throw new GraphQLError(`Too many requests for ${action}. Please try again later.`, { extensions: { code: "TOO_MANY_REQUESTS", http: { status: 429 } } });
};

const invalidateScriptCache = async (redis: any, scriptId: string) => {
  if (!redis) return;
  try {
    const keys = await redis.keys(`*${scriptId}*`);
    if (keys.length > 0) await redis.del(keys);
  } catch (error) {
    console.error("Redis cache clearing failed:", error);
  }
};

const verifyEditorOrOwner = async (scriptId: string, currentUserId: string) => {
  const script = await ScriptRepository.findById(scriptId); // 🚨 REPO CALL
  if (!script) throw new GraphQLError("Script not found");

  if (script.author.toString() === currentUserId) return script;

  const scriptDoc = script as any;
  const collab = scriptDoc.collaborators?.find((c: any) => c.user.toString() === currentUserId);

  if (collab && (collab.role === "EDITOR" || collab.role === "OWNER")) return script;

  throw new GraphQLError("Access Denied: Only Authors and Editors can perform this action.");
};

export const scriptMutations = {
  createScript: async (_: any, { title, visibility, description, languages, genres }: any, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");

    await enforceRateLimit(context.redis, userId, "create_script", 10, 3600);

    // 🚨 REPO CALL
    const script = await ScriptRepository.create({
      author: new mongoose.Types.ObjectId(userId),
      title, visibility, description, languages, genres,
      paragraphs: [], requests: [], combinedText: "",
    });

    // 🚨 REPO CALL
    await UserRepository.addScriptId(userId, script._id.toString());

    await context.redis.del(`user:${userId}:scripts:owner:v3`);
    await context.redis.del(`user:${userId}:scripts:public:v3`);

    if (visibility === "Public") {
      try {
        const exploreCacheKeys = await context.redis.keys("scripts:genres:public:*");
        if (exploreCacheKeys.length > 0) await context.redis.del(exploreCacheKeys);
      } catch (err) { }
    }

    return await ScriptRepository.findById(script._id).then(s => s?.populate("author"));
  },

  submitParagraph: async (_: any, { scriptId, text }: any, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");

    await enforceRateLimit(context.redis, userId, "submit_paragraph", 30, 3600);

    const script = await ScriptRepository.findById(scriptId); // 🚨 REPO CALL
    if (!script) throw new GraphQLError("Script not found");

    // 🚨 REPO CALL
    const paragraph = await ParagraphRepository.createPending(scriptId, userId, text);

    const firstName = getFirstName(context.user?.name);
    const draftTitle = getCleanTitle(script);

    await dispatchNotification(script.author, userId, "INFO", `${firstName} submitted a contribution`, `/contribution/${scriptId}/${paragraph._id}`, draftTitle);
    await invalidateScriptCache(context.redis, scriptId);
    await context.redis.del(`user:${userId}:contributions:v3`);

    return paragraph.populate("author");
  },

  markAsInterested: async (_: any, { scriptId }: any, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("Auth required");
    await enforceRateLimit(context.redis, userId, "mark_interested", 60, 60);
    await UserRepository.markInterested(userId, scriptId); // 🚨 REPO CALL
    return { status: true };
  },

  markAsNotInterested: async (_: any, { scriptId }: any, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("Auth required");
    await enforceRateLimit(context.redis, userId, "mark_not_interested", 60, 60);
    await UserRepository.markNotInterested(userId, scriptId); // 🚨 REPO CALL
    return { status: true };
  },

  markAsFavourite: async (_: any, { scriptId }: any, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("Auth required");
    await enforceRateLimit(context.redis, userId, "mark_favourite", 60, 60);

    const user = await UserRepository.findById(userId); // 🚨 REPO CALL
    if (!user) throw new GraphQLError("User not found");

    if (!user.favourites) user.favourites = [];
    const hasFavourited = user.favourites.some((id: any) => id.toString() === scriptId.toString());

    if (hasFavourited) {
      user.favourites = user.favourites.filter((id: any) => id.toString() !== scriptId.toString());
    } else {
      user.favourites.push(new mongoose.Types.ObjectId(scriptId) as any);
    }

    await user.save();
    await context.redis.del(`user:${userId}`);
    return { status: true };
  },

  deleteScript: async (_: any, { scriptId }: any, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("Auth required");
    await enforceRateLimit(context.redis, userId, "delete_script", 20, 60);

    const script = await ScriptRepository.findById(scriptId); // 🚨 REPO CALL
    if (!script) throw new GraphQLError("Script not found");
    if (script.author.toString() !== userId) throw new GraphQLError("Not authorized to delete this script");

    const wasPublic = script.visibility === "Public";

    // 🚨 REPO CALLS
    await ScriptRepository.deleteById(scriptId);
    await ParagraphRepository.deleteManyByScriptId(scriptId);
    await UserRepository.removeScriptId(userId, scriptId);

    await invalidateScriptCache(context.redis, scriptId);
    await context.redis.del(`user:${userId}:scripts:owner:v3`);
    await context.redis.del(`user:${userId}:scripts:public:v3`);

    if (wasPublic) {
      try {
        const exploreCacheKeys = await context.redis.keys("scripts:genres:public:*");
        if (exploreCacheKeys.length > 0) await Promise.all(exploreCacheKeys.map((k: string) => context.redis.del(k)));
      } catch (err) { }
    }

    return { status: true };
  },

  removeAllParagraphs: async (_: any, { scriptId }: any, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");

    const script = await ScriptRepository.findById(scriptId); // 🚨 REPO CALL
    if (!script) throw new GraphQLError("Script not found");
    if (script.author.toString() !== userId) throw new GraphQLError("Only the author can clear the script");

    await ParagraphRepository.deleteManyByScriptId(scriptId); // 🚨 REPO CALL

    await ScriptRepository.updateFields(scriptId, { paragraphs: [], combinedText: "" }); // 🚨 REPO CALL

    await invalidateScriptCache(context.redis, scriptId);
    return script;
  },

  removeAllCollaborators: async (_: any, { scriptId }: any, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");

    const script = await ScriptRepository.findById(scriptId);
    if (!script) throw new GraphQLError("Script not found");
    if (script.author.toString() !== userId) throw new GraphQLError("Only the author can remove all members");

    const updatedScript = await ScriptRepository.removeAllCollaborators(scriptId); // 🚨 REPO CALL
    await invalidateScriptCache(context.redis, scriptId);
    return updatedScript;
  },

  updateScript: async (_: any, { scriptId, title, description, visibility, genres, languages }: any, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");

    await enforceRateLimit(context.redis, userId, "update_script", 30, 60);

    const script = await ScriptRepository.findById(scriptId); // 🚨 REPO CALL
    if (!script) throw new GraphQLError("Script not found");
    if (script.author.toString() !== userId) throw new GraphQLError("Not authorized to update this script");

    const wasPublic = script.visibility === "Public";

    const updates: any = {};
    if (title !== undefined && title !== null) updates.title = title;
    if (description !== undefined && description !== null) updates.description = description;
    if (visibility !== undefined && visibility !== null) updates.visibility = visibility;
    if (genres !== undefined && genres !== null) updates.genres = genres;
    if (languages !== undefined && languages !== null) updates.languages = languages;

    // 🚨 REPO CALL
    await ScriptRepository.updateFields(scriptId, updates);

    const isNowPublic = updates.visibility === "Public" || (!updates.visibility && script.visibility === "Public");

    await invalidateScriptCache(context.redis, scriptId);
    await context.redis.del(`user:${userId}:scripts:owner:v3`);
    await context.redis.del(`user:${userId}:scripts:public:v3`);

    if (wasPublic || isNowPublic) {
      try {
        const exploreCacheKeys = await context.redis.keys("scripts:genres:public:*");
        if (exploreCacheKeys.length > 0) await Promise.all(exploreCacheKeys.map((k: string) => context.redis.del(k)));
      } catch (err) { }
    }

    return await ScriptRepository.findById(scriptId).then(s => s?.populate("author"));
  },

  likeScript: async (_: any, { scriptId }: any, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");
    await enforceRateLimit(context.redis, userId, "like_script", 60, 60);

    const script = await ScriptRepository.findById(scriptId); // 🚨 REPO CALL
    if (!script) throw new GraphQLError("Script not found");

    const hasLiked = script.likes?.includes(userId) || false;

    // 🚨 REPO CALLS
    if (hasLiked) {
      await ScriptRepository.removeLike(scriptId, userId);
    } else {
      await ScriptRepository.addLike(scriptId, userId);
      const firstName = getFirstName(context.user?.name);
      const draftTitle = getCleanTitle(script);
      await dispatchNotification(script.author, userId, "LIKE", `${firstName} liked your draft`, `/script/${scriptId}`, draftTitle);
    }

    await invalidateScriptCache(context.redis, scriptId);
    return { status: true };
  },

  dislikeScript: async (_: any, { scriptId }: any, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");
    await enforceRateLimit(context.redis, userId, "dislike_script", 60, 60);

    const script = await ScriptRepository.findById(scriptId); // 🚨 REPO CALL
    if (!script) throw new GraphQLError("Script not found");

    const hasDisliked = script.dislikes?.includes(userId) || false;

    // 🚨 REPO CALLS
    if (hasDisliked) {
      await ScriptRepository.removeDislike(scriptId, userId);
    } else {
      await ScriptRepository.addDislike(scriptId, userId);
    }

    await invalidateScriptCache(context.redis, scriptId);
    return { status: true };
  },

  addCollaborator: async (_: any, { scriptId, identifier, role }: any, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");
    await enforceRateLimit(context.redis, userId, "manage_collab", 30, 60);

    const script = await verifyEditorOrOwner(scriptId, userId);

    const targetUser = await UserRepository.findByUsernameOrEmail(identifier); // 🚨 REPO CALL
    if (!targetUser) throw new GraphQLError(`User '${identifier}' not found on Skrible.`);

    const targetUserId = (targetUser as any)._id;
    const scriptDoc = script as any;
    const alreadyExists = scriptDoc.collaborators?.some((c: any) => c.user.toString() === targetUserId.toString());
    if (alreadyExists) throw new GraphQLError("User is already a collaborator or has a pending invite.");

    // 🚨 REPO CALL
    const updatedScript = await ScriptRepository.addPendingCollaborator(scriptId, targetUserId, role);

    const userName = context.user?.name;
    await dispatchNotification(targetUserId, userId, "REQUEST", `${userName} invited you to collaborate on a draft.`, `/timeline/${scriptId}`, scriptDoc.title);
    await invalidateScriptCache(context.redis, scriptId);
    return updatedScript;
  },

  removeCollaborator: async (_: any, { scriptId, targetUserId }: any, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");
    await enforceRateLimit(context.redis, userId, "manage_collab", 30, 60);

    let script;
    if (userId === targetUserId) {
      script = await ScriptRepository.findById(scriptId); // 🚨 REPO CALL
      if (!script) throw new GraphQLError("Script not found");
    } else {
      script = await verifyEditorOrOwner(scriptId, userId);
    }

    if (script.author.toString() === targetUserId) throw new GraphQLError("Cannot remove the original author from the manuscript.");

    // 🚨 REPO CALL
    const updatedScript = await ScriptRepository.removeCollaborator(scriptId, targetUserId);
    await invalidateScriptCache(context.redis, scriptId);
    return updatedScript;
  },

  updateCollaboratorRole: async (_: any, { scriptId, targetUserId, role }: any, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");
    await enforceRateLimit(context.redis, userId, "manage_collab", 30, 60);

    const script = await verifyEditorOrOwner(scriptId, userId);
    if (script.author.toString() === targetUserId) throw new GraphQLError("Cannot change the role of the original author.");

    // 🚨 REPO CALL
    const updatedScript = await ScriptRepository.updateCollaboratorRole(scriptId, targetUserId, role);
    if (!updatedScript) throw new GraphQLError("Collaborator not found on this script");

    await invalidateScriptCache(context.redis, scriptId);
    return updatedScript;
  },

  acceptInvitation: async (_: any, { scriptId }: any, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");

    // 🚨 REPO CALL
    const updatedScript = await ScriptRepository.acceptInvitation(scriptId, userId);
    if (!updatedScript) throw new GraphQLError("Invitation not found or already accepted.");

    const firstName = getFirstName(context.user?.name);
    const draftTitle = getCleanTitle(updatedScript);
    await dispatchNotification(updatedScript.author, userId, "INFO", `${firstName} accepted your invitation to collaborate.`, `/timeline/${scriptId}`, draftTitle);

    await invalidateScriptCache(context.redis, scriptId);
    return updatedScript;
  },

  declineInvitation: async (_: any, { scriptId }: any, context: any) => {
    const userId = context.user?.id;
    if (!userId) throw new GraphQLError("User not authenticated");

    // 🚨 REPO CALL
    const updatedScript = await ScriptRepository.declineInvitation(scriptId, userId);
    if (!updatedScript) throw new GraphQLError("Invitation not found.");

    await invalidateScriptCache(context.redis, scriptId);
    return updatedScript;
  },
};