import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Contribution from "../../pages/draft/Contribution";

// 1. Mock Global Window Methods
const mockScrollTo = vi.fn();
const mockConfirm = vi.fn();
vi.stubGlobal("scrollTo", mockScrollTo);
vi.stubGlobal("confirm", mockConfirm);

// 2. Mock React Router
const mockNavigate = vi.fn();
let mockOutletContext: any = {};

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: "script-1", paragraphId: "para-1" }),
        useOutletContext: () => mockOutletContext,
    };
});

// 3. Mock React Markdown
vi.mock("react-markdown", () => ({
    default: ({ children }: any) => <div data-testid="markdown-content">{children}</div>,
}));
vi.mock("remark-gfm", () => ({
    default: vi.fn(),
}));

// 4. Mock Store, Analytics, and Toasts
vi.mock("../store/useAuthStore", () => ({
    useUserStore: vi.fn(),
}));

vi.mock("../providers/PostHogProvider", () => ({
    posthog: { capture: vi.fn() },
}));

vi.mock("sonner", () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

// 5. Mock GraphQL Hooks
const mockApprove = vi.fn();
const mockReject = vi.fn();
const mockDelete = vi.fn();
const mockLike = vi.fn();
const mockDislike = vi.fn();
const mockAddComment = vi.fn();

vi.mock("../graphql/generated/graphql", () => ({
    useGetParagraphByIdQuery: vi.fn(),
    useGetScriptByIdQuery: vi.fn(),
    useApproveParagraphMutation: () => [mockApprove, { loading: false }],
    useRejectParagraphMutation: () => [mockReject, { loading: false }],
    useDeleteParagraphMutation: () => [mockDelete, { loading: false }],
    useLikeParagraphMutation: () => [mockLike],
    useDislikeParagraphMutation: () => [mockDislike],
    useAddCommentMutation: () => [mockAddComment, { loading: false }],
}));

// 6. Mock Framer Motion and Child Components
vi.mock("framer-motion", async () => {
    const actual = await vi.importActual("framer-motion");
    return {
        ...actual,
        AnimatePresence: ({ children }: any) => <>{children}</>,
        motion: {
            div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
        },
    };
});

vi.mock("../components/modal/DiscussionPanel", () => ({
    default: () => <div data-testid="discussion-panel" />,
}));
vi.mock("../components/modal/ContributeModal", () => ({
    default: () => <button>Edit Contribution</button>,
}));
vi.mock("../components/modal/DeleteConfirmModal", () => ({
    default: ({ isOpen, onConfirm }: any) =>
        isOpen ? <button onClick={onConfirm} data-testid="confirm-delete-btn">Confirm Delete</button> : null,
}));

import { useGetParagraphByIdQuery, useGetScriptByIdQuery } from "../../graphql/generated/graphql";
import { useUserStore } from "../../store/useAuthStore";
import { toast } from "sonner";
import { posthog } from "../../providers/PostHogProvider";

const mockUseGetParagraph = useGetParagraphByIdQuery as any;
const mockUseGetScript = useGetScriptByIdQuery as any;
const mockUseUserStore = useUserStore as any;

describe("Contribution Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockOutletContext = {}; // Reset permissions
        mockUseUserStore.mockReturnValue({ user: { id: "user-123" } });
    });

    it("should display a loader while fetching data", () => {
        mockUseGetParagraph.mockReturnValue({ loading: true });
        mockUseGetScript.mockReturnValue({ loading: true });

        render(
            <MemoryRouter>
                <Contribution />
            </MemoryRouter>
        );

        expect(screen.queryByText("Failed to load contribution.")).not.toBeInTheDocument();
        // The markdown content shouldn't be rendered yet
        expect(screen.queryByTestId("markdown-content")).not.toBeInTheDocument();
    });

    it("should display an error state if the paragraph fails to load", () => {
        mockUseGetParagraph.mockReturnValue({ loading: false, error: new Error("Failed") });
        mockUseGetScript.mockReturnValue({ loading: false });

        render(
            <MemoryRouter>
                <Contribution />
            </MemoryRouter>
        );

        expect(screen.getByText("Failed to load contribution.")).toBeInTheDocument();
    });

    it("should render the contribution content successfully", () => {
        mockUseGetParagraph.mockReturnValue({
            loading: false,
            data: {
                getParagraphById: {
                    id: "para-1",
                    text: "Once upon a time in a galaxy far away...",
                    status: "PENDING",
                    author: { id: "user-999", name: "George Lucas" },
                    script: { id: "script-1" },
                }
            },
            refetch: vi.fn()
        });
        mockUseGetScript.mockReturnValue({
            loading: false,
            data: { getScriptById: { paragraphs: [] } },
        });

        render(
            <MemoryRouter>
                <Contribution />
            </MemoryRouter>
        );

        expect(screen.getByText("George Lucas")).toBeInTheDocument();
        expect(screen.getByTestId("markdown-content")).toHaveTextContent("Once upon a time in a galaxy far away...");
        expect(screen.getByText("Pending")).toBeInTheDocument();

        // Regular users shouldn't see Approve/Reject buttons
        expect(screen.queryByText("Approve")).not.toBeInTheDocument();
    });

    it("should show Approve and Reject buttons if user has manage access", () => {
        mockOutletContext = { isEditorOrOwner: true }; // Give the user powers via Context

        mockUseGetParagraph.mockReturnValue({
            loading: false,
            data: {
                getParagraphById: {
                    id: "para-1",
                    text: "A great story addition.",
                    status: "PENDING",
                    author: { id: "user-999", name: "Jane Doe" },
                }
            },
            refetch: vi.fn()
        });
        mockUseGetScript.mockReturnValue({ loading: false, data: { getScriptById: { paragraphs: [] } } });

        render(
            <MemoryRouter>
                <Contribution />
            </MemoryRouter>
        );

        expect(screen.getByText("Approve")).toBeInTheDocument();
        expect(screen.getByText("Reject")).toBeInTheDocument();
    });

    it("should call the approve mutation and track analytics when approved", async () => {
        mockOutletContext = { isEditorOrOwner: true };
        const mockRefetch = vi.fn();

        mockUseGetParagraph.mockReturnValue({
            loading: false,
            data: {
                getParagraphById: {
                    id: "para-1",
                    text: "Test content",
                    status: "PENDING",
                    author: { id: "user-999", name: "Jane" },
                    script: { id: "script-1" }
                }
            },
            refetch: mockRefetch
        });
        mockUseGetScript.mockReturnValue({ loading: false, data: { getScriptById: { paragraphs: [] } } });
        mockApprove.mockResolvedValue({ data: {} });

        render(
            <MemoryRouter>
                <Contribution />
            </MemoryRouter>
        );

        const approveBtn = screen.getByText("Approve");
        fireEvent.click(approveBtn);

        await waitFor(() => {
            expect(mockApprove).toHaveBeenCalledWith(expect.objectContaining({
                variables: { paragraphId: "para-1" }
            }));
            expect(posthog.capture).toHaveBeenCalledWith("contribution_approved", { paragraph_id: "para-1", script_id: "script-1" });
            expect(toast.success).toHaveBeenCalledWith("Contribution approved successfully!");
            expect(mockRefetch).toHaveBeenCalled();
        });
    });

    it("should require confirmation to reject a paragraph", async () => {
        mockOutletContext = { isEditorOrOwner: true };
        mockConfirm.mockReturnValue(true); // Simulate clicking "OK" on window.confirm

        mockUseGetParagraph.mockReturnValue({
            loading: false,
            data: {
                getParagraphById: {
                    id: "para-1",
                    text: "Test content",
                    status: "PENDING",
                    author: { id: "user-999", name: "Jane" },
                }
            },
            refetch: vi.fn()
        });
        mockUseGetScript.mockReturnValue({ loading: false, data: { getScriptById: { paragraphs: [] } } });
        mockReject.mockResolvedValue({ data: {} });

        render(
            <MemoryRouter>
                <Contribution />
            </MemoryRouter>
        );

        const rejectBtn = screen.getByText("Reject");
        fireEvent.click(rejectBtn);

        expect(mockConfirm).toHaveBeenCalled();

        await waitFor(() => {
            expect(mockReject).toHaveBeenCalledWith(expect.objectContaining({
                variables: { paragraphId: "para-1" }
            }));
            expect(toast.success).toHaveBeenCalledWith("Contribution rejected.");
        });
    });

    it("should handle liking a paragraph", async () => {
        mockUseGetParagraph.mockReturnValue({
            loading: false,
            data: {
                getParagraphById: {
                    id: "para-1",
                    text: "Test content",
                    likes: [],
                    dislikes: [],
                    author: { id: "user-999", name: "Jane" },
                }
            },
            refetch: vi.fn()
        });
        mockUseGetScript.mockReturnValue({ loading: false, data: { getScriptById: { paragraphs: [] } } });
        mockLike.mockResolvedValue({ data: {} });

        render(
            <MemoryRouter>
                <Contribution />
            </MemoryRouter>
        );

        // Find the thumbs up button (it has a zero next to it initially)
        const likeBtn = screen.getAllByRole("button")[1]; // Depending on DOM order, usually index 1 or 2

        // We can also find it by checking if it contains the thumbs up SVG, but clicking by role/index is faster here
        fireEvent.click(likeBtn);

        await waitFor(() => {
            expect(mockLike).toHaveBeenCalledWith({ variables: { paragraphId: "para-1" } });
        });
    });
});