import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import MyContributions from "../../pages/home/Contributions";  // Adjust path if needed
import { useGetUserContributionsQuery } from "../../graphql/generated/graphql";
import { useUserStore } from "../../store/useAuthStore";

// 1. Mock the GraphQL Hook
vi.mock("../graphql/generated/graphql", () => ({
    useGetUserContributionsQuery: vi.fn(),
}));

// 2. Mock the Zustand Auth Store
vi.mock("../store/useAuthStore", () => ({
    useUserStore: vi.fn(),
}));

// 3. Mock Framer Motion
vi.mock("framer-motion", async () => {
    const actual = await vi.importActual("framer-motion");
    return {
        ...actual,
        AnimatePresence: ({ children }: any) => <>{children}</>,
        motion: {
            div: ({ children, className, layout, initial, animate, exit, variants, ...props }: any) => (
                <div className={className} {...props}>{children}</div>
            ),
            hr: (props: any) => <hr {...props} />,
        },
    };
});

// 4. Mock Child Components
vi.mock("../components/layout/Search", () => ({
    default: ({ value, setSearch }: any) => (
        <input
            data-testid="search-input"
            value={value}
            onChange={(e) => setSearch(e.target.value)}
        />
    ),
}));

vi.mock("../components/layout/Dropdown", () => ({
    default: ({ value, onChange, options }: any) => (
        <select
            data-testid="filter-dropdown"
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

const mockUseGetUserContributions = useGetUserContributionsQuery as any;
const mockUseUserStore = useUserStore as any;

describe("MyContributions Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default to a logged-in user
        mockUseUserStore.mockReturnValue({ user: { id: "user-123" } });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should show the authentication warning if user is not logged in after 800ms", () => {
        vi.useFakeTimers();
        mockUseUserStore.mockReturnValue({ user: null });
        mockUseGetUserContributions.mockReturnValue({
            data: null, loading: false, error: null, refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <MyContributions />
            </MemoryRouter>
        );

        act(() => {
            vi.advanceTimersByTime(800);
        });

        expect(screen.getByText("Authentication Required")).toBeInTheDocument();
    });

    it("should render the loading spinner when fetching data", () => {
        mockUseGetUserContributions.mockReturnValue({
            data: null, loading: true, error: null, refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <MyContributions />
            </MemoryRouter>
        );

        expect(screen.queryByText("Contributions")).not.toBeInTheDocument();
    });

    it("should display an error state and handle refetch", () => {
        const mockRefetch = vi.fn();
        mockUseGetUserContributions.mockReturnValue({
            data: null, loading: false, error: new Error("Network failed"), refetch: mockRefetch,
        });

        render(
            <MemoryRouter>
                <MyContributions />
            </MemoryRouter>
        );

        expect(screen.getByText("Failed to load drafts")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Try Again"));
        expect(mockRefetch).toHaveBeenCalled();
    });

    it("should show 'No Contributions Yet' when the array is empty", () => {
        mockUseGetUserContributions.mockReturnValue({
            data: { getUserContributions: [] }, loading: false, error: null, refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <MyContributions />
            </MemoryRouter>
        );

        expect(screen.getByText("No Contributions Yet")).toBeInTheDocument();
    });

    it("should correctly group contributions by script and calculate totals", () => {
        mockUseGetUserContributions.mockReturnValue({
            data: {
                getUserContributions: [
                    // Three contributions for Script A (1 approved, 1 pending, 1 rejected)
                    { id: "c1", status: "approved", createdAt: "1000", script: { id: "scriptA", title: "The Matrix" } },
                    { id: "c2", status: "pending", createdAt: "2000", script: { id: "scriptA", title: "The Matrix" } },
                    { id: "c3", status: "rejected", createdAt: "3000", script: { id: "scriptA", title: "The Matrix" } },
                    // One contribution for Script B
                    { id: "c4", status: "approved", createdAt: "4000", script: { id: "scriptB", title: "Inception" } },
                ],
            },
            loading: false, error: null, refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <MyContributions />
            </MemoryRouter>
        );

        // Verify titles render
        expect(screen.getByText("The Matrix")).toBeInTheDocument();
        expect(screen.getByText("Inception")).toBeInTheDocument();

        // The Matrix should have 3 total, Inception should have 1 total
        expect(screen.getByText("3 TOTAL")).toBeInTheDocument();
        expect(screen.getByText("1 TOTAL")).toBeInTheDocument();

        // Verify the "Rejected" pill only appears for The Matrix
        expect(screen.getByText("Rejected")).toBeInTheDocument();
    });

    it("should filter the grouped scripts by search query", () => {
        mockUseGetUserContributions.mockReturnValue({
            data: {
                getUserContributions: [
                    { id: "c1", status: "approved", createdAt: "1000", script: { id: "scriptA", title: "The Matrix" } },
                    { id: "c2", status: "approved", createdAt: "2000", script: { id: "scriptB", title: "Inception" } },
                ],
            },
            loading: false, error: null, refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <MyContributions />
            </MemoryRouter>
        );

        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "matrix" } });

        expect(screen.getByText("The Matrix")).toBeInTheDocument();
        expect(screen.queryByText("Inception")).not.toBeInTheDocument();
    });

    it("should filter by Core Contributor (3+ contributions)", () => {
        mockUseGetUserContributions.mockReturnValue({
            data: {
                getUserContributions: [
                    // 3 for Matrix (Core)
                    { id: "c1", status: "approved", createdAt: "1000", script: { id: "scriptA", title: "The Matrix" } },
                    { id: "c2", status: "pending", createdAt: "2000", script: { id: "scriptA", title: "The Matrix" } },
                    { id: "c3", status: "rejected", createdAt: "3000", script: { id: "scriptA", title: "The Matrix" } },
                    // 1 for Inception (Casual)
                    { id: "c4", status: "approved", createdAt: "4000", script: { id: "scriptB", title: "Inception" } },
                ],
            },
            loading: false, error: null, refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <MyContributions />
            </MemoryRouter>
        );

        const dropdown = screen.getByTestId("filter-dropdown");
        fireEvent.change(dropdown, { target: { value: "core" } });

        // The Matrix should stay, Inception should be hidden
        expect(screen.getByText("The Matrix")).toBeInTheDocument();
        expect(screen.queryByText("Inception")).not.toBeInTheDocument();
    });

    it("should filter by 100% Approved (Perfect)", () => {
        mockUseGetUserContributions.mockReturnValue({
            data: {
                getUserContributions: [
                    // Mixed statuses for Matrix
                    { id: "c1", status: "approved", createdAt: "1000", script: { id: "scriptA", title: "The Matrix" } },
                    { id: "c2", status: "pending", createdAt: "2000", script: { id: "scriptA", title: "The Matrix" } },
                    // Perfect status for Inception
                    { id: "c3", status: "approved", createdAt: "3000", script: { id: "scriptB", title: "Inception" } },
                ],
            },
            loading: false, error: null, refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <MyContributions />
            </MemoryRouter>
        );

        const dropdown = screen.getByTestId("filter-dropdown");
        fireEvent.change(dropdown, { target: { value: "perfect" } });

        // Inception should stay, Matrix should be hidden
        expect(screen.queryByText("The Matrix")).not.toBeInTheDocument();
        expect(screen.getByText("Inception")).toBeInTheDocument();
    });

    it("should show 'No Results Found' when filters hide all data", () => {
        mockUseGetUserContributions.mockReturnValue({
            data: {
                getUserContributions: [
                    // 1 contribution (Casual)
                    { id: "c1", status: "approved", createdAt: "1000", script: { id: "scriptA", title: "The Matrix" } },
                ],
            },
            loading: false, error: null, refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <MyContributions />
            </MemoryRouter>
        );

        // Filter by Core (requires 3+)
        const dropdown = screen.getByTestId("filter-dropdown");
        fireEvent.change(dropdown, { target: { value: "core" } });

        expect(screen.getByText("No Results Found")).toBeInTheDocument();
    });
});