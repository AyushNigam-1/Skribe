import { test, expect } from '@playwright/test';

test.describe('Requests Component E2E', () => {

    
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
                                    
                                }
                            }
                        })
                    });
                }

                
                if (opName === 'GetFilteredRequests') {
                    if (forceError) {
                        return route.fulfill({ status: 500, headers });
                    }

                    
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

    
    const PAGE_URL = '/requests/script-123';

    test('should load all requests and render accurate statuses and stats', async ({ page }) => {
        await mockRequestsGraphql(page, standardRequests);
        await page.goto(PAGE_URL);

        
        await expect(page.getByText('John Doe')).toBeVisible();
        await expect(page.getByText('Jane Writer')).toBeVisible();
        await expect(page.getByText('Troll User')).toBeVisible();

        
        const janeCard = page.getByTestId('request-card-req-2');

        
        await expect(janeCard.getByText('APPROVED')).toBeVisible();
        await expect(janeCard.getByText('Fixed the typos')).toBeVisible();

        
        
        await expect(janeCard.getByTestId('likes-count')).toHaveText(/2/);
        await expect(janeCard.getByTestId('dislikes-count')).toHaveText(/1/);
        await expect(janeCard.getByTestId('comments-count')).toHaveText(/0/);
    });

    test('should filter requests locally via search input', async ({ page }) => {
        await mockRequestsGraphql(page, standardRequests);
        await page.goto(PAGE_URL);

        
        const searchInput = page.getByTestId('requests-search-wrapper').locator('input');
        await searchInput.fill('dialogue');

        
        await expect(page.getByTestId('request-card-req-1')).toBeVisible(); 
        await expect(page.getByTestId('request-card-req-2')).not.toBeVisible(); 
        await expect(page.getByTestId('request-card-req-3')).not.toBeVisible(); 
    });

    test('should trigger network refetch when using the Status dropdown', async ({ page }) => {
        await mockRequestsGraphql(page, standardRequests);
        await page.goto(PAGE_URL);

        
        await page.getByText('All Statuses').last().click();

        
        await page.getByText('Approved').last().click();

        
        await expect(page.getByTestId('request-card-req-2')).toBeVisible();
        await expect(page.getByTestId('request-card-req-1')).not.toBeVisible();
        await expect(page.getByTestId('request-card-req-3')).not.toBeVisible();
    });

    test('should apply user filtering via URL parameters automatically', async ({ page }) => {
        await mockRequestsGraphql(page, standardRequests);

        
        await page.goto(`${PAGE_URL}?userId=user-jane`);

        
        const searchInput = page.getByTestId('requests-search-wrapper').locator('input');
        await expect(searchInput).toHaveAttribute('placeholder', 'Filtering by user...');

        
        await expect(page.getByTestId('request-card-req-2')).toBeVisible();
        await expect(page.getByTestId('request-card-req-1')).not.toBeVisible();
    });

    test('should show empty state when database is empty', async ({ page }) => {
        await mockRequestsGraphql(page, []);
        await page.goto(PAGE_URL);

        
        await expect(page.getByTestId('empty-state-no-requests')).toBeVisible();

        
        await expect(page.getByTestId('requests-search-wrapper')).not.toBeVisible();
    });

    test('should show no results state when search finds nothing', async ({ page }) => {
        await mockRequestsGraphql(page, standardRequests);
        await page.goto(PAGE_URL);

        
        const searchInput = page.getByTestId('requests-search-wrapper').locator('input');
        await searchInput.fill('Batman');

        
        await expect(page.getByTestId('empty-state-no-results')).toBeVisible();
        await expect(page.getByTestId('request-card-req-1')).not.toBeVisible();
    });

    test('should navigate to detailed contribution view on card click', async ({ page }) => {
        await mockRequestsGraphql(page, standardRequests);
        await page.goto(PAGE_URL);

        
        await page.getByTestId('request-card-req-1').click();

        
        await expect(page).toHaveURL(/.*\/contribution\/script-123\/req-1/);
    });

    test('should display error state and recover on Try Again', async ({ page }) => {
        
        await mockRequestsGraphql(page, standardRequests, true);
        await page.goto(PAGE_URL);

        
        await expect(page.getByTestId('error-state')).toBeVisible();

        
        await mockRequestsGraphql(page, standardRequests, false);
        await page.getByTestId('try-again-button').click();

        
        await expect(page.getByTestId('error-state')).not.toBeVisible();
        await expect(page.getByTestId('request-card-req-2')).toBeVisible();
    });

});