import { test, expect } from '@playwright/test';

test.describe('Contributors Component E2E', () => {

    
    const mockScriptContributorsGraphql = async (page: any, paragraphsData: any[]) => {
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
                                getScriptById: {
                                    __typename: 'Script',
                                    id: 'script-123',
                                    visibility: 'PUBLIC',
                                    paragraphs: paragraphsData
                                }
                            }
                        })
                    });
                }
            }
            await route.fallback();
        });
    };

    
    const standardParagraphs = [
        ...Array(5).fill({ author: { id: 'user-c', name: 'Charlie' } }),
        ...Array(3).fill({ author: { id: 'user-a', name: 'Alice' } }),
        ...Array(1).fill({ author: { id: 'user-b', name: 'Bob' } })
    ];

    const PAGE_URL = '/contributors/script-123';

    test('should group contributors, calculate counts, and default to Highest First', async ({ page }) => {
        await mockScriptContributorsGraphql(page, standardParagraphs);
        await page.goto(PAGE_URL);

        
        await expect(page.getByTestId('contributor-card-user-c')).toBeVisible();
        await expect(page.getByTestId('contributor-card-user-a')).toBeVisible();
        await expect(page.getByTestId('contributor-card-user-b')).toBeVisible();

        
        await expect(page.getByTestId('contributor-count-user-c')).toHaveText('5 Contributions');
        await expect(page.getByTestId('contributor-count-user-a')).toHaveText('3 Contributions');
        await expect(page.getByTestId('contributor-count-user-b')).toHaveText('1 Contribution');

        
        const cards = page.locator('[data-testid^="contributor-card-"]');
        await expect(cards.nth(0)).toHaveAttribute('data-testid', 'contributor-card-user-c');
        await expect(cards.nth(1)).toHaveAttribute('data-testid', 'contributor-card-user-a');
        await expect(cards.nth(2)).toHaveAttribute('data-testid', 'contributor-card-user-b');
    });

    test('should filter contributors locally via search input', async ({ page }) => {
        await mockScriptContributorsGraphql(page, standardParagraphs);
        await page.goto(PAGE_URL);

        
        const searchInput = page.getByTestId('contributors-search').locator('input');
        await searchInput.fill('Alice');

        
        await expect(page.getByTestId('contributor-card-user-a')).toBeVisible();
        await expect(page.getByTestId('contributor-card-user-c')).not.toBeVisible();
        await expect(page.getByTestId('contributor-card-user-b')).not.toBeVisible();
    });

    test('should sort Lowest First when selected in dropdown', async ({ page }) => {
        await mockScriptContributorsGraphql(page, standardParagraphs);
        await page.goto(PAGE_URL);

        
        await page.getByTestId('contributors-dropdown').click();

        
        
        await page.getByText('Lowest First').last().click();

        
        const cards = page.locator('[data-testid^="contributor-card-"]');
        await expect(cards.nth(0)).toHaveAttribute('data-testid', 'contributor-card-user-b');
        await expect(cards.nth(1)).toHaveAttribute('data-testid', 'contributor-card-user-a');
        await expect(cards.nth(2)).toHaveAttribute('data-testid', 'contributor-card-user-c');
    });

    test('should sort A-Z when selected in dropdown', async ({ page }) => {
        await mockScriptContributorsGraphql(page, standardParagraphs);
        await page.goto(PAGE_URL);

        await page.getByTestId('contributors-dropdown').click();
        await page.getByText('A-Z').last().click();

        
        const cards = page.locator('[data-testid^="contributor-card-"]');
        await expect(cards.nth(0)).toHaveAttribute('data-testid', 'contributor-card-user-a');
        await expect(cards.nth(1)).toHaveAttribute('data-testid', 'contributor-card-user-b');
        await expect(cards.nth(2)).toHaveAttribute('data-testid', 'contributor-card-user-c');
    });

    test('should navigate to user profile on card click', async ({ page }) => {
        await mockScriptContributorsGraphql(page, standardParagraphs);
        await page.goto(PAGE_URL);

        
        await page.getByTestId('contributor-card-user-c').click();

        
        await expect(page).toHaveURL(/.*\/profile\/user-c/);
    });

    test('should show empty state when there are zero paragraphs', async ({ page }) => {
        await mockScriptContributorsGraphql(page, []);
        await page.goto(PAGE_URL);

        await expect(page.getByTestId('empty-state-no-contributors')).toBeVisible();
        await expect(page.getByTestId('contributors-search')).not.toBeVisible();
    });

    test('should show no results state when search yields nothing', async ({ page }) => {
        await mockScriptContributorsGraphql(page, standardParagraphs);
        await page.goto(PAGE_URL);

        const searchInput = page.getByTestId('contributors-search').locator('input');
        await searchInput.fill('Zebra');

        await expect(page.getByTestId('empty-state-no-results')).toBeVisible();
        await expect(page.getByTestId('contributor-card-user-c')).not.toBeVisible();
    });

});