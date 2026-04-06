"use client";

import { cn } from "@reelo/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCashierContext } from "../_context/CashierContext";

const navItems = [
  { href: "home", label: "Create Bill" },
  { href: "home/bills", label: "My Bills" },
] as const;

export function CashierNav() {
  const { businessSlug, cashierSlug } = useCashierContext();
  const pathname = usePathname();
  const basePath = `/cashier/${businessSlug}/${cashierSlug}`;

  return (
    <nav className="bg-muted flex rounded-lg p-1">
      {navItems.map((item) => {
        const href = `${basePath}/${item.href}`;
        const isActive =
          item.href === "home"
            ? pathname === href || pathname === `${basePath}/home`
            : pathname.startsWith(href);
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
