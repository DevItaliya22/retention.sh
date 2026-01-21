import { AppLayout } from "@/components/layouts";
import { Providers } from "@/components/providers";
import "@reelo/ui/globals.css";

export default function BusinessLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <AppLayout>{children}</AppLayout>
    </Providers>
  );
}
