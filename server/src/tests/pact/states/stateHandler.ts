import { userStateHandlers } from './userStates';
import { scriptStateHandlers } from './scriptStates';
import { paragraphStateHandlers } from './paragraphStates';
import { notificationStateHandlers } from './notificationStates';

export const pactStateHandlers = {
    ...userStateHandlers,
    ...scriptStateHandlers,
    ...paragraphStateHandlers,
    ...notificationStateHandlers
};