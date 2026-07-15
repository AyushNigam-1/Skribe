import { test, expect } from '@playwright/test';

test.describe('Script Details Inline Editing E2E', () => {

    let REAL_USER_ID = '';

    // 1. BULLETPROOF ID SNIFFER: Intercept the Notification Query from the Navbar
    test.beforeEach(async ({ page }) => {
        if (!REAL_USER_ID) {
            // Navigate to a generic page to trigger the Navbar mounting
            const navigationPromise = page.goto('/explore');

            // Wait for the GetNotifications query (which contains the real userId)
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

                // 1. Mock the Parent Context
                if (opName === 'GetScriptById') {
                    return route.fulfill({
                        status: 200,
                        headers,
                        body: JSON.stringify({
                            data: {
                                getScriptById: {
                                    __typename: 'Script',
                                    id: 'script-details-999', // Unique ID to bust Apollo cache
                                    title: 'Original Title',
                                    description: 'Original Description',
                                    visibility: 'Public',
                                    genres: ['Sci-Fi', 'Action'],
                                    languages: ['English'],
                                    createdAt: '1704067200000', // Jan 1, 2024
                                    // 🔥 THE MAGIC FIX: Inject the real sniffed ID so the parent Outlet grants access!
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

                // 2. Track the Update Mutation
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
        // Pass FALSE so the mock sets the author to a stranger
        await mockDetailsGraphql(page, false);
        await page.goto(PAGE_URL);

        // Verify the data renders
        await expect(page.getByTestId('readonly-value-author')).toHaveText('John Doe');

        // Verify the edit buttons are completely missing from the DOM!
        await expect(page.getByTestId('edit-btn-title')).not.toBeVisible();
        await expect(page.getByTestId('edit-btn-genres')).not.toBeVisible();
        await expect(page.getByTestId('edit-btn-description')).not.toBeVisible();
    });

    test('should render read-only fields accurately', async ({ page }) => {
        // Passing true (default) sets the author ID to the logged-in Playwright user
        await mockDetailsGraphql(page, true);
        await page.goto(PAGE_URL);

        // Verify ReadOnly Cards
        await expect(page.getByTestId('readonly-value-author')).toHaveText('John Doe');
        await expect(page.getByTestId('readonly-value-published')).toHaveText('Jan 1, 2024');
        await expect(page.getByTestId('readonly-value-visibility')).toHaveText('Public');

        // Verify computed stats (2 paragraphs, 2 unique contributors)
        await expect(page.getByTestId('readonly-value-contributions')).toHaveText('2');
        await expect(page.getByTestId('readonly-value-contributors')).toHaveText('2');
    });

    test('should edit and save standard string fields (Title)', async ({ page }) => {
        const mutations = await mockDetailsGraphql(page, true);
        await page.goto(PAGE_URL);

        // 1. Click edit on Title
        await page.getByTestId('edit-btn-title').click();

        // 2. Verify editing badge appears
        await expect(page.getByTestId('editing-badge-title')).toBeVisible();

        // 3. Edit the contentEditable field
        const input = page.getByTestId('editable-input-title');
        await input.fill('The New Masterpiece');

        // 4. Save changes
        await page.getByTestId('save-btn-title').click();

        // 5. Verify the GraphQL mutation received the correctly parsed data
        await page.waitForTimeout(300);
        expect(mutations.updateScript).toBe(true);
        expect(mutations.lastVariables.title).toBe('The New Masterpiece');
    });

    test('should parse and save array fields correctly (Genres)', async ({ page }) => {
        const mutations = await mockDetailsGraphql(page, true);
        await page.goto(PAGE_URL);

        // Verify initial state
        await expect(page.getByTestId('array-item-genres-0')).toHaveText('Sci-Fi');
        await expect(page.getByTestId('array-item-genres-1')).toHaveText('Action');

        // 1. Click edit on Genres
        await page.getByTestId('edit-btn-genres').click();

        // 2. Input a comma-separated string
        const input = page.getByTestId('editable-input-genres');
        await input.fill('Horror, Comedy, Thriller');

        // 3. Save changes
        await page.getByTestId('save-btn-genres').click();

        // 4. Verify Zod splitting worked and mutation fired
        await page.waitForTimeout(300);
        expect(mutations.updateScript).toBe(true);
        expect(mutations.lastVariables.genres).toEqual(['Horror', 'Comedy', 'Thriller']);
    });

    test('should enforce Zod validations and block saving', async ({ page }) => {
        const mutations = await mockDetailsGraphql(page, true);
        await page.goto(PAGE_URL);

        await page.getByTestId('edit-btn-title').click();

        // Clear the title (violates z.string().min(1))
        const input = page.getByTestId('editable-input-title');
        await input.fill('');

        // Attempt to save
        await page.getByTestId('save-btn-title').click();

        await page.waitForTimeout(500);

        // Verify the mutation was BLOCKED by Zod
        expect(mutations.updateScript).toBe(false);

        // Verify we are still in edit mode
        await expect(page.getByTestId('editing-badge-title')).toBeVisible();
    });

    test('should cancel edits and restore original value', async ({ page }) => {
        const mutations = await mockDetailsGraphql(page, true);
        await page.goto(PAGE_URL);

        await page.getByTestId('edit-btn-description').click();

        const input = page.getByTestId('editable-input-description');
        await input.fill('This is a completely ruined description.');

        // Click Cancel instead of Save
        await page.getByTestId('cancel-btn-description').click();

        // Verify mutation never fired
        expect(mutations.updateScript).toBe(false);

        // Verify the view reverted
        await expect(page.getByTestId('editable-view-description')).toHaveText('Original Description');
    });

});