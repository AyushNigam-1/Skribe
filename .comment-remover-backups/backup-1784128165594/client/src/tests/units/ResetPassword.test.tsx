import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ResetPassword from "../../pages/auth/ResetPassword";

// 1. Mock React Router
const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams("?token=valid-token-123");

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [mockSearchParams],
    };
});

// 2. Mock BetterAuth / authClient
vi.mock("../lib/authClient", () => ({
    authClient: {
        resetPassword: vi.fn(),
    },
}));

// 3. Mock Sonner Toasts
vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

// 4. Mock Framer Motion
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

const mockResetApi = authClient.resetPassword as any;

describe("ResetPassword Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default to a valid token for most tests
        mockSearchParams = new URLSearchParams("?token=valid-token-123");
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should display an error and redirect if no token is in the URL", () => {
        mockSearchParams = new URLSearchParams("");

        render(
            <MemoryRouter>
                <ResetPassword />
            </MemoryRouter>
        );

        expect(toast.error).toHaveBeenCalledWith("Missing reset token. Please request a new link.");
        expect(mockNavigate).toHaveBeenCalledWith("/forgot-password");
    });

    it("should render the reset form if a token is present", () => {
        render(
            <MemoryRouter>
                <ResetPassword />
            </MemoryRouter>
        );

        // FIX: Use getAllByText because "New Password" is in the header AND the input label
        expect(screen.getAllByText("New Password").length).toBeGreaterThan(0);
        expect(screen.getAllByPlaceholderText("••••••••", { exact: false }).length).toBe(2);
        expect(screen.getByText("Reset Password")).toBeInTheDocument();
    });

    it("should show validation errors for short passwords or mismatched passwords", async () => {
        render(
            <MemoryRouter>
                <ResetPassword />
            </MemoryRouter>
        );

        const inputs = screen.getAllByPlaceholderText("••••••••");
        const newPasswordInput = inputs[0];
        const confirmPasswordInput = inputs[1];

        // Case 1: Too short
        fireEvent.change(newPasswordInput, { target: { value: "short" } });
        fireEvent.change(confirmPasswordInput, { target: { value: "short" } });

        await waitFor(() => {
            expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
        });

        // Case 2: Passwords don't match
        fireEvent.change(newPasswordInput, { target: { value: "validpassword123" } });
        fireEvent.change(confirmPasswordInput, { target: { value: "differentpassword" } });

        await waitFor(() => {
            expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
        });

        expect(screen.getByText("Reset Password")).toBeDisabled();
    });

    it("should successfully reset password, show success UI, and redirect after 2 seconds", async () => {
        // We removed vi.useFakeTimers() here to prevent waitFor from freezing
        mockResetApi.mockResolvedValue({ data: {}, error: null });

        render(
            <MemoryRouter>
                <ResetPassword />
            </MemoryRouter>
        );

        const inputs = screen.getAllByPlaceholderText("••••••••");
        const newPasswordInput = inputs[0];
        const confirmPasswordInput = inputs[1];

        fireEvent.change(newPasswordInput, { target: { value: "securepassword123" } });
        fireEvent.change(confirmPasswordInput, { target: { value: "securepassword123" } });

        const submitBtn = await screen.findByText("Reset Password");
        await waitFor(() => expect(submitBtn).not.toBeDisabled());

        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockResetApi).toHaveBeenCalledWith({
                newPassword: "securepassword123",
                token: "valid-token-123",
            });

            expect(toast.success).toHaveBeenCalledWith("Password reset successfully!");
            expect(screen.getByText("All Set!")).toBeInTheDocument();
        });

        // FIX: Tell Vitest to wait up to 3 seconds for the redirect to happen natively
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/login");
        }, { timeout: 3000 });
    });

    it("should show an error toast if the API rejects the token", async () => {
        mockResetApi.mockResolvedValue({
            data: null,
            error: { message: "Invalid or expired token." },
        });

        render(
            <MemoryRouter>
                <ResetPassword />
            </MemoryRouter>
        );

        const inputs = screen.getAllByPlaceholderText("••••••••");

        fireEvent.change(inputs[0], { target: { value: "securepassword123" } });
        fireEvent.change(inputs[1], { target: { value: "securepassword123" } });

        const submitBtn = await screen.findByText("Reset Password");
        await waitFor(() => expect(submitBtn).not.toBeDisabled());

        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Invalid or expired token.");
            // FIX: Use getAllByText for the "New Password" validation
            expect(screen.getAllByText("New Password").length).toBeGreaterThan(0);
        });
    });
});