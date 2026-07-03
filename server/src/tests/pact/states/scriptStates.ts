import User from '../../../models/User';
import Script from '../../../models/Script';
import Paragraph from '../../../models/Paragraph';
import {
    TEST_USER_ID,
    TEST_SCRIPT_ID,
    TEST_CONTRIB_ID,
    createJane
} from './userStates';

export const scriptStateHandlers = {
    'script 60c72b2f9b1d8b001c8e4a03 has contributors': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await Paragraph.deleteMany({});

        // 1. Create the author/contributor
        await createJane();

        // 2. Create the Script
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

        // 3. Create the Approved Paragraph (Contribution)
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
    }
};