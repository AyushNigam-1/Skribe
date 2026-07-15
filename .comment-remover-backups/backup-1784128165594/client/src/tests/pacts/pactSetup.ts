import { PactV3 } from '@pact-foundation/pact';
import path from 'path';

export const provider = new PactV3({
    consumer: 'ScriptDrafts-Frontend',
    provider: 'ScriptDrafts-GraphQL-API',
    dir: path.resolve(process.cwd(), 'pacts'),
});