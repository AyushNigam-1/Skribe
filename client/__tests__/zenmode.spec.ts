import { test, expect } from '@playwright/test';
import fs from 'fs'; 
import path from 'path';

test.describe('ZenMode Component E2E', () => {

    
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

    
    const PAGE_URL = '/zen/script-123';

    test('should load the script title and render markdown paragraphs', async ({ page }) => {
        await mockZenModeGraphql(page, standardMockScript);
        await page.goto(PAGE_URL);

        
        await expect(page.getByTestId('zen-title')).toHaveText('The Great Playwright Journey');

        
        await expect(page.getByTestId('zen-paragraph-p1')).toBeVisible();
        await expect(page.getByTestId('zen-paragraph-p2')).toBeVisible();

        
        await expect(page.getByTestId('zen-download-btn')).toBeEnabled();
    });

    test('should successfully trigger a markdown file download with correct formatting', async ({ page }) => {
        await mockZenModeGraphql(page, standardMockScript);
        await page.goto(PAGE_URL);

        const downloadPromise = page.waitForEvent('download');
        await page.getByTestId('zen-download-btn').click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toBe('the_great_playwright_journey.md');

        
        const tempFilePath = path.join("testing", 'temp_zen_download.md');

        
        await download.saveAs(tempFilePath);

        
        const fileContents = fs.readFileSync(tempFilePath, 'utf8');

        
        fs.unlinkSync(tempFilePath);

        
        const expectedContent = `# Chapter 1\nIt was the best of tests.\n\nIt was the worst of tests.`;
        expect(fileContents).toBe(expectedContent);
    });

    test('should display empty state when the script has zero paragraphs', async ({ page }) => {
        
        await mockZenModeGraphql(page, {
            ...standardMockScript,
            paragraphs: []
        });

        await page.goto(PAGE_URL);

        
        await expect(page.getByTestId('zen-empty-state')).toBeVisible();

        
        await expect(page.getByTestId('zen-paragraph-p1')).not.toBeVisible();

        
        await expect(page.getByTestId('zen-download-btn')).toBeDisabled();
    });

    test('should navigate back when the back button is clicked', async ({ page }) => {
        await mockZenModeGraphql(page, standardMockScript);

        
        await page.goto('/explore');

        
        await page.goto(PAGE_URL);
        await expect(page.getByTestId('zen-title')).toBeVisible();

        
        await page.getByTestId('zen-back-btn').click();

        
        await expect(page).toHaveURL(/.*\/explore/);
    });

});