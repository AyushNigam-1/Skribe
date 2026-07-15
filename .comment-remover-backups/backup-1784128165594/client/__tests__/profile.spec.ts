import { test, expect } from '@playwright/test';

test.describe('Profile Page E2E', () => {

    // We will store the real ID here so we only have to fetch it once!
    let REAL_USER_ID = '';

    // 1. DYNAMIC ID SNIFFER: Steal the real user ID before running the tests
    test.beforeEach(async ({ page }) => {
        if (!REAL_USER_ID) {
            // Set up the listener FIRST to guarantee we catch the request
            const requestPromise = page.waitForRequest((req) => {
                try {
                    const postData = req.postDataJSON();
                    return req.method() === 'POST' &&
                        req.url().includes('/graphql') &&
                        postData?.operationName === 'GetUserFavourites';
                } catch (e) {
                    return false;
                }
            });

            // Navigate to bookmarks, which triggers the query
            await page.goto('/bookmarks');

            // Catch the request and extract the real ID
            const request = await requestPromise;
            REAL_USER_ID = request.postDataJSON().variables.userId;
        }
    });

    // --- HELPER FUNCTION FOR GRAPHQL MOCKING ---
    const mockProfileGraphql = async (page: any, options: { isOwnProfile: boolean, hasScripts: boolean }) => {

        // 2. Use the dynamically captured real ID for "own" profile tests!
        const profileId = options.isOwnProfile ? REAL_USER_ID : 'some-other-user-456';

        await page.route('**/graphql', async (route: any) => {
            const request = route.request();

            // Handle CORS Preflight
            if (request.method() === 'OPTIONS') {
                return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
            }

            if (request.method() === 'POST') {
                const postData = request.postDataJSON();
                const opName = postData?.operationName;
                const headers = { 'Access-Control-Allow-Origin': '*' };

                if (opName === 'GetUserProfile') {
                    return route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        headers,
                        body: JSON.stringify({
                            data: {
                                getUserProfile: {
                                    __typename: 'User',
                                    id: profileId,
                                    name: options.isOwnProfile ? 'My Test User' : 'Another Writer',
                                    username: options.isOwnProfile ? 'mytestuser' : 'anotherwriter',
                                    email: 'test@example.com',
                                    languages: ['English', 'Spanish'],
                                    bio: 'This is a test bio.',
                                    likes: ['user-A', 'user-B'],
                                    views: ['user-A', 'user-C', 'user-D'],
                                }
                            }
                        })
                    });
                }

                if (opName === 'GetUserScripts') {
                    return route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        headers,
                        body: JSON.stringify({
                            data: {
                                getUserScripts: options.hasScripts ? [
                                    {
                                        __typename: 'Script',
                                        id: 's1',
                                        title: 'My Awesome Draft',
                                        genres: ['Sci-Fi'],
                                        createdAt: 1704067200000,
                                        author: { __typename: 'User', name: options.isOwnProfile ? 'My Test User' : 'Another Writer' }
                                    }
                                ] : []
                            }
                        })
                    });
                }

                if (opName === 'ViewProfile' || opName === 'LikeProfile' || opName === 'UpdateUserProfileField') {
                    return route.fulfill({ status: 200, headers, body: JSON.stringify({ data: { [opName.charAt(0).toLowerCase() + opName.slice(1)]: true } }) });
                }
            }
            await route.fallback();
        });

        return profileId;
    };

    // --- THE TESTS ---

    test('should load profile details, stats, and published drafts', async ({ page }) => {
        const profileId = await mockProfileGraphql(page, { isOwnProfile: false, hasScripts: true });
        await page.goto(`/profile/${profileId}`);

        await expect(page.getByRole('heading', { name: 'Another Writer' })).toBeVisible();
        await expect(page.getByText('@anotherwriter')).toBeVisible();
        await expect(page.getByText('This is a test bio.')).toBeVisible();

        // Updated text matching for the stat blocks
        const viewsStat = page.locator('.justify-between', { hasText: 'Profile Views' });
        await expect(viewsStat).toContainText('4');

        const likesStat = page.locator('.justify-between', { hasText: 'Total Likes' });
        await expect(likesStat).toContainText('2');

        await expect(page.getByRole('heading', { name: 'My Awesome Draft' })).toBeVisible();
    });

    test('should allow liking another users profile', async ({ page }) => {
        const profileId = await mockProfileGraphql(page, { isOwnProfile: false, hasScripts: false });
        await page.goto(`/profile/${profileId}`);

        const likeButton = page.getByRole('button', { name: /Like Profile/i });
        await expect(likeButton).toBeVisible();

        await likeButton.click();
        await expect(page.getByRole('button', { name: 'Liked' })).toBeVisible();
    });

    test('should allow inline editing of bio on own profile', async ({ page }) => {
        const profileId = await mockProfileGraphql(page, { isOwnProfile: true, hasScripts: false });
        await page.goto(`/profile/${profileId}`);

        // 1. Scope exactly to the specific row wrapping the Bio field
        // This guarantees we don't accidentally select the whole page!
        const bioRow = page.locator('.flex.flex-col.gap-2').filter({
            has: page.locator('[data-placeholder="Enter your bio..."]')
        });

        // 2. Click the FIRST button inside this specific row (which is the Edit2 icon button)
        await bioRow.locator('button').first().click();

        // 3. Locate the bio text div
        const editableDiv = bioRow.locator('[data-placeholder="Enter your bio..."]');

        // 4. Explicitly wait for React to flip the attribute to true!
        await expect(editableDiv).toHaveAttribute('contenteditable', 'true');

        // 5. Clear and fill the text
        await editableDiv.click();
        await editableDiv.clear();
        await editableDiv.fill('This is my newly updated bio via Playwright!');

        // 6. Click the Save button (which DOES have a title attribute in your React code)
        const saveButton = bioRow.locator('button[title="Save changes"]');
        await expect(saveButton).toBeVisible();
        await saveButton.click();

        // 7. Verify the save completed and the new text is rendered
        await expect(page.getByText('This is my newly updated bio via Playwright!')).toBeVisible();
    });

    test('should show empty drafts state for own profile', async ({ page }) => {
        // This will now use your REAL_USER_ID, showing "You haven't created any drafts yet"
        const profileId = await mockProfileGraphql(page, { isOwnProfile: true, hasScripts: false });
        await page.goto(`/profile/${profileId}`);

        await expect(page.getByRole('heading', { name: 'No drafts yet' })).toBeVisible();
        await expect(page.getByText('You haven\'t created any drafts yet')).toBeVisible();

        await expect(page.getByRole('button', { name: /New/i }).or(page.locator('svg.lucide-plus'))).toBeVisible();
    });

    test('should show empty drafts state for other users profile', async ({ page }) => {
        const profileId = await mockProfileGraphql(page, { isOwnProfile: false, hasScripts: false });
        await page.goto(`/profile/${profileId}`);

        await expect(page.getByRole('heading', { name: 'No drafts yet' })).toBeVisible();
        await expect(page.getByText('This user hasn\'t published any drafts yet.')).toBeVisible();

        const addButton = page.getByRole('button', { name: /New/i });
        await expect(addButton).not.toBeVisible();
    });

});