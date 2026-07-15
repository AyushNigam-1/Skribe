import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthLayout from "./pages/auth/Layout";
import DraftLayout from "./pages/draft/Layout";
import HomeLayout from "./pages/home/Layout";
import { Loader2 } from "lucide-react";
import { authClient } from "./lib/authClient";

const Explore = lazy(() => import("./pages/home/Explore"));
const Bookmarks = lazy(() => import("./pages/home/Bookmarks"));
const Profile = lazy(() => import("./pages/home/Profile"));
const MyContributions = lazy(() => import("./pages/home/Contributions"));
const ZenMode = lazy(() => import("./pages/draft/ZenMode"));
const Contribution = lazy(() => import("./pages/draft/Contribution"));
const Timeline = lazy(() => import("./pages/draft/Timeline"));
const Requests = lazy(() => import("./pages/draft/Requests"));
const Contributors = lazy(() => import("./pages/draft/Contributors"));
const ScriptDetails = lazy(() => import("./pages/draft/About"));
const DraftSettings = lazy(() => import("./pages/draft/Settings"));
const Login = lazy(() => import("./pages/auth/Signin"));
const CreateAccount = lazy(() => import("./pages/auth/Signup"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

const PageLoader = () => (
    <div className="min-h-[100dvh] w-full bg-transparent flex items-center justify-center">
        <Loader2 className="size-6 animate-spin" />
    </div>
);

const Loadable = (Component: React.LazyExoticComponent<React.FC<any>>) => (
    <Suspense fallback={<PageLoader />}>
        <Component />
    </Suspense>
);

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { data: session, isPending } = authClient.useSession();

    if (isPending) return <PageLoader />;

    if (session?.user) {
        return <Navigate to="/explore" replace />;
    }

    return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { data: session, isPending } = authClient.useSession();

    if (isPending) return <PageLoader />;

    if (!session?.user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <ProtectedRoute>
                <HomeLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="/explore" replace /> },
            { path: "/explore", element: Loadable(Explore) },
            { path: "/bookmarks", element: Loadable(Bookmarks) },
            { path: "/profile/:id", element: Loadable(Profile) },
            { path: "/contributions", element: Loadable(MyContributions) },
            { path: "/zen/:id", element: Loadable(ZenMode) },
            {
                path: "/",
                element: <DraftLayout />,
                children: [
                    { path: "/timeline/:id", element: Loadable(Timeline) },
                    { path: "/requests/:id", element: Loadable(Requests) },
                    { path: "/contributors/:id", element: Loadable(Contributors) },
                    { path: "/about/:id", element: Loadable(ScriptDetails) },
                    { path: "/settings/:id", element: Loadable(DraftSettings) },
                    { path: "/contribution/:id/:paragraphId", element: Loadable(Contribution) },
                ],
            },
        ],
    },
    {
        path: "/",
        element: (
            <PublicRoute>
                <AuthLayout />
            </PublicRoute>
        ),
        children: [
            { path: "/login", element: Loadable(Login) },
            { path: "/create-account", element: Loadable(CreateAccount) },
            { path: "/forgot-password", element: Loadable(ForgotPassword) },
            { path: "/reset-password", element: Loadable(ResetPassword) },
        ],
    },
]);