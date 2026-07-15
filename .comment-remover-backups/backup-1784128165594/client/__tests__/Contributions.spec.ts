import { test, expect } from '@playwright/test';

test.describe('My Contributions Page E2E', () => {

    // --- HELPER FUNCTION FOR GRAPHQL MOCKING ---
    const mockContributions = async (page: any, mockData: any) => {
        await page.route('**/graphql', async (route: any) => {
            const request = route.request();

            // Handle CORS Preflight
            if (request.method() === 'OPTIONS') {
                return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
            }

            if (request.method() === 'POST') {
                const postData = request.postDataJSON();
                if (postData && postData.operationName === 'GetUserContributions') {
                    return route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        headers: { 'Access-Control-Allow-Origin': '*' },
                        body: JSON.stringify({ data: { getUserContributions: mockData } })
                    });
                }
            }
            await route.fallback();
        });
    };

    test('should load contributions, group them by script, and calculate statuses correctly', async ({ page }) => {
        // 1. Mock complex data to test the grouping and counting logic
        await mockContributions(page, [
            {
                __typename: 'Contribution', id: 'c1', status: 'APPROVED', createdAt: 1704067200000,
                script: { __typename: 'Script', id: 's1', title: 'The Matrix Rewrite' }
            },
            {
                __typename: 'Contribution', id: 'c2', status: 'PENDING', createdAt: 1704153600000,
                script: { __typename: 'Script', id: 's1', title: 'The Matrix Rewrite' }
            },
            {
                __typename: 'Contribution', id: 'c3', status: 'REJECTED', createdAt: 1704240000000,
                script: { __typename: 'Script', id: 's1', title: 'The Matrix Rewrite' }
            },
            {
                __typename: 'Contribution', id: 'c4', status: 'APPROVED', createdAt: 1704326400000,
                script: { __typename: 'Script', id: 's2', title: 'Dune Part 3' }
            }
        ]);

        // Navigate to the page (Update this URL if your route is different!)
        await page.goto('/contributions');

        // 2. Verify "The Matrix Rewrite" grouped card
        const matrixCard = page.locator('a', { hasText: 'The Matrix Rewrite' });
        await expect(matrixCard).toBeVisible();

        // Verify calculations inside the Matrix card (1 Approved, 1 Pending, 1 Rejected = 3 Total)
        await expect(matrixCard.getByText('3 TOTAL')).toBeVisible();
        await expect(matrixCard.locator('div').filter({ hasText: /^Active1$/ })).toBeVisible();
        await expect(matrixCard.locator('div').filter({ hasText: /^Pending1$/ })).toBeVisible();
        await expect(matrixCard.locator('div').filter({ hasText: /^Rejected1$/ })).toBeVisible();

        // 3. Verify "Dune Part 3" grouped card
        const duneCard = page.locator('a', { hasText: 'Dune Part 3' });
        await expect(duneCard).toBeVisible();

        // Verify calculations inside the Dune card (1 Approved = 1 Total)
        await expect(duneCard.getByText('1 TOTAL')).toBeVisible();
        await expect(duneCard.locator('div').filter({ hasText: /^Active1$/ })).toBeVisible();
        await expect(duneCard.getByText('Rejected')).not.toBeVisible(); // Rejected UI shouldn't render if 0
    });

    test('should filter contributions by text search', async ({ page }) => {
        await mockContributions(page, [
            {
                __typename: 'Contribution', id: 'c1', status: 'APPROVED', createdAt: 1704067200000,
                script: { __typename: 'Script', id: 's1', title: 'The Matrix Rewrite' }
            },
            {
                __typename: 'Contribution', id: 'c2', status: 'APPROVED', createdAt: 1704326400000,
                script: { __typename: 'Script', id: 's2', title: 'Dune Part 3' }
            }
        ]);

        await page.goto('/contributions');

        // Both should be visible initially
        await expect(page.getByText('The Matrix Rewrite')).toBeVisible();
        await expect(page.getByText('Dune Part 3')).toBeVisible();

        // Search for "Dune"
        const searchInput = page.getByPlaceholder(/search drafts/i);
        await searchInput.fill('Dune');

        // Matrix should disappear, Dune should stay
        await expect(page.getByText('Dune Part 3')).toBeVisible();
        await expect(page.getByText('The Matrix Rewrite')).not.toBeVisible();
    });

    test('should filter contributions using the dropdown (Core Contributor)', async ({ page }) => {
        // Matrix has 3 contributions (Core), Dune has 1 (Casual)
        await mockContributions(page, [
            { __typename: 'Contribution', id: 'c1', status: 'APPROVED', createdAt: 1, script: { __typename: 'Script', id: 's1', title: 'The Matrix Rewrite' } },
            { __typename: 'Contribution', id: 'c2', status: 'PENDING', createdAt: 2, script: { __typename: 'Script', id: 's1', title: 'The Matrix Rewrite' } },
            { __typename: 'Contribution', id: 'c3', status: 'REJECTED', createdAt: 3, script: { __typename: 'Script', id: 's1', title: 'The Matrix Rewrite' } },
            { __typename: 'Contribution', id: 'c4', status: 'APPROVED', createdAt: 4, script: { __typename: 'Script', id: 's2', title: 'Dune Part 3' } }
        ]);

        await page.goto('/contributions');

        // Open dropdown (Clicking the currently selected option opens it)
        await page.getByText('All Contributions').click();

        // Select "Core Contributor (3+)"
        await page.getByText('Core Contributor (3+)').last().click();

        // Verify UI updates based on useMemo logic
        await expect(page.getByText('The Matrix Rewrite')).toBeVisible();
        await expect(page.getByText('Dune Part 3')).not.toBeVisible();
    });

    test('should display the global empty state when user has zero contributions', async ({ page }) => {
        // Return empty array
        await mockContributions(page, []);

        await page.goto('/contributions');

        // Verify the specific empty state appears
        await expect(page.getByRole('heading', { name: 'No contributions yet' })).toBeVisible();

        // Verify the "Explore" button renders and links correctly
        const exploreButton = page.locator('a[href="/explore"]').last();
        await expect(exploreButton).toBeVisible();
        await expect(exploreButton).toHaveAttribute('href', '/explore');
    });

});