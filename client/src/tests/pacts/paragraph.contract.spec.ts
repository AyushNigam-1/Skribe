import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client/core';
import fetch from 'node-fetch';
import { describe, it } from 'vitest';
import { print } from 'graphql';
import {
    GET_PARAGRAPH_BY_ID,
    GET_FILTERED_REQUESTS,
    GET_PENDING_PARAGRAPHS,
    EXPORT_DOCUMENT_QUERY
} from '../../graphql/query/paragraphQueries';
import {
    EDIT_PARAGRAPH,
    DELETE_PARAGRAPH,
    LIKE_PARAGRAPH,
    DISLIKE_PARAGRAPH,
    ADD_COMMENT
} from "../../graphql/mutation/paragraphMutations";
import { provider } from './pactSetup';
import { MatchersV3 } from '@pact-foundation/pact';

const { string, boolean, eachLike } = MatchersV3;

const MOCK_TOKEN = 'mock-jwt-token-string';
const TEST_USER_ID = '60c72b2f9b1d8b001c8e4a01';
const TEST_SCRIPT_ID = '60c72b2f9b1d8b001c8e4a03';
const TEST_PARAGRAPH_ID = '60c72b2f9b1d8b001c8e4a05';

describe('GraphQL Paragraph Contracts', () => {
    it('generates contracts for all Paragraph queries', async () => {

        
        provider
            .given(`a paragraph with ID ${TEST_PARAGRAPH_ID} exists`)
            .uponReceiving('a request for a specific paragraph')
            .withRequest({
                method: 'POST',
                path: '/graphql',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    operationName: 'GetParagraphById',
                    query: print(GET_PARAGRAPH_BY_ID),
                    variables: { paragraphId: TEST_PARAGRAPH_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        getParagraphById: {
                            id: TEST_PARAGRAPH_ID,
                            script: {
                                id: TEST_SCRIPT_ID,
                                author: { id: TEST_USER_ID },
                                collaborators: []
                            },
                            text: 'This is a brilliant paragraph added to scene 3.',
                            status: 'approved',
                            createdAt: "1704153600000",
                            likes: [],
                            dislikes: [],
                            author: { id: TEST_USER_ID, name: 'Jane Doe' },
                            comments: []
                        }
                    }
                },
            });

        
        provider
            .given(`script ${TEST_SCRIPT_ID} has pending paragraph requests`)
            .uponReceiving('a request for filtered paragraph requests')
            .withRequest({
                method: 'POST',
                path: '/graphql',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    operationName: 'GetFilteredRequests',
                    query: print(GET_FILTERED_REQUESTS),
                    variables: { scriptId: TEST_SCRIPT_ID, status: "pending" },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        getFilteredRequests: [{
                            id: TEST_PARAGRAPH_ID,
                            text: 'This is a brilliant paragraph added to scene 3.',
                            status: 'pending',
                            createdAt: "1704153600000",
                            author: { id: TEST_USER_ID, name: 'Jane Doe' },
                            likes: [],
                            dislikes: [],
                            comments: []
                        }]
                    }
                },
            });

        
        provider
            .given(`script ${TEST_SCRIPT_ID} has pending paragraph requests`)
            .uponReceiving('a request for pending paragraphs')
            .withRequest({
                method: 'POST',
                path: '/graphql',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    operationName: 'GetPendingParagraphs',
                    query: print(GET_PENDING_PARAGRAPHS),
                    variables: { scriptId: TEST_SCRIPT_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        getPendingParagraphs: [{
                            id: TEST_PARAGRAPH_ID,
                            text: 'This is a brilliant paragraph added to scene 3.',
                            createdAt: "1704153600000",
                            status: 'pending',
                            author: { name: 'Jane Doe' }
                        }]
                    }
                },
            });

        
        provider
            .given(`script ${TEST_SCRIPT_ID} is ready for export`)
            .uponReceiving('a request to export a script document')
            .withRequest({
                method: 'POST',
                path: '/graphql',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    operationName: 'ExportDocument',
                    query: print(EXPORT_DOCUMENT_QUERY),
                    variables: { scriptId: TEST_SCRIPT_ID, format: "pdf" },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        exportDocument: {
                            filename: string('The_Quantum_Draft.pdf'),
                            content: string('JVBERi0xLjQKJdPr6eEKMSAwIG9iai...'),
                            contentType: 'application/pdf'
                        }
                    }
                },
            });
        provider
            .given(`paragraph ${TEST_PARAGRAPH_ID} exists to be edited`)
            .uponReceiving('a request to edit a paragraph')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'EditParagraph',
                    query: print(EDIT_PARAGRAPH),
                    variables: { paragraphId: TEST_PARAGRAPH_ID, text: 'This is the edited paragraph text.' },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        editParagraph: {
                            id: string(TEST_PARAGRAPH_ID),
                            text: string('This is the edited paragraph text.'),
                            createdAt: string('1704153600000'),
                            author: {
                                id: string(TEST_USER_ID),
                                name: string('Jane Doe')
                            }
                        }
                    }
                },
            });

        
        provider
            .given(`paragraph ${TEST_PARAGRAPH_ID} exists to be deleted`)
            .uponReceiving('a request to delete a paragraph')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'DeleteParagraph',
                    query: print(DELETE_PARAGRAPH),
                    variables: { paragraphId: TEST_PARAGRAPH_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        deleteParagraph: {
                            status: boolean(true)
                        }
                    }
                },
            });

        
        provider
            .given(`paragraph ${TEST_PARAGRAPH_ID} exists to be liked`)
            .uponReceiving('a request to like a paragraph')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'LikeParagraph',
                    query: print(LIKE_PARAGRAPH),
                    variables: { paragraphId: TEST_PARAGRAPH_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        likeParagraph: {
                            status: boolean(true)
                        }
                    }
                },
            });

        
        provider
            .given(`paragraph ${TEST_PARAGRAPH_ID} exists to be disliked`)
            .uponReceiving('a request to dislike a paragraph')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'DislikeParagraph',
                    query: print(DISLIKE_PARAGRAPH),
                    variables: { paragraphId: TEST_PARAGRAPH_ID },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        dislikeParagraph: {
                            status: boolean(true)
                        }
                    }
                },
            });

        
        provider
            .given(`paragraph ${TEST_PARAGRAPH_ID} exists to receive a comment`)
            .uponReceiving('a request to add a comment to a paragraph')
            .withRequest({
                method: 'POST', path: '/graphql',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: {
                    operationName: 'AddComment',
                    query: print(ADD_COMMENT),
                    variables: { paragraphId: TEST_PARAGRAPH_ID, text: 'This is a great point!' },
                },
            })
            .willRespondWith({
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
                body: {
                    data: {
                        addComment: {
                            id: string(TEST_PARAGRAPH_ID),
                            comments: eachLike({
                                text: string('This is a great point!'),
                                createdAt: string('1704153600000'),
                                author: {
                                    id: string(TEST_USER_ID),
                                    name: string('Jane Doe')
                                }
                            })
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

            await client.mutate({
                mutation: gql(print(EDIT_PARAGRAPH)), variables: { paragraphId: TEST_PARAGRAPH_ID, text: 'This is the edited paragraph text.' }, context: authContext
            });

            await client.mutate({
                mutation: gql(print(DELETE_PARAGRAPH)), variables: { paragraphId: TEST_PARAGRAPH_ID }, context: authContext
            });

            await client.mutate({
                mutation: gql(print(LIKE_PARAGRAPH)), variables: { paragraphId: TEST_PARAGRAPH_ID }, context: authContext
            });

            await client.mutate({
                mutation: gql(print(DISLIKE_PARAGRAPH)), variables: { paragraphId: TEST_PARAGRAPH_ID }, context: authContext
            });


            await client.mutate({
                mutation: gql(print(ADD_COMMENT)), variables: { paragraphId: TEST_PARAGRAPH_ID, text: 'This is a great point!' }, context: authContext
            });

            await client.query({
                query: gql(print(GET_PARAGRAPH_BY_ID)),
                variables: { paragraphId: TEST_PARAGRAPH_ID }
            });

            await client.query({
                query: gql(print(GET_FILTERED_REQUESTS)),
                variables: { scriptId: TEST_SCRIPT_ID, status: "pending" }
            });

            await client.query({
                query: gql(print(GET_PENDING_PARAGRAPHS)),
                variables: { scriptId: TEST_SCRIPT_ID }
            });

            await client.query({
                query: gql(print(EXPORT_DOCUMENT_QUERY)),
                variables: { scriptId: TEST_SCRIPT_ID, format: "pdf" }
            });
        });
    });
});