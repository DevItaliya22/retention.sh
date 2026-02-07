"use client";

import { Button } from "@reelo/ui/components";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CustomerLogoutButtonProps {
  /** When set, redirects to this business's login page after logout. Otherwise redirects to /loyalty. */
  businessSlug?: string;
}

export function CustomerLogoutButton({
  businessSlug,
}: CustomerLogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/customer/logout", {
        method: "POST",
      });

      if (response.ok) {
        const redirectPath = businessSlug
          ? `/loyalty/${businessSlug}/login`
          : "/loyalty";
        router.push(redirectPath);
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
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
      className="gap-2"
    >
      <LogOut className="size-4" />
      {isLoading ? "Logging out..." : "Log out"}
    </Button>
  );
}
