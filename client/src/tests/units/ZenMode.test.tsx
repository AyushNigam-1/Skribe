import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ZenMode from "../../pages/draft/ZenMode";


const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: "script-123" }),
    };
});


const mockUseGetScript = vi.fn();
vi.mock("../graphql/generated/graphql", () => ({
    useGetScriptByIdQuery: () => mockUseGetScript(),
}));


vi.mock("react-markdown", () => ({
    default: ({ children }: any) => <div data-testid="markdown-content">{children}</div>,
}));
vi.mock("remark-gfm", () => ({
    default: vi.fn(),
}));


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


const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
const mockRevokeObjectURL = vi.fn();
let anchorClickSpy: any;

beforeAll(() => {
    
    vi.stubGlobal("URL", {
        ...window.URL,
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
    });

    
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

        
        const downloadBtn = screen.getByTitle("Download as Markdown");
        expect(downloadBtn).not.toBeDisabled();
    });

    it("should handle generating and downloading the markdown file", async () => {
        vi.useFakeTimers(); 

        mockUseGetScript.mockReturnValue({
            loading: false,
            data: {
                getScriptById: {
                    id: "script-123",
                    title: "Star Wars: Draft 1!", 
                    paragraphs: [
                        { id: "p1", text: "A long time ago..." },
                        { id: "p2", text: "In a galaxy far away..." }
                    ]
                }
            }
        });

        renderComponent();

        const downloadBtn = screen.getByTitle("Download as Markdown");

        
        fireEvent.click(downloadBtn);

        
        
        expect(mockCreateObjectURL).toHaveBeenCalled();
        const blobArgument = (mockCreateObjectURL as any).mock.calls[0][0];
        expect(blobArgument).toBeInstanceOf(Blob);

        
        expect(anchorClickSpy).toHaveBeenCalled();

        
        expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");

        
        expect(downloadBtn).toHaveClass("bg-green-500/20");

        
        act(() => {
            vi.advanceTimersByTime(2000);
        });

        
        expect(downloadBtn).not.toHaveClass("bg-green-500/20");

        vi.useRealTimers();
    });
});