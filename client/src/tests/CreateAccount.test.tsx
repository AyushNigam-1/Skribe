import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CreateAccount from "../pages/auth/Signup";  // Adjust path if needed

// 1. Mock React Router
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// 2. Mock BetterAuth / authClient
vi.mock("../lib/authClient", () => ({
    authClient: {
        signUp: {
            email: vi.fn(),
        },
        signIn: {
            social: vi.fn(),
        },
    },
}));

// 3. Mock PostHog Analytics
vi.mock("../providers/PostHogProvider", () => ({
    posthog: {
        capture: vi.fn(),
        identify: vi.fn(),
    },
}));

// 4. Mock Sonner Toasts
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// 5. Mock Framer Motion
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

import { authClient } from "../lib/authClient";
import { posthog } from "../providers/PostHogProvider";
import { toast } from "sonner";

const mockEmailSignUp = authClient.signUp.email as any;
const mockSocialSignIn = authClient.signIn.social as any;

describe("CreateAccount Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render all form elements and buttons correctly", () => {
        render(
            <MemoryRouter>
                <CreateAccount />
            </MemoryRouter>
        );

        expect(screen.getByText("Join Skribe")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Your Name")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();

        // Check for buttons
        expect(screen.getByText("Google")).toBeInTheDocument();
        expect(screen.getByText("Github")).toBeInTheDocument();
        expect(screen.getByText("Create Account")).toBeInTheDocument();
    });

    it("should display Zod validation errors for invalid inputs", async () => {
        render(
            <MemoryRouter>
                <CreateAccount />
            </MemoryRouter>
        );

        const nameInput = screen.getByPlaceholderText("Your Name");
        const emailInput = screen.getByPlaceholderText("you@example.com");
        const passwordInput = screen.getByPlaceholderText("••••••••");

        // Type invalid data
        fireEvent.change(nameInput, { target: { value: "Al" } }); // Too short
        fireEvent.change(emailInput, { target: { value: "invalid-email" } });
        fireEvent.change(passwordInput, { target: { value: "123" } }); // Too short

        // Because react-hook-form runs asynchronously, we wait for errors to appear
        await waitFor(() => {
            expect(screen.getByText("Name must be at least 3 characters")).toBeInTheDocument();
            expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
            expect(screen.getByText("Password must be at least 6 characters")).toBeInTheDocument();
        });

        // Create Account button should be disabled due to invalid form state
        const submitBtn = screen.getByText("Create Account");
        expect(submitBtn).toBeDisabled();
    });

    it("should successfully create an account with email and track analytics", async () => {
        // Mock a successful response from your auth client
        mockEmailSignUp.mockResolvedValue({
            data: { user: { id: "new-user-123", name: "Alice Wonderland" } },
            error: null,
        });

        render(
            <MemoryRouter>
                <CreateAccount />
            </MemoryRouter>
        );

        // Fill out valid form data
        fireEvent.change(screen.getByPlaceholderText("Your Name"), { target: { value: "Alice Wonderland" } });
        fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "alice@example.com" } });
        fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "securepassword" } });

        // The button might still be briefly disabled from the initial render, wait for it to be enabled
        const submitBtn = await screen.findByText("Create Account");
        await waitFor(() => expect(submitBtn).not.toBeDisabled());

        fireEvent.click(submitBtn);

        // Verify exactly what happens after clicking submit
        await waitFor(() => {
            // 1. Auth client called with correct credentials
            expect(mockEmailSignUp).toHaveBeenCalledWith({
                name: "Alice Wonderland",
                email: "alice@example.com",
                password: "securepassword",
            });
            // 2. PostHog identified the user and tracked the event
            expect(posthog.identify).toHaveBeenCalledWith("new-user-123", { name: "Alice Wonderland" });
            expect(posthog.capture).toHaveBeenCalledWith("user_signed_up", { signup_method: "email" });
            // 3. Success toast shown
            expect(toast.success).toHaveBeenCalledWith("Account created successfully!");
            // 4. Navigated to home/landing page
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
    });

    it("should handle signup failure and track the error", async () => {
        // Mock a failed response
        mockEmailSignUp.mockResolvedValue({
            data: null,
            error: { message: "Email already in use." },
        });

        render(
            <MemoryRouter>
                <CreateAccount />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("Your Name"), { target: { value: "Bob" } });
        fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "taken@example.com" } });
        fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });

        const submitBtn = await screen.findByText("Create Account");
        await waitFor(() => expect(submitBtn).not.toBeDisabled());
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(posthog.capture).toHaveBeenCalledWith("signup_failed", { error_message: "Email already in use." });
            expect(toast.error).toHaveBeenCalledWith("Email already in use.");
            expect(mockNavigate).not.toHaveBeenCalled(); // Should not navigate away
        });
    });

    it("should trigger social login for Github", async () => {
        mockSocialSignIn.mockResolvedValue({ data: {}, error: null });

        render(
            <MemoryRouter>
                <CreateAccount />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText("Github"));

        await waitFor(() => {
            expect(mockSocialSignIn).toHaveBeenCalledWith({
                provider: "github",
                callbackURL: expect.stringContaining("/explore"),
            });
        });
    });
});