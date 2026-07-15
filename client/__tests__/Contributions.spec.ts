import { test, expect } from '@playwright/test';

test.describe('My Contributions Page E2E', () => {

    
    const mockContributions = async (page: any, mockData: any) => {
        await page.route('**/graphql', async (route: any) => {
            const request = route.request();

            
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

        
        await page.goto('/contributions');

        
        const matrixCard = page.locator('a', { hasText: 'The Matrix Rewrite' });
        await expect(matrixCard).toBeVisible();

        
        await expect(matrixCard.getByText('3 TOTAL')).toBeVisible();
        await expect(matrixCard.locator('div').filter({ hasText: /^Active1$/ })).toBeVisible();
        await expect(matrixCard.locator('div').filter({ hasText: /^Pending1$/ })).toBeVisible();
        await expect(matrixCard.locator('div').filter({ hasText: /^Rejected1$/ })).toBeVisible();

        
        const duneCard = page.locator('a', { hasText: 'Dune Part 3' });
        await expect(duneCard).toBeVisible();

        
        await expect(duneCard.getByText('1 TOTAL')).toBeVisible();
        await expect(duneCard.locator('div').filter({ hasText: /^Active1$/ })).toBeVisible();
        await expect(duneCard.getByText('Rejected')).not.toBeVisible(); 
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

        
        await expect(page.getByText('The Matrix Rewrite')).toBeVisible();
        await expect(page.getByText('Dune Part 3')).toBeVisible();

        
        const searchInput = page.getByPlaceholder(/search drafts/i);
        await searchInput.fill('Dune');

        
        await expect(page.getByText('Dune Part 3')).toBeVisible();
        await expect(page.getByText('The Matrix Rewrite')).not.toBeVisible();
    });

    test('should filter contributions using the dropdown (Core Contributor)', async ({ page }) => {
        
        await mockContributions(page, [
            { __typename: 'Contribution', id: 'c1', status: 'APPROVED', createdAt: 1, script: { __typename: 'Script', id: 's1', title: 'The Matrix Rewrite' } },
            { __typename: 'Contribution', id: 'c2', status: 'PENDING', createdAt: 2, script: { __typename: 'Script', id: 's1', title: 'The Matrix Rewrite' } },
            { __typename: 'Contribution', id: 'c3', status: 'REJECTED', createdAt: 3, script: { __typename: 'Script', id: 's1', title: 'The Matrix Rewrite' } },
            { __typename: 'Contribution', id: 'c4', status: 'APPROVED', createdAt: 4, script: { __typename: 'Script', id: 's2', title: 'Dune Part 3' } }
        ]);

        await page.goto('/contributions');

        
        await page.getByText('All Contributions').click();

        
        await page.getByText('Core Contributor (3+)').last().click();

        
        await expect(page.getByText('The Matrix Rewrite')).toBeVisible();
        await expect(page.getByText('Dune Part 3')).not.toBeVisible();
    });

    test('should display the global empty state when user has zero contributions', async ({ page }) => {
        
        await mockContributions(page, []);

        await page.goto('/contributions');

        
        await expect(page.getByRole('heading', { name: 'No contributions yet' })).toBeVisible();

        
        const exploreButton = page.locator('a[href="/explore"]').last();
        await expect(exploreButton).toBeVisible();
        await expect(exploreButton).toHaveAttribute('href', '/explore');
    });

});