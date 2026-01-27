import { Logo } from "@/components/logo";
import { Check } from "lucide-react";
import Link from "next/link";

export default function Pricing() {
  return (
    <section className="bg-[#F1F1F1] py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center">
          <Logo className="mx-auto mb-6" />
          <h1 className="text-3xl font-semibold sm:text-4xl lg:text-5xl">
            Plans built to boost your business's growth
          </h1>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg">
            Choose the plan that fits your needs. Start free and scale as you
            grow.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-5 md:gap-0">
          <div className="bg-card flex flex-col justify-between space-y-8 rounded-lg border p-6 shadow-lg md:col-span-3 md:my-2 md:rounded-r-none md:border-r-0 lg:p-10">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Logo className="mb-4" />
                  <h2 className="font-medium">Growth Yearly</h2>
                  <span className="my-3 block text-2xl font-semibold">
                    ₹2,500
                  </span>
                  <p className="text-muted-foreground text-sm">/outlet/month</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Billed every 12 months
                  </p>
                </div>

                <Link
                  href="#"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-colors"
                >
                  Get Started
                </Link>
              </div>

              <div>
                <div className="mb-4 text-sm font-medium">
                  Ready to scale? Unlock tools built for expansion
                </div>

                <ul className="list-outside space-y-3 text-sm">
                  {[
                    "Branded Loyalty Program",
                    "Customer Feedback System",
                    "Increase Online Reviews",
                    "Automated Campaigns",
                    "App Campaigns",
                    "Custom SMS Header (TRAI compliant)",
                    "Custom WhatsApp Header (Add-on)",
                    "QR Code Integration",
                    "Referral Program",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="text-primary size-3 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-card flex flex-col justify-between space-y-8 rounded-lg border p-6 md:col-span-2 md:my-2 md:rounded-l-none lg:p-10">
            <div className="space-y-4">
              <div>
                <Logo className="mb-4" />
                <h2 className="font-medium">Forever Free</h2>
                <span className="my-3 block text-2xl font-semibold">FREE</span>
                <p className="text-muted-foreground text-sm">
                  Perfect for getting started and testing the waters
                </p>
                <p className="text-primary mt-2 text-xs font-medium">
                  Our promise for free forever
                </p>
              </div>

              <Link
                href="#"
                className="border-foreground hover:bg-muted flex w-full items-center justify-center rounded-lg border-2 px-6 py-3 text-sm font-semibold transition-colors"
              >
                Get Started
              </Link>

              <hr className="border-dashed" />

              <ul className="list-outside space-y-3 text-sm">
                {[
                  "Campaigns via SMS and Email",
                  "Customer Insights",
                  "Business Insights",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="text-primary size-3 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
