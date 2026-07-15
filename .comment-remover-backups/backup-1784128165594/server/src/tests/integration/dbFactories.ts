import mongoose from "mongoose";
import User from "../../models/User";
import Script from "../../models/Script";
import Paragraph from "../../models/Paragraph";
import Notification from "../../models/Notification";


export const createTestUser = async (overrides: Partial<any> = {}) => {
    const uniqueId = new mongoose.Types.ObjectId().toString();

    const defaultUser = {
        name: "Dummy Tester",
        email: `dummy_${uniqueId}@test.com`,
        username: `dummy_${uniqueId}`,
        bio: "I am a test dummy",
        location: "Test City",
        languages: ["English"],
        scripts: [],
        likes: [],
        follows: [],
        followers: [],
        favourites: [],
    };

    return await User.create({ ...defaultUser, ...overrides });
};

export const createTestScript = async (authorId: string | mongoose.Types.ObjectId, overrides: Partial<any> = {}) => {
    const defaultScript = {
        author: authorId,
        title: "Dummy Script Title",
        visibility: "public",
        description: "This is a dummy script description used for integration testing.",
        languages: ["English"],
        genres: ["Action"],
        paragraphs: [],
        likes: [],
        dislikes: [],
        collaborators: [],
        combinedText: "",
    };

    return await Script.create({ ...defaultScript, ...overrides });
};


export const createTestParagraph = async (
    scriptId: string | mongoose.Types.ObjectId,
    authorId: string | mongoose.Types.ObjectId,
    overrides: Partial<any> = {}
) => {
    const defaultParagraph = {
        script: scriptId,
        author: authorId,
        text: "This is a dummy paragraph generated for testing.",
        status: "approved",
        likes: [],
        dislikes: [],
        comments: [],
    };

    return await Paragraph.create({ ...defaultParagraph, ...overrides });
};

export const createTestNotification = async (
    userId: string | mongoose.Types.ObjectId,
    overrides: Partial<any> = {}
) => {
    const defaultNotification = {
        recipient: userId,
        type: "REQUEST",
        message: "You have a new notification!",
        isRead: false,
    };

    return await Notification.create({ ...defaultNotification, ...overrides });
};