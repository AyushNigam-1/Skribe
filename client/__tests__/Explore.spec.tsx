import { test, expect } from '@playwright/test';

test.describe('Explore Page E2E', () => {

  test('should load explore page, render scripts, and filter locally', async ({ page }) => {

    // 1. Intercept the GraphQL network request
    // Adjust '**/graphql' if your API endpoint is different (e.g., '**/api/graphql')
    // 1. Intercept the GraphQL network request
    await page.route('**/graphql', async (route) => {
      const request = route.request();

      // FIX 1: Handle CORS Preflight requests
      if (request.method() === 'OPTIONS') {
        return route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          },
        });
      }

      if (request.method() === 'POST') {
        const postData = request.postDataJSON();

        if (postData && postData.operationName === 'GetScriptsByGenres') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'Access-Control-Allow-Origin': '*' }, // Prevent CORS blocking
            body: JSON.stringify({
              data: {
                getScriptsByGenres: [
                  {
                    __typename: 'Script', // FIX 2: Apollo requires this for caching!
                    id: '1',
                    title: 'The Matrix Rewrite',
                    genres: ['Sci-Fi'],
                    description: 'A gritty cyberpunk reboot.',
                    likes: 10,
                    dislikes: 0,
                    languages: ['English'],
                    createdAt: 1704067200000,
                    author: { __typename: 'User', name: 'Neo' }, // Required!
                  },
                  {
                    __typename: 'Script',
                    id: '2',
                    title: 'Romance in Paris',
                    genres: ['Romance'],
                    description: 'A lovely draft about the Eiffel Tower.',
                    likes: 5,
                    dislikes: 1,
                    languages: ['French'],
                    createdAt: 1704067200000,
                    author: { __typename: 'User', name: 'Juliet' }, // Required!
                  }
                ]
              }
            })
          });
        }
      }

      await route.fallback();
    });

    // 2. Navigate to the Explore page
    await page.goto('/');

    // 3. Verify the mocked data rendered on the screen
    await expect(page.getByText('The Matrix Rewrite')).toBeVisible();
    await expect(page.getByText('Romance in Paris')).toBeVisible();

    // 4. Test the local search filtering (useMemo logic)
    // Update the placeholder text if your Search component uses different text
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('Matrix');

    // 5. Verify the UI updated correctly
    await expect(page.getByText('The Matrix Rewrite')).toBeVisible();
    await expect(page.getByText('Romance in Paris')).not.toBeVisible();
  });
  test('should trigger network refetch when selecting a genre', async ({ page }) => {
    // 1. Setup route to handle BOTH the initial load and the genre click
    await page.route('**/graphql', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
      }

      const postData = route.request().postDataJSON();

      if (postData && postData.operationName === 'GetScriptsByGenres') {
        // Check if the variables contain our selected genre
        const isSciFiSelected = postData.variables?.genres?.includes('Romance');

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            data: {
              getScriptsByGenres: isSciFiSelected
                ? [ /* Return ONLY Sci-Fi scripts when clicked */
                  {
                    __typename: 'Script',
                    id: '1',
                    title: 'The Matrix Rewrite',
                    genres: ['Sci-Fi'],
                    createdAt: 1704067200000,
                    author: { __typename: 'User', name: 'Neo' },
                  }
                ]
                : [ /* Return default mixed scripts on initial load */
                  {
                    __typename: 'Script',
                    id: '2',
                    title: 'Romance in Paris',
                    genres: ['Romance'],
                    createdAt: 1704067200000,
                    author: { __typename: 'User', name: 'Juliet' },
                  }
                ]
            }
          })
        });
      }
      await route.fallback();
    });

    await page.goto('/explore');

    // Initially, we should only see Romance (based on our mock logic above)
    await expect(page.getByText('Romance in Paris')).toBeVisible();

    // Click the "Sci-Fi" genre button/pill (adjust selector to match your <Genres /> component)
    await page.getByRole('button', { name: 'Romance' }).click();

    // Verify the UI updated based on the NEW network request!
    await expect(page.getByText('The Matrix Rewrite')).toBeVisible();
    await expect(page.getByText('Romance in Paris')).not.toBeVisible();
  });
  test('should display error state and recover when clicking Try Again', async ({ page }) => {
    let attemptCount = 0;

    await page.route('**/graphql', async (route) => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });

      const postData = route.request().postDataJSON();
      if (postData && postData.operationName === 'GetScriptsByGenres') {
        attemptCount++;

        // Force a 500 Internal Server Error on the first try!
        if (attemptCount === 1) {
          return route.fulfill({ status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        // Succeed on the second try!
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            data: {
              getScriptsByGenres: [{
                __typename: 'Script', id: '1', title: 'Recovery Success!', genres: ['Sci-Fi'], createdAt: 1704067200000, author: { __typename: 'User', name: 'Neo' },
              }]
            }
          })
        });
      }
      await route.fallback();
    });

    await page.goto('/explore');

    // Verify the Error State is visible
    await expect(page.getByRole('heading', { name: 'Failed to load drafts' })).toBeVisible();

    // Click the Try Again action button inside the PlaceholderState
    await page.getByRole('button', { name: 'Try Again' }).click();

    // Verify the error goes away and the data loads!
    await expect(page.getByRole('heading', { name: 'Failed to load drafts' })).not.toBeVisible();
    await expect(page.getByText('Recovery Success!')).toBeVisible();
  });
  test('should display global empty state when database has zero scripts', async ({ page }) => {
    await page.route('**/graphql', async (route) => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });

      const postData = route.request().postDataJSON();
      if (postData && postData.operationName === 'GetScriptsByGenres') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            data: {
              getScriptsByGenres: [] // Return absolute zero scripts
            }
          })
        });
      }
      await route.fallback();
    });

    await page.goto('/explore');

    // Verify the specific empty state appears
    await expect(page.getByRole('heading', { name: 'No Drafts Yet' })).toBeVisible();

    // Verify the search bar is completely hidden as designed
    await expect(page.getByPlaceholder(/search/i)).not.toBeVisible();
  });
});