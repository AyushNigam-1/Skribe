import fetch from 'node-fetch';
import { print } from 'graphql';
import { describe, it } from 'vitest';
import { provider } from './pactSetup';
import { MatchersV3 } from '@pact-foundation/pact';
import { GET_NOTIFICATIONS } from '../../graphql/query/notificationQueries';
import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client/core';
import { MARK_ALL_READ, DELETE_NOTIFICATION } from '../../graphql/mutation/notificationMutations';

const { string, boolean } = MatchersV3;

const TEST_USER_ID = '60c72b2f9b1d8b001c8e4a01';
const TEST_AUTHOR_ID = '60c72b2f9b1d8b001c8e4a02';
const TEST_NOTIFICATION_ID = '60c72b2f9b1d8b001c8e4a06';
const MOCK_TOKEN = 'mock-jwt-token-string';

describe('GraphQL Notification Contracts', () => {
    it('generates contracts for all Notification interactions (Queries & Mutations)', async () => {

        provider
            .given(`user ${TEST_USER_ID} has notifications`)
            .uponReceiving('a request for user notifications')
            .withRequest({
                method: 'POST',
                path: '/graphql',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    operationName: 'GetNotifications',
                    query: print(GET_NOTIFICATIONS),
                    variables: { userId: TEST_USER_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        getNotifications: [
                            {
                                id: string(TEST_NOTIFICATION_ID),
                                type: string('comment'),
                                message: string('You have a new comment.'),
                                draftTitle: string('The Quantum Draft'),
                                link: string('/scripts/60c72b2f9b1d8b001c8e4a03'),
                                isRead: boolean(false),
                                createdAt: string('1704153600000'),
                                sender: {
                                    id: string(TEST_AUTHOR_ID),
                                    name: string('Alice Writer')
                                }
                            }
                        ]
                    }
                },
            });

        provider
            .given(`user ${TEST_USER_ID} has unread notifications`)
            .uponReceiving('a request to mark all notifications as read')
            .withRequest({
                method: 'POST',
                path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'MarkAllNotificationsRead',
                    query: print(MARK_ALL_READ),
                    variables: {},
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        markAllNotificationsRead: boolean(true)
                    }
                },
            });

        provider
            .given(`notification ${TEST_NOTIFICATION_ID} exists to be deleted`)
            .uponReceiving('a request to delete a notification')
            .withRequest({
                method: 'POST',
                path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'DeleteNotification',
                    query: print(DELETE_NOTIFICATION),
                    variables: { id: TEST_NOTIFICATION_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        deleteNotification: boolean(true)
                    }
                },
            });

        await provider.executeTest(async (mockServer) => {
            const client = new ApolloClient({
                link: new HttpLink({ uri: mockServer.url + '/graphql', fetch: fetch as any }),
                cache: new InMemoryCache({ addTypename: false }),
            });

            const authContext = { headers: { Authorization: `Bearer ${MOCK_TOKEN}` } };

            // Execute Query
            await client.query({
                query: gql(print(GET_NOTIFICATIONS)),
                variables: { userId: TEST_USER_ID }
            });

            // Execute Mutations
            await client.mutate({
                mutation: gql(print(MARK_ALL_READ)),
                context: authContext
            });

            await client.mutate({
                mutation: gql(print(DELETE_NOTIFICATION)),
                variables: { id: TEST_NOTIFICATION_ID },
                context: authContext
            });
        });
    });
});