import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Login from "../../pages/auth/Signin"; 


const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});


vi.mock("../lib/authClient", () => ({
    authClient: {
        signIn: {
            email: vi.fn(),
            social: vi.fn(),
        },
    },
}));


vi.mock("../providers/PostHogProvider", () => ({
    posthog: {
        capture: vi.fn(),
        identify: vi.fn(),
    },
}));


vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
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
import { posthog } from "../../providers/PostHogProvider";
import { toast } from "sonner";

const mockEmailSignIn = authClient.signIn.email as any;
const mockSocialSignIn = authClient.signIn.social as any;

describe("Login Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render all form elements and buttons correctly", () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByText("Welcome Back")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();

        
        expect(screen.getByText("Google")).toBeInTheDocument();
        expect(screen.getByText("Github")).toBeInTheDocument();
        expect(screen.getByText("Sign In")).toBeInTheDocument();
        expect(screen.getByText("Log in as Guest")).toBeInTheDocument();
    });

    it("should display Zod validation errors for invalid inputs", async () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        const emailInput = screen.getByPlaceholderText("you@example.com");
        const passwordInput = screen.getByPlaceholderText("••••••••");

        
        fireEvent.change(emailInput, { target: { value: "invalid-email" } });
        fireEvent.change(passwordInput, { target: { value: "123" } }); 

        
        await waitFor(() => {
            expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
            expect(screen.getByText("Password must be at least 6 characters")).toBeInTheDocument();
        });

        
        const submitBtn = screen.getByText("Sign In");
        expect(submitBtn).toBeDisabled();
    });

    it("should successfully log in with email and track analytics", async () => {
        
        mockEmailSignIn.mockResolvedValue({
            data: { user: { id: "user-123", name: "Test User" } },
            error: null,
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        
        fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });

        
        const submitBtn = await screen.findByText("Sign In");
        await waitFor(() => expect(submitBtn).not.toBeDisabled());

        fireEvent.click(submitBtn);

        
        await waitFor(() => {
            
            expect(mockEmailSignIn).toHaveBeenCalledWith({
                email: "test@example.com",
                password: "password123",
            });
            
            expect(posthog.identify).toHaveBeenCalledWith("user-123", { name: "Test User" });
            expect(posthog.capture).toHaveBeenCalledWith("user_logged_in", { login_method: "email" });
            
            expect(toast.success).toHaveBeenCalledWith("Welcome back!");
            
            expect(mockNavigate).toHaveBeenCalledWith("/explore");
        });
    });

    it("should handle email login failure and track the error", async () => {
        
        mockEmailSignIn.mockResolvedValue({
            data: null,
            error: { message: "Invalid credentials provided." },
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "wrong@example.com" } });
        fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "wrongpass" } });

        const submitBtn = await screen.findByText("Sign In");
        await waitFor(() => expect(submitBtn).not.toBeDisabled());
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(posthog.capture).toHaveBeenCalledWith("login_failed", { error_message: "Invalid credentials provided." });
            expect(toast.error).toHaveBeenCalledWith("Invalid credentials provided.");
            expect(mockNavigate).not.toHaveBeenCalled(); 
        });
    });

    it("should trigger social login for Google", async () => {
        mockSocialSignIn.mockResolvedValue({ data: {}, error: null });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText("Google"));

        await waitFor(() => {
            expect(mockSocialSignIn).toHaveBeenCalledWith({
                provider: "google",
                callbackURL: expect.stringContaining("/explore"),
            });
        });
    });

    it("should log in as Guest successfully", async () => {
        mockEmailSignIn.mockResolvedValue({
            data: { user: { id: "guest-999", name: "Guest User" } },
            error: null,
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText("Log in as Guest"));

        await waitFor(() => {
            expect(mockEmailSignIn).toHaveBeenCalledWith({
                email: "guest@example.com",
                password: "guestpassword123",
            });
            expect(posthog.capture).toHaveBeenCalledWith("user_logged_in", { login_method: "guest" });
            expect(toast.success).toHaveBeenCalledWith("Welcome to the Demo!");
            expect(mockNavigate).toHaveBeenCalledWith("/explore");
        });
    });
});