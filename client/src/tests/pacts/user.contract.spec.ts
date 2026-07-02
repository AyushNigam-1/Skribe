import fetch from "cross-fetch";
import { print } from "graphql";
import { provider } from './pactSetup';
import { describe, it, expect } from "vitest";
import { MatchersV3 } from "@pact-foundation/pact";
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import {
    GET_USER_PROFILE,
    GET_USER_SCRIPTS,
    GET_USER_CONTRIBUTIONS,
    GET_USER_FAVOURITES,
    SEARCH_USERS,
} from "../../graphql/query/userQueries";

const { string, eachLike, like } = MatchersV3;


describe("GraphQL User Contracts", () => {
    it("generates contracts for all User queries", async () => {
        await provider.addInteraction({
            states: [{ description: "a user with ID 60c72b2f9b1d8b001c8e4a01 exists" }],
            uponReceiving: "a request for a user profile",
            withRequest: {
                method: "POST",
                path: "/graphql",
                headers: { "Content-Type": "application/json" },
                body: {
                    operationName: "GetUserProfile",
                    query: print(GET_USER_PROFILE),
                    variables: { id: "60c72b2f9b1d8b001c8e4a01" },
                },
            },
            willRespondWith: {
                status: 200,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: {
                    data: {
                        getUserProfile: like({
                            id: string("60c72b2f9b1d8b001c8e4a01"),
                            name: string("Jane Doe"),
                            username: string("janedoe99"),
                            email: string("jane@example.com"),
                            bio: string("Sci-Fi writer"),
                            languages: eachLike("English"),
                            favourites: eachLike("script-xyz"),
                            likes: [],
                            followers: [],
                            follows: [],
                            views: [],
                        }),
                    },
                },
            },
        });

        await provider.addInteraction({
            states: [{ description: "60c72b2f9b1d8b001c8e4a01 has authored scripts" }],
            uponReceiving: "a request for user scripts",
            withRequest: {
                method: "POST",
                path: "/graphql",
                headers: { "Content-Type": "application/json" },
                body: {
                    operationName: "GetUserScripts",
                    query: print(GET_USER_SCRIPTS),
                    variables: { userId: "60c72b2f9b1d8b001c8e4a01" },
                },
            },
            willRespondWith: {
                status: 200,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: {
                    data: {
                        getUserScripts: eachLike({
                            id: string("60c72b2f9b1d8b001c8e4a03"),
                            title: string("The Quantum Draft"),
                            visibility: string("Public"),
                            description: string("A time travel story."),
                            languages: eachLike("English"),
                            genres: eachLike("Sci-Fi"),
                            createdAt: string("1704067200000"),
                            updatedAt: string("1704153600000"),
                            author: like({
                                id: string("60c72b2f9b1d8b001c8e4a01"),
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
                    query: print(SEARCH_USERS),
                    variables: { query: "jane" },
                },
            },
            willRespondWith: {
                status: 200,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: {
                    data: {
                        searchUsers: eachLike({
                            id: string("60c72b2f9b1d8b001c8e4a01"),
                            name: string("Jane Doe"),
                            username: string("janedoe99"),
                        }),
                    },
                },
            },
        });

        await provider.addInteraction({
            states: [{ description: "60c72b2f9b1d8b001c8e4a01 has contributions" }],
            uponReceiving: "a request for user contributions",
            withRequest: {
                method: "POST",
                path: "/graphql",
                headers: { "Content-Type": "application/json" },
                body: {
                    operationName: "GetUserContributions",
                    query: print(GET_USER_CONTRIBUTIONS),
                    variables: { userId: "60c72b2f9b1d8b001c8e4a01" },
                },
            },
            willRespondWith: {
                status: 200,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: {
                    data: {
                        getUserContributions: eachLike({
                            id: string("60c72b2f9b1d8b001c8e4a05"),
                            status: string("APPROVED"),
                            text: string("This is a brilliant paragraph added to scene 3."),
                            likes: eachLike("60c72b2f9b1d8b001c8e4a02"),
                            dislikes: [],
                            createdAt: string("1704153600000"),
                            script: like({
                                id: string("60c72b2f9b1d8b001c8e4a03"),
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
            states: [{ description: "60c72b2f9b1d8b001c8e4a01 has favourite scripts" }],
            uponReceiving: "a request for user favourites",
            withRequest: {
                method: "POST",
                path: "/graphql",
                headers: { "Content-Type": "application/json" },
                body: {
                    operationName: "GetUserFavourites",
                    query: print(GET_USER_FAVOURITES),
                    variables: { userId: "60c72b2f9b1d8b001c8e4a01" },
                },
            },
            willRespondWith: {
                status: 200,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: {
                    data: {
                        getUserFavourites: eachLike({
                            id: string("60c72b2f9b1d8b001c8e4a04"),
                            title: string("A Masterpiece"),
                            visibility: string("Public"),
                            description: string("An inspiring tale."),
                            languages: eachLike("English"),
                            genres: eachLike("Drama"),
                            createdAt: string("1703000000000"),
                            updatedAt: string("1704000000000"),
                            author: like({
                                id: string("60c72b2f9b1d8b001c8e4a02"),
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

            await client.query({ query: GET_USER_PROFILE, variables: { id: "60c72b2f9b1d8b001c8e4a01" } });
            await client.query({ query: GET_USER_SCRIPTS, variables: { userId: "60c72b2f9b1d8b001c8e4a01" } });
            await client.query({ query: SEARCH_USERS, variables: { query: "jane" } });
            await client.query({ query: GET_USER_CONTRIBUTIONS, variables: { userId: "60c72b2f9b1d8b001c8e4a01" } });
            await client.query({ query: GET_USER_FAVOURITES, variables: { userId: "60c72b2f9b1d8b001c8e4a01" } });

            expect(true).toBe(true);
        });
    });
});