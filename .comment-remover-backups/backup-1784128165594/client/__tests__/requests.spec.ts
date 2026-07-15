import { test, expect } from '@playwright/test';

test.describe('Requests Component E2E', () => {

    // --- HELPER FUNCTION FOR SMART GRAPHQL MOCKING ---
    const mockRequestsGraphql = async (page: any, allMockData: any[], forceError = false) => {
        await page.route('**/graphql', async (route: any) => {
            const request = route.request();

            if (request.method() === 'OPTIONS') {
                return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
            }

            if (request.method() === 'POST') {
                const postData = request.postDataJSON();
                const opName = postData?.operationName;
                const headers = { 'Access-Control-Allow-Origin': '*' };

                // 1. NEW: Mock the PARENT route's query so MongoDB doesn't crash!
                if (opName === 'GetScriptById') {
                    return route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        headers,
                        body: JSON.stringify({
                            data: {
                                getScriptById: {
                                    __typename: 'Script',
                                    id: 'script-123',
                                    // Note: Add any other fields here if your parent layout requires them (like title)
                                }
                            }
                        })
                    });
                }

                // 2. Mock the CHILD component's query (The requests)
                if (opName === 'GetFilteredRequests') {
                    if (forceError) {
                        return route.fulfill({ status: 500, headers });
                    }

                    // SMART MOCK: Filter the returned data based on the GraphQL variables your component sends
                    const { status, userId } = postData.variables || {};
                    let filteredData = [...allMockData];

                    if (status && status !== 'all') {
                        filteredData = filteredData.filter(req => req.status.toLowerCase() === status.toLowerCase());
                    }
                    if (userId) {
                        filteredData = filteredData.filter(req => req.author.id === userId);
                    }

                    return route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        headers,
                        body: JSON.stringify({
                            data: {
                                getFilteredRequests: filteredData
                            }
                        })
                    });
                }
            }
            await route.fallback();
        });
    };

    // Standard Mock Data
    const standardRequests = [
        {
            __typename: 'Request',
            id: 'req-1',
            text: 'Adding some intense sci-fi dialogue to scene 4.',
            status: 'PENDING',
            createdAt: 1704153600000,
            likes: ['user2'], dislikes: [], comments: ['c1', 'c2'],
            author: { __typename: 'User', id: 'user-john', name: 'John Doe' }
        },
        {
            __typename: 'Request',
            id: 'req-2',
            text: 'Fixed the typos in the protagonist name.',
            status: 'APPROVED',
            createdAt: 1704067200000,
            likes: ['user1', 'user3'], dislikes: ['user4'], comments: [],
            author: { __typename: 'User', id: 'user-jane', name: 'Jane Writer' }
        },
        {
            __typename: 'Request',
            id: 'req-3',
            text: 'Deleted the entire second act because it was boring.',
            status: 'REJECTED',
            createdAt: 1703980800000,
            likes: [], dislikes: ['user1', 'user2', 'user5'], comments: ['c3'],
            author: { __typename: 'User', id: 'user-troll', name: 'Troll User' }
        }
    ];

    // Note: Update this URL to match wherever your outlet renders this component!
    const PAGE_URL = '/requests/script-123';

    test('should load all requests and render accurate statuses and stats', async ({ page }) => {
        await mockRequestsGraphql(page, standardRequests);
        await page.goto(PAGE_URL);

        // Verify all 3 cards rendered
        await expect(page.getByText('John Doe')).toBeVisible();
        await expect(page.getByText('Jane Writer')).toBeVisible();
        await expect(page.getByText('Troll User')).toBeVisible();

        // 1. Target Jane's card precisely using the dynamic test ID
        const janeCard = page.getByTestId('request-card-req-2');

        // Verify text details
        await expect(janeCard.getByText('APPROVED')).toBeVisible();
        await expect(janeCard.getByText('Fixed the typos')).toBeVisible();

        // 2. Safely verify the stats using test IDs and `.toHaveText`
        // (Jane has 2 likes, 1 dislike, 0 comments based on the standardRequests mock)
        await expect(janeCard.getByTestId('likes-count')).toHaveText(/2/);
        await expect(janeCard.getByTestId('dislikes-count')).toHaveText(/1/);
        await expect(janeCard.getByTestId('comments-count')).toHaveText(/0/);
    });

    test('should filter requests locally via search input', async ({ page }) => {
        await mockRequestsGraphql(page, standardRequests);
        await page.goto(PAGE_URL);

        // 1. Target the search input precisely using the test ID wrapper
        const searchInput = page.getByTestId('requests-search-wrapper').locator('input');
        await searchInput.fill('dialogue');

        // 2. Verify visibility using exact Card IDs instead of guessing text!
        await expect(page.getByTestId('request-card-req-1')).toBeVisible(); // John's card
        await expect(page.getByTestId('request-card-req-2')).not.toBeVisible(); // Jane's card
        await expect(page.getByTestId('request-card-req-3')).not.toBeVisible(); // Troll's card
    });

    test('should trigger network refetch when using the Status dropdown', async ({ page }) => {
        await mockRequestsGraphql(page, standardRequests);
        await page.goto(PAGE_URL);

        // Open Dropdown & Select
        await page.getByText('All Statuses').last().click();

        // Select "Approved" (Using .last() because the menu item also duplicates the text)
        await page.getByText('Approved').last().click();

        // The smart mock will read `variables: { status: 'approved' }` and return only Jane (req-2)
        await expect(page.getByTestId('request-card-req-2')).toBeVisible();
        await expect(page.getByTestId('request-card-req-1')).not.toBeVisible();
        await expect(page.getByTestId('request-card-req-3')).not.toBeVisible();
    });

    test('should apply user filtering via URL parameters automatically', async ({ page }) => {
        await mockRequestsGraphql(page, standardRequests);

        // Navigate with the userId query parameter
        await page.goto(`${PAGE_URL}?userId=user-jane`);

        // Verify the Search Input updated its placeholder internally
        const searchInput = page.getByTestId('requests-search-wrapper').locator('input');
        await expect(searchInput).toHaveAttribute('placeholder', 'Filtering by user...');

        // Verify only Jane's card (req-2) rendered
        await expect(page.getByTestId('request-card-req-2')).toBeVisible();
        await expect(page.getByTestId('request-card-req-1')).not.toBeVisible();
    });

    test('should show empty state when database is empty', async ({ page }) => {
        await mockRequestsGraphql(page, []);
        await page.goto(PAGE_URL);

        // Target the specific empty state component
        await expect(page.getByTestId('empty-state-no-requests')).toBeVisible();

        // Ensure the search bar is hidden
        await expect(page.getByTestId('requests-search-wrapper')).not.toBeVisible();
    });

    test('should show no results state when search finds nothing', async ({ page }) => {
        await mockRequestsGraphql(page, standardRequests);
        await page.goto(PAGE_URL);

        // Search for something that doesn't exist
        const searchInput = page.getByTestId('requests-search-wrapper').locator('input');
        await searchInput.fill('Batman');

        // Target the specific "No Results" state component
        await expect(page.getByTestId('empty-state-no-results')).toBeVisible();
        await expect(page.getByTestId('request-card-req-1')).not.toBeVisible();
    });

    test('should navigate to detailed contribution view on card click', async ({ page }) => {
        await mockRequestsGraphql(page, standardRequests);
        await page.goto(PAGE_URL);

        // Click John's card using its exact test ID (No more `.nth(1)` hacks!)
        await page.getByTestId('request-card-req-1').click();

        // Verify the URL updated to the detailed contribution route
        await expect(page).toHaveURL(/.*\/contribution\/script-123\/req-1/);
    });

    test('should display error state and recover on Try Again', async ({ page }) => {
        // Force error on first load
        await mockRequestsGraphql(page, standardRequests, true);
        await page.goto(PAGE_URL);

        // Target the error state container
        await expect(page.getByTestId('error-state')).toBeVisible();

        // Turn off error forcing and click try again
        await mockRequestsGraphql(page, standardRequests, false);
        await page.getByTestId('try-again-button').click();

        // Verify successful recovery (Jane's card appears)
        await expect(page.getByTestId('error-state')).not.toBeVisible();
        await expect(page.getByTestId('request-card-req-2')).toBeVisible();
    });

});