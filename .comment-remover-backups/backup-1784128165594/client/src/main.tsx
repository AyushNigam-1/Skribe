import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { registerSW } from "virtual:pwa-register";
import { UserProvider } from "./providers/UserProvider";
import { CustomApolloProvider } from "./providers/CustomApolloProvider";
import { PostHogProvider } from "./providers/PostHogProvider";
import { router } from "./router";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  sendDefaultPii: true,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");
const queryClient = new QueryClient();

registerSW({ immediate: true });

createRoot(rootElement).render(
  <CustomApolloProvider>
    <PostHogProvider>
      <UserProvider>
        <QueryClientProvider client={queryClient}>
          <div className="relative z-0 flex flex-col min-h-screen bg-primary">
            <RouterProvider router={router} />
          </div>
        </QueryClientProvider>
        <Toaster />
      </UserProvider>
    </PostHogProvider>
  </CustomApolloProvider>,
);