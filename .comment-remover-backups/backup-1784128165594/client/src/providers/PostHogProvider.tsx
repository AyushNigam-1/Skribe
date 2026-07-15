import { useEffect } from "react";
import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST as string;

if (POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    capture_exceptions: true,
  });
}

export const PostHogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored && POSTHOG_KEY) {
      try {
        const { id, name } = JSON.parse(stored);
        if (id) {
          posthog.identify(id, { name });
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  return <>{children}</>;
};

export { posthog };
