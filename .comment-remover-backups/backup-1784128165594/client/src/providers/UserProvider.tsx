import React, { useEffect } from "react";
import { useUserStore } from "../store/useAuthStore";
import { authClient } from "../lib/authClient";

const parseFavs = (favs: any[] = []) => favs.map(f => f?.buffer ? Object.values(f.buffer).map((b: any) => b.toString(16).padStart(2, "0")).join("") : f);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { setUser, setLoading, setError } = useUserStore();

  const { data: session, isPending, error: sessionError } = authClient.useSession();

  useEffect(() => {
    setLoading(isPending);

    if (sessionError) {
      console.error("Session verification failed:", sessionError);
      setError("Failed to verify session");
      return;
    }

    if (session?.user) {
      setUser({
        ...session.user,
        favourites: parseFavs((session.user as any).favourites),
      } as any);
    } else if (!isPending) {
      setUser(null);
    }
  }, [session, isPending, sessionError, setUser, setLoading, setError]);

  return <>{children}</>;
};