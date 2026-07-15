import User from "../../../models/User";
import { TEST_AUTHOR_ID, TEST_FAV_SCRIPT_ID, TEST_USER_ID } from "./constants";

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