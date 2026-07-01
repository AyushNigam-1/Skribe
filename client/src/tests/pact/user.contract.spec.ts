import { describe, it, expect, beforeAll } from "vitest";
import { PactV3, MatchersV3 } from "@pact-foundation/pact";
import { ApolloClient, InMemoryCache, HttpLink, gql } from "@apollo/client";
import fetch from "cross-fetch";
import path from "path";

import {
    GET_USER_PROFILE,
    GET_USER_SCRIPTS,
    GET_USER_CONTRIBUTIONS,
    GET_USER_FAVOURITES,
    SEARCH_USERS,
} from "../../graphql/query/userQueries";

const { string, integer, eachLike, like } = MatchersV3;

const provider = new PactV3({
    consumer: "ScriptDrafts-Frontend",
    provider: "ScriptDrafts-GraphQL-API",
    dir: path.resolve(process.cwd(), "tests/pact/contracts"),
});

describe("GraphQL User Contracts", () => {
    it("generates contracts for all User queries", async () => {
        await provider.addInteraction({
            states: [{ description: "a user with ID user-123 exists" }],
            uponReceiving: "a request for a user profile",
            withRequest: {
                method: "POST",
                path: "/graphql",
                headers: { "Content-Type": "application/json" },
                body: {
                    operationName: "GetUserProfile",
                    query: GET_USER_PROFILE.loc?.source.body,
                    variables: { id: "user-123" },
                },
            },
            willRespondWith: {
                status: 200,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: {
                    data: {
                        getUserProfile: like({
                            id: string("user-123"),
                            name: string("Jane Doe"),
                            username: string("janedoe99"),
                            email: string("jane@example.com"),
                            bio: string("Sci-Fi writer"),
                            languages: eachLike("English"),
                            favourites: eachLike("script-xyz"),
                            likes: integer(42),
                            followers: integer(100),
                            follows: integer(50),
                            views: integer(1200),
                        }),
                    },
                },
            },
        });

        await provider.addInteraction({
            states: [{ description: "user-123 has authored scripts" }],
            uponReceiving: "a request for user scripts",
            withRequest: {
                method: "POST",
                path: "/graphql",
                headers: { "Content-Type": "application/json" },
                body: {
                    operationName: "GetUserScripts",
                    query: GET_USER_SCRIPTS.loc?.source.body,
                    variables: { userId: "user-123" },
                },
            },
            willRespondWith: {
                status: 200,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: {
                    data: {
                        getUserScripts: eachLike({
                            id: string("script-1"),
                            title: string("The Quantum Draft"),
                            visibility: string("Public"),
                            description: string("A time travel story."),
                            languages: eachLike("English"),
                            genres: eachLike("Sci-Fi"),
                            createdAt: string("1704067200000"),
                            updatedAt: string("1704153600000"),
                            author: like({
                                id: string("user-123"),
                                name: string("Jane Doe"),
                            }),
                        }),
                    },
                },
            },
        });

        await provider.addInteraction({
            states: [{ description: 'users matching "jane" exist' }],
            uponReceiving: "a request to search users",
            withRequest: {
                method: "POST",
                path: "/graphql",
                headers: { "Content-Type": "application/json" },
                body: {
                    operationName: "SearchUsers",
                    query: SEARCH_USERS.loc?.source.body,
                    variables: { query: "jane" },
                },
            },
            willRespondWith: {
                status: 200,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: {
                    data: {
                        searchUsers: eachLike({
                            id: string("user-123"),
                            name: string("Jane Doe"),
                            username: string("janedoe99"),
                        }),
                    },
                },
            },
        });

        await provider.addInteraction({
            states: [{ description: "user-123 has contributions" }],
            uponReceiving: "a request for user contributions",
            withRequest: {
                method: "POST",
                path: "/graphql",
                headers: { "Content-Type": "application/json" },
                body: {
                    operationName: "GetUserContributions",
                    query: GET_USER_CONTRIBUTIONS.loc?.source.body,
                    variables: { userId: "user-123" },
                },
            },
            willRespondWith: {
                status: 200,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: {
                    data: {
                        getUserContributions: eachLike({
                            id: string("contrib-1"),
                            status: string("APPROVED"),
                            text: string("This is a brilliant paragraph added to scene 3."),
                            likes: eachLike("user-456"),
                            dislikes: [],
                            createdAt: string("1704153600000"),
                            script: like({
                                id: string("script-1"),
                                title: string("The Quantum Draft"),
                            }),
                            comments: eachLike({
                                author: like({ name: string("Bob Editor") }),
                                text: string("Great addition!"),
                                createdAt: string("1704153700000"),
                            }),
                        }),
                    },
                },
            },
        });

        await provider.addInteraction({
            states: [{ description: "user-123 has favourite scripts" }],
            uponReceiving: "a request for user favourites",
            withRequest: {
                method: "POST",
                path: "/graphql",
                headers: { "Content-Type": "application/json" },
                body: {
                    operationName: "GetUserFavourites",
                    query: GET_USER_FAVOURITES.loc?.source.body,
                    variables: { userId: "user-123" },
                },
            },
            willRespondWith: {
                status: 200,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: {
                    data: {
                        getUserFavourites: eachLike({
                            id: string("script-99"),
                            title: string("A Masterpiece"),
                            visibility: string("Public"),
                            description: string("An inspiring tale."),
                            languages: eachLike("English"),
                            genres: eachLike("Drama"),
                            createdAt: string("1703000000000"),
                            updatedAt: string("1704000000000"),
                            author: like({
                                id: string("user-456"),
                                name: string("Alice Writer"),
                            }),
                        }),
                    },
                },
            },
        });

        await provider.executeTest(async (mockServer) => {
            const client = new ApolloClient({
                link: new HttpLink({
                    uri: `${mockServer.url}/graphql`,
                    fetch,
                }),
                cache: new InMemoryCache({
                    addTypename: false,
                }),
            });

            await client.query({ query: GET_USER_PROFILE, variables: { id: "user-123" } });
            await client.query({ query: GET_USER_SCRIPTS, variables: { userId: "user-123" } });
            await client.query({ query: SEARCH_USERS, variables: { query: "jane" } });
            await client.query({ query: GET_USER_CONTRIBUTIONS, variables: { userId: "user-123" } });
            await client.query({ query: GET_USER_FAVOURITES, variables: { userId: "user-123" } });

            expect(true).toBe(true);
        });
    });
});