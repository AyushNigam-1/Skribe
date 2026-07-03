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
import { provider } from './pactSetup';
import { MatchersV3 } from '@pact-foundation/pact';

const { string } = MatchersV3;

const TEST_USER_ID = '60c72b2f9b1d8b001c8e4a01';
const TEST_SCRIPT_ID = '60c72b2f9b1d8b001c8e4a03';
const TEST_PARAGRAPH_ID = '60c72b2f9b1d8b001c8e4a05';

describe('GraphQL Paragraph Contracts', () => {
    it('generates contracts for all Paragraph queries', async () => {

        // 1. GET_PARAGRAPH_BY_ID
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

        // 2. GET_FILTERED_REQUESTS
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

        // 3. GET_PENDING_PARAGRAPHS
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

        // 4. EXPORT_DOCUMENT_QUERY
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

        // EXECUTE
        await provider.executeTest(async (mockServer) => {
            const client = new ApolloClient({
                link: new HttpLink({ uri: mockServer.url + '/graphql', fetch: fetch as any }),
                cache: new InMemoryCache({ addTypename: false }),
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