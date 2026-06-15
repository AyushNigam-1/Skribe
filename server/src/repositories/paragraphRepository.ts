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
    }
};