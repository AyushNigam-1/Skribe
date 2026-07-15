import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Contributors from "../../pages/draft/Contributors";

// 1. Mock React Router's useOutletContext
let mockOutletData: any = { data: null, loading: false };
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
            div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
        },
    };
});

// 3. Mock Child Components
vi.mock("../components/layout/Search", () => ({
    default: ({ value, setSearch }: any) => (
        <input
            data-testid="search-input"
            value={value}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
        />
    ),
}));

vi.mock("../components/layout/Dropdown", () => ({
    default: ({ value, onChange, options }: any) => (
        <select
            data-testid="filter-dropdown"
            value={value.id}
            onChange={(e) => {
                const selected = options.find((o: any) => o.id === Number(e.target.value));
                onChange(selected);
            }}
        >
            {options.map((opt: any) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
        </select>
    ),
}));

describe("Contributors Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockOutletData = { data: null, loading: false };
    });

    const renderComponent = () => {
        return render(
            <MemoryRouter>
                <Contributors />
            </MemoryRouter>
        );
    };

    it("should render a loading spinner when data is loading", () => {
        mockOutletData = { loading: true };
        renderComponent();

        // Search input shouldn't be there yet
        expect(screen.queryByTestId("search-input")).not.toBeInTheDocument();
    });

    it("should display 'No contributors yet' when the paragraph array is empty", () => {
        mockOutletData = {
            loading: false,
            data: { getScriptById: { paragraphs: [] } },
        };
        renderComponent();

        expect(screen.getByText("No contributors yet")).toBeInTheDocument();
        expect(screen.queryByTestId("search-input")).not.toBeInTheDocument();
    });

    it("should correctly group contributors, count contributions, and sort by Highest First by default", () => {
        mockOutletData = {
            loading: false,
            data: {
                getScriptById: {
                    paragraphs: [
                        { id: "p1", author: { id: "u1", name: "Alice" } },
                        { id: "p2", author: { id: "u2", name: "Bob" } },
                        { id: "p3", author: { id: "u1", name: "Alice" } }, // Alice has 2
                        { id: "p4", author: { id: "u3", name: "Charlie" } },
                        { id: "p5", author: { id: "u1", name: "Alice" } }, // Alice has 3
                        { id: "p6", author: { id: "u3", name: "Charlie" } }, // Charlie has 2
                    ],
                },
            },
        };

        renderComponent();

        // Verify all names rendered
        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.getByText("Charlie")).toBeInTheDocument();

        // Verify counts (Alice = 3, Charlie = 2, Bob = 1)
        expect(screen.getByText("3 Contributions")).toBeInTheDocument();
        expect(screen.getByText("2 Contributions")).toBeInTheDocument();
        expect(screen.getByText("1 Contribution")).toBeInTheDocument();

        // Because default sort is "Highest First", the DOM order should be Alice -> Charlie -> Bob
        // The easiest way to test order without querying specific DOM nodes is checking if the list is present
        const headings = screen.getAllByRole('heading', { level: 5 });
        expect(headings[0]).toHaveTextContent("Alice");
        expect(headings[1]).toHaveTextContent("Charlie");
        expect(headings[2]).toHaveTextContent("Bob");
    });

    it("should correctly sort contributors by Lowest First and A-Z", () => {
        mockOutletData = {
            loading: false,
            data: {
                getScriptById: {
                    paragraphs: [
                        { id: "p1", author: { id: "u1", name: "Zebra" } }, // 2
                        { id: "p3", author: { id: "u1", name: "Zebra" } },
                        { id: "p2", author: { id: "u2", name: "Apple" } }, // 1
                        { id: "p4", author: { id: "u3", name: "Banana" } }, // 3
                        { id: "p5", author: { id: "u3", name: "Banana" } },
                        { id: "p6", author: { id: "u3", name: "Banana" } },
                    ],
                },
            },
        };

        renderComponent();

        const dropdown = screen.getByTestId("filter-dropdown");

        // 1. Sort by Lowest First
        fireEvent.change(dropdown, { target: { value: "2" } }); // ID 2 is Lowest First
        let headings = screen.getAllByRole('heading', { level: 5 });
        expect(headings[0]).toHaveTextContent("Apple"); // 1 count
        expect(headings[1]).toHaveTextContent("Zebra"); // 2 count
        expect(headings[2]).toHaveTextContent("Banana"); // 3 count

        // 2. Sort by A-Z
        fireEvent.change(dropdown, { target: { value: "3" } }); // ID 3 is A-Z
        headings = screen.getAllByRole('heading', { level: 5 });
        expect(headings[0]).toHaveTextContent("Apple");
        expect(headings[1]).toHaveTextContent("Banana");
        expect(headings[2]).toHaveTextContent("Zebra");
    });

    it("should filter the contributors list by search query", () => {
        mockOutletData = {
            loading: false,
            data: {
                getScriptById: {
                    paragraphs: [
                        { id: "p1", author: { id: "u1", name: "Alice" } },
                        { id: "p2", author: { id: "u2", name: "Bob" } },
                    ],
                },
            },
        };

        renderComponent();

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();

        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "ali" } });

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    });

    it("should display 'No results found' when search yields zero matches", () => {
        mockOutletData = {
            loading: false,
            data: {
                getScriptById: {
                    paragraphs: [
                        { id: "p1", author: { id: "u1", name: "Alice" } },
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
});