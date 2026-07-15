import { test, expect } from '@playwright/test';

test.describe('Bookmarks Page E2E', () => {

    
    const mockBookmarks = async (page: any, mockData: any, errorAttempt = false) => {
        let attemptCount = 0;

        await page.route('**/graphql', async (route: any) => {
            const request = route.request();

            
            if (request.method() === 'OPTIONS') {
                return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
            }

            if (request.method() === 'POST') {
                const postData = request.postDataJSON();

                if (postData && postData.operationName === 'GetUserFavourites') {
                    attemptCount++;

                    
                    if (errorAttempt && attemptCount === 1) {
                        return route.fulfill({ status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
                    }

                    
                    return route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        headers: { 'Access-Control-Allow-Origin': '*' },
                        body: JSON.stringify({ data: { getUserFavourites: mockData } })
                    });
                }
            }
            await route.fallback();
        });
    };

    
    const standardMocks = [
        {
            __typename: 'Script',
            id: 'b1',
            title: 'The Matrix Rewrite',
            genres: ['Science Fiction', 'Action'],
            description: 'A gritty cyberpunk reboot.',
            likes: 10,
            dislikes: 0,
            languages: ['English'],
            createdAt: 1704067200000,
            author: { __typename: 'User', name: 'Neo' }
        },
        {
            __typename: 'Script',
            id: 'b2',
            title: 'Lord of the Rings: The Fourth Age',
            genres: ['Fantasy'],
            description: 'A new adventure in Middle Earth.',
            likes: 50,
            dislikes: 1,
            languages: ['English', 'Elvish'],
            createdAt: 1704153600000,
            author: { __typename: 'User', name: 'Tolkien Fan' }
        }
    ];

    test('should load bookmarks and render DraftCards successfully', async ({ page }) => {
        await mockBookmarks(page, standardMocks);
        
        await page.goto('/bookmarks');

        
        await expect(page.getByText('The Matrix Rewrite')).toBeVisible();
        await expect(page.getByText('Lord of the Rings: The Fourth Age')).toBeVisible();
    });

    test('should filter bookmarks by text search locally', async ({ page }) => {
        await mockBookmarks(page, standardMocks);
        await page.goto('/bookmarks');

        
        await expect(page.getByText('The Matrix Rewrite')).toBeVisible();

        
        const searchInput = page.getByPlaceholder(/search your library/i);
        await searchInput.fill('Matrix');

        
        await expect(page.getByText('The Matrix Rewrite')).toBeVisible();
        await expect(page.getByText('Lord of the Rings')).not.toBeVisible();
    });

    test('should filter bookmarks using the Genre dropdown', async ({ page }) => {
        await mockBookmarks(page, standardMocks);
        await page.goto('/bookmarks');

        
        await page.getByText('All Genres').click();

        
        await page.getByText('Fantasy').last().click();

        
        await expect(page.getByText('Lord of the Rings: The Fourth Age')).toBeVisible();
        await expect(page.getByText('The Matrix Rewrite')).not.toBeVisible();
    });

    test('should show "No Results Found" when search yields nothing', async ({ page }) => {
        await mockBookmarks(page, standardMocks);
        await page.goto('/bookmarks');

        
        const searchInput = page.getByPlaceholder(/search your library/i);
        await searchInput.fill('Batman');

        
        await expect(page.getByRole('heading', { name: 'No Results Found' })).toBeVisible();
        await expect(page.getByText(/We couldn't find any result matching your current search filters/i)).toBeVisible();
    });

    test('should display the global empty state when user has zero bookmarks', async ({ page }) => {
        await mockBookmarks(page, []); 
        await page.goto('/bookmarks');

        
        await expect(page.getByRole('heading', { name: 'No bookmarks yet' })).toBeVisible();

        
        await expect(page.getByPlaceholder(/search your library/i)).not.toBeVisible();

        
        const exploreButton = page.locator('a[href="/explore"]').last();
        await expect(exploreButton).toBeVisible();
    });

    test('should display error state and recover when clicking Try Again', async ({ page }) => {
        
        await mockBookmarks(page, standardMocks, true);
        await page.goto('/bookmarks');

        
        await expect(page.getByRole('heading', { name: 'Failed to load drafts' })).toBeVisible();

        
        await page.getByRole('button', { name: 'Try Again' }).click();

        
        await expect(page.getByRole('heading', { name: 'Failed to load drafts' })).not.toBeVisible();
        await expect(page.getByText('The Matrix Rewrite')).toBeVisible();
    });

});