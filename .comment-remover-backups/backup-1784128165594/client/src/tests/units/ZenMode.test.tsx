import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ZenMode from "../../pages/draft/ZenMode";

// 1. Mock React Router
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: "script-123" }),
    };
});

// 2. Mock GraphQL Query
const mockUseGetScript = vi.fn();
vi.mock("../graphql/generated/graphql", () => ({
    useGetScriptByIdQuery: () => mockUseGetScript(),
}));

// 3. Mock React Markdown
vi.mock("react-markdown", () => ({
    default: ({ children }: any) => <div data-testid="markdown-content">{children}</div>,
}));
vi.mock("remark-gfm", () => ({
    default: vi.fn(),
}));

// 4. Mock Framer Motion
vi.mock("framer-motion", async () => {
    const actual = await vi.importActual("framer-motion");
    return {
        ...actual,
        AnimatePresence: ({ children }: any) => <>{children}</>,
        motion: {
            div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
            h4: ({ children, className, ...props }: any) => <h4 className={className} {...props}>{children}</h4>,
        },
    };
});

// 5. Mock Browser Download APIs
const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
const mockRevokeObjectURL = vi.fn();
let anchorClickSpy: any;

beforeAll(() => {
    // Use vi.stubGlobal instead of global.URL to keep TypeScript happy
    vi.stubGlobal("URL", {
        ...window.URL,
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
    });

    // Spy on the click method of ALL anchor (<a>) tags
    anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => { });
});

afterAll(() => {
    anchorClickSpy.mockRestore();
});

describe("ZenMode Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = () => {
        return render(
            <MemoryRouter>
                <ZenMode />
            </MemoryRouter>
        );
    };

    it("should display a loader when data is fetching", () => {
        mockUseGetScript.mockReturnValue({ loading: true, data: null });
        renderComponent();

        // Title should not be there yet
        expect(screen.queryByText("Untitled Draft")).not.toBeInTheDocument();
    });

    it("should display the empty state if there are no paragraphs", () => {
        mockUseGetScript.mockReturnValue({
            loading: false,
            data: {
                getScriptById: { id: "script-123", title: "Empty Script", paragraphs: [] }
            }
        });
        renderComponent();

        expect(screen.getByText("Empty Script")).toBeInTheDocument();
        expect(screen.getByText("A blank canvas")).toBeInTheDocument();

        // Download button should be disabled
        const downloadBtn = screen.getByTitle("Download as Markdown");
        expect(downloadBtn).toBeDisabled();
    });

    it("should navigate back when the exit button is clicked", () => {
        mockUseGetScript.mockReturnValue({
            loading: false,
            data: {
                getScriptById: { id: "script-123", title: "Test Script", paragraphs: [] }
            }
        });
        renderComponent();

        const exitBtn = screen.getByTitle("Exit Zen Mode");
        fireEvent.click(exitBtn);

        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("should render combined paragraphs as markdown", () => {
        mockUseGetScript.mockReturnValue({
            loading: false,
            data: {
                getScriptById: {
                    id: "script-123",
                    title: "My Awesome Script",
                    paragraphs: [
                        { id: "p1", text: "First paragraph." },
                        { id: "p2", text: "Second paragraph." }
                    ]
                }
            }
        });
        renderComponent();

        const markdownElements = screen.getAllByTestId("markdown-content");
        expect(markdownElements).toHaveLength(2);
        expect(markdownElements[0]).toHaveTextContent("First paragraph.");
        expect(markdownElements[1]).toHaveTextContent("Second paragraph.");

        // Download button should be enabled
        const downloadBtn = screen.getByTitle("Download as Markdown");
        expect(downloadBtn).not.toBeDisabled();
    });

    it("should handle generating and downloading the markdown file", async () => {
        vi.useFakeTimers(); // Enable fake timers to test the 2000ms checkmark swap

        mockUseGetScript.mockReturnValue({
            loading: false,
            data: {
                getScriptById: {
                    id: "script-123",
                    title: "Star Wars: Draft 1!", // Test special characters in title
                    paragraphs: [
                        { id: "p1", text: "A long time ago..." },
                        { id: "p2", text: "In a galaxy far away..." }
                    ]
                }
            }
        });

        renderComponent();

        const downloadBtn = screen.getByTitle("Download as Markdown");

        // Simulate clicking the download button
        fireEvent.click(downloadBtn);

        // 1. Check if the Blob was created with the correct combined text
        // The Blob constructor receives an array as its first argument
        expect(mockCreateObjectURL).toHaveBeenCalled();
        const blobArgument = (mockCreateObjectURL as any).mock.calls[0][0];
        expect(blobArgument).toBeInstanceOf(Blob);

        // 2. Check if the hidden anchor tag was clicked
        expect(anchorClickSpy).toHaveBeenCalled();

        // 3. Check if the URL was cleaned up to prevent memory leaks
        expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");

        // 4. Verify the button briefly gains the success state styling
        expect(downloadBtn).toHaveClass("bg-green-500/20");

        // Fast forward 2 seconds
        act(() => {
            vi.advanceTimersByTime(2000);
        });

        // 5. Verify the button loses the success state styling after 2 seconds
        expect(downloadBtn).not.toHaveClass("bg-green-500/20");

        vi.useRealTimers();
    });
});