import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DraftSettings from "../../pages/draft/Settings";

// 1. Mock React Router
const mockNavigate = vi.fn();
let mockOutletContext: any = {};

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useOutletContext: () => mockOutletContext,
    };
});

// 2. Mock Zustand Store
vi.mock("../store/useAuthStore", () => ({
    useUserStore: () => ({ user: { id: "user-1", name: "Alice" } }),
}));

// 3. Mock Sonner
vi.mock("sonner", () => ({
    toast: {
        promise: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// 4. Mock Framer Motion
vi.mock("framer-motion", async () => {
    const actual = await vi.importActual("framer-motion");
    return {
        ...actual,
        AnimatePresence: ({ children }: any) => <>{children}</>,
        motion: {
            div: ({ children, className, onClick, ...props }: any) => (
                <div className={className} onClick={onClick} {...props}>{children}</div>
            ),
            button: ({ children, className, onClick, disabled, ...props }: any) => (
                <button className={className} onClick={onClick} disabled={disabled} {...props}>{children}</button>
            ),
        },
    };
});

// 5. Mock GraphQL Mutations
const mockDeleteScript = vi.fn();
const mockUpdateScript = vi.fn();
const mockRemoveCollab = vi.fn();
const mockUpdateRole = vi.fn();
const mockClearParagraphs = vi.fn();
const mockRemoveAllCollabs = vi.fn();

vi.mock("../graphql/generated/graphql", () => ({
    useDeleteScriptMutation: () => [mockDeleteScript, { loading: false }],
    useUpdateScriptMutation: () => [mockUpdateScript, { loading: false }],
    useRemoveCollaboratorMutation: () => [mockRemoveCollab, { loading: false }],
    useUpdateCollaboratorRoleMutation: () => [mockUpdateRole, { loading: false }],
    useRemoveAllParagraphsMutation: () => [mockClearParagraphs, { loading: false }],
    useRemoveAllCollaboratorsMutation: () => [mockRemoveAllCollabs, { loading: false }],
}));

// 6. Mock Child Components
vi.mock("../components/layout/Search", () => ({
    default: ({ value, setSearch }: any) => (
        <input data-testid="search-input" value={value} onChange={(e) => setSearch(e.target.value)} />
    ),
}));

vi.mock("../components/layout/Dropdown", () => ({
    default: ({ value, onChange, options }: any) => (
        <select
            data-testid="filter-dropdown"
            value={value?.id || "ALL"}
            onChange={(e) => {
                const selected = options.find((o: any) => o.id === e.target.value);
                onChange(selected);
            }}
        >
            {options.map((opt: any) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
        </select>
    ),
}));

vi.mock("../components/modal/InviteModal", () => ({
    default: () => <button>Invite</button>,
}));

vi.mock("../components/modal/DeleteConfirmModal", () => ({
    default: ({ isOpen, onConfirm, title }: any) =>
        isOpen ? (
            <div data-testid="delete-modal">
                <h2>{title}</h2>
                <button onClick={onConfirm} data-testid="modal-confirm-btn">Confirm</button>
            </div>
        ) : null,
}));

import { toast } from "sonner";

describe("DraftSettings Component", () => {
    const defaultScript = {
        id: "script-123",
        title: "My Script",
        visibility: "Public",
        author: { id: "user-1", name: "Alice" },
        collaborators: [
            { role: "EDITOR", user: { id: "user-2", name: "Bob" } },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default context for an OWNER
        mockOutletContext = {
            data: { getScriptById: defaultScript },
            isEditorOrOwner: true,
            currentUserRole: "AUTHOR",
            loading: false,
            setTab: vi.fn(),
        };

        // Ensure mocked mutations return promises since toast.promise wraps them
        mockUpdateScript.mockResolvedValue({ data: {} });
        mockDeleteScript.mockResolvedValue({ data: {} });
        mockClearParagraphs.mockResolvedValue({ data: {} });
        mockRemoveAllCollabs.mockResolvedValue({ data: {} });
        mockRemoveCollab.mockResolvedValue({ data: {} });
    });

    // FIX: Only use fake timers during the hydration render, then immediately restore real timers!
    const renderAndHydrate = () => {
        vi.useFakeTimers();
        render(
            <MemoryRouter>
                <DraftSettings />
            </MemoryRouter>
        );
        act(() => {
            vi.advanceTimersByTime(150);
        });
        vi.useRealTimers();
    };

    it("should show Access Denied if the user is not an editor or owner", () => {
        mockOutletContext.isEditorOrOwner = false;
        mockOutletContext.currentUserRole = "CONTRIBUTOR";
        renderAndHydrate();

        expect(screen.getByText("Access Denied")).toBeInTheDocument();
        expect(screen.queryByText("Access & Visibility")).not.toBeInTheDocument();
    });

    it("should render the settings panel for authorized users", () => {
        renderAndHydrate();

        expect(screen.getByText("Access & Visibility")).toBeInTheDocument();
        expect(screen.getByText("Members & Roles")).toBeInTheDocument();
        expect(screen.getByText("Danger Zone")).toBeInTheDocument();
    });

    it("should trigger an update when changing visibility", async () => {
        renderAndHydrate();

        // Click the "Private" radio button
        const privateRadio = screen.getByDisplayValue("Private");
        fireEvent.click(privateRadio);

        await waitFor(() => {
            expect(mockUpdateScript).toHaveBeenCalledWith({
                variables: {
                    scriptId: "script-123",
                    visibility: "Private",
                    title: "My Script",
                    description: undefined, // description isn't in our mock script
                },
            });
            expect(toast.promise).toHaveBeenCalled();
        });
    });

    it("should filter members by name and role", () => {
        renderAndHydrate();

        // Both should be visible initially
        expect(screen.getByText("Alice")).toBeInTheDocument(); // Owner
        expect(screen.getByText("Bob")).toBeInTheDocument(); // Editor

        // Search for Bob
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "bob" } });

        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.queryByText("Alice")).not.toBeInTheDocument();

        // Clear search, test role filter
        fireEvent.change(searchInput, { target: { value: "" } });

        // FIX: Get the first dropdown (the main filter) instead of throwing an error on multiple dropdowns
        const dropdown = screen.getAllByTestId("filter-dropdown")[0];
        fireEvent.change(dropdown, { target: { value: "OWNER" } });

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    });

    it("should hide the Danger Zone if the user is an EDITOR but not the AUTHOR", () => {
        mockOutletContext.isEditorOrOwner = true;
        mockOutletContext.currentUserRole = "EDITOR"; // Editors can change roles/visibility, but not delete
        renderAndHydrate();

        expect(screen.getByText("Access & Visibility")).toBeInTheDocument();
        expect(screen.queryByText("Danger Zone")).not.toBeInTheDocument();
    });

    it("should handle deleting the draft via the Danger Zone", async () => {
        renderAndHydrate();

        // 1. Click initial "Delete Draft" button
        const deleteInitBtn = screen.getAllByText("Delete Draft").find(el => el.tagName === "BUTTON");
        fireEvent.click(deleteInitBtn!);

        // 2. Click "Yes, Delete It" confirmation button
        const confirmBtn = screen.getByText("Yes, Delete It");
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(mockDeleteScript).toHaveBeenCalledWith({
                variables: { scriptId: "script-123" },
            });
            expect(toast.promise).toHaveBeenCalled();
        });
    });

    it("should handle clearing content via the Danger Zone", async () => {
        renderAndHydrate();

        const clearInitBtn = screen.getByText("Clear Content");
        fireEvent.click(clearInitBtn);

        const confirmBtn = screen.getByText("Yes, Clear It");
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(mockClearParagraphs).toHaveBeenCalledWith({
                variables: { scriptId: "script-123" },
            });
            expect(toast.promise).toHaveBeenCalled();
        });
    });

    it("should handle removing a collaborator", async () => {
        renderAndHydrate();

        // Find Bob's "Remove Member" button (represented by the trash icon/LogOut button)
        const removeBtns = screen.getAllByRole("button").filter(b => b.className.includes("text-red-400"));
        fireEvent.click(removeBtns[0]);

        // Modal should appear
        expect(screen.getByTestId("delete-modal")).toBeInTheDocument();
        expect(screen.getByText("Remove Member?")).toBeInTheDocument();

        // Confirm removal
        fireEvent.click(screen.getByTestId("modal-confirm-btn"));

        await waitFor(() => {
            expect(mockRemoveCollab).toHaveBeenCalledWith({
                variables: { scriptId: "script-123", targetUserId: "user-2" },
            });
            expect(toast.success).toHaveBeenCalledWith("Bob removed from draft.");
        });
    });
});