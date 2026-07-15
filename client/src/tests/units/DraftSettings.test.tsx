import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DraftSettings from "../../pages/draft/Settings";


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


vi.mock("../store/useAuthStore", () => ({
    useUserStore: () => ({ user: { id: "user-1", name: "Alice" } }),
}));


vi.mock("sonner", () => ({
    toast: {
        promise: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
    },
}));


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

        
        mockOutletContext = {
            data: { getScriptById: defaultScript },
            isEditorOrOwner: true,
            currentUserRole: "AUTHOR",
            loading: false,
            setTab: vi.fn(),
        };

        
        mockUpdateScript.mockResolvedValue({ data: {} });
        mockDeleteScript.mockResolvedValue({ data: {} });
        mockClearParagraphs.mockResolvedValue({ data: {} });
        mockRemoveAllCollabs.mockResolvedValue({ data: {} });
        mockRemoveCollab.mockResolvedValue({ data: {} });
    });

    
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

        
        const privateRadio = screen.getByDisplayValue("Private");
        fireEvent.click(privateRadio);

        await waitFor(() => {
            expect(mockUpdateScript).toHaveBeenCalledWith({
                variables: {
                    scriptId: "script-123",
                    visibility: "Private",
                    title: "My Script",
                    description: undefined, 
                },
            });
            expect(toast.promise).toHaveBeenCalled();
        });
    });

    it("should filter members by name and role", () => {
        renderAndHydrate();

        
        expect(screen.getByText("Alice")).toBeInTheDocument(); 
        expect(screen.getByText("Bob")).toBeInTheDocument(); 

        
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "bob" } });

        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.queryByText("Alice")).not.toBeInTheDocument();

        
        fireEvent.change(searchInput, { target: { value: "" } });

        
        const dropdown = screen.getAllByTestId("filter-dropdown")[0];
        fireEvent.change(dropdown, { target: { value: "OWNER" } });

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    });

    it("should hide the Danger Zone if the user is an EDITOR but not the AUTHOR", () => {
        mockOutletContext.isEditorOrOwner = true;
        mockOutletContext.currentUserRole = "EDITOR"; 
        renderAndHydrate();

        expect(screen.getByText("Access & Visibility")).toBeInTheDocument();
        expect(screen.queryByText("Danger Zone")).not.toBeInTheDocument();
    });

    it("should handle deleting the draft via the Danger Zone", async () => {
        renderAndHydrate();

        
        const deleteInitBtn = screen.getAllByText("Delete Draft").find(el => el.tagName === "BUTTON");
        fireEvent.click(deleteInitBtn!);

        
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

        
        const removeBtns = screen.getAllByRole("button").filter(b => b.className.includes("text-red-400"));
        fireEvent.click(removeBtns[0]);

        
        expect(screen.getByTestId("delete-modal")).toBeInTheDocument();
        expect(screen.getByText("Remove Member?")).toBeInTheDocument();

        
        fireEvent.click(screen.getByTestId("modal-confirm-btn"));

        await waitFor(() => {
            expect(mockRemoveCollab).toHaveBeenCalledWith({
                variables: { scriptId: "script-123", targetUserId: "user-2" },
            });
            expect(toast.success).toHaveBeenCalledWith("Bob removed from draft.");
        });
    });
});