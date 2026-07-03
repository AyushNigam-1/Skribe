import User from '../../../models/User';
import Script from '../../../models/Script';
import Paragraph from '../../../models/Paragraph';

export const TEST_USER_ID = '60c72b2f9b1d8b001c8e4a01';
export const TEST_AUTHOR_ID = '60c72b2f9b1d8b001c8e4a02';
export const TEST_SCRIPT_ID = '60c72b2f9b1d8b001c8e4a03';
export const TEST_FAV_SCRIPT_ID = '60c72b2f9b1d8b001c8e4a04';
export const TEST_CONTRIB_ID = '60c72b2f9b1d8b001c8e4a05';

export const createJane = async () => {
    return User.create({
        _id: TEST_USER_ID,
        name: 'Jane Doe',
        username: 'janedoe99',
        email: 'jane@example.com',
        bio: 'Sci-Fi writer',
        languages: ['English'],
        favourites: [TEST_FAV_SCRIPT_ID],
        likes: [],
        followers: [],
        follows: [],
        views: [],
    });
};

export const createAlice = async () => {
    return User.create({
        _id: TEST_AUTHOR_ID,
        name: 'Alice Writer',
        username: 'alicewriter',
        email: 'alice@example.com',
        bio: 'Drama writer',
        languages: ['English'],
        favourites: [],
        likes: [],
        followers: [],
        follows: [],
        views: []
    });
};

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

        await createJane();

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
    }
};