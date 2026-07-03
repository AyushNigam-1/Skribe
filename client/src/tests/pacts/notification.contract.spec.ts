import fetch from 'node-fetch';
import { print } from 'graphql';
import { describe, it } from 'vitest';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { GET_NOTIFICATIONS } from '../../graphql/query/notificationQueries';
import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client/core';

const { string, boolean } = MatchersV3;

const TEST_USER_ID = '60c72b2f9b1d8b001c8e4a01';
const TEST_AUTHOR_ID = '60c72b2f9b1d8b001c8e4a02'; // Added for the sender!
const TEST_NOTIFICATION_ID = '60c72b2f9b1d8b001c8e4a06';

const provider = new PactV3({
    consumer: 'ScriptDrafts-Frontend',
    provider: 'ScriptDrafts-GraphQL-API',
    dir: './tests/pact/contracts',
});

describe('GraphQL Notification Contracts', () => {
    it('generates contracts for Notification queries', async () => {

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

        // EXECUTE
        await provider.executeTest(async (mockServer) => {
            const client = new ApolloClient({
                link: new HttpLink({ uri: mockServer.url + '/graphql', fetch: fetch as any }),
                cache: new InMemoryCache({ addTypename: false }),
            });

            await client.query({
                query: gql(print(GET_NOTIFICATIONS)),
                variables: { userId: TEST_USER_ID }
            });
        });
    });
});