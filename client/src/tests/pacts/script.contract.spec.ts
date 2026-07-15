import fetch from 'node-fetch';
import { print } from 'graphql';
import { describe, it } from 'vitest';
import { provider } from './pactSetup';
import { MatchersV3 } from '@pact-foundation/pact';
import {
    GET_SCRIPT_BY_ID,
    GET_SCRIPTS_BY_GENRES,
    GET_SCRIPT_CONTRIBUTORS,
    GET_USER_CONTRIBUTIONS_BY_SCRIPT
} from '../../graphql/query/scriptQueries';

import {
    ADD_SCRIPT,
    SUBMIT_PARAGRAPH,
    APPROVE_PARAGRAPH,
    REJECT_PARAGRAPH,
    TOGGLE_BOOKMARK,
    DELETE_SCRIPT,
    LIKE_SCRIPT,
    DISLIKE_SCRIPT,
    ADD_COLLABORATOR,
    REMOVE_COLLABORATOR,
    UPDATE_COLLABORATOR_ROLE,
    UPDATE_SCRIPT,
    REMOVE_ALL_PARAGRAPHS,
    REMOVE_ALL_COLLABORATORS
} from '../../graphql/mutation/scriptMutations';
import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client/core';

const { string, boolean, eachLike } = MatchersV3;

const TEST_USER_ID = '60c72b2f9b1d8b001c8e4a01';
const TEST_TARGET_USER_ID = '60c72b2f9b1d8b001c8e4a02';
const TEST_SCRIPT_ID = '60c72b2f9b1d8b001c8e4a03';
const TEST_CONTRIB_ID = '60c72b2f9b1d8b001c8e4a05';
const MOCK_TOKEN = 'mock-jwt-token-string';

describe('GraphQL Script Contracts', () => {
    it('generates contracts for all Script domain interactions (Queries & Mutations)', async () => {

        provider
            .given(`a script with ID ${TEST_SCRIPT_ID} exists`)
            .uponReceiving('a request for a specific script')
            .withRequest({
                method: 'POST',
                path: '/graphql',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    operationName: 'GetScriptById',
                    query: print(GET_SCRIPT_BY_ID),
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

        
        provider
            .given('scripts with genre Sci-Fi exist')
            .uponReceiving('a request for scripts by genre')
            .withRequest({
                method: 'POST',
                path: '/graphql',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    operationName: 'GetScriptsByGenres',
                    query: print(GET_SCRIPTS_BY_GENRES),
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

        
        provider
            .given(`script ${TEST_SCRIPT_ID} has contributors`)
            .uponReceiving('a request for script contributors')
            .withRequest({
                method: 'POST',
                path: '/graphql',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    operationName: 'GetScriptContributors',
                    query: print(GET_SCRIPT_CONTRIBUTORS),
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

        
        provider
            .given(`user ${TEST_USER_ID} has contributions in script ${TEST_SCRIPT_ID}`)
            .uponReceiving('a request for specific user contributions in a script')
            .withRequest({
                method: 'POST',
                path: '/graphql',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    operationName: 'GetUserContributionsByScript',
                    query: print(GET_USER_CONTRIBUTIONS_BY_SCRIPT),
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

        
        
        

        
        provider
            .given('user is authenticated to create a script')
            .uponReceiving('a request to create a script')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'CreateScript',
                    query: print(ADD_SCRIPT),
                    variables: { title: 'New Script', visibility: 'Public', languages: ['English'], genres: ['Sci-Fi'], description: 'A brand new story' },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        createScript: {
                            id: string(TEST_SCRIPT_ID),
                            title: string('New Script'),
                            visibility: string('Public'),
                            languages: eachLike('English'),
                            genres: eachLike('Sci-Fi'),
                            description: string('A brand new story'),
                            author: { name: string('Jane Doe') }
                        }
                    }
                },
            });

        
        provider
            .given(`script ${TEST_SCRIPT_ID} exists for paragraph submission`)
            .uponReceiving('a request to submit a paragraph')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'SubmitParagraph',
                    query: print(SUBMIT_PARAGRAPH),
                    variables: { scriptId: TEST_SCRIPT_ID, text: 'This is a new paragraph.' },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        submitParagraph: {
                            id: string(TEST_CONTRIB_ID), 
                            status: string('PENDING'),
                            text: string('This is a new paragraph.'),
                            createdAt: string('1704153600000')
                        }
                    }
                },
            });

        
        provider
            .given(`paragraph ${TEST_CONTRIB_ID} exists to be approved`)
            .uponReceiving('a request to approve a paragraph')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'ApproveParagraph',
                    query: print(APPROVE_PARAGRAPH),
                    variables: { paragraphId: TEST_CONTRIB_ID }, 
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: { data: { approveParagraph: { status: boolean(true) } } },
            });

        
        provider
            .given(`paragraph ${TEST_CONTRIB_ID} exists to be rejected`)
            .uponReceiving('a request to reject a paragraph')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'RejectParagraph',
                    query: print(REJECT_PARAGRAPH),
                    variables: { paragraphId: TEST_CONTRIB_ID }, 
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: { data: { rejectParagraph: { status: boolean(true) } } },
            });

        
        provider
            .given(`script ${TEST_SCRIPT_ID} exists to be bookmarked`)
            .uponReceiving('a request to toggle a bookmark')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'ToggleBookmark',
                    query: print(TOGGLE_BOOKMARK),
                    variables: { scriptId: TEST_SCRIPT_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: { data: { markAsFavourite: { status: boolean(true) } } },
            });

        
        provider
            .given(`script ${TEST_SCRIPT_ID} exists to be deleted`)
            .uponReceiving('a request to delete a script')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'DeleteScript',
                    query: print(DELETE_SCRIPT),
                    variables: { scriptId: TEST_SCRIPT_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: { data: { deleteScript: { status: boolean(true) } } },
            });

        
        provider
            .given(`script ${TEST_SCRIPT_ID} exists to be liked`)
            .uponReceiving('a request to like a script')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'LikeScript',
                    query: print(LIKE_SCRIPT),
                    variables: { scriptId: TEST_SCRIPT_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: { data: { likeScript: { status: boolean(true) } } },
            });

        
        provider
            .given(`script ${TEST_SCRIPT_ID} exists to be disliked`)
            .uponReceiving('a request to dislike a script')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'DislikeScript',
                    query: print(DISLIKE_SCRIPT),
                    variables: { scriptId: TEST_SCRIPT_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: { data: { dislikeScript: { status: boolean(true) } } },
            });

        
        provider
            .given(`script ${TEST_SCRIPT_ID} and target user alicewriter exist for collaboration`)
            .uponReceiving('a request to add a collaborator')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'AddCollaborator',
                    query: print(ADD_COLLABORATOR),
                    variables: { scriptId: TEST_SCRIPT_ID, identifier: 'alicewriter', role: 'EDITOR' },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        addCollaborator: {
                            id: string(TEST_SCRIPT_ID),
                            collaborators: eachLike({
                                user: { id: string(TEST_TARGET_USER_ID), name: string('Alice Writer') },
                                role: string('EDITOR')
                            })
                        }
                    }
                },
            });

        
        provider
            .given(`script ${TEST_SCRIPT_ID} has collaborator ${TEST_TARGET_USER_ID}`)
            .uponReceiving('a request to remove a collaborator')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'RemoveCollaborator',
                    query: print(REMOVE_COLLABORATOR),
                    variables: { scriptId: TEST_SCRIPT_ID, targetUserId: TEST_TARGET_USER_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        removeCollaborator: {
                            id: string(TEST_SCRIPT_ID),
                            collaborators: []
                        }
                    }
                },
            });

        
        provider
            .given(`script ${TEST_SCRIPT_ID} has collaborator ${TEST_TARGET_USER_ID}`)
            .uponReceiving('a request to update a collaborator role')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'UpdateCollaboratorRole',
                    query: print(UPDATE_COLLABORATOR_ROLE),
                    variables: { scriptId: TEST_SCRIPT_ID, targetUserId: TEST_TARGET_USER_ID, role: 'VIEWER' },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        updateCollaboratorRole: {
                            id: string(TEST_SCRIPT_ID),
                            collaborators: eachLike({
                                user: { id: string(TEST_TARGET_USER_ID), name: string('Alice Writer') },
                                role: string('VIEWER')
                            })
                        }
                    }
                },
            });

        
        provider
            .given(`script ${TEST_SCRIPT_ID} exists to be updated`)
            .uponReceiving('a request to update script details')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'UpdateScript',
                    query: print(UPDATE_SCRIPT),
                    variables: { scriptId: TEST_SCRIPT_ID, title: 'Updated Title', description: 'Updated Desc', visibility: 'Private', genres: ['Drama'], languages: ['English'] },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        updateScript: {
                            id: string(TEST_SCRIPT_ID),
                            title: string('Updated Title'),
                            description: string('Updated Desc'),
                            visibility: string('Private'),
                            genres: eachLike('Drama'),
                            languages: eachLike('English')
                        }
                    }
                },
            });

        
        provider
            .given(`script ${TEST_SCRIPT_ID} exists to clear paragraphs`)
            .uponReceiving('a request to remove all paragraphs')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'RemoveAllParagraphs',
                    query: print(REMOVE_ALL_PARAGRAPHS),
                    variables: { scriptId: TEST_SCRIPT_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        removeAllParagraphs: {
                            id: string(TEST_SCRIPT_ID),
                            paragraphs: []
                        }
                    }
                },
            });

        
        provider
            .given(`script ${TEST_SCRIPT_ID} exists to clear collaborators`)
            .uponReceiving('a request to remove all collaborators')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'RemoveAllCollaborators',
                    query: print(REMOVE_ALL_COLLABORATORS),
                    variables: { scriptId: TEST_SCRIPT_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        removeAllCollaborators: {
                            id: string(TEST_SCRIPT_ID),
                            collaborators: []
                        }
                    }
                },
            });

        
        
        
        await provider.executeTest(async (mockServer) => {
            const client = new ApolloClient({
                link: new HttpLink({ uri: mockServer.url + '/graphql', fetch: fetch as any }),
                cache: new InMemoryCache({ addTypename: false }),
            });

            const authContext = { headers: { Authorization: `Bearer ${MOCK_TOKEN}` } };

            
            await client.query({ query: gql(print(GET_SCRIPT_BY_ID)), variables: { id: TEST_SCRIPT_ID } });
            await client.query({ query: gql(print(GET_SCRIPTS_BY_GENRES)), variables: { genres: ['Sci-Fi'] } });
            await client.query({ query: gql(print(GET_SCRIPT_CONTRIBUTORS)), variables: { scriptId: TEST_SCRIPT_ID } });
            await client.query({ query: gql(print(GET_USER_CONTRIBUTIONS_BY_SCRIPT)), variables: { userId: TEST_USER_ID, scriptId: TEST_SCRIPT_ID } });

            
            await client.mutate({ mutation: gql(print(ADD_SCRIPT)), variables: { title: 'New Script', visibility: 'Public', languages: ['English'], genres: ['Sci-Fi'], description: 'A brand new story' }, context: authContext });
            await client.mutate({ mutation: gql(print(SUBMIT_PARAGRAPH)), variables: { scriptId: TEST_SCRIPT_ID, text: 'This is a new paragraph.' }, context: authContext });
            await client.mutate({ mutation: gql(print(APPROVE_PARAGRAPH)), variables: { paragraphId: TEST_CONTRIB_ID }, context: authContext });
            await client.mutate({ mutation: gql(print(REJECT_PARAGRAPH)), variables: { paragraphId: TEST_CONTRIB_ID }, context: authContext });
            await client.mutate({ mutation: gql(print(TOGGLE_BOOKMARK)), variables: { scriptId: TEST_SCRIPT_ID }, context: authContext });
            await client.mutate({ mutation: gql(print(DELETE_SCRIPT)), variables: { scriptId: TEST_SCRIPT_ID }, context: authContext });
            await client.mutate({ mutation: gql(print(LIKE_SCRIPT)), variables: { scriptId: TEST_SCRIPT_ID }, context: authContext });
            await client.mutate({ mutation: gql(print(DISLIKE_SCRIPT)), variables: { scriptId: TEST_SCRIPT_ID }, context: authContext });
            await client.mutate({ mutation: gql(print(ADD_COLLABORATOR)), variables: { scriptId: TEST_SCRIPT_ID, identifier: 'alicewriter', role: 'EDITOR' }, context: authContext });
            await client.mutate({ mutation: gql(print(REMOVE_COLLABORATOR)), variables: { scriptId: TEST_SCRIPT_ID, targetUserId: TEST_TARGET_USER_ID }, context: authContext });
            await client.mutate({ mutation: gql(print(UPDATE_COLLABORATOR_ROLE)), variables: { scriptId: TEST_SCRIPT_ID, targetUserId: TEST_TARGET_USER_ID, role: 'VIEWER' }, context: authContext });
            await client.mutate({ mutation: gql(print(UPDATE_SCRIPT)), variables: { scriptId: TEST_SCRIPT_ID, title: 'Updated Title', description: 'Updated Desc', visibility: 'Private', genres: ['Drama'], languages: ['English'] }, context: authContext });
            await client.mutate({ mutation: gql(print(REMOVE_ALL_PARAGRAPHS)), variables: { scriptId: TEST_SCRIPT_ID }, context: authContext });
            await client.mutate({ mutation: gql(print(REMOVE_ALL_COLLABORATORS)), variables: { scriptId: TEST_SCRIPT_ID }, context: authContext });
        });
    });
});