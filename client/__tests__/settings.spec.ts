import { test, expect } from '@playwright/test';

test.describe('Draft Settings Component E2E', () => {

    let REAL_USER_ID = '';

    // 1. BULLETPROOF ID SNIFFER: Intercept the Notification Query from the Navbar
    test.beforeEach(async ({ page }) => {
        if (!REAL_USER_ID) {
            // Navigate to a generic page to trigger the Navbar mounting
            const navigationPromise = page.goto('/explore');

            // Wait for the GetNotifications query (which we know contains the userId variable)
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

    // --- HELPER FUNCTION FOR GRAPHQL MOCKING ---
    const mockSettingsGraphql = async (page: any, isOwner: boolean = true) => {
        let mutationsFired = {
            updateScript: false,
            updateRole: false,
            removeCollab: false,
            clearContent: false,
            kickAll: false,
            deleteScript: false,
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

                // 1. Mock the Parent Context Query with a UNIQUE ID to bust Apollo Cache!
                if (opName === 'GetScriptById') {
                    return route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        headers,
                        body: JSON.stringify({
                            data: {
                                getScriptById: {
                                    __typename: 'Script',
                                    id: 'script-settings-999',
                                    title: 'My E2E Masterpiece',
                                    description: 'A test script',
                                    visibility: 'Public',
                                    // 🔥 If isOwner is true, we inject Playwright's actual session ID!
                                    author: {
                                        id: isOwner ? REAL_USER_ID : 'stranger-danger-123',
                                        name: isOwner ? 'The Owner' : 'Some Stranger'
                                    },
                                    collaborators: [
                                        { role: 'EDITOR', user: { id: 'user-bob', name: 'Bob Editor' } },
                                        { role: 'CONTRIBUTOR', user: { id: 'user-alice', name: 'Alice Contributor' } }
                                    ]
                                }
                            }
                        })
                    });
                }

                // Mutation Trackers...
                if (opName === 'UpdateScript') {
                    mutationsFired.updateScript = true;
                    return route.fulfill({ status: 200, headers, body: JSON.stringify({ data: { updateScript: true } }) });
                }
                if (opName === 'UpdateCollaboratorRole') {
                    mutationsFired.updateRole = true;
                    return route.fulfill({ status: 200, headers, body: JSON.stringify({ data: { updateCollaboratorRole: true } }) });
                }
                if (opName === 'RemoveCollaborator') {
                    mutationsFired.removeCollab = true;
                    return route.fulfill({ status: 200, headers, body: JSON.stringify({ data: { removeCollaborator: true } }) });
                }
                if (opName === 'RemoveAllParagraphs') {
                    mutationsFired.clearContent = true;
                    return route.fulfill({ status: 200, headers, body: JSON.stringify({ data: { removeAllParagraphs: true } }) });
                }
                if (opName === 'RemoveAllCollaborators') {
                    mutationsFired.kickAll = true;
                    return route.fulfill({ status: 200, headers, body: JSON.stringify({ data: { removeAllCollaborators: true } }) });
                }
                if (opName === 'DeleteScript') {
                    mutationsFired.deleteScript = true;
                    return route.fulfill({ status: 200, headers, body: JSON.stringify({ data: { deleteScript: true } }) });
                }
            }
            await route.fallback();
        });

        return mutationsFired;
    };

    // 🔥 Using our new cache-busting unique ID in the URL
    const PAGE_URL = '/settings/script-settings-999';

    // --- ACCESS CONTROL TEST ---

    test('should display Access Denied for unauthorized users', async ({ page }) => {
        // Pass false so the mock uses 'stranger-danger-123'
        await mockSettingsGraphql(page, false);
        await page.goto(PAGE_URL);

        // Verify the security feature works and kicks us out!
        await expect(page.getByTestId('access-denied-state')).toBeVisible();
        await expect(page.getByText('Access Denied')).toBeVisible();

        // Verify the Danger Zone did NOT render
        await expect(page.getByTestId('delete-draft-btn')).not.toBeVisible();
    });

    // --- AUTHORIZED OWNER TESTS ---

    test('should load visibility options and trigger update mutation on change', async ({ page }) => {
        // True unlocks the Danger Zone by passing the REAL_USER_ID
        const mutations = await mockSettingsGraphql(page, true);
        await page.goto(PAGE_URL);

        await page.getByTestId('visibility-option-Private').click();
        await page.waitForTimeout(300);
        expect(mutations.updateScript).toBe(true);
    });

    test('should filter members via search input', async ({ page }) => {
        await mockSettingsGraphql(page, true);
        await page.goto(PAGE_URL);

        // Verify default visibility
        await expect(page.getByTestId(`member-card-${REAL_USER_ID}`)).toBeVisible();
        await expect(page.getByTestId('member-card-user-bob')).toBeVisible();
        await expect(page.getByTestId('member-card-user-alice')).toBeVisible();

        const searchInput = page.getByTestId('members-search-wrapper').locator('input');
        await searchInput.fill('Bob');

        await expect(page.getByTestId('member-card-user-bob')).toBeVisible();
        await expect(page.getByTestId(`member-card-${REAL_USER_ID}`)).not.toBeVisible();
        await expect(page.getByTestId('member-card-user-alice')).not.toBeVisible();
    });

    test('should update a collaborators role', async ({ page }) => {
        const mutations = await mockSettingsGraphql(page, true);
        await page.goto(PAGE_URL);

        await page.getByTestId('role-dropdown-user-bob').click();
        await page.getByTestId('dropdown-option-Contributor').click();

        await page.waitForTimeout(300);
        expect(mutations.updateRole).toBe(true);
    });

    // --- DANGER ZONE TESTS ---

    test('should execute Danger Zone: Clear Content', async ({ page }) => {
        const mutations = await mockSettingsGraphql(page, true);
        await page.goto(PAGE_URL);

        await page.getByTestId('clear-content-btn').click();
        await page.getByTestId('confirm-clear-btn').click();

        await page.waitForTimeout(300);
        expect(mutations.clearContent).toBe(true);
    });

    test('should execute Danger Zone: Kick All Members', async ({ page }) => {
        const mutations = await mockSettingsGraphql(page, true);
        await page.goto(PAGE_URL);

        await page.getByTestId('kick-all-btn').click();
        await page.getByTestId('confirm-kick-btn').click();

        await page.waitForTimeout(300);
        expect(mutations.kickAll).toBe(true);
    });

    test('should execute Danger Zone: Delete Draft and redirect', async ({ page }) => {
        const mutations = await mockSettingsGraphql(page, true);
        await page.goto(PAGE_URL);

        await page.getByTestId('delete-draft-btn').click();
        await page.getByTestId('confirm-delete-btn').click();

        await page.waitForTimeout(300);
        expect(mutations.deleteScript).toBe(true);

        await expect(page).toHaveURL(/.*\/explore/);
    });

});