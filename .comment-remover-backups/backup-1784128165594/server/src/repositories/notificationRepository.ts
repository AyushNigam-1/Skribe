import Notification from "../models/Notification";

export const NotificationRepository = {
    findUserNotifications: async (userId: string) => {
        return await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .populate("sender", "id name");
    },

    markAllAsRead: async (userId: string) => {
        return await Notification.updateMany(
            { recipient: userId, isRead: false },
            { $set: { isRead: true } }
        );
    },

    deleteByIdAndRecipient: async (id: string, userId: string) => {
        return await Notification.findOneAndDelete({
            _id: id,
            recipient: userId
        });
    }
};