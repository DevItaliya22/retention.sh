"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CashierLogoutButtonProps {
  businessSlug: string;
  cashierSlug: string;
}

export function CashierLogoutButton({
  businessSlug,
  cashierSlug,
}: CashierLogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/cashier/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push(`/cashier/${businessSlug}/${cashierSlug}`);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to logout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="text-muted-foreground hover:text-foreground rounded-full p-2 transition-colors disabled:opacity-50"
      aria-label="Logout"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
