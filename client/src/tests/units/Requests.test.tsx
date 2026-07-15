import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Requests from "../../pages/draft/Requests";


const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();
let mockOutletContext: any = { data: { getScriptById: { id: "script-1" } } };

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [mockSearchParams, vi.fn()],
        useOutletContext: () => mockOutletContext,
    };
});


const mockRefetch = vi.fn();
vi.mock("../graphql/generated/graphql", () => ({
    useGetFilteredRequestsQuery: vi.fn(),
}));
import { useGetFilteredRequestsQuery } from "../../graphql/generated/graphql";
const mockUseGetFilteredRequests = useGetFilteredRequestsQuery as any;


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
            div: ({ children, className, onClick, ...props }: any) => (
                <div className={className} onClick={onClick} {...props}>{children}</div>
            ),
        },
    };
});


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

vi.mock("../components/layout/Dropdown", () => ({
    default: ({ value, onChange, options }: any) => (
        <select
            data-testid="status-dropdown"
            value={value.id}
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

vi.mock("../components/modal/ContributeModal", () => ({
    default: () => <button data-testid="contribute-btn">Contribute</button>,
}));

describe("Requests Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchParams = new URLSearchParams(); 
        mockOutletContext = { data: { getScriptById: { id: "script-1" } } };
    });

    const renderComponent = () => {
        return render(
            <MemoryRouter>
                <Requests />
            </MemoryRouter>
        );
    };

    it("should display a loader when data is fetching", () => {
        mockUseGetFilteredRequests.mockReturnValue({ loading: true, data: null });
        renderComponent();
        expect(screen.queryByText("No requests yet")).not.toBeInTheDocument();
    });

    it("should display an error state if the query fails", () => {
        mockUseGetFilteredRequests.mockReturnValue({
            loading: false,
            data: null,
            error: new Error("Network error"),
            refetch: mockRefetch,
        });
        renderComponent();

        expect(screen.getByText(/Error loading requests/i)).toBeInTheDocument();

        
        fireEvent.click(screen.getByText("Retry"));
        expect(mockRefetch).toHaveBeenCalled();
    });

    it("should display the empty state if there are no requests", () => {
        mockUseGetFilteredRequests.mockReturnValue({
            loading: false,
            data: { getFilteredRequests: [] },
            error: null,
        });
        renderComponent();

        expect(screen.getByText("No requests yet")).toBeInTheDocument();
        expect(screen.getByTestId("contribute-btn")).toBeInTheDocument();
    });

    it("should render a list of requests with correct status badges", () => {
        mockUseGetFilteredRequests.mockReturnValue({
            loading: false,
            data: {
                getFilteredRequests: [
                    { id: "req-1", text: "First addition", status: "PENDING", author: { name: "Alice" } },
                    { id: "req-2", text: "Second addition", status: "APPROVED", author: { name: "Bob" } },
                ]
            },
            error: null,
        });
        renderComponent();

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("First addition")).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();

        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.getByText("Second addition")).toBeInTheDocument();
        expect(screen.getByText("Approved")).toBeInTheDocument();
    });

    it("should filter the requests locally when typing in the search bar", () => {
        mockUseGetFilteredRequests.mockReturnValue({
            loading: false,
            data: {
                getFilteredRequests: [
                    { id: "req-1", text: "Apple", author: { name: "Alice" } },
                    { id: "req-2", text: "Banana", author: { name: "Bob" } },
                ]
            },
            error: null,
        });
        renderComponent();

        const searchInput = screen.getByTestId("search-input");

        
        fireEvent.change(searchInput, { target: { value: "Apple" } });

        expect(screen.getByText("Alice")).toBeInTheDocument(); 
        expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    });

    it("should update GraphQL query variables when changing the status dropdown", () => {
        mockUseGetFilteredRequests.mockReturnValue({
            loading: false,
            data: { getFilteredRequests: [] },
            error: null,
        });
        renderComponent();

        
        expect(mockUseGetFilteredRequests).toHaveBeenCalledWith(
            expect.objectContaining({ variables: { scriptId: "script-1" } })
        );

        const dropdown = screen.getByTestId("status-dropdown");

        
        fireEvent.change(dropdown, { target: { value: "approved" } });

        
        
        expect(mockUseGetFilteredRequests).toHaveBeenCalledWith(
            expect.objectContaining({ variables: { scriptId: "script-1", status: "approved" } })
        );
    });

    it("should automatically set search query to author name if userId param is present", () => {
        mockSearchParams = new URLSearchParams("?userId=user-123");

        mockUseGetFilteredRequests.mockReturnValue({
            loading: false,
            data: {
                getFilteredRequests: [
                    { id: "req-1", text: "Apple", author: { name: "John Doe" } },
                ]
            },
            error: null,
        });

        renderComponent();

        
        const searchInput = screen.getByTestId("search-input") as HTMLInputElement;
        expect(searchInput.value).toBe("author:john-doe");

        
        expect(searchInput.placeholder).toBe("Filtering by user...");
    });

    it("should navigate to the contribution page when clicking a request card", () => {
        mockUseGetFilteredRequests.mockReturnValue({
            loading: false,
            data: {
                getFilteredRequests: [
                    { id: "req-999", text: "Click me", status: "PENDING", author: { name: "Alice" } },
                ]
            },
            error: null,
        });
        renderComponent();

        
        const card = screen.getByText("Click me").closest(".group"); 

        if (card) {
            fireEvent.click(card);
        } else {
            
            fireEvent.click(screen.getByText("Click me"));
        }

        expect(mockNavigate).toHaveBeenCalledWith("/contribution/script-1/req-999");
    });
});