"use client";

import { authClient } from "@/lib/auth/auth-client";
import { User } from "@reelo/db";
import { createContext, ReactNode, useContext, useMemo } from "react";

type Session = Awaited<ReturnType<typeof authClient.useSession>>["data"];

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  signOut: () => Promise<void>;
  lastActiveOrganizationId: string | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession?: Session | null;
}) {
  const {
    data: session,
    refetch: refetchSession,
    isPending,
  } = authClient.useSession();

  const currentSession = session || initialSession;

  const user = useMemo(() => {
    return currentSession?.user as User | null;
  }, [currentSession?.user]);

  const lastActiveOrganizationId = useMemo(() => {
    return (currentSession?.session as any)?.activeOrganizationId || null;
  }, [currentSession?.session]);

  const isAuthenticated = useMemo(() => {
    return !!user;
  }, [user]);

  const signOut = useMemo(() => {
    return async () => {
      try {
        await fetch("/api/auth/revoke", { method: "POST" });
      } finally {
        window.location.href = "/login";
      }
    };
  }, []);

  const value: SessionContextType = {
    session: currentSession || null,
    user,
    isAuthenticated,
    isLoading: isPending,
    error: null,
    refetch: async () => {
      await refetchSession();
    },
    signOut,
    lastActiveOrganizationId,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
}

export function useCurrentUser() {
  const { user, refetch } = useSessionContext();
  return {
    data: user,
    isLoading: false,
    error: null,
    refetch,
  };
}

export function useActiveOrganizationId() {
  const { session, lastActiveOrganizationId } = useSessionContext();
  return {
    data:
      (session?.session as any)?.activeOrganizationId ||
      lastActiveOrganizationId ||
      null,
    error: null,
    isLoading: false,
  };
}

export function useActiveUserId() {
  const { user } = useSessionContext();
  return {
    data: user?.id || null,
    error: null,
    isLoading: false,
  };
}

export function useIsAuthenticated() {
  const { isAuthenticated, user } = useSessionContext();
  return {
    isAuthenticated,
    isLoading: false,
    user,
  };
}

export function useSessionData() {
  return useSessionContext();
}
