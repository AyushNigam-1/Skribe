import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Contributors from "../../pages/draft/Contributors";


let mockOutletData: any = { data: null, loading: false };
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useOutletContext: () => mockOutletData,
    };
});


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
                        { id: "p3", author: { id: "u1", name: "Alice" } }, 
                        { id: "p4", author: { id: "u3", name: "Charlie" } },
                        { id: "p5", author: { id: "u1", name: "Alice" } }, 
                        { id: "p6", author: { id: "u3", name: "Charlie" } }, 
                    ],
                },
            },
        };

        renderComponent();

        
        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.getByText("Charlie")).toBeInTheDocument();

        
        expect(screen.getByText("3 Contributions")).toBeInTheDocument();
        expect(screen.getByText("2 Contributions")).toBeInTheDocument();
        expect(screen.getByText("1 Contribution")).toBeInTheDocument();

        
        
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
                        { id: "p1", author: { id: "u1", name: "Zebra" } }, 
                        { id: "p3", author: { id: "u1", name: "Zebra" } },
                        { id: "p2", author: { id: "u2", name: "Apple" } }, 
                        { id: "p4", author: { id: "u3", name: "Banana" } }, 
                        { id: "p5", author: { id: "u3", name: "Banana" } },
                        { id: "p6", author: { id: "u3", name: "Banana" } },
                    ],
                },
            },
        };

        renderComponent();

        const dropdown = screen.getByTestId("filter-dropdown");

        
        fireEvent.change(dropdown, { target: { value: "2" } }); 
        let headings = screen.getAllByRole('heading', { level: 5 });
        expect(headings[0]).toHaveTextContent("Apple"); 
        expect(headings[1]).toHaveTextContent("Zebra"); 
        expect(headings[2]).toHaveTextContent("Banana"); 

        
        fireEvent.change(dropdown, { target: { value: "3" } }); 
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