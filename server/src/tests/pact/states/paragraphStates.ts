import User from '../../../models/User';
import Script from '../../../models/Script';
import Paragraph from '../../../models/Paragraph';
import {
    TEST_USER_ID,
    TEST_SCRIPT_ID,
    TEST_CONTRIB_ID,
    createJane
} from './userStates';

export const paragraphStateHandlers = {
    'a paragraph with ID 60c72b2f9b1d8b001c8e4a05 exists': async () => {
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
            updatedAt: new Date(1704153600000)
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
            updatedAt: new Date(1704153600000)
        });

        return 'State Setup complete';
    },

    'script 60c72b2f9b1d8b001c8e4a03 has pending paragraph requests': async () => {
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
            updatedAt: new Date(1704153600000)
        });

        await Paragraph.create({
            _id: TEST_CONTRIB_ID,
            author: TEST_USER_ID,
            status: 'pending',
            text: 'This is a brilliant paragraph added to scene 3.',
            likes: [], dislikes: [],
            script: TEST_SCRIPT_ID,
            comments: [],
            createdAt: new Date(1704153600000),
            updatedAt: new Date(1704153600000)
        });

        return 'State Setup complete';
    },

    'script 60c72b2f9b1d8b001c8e4a03 is ready for export': async () => {
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
            updatedAt: new Date(1704153600000)
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
            updatedAt: new Date(1704153600000)
        });

        return 'State Setup complete';
    }
};