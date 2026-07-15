import Paragraph from "../models/Paragraph";

export const ParagraphRepository = {
    findContributionsByAuthor: async (authorId: string) => {
        return await Paragraph.find({ author: authorId })
            .populate("script")
            .populate("comments.author")
            .sort({ createdAt: -1 });
    },
    findApprovedByScript: async (scriptId: string) => {
        return await Paragraph.find({
            script: scriptId,
            status: "approved",
        }).populate("author");
    },

    findByAuthorAndScript: async (userId: string, scriptId: string) => {
        return await Paragraph.find({
            author: userId,
            script: scriptId
        })
            .populate("author")
            .populate("script")
            .populate("comments.author")
            .sort({ createdAt: -1 });
    },
    createPending: async (scriptId: string, userId: string, text: string) => {
        return await Paragraph.create({
            script: scriptId,
            author: userId,
            text,
            status: "pending",
        });
    },

    deleteManyByScriptId: async (scriptId: string) => {
        return await Paragraph.deleteMany({ script: scriptId });
    },
    findByIdWithPopulate: async (id: string) => {
        return await Paragraph.findById(id)
            .populate("author")
            .populate("comments.author")
            .populate({
                path: "script",
                populate: [{ path: "collaborators.user" }, { path: "author" }],
            });
    },

    findFilteredRequests: async (scriptId: string, userId?: string, status?: string) => {
        const query: any = { script: scriptId };
        if (userId) query.author = userId;
        if (status) query.status = status;

        return await Paragraph.find(query)
            .populate("author")
            .populate("comments.author")
            .sort({ createdAt: -1 })
            .lean();
    },

    findPendingByScript: async (scriptId: string) => {
        return await Paragraph.find({
            script: scriptId,
            status: "pending",
        })
            .populate("author")
            .sort({ createdAt: -1 })
            .lean();
    },

    updateStatus: async (id: string, status: string) => {
        return await Paragraph.findByIdAndUpdate(id, { status }, { new: true }).populate("script");
    },

    findByIdWithScript: async (id: string) => {
        return await Paragraph.findById(id).populate("script");
    },

    updateText: async (id: string, text: string) => {
        return await Paragraph.findByIdAndUpdate(id, { text }, { new: true }).populate("author");
    },

    deleteById: async (id: string) => {
        return await Paragraph.findByIdAndDelete(id);
    },

    addLike: async (id: string, userId: string) => {
        return await Paragraph.findByIdAndUpdate(id, {
            $addToSet: { likes: userId },
            $pull: { dislikes: userId },
        });
    },

    removeLike: async (id: string, userId: string) => {
        return await Paragraph.findByIdAndUpdate(id, { $pull: { likes: userId } });
    },

    addDislike: async (id: string, userId: string) => {
        return await Paragraph.findByIdAndUpdate(id, {
            $addToSet: { dislikes: userId },
            $pull: { likes: userId },
        });
    },

    removeDislike: async (id: string, userId: string) => {
        return await Paragraph.findByIdAndUpdate(id, { $pull: { dislikes: userId } });
    },

    addComment: async (id: string, userId: string, text: string) => {
        return await Paragraph.findByIdAndUpdate(
            id,
            { $push: { comments: { author: userId, text } } },
            { new: true }
        )
            .populate("comments.author")
            .populate("script");
    }
};