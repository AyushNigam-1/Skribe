import User from '../../../models/User';
import Script from '../../../models/Script';
import Paragraph from '../../../models/Paragraph';
import {
    createJane,
    createAlice,
} from '../utils/seedHelpers';
import {
    TEST_AUTHOR_ID, TEST_USER_ID,
    TEST_CONTRIB_ID, TEST_SCRIPT_ID,
    TEST_PARAGRAPH_ID,
} from "../utils/constants"


const createMockScript = async (customId = TEST_SCRIPT_ID, overrides = {}) => {
    return Script.create({
        _id: customId,
        title: 'The Quantum Draft',
        visibility: 'Public',
        description: 'A time travel story.',
        languages: ['English'],
        genres: ['Sci-Fi'],
        author: TEST_USER_ID, 
        likes: [],
        dislikes: [],
        collaborators: [],
        paragraphs: [],
        ...overrides
    });
};

export const scriptStateHandlers = {
    'script 60c72b2f9b1d8b001c8e4a03 has contributors': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await Paragraph.deleteMany({});

        
        await createJane();

        
        await Script.create({
            _id: TEST_SCRIPT_ID,
            title: 'The Quantum Draft',
            visibility: 'Public',
            description: 'A time travel story.',
            languages: ['English'],
            genres: ['Sci-Fi'],
            author: TEST_USER_ID,
            likes: [],
            dislikes: [],
            collaborators: [],
            paragraphs: [TEST_CONTRIB_ID],
            createdAt: new Date(1704067200000),
            updatedAt: new Date(1704000000000)
        });

        
        await Paragraph.create({
            _id: TEST_CONTRIB_ID,
            author: TEST_USER_ID,
            status: 'approved',
            text: 'This is a brilliant paragraph added to scene 3.',
            likes: [],
            dislikes: [],
            script: TEST_SCRIPT_ID,
            comments: [],
            createdAt: new Date(1704153600000),
            updatedAt: new Date(1704000000000)
        });

        return 'State Setup complete';
    },

    'scripts with genre Sci-Fi exist': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await Paragraph.deleteMany({});

        await createJane();

        await Script.create({
            _id: TEST_SCRIPT_ID,
            title: 'The Quantum Draft',
            visibility: 'Public',
            description: 'A time travel story.',
            languages: ['English'],
            genres: ['Sci-Fi'],
            author: TEST_USER_ID,
            likes: [],
            dislikes: [],
            createdAt: new Date(1704067200000),
            updatedAt: new Date(1704000000000)
        });

        return 'State Setup complete';
    },

    'a script with ID 60c72b2f9b1d8b001c8e4a03 exists': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await Paragraph.deleteMany({});

        await createJane();

        await Script.create({
            _id: TEST_SCRIPT_ID,
            title: 'The Quantum Draft',
            visibility: 'Public',
            description: 'A time travel story.',
            languages: ['English'],
            combinedText: "This is a brilliant paragraph added to scene 3.",
            genres: ['Sci-Fi'],
            author: TEST_USER_ID,
            likes: [], dislikes: [], collaborators: [],
            paragraphs: [TEST_CONTRIB_ID],
            createdAt: new Date(1704067200000),
            updatedAt: new Date(1704000000000)
        });

        await Paragraph.create({
            _id: TEST_CONTRIB_ID,
            author: TEST_USER_ID,
            status: 'approved',
            text: 'This is a brilliant paragraph added to scene 3.',
            likes: [], dislikes: [],
            script: TEST_SCRIPT_ID,
            comments: [],
            createdAt: new Date(1704153600000),
            updatedAt: new Date(1704000000000)
        });

        return 'State Setup complete';
    },

    'user 60c72b2f9b1d8b001c8e4a01 has contributions in script 60c72b2f9b1d8b001c8e4a03': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await Paragraph.deleteMany({});

        await createJane();

        await Script.create({
            _id: TEST_SCRIPT_ID,
            title: 'The Quantum Draft',
            visibility: 'Public',
            description: 'A time travel story.',
            languages: ['English'],
            genres: ['Sci-Fi'],
            author: TEST_USER_ID,
            likes: [], dislikes: [], collaborators: [],
            paragraphs: [TEST_CONTRIB_ID],
            createdAt: new Date(1704067200000),
            updatedAt: new Date(1704000000000)
        });

        await Paragraph.create({
            _id: TEST_CONTRIB_ID,
            author: TEST_USER_ID,
            status: 'approved',
            text: 'This is a brilliant paragraph added to scene 3.',
            likes: [], dislikes: [],
            script: TEST_SCRIPT_ID,
            comments: [],
            createdAt: new Date(1704153600000),
            updatedAt: new Date(1704000000000)
        });

        return 'State Setup complete';
    },
    'user is authenticated to create a script': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await createJane();
        return 'State Setup complete';
    },

    'script 60c72b2f9b1d8b001c8e4a03 exists for paragraph submission': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await createJane();
        await createMockScript();
        return 'State Setup complete';
    },

    'paragraph 60c72b2f9b1d8b001c8e4a05 exists to be approved': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await Paragraph.deleteMany({});
        await createJane();
        await createAlice();
        await createMockScript(TEST_SCRIPT_ID, { paragraphs: [TEST_PARAGRAPH_ID] });
        await Paragraph.create({
            _id: TEST_PARAGRAPH_ID,
            author: TEST_USER_ID,
            status: 'pending',
            text: 'A paragraph to approve.',
            script: TEST_SCRIPT_ID,
        });
        return 'State Setup complete';
    },

    'paragraph 60c72b2f9b1d8b001c8e4a05 exists to be rejected': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await Paragraph.deleteMany({});
        await createJane();
        await createMockScript(TEST_SCRIPT_ID, { paragraphs: [TEST_PARAGRAPH_ID] });
        await Paragraph.create({
            _id: TEST_PARAGRAPH_ID,
            author: TEST_USER_ID,
            status: 'pending',
            text: 'A paragraph to reject.',
            script: TEST_SCRIPT_ID,
        });
        return 'State Setup complete';
    },

    'script 60c72b2f9b1d8b001c8e4a03 exists to be bookmarked': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await createJane();
        await createMockScript();
        return 'State Setup complete';
    },

    'script 60c72b2f9b1d8b001c8e4a03 exists to be deleted': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await createJane();
        await createMockScript();
        return 'State Setup complete';
    },

    'script 60c72b2f9b1d8b001c8e4a03 exists to be liked': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await createJane();
        await createMockScript();
        return 'State Setup complete';
    },

    'script 60c72b2f9b1d8b001c8e4a03 exists to be disliked': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await createJane();
        await createMockScript();
        return 'State Setup complete';
    },

    'script 60c72b2f9b1d8b001c8e4a03 and target user alicewriter exist for collaboration': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await createJane();
        await createAlice(); 
        await createMockScript();
        return 'State Setup complete';
    },

    'script 60c72b2f9b1d8b001c8e4a03 has collaborator 60c72b2f9b1d8b001c8e4a02': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await createJane();
        await createAlice();
        await createMockScript(TEST_SCRIPT_ID, {
            collaborators: [{
                user: TEST_AUTHOR_ID, 
                role: 'EDITOR',
                status: 'ACCEPTED'
            }]
        });
        return 'State Setup complete';
    },

    'script 60c72b2f9b1d8b001c8e4a03 exists to be updated': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await createJane();
        await createMockScript();
        return 'State Setup complete';
    },

    'script 60c72b2f9b1d8b001c8e4a03 exists to clear paragraphs': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await Paragraph.deleteMany({});
        await createJane();
        await createMockScript(TEST_SCRIPT_ID, { paragraphs: [TEST_PARAGRAPH_ID] });
        await Paragraph.create({
            _id: TEST_PARAGRAPH_ID,
            author: TEST_USER_ID,
            status: 'approved',
            text: 'Existing paragraph',
            script: TEST_SCRIPT_ID,
        });
        return 'State Setup complete';
    },

    'script 60c72b2f9b1d8b001c8e4a03 exists to clear collaborators': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await createJane();
        await createAlice();
        await createMockScript(TEST_SCRIPT_ID, {
            collaborators: [{
                user: TEST_AUTHOR_ID,
                role: 'VIEWER',
                status: 'ACCEPTED'
            }]
        });
        return 'State Setup complete';
    }
};