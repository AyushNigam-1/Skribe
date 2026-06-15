import { Types } from "mongoose";
import Script from "../models/Script";

export const ScriptRepository = {
    findUserScripts: async (authorId: string, isOwner: boolean) => {
        const query: any = { author: authorId };

        if (!isOwner) {
            query.visibility = "Public";
        }

        return await Script.find(query).populate("author");
    },

    findAll: async () => {
        return await Script.find().populate("author");
    },

    findByIdWithDetails: async (id: string) => {
        return await Script.findById(id)
            .populate("author")
            .populate("collaborators.user")
            .populate({
                path: "paragraphs",
                populate: [{ path: "author" }, { path: "comments.author" }],
            });
    },

    findPublicScriptsByGenres: async (genres?: string[]) => {
        const filter: any = { visibility: "Public" };
        if (genres && genres.length) {
            filter.genres = { $in: genres };
        }
        return await Script.find(filter).populate("author");
    },
    findById: async (id: string) => {
        return await Script.findById(id);
    },

    create: async (data: any) => {
        return await Script.create(data);
    },

    deleteById: async (id: string) => {
        return await Script.findByIdAndDelete(id);
    },

    updateFields: async (id: string, updates: any) => {
        return await Script.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true }
        );
    },

    addLike: async (id: string, userId: string) => {
        return await Script.findByIdAndUpdate(id, {
            $addToSet: { likes: userId },
            $pull: { dislikes: userId },
        });
    },

    removeLike: async (id: string, userId: string) => {
        return await Script.findByIdAndUpdate(id, { $pull: { likes: userId } });
    },

    addDislike: async (id: string, userId: string) => {
        return await Script.findByIdAndUpdate(id, {
            $addToSet: { dislikes: userId },
            $pull: { likes: userId },
        });
    },

    removeDislike: async (id: string, userId: string) => {
        return await Script.findByIdAndUpdate(id, { $pull: { dislikes: userId } });
    },

    addPendingCollaborator: async (scriptId: string, userId: string, role: string) => {
        return await Script.findByIdAndUpdate(
            scriptId,
            {
                $push: {
                    collaborators: {
                        user: new Types.ObjectId(userId),
                        role: role,
                        status: "PENDING"
                    },
                },
            },
            { new: true }
        ).populate("author").populate("collaborators.user");
    },

    removeCollaborator: async (scriptId: string, userId: string) => {
        return await Script.findByIdAndUpdate(
            scriptId,
            { $pull: { collaborators: { user: userId } } },
            { new: true }
        ).populate("author").populate("collaborators.user");
    },

    removeAllCollaborators: async (scriptId: string) => {
        return await Script.findByIdAndUpdate(
            scriptId,
            { $set: { collaborators: [] } },
            { new: true }
        );
    },

    updateCollaboratorRole: async (scriptId: string, userId: string, role: string) => {
        return await Script.findOneAndUpdate(
            { _id: scriptId, "collaborators.user": userId },
            { $set: { "collaborators.$.role": role } },
            { new: true }
        ).populate("author").populate("collaborators.user");
    },

    acceptInvitation: async (scriptId: string, userId: string) => {
        return await Script.findOneAndUpdate(
            { _id: scriptId, "collaborators.user": userId, "collaborators.status": "PENDING" },
            { $set: { "collaborators.$.status": "ACCEPTED" } },
            { new: true }
        ).populate("author").populate("collaborators.user");
    },

    declineInvitation: async (scriptId: string, userId: string) => {
        return await Script.findByIdAndUpdate(
            scriptId,
            { $pull: { collaborators: { user: userId, status: "PENDING" } } },
            { new: true }
        ).populate("author").populate("collaborators.user");
    }
};