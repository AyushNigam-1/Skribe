import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ForgotPassword from "../../pages/auth/ForgotPassword";


vi.stubEnv("VITE_CLIENT_URL", "http://localhost:5173");


vi.mock("../lib/authClient", () => ({
    authClient: {
        requestPasswordReset: vi.fn(),
    },
}));


vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));


vi.mock("framer-motion", async () => {
    const actual = await vi.importActual("framer-motion");
    return {
        ...actual,
        AnimatePresence: ({ children }: any) => <>{children}</>,
        motion: {
            div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
            form: ({ children, className, onSubmit, ...props }: any) => <form className={className} onSubmit={onSubmit} {...props}>{children}</form>,
            p: ({ children, className, ...props }: any) => <p className={className} {...props}>{children}</p>,
        },
    };
});

import { authClient } from "../../lib/authClient";
import { toast } from "sonner";

const mockRequestReset = authClient.requestPasswordReset as any;

describe("ForgotPassword Component", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
    });

    afterEach(() => {
        queryClient.clear();
    });

    const renderComponent = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <ForgotPassword />
                </MemoryRouter>
            </QueryClientProvider>
        );
    };

    it("should render the initial form correctly", () => {
        renderComponent();

        expect(screen.getByText("Reset Password")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
        expect(screen.getByText("Send Reset Link")).toBeInTheDocument();
        expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should validate email format and disable submit button", async () => {
        renderComponent();

        const emailInput = screen.getByPlaceholderText("you@example.com");
        fireEvent.change(emailInput, { target: { value: "not-an-email" } });

        
        await waitFor(() => {
            expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
        });

        const submitBtn = screen.getByText("Send Reset Link");
        expect(submitBtn).toBeDisabled();
    });

    it("should send reset link successfully and show the success view", async () => {
        
        mockRequestReset.mockResolvedValue({ data: {}, error: null });

        renderComponent();

        const emailInput = screen.getByPlaceholderText("you@example.com");
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });

        const submitBtn = await screen.findByText("Send Reset Link");
        await waitFor(() => expect(submitBtn).not.toBeDisabled());

        fireEvent.click(submitBtn);

        await waitFor(() => {
            
            expect(mockRequestReset).toHaveBeenCalledWith({
                email: "test@example.com",
                redirectTo: "http://localhost:5173/reset-password",
            });

            
            expect(screen.getByText("Check Inbox")).toBeInTheDocument();
            expect(screen.getByText("Try different email")).toBeInTheDocument();
            expect(screen.queryByText("Reset Password")).not.toBeInTheDocument();
        });
    });

    it("should display a toast error if sending reset link fails", async () => {
        
        mockRequestReset.mockResolvedValue({
            data: null,
            error: { message: "User not found." },
        });

        renderComponent();

        const emailInput = screen.getByPlaceholderText("you@example.com");
        fireEvent.change(emailInput, { target: { value: "wrong@example.com" } });

        const submitBtn = await screen.findByText("Send Reset Link");
        await waitFor(() => expect(submitBtn).not.toBeDisabled());

        fireEvent.click(submitBtn);

        await waitFor(() => {
            
            expect(toast.error).toHaveBeenCalledWith("User not found.");
            
            expect(screen.getByText("Reset Password")).toBeInTheDocument();
            expect(screen.queryByText("Check Inbox")).not.toBeInTheDocument();
        });
    });

    it("should allow returning to the form from the success view", async () => {
        mockRequestReset.mockResolvedValue({ data: {}, error: null });

        renderComponent();

        
        fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@example.com" } });
        const submitBtn = await screen.findByText("Send Reset Link");
        await waitFor(() => expect(submitBtn).not.toBeDisabled());
        fireEvent.click(submitBtn);

        
        await waitFor(() => {
            expect(screen.getByText("Check Inbox")).toBeInTheDocument();
        });

        
        const retryBtn = screen.getByText("Try different email");
        fireEvent.click(retryBtn);

        
        expect(screen.getByText("Reset Password")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    });
});