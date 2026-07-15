import { NotificationRepository } from "../../../repositories/notificationRepository";

export const notificationQueries = {
    getNotifications: async (_: any, { userId }: { userId: string }, context: any) => {
        if (!userId) {
            console.log("⚠️ No user ID provided, aborting.");
            return [];
        }

        try {
            // 🚨 REPOSITORY CALL
            const notifications = await NotificationRepository.findUserNotifications(userId);

            if (!notifications) return [];

            return notifications.map((notif: any) => {
                const obj: any = notif.toObject({ virtuals: true });
                return {
                    ...obj,
                    id: obj.id || obj._id?.toString() || "unknown-id",
                    createdAt: obj.createdAt ? new Date(obj.createdAt).getTime().toString() : Date.now().toString(),
                };
            });
        } catch (error) {
            console.error("❌ CRITICAL RESOLVER ERROR:", error);
            return [];
        }
    },
};