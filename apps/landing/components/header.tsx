"use client";

import { Logo } from "@/components/logo";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navLinks = [
  {
    title: "Home",
    href: "/",
  },
  // {
  //   title: "About Us",
  //   href: "/about",
  // },
  {
    title: "Contact",
    href: "/contact",
  },
  {
    title: "Pricing",
    href: "/pricing",
  },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header
      ref={headerRef}
      className="fixed top-0 right-0 left-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" aria-label="go home" className="flex items-center">
            <Logo />
          </Link>

          <nav className="hidden md:flex md:items-center md:gap-6">
            {navLinks.map((link, index) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={index}
                  href={link.href}
                  className={`text-sm transition-colors ${
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {link.title}
                </Link>
              );
            })}
          </nav>

          <button
            className="transition-transform duration-200 md:hidden"
            aria-label="Toggle menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="size-6 transition-opacity duration-200" />
            ) : (
              <Menu className="size-6 transition-opacity duration-200" />
            )}
          </button>
        </div>

        <nav
          className={`overflow-hidden border-t transition-all duration-300 ease-in-out md:hidden ${
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-4 py-4">
            {navLinks.map((link, index) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={index}
                  href={link.href}
                  className={`text-sm font-bold transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    animationDelay: isMenuOpen ? `${index * 50}ms` : "0ms",
                  }}
                >
                  <span
                    className={`inline-block transition-all duration-300 ${
                      isMenuOpen
                        ? "translate-y-0 opacity-100"
                        : "-translate-y-2 opacity-0"
                    }`}
                  >
                    {link.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
