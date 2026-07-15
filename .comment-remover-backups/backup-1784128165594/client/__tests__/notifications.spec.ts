import { test, expect } from '@playwright/test';

test.describe('Notification Modal E2E', () => {

    // --- HELPER FUNCTION FOR GRAPHQL MOCKING ---
    const mockNotificationsGraphql = async (page: any, mockData: any[]) => {
        // 1. Block Socket.io so it doesn't spam the network tab or hang the test
        await page.route('**/socket.io/**', (route: any) => route.abort());

        // Track if mutations were called
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

                // Query: Fetch Notifications
                if (opName === 'GetNotifications') {
                    return route.fulfill({
                        status: 200,
                        headers,
                        body: JSON.stringify({ data: { getNotifications: mockData } })
                    });
                }

                // Mutation: Mark All Read
                if (opName === 'MarkAllNotificationsRead') {
                    mutationsFired.markRead = true;
                    return route.fulfill({ status: 200, headers, body: JSON.stringify({ data: { markAllNotificationsRead: true } }) });
                }

                // Mutation: Delete Notification
                if (opName === 'DeleteNotification') {
                    mutationsFired.delete = true;
                    return route.fulfill({ status: 200, headers, body: JSON.stringify({ data: { deleteNotification: true } }) });
                }

                // Mutation: Accept Invite
                if (opName === 'AcceptInvitation') {
                    mutationsFired.accept = true;
                    return route.fulfill({ status: 200, headers, body: JSON.stringify({ data: { acceptInvitation: true } }) });
                }

                // Mutation: Decline Invite
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
            createdAt: Date.now().toString(), // Just now
        },
        {
            __typename: 'Notification',
            id: 'notif-2',
            type: 'REQUEST',
            message: 'Jane invited you to collaborate on "Dune"',
            draftTitle: 'Dune',
            link: '/drafts/2',
            isRead: false,
            createdAt: (Date.now() - 3600000).toString(), // 1 hr ago
        }
    ];

    // Note: We assume the Notification bell is visible on the /explore page.
    // Update this path if you test it on a different page.
    const PAGE_URL = '/explore';

    test('should display unread dot, open modal, and trigger markAllRead on close', async ({ page }) => {
        const mutations = await mockNotificationsGraphql(page, standardMocks);
        await page.goto(PAGE_URL);

        // 1. Find the Bell button and verify the blue unread dot is present
        const bellButton = page.getByRole('button', { name: /Notifications/i });
        await expect(bellButton).toBeVisible();

        // We check for the blue dot by looking for the ping animation element inside the button
        const unreadDot = bellButton.locator('.bg-blue-500.border');
        await expect(unreadDot).toBeVisible();

        // 2. Open the modal
        await bellButton.click();
        await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();

        // 3. Verify notifications are rendered
        await expect(page.getByText('John liked your draft')).toBeVisible();
        await expect(page.getByText('Jane invited you to collaborate')).toBeVisible();

        // 4. Close the modal using the X button
        await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();

        // 5. Verify the modal closed
        await expect(page.getByRole('heading', { name: 'Notifications' })).not.toBeVisible();

        // 6. Wait a tiny bit and assert the MarkAllRead mutation fired
        await page.waitForTimeout(500);
        expect(mutations.markRead).toBe(true);
    });

    test('should accept an invitation and show optimistic UI', async ({ page }) => {
        const mutations = await mockNotificationsGraphql(page, standardMocks);
        await page.goto(PAGE_URL);

        // Open modal
        await page.getByRole('button', { name: /Notifications/i }).click();

        // Find the Request notification and click Accept
        const acceptButton = page.getByRole('button', { name: 'Accept' });
        await expect(acceptButton).toBeVisible();
        await acceptButton.click();

        // Verify optimistic UI change
        await expect(page.getByText('Accepted ✓')).toBeVisible();
        expect(mutations.accept).toBe(true);

        // Wait for the 2000ms setTimeout in your component to trigger the delete mutation
        await page.waitForTimeout(2500);
        expect(mutations.delete).toBe(true);
    });

    test('should delete a notification manually', async ({ page }) => {
        const mutations = await mockNotificationsGraphql(page, standardMocks);
        await page.goto(PAGE_URL);

        // Open modal
        await page.getByRole('button', { name: /Notifications/i }).click();

        // 1. Target the specific notification and hover over it to trigger your CSS group-hover!
        const firstNotificationText = page.getByText('John liked your draft');
        await firstNotificationText.hover();

        // 2. Now that we are hovering, target the delete button
        const deleteButton = page.locator('button[title="Delete notification"]').first();

        // 3. Verify it actually became visible, then click it
        await expect(deleteButton).toBeVisible();
        await deleteButton.click();

        // 4. Verify the backend mutation fired
        await page.waitForTimeout(500);
        expect(mutations.delete).toBe(true);
    });

    test('should show empty state when there are no notifications', async ({ page }) => {
        await mockNotificationsGraphql(page, []); // Empty array
        await page.goto(PAGE_URL);

        // Open modal
        await page.getByRole('button', { name: /Notifications/i }).click();

        // Verify empty state
        await expect(page.getByText('All caught up!')).toBeVisible();

        // Ensure no Accept/Decline buttons exist
        await expect(page.getByRole('button', { name: 'Accept' })).not.toBeVisible();
    });

});