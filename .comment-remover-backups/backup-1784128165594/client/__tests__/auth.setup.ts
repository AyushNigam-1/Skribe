import { test as setup, expect } from '@playwright/test';

// Define where to save the authentication state
const authFile = 'playwright/.auth/user.json';

setup('authenticate as guest', async ({ page }) => {
    // 1. Navigate to your login page (adjust the URL if needed)
    await page.goto('/login');

    // 2. Click your Guest Login button
    await page.getByRole('button', { name: 'Log in as Guest' }).click();

    // 3. Wait for the app to redirect to /explore. 
    // This ensures the API call finished and the tokens are safely stored in the browser!
    await page.waitForURL('**/explore');

    // Optional: Verify the toast appeared just to be absolutely sure
    await expect(page.getByText('Welcome to the Demo!')).toBeVisible();

    // 4. Save all cookies and localStorage to the JSON file
    await page.context().storageState({ path: authFile });
});