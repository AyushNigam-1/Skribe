import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Timeline from "../pages/draft/Timeline";

// 1. Mock React Router
let mockOutletData: any = { data: null, loading: false, refetch: vi.fn() };

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useOutletContext: () => mockOutletData,
    };
});

// 2. Mock Framer Motion
vi.mock("framer-motion", async () => {
    const actual = await vi.importActual("framer-motion");
    return {
        ...actual,
        AnimatePresence: ({ children }: any) => <>{children}</>,
        motion: {
            div: ({ children, className, layout, ...props }: any) => (
                <div className={className} {...props}>{children}</div>
            ),
        },
    };
});

// 3. Mock React Markdown
// We specifically execute your custom "p" component so your `highlightContent` function runs!
vi.mock("react-markdown", () => ({
    default: ({ children, components }: any) => {
        if (components && components.p) {
            return components.p({ children });
        }
        return <div data-testid="markdown-content">{children}</div>;
    },
}));

vi.mock("remark-gfm", () => ({
    default: vi.fn(),
}));

// 4. Mock Child Components
vi.mock("../components/layout/Search", () => ({
    default: ({ value, setSearch, placeholder }: any) => (
        <input
            data-testid="search-input"
            value={value}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
        />
    ),
}));

vi.mock("../components/modal/ContributeModal", () => ({
    default: () => <button data-testid="contribute-btn">Contribute</button>,
}));

describe("Timeline Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockOutletData = { data: null, loading: false, refetch: vi.fn() };
    });

    const renderComponent = () => {
        return render(
            <MemoryRouter>
                <Timeline />
            </MemoryRouter>
        );
    };

    it("should display a loader when data is loading", () => {
        mockOutletData = { loading: true, data: null, refetch: vi.fn() };
        renderComponent();

        expect(screen.queryByText("No contributions yet")).not.toBeInTheDocument();
        expect(screen.queryByTestId("search-input")).not.toBeInTheDocument();
    });

    it("should display the empty state when there are no paragraphs", () => {
        mockOutletData = {
            loading: false,
            refetch: vi.fn(),
            data: { getScriptById: { id: "script-1", paragraphs: [], visibility: "PUBLIC" } },
        };
        renderComponent();

        expect(screen.getByText("No contributions yet")).toBeInTheDocument();
        expect(screen.getByTestId("contribute-btn")).toBeInTheDocument();
    });

    it("should hide the Contribute button if the script is archived", () => {
        mockOutletData = {
            loading: false,
            refetch: vi.fn(),
            data: { getScriptById: { id: "script-1", paragraphs: [], visibility: "ARCHIVED" } },
        };
        renderComponent();

        expect(screen.getByText("No contributions yet")).toBeInTheDocument();
        // Because it's archived, the button should be gone
        expect(screen.queryByTestId("contribute-btn")).not.toBeInTheDocument();
    });

    it("should render a list of paragraphs sorted by date (newest first)", () => {
        mockOutletData = {
            loading: false,
            refetch: vi.fn(),
            data: {
                getScriptById: {
                    id: "script-1",
                    visibility: "PUBLIC",
                    paragraphs: [
                        { id: "p1", text: "Oldest text", author: { name: "Alice" }, createdAt: "1000" },
                        { id: "p2", text: "Newest text", author: { name: "Bob" }, createdAt: "2000" },
                    ],
                },
            },
        };

        renderComponent();

        // Both texts should be present
        expect(screen.getByText("Oldest text")).toBeInTheDocument();
        expect(screen.getByText("Newest text")).toBeInTheDocument();

        // Verify DOM order (Newest should render before Oldest due to sorting)
        const links = screen.getAllByRole("link");
        expect(links[0]).toHaveTextContent("Bob");
        expect(links[1]).toHaveTextContent("Alice");
    });

    it("should filter paragraphs based on search query", () => {
        mockOutletData = {
            loading: false,
            refetch: vi.fn(),
            data: {
                getScriptById: {
                    id: "script-1",
                    visibility: "PUBLIC",
                    paragraphs: [
                        { id: "p1", text: "Apple", author: { name: "Alice" }, createdAt: "1000" },
                        { id: "p2", text: "Banana", author: { name: "Bob" }, createdAt: "2000" },
                    ],
                },
            },
        };

        renderComponent();

        const searchInput = screen.getByTestId("search-input");

        // Type "Apple"
        fireEvent.change(searchInput, { target: { value: "Apple" } });

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    });

    it("should display 'No results found' when search yields zero matches", () => {
        mockOutletData = {
            loading: false,
            refetch: vi.fn(),
            data: {
                getScriptById: {
                    id: "script-1",
                    visibility: "PUBLIC",
                    paragraphs: [
                        { id: "p1", text: "Apple", author: { name: "Alice" }, createdAt: "1000" },
                    ],
                },
            },
        };

        renderComponent();

        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "Zebra" } });

        expect(screen.getByText("No results found")).toBeInTheDocument();
        expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    });

    it("should highlight matched text using the <mark> tag", () => {
        mockOutletData = {
            loading: false,
            refetch: vi.fn(),
            data: {
                getScriptById: {
                    id: "script-1",
                    visibility: "PUBLIC",
                    paragraphs: [
                        { id: "p1", text: "The quick brown fox", author: { name: "Alice" }, createdAt: "1000" },
                    ],
                },
            },
        };

        renderComponent();

        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "brown" } });

        // The text "brown" should be wrapped in a <mark> tag by your highlightContent function
        const highlightedElement = screen.getByText("brown");
        expect(highlightedElement.tagName).toBe("MARK");
        expect(highlightedElement).toHaveClass("bg-amber-500/40");
    });
});