import { test, expect } from '@playwright/test';

test.describe('Contributors Component E2E', () => {

    // --- HELPER FUNCTION FOR GRAPHQL MOCKING ---
    const mockScriptContributorsGraphql = async (page: any, paragraphsData: any[]) => {
        await page.route('**/graphql', async (route: any) => {
            const request = route.request();

            if (request.method() === 'OPTIONS') {
                return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
            }

            if (request.method() === 'POST') {
                const postData = request.postDataJSON();

                // Mock the parent route's query that feeds the useOutletContext
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

    // Mock Data: Charlie has 5, Alice has 3, Bob has 1
    const standardParagraphs = [
        ...Array(5).fill({ author: { id: 'user-c', name: 'Charlie' } }),
        ...Array(3).fill({ author: { id: 'user-a', name: 'Alice' } }),
        ...Array(1).fill({ author: { id: 'user-b', name: 'Bob' } })
    ];

    const PAGE_URL = '/contributors/script-123';

    test('should group contributors, calculate counts, and default to Highest First', async ({ page }) => {
        await mockScriptContributorsGraphql(page, standardParagraphs);
        await page.goto(PAGE_URL);

        // 1. Verify all 3 cards rendered
        await expect(page.getByTestId('contributor-card-user-c')).toBeVisible();
        await expect(page.getByTestId('contributor-card-user-a')).toBeVisible();
        await expect(page.getByTestId('contributor-card-user-b')).toBeVisible();

        // 2. Verify accurate counting logic
        await expect(page.getByTestId('contributor-count-user-c')).toHaveText('5 Contributions');
        await expect(page.getByTestId('contributor-count-user-a')).toHaveText('3 Contributions');
        await expect(page.getByTestId('contributor-count-user-b')).toHaveText('1 Contribution');

        // 3. Verify Highest First sorting (Charlie should be physically first in the DOM)
        const cards = page.locator('[data-testid^="contributor-card-"]');
        await expect(cards.nth(0)).toHaveAttribute('data-testid', 'contributor-card-user-c');
        await expect(cards.nth(1)).toHaveAttribute('data-testid', 'contributor-card-user-a');
        await expect(cards.nth(2)).toHaveAttribute('data-testid', 'contributor-card-user-b');
    });

    test('should filter contributors locally via search input', async ({ page }) => {
        await mockScriptContributorsGraphql(page, standardParagraphs);
        await page.goto(PAGE_URL);

        // Type into the search input
        const searchInput = page.getByTestId('contributors-search').locator('input');
        await searchInput.fill('Alice');

        // Verify visibility using strict IDs
        await expect(page.getByTestId('contributor-card-user-a')).toBeVisible();
        await expect(page.getByTestId('contributor-card-user-c')).not.toBeVisible();
        await expect(page.getByTestId('contributor-card-user-b')).not.toBeVisible();
    });

    test('should sort Lowest First when selected in dropdown', async ({ page }) => {
        await mockScriptContributorsGraphql(page, standardParagraphs);
        await page.goto(PAGE_URL);

        // Open dropdown
        await page.getByTestId('contributors-dropdown').click();

        // Note: Since we don't have the Dropdown source code to add test-ids to the options, 
        // using .getByText is required just to click the internal menu option.
        await page.getByText('Lowest First').last().click();

        // Verify sorting reversed (Bob [1] -> Alice [3] -> Charlie [5])
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

        // Verify alphabetical sorting (Alice -> Bob -> Charlie)
        const cards = page.locator('[data-testid^="contributor-card-"]');
        await expect(cards.nth(0)).toHaveAttribute('data-testid', 'contributor-card-user-a');
        await expect(cards.nth(1)).toHaveAttribute('data-testid', 'contributor-card-user-b');
        await expect(cards.nth(2)).toHaveAttribute('data-testid', 'contributor-card-user-c');
    });

    test('should navigate to user profile on card click', async ({ page }) => {
        await mockScriptContributorsGraphql(page, standardParagraphs);
        await page.goto(PAGE_URL);

        // Click Charlie's card explicitly
        await page.getByTestId('contributor-card-user-c').click();

        // Verify React Router navigation
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