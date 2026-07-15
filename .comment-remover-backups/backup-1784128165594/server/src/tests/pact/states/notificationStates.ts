import User from '../../../models/User';
import Notification from '../../../models/Notification';
import { createJane, createAlice } from '../utils/seedHelpers';
import { TEST_AUTHOR_ID, TEST_NOTIFICATION_ID, TEST_USER_ID } from '../utils/constants';


export const notificationStateHandlers = {
    'user 60c72b2f9b1d8b001c8e4a01 has notifications': async () => {
        await User.deleteMany({});
        await Notification.deleteMany({});

        // Create both the receiver and the sender so GraphQL can populate it!
        await createJane();
        await createAlice();

        await Notification.create({
            _id: TEST_NOTIFICATION_ID,
            recipient: TEST_USER_ID, // 👈 FIX 1: Must be 'recipient', not 'userId'!
            sender: TEST_AUTHOR_ID,
            type: 'COMMENT',         // 👈 FIX 2: Must be exact uppercase enum 'COMMENT'!
            message: 'You have a new comment.',
            draftTitle: 'The Quantum Draft',
            link: '/scripts/60c72b2f9b1d8b001c8e4a03',
            isRead: false,
            createdAt: new Date(1704153600000)
        });

        return 'State Setup complete';
    },
    'user 60c72b2f9b1d8b001c8e4a01 has unread notifications': async () => {
        await User.deleteMany({});
        await Notification.deleteMany({});

        await createJane();

        await Notification.create({
            _id: TEST_NOTIFICATION_ID,
            recipient: TEST_USER_ID, // 👈 Must be recipient!
            type: 'SYSTEM',          // 👈 Must be uppercase enum!
            message: 'You have a system alert.',
            isRead: false,
        });

        return 'State Setup complete';
    },

    'notification 60c72b2f9b1d8b001c8e4a06 exists to be deleted': async () => {
        await User.deleteMany({});
        await Notification.deleteMany({});

        await createJane();

        await Notification.create({
            _id: TEST_NOTIFICATION_ID,
            recipient: TEST_USER_ID,
            type: 'INFO',
            message: 'This notification will be deleted.',
            isRead: true,
        });

        return 'State Setup complete';
    }
};