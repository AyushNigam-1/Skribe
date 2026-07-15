import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    // baseURL: `${window.location.origin}/api/auth`,
    baseURL: `http://localhost:3000/api/auth`,

});