import { test, expect } from '@playwright/test';
import fs from 'fs'; // Node's file system module to read the downloaded file
import path from 'path';

test.describe('ZenMode Component E2E', () => {

    // --- HELPER FUNCTION FOR GRAPHQL MOCKING ---
    const mockZenModeGraphql = async (page: any, mockScriptData: any) => {
        await page.route('**/graphql', async (route: any) => {
            const request = route.request();

            if (request.method() === 'OPTIONS') {
                return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
            }

            if (request.method() === 'POST') {
                const postData = request.postDataJSON();

                if (postData && postData.operationName === 'GetScriptById') {
                    return route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        headers: { 'Access-Control-Allow-Origin': '*' },
                        body: JSON.stringify({
                            data: {
                                getScriptById: mockScriptData
                            }
                        })
                    });
                }
            }
            await route.fallback();
        });
    };

    const standardMockScript = {
        __typename: 'Script',
        id: 'script-123',
        title: 'The Great Playwright Journey',
        paragraphs: [
            { id: 'p1', text: '# Chapter 1\nIt was the best of tests.' },
            { id: 'p2', text: 'It was the worst of tests.' }
        ]
    };

    // Adjust this to match your actual route structure
    const PAGE_URL = '/zen/script-123';

    test('should load the script title and render markdown paragraphs', async ({ page }) => {
        await mockZenModeGraphql(page, standardMockScript);
        await page.goto(PAGE_URL);

        // 1. Verify Title
        await expect(page.getByTestId('zen-title')).toHaveText('The Great Playwright Journey');

        // 2. Verify Paragraphs rendered using exact IDs
        await expect(page.getByTestId('zen-paragraph-p1')).toBeVisible();
        await expect(page.getByTestId('zen-paragraph-p2')).toBeVisible();

        // 3. Verify the Download button is enabled
        await expect(page.getByTestId('zen-download-btn')).toBeEnabled();
    });

    test('should successfully trigger a markdown file download with correct formatting', async ({ page }) => {
        await mockZenModeGraphql(page, standardMockScript);
        await page.goto(PAGE_URL);

        const downloadPromise = page.waitForEvent('download');
        await page.getByTestId('zen-download-btn').click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toBe('the_great_playwright_journey.md');

        // 2. FIX: Create a temporary local path in your test directory
        const tempFilePath = path.join("testing", 'temp_zen_download.md');

        // 3. FIX: Force Playwright to save the remote file to your local machine!
        await download.saveAs(tempFilePath);

        // 4. Read the file we just securely saved
        const fileContents = fs.readFileSync(tempFilePath, 'utf8');

        // 5. Clean up after ourselves (delete the temp file so we don't pollute the repo)
        fs.unlinkSync(tempFilePath);

        // 6. Verify the contents
        const expectedContent = `# Chapter 1\nIt was the best of tests.\n\nIt was the worst of tests.`;
        expect(fileContents).toBe(expectedContent);
    });

    test('should display empty state when the script has zero paragraphs', async ({ page }) => {
        // Pass a script with no paragraphs
        await mockZenModeGraphql(page, {
            ...standardMockScript,
            paragraphs: []
        });

        await page.goto(PAGE_URL);

        // 1. Verify Empty State is visible
        await expect(page.getByTestId('zen-empty-state')).toBeVisible();

        // 2. Verify paragraphs are not rendered
        await expect(page.getByTestId('zen-paragraph-p1')).not.toBeVisible();

        // 3. Verify the Download button is explicitly disabled
        await expect(page.getByTestId('zen-download-btn')).toBeDisabled();
    });

    test('should navigate back when the back button is clicked', async ({ page }) => {
        await mockZenModeGraphql(page, standardMockScript);

        // 1. Navigate to a dummy page first so `Maps(-1)` has somewhere to go
        await page.goto('/explore');

        // 2. Then navigate to Zen Mode
        await page.goto(PAGE_URL);
        await expect(page.getByTestId('zen-title')).toBeVisible();

        // 3. Click the back button
        await page.getByTestId('zen-back-btn').click();

        // 4. Verify we returned to the previous page
        await expect(page).toHaveURL(/.*\/explore/);
    });

});