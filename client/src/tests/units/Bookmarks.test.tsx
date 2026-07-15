import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Bookmarks from "../../pages/home/Bookmarks"; 
import { useGetUserFavouritesQuery } from "../../graphql/generated/graphql";
import { useUserStore } from "../../store/useAuthStore";


vi.mock("../graphql/generated/graphql", () => ({
    useGetUserFavouritesQuery: vi.fn(),
}));


vi.mock("../store/useAuthStore", () => ({
    useUserStore: vi.fn(),
}));


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


vi.mock("../components/card/DraftCard", () => ({
    default: ({ script }: any) => <div data-testid="draft-card">{script.title}</div>,
}));

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
            data-testid="genre-dropdown"
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

const mockUseGetUserFavourites = useGetUserFavouritesQuery as any;
const mockUseUserStore = useUserStore as any;

describe("Bookmarks Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        mockUseUserStore.mockReturnValue({ user: { id: "user-123" } });
    });

    afterEach(() => {
        vi.useRealTimers(); 
    });

    it("should show the authentication warning if user is not logged in", () => {
        
        vi.useFakeTimers();
        mockUseUserStore.mockReturnValue({ user: null });

        mockUseGetUserFavourites.mockReturnValue({
            data: null, loading: false, error: null, refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <Bookmarks />
            </MemoryRouter>
        );

        
        act(() => {
            vi.advanceTimersByTime(800);
        });

        expect(screen.getByText("Authentication Required")).toBeInTheDocument();
    });

    it("should render the loading spinner when fetching data", () => {
        mockUseGetUserFavourites.mockReturnValue({
            data: null, loading: true, error: null, refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <Bookmarks />
            </MemoryRouter>
        );

        expect(screen.queryByText("Bookmarks")).not.toBeInTheDocument();
    });

    it("should display an error state and handle refetch", () => {
        const mockRefetch = vi.fn();
        mockUseGetUserFavourites.mockReturnValue({
            data: null, loading: false, error: new Error("Network failed"), refetch: mockRefetch,
        });

        render(
            <MemoryRouter>
                <Bookmarks />
            </MemoryRouter>
        );

        expect(screen.getByText("Failed to load drafts")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Try Again"));
        expect(mockRefetch).toHaveBeenCalled();
    });

    it("should show 'No Bookmarks Yet' when the list is empty", () => {
        mockUseGetUserFavourites.mockReturnValue({
            data: { getUserFavourites: [] }, loading: false, error: null, refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <Bookmarks />
            </MemoryRouter>
        );

        expect(screen.getByText("No Bookmarks Yet")).toBeInTheDocument();
    });

    it("should render bookmarks and successfully filter by search query", () => {
        mockUseGetUserFavourites.mockReturnValue({
            data: {
                getUserFavourites: [
                    { id: "1", title: "Space Odyssey", genres: ["Science Fiction"] },
                    { id: "2", title: "Magic Kingdom", genres: ["Fantasy"] },
                ],
            },
            loading: false, error: null, refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <Bookmarks />
            </MemoryRouter>
        );

        
        expect(screen.getByText("Space Odyssey")).toBeInTheDocument();
        expect(screen.getByText("Magic Kingdom")).toBeInTheDocument();

        
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "magic" } });

        
        expect(screen.queryByText("Space Odyssey")).not.toBeInTheDocument();
        expect(screen.getByText("Magic Kingdom")).toBeInTheDocument();
    });

    it("should filter bookmarks by genre using the dropdown", () => {
        mockUseGetUserFavourites.mockReturnValue({
            data: {
                getUserFavourites: [
                    { id: "1", title: "Space Odyssey", genres: ["Science Fiction"] },
                    { id: "2", title: "Magic Kingdom", genres: ["Fantasy"] },
                ],
            },
            loading: false, error: null, refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <Bookmarks />
            </MemoryRouter>
        );

        
        const dropdown = screen.getByTestId("genre-dropdown");
        fireEvent.change(dropdown, { target: { value: "fantasy" } });

        expect(screen.queryByText("Space Odyssey")).not.toBeInTheDocument();
        expect(screen.getByText("Magic Kingdom")).toBeInTheDocument();
    });

    it("should show 'No Results Found' when filters yield zero results", () => {
        mockUseGetUserFavourites.mockReturnValue({
            data: {
                getUserFavourites: [
                    { id: "1", title: "Space Odyssey", genres: ["Science Fiction"] },
                ],
            },
            loading: false, error: null, refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <Bookmarks />
            </MemoryRouter>
        );

        
        const dropdown = screen.getByTestId("genre-dropdown");
        fireEvent.change(dropdown, { target: { value: "romance" } });

        expect(screen.getByText("No Results Found")).toBeInTheDocument();
        expect(screen.queryByTestId("draft-card")).not.toBeInTheDocument();
    });
});