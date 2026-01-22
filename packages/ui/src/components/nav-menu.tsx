import { HTMLAttributes, PropsWithChildren, forwardRef } from "react";
import { cn } from "../lib/utils";

type NavMenuProps = HTMLAttributes<HTMLDivElement>;

export const NavMenu = forwardRef<HTMLDivElement, NavMenuProps>(
  (
    props: PropsWithChildren<{
      className?: string;
    }>,
    forwardedRef,
  ) => {
    return (
      <nav
        ref={forwardedRef}
        dir="ltr"
        {...props}
        className={cn("border-b", props.className)}
      >
        <ul role="menu" className="flex gap-5">
          {props.children}
        </ul>
      </nav>
    );
  },
);

NavMenu.displayName = "NavMenu";

type NavMenuItemProps = PropsWithChildren<{
  className?: string;
  active: boolean;
}>;

export const NavMenuItem = forwardRef<HTMLLIElement, NavMenuItemProps>(
  ({ children, className, active, ...props }, ref) => (
    <li
      ref={ref}
      aria-selected={active ? "true" : "false"}
      data-state={active ? "active" : "inactive"}
      className={cn(
        "ring-offset-background focus-visible:ring-ring data-[state=active]:text-foreground text-foreground-lighter hover:text- hover:border-foreground! data-[state=active]:border-foreground! inline-flex items-center justify-center border-b-2 border-transparent text-sm whitespace-nowrap transition-all *:py-1.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </li>
  ),
);

NavMenuItem.displayName = "NavMenuItem";
