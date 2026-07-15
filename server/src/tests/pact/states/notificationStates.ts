import User from '../../../models/User';
import Notification from '../../../models/Notification';
import { createJane, createAlice } from '../utils/seedHelpers';
import { TEST_AUTHOR_ID, TEST_NOTIFICATION_ID, TEST_USER_ID } from '../utils/constants';


export const notificationStateHandlers = {
    'user 60c72b2f9b1d8b001c8e4a01 has notifications': async () => {
        await User.deleteMany({});
        await Notification.deleteMany({});

        
        await createJane();
        await createAlice();

        await Notification.create({
            _id: TEST_NOTIFICATION_ID,
            recipient: TEST_USER_ID, 
            sender: TEST_AUTHOR_ID,
            type: 'COMMENT',         
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
            recipient: TEST_USER_ID, 
            type: 'SYSTEM',          
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