import User from '../../../models/User';
import Script from '../../../models/Script';
import Paragraph from '../../../models/Paragraph';
import { TEST_AUTHOR_ID, TEST_CONTRIB_ID, TEST_FAV_SCRIPT_ID, TEST_PROFILE_ID, TEST_SCRIPT_ID, TEST_USER_ID } from '../utils/constants';
import { createAlice, createJane } from '../utils/seedHelpers';

export const userStateHandlers = {
    'a user with ID 60c72b2f9b1d8b001c8e4a01 exists': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await Paragraph.deleteMany({});

        await createJane();
        await createAlice()

        return 'State Setup complete';
    },

    '60c72b2f9b1d8b001c8e4a01 has authored scripts': async () => {
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
            createdAt: new Date(1704067200000),
            updatedAt: new Date(1704153600000)
        });

        return 'State Setup complete';
    },

    'users matching "jane" exist': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await Paragraph.deleteMany({});

        await createAlice();
        await createJane()

        return 'State Setup complete';
    },

    '60c72b2f9b1d8b001c8e4a01 has contributions': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await Paragraph.deleteMany({});

        await createJane();
        await createAlice();

        await Script.create({
            _id: TEST_SCRIPT_ID,
            title: 'The Quantum Draft',
            visibility: 'Public',
            description: 'A time travel story.',
            languages: ['English'],
            genres: ['Sci-Fi'],
            author: TEST_USER_ID,
            createdAt: new Date(1704067200000),
            updatedAt: new Date(1704153600000)
        });

        await Paragraph.create({
            _id: TEST_CONTRIB_ID,
            author: TEST_USER_ID,
            status: 'approved',
            text: 'This is a brilliant paragraph added to scene 3.',
            likes: [TEST_AUTHOR_ID],
            dislikes: [],
            script: TEST_SCRIPT_ID,
            comments: [{
                author: TEST_AUTHOR_ID,
                text: 'Great addition!',
                createdAt: new Date(1704153700000)
            }],
            createdAt: new Date(1704153600000)
        });

        return 'State Setup complete';
    },

    '60c72b2f9b1d8b001c8e4a01 has favourite scripts': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});
        await Paragraph.deleteMany({});

        await createJane();
        await createAlice();

        await Script.create({
            _id: TEST_FAV_SCRIPT_ID,
            title: 'A Masterpiece',
            visibility: 'Public',
            description: 'An inspiring tale.',
            languages: ['English'],
            genres: ['Drama'],
            author: TEST_AUTHOR_ID,
            createdAt: new Date(1703000000000),
            updatedAt: new Date(1704000000000)
        });

        return 'State Setup complete';
    },
    'user 60c72b2f9b1d8b001c8e4a01 is authenticated': async () => {
        await User.deleteMany({});
        await createJane();
        return 'State Setup complete';
    },

    'user profile 60c72b2f9b1d8b001c8e4a02 exists to be liked': async () => {
        await User.deleteMany({});

        await createJane();
        await User.create({
            _id: TEST_PROFILE_ID,
            name: 'Target Profile',
            email: 'target@example.com',
            likes: [],
            views: []
        });
        return 'State Setup complete';
    },

    'user profile 60c72b2f9b1d8b001c8e4a02 exists to be viewed': async () => {
        await User.deleteMany({});

        await createJane();
        await User.create({
            _id: TEST_PROFILE_ID,
            name: 'Target Profile',
            email: 'target@example.com',
            likes: [],
            views: [] // Controller pushes to this array
        });
        return 'State Setup complete';
    },

    'user has a pending invitation for script 60c72b2f9b1d8b001c8e4a03': async () => {
        await User.deleteMany({});
        await Script.deleteMany({});

        await createJane();
        await createAlice();

        await Script.create({
            _id: TEST_SCRIPT_ID,
            title: 'The Quantum Draft',
            visibility: 'Public',
            author: TEST_AUTHOR_ID,
            description: 'A script for testing invitations.',
            languages: ['English'],
            genres: ['Sci-Fi'],
            collaborators: [
                {
                    user: TEST_USER_ID,
                    role: 'EDITOR',
                    status: 'PENDING'
                }
            ],
        });
        return 'State Setup complete';
    }
};