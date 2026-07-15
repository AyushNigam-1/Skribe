import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Explore from "../../pages/home/Explore";
import { useGetScriptsByGenresQuery } from "../../graphql/generated/graphql";
import { MemoryRouter } from "react-router-dom";


vi.mock("../graphql/generated/graphql", () => ({
    useGetScriptsByGenresQuery: vi.fn(),
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

vi.mock("../components/modal/AddDraft", () => ({
    default: () => <button data-testid="add-btn">Add Draft</button>,
}));

vi.mock("../components/layout/Search", () => ({
    default: ({ value, setSearch }: any) => (
        <input
            data-testid="search-input"
            placeholder="Search..."
            value={value}
            onChange={(e) => setSearch(e.target.value)}
        />
    ),
}));

vi.mock("../../components/layout/Genres", () => ({
    default: () => <div data-testid="genres-filter">Genres</div>,
}));


const mockUseGetScripts = useGetScriptsByGenresQuery as any;

describe("Explore Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the loading spinner when loading is true", () => {
        mockUseGetScripts.mockReturnValue({
            data: null,
            loading: true,
            error: null,
            refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <Explore />
            </MemoryRouter>
        );

        
        
        
        expect(screen.queryByText("Explore")).not.toBeInTheDocument();
    });

    it("should render the error state when error exists", () => {
        const mockRefetch = vi.fn();
        mockUseGetScripts.mockReturnValue({
            data: null,
            loading: false,
            error: new Error("Network error"),
            refetch: mockRefetch,
        });

        render(
            <MemoryRouter>
                <Explore />
            </MemoryRouter>
        );

        expect(screen.getByText("Failed to load drafts")).toBeInTheDocument();

        
        const retryBtn = screen.getByText("Try Again");
        fireEvent.click(retryBtn);
        expect(mockRefetch).toHaveBeenCalled();
    });

    it("should render 'No Drafts Yet' when data is empty and no filters are applied", () => {
        mockUseGetScripts.mockReturnValue({
            data: { getScriptsByGenres: [] },
            loading: false,
            error: null,
            refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <Explore />
            </MemoryRouter>
        );

        expect(screen.getByText("No Drafts Yet")).toBeInTheDocument();
    });

    it("should render a list of DraftCards when data is returned", () => {
        mockUseGetScripts.mockReturnValue({
            data: {
                getScriptsByGenres: [
                    { id: "1", title: "Sci-Fi Epic" },
                    { id: "2", title: "Romantic Comedy" },
                ],
            },
            loading: false,
            error: null,
            refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <Explore />
            </MemoryRouter>
        );

        
        expect(screen.getByText("Explore")).toBeInTheDocument();

        
        const cards = screen.getAllByTestId("draft-card");
        expect(cards).toHaveLength(2);
        expect(screen.getByText("Sci-Fi Epic")).toBeInTheDocument();
        expect(screen.getByText("Romantic Comedy")).toBeInTheDocument();
    });

    it("should filter the scripts correctly when typing in the search bar", () => {
        mockUseGetScripts.mockReturnValue({
            data: {
                getScriptsByGenres: [
                    { id: "1", title: "Sci-Fi Epic" },
                    { id: "2", title: "Romantic Comedy" },
                ],
            },
            loading: false,
            error: null,
            refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <Explore />
            </MemoryRouter>
        );

        
        expect(screen.getByText("Sci-Fi Epic")).toBeInTheDocument();
        expect(screen.getByText("Romantic Comedy")).toBeInTheDocument();

        
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "sci" } });

        
        expect(screen.getByText("Sci-Fi Epic")).toBeInTheDocument();
        expect(screen.queryByText("Romantic Comedy")).not.toBeInTheDocument();
    });

    it("should show 'No Results Found' if search matches nothing", () => {
        mockUseGetScripts.mockReturnValue({
            data: {
                getScriptsByGenres: [{ id: "1", title: "Sci-Fi Epic" }],
            },
            loading: false,
            error: null,
            refetch: vi.fn(),
        });

        render(
            <MemoryRouter>
                <Explore />
            </MemoryRouter>
        );

        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "Gibberish" } });

        expect(screen.getByText("No Results Found")).toBeInTheDocument();
        expect(screen.queryByTestId("draft-card")).not.toBeInTheDocument();
    });
});