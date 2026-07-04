import path from 'path';
import { LogLevel, Verifier } from '@pact-foundation/pact';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { startTestServer, stopTestServer } from './pact_server';
import { pactStateHandlers } from './states/stateHandler';

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
            provider: 'ScriptDrafts-GraphQL-API',
            providerBaseUrl: `${serverUrl}/graphql`,

            pactUrls: [
                path.resolve(process.cwd(), 'src/tests/pact/ScriptDrafts-Frontend-ScriptDrafts-GraphQL-API.json')
            ],
            logLevel: 'debug' as LogLevel,

            // 👇 3. Inject the external file here
            stateHandlers: pactStateHandlers,
        };

        const verifier = new Verifier(opts);
        await verifier.verifyProvider();
        console.log('Pact Verification Successful! The Backend matches the Frontend contract.');
    }, 60000);
});