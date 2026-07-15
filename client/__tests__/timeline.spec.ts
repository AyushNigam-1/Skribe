import { test, expect } from '@playwright/test';

test.describe('Timeline Component E2E', () => {

    
    const mockScriptTimelineGraphql = async (
        page: any,
        options: { paragraphs: any[], visibility?: string }
    ) => {
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
                                    visibility: options.visibility || 'PUBLIC',
                                    paragraphs: options.paragraphs
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
        {
            __typename: 'Paragraph',
            id: 'p1',
            text: 'The ship descended through the **clouds**, fire licking its hull.',
            createdAt: 1704153600000, 
            author: { __typename: 'User', name: 'Jane SciFi' }
        },
        {
            __typename: 'Paragraph',
            id: 'p2',
            text: 'Captain Reynolds braced for impact. "Hold on!" he shouted.',
            createdAt: 1704067200000, 
            author: { __typename: 'User', name: 'John Doe' }
        }
    ];

    
    const PAGE_URL = '/timeline/script-123';

    test('should load timeline, sort by newest first, and render Markdown', async ({ page }) => {
        await mockScriptTimelineGraphql(page, { paragraphs: standardParagraphs });
        await page.goto(PAGE_URL);

        
        await expect(page.getByText('Jane SciFi')).toBeVisible();
        await expect(page.getByText('John Doe')).toBeVisible();

        
        const links = page.locator('a[href^="/contribution/script-123/"]');
        await expect(links).toHaveCount(2);
        await expect(links.nth(0)).toContainText('Jane SciFi'); 
        await expect(links.nth(1)).toContainText('John Doe');   

        
        const strongTag = page.locator('strong', { hasText: 'clouds' });
        await expect(strongTag).toBeVisible();
    });

    test('should filter paragraphs via search and apply highlight <mark> tags', async ({ page }) => {
        await mockScriptTimelineGraphql(page, { paragraphs: standardParagraphs });
        await page.goto(PAGE_URL);

        
        const searchInput = page.getByPlaceholder('Search timeline...');
        await searchInput.fill('Reynolds');

        
        await expect(page.getByText('Captain Reynolds braced')).toBeVisible();
        await expect(page.getByText('Jane SciFi')).not.toBeVisible();

        
        const highlightedText = page.locator('mark', { hasText: 'Reynolds' });
        await expect(highlightedText).toBeVisible();
        await expect(highlightedText).toHaveClass(/bg-amber-500/);
    });

    test('should show empty state when there are no contributions', async ({ page }) => {
        await mockScriptTimelineGraphql(page, { paragraphs: [] });
        await page.goto(PAGE_URL);

        
        await expect(page.getByRole('heading', { name: 'No contributions yet' })).toBeVisible();

        
        await expect(page.getByPlaceholder('Search timeline...')).not.toBeVisible();
    });

    test('should show no results found state when search does not match anything', async ({ page }) => {
        await mockScriptTimelineGraphql(page, { paragraphs: standardParagraphs });
        await page.goto(PAGE_URL);

        
        const searchInput = page.getByPlaceholder('Search timeline...');
        await searchInput.fill('Godzilla');

        
        await expect(page.getByRole('heading', { name: 'No results found' })).toBeVisible();
        await expect(page.getByText('We couldn\'t find any results')).toBeVisible();
    });

    test('should hide Contribute buttons when script visibility is Archived', async ({ page }) => {
        
        await mockScriptTimelineGraphql(page, {
            paragraphs: standardParagraphs,
            visibility: 'Archived'
        });

        await page.goto(PAGE_URL);

        
        await expect(page.getByText('Jane SciFi')).toBeVisible();

        
        
        
        const contributeButton = page.getByRole('button', { name: /contribute|submit|new/i });
        await expect(contributeButton).not.toBeVisible();
    });

});