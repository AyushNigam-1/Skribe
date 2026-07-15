import User from '../../../models/User';
import Script from '../../../models/Script';
import Paragraph from '../../../models/Paragraph';
import {
    createJane
} from '../utils/seedHelpers';
import {
    TEST_USER_ID,
    TEST_SCRIPT_ID,
    TEST_CONTRIB_ID,
    TEST_PARAGRAPH_ID,
} from "../utils/constants"

const setupBaseEntities = async () => {
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
        collaborators: [],
    });
};


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
    },
    'paragraph 60c72b2f9b1d8b001c8e4a05 exists to be edited': async () => {
        await setupBaseEntities();
        await Paragraph.create({
            _id: TEST_PARAGRAPH_ID,
            author: TEST_USER_ID, // Jane owns it, so she can edit it!
            status: 'approved',
            text: 'Original text.',
            script: TEST_SCRIPT_ID,
        });
        return 'State Setup complete';
    },

    'paragraph 60c72b2f9b1d8b001c8e4a05 exists to be deleted': async () => {
        await setupBaseEntities();
        await Paragraph.create({
            _id: TEST_PARAGRAPH_ID,
            author: TEST_USER_ID, // Jane owns it, so she can delete it!
            status: 'approved',
            text: 'Original text.',
            script: TEST_SCRIPT_ID,
        });
        return 'State Setup complete';
    },

    'paragraph 60c72b2f9b1d8b001c8e4a05 exists to be liked': async () => {
        await setupBaseEntities();
        await Paragraph.create({
            _id: TEST_PARAGRAPH_ID,
            author: TEST_USER_ID,
            status: 'approved',
            text: 'Original text.',
            script: TEST_SCRIPT_ID,
            likes: [], // Controller pushes to this array
        });
        return 'State Setup complete';
    },

    'paragraph 60c72b2f9b1d8b001c8e4a05 exists to be disliked': async () => {
        await setupBaseEntities();
        await Paragraph.create({
            _id: TEST_PARAGRAPH_ID,
            author: TEST_USER_ID,
            status: 'approved',
            text: 'Original text.',
            script: TEST_SCRIPT_ID,
            dislikes: [], // Controller pushes to this array
        });
        return 'State Setup complete';
    },

    'paragraph 60c72b2f9b1d8b001c8e4a05 exists to receive a comment': async () => {
        await setupBaseEntities();
        await Paragraph.create({
            _id: TEST_PARAGRAPH_ID,
            author: TEST_USER_ID,
            status: 'approved',
            text: 'Original text.',
            script: TEST_SCRIPT_ID,
            comments: [], // Controller pushes the comment object here
        });
        return 'State Setup complete';
    }
};