import { GraphQLError } from "graphql";
import { UserRepository } from "../../../repositories/userRepository";
import { ScriptRepository } from "../../../repositories/scriptRepository";
import { ParagraphRepository } from "../../../repositories/paragraphRepository";

interface MyContext {
  redis: any;
  user: any;
  req: any;
}

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

const toUnixString = (date: any) => {
  if (!date) return null;
  return new Date(date).getTime().toString();
};

export const userQueries = {
  getUserProfile: async (_: unknown, { id }: { id: string }, context: MyContext) => {
    const ip = context.req?.ip || context.req?.socket?.remoteAddress || "unknown_ip";
    await enforceRateLimit(context.redis, ip, "get_user_profile", 100, 60);

    const cacheKey = `user:${id}:profile:v3`;
    const cachedProfile = await context.redis.get(cacheKey);
    if (cachedProfile) return JSON.parse(cachedProfile);

    const user = await UserRepository.findByIdWithProfileData(id);
    if (!user) throw new Error("User not found");

    const obj: any = user.toObject({ virtuals: true });
    obj.createdAt = toUnixString(obj.createdAt);
    obj.updatedAt = toUnixString(obj.updatedAt);
    obj.favourites = obj.favourites || [];
    obj.languages = obj.languages || [];
    obj.likes = obj.likes || [];
    obj.followers = obj.followers || [];
    obj.views = obj.views || [];

    obj.follows = (obj.follows || []).map((follow: any) => ({
      ...follow,
      createdAt: toUnixString(follow.createdAt),
      updatedAt: toUnixString(follow.updatedAt),
    }));

    obj.scripts = (obj.scripts || []).map((script: any) => ({
      ...script,
      createdAt: toUnixString(script.createdAt),
      updatedAt: toUnixString(script.updatedAt),
    }));

    await context.redis.setEx(cacheKey, 3600, JSON.stringify(obj));
    return obj;
  },

  getUserScripts: async (_: unknown, { userId }: { userId: string }, context: MyContext) => {
    const ip = context.req?.ip || context.req?.socket?.remoteAddress || "unknown_ip";
    await enforceRateLimit(context.redis, ip, "get_user_scripts", 100, 60);

    const requesterId = context.user?.id || context.user?._id;
    const isOwner = Boolean(requesterId && String(requesterId) === String(userId));

    const cacheKey = isOwner ? `user:${userId}:scripts:owner:v3` : `user:${userId}:scripts:public:v3`;
    const cachedScripts = await context.redis.get(cacheKey);
    if (cachedScripts) return JSON.parse(cachedScripts);

    // 🚨 REPOSITORY CALL
    const scripts = await ScriptRepository.findUserScripts(userId, isOwner);

    const formattedScripts = scripts.map((script: any) => {
      const obj: any = script.toObject({ virtuals: true });
      return {
        ...obj,
        createdAt: toUnixString(obj.createdAt),
        updatedAt: toUnixString(obj.updatedAt),
        author: obj.author ? {
          ...obj.author,
          createdAt: toUnixString(obj.author.createdAt),
          updatedAt: toUnixString(obj.author.updatedAt),
        } : null,
      };
    });

    await context.redis.setEx(cacheKey, 3600, JSON.stringify(formattedScripts));
    return formattedScripts;
  },

  getUserContributions: async (_: any, { userId }: { userId: string }, context: MyContext) => {
    const ip = context.req?.ip || context.req?.socket?.remoteAddress || "unknown_ip";
    const viewerId = context.user?.id ? String(context.user.id) : "guest";
    await enforceRateLimit(context.redis, ip, "get_user_contributions", 100, 60);

    const cacheKey = `user:${userId}:viewer:${viewerId}:contributions:v4`;
    const cachedContributions = await context.redis.get(cacheKey);
    if (cachedContributions) return JSON.parse(cachedContributions);

    // 🚨 REPOSITORY CALL
    const paragraphs = await ParagraphRepository.findContributionsByAuthor(userId);

    const filteredParagraphs = paragraphs.filter((p: any) => {
      const script = p.script;
      if (!script) return false;
      if (!script.visibility || script.visibility.toLowerCase() === "public") return true;
      if (viewerId === "guest") return false;

      const isOwner = String(script.author) === viewerId;
      const isAcceptedCollaborator = script.collaborators?.some(
        (c: any) => String(c.user) === viewerId && c.status === "ACCEPTED"
      );

      return isOwner || isAcceptedCollaborator;
    });

    const result = filteredParagraphs.map((p: any) => {
      const obj: any = p.toObject({ virtuals: true });
      return {
        ...obj,
        createdAt: toUnixString(obj.createdAt),
        updatedAt: toUnixString(obj.updatedAt),
        script: obj.script ? {
          ...obj.script,
          id: p.script._id?.toString() || p.script.id?.toString(),
          title: p.script.title,
          createdAt: toUnixString(obj.script.createdAt),
          updatedAt: toUnixString(obj.script.updatedAt),
        } : null,
        comments: (obj.comments || []).map((comment: any) => ({
          ...comment,
          createdAt: toUnixString(comment.createdAt),
          updatedAt: toUnixString(comment.updatedAt),
          author: comment.author ? {
            ...comment.author,
            createdAt: toUnixString(comment.author.createdAt),
            updatedAt: toUnixString(comment.author.updatedAt),
          } : null,
        })),
      };
    });

    await context.redis.setEx(cacheKey, 600, JSON.stringify(result));
    return result;
  },

  getUserFavourites: async (_: unknown, { userId }: { userId: string }, context: MyContext) => {
    const ip = context.req?.ip || context.req?.socket?.remoteAddress || "unknown_ip";
    await enforceRateLimit(context.redis, ip, "get_user_favourites", 100, 60);

    // 🚨 REPOSITORY CALL
    const user = await UserRepository.findByIdWithFavourites(userId);
    if (!user) throw new GraphQLError("User not found");

    const formattedFavs = (user.favourites || [])
      .filter((fav: any) => {
        if (!fav) return false;
        const isPublic = !fav.visibility || fav.visibility.toLowerCase() === "public";
        const isArchived = fav.status?.toLowerCase() === "archived";
        return isPublic && !isArchived;
      })
      .map((fav: any) => {
        const obj: any = fav.toObject ? fav.toObject({ virtuals: true }) : fav;
        return {
          ...obj,
          id: obj._id?.toString() || obj.id?.toString(),
          createdAt: toUnixString(obj.createdAt),
          updatedAt: toUnixString(obj.updatedAt),
          author: obj.author ? {
            ...obj.author,
            id: obj.author._id?.toString() || obj.author.id?.toString(),
            createdAt: toUnixString(obj.author.createdAt),
            updatedAt: toUnixString(obj.author.updatedAt),
          } : null,
        };
      });

    return formattedFavs;
  },

  searchUsers: async (_: any, { query }: { query: string }, context: any) => {
    const currentUserId = context.user?.id;
    if (!currentUserId) throw new GraphQLError("User not authenticated");

    if (!query || query.trim().length < 2) return [];
    throw new Error("CRITICAL FAILURE: Testing OpenTelemetry Error Tracking!");
    try {
      const searchRegex = new RegExp(query, "i");
      // 🚨 REPOSITORY CALL
      return await UserRepository.search(searchRegex, currentUserId);
    } catch (error) {
      console.error("Search Users Error:", error);
      throw new GraphQLError("Failed to search users");
    }
  }
};