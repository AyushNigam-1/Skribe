import User from "../models/User";
import { Types } from "mongoose";

export const UserRepository = {

    findById: async (id: string) => {
        return await User.findById(id);
    },

    addBookmark: async (userId: string, scriptId: string) => {
        return await User.findByIdAndUpdate(userId, {
            $addToSet: { favourites: new Types.ObjectId(scriptId) },
        });
    },

    removeBookmark: async (userId: string, scriptId: string) => {
        return await User.findByIdAndUpdate(userId, {
            $pull: { favourites: new Types.ObjectId(scriptId) },
        });
    },

    updateField: async (userId: string, updateData: Record<string, any>) => {
        return await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        );
    },

    addLike: async (profileId: string, likerId: string) => {
        return await User.findByIdAndUpdate(profileId, {
            $addToSet: { likes: likerId },
        });
    },

    removeLike: async (profileId: string, likerId: string) => {
        return await User.findByIdAndUpdate(profileId, {
            $pull: { likes: likerId },
        });
    },

    addView: async (profileId: string, viewerId: string) => {
        return await User.findByIdAndUpdate(profileId, {
            $addToSet: { views: viewerId },
        });
    },

    findByIdWithProfileData: async (id: string) => {
        return await User.findById(id)
            .populate("scripts")
            .populate("follows");
    },

    findByIdWithFavourites: async (userId: string) => {
        return await User.findById(userId).populate({
            path: "favourites",
            populate: {
                path: "author",
                select: "name createdAt updatedAt",
            },
        });
    },

    search: async (searchRegex: RegExp, excludeUserId: string) => {
        return await User.find({
            _id: { $ne: excludeUserId },
            $or: [
                { username: searchRegex },
                { name: searchRegex },
                { email: searchRegex }
            ]
        })
            .select("id name username image")
            .limit(10);
    },
    findByUsernameOrEmail: async (identifier: string) => {
        return await User.findOne({
            $or: [{ username: identifier }, { email: identifier }]
        });
    },

    addScriptId: async (userId: string, scriptId: string) => {
        return await User.findByIdAndUpdate(userId, {
            $push: { scripts: new Types.ObjectId(scriptId) },
        });
    },

    removeScriptId: async (userId: string, scriptId: string) => {
        return await User.findByIdAndUpdate(userId, {
            $pull: { scripts: new Types.ObjectId(scriptId) },
        });
    },

    markInterested: async (userId: string, scriptId: string) => {
        return await User.findByIdAndUpdate(userId, {
            $addToSet: { interested: scriptId },
            $pull: { notInterested: scriptId },
        });
    },

    markNotInterested: async (userId: string, scriptId: string) => {
        return await User.findByIdAndUpdate(userId, {
            $addToSet: { notInterested: scriptId },
            $pull: { interested: scriptId },
        });
    }
};