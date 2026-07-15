import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RedisMemoryServer } from 'redis-memory-server';
import mongoose from 'mongoose';
import { redisClient } from '../../database/redis';

vi.mock('../utils/socket', () => ({
    initSocket: vi.fn()
}));

describe('Notifications & Inbox API', () => {
    let mongoServer: MongoMemoryServer;
    let redisServer: RedisMemoryServer;
    let app: any;

    let targetUserCookie: string[];
    let targetUserId: string;
    let senderUserId: string;

    let notificationId: string;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        redisServer = await RedisMemoryServer.create();
        process.env.MONGO_URI = mongoServer.getUri();

        const redisHost = await redisServer.getHost();
        const redisPort = await redisServer.getPort();
        process.env.REDIS_URI = `redis://${redisHost}:${redisPort}`;

        const main = await import('../../main');
        app = main.app;
        await main.initServer();

        // 1. Create the Target User (The person receiving the notifications)
        const targetRes = await request(app).post('/api/auth/sign-up/email').send({
            email: 'inbox_owner@example.com', password: 'securepassword123', name: 'Inbox Owner', username: 'inbox_1'
        });
        targetUserId = targetRes.body.user.id;
        const rawCookies = targetRes.headers['set-cookie'];
        targetUserCookie = rawCookies ? (Array.isArray(rawCookies) ? rawCookies : [rawCookies]) : [];

        // 2. Create a Sender User (The person who triggered the notification)
        const senderRes = await request(app).post('/api/auth/sign-up/email').send({
            email: 'notifier@example.com', password: 'securepassword123', name: 'Friendly User', username: 'notifier_1'
        });
        senderUserId = senderRes.body.user.id;

        // 3. DIRECT DB SEEDING: Inject a mock notification directly into MongoDB
        // We look up the model dynamically so we don't have to guess your exact file path
        const Notification = mongoose.model('Notification');
        const newNotif = await Notification.create({
            recipient: targetUserId,
            sender: senderUserId,
            type: 'LIKE',
            message: 'Friendly User liked your profile!',
            isRead: false
        });

        notificationId = newNotif._id.toString();

    }, 60000);

    afterAll(async () => {
        await mongoose.disconnect();
        if (redisClient.isOpen) await redisClient.disconnect();
        if (mongoServer) await mongoServer.stop();
        if (redisServer) await redisServer.stop();
    });

    it('should fetch the user\'s notifications', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', targetUserCookie) // 🚨 Queried by the Inbox Owner
            .send({
                query: `
                    query {
                        getNotifications(userId: "${targetUserId}") {
                            id
                            message
                            isRead
                            sender {
                                name
                            }
                        }
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        const notifications = response.body.data.getNotifications;
        expect(Array.isArray(notifications)).toBe(true);
        expect(notifications.length).toBe(1);
        expect(notifications[0].message).toBe('Friendly User liked your profile!');
        expect(notifications[0].isRead).toBe(false);
        expect(notifications[0].sender.name).toBe('Friendly User');
    });

    it('should allow the user to mark all notifications as read', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', targetUserCookie)
            .send({
                query: `
                    mutation {
                        markAllNotificationsRead
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.markAllNotificationsRead).toBe(true);

        // 🚨 Verify in the database via query that it actually flipped to true
        const verifyRes = await request(app).post('/graphql').set('Cookie', targetUserCookie).send({
            query: `query { getNotifications(userId: "${targetUserId}") { isRead } }`
        });
        expect(verifyRes.body.data.getNotifications[0].isRead).toBe(true);
    });

    it('should allow the user to delete a specific notification', async () => {
        const response = await request(app)
            .post('/graphql')
            .set('Cookie', targetUserCookie)
            .send({
                query: `
                    mutation {
                        deleteNotification(id: "${notificationId}")
                    }
                `
            });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.deleteNotification).toBe(true);

        // 🚨 Verify the inbox is now empty
        const verifyRes = await request(app).post('/graphql').set('Cookie', targetUserCookie).send({
            query: `query { getNotifications(userId: "${targetUserId}") { id } }`
        });
        expect(verifyRes.body.data.getNotifications.length).toBe(0);
    });
});