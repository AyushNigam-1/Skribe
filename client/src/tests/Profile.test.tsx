import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Profile from "../pages/home/Profile"; // Adjust path if needed
import { useUserStore } from "../store/useAuthStore";
import * as routerDom from "react-router-dom";

// 1. JSDOM Polyfill for innerText
// JSDOM does not support innerText, which your component uses for the contentEditable div.
// This polyfill maps innerText to textContent so the tests don't crash.
beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "innerText", {
        get() { return this.textContent; },
        set(value) { this.textContent = value; }
    });
});

// 2. Mock React Router
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useParams: vi.fn(),
    };
});

// 3. Mock Zustand Auth Store
vi.mock("../store/useAuthStore", () => ({
    useUserStore: vi.fn(),
}));

// 4. Mock Sonner Toasts
vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        promise: vi.fn(),
    },
}));

// 5. Mock GraphQL Hooks
const mockUpdateProfile = vi.fn();
const mockLikeProfile = vi.fn();
const mockViewProfile = vi.fn();

vi.mock("../graphql/generated/graphql", () => ({
    useGetUserProfileQuery: vi.fn(),
    useGetUserScriptsQuery: vi.fn(),
    useUpdateUserProfileFieldMutation: () => [mockUpdateProfile],
    useLikeProfileMutation: () => [mockLikeProfile, { loading: false }],
    useViewProfileMutation: () => [mockViewProfile],
}));

// 6. Mock Framer Motion
vi.mock("framer-motion", async () => {
    const actual = await vi.importActual("framer-motion");
    return {
        ...actual,
        AnimatePresence: ({ children }: any) => <>{children}</>,
        motion: {
            div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
            button: ({ children, className, onClick, disabled }: any) => (
                <button className={className} onClick={onClick} disabled={disabled}>{children}</button>
            ),
            hr: (props: any) => <hr {...props} />,
            span: ({ children, className }: any) => <span className={className}>{children}</span>,
        },
    };
});

// 7. Mock Child Components
vi.mock("../components/modal/AddDraft", () => ({
    default: () => <button data-testid="add-draft-btn">Add Draft</button>,
}));

vi.mock("../components/card/DraftCard", () => ({
    default: ({ script }: any) => <div data-testid="draft-card">{script.title}</div>,
}));

import { useGetUserProfileQuery, useGetUserScriptsQuery } from "../graphql/generated/graphql";

const mockUseProfileQuery = useGetUserProfileQuery as any;
const mockUseScriptsQuery = useGetUserScriptsQuery as any;
const mockUseParams = routerDom.useParams as any;
const mockUseUserStore = useUserStore as any;

describe("Profile Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default to a successful ViewProfile mutation so it doesn't log unhandled promises
        mockViewProfile.mockResolvedValue({});
        mockUpdateProfile.mockResolvedValue({});
        mockLikeProfile.mockResolvedValue({});
    });

    it("should render the loading state initially", () => {
        mockUseParams.mockReturnValue({ id: "user-123" });
        mockUseUserStore.mockReturnValue({ user: { id: "user-123" } });

        mockUseProfileQuery.mockReturnValue({ data: null, loading: true, error: null });
        mockUseScriptsQuery.mockReturnValue({ data: null, loading: true, error: null });

        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        // Profile heading shouldn't be there yet
        expect(screen.queryByText("About")).not.toBeInTheDocument();
    });

    it("should display the fallback Error / Auth Warning UI when profile query fails", () => {
        mockUseParams.mockReturnValue({ id: "user-123" });
        mockUseUserStore.mockReturnValue({ user: null }); // Not logged in

        mockUseProfileQuery.mockReturnValue({ data: null, loading: false, error: new Error("Auth failed") });
        mockUseScriptsQuery.mockReturnValue({ data: null, loading: false, error: null });

        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        expect(screen.getByText("Authentication Required")).toBeInTheDocument();
    });

    it("should render OWN profile correctly with edit buttons", () => {
        // Current user matches the URL params (Own Profile)
        mockUseParams.mockReturnValue({ id: "user-123" });
        mockUseUserStore.mockReturnValue({ user: { id: "user-123" } });

        mockUseProfileQuery.mockReturnValue({
            data: {
                getUserProfile: {
                    id: "user-123",
                    name: "John Doe",
                    username: "johndoe",
                    bio: "I love writing",
                    likes: ["user-1"],
                    views: ["user-2"],
                }
            },
            loading: false, error: null
        });

        mockUseScriptsQuery.mockReturnValue({ data: null, loading: false, error: null });

        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
        expect(screen.getByText("@johndoe")).toBeInTheDocument(); // Username only appears once

        // "Like Profile" button should NOT be visible on your own profile
        expect(screen.queryByText("Like Profile")).not.toBeInTheDocument();

        // The Add Draft button should be visible since it's your profile
        expect(screen.getByTestId("add-draft-btn")).toBeInTheDocument();
    });

    it("should render SOMEONE ELSE'S profile and allow liking", async () => {
        // Current user is 999, but we are viewing 123's profile
        mockUseParams.mockReturnValue({ id: "user-123" });
        mockUseUserStore.mockReturnValue({ user: { id: "user-999" } });

        mockUseProfileQuery.mockReturnValue({
            data: {
                getUserProfile: {
                    id: "user-123",
                    name: "Jane Smith",
                    username: "janesmith",
                    likes: [],
                    views: [],
                }
            },
            loading: false, error: null
        });

        mockUseScriptsQuery.mockReturnValue({ data: null, loading: false, error: null });

        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        expect(screen.getAllByText("Jane Smith").length).toBeGreaterThan(0);
        // Verify it recorded a profile view
        await waitFor(() => {
            expect(mockViewProfile).toHaveBeenCalledWith({ variables: { profileId: "user-123" } });
        });

        // "Like Profile" button SHOULD be visible
        const likeBtn = screen.getByText("Like Profile");
        expect(likeBtn).toBeInTheDocument();

        // Click Like
        fireEvent.click(likeBtn);

        await waitFor(() => {
            expect(mockLikeProfile).toHaveBeenCalledWith({ variables: { profileId: "user-123" } });
        });
    });

    it("should validate and save profile edits on own profile", async () => {
        mockUseParams.mockReturnValue({ id: "user-123" });
        mockUseUserStore.mockReturnValue({ user: { id: "user-123" } });

        mockUseProfileQuery.mockReturnValue({
            data: {
                getUserProfile: { id: "user-123", name: "John", email: "test@test.com" }
            },
            loading: false, error: null
        });

        mockUseScriptsQuery.mockReturnValue({ data: null, loading: false, error: null });

        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        // 1. Find all edit buttons (Lucide icons render as SVGs, so we can find them by the title or role if added, 
        // or just rely on finding the EditControls wrapper).
        // The easiest way is to click the editable field directly if it has a specific class, or use the Edit2 icon.
        // Since we didn't mock lucide explicitly, we can find the Edit2 button by its wrapper or class.
        // Let's find the button inside the Name row.
        const editButtons = screen.getAllByRole("button");
        const nameEditBtn = editButtons[0]; // Assuming Name is the first field in userDetails

        fireEvent.click(nameEditBtn);

        // Now it should be in edit mode
        expect(screen.getByText("Editing...")).toBeInTheDocument();

        // Simulate typing (we manipulate innerText directly because contentEditable is tricky in tests)
        // The editable div is usually the second one in the DOM order (after the header)
        const editableDivs = screen.getAllByText("John");
        const editableDiv = editableDivs[1] || editableDivs[0];
        editableDiv.innerText = "Johnathan";

        // Simulate pressing Enter to save
        fireEvent.keyDown(editableDiv, { key: "Enter", code: "Enter", charCode: 13 });

        await waitFor(() => {
            expect(mockUpdateProfile).toHaveBeenCalledWith({
                variables: { key: "name", value: "Johnathan" }
            });
        });
    });

    it("should render published scripts if available", () => {
        mockUseParams.mockReturnValue({ id: "user-123" });
        mockUseUserStore.mockReturnValue({ user: { id: "user-123" } });

        mockUseProfileQuery.mockReturnValue({
            data: { getUserProfile: { id: "user-123", name: "John" } },
            loading: false, error: null
        });

        mockUseScriptsQuery.mockReturnValue({
            data: {
                getUserScripts: [
                    { id: "script-1", title: "My First Script" },
                    { id: "script-2", title: "Sci-Fi Adventure" },
                ]
            },
            loading: false, error: null
        });

        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        const cards = screen.getAllByTestId("draft-card");
        expect(cards).toHaveLength(2);
        expect(screen.getByText("My First Script")).toBeInTheDocument();
    });
});