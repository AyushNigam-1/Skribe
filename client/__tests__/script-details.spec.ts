import { test, expect } from '@playwright/test';

test.describe('Script Details Inline Editing E2E', () => {

    let REAL_USER_ID = '';

    
    test.beforeEach(async ({ page }) => {
        if (!REAL_USER_ID) {
            
            const navigationPromise = page.goto('/explore');

            
            const request = await page.waitForRequest((req) => {
                try {
                    return req.method() === 'POST' &&
                        req.url().includes('/graphql') &&
                        req.postDataJSON()?.operationName === 'GetNotifications';
                } catch (e) {
                    return false;
                }
            });

            REAL_USER_ID = request.postDataJSON().variables.userId;
            await navigationPromise;
        }
    });

    const mockDetailsGraphql = async (page: any, isAuthorized: boolean = true) => {
        let mutationsFired = {
            updateScript: false,
            lastVariables: null as any
        };

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
                        headers,
                        body: JSON.stringify({
                            data: {
                                getScriptById: {
                                    __typename: 'Script',
                                    id: 'script-details-999', 
                                    title: 'Original Title',
                                    description: 'Original Description',
                                    visibility: 'Public',
                                    genres: ['Sci-Fi', 'Action'],
                                    languages: ['English'],
                                    createdAt: '1704067200000', 
                                    
                                    author: {
                                        id: isAuthorized ? REAL_USER_ID : 'some-stranger-123',
                                        name: 'John Doe'
                                    },
                                    paragraphs: [
                                        { author: { id: 'author-1' } },
                                        { author: { id: 'author-2' } }
                                    ]
                                }
                            }
                        })
                    });
                }

                
                if (opName === 'UpdateScript') {
                    mutationsFired.updateScript = true;
                    mutationsFired.lastVariables = postData.variables;

                    return route.fulfill({
                        status: 200,
                        headers,
                        body: JSON.stringify({
                            data: {
                                updateScript: {
                                    __typename: 'Script',
                                    id: 'script-details-999',
                                    ...postData.variables
                                }
                            }
                        })
                    });
                }
            }
            await route.fallback();
        });

        return mutationsFired;
    };

    const PAGE_URL = '/about/script-details-999';

    test('should hide edit controls for unauthorized viewers', async ({ page }) => {
        
        await mockDetailsGraphql(page, false);
        await page.goto(PAGE_URL);

        
        await expect(page.getByTestId('readonly-value-author')).toHaveText('John Doe');

        
        await expect(page.getByTestId('edit-btn-title')).not.toBeVisible();
        await expect(page.getByTestId('edit-btn-genres')).not.toBeVisible();
        await expect(page.getByTestId('edit-btn-description')).not.toBeVisible();
    });

    test('should render read-only fields accurately', async ({ page }) => {
        
        await mockDetailsGraphql(page, true);
        await page.goto(PAGE_URL);

        
        await expect(page.getByTestId('readonly-value-author')).toHaveText('John Doe');
        await expect(page.getByTestId('readonly-value-published')).toHaveText('Jan 1, 2024');
        await expect(page.getByTestId('readonly-value-visibility')).toHaveText('Public');

        
        await expect(page.getByTestId('readonly-value-contributions')).toHaveText('2');
        await expect(page.getByTestId('readonly-value-contributors')).toHaveText('2');
    });

    test('should edit and save standard string fields (Title)', async ({ page }) => {
        const mutations = await mockDetailsGraphql(page, true);
        await page.goto(PAGE_URL);

        
        await page.getByTestId('edit-btn-title').click();

        
        await expect(page.getByTestId('editing-badge-title')).toBeVisible();

        
        const input = page.getByTestId('editable-input-title');
        await input.fill('The New Masterpiece');

        
        await page.getByTestId('save-btn-title').click();

        
        await page.waitForTimeout(300);
        expect(mutations.updateScript).toBe(true);
        expect(mutations.lastVariables.title).toBe('The New Masterpiece');
    });

    test('should parse and save array fields correctly (Genres)', async ({ page }) => {
        const mutations = await mockDetailsGraphql(page, true);
        await page.goto(PAGE_URL);

        
        await expect(page.getByTestId('array-item-genres-0')).toHaveText('Sci-Fi');
        await expect(page.getByTestId('array-item-genres-1')).toHaveText('Action');

        
        await page.getByTestId('edit-btn-genres').click();

        
        const input = page.getByTestId('editable-input-genres');
        await input.fill('Horror, Comedy, Thriller');

        
        await page.getByTestId('save-btn-genres').click();

        
        await page.waitForTimeout(300);
        expect(mutations.updateScript).toBe(true);
        expect(mutations.lastVariables.genres).toEqual(['Horror', 'Comedy', 'Thriller']);
    });

    test('should enforce Zod validations and block saving', async ({ page }) => {
        const mutations = await mockDetailsGraphql(page, true);
        await page.goto(PAGE_URL);

        await page.getByTestId('edit-btn-title').click();

        
        const input = page.getByTestId('editable-input-title');
        await input.fill('');

        
        await page.getByTestId('save-btn-title').click();

        await page.waitForTimeout(500);

        
        expect(mutations.updateScript).toBe(false);

        
        await expect(page.getByTestId('editing-badge-title')).toBeVisible();
    });

    test('should cancel edits and restore original value', async ({ page }) => {
        const mutations = await mockDetailsGraphql(page, true);
        await page.goto(PAGE_URL);

        await page.getByTestId('edit-btn-description').click();

        const input = page.getByTestId('editable-input-description');
        await input.fill('This is a completely ruined description.');

        
        await page.getByTestId('cancel-btn-description').click();

        
        expect(mutations.updateScript).toBe(false);

        
        await expect(page.getByTestId('editable-view-description')).toHaveText('Original Description');
    });

});