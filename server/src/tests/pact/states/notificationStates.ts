import User from '../../../models/User';
import Notification from '../../../models/Notification';
import { TEST_USER_ID, TEST_AUTHOR_ID, createJane, createAlice } from './userStates';

export const TEST_NOTIFICATION_ID = '60c72b2f9b1d8b001c8e4a06';

export const notificationStateHandlers = {
    'user 60c72b2f9b1d8b001c8e4a01 has notifications': async () => {
        await User.deleteMany({});
        await Notification.deleteMany({});

        // Create both the receiver and the sender so GraphQL can populate it!
        await createJane();
        await createAlice();

        await Notification.create({
            _id: TEST_NOTIFICATION_ID,
            userId: TEST_USER_ID, // ⚠️ If your mongoose schema calls this 'recipient' or 'user', change it here!
            sender: TEST_AUTHOR_ID,
            type: 'comment',
            message: 'You have a new comment.',
            draftTitle: 'The Quantum Draft',
            link: '/scripts/60c72b2f9b1d8b001c8e4a03',
            isRead: false,
            createdAt: new Date(1704153600000)
        });

        return 'State Setup complete';
    }
};