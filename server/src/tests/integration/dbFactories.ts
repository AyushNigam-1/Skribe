// src/tests/helpers/dbFactories.ts
import mongoose from "mongoose";
import User from "../../models/User";
import Script from "../../models/Script";
import Paragraph from "../../models/Paragraph";
import Notification from "../../models/Notification";

/**
 * Creates a valid User document with dummy defaults.
 * @param overrides Any specific fields you want to force (e.g., { email: "specific@test.com" })
 */
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

/**
 * Creates a valid Script document linked to an author.
 */
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

/**
 * Creates a valid Paragraph document linked to a script and author.
 */
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

// Inside dbFactories.ts
export const createTestNotification = async (
    userId: string | mongoose.Types.ObjectId,
    overrides: Partial<any> = {}
) => {
    const defaultNotification = {
        recipient: userId, // 🚨 Changed from 'user' to 'recipient' to match your schema
        type: "REQUEST",    // 🚨 Update this string to whatever a valid enum is in your schema (e.g., "LIKE", "COMMENT", "ALERT")
        message: "You have a new notification!",
        isRead: false,
    };

    return await Notification.create({ ...defaultNotification, ...overrides });
};