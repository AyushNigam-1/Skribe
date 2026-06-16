import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import NotificationModal from "../pages/home/Notifications"; // Adjust path if needed
import { useUserStore } from "../store/useAuthStore";
import { useApolloClient } from "@apollo/client";

// 1. Mock Socket.io
const mockSocketOn = vi.fn();
const mockSocketEmit = vi.fn();
const mockSocketDisconnect = vi.fn();

vi.mock("socket.io-client", () => ({
    io: vi.fn(() => ({
        on: mockSocketOn,
        emit: mockSocketEmit,
        disconnect: mockSocketDisconnect,
    })),
}));

// 2. Mock Sonner
vi.mock("sonner", () => ({
    toast: { promise: vi.fn() },
}));

// 3. Mock Headless UI Dialog
// Headless UI portals things out of the DOM, which makes testing tricky.
// We mock it to render directly inline so we can find the elements easily.
vi.mock("@headlessui/react", () => ({
    Dialog: ({ open, children, onClose }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
    DialogPanel: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h3>{children}</h3>,
    DialogBackdrop: () => null,
}));

// 4. Mock Apollo Client Cache
// 4. Mock Apollo Client Cache (and preserve 'gql')
const mockCacheUpdateQuery = vi.fn();
vi.mock("@apollo/client", async () => {
    const actual = await vi.importActual("@apollo/client");
    return {
        ...actual,
        useApolloClient: vi.fn(() => ({
            cache: { updateQuery: mockCacheUpdateQuery },
        })),
    };
});

// 5. Mock GraphQL Mutations and Queries
const mockMarkAllRead = vi.fn();
const mockDeleteNotification = vi.fn();
const mockAcceptInvite = vi.fn();
const mockDeclineInvite = vi.fn();

// We need to provide dummy Document definitions since your component imports them for cache updates
vi.mock("../graphql/generated/graphql", () => ({
    GetNotificationsDocument: {},
    useGetNotificationsQuery: vi.fn(),
    useMarkAllNotificationsReadMutation: () => [mockMarkAllRead],
    useDeleteNotificationMutation: () => [mockDeleteNotification],
    useAcceptInvitationMutation: () => [mockAcceptInvite, { loading: false }],
    useDeclineInvitationMutation: () => [mockDeclineInvite, { loading: false }],
}));

import { useGetNotificationsQuery } from "../graphql/generated/graphql";
const mockUseGetNotifications = useGetNotificationsQuery as any;

// 6. Mock Zustand
vi.mock("../store/useAuthStore", () => {
    return {
        useUserStore: vi.fn(),
    };
});
const mockUseUserStore = useUserStore as any;

// 7. Mock Framer Motion
vi.mock("framer-motion", async () => {
    const actual = await vi.importActual("framer-motion");
    return {
        ...actual,
        AnimatePresence: ({ children }: any) => <>{children}</>,
        motion: {
            div: ({ children, className, onClick }: any) => (
                <div className={className} onClick={onClick}>{children}</div>
            ),
        },
    };
});

describe("NotificationModal Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseUserStore.mockReturnValue({ user: { id: "user-123" } });

        // Default promise resolutions to prevent unhandled rejection warnings
        mockAcceptInvite.mockResolvedValue({});
        mockDeclineInvite.mockResolvedValue({});
        mockDeleteNotification.mockResolvedValue({});
    });

    it("should render the bell icon and open the modal when clicked", () => {
        mockUseGetNotifications.mockReturnValue({
            data: { getNotifications: [] }, loading: false, error: null,
        });

        render(
            <MemoryRouter>
                <NotificationModal />
            </MemoryRouter>
        );

        // Initial state: Modal is closed
        expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();

        // Click the bell button
        const bellBtn = screen.getByText("Notifications");
        fireEvent.click(bellBtn);

        // Modal should be open
        expect(screen.getByTestId("dialog")).toBeInTheDocument();
        expect(screen.getByText("All caught up!")).toBeInTheDocument();
    });

    it("should display a list of notifications", () => {
        mockUseGetNotifications.mockReturnValue({
            data: {
                getNotifications: [
                    { id: "1", type: "LIKE", message: "User liked your draft", isRead: false, link: "/draft/1" },
                    { id: "2", type: "COMMENT", message: "User commented", isRead: true, link: "/draft/1" },
                ],
            },
            loading: false, error: null,
        });

        render(
            <MemoryRouter>
                <NotificationModal />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText("Notifications"));

        expect(screen.getByText("User liked your contribution")).toBeInTheDocument();
        expect(screen.getByText("User commented")).toBeInTheDocument();
    });

    it("should trigger markAllRead when closing the modal if there are unread notifications", () => {
        mockUseGetNotifications.mockReturnValue({
            data: {
                getNotifications: [
                    { id: "1", type: "LIKE", message: "User liked your draft", isRead: false },
                ],
            },
            loading: false, error: null,
        });

        render(
            <MemoryRouter>
                <NotificationModal />
            </MemoryRouter>
        );

        // Open modal
        fireEvent.click(screen.getByText("Notifications"));

        // Close modal (assuming the X button is the first button inside the modal dialog)
        // We can find it by the close icon. The simplest way is to query buttons in the dialog.
        const closeBtn = screen.getByTestId("dialog").querySelector("button");
        fireEvent.click(closeBtn!);

        expect(mockMarkAllRead).toHaveBeenCalled();
    });

    it("should handle accepting an invitation", async () => {
        mockUseGetNotifications.mockReturnValue({
            data: {
                getNotifications: [
                    { id: "notif-1", type: "REQUEST", message: "User invited you", isRead: false, link: "/draft/script-abc" },
                ],
            },
            loading: false, error: null,
        });

        render(
            <MemoryRouter>
                <NotificationModal />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText("Notifications"));

        const acceptBtn = screen.getByText("Accept");
        fireEvent.click(acceptBtn);

        // Should call the accept mutation with the extracted script ID
        await waitFor(() => {
            expect(mockAcceptInvite).toHaveBeenCalledWith({ variables: { scriptId: "script-abc" } });
        });

        // The UI should update to show "Accepted ✓"
        expect(await screen.findByText("Accepted ✓")).toBeInTheDocument();
    });

    it("should trigger delete notification when clicking the trash icon", async () => {
        mockUseGetNotifications.mockReturnValue({
            data: {
                getNotifications: [
                    { id: "notif-1", type: "LIKE", message: "User liked your draft", isRead: true, link: "/draft/1" },
                ],
            },
            loading: false, error: null,
        });

        render(
            <MemoryRouter>
                <NotificationModal />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText("Notifications"));

        // Find the trash button (it has the title "Delete notification")
        const deleteBtn = screen.getByTitle("Delete notification");
        fireEvent.click(deleteBtn);

        await waitFor(() => {
            expect(mockDeleteNotification).toHaveBeenCalledWith({ variables: { id: "notif-1" } });
        });
    });

    it("should setup WebSocket connection on mount", () => {
        mockUseGetNotifications.mockReturnValue({
            data: { getNotifications: [] }, loading: false, error: null,
        });

        render(
            <MemoryRouter>
                <NotificationModal />
            </MemoryRouter>
        );

        // Verify Socket.io was initialized and 'setup' was emitted
        expect(mockSocketEmit).toHaveBeenCalledWith("setup", "user-123");
        expect(mockSocketOn).toHaveBeenCalledWith("new notification", expect.any(Function));
    });
});