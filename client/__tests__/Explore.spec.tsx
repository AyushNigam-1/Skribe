import { test, expect } from '@playwright/test';

test.describe('Explore Page E2E', () => {

  test('should load explore page, render scripts, and filter locally', async ({ page }) => {

    
    
    
    await page.route('**/graphql', async (route) => {
      const request = route.request();

      
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
            headers: { 'Access-Control-Allow-Origin': '*' }, 
            body: JSON.stringify({
              data: {
                getScriptsByGenres: [
                  {
                    __typename: 'Script', 
                    id: '1',
                    title: 'The Matrix Rewrite',
                    genres: ['Sci-Fi'],
                    description: 'A gritty cyberpunk reboot.',
                    likes: 10,
                    dislikes: 0,
                    languages: ['English'],
                    createdAt: 1704067200000,
                    author: { __typename: 'User', name: 'Neo' }, 
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
                    author: { __typename: 'User', name: 'Juliet' }, 
                  }
                ]
              }
            })
          });
        }
      }

      await route.fallback();
    });

    
    await page.goto('/');

    
    await expect(page.getByText('The Matrix Rewrite')).toBeVisible();
    await expect(page.getByText('Romance in Paris')).toBeVisible();

    
    
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('Matrix');

    
    await expect(page.getByText('The Matrix Rewrite')).toBeVisible();
    await expect(page.getByText('Romance in Paris')).not.toBeVisible();
  });
  test('should trigger network refetch when selecting a genre', async ({ page }) => {
    
    await page.route('**/graphql', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
      }

      const postData = route.request().postDataJSON();

      if (postData && postData.operationName === 'GetScriptsByGenres') {
        
        const isSciFiSelected = postData.variables?.genres?.includes('Romance');

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            data: {
              getScriptsByGenres: isSciFiSelected
                ? [ 
                  {
                    __typename: 'Script',
                    id: '1',
                    title: 'The Matrix Rewrite',
                    genres: ['Sci-Fi'],
                    createdAt: 1704067200000,
                    author: { __typename: 'User', name: 'Neo' },
                  }
                ]
                : [ 
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

    
    await expect(page.getByText('Romance in Paris')).toBeVisible();

    
    await page.getByRole('button', { name: 'Romance' }).click();

    
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

        
        if (attemptCount === 1) {
          return route.fulfill({ status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        
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

    
    await expect(page.getByRole('heading', { name: 'Failed to load drafts' })).toBeVisible();

    
    await page.getByRole('button', { name: 'Try Again' }).click();

    
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
              getScriptsByGenres: [] 
            }
          })
        });
      }
      await route.fallback();
    });

    await page.goto('/explore');

    
    await expect(page.getByRole('heading', { name: 'No Drafts Yet' })).toBeVisible();

    
    await expect(page.getByPlaceholder(/search/i)).not.toBeVisible();
  });
});