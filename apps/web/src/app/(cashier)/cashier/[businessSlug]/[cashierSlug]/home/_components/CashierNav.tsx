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
    <nav className="flex gap-2">
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
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
