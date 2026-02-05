"use client";

import { Button } from "@reelo/ui/components";
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
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={isLoading}
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      {isLoading ? "Logging out..." : "Logout"}
    </Button>
  );
}
