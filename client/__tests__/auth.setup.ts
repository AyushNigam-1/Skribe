import { test as setup, expect } from '@playwright/test';


const authFile = 'playwright/.auth/user.json';

setup('authenticate as guest', async ({ page }) => {
    
    await page.goto('/login');

    
    await page.getByRole('button', { name: 'Log in as Guest' }).click();

    
    
    await page.waitForURL('**/explore');

    
    await expect(page.getByText('Welcome to the Demo!')).toBeVisible();

    
    await page.context().storageState({ path: authFile });
});