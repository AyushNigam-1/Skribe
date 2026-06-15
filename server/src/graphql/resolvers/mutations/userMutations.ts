import { GraphQLError } from "graphql";
import dotenv from "dotenv";
import { Types } from "mongoose";
import { UserRepository } from "../../../repositories/userRepository";

dotenv.config();

const enforceRateLimit = async (
  redis: any,
  identifier: string,
  action: string,
  limit: number,
  windowSeconds: number,
) => {
  if (!redis) return;

  const key = `ratelimit:${action}:${identifier}`;
  const currentCount = await redis.incr(key);

  if (currentCount === 1) {
    await redis.expire(key, windowSeconds);
  }

  if (currentCount > limit) {
    throw new GraphQLError(
      `Too many attempts for ${action}. Please try again later.`,
      {
        extensions: { code: "TOO_MANY_REQUESTS", http: { status: 429 } },
      },
    );
  }
};

export const userMutations = {
  toggleBookmark: async (_: any, { scriptId }: { scriptId: string }, context: any) => {
    const userId = context.user?.id;
    if (!userId) {
      throw new GraphQLError("User not authenticated", { extensions: { code: "UNAUTHENTICATED" } });
    }

    const userIdStr = userId.toString();
    await enforceRateLimit(context.redis, userIdStr, "bookmark", 30, 60);

    // 🚨 Use Repo
    const user = await UserRepository.findById(userId);
    if (!user) throw new GraphQLError("User not found");

    const targetId = new Types.ObjectId(scriptId.trim());
    const isBookmarked = user.favourites?.some((id: any) => id.toString() === targetId.toString());

    // 🚨 Use Repo
    if (isBookmarked) {
      await UserRepository.removeBookmark(userId, scriptId);
    } else {
      await UserRepository.addBookmark(userId, scriptId);
    }

    if (context.redis) {
      const profileCacheKey = `user:${userIdStr}:profile:v3`;
      await context.redis.del(profileCacheKey);
    }

    return { status: true };
  },

  updateUserProfileField: async (_: any, { key, value }: { key: string; value: string }, context: any) => {
    const userId = context.user?.id;
    if (!userId) {
      throw new GraphQLError("User not authenticated", { extensions: { code: "UNAUTHENTICATED" } });
    }

    await enforceRateLimit(context.redis, userId, "update_profile", 20, 60);

    const validStringFields = ["name", "bio"];
    const validArrayFields = ["languages", "interests"];

    let formattedValue: any = value;

    if (validArrayFields.includes(key)) {
      formattedValue = value.split(",").map((item) => item.trim()).filter(Boolean);
    } else if (!validStringFields.includes(key)) {
      throw new GraphQLError(`Invalid field: ${key} cannot be updated directly.`);
    }

    // 🚨 Use Repo
    const updatedUser = await UserRepository.updateField(userId, { [key]: formattedValue });

    if (!updatedUser) throw new GraphQLError("User not found");

    return updatedUser;
  },

  likeProfile: async (_: any, { profileId }: { profileId: string }, context: any) => {
    const userId = context.user?.id;
    if (!userId) {
      throw new GraphQLError("User not authenticated", { extensions: { code: "UNAUTHENTICATED" } });
    }
    if (userId === profileId) throw new GraphQLError("Cannot like your own profile");

    await enforceRateLimit(context.redis, userId, "like_profile", 30, 60);

    // 🚨 Use Repo
    const targetUser = await UserRepository.findById(profileId);
    if (!targetUser) throw new GraphQLError("Profile not found");

    const hasLiked = targetUser.likes?.includes(userId) || false;

    // 🚨 Use Repo
    if (hasLiked) {
      await UserRepository.removeLike(profileId, userId);
    } else {
      await UserRepository.addLike(profileId, userId);
    }

    const cacheKey = `user:${profileId}:profile:v3`;
    await context.redis.del(cacheKey);

    return { status: true };
  },

  viewProfile: async (_: any, { profileId }: { profileId: string }, context: any) => {
    const userId = context.user?.id;

    if (!userId || userId === profileId) {
      return { status: false };
    }

    await enforceRateLimit(context.redis, userId, "view_profile", 10, 60);

    // 🚨 Use Repo
    await UserRepository.addView(profileId, userId);

    const cacheKey = `user:${profileId}:profile:v3`;
    await context.redis.del(cacheKey);

    return { status: true };
  }
};