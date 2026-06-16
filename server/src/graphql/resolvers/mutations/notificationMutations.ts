import { NotificationRepository } from "../../../repositories/notificationRepository";

export const notificationMutations = {
    markAllNotificationsRead: async (_: any, __: any, context: any) => {
        const userId = context.user?.id;
        if (!userId) return false;

        await NotificationRepository.markAllAsRead(userId);
        return true;
    },

    deleteNotification: async (_: any, { id }: { id: string }, context: any) => {
        const userId = context.user?.id;
        if (!userId) return false;

        const result = await NotificationRepository.deleteByIdAndRecipient(id, userId);
        return !!result;
    }
};