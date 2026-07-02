import { PactV3 } from '@pact-foundation/pact';
import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client/core';
import fetch from 'node-fetch';
import { describe, it } from 'vitest';
import { print } from 'graphql';
import {
    GET_SCRIPT_BY_ID,
    GET_SCRIPTS_BY_GENRES,
    GET_SCRIPT_CONTRIBUTORS,
    GET_USER_CONTRIBUTIONS_BY_SCRIPT
} from '../../graphql/query/scriptQueries';

// Use valid Mongoose Object IDs
const TEST_USER_ID = '60c72b2f9b1d8b001c8e4a01';
const TEST_SCRIPT_ID = '60c72b2f9b1d8b001c8e4a03';
const TEST_CONTRIB_ID = '60c72b2f9b1d8b001c8e4a05';

const provider = new PactV3({
    consumer: 'ScriptDrafts-Frontend',
    provider: 'ScriptDrafts-GraphQL-API',
    dir: './tests/pact/contracts',
});

describe('GraphQL Script Contracts', () => {
    it('generates contracts for all Script queries', async () => {

        // 1. GET_SCRIPT_BY_ID
        provider
            .given(`a script with ID ${TEST_SCRIPT_ID} exists`)
            .uponReceiving('a request for a specific script')
            .withRequest({
                method: 'POST',
                path: '/graphql',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    operationName: 'GetScriptById',
                    query: print(GET_SCRIPT_BY_ID), // 👈 2. Format it perfectly for Pact
                    variables: { id: TEST_SCRIPT_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        getScriptById: {
                            id: TEST_SCRIPT_ID,
                            title: 'The Quantum Draft',
                            visibility: 'Public',
                            languages: ['English'],
                            genres: ['Sci-Fi'],
                            description: 'A time travel story.',
                            createdAt: "1704067200000",
                            combinedText: 'This is a brilliant paragraph added to scene 3.',
                            likes: [],
                            dislikes: [],
                            author: { id: TEST_USER_ID, name: 'Jane Doe' },
                            collaborators: [],
                            paragraphs: [{
                                id: TEST_CONTRIB_ID,
                                text: 'This is a brilliant paragraph added to scene 3.',
                                status: 'approved',
                                likes: [],
                                dislikes: [],
                                createdAt: "1704153600000",
                                author: { id: TEST_USER_ID, name: 'Jane Doe' },
                                comments: []
                            }]
                        }
                    }
                },
            });

        // 2. GET_SCRIPTS_BY_GENRES
        provider
            .given('scripts with genre Sci-Fi exist')
            .uponReceiving('a request for scripts by genre')
            .withRequest({
                method: 'POST',
                path: '/graphql',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    operationName: 'GetScriptsByGenres',
                    query: print(GET_SCRIPTS_BY_GENRES), // 👈 Format
                    variables: { genres: ['Sci-Fi'] },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        getScriptsByGenres: [{
                            id: TEST_SCRIPT_ID,
                            title: 'The Quantum Draft',
                            genres: ['Sci-Fi'],
                            description: 'A time travel story.',
                            likes: [],
                            languages: ['English'],
                            dislikes: [],
                            createdAt: "1704067200000",
                            author: { name: 'Jane Doe' }
                        }]
                    }
                },
            });

        // 3. GET_SCRIPT_CONTRIBUTORS
        provider
            .given(`script ${TEST_SCRIPT_ID} has contributors`)
            .uponReceiving('a request for script contributors')
            .withRequest({
                method: 'POST',
                path: '/graphql',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    operationName: 'GetScriptContributors',
                    query: print(GET_SCRIPT_CONTRIBUTORS), // 👈 Format
                    variables: { scriptId: TEST_SCRIPT_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        getScriptContributors: {
                            contributors: [{
                                userId: TEST_USER_ID,
                                details: {
                                    name: 'Jane Doe',
                                    paragraphs: [{
                                        id: TEST_CONTRIB_ID,
                                        text: 'This is a brilliant paragraph added to scene 3.',
                                        status: 'approved',
                                        createdAt: "1704153600000",
                                        likes: [],
                                        dislikes: [],
                                        author: { name: 'Jane Doe' },
                                        comments: []
                                    }]
                                }
                            }]
                        }
                    }
                },
            });

        // 4. GET_USER_CONTRIBUTIONS_BY_SCRIPT
        provider
            .given(`user ${TEST_USER_ID} has contributions in script ${TEST_SCRIPT_ID}`)
            .uponReceiving('a request for specific user contributions in a script')
            .withRequest({
                method: 'POST',
                path: '/graphql',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    operationName: 'GetUserContributionsByScript',
                    query: print(GET_USER_CONTRIBUTIONS_BY_SCRIPT), // 👈 Format
                    variables: { userId: TEST_USER_ID, scriptId: TEST_SCRIPT_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        getUserContributionsByScript: [{
                            id: TEST_CONTRIB_ID,
                            text: 'This is a brilliant paragraph added to scene 3.',
                            status: 'approved',
                            createdAt: "1704153600000",
                            likes: [],
                            dislikes: [],
                            script: { id: TEST_SCRIPT_ID, title: 'The Quantum Draft' },
                            author: { id: TEST_USER_ID, name: 'Jane Doe' },
                            comments: []
                        }]
                    }
                },
            });

        // EXECUTE
        await provider.executeTest(async (mockServer) => {
            const client = new ApolloClient({
                link: new HttpLink({ uri: mockServer.url + '/graphql', fetch: fetch as any }),
                cache: new InMemoryCache({ addTypename: false }),
            });

            // 3. 👇 Force Apollo to send the EXACT string that Pact is looking for!
            await client.query({ query: gql(print(GET_SCRIPT_BY_ID)), variables: { id: TEST_SCRIPT_ID } });
            await client.query({ query: gql(print(GET_SCRIPTS_BY_GENRES)), variables: { genres: ['Sci-Fi'] } });
            await client.query({ query: gql(print(GET_SCRIPT_CONTRIBUTORS)), variables: { scriptId: TEST_SCRIPT_ID } });
            await client.query({ query: gql(print(GET_USER_CONTRIBUTIONS_BY_SCRIPT)), variables: { userId: TEST_USER_ID, scriptId: TEST_SCRIPT_ID } });
        });
    });
});