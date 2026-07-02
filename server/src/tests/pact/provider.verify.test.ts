import path from 'path';
import { Verifier } from '@pact-foundation/pact';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { startTestServer, stopTestServer } from './pace_server';
import { pactStateHandlers } from './stateHandler';

describe('Pact Verification', () => {
    let serverUrl: string;

    beforeAll(async () => {
        serverUrl = await startTestServer(4000);
    }, 60000);

    afterAll(async () => {
        await stopTestServer();
    });

    it('validates the expectations of the Frontend', async () => {

        const opts = {
            provider: "ScriptDrafts-GraphQL-API",
            providerBaseUrl: "http://localhost:4000/graphql",
            pactBrokerUrl: "http://localhost:9292",
            publishVerificationResult: true,
            providerVersion: "1.0.0",
            stateHandlers: pactStateHandlers,
        }

        const verifier = new Verifier(opts);
        await verifier.verifyProvider();
        console.log('Pact Verification Successful! The Backend matches the Frontend contract.');
    }, 60000);
});