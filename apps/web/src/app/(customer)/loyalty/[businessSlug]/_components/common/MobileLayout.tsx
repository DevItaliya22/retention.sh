import type { LoyaltyBranding } from "./types";

interface MobileLayoutProps {
  children: React.ReactNode;
  branding?: LoyaltyBranding | null;
}

export function MobileLayout({ children, branding }: MobileLayoutProps) {
  const tc = branding?.themeColor;

  return (
    <div className="min-h-screen bg-white">
      <div
        className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col shadow-[0_0_50px_rgba(0,0,0,0.06)]"
        style={{
          backgroundColor: tc ? `${tc}06` : "#ffffff",
          ...(tc
            ? ({
                "--brand-primary": tc,
                "--brand-text": branding?.textColor || "#ffffff",
              } as React.CSSProperties)
            : {}),
        }}
      >
        {children}
      </div>
    </div>
  );
}
