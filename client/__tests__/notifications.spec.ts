import { test, expect } from '@playwright/test';

test.describe('Notification Modal E2E', () => {

    
    const mockNotificationsGraphql = async (page: any, mockData: any[]) => {
        
        await page.route('**/socket.io/**', (route: any) => route.abort());

        
        let mutationsFired = {
            markRead: false,
            delete: false,
            accept: false,
            decline: false,
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

                
                if (opName === 'GetNotifications') {
                    return route.fulfill({
                        status: 200,
                        headers,
                        body: JSON.stringify({ data: { getNotifications: mockData } })
                    });
                }

                
                if (opName === 'MarkAllNotificationsRead') {
                    mutationsFired.markRead = true;
                    return route.fulfill({ status: 200, headers, body: JSON.stringify({ data: { markAllNotificationsRead: true } }) });
                }

                
                if (opName === 'DeleteNotification') {
                    mutationsFired.delete = true;
                    return route.fulfill({ status: 200, headers, body: JSON.stringify({ data: { deleteNotification: true } }) });
                }

                
                if (opName === 'AcceptInvitation') {
                    mutationsFired.accept = true;
                    return route.fulfill({ status: 200, headers, body: JSON.stringify({ data: { acceptInvitation: true } }) });
                }

                
                if (opName === 'DeclineInvitation') {
                    mutationsFired.decline = true;
                    return route.fulfill({ status: 200, headers, body: JSON.stringify({ data: { declineInvitation: true } }) });
                }
            }
            await route.fallback();
        });

        return mutationsFired;
    };

    const standardMocks = [
        {
            __typename: 'Notification',
            id: 'notif-1',
            type: 'LIKE',
            message: 'John liked your draft "The Matrix"',
            draftTitle: 'The Matrix',
            link: '/drafts/1',
            isRead: false,
            createdAt: Date.now().toString(), 
        },
        {
            __typename: 'Notification',
            id: 'notif-2',
            type: 'REQUEST',
            message: 'Jane invited you to collaborate on "Dune"',
            draftTitle: 'Dune',
            link: '/drafts/2',
            isRead: false,
            createdAt: (Date.now() - 3600000).toString(), 
        }
    ];

    
    
    const PAGE_URL = '/explore';

    test('should display unread dot, open modal, and trigger markAllRead on close', async ({ page }) => {
        const mutations = await mockNotificationsGraphql(page, standardMocks);
        await page.goto(PAGE_URL);

        
        const bellButton = page.getByRole('button', { name: /Notifications/i });
        await expect(bellButton).toBeVisible();

        
        const unreadDot = bellButton.locator('.bg-blue-500.border');
        await expect(unreadDot).toBeVisible();

        
        await bellButton.click();
        await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();

        
        await expect(page.getByText('John liked your draft')).toBeVisible();
        await expect(page.getByText('Jane invited you to collaborate')).toBeVisible();

        
        await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();

        
        await expect(page.getByRole('heading', { name: 'Notifications' })).not.toBeVisible();

        
        await page.waitForTimeout(500);
        expect(mutations.markRead).toBe(true);
    });

    test('should accept an invitation and show optimistic UI', async ({ page }) => {
        const mutations = await mockNotificationsGraphql(page, standardMocks);
        await page.goto(PAGE_URL);

        
        await page.getByRole('button', { name: /Notifications/i }).click();

        
        const acceptButton = page.getByRole('button', { name: 'Accept' });
        await expect(acceptButton).toBeVisible();
        await acceptButton.click();

        
        await expect(page.getByText('Accepted ✓')).toBeVisible();
        expect(mutations.accept).toBe(true);

        
        await page.waitForTimeout(2500);
        expect(mutations.delete).toBe(true);
    });

    test('should delete a notification manually', async ({ page }) => {
        const mutations = await mockNotificationsGraphql(page, standardMocks);
        await page.goto(PAGE_URL);

        
        await page.getByRole('button', { name: /Notifications/i }).click();

        
        const firstNotificationText = page.getByText('John liked your draft');
        await firstNotificationText.hover();

        
        const deleteButton = page.locator('button[title="Delete notification"]').first();

        
        await expect(deleteButton).toBeVisible();
        await deleteButton.click();

        
        await page.waitForTimeout(500);
        expect(mutations.delete).toBe(true);
    });

    test('should show empty state when there are no notifications', async ({ page }) => {
        await mockNotificationsGraphql(page, []); 
        await page.goto(PAGE_URL);

        
        await page.getByRole('button', { name: /Notifications/i }).click();

        
        await expect(page.getByText('All caught up!')).toBeVisible();

        
        await expect(page.getByRole('button', { name: 'Accept' })).not.toBeVisible();
    });

});