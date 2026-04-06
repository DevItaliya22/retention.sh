interface CashierMobileLayoutProps {
  children: React.ReactNode;
}

export function CashierMobileLayout({ children }: CashierMobileLayoutProps) {
  return (
    <div className="bg-muted min-h-screen">
      <div className="bg-background relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col shadow-[0_0_60px_rgba(0,0,0,0.08)]">
        {children}
      </div>
    </div>
  );
}
