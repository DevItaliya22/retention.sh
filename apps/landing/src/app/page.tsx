"use client";

import { useState } from "react";

const DEMO_LINK =
  "https://cal.com/dev-italiya-%E5%86%AC-16-3srkb2/dy-demo?overlayCalendar=true";

export default function Home() {
  const [activeTab, setActiveTab] = useState("loyalty");

  const features = [
    {
      id: "loyalty",
      name: "Loyalty",
      title: "Build Customer Loyalty That Drives Revenue",
      description:
        "Reward your best customers with a branded, automated loyalty program that boosts repeat visits and increases average order value.",
      stats: [
        { label: "1 Cr+", description: "Generated via loyalty program" },
        { label: "1M", description: "Customer data captured via loyalty" },
        { label: "38%", description: "Loyalty retention rate" },
        {
          label: "10K/Month",
          description: "Amount spent by top 20-30 customers",
        },
      ],
      benefits: [
        {
          title: "Make Loyalty as Unique as Your Brand",
          description:
            "Customize your program name, branding, and how you wish to reward customers. Choose from various rewards—points, cashback, free items, or tiered perks. Deliver a consistent experience across all locations.",
        },
        {
          title: "Cut the Complexity, Not the Results",
          description:
            "Auto-enroll customers at first purchase—no paper cards or friction. Send automatic reminders, expiry notices, and confirmations. Plug directly into your POS—no staff training or backend hassle.",
        },
        {
          title: "Protect Your Margins with Smarter Incentives",
          description:
            "Set minimum spend thresholds to be a part of the loyalty program and daily redemption limits. Instead of discounts offer exclusive perks like cashbacks, free items, or VIP experiences. Reduce dependency on aggregators and third-party platforms to bring back your loyal customers.",
        },
        {
          title: "Measure What Loyalty Really Delivers",
          description:
            "Track lifetime value, redemption behavior, and repeat rates. Understand what drives loyalty—and double down on it. Prove ROI with real data, not assumptions.",
        },
      ],
    },
    {
      id: "campaigns",
      name: "Campaigns",
      title: "Drive Visits with Targeted Marketing Campaigns",
      description:
        "Say goodbye to bulk, bland, and blind business marketing campaigns! Send targeted, timely messages that actually drive visits and revenue.",
      stats: [
        { label: "204x", description: "ROI on Marketing Spends" },
        {
          label: "5000+",
          description: "Ready-to-use campaign templates",
        },
        {
          label: "₹3.6L",
          description: "Generated per campaign with hyper-targeted campaigns",
        },
      ],
      benefits: [
        {
          title: "Send Campaigns in Under 2 Minutes",
          description:
            "Access 5000+ ready-to-use templates for events, offers, and festivals. Launch via email, WhatsApp, or SMS—wherever your guests are the most active. No learning curve—anyone on your team can run it.",
        },
        {
          title: "Market What Matters, When It Matters",
          description:
            "Promote new products, events, or seasonal offerings with ease to the right audience. Target customers based on past purchases, visit frequency, or preferences. Automate campaigns like welcome messages to boost engagement and visits.",
        },
        {
          title: "Track Every Campaign Like a Pro",
          description:
            "See which messages convert—down to the exact number of redemption and revenue earned. Offers only redeemable via customer mobile numbers so the numbers are accurate every time. Learn what works and repeat success with confidence.",
        },
        {
          title: "Keep Your Campaigns Safe",
          description:
            "Everything is connected to your POS system. Only valid customers can use your discounts - no more unauthorized sharing. Quick setup that syncs with your existing system in minutes.",
        },
      ],
    },
    {
      id: "whatsapp",
      name: "WhatsApp Marketing",
      title: "Business WhatsApp for Reservation, Reviews & Loyalty",
      description:
        "Handle reservations, collect reviews, send promotions, manage loyalty, and build relationships—all on the platform your customers already love.",
      stats: [
        { label: "204x", description: "ROI on Marketing Spends" },
        {
          label: "165+",
          description: "Stores engaging customers via WhatsApp",
        },
        { label: "98%", description: "Open rate on WhatsApp messages" },
        {
          label: "₹3.6L/campaign",
          description: "Generated with hyper-targeted campaigns",
        },
      ],
      benefits: [
        {
          title: "Talk to Customers Like a Pro",
          description:
            "Look professional with branded WhatsApp header and verified green tick! Handle everything from reservations to feedback in one place. Automatically send birthday and anniversary wishes to make customers feel special.",
        },
        {
          title: "Capture & Grow Customer Data with WhatsApp",
          description:
            "Enrich existing customer details and add new customers, preferences and feedback. Incentivize customers to share their contact number on WhatsApp for offers. Capture customer data from your Click-to-WhatsApp Meta ads directly into DY.",
        },
        {
          title: "Send the Right Offers to the Right Customers",
          description:
            "Save money by sending personalised campaigns to DY's Smart Groups. Group your customers based on what they order, how much they spend, and how often they visit. Send deals when customers are most likely to see them or use them.",
        },
        {
          title: "Keep Your Promotions Safe",
          description:
            "Everything is connected to your POS system. Only valid customers can use your discounts - no more unauthorized sharing. Secure and reliable customer engagement platform.",
        },
      ],
    },
    {
      id: "automated",
      name: "Automated Campaigns",
      title: "Set Up Smart, Timely Marketing Automation",
      description:
        "Set up smart, timely marketing messages that trigger based on customer behavior. Keep them engaged without lifting a finger.",
      benefits: [
        {
          title: "Automated Welcome Messages",
          description:
            "Welcome new customers automatically when they join your loyalty program. Create instant engagement and set the right expectations from day one.",
        },
        {
          title: "Behavior-Based Triggers",
          description:
            "Send messages based on customer actions—after visits, on birthdays, when points are about to expire, or when they haven't visited in a while. Automate reminders and follow-ups to maximize engagement.",
        },
        {
          title: "Smart Scheduling",
          description:
            "Schedule campaigns for optimal times when customers are most likely to engage. Automatically send personalized offers based on past behavior and preferences.",
        },
      ],
    },
    {
      id: "feedback",
      name: "Feedback & Reviews",
      title: "Collect and Analyze Customer Feedback",
      description:
        "Collect and analyze customer feedback to drive revenue and improve customer experience using smart feedback loops.",
      benefits: [
        {
          title: "Real-Time Feedback Collection",
          description:
            "Capture feedback immediately after visits via WhatsApp, SMS, or email. Make it easy for customers to share their experience and rate your service.",
        },
        {
          title: "Online Review Management",
          description:
            "Manage reviews across platforms and respond to feedback proactively. Turn negative experiences into positive outcomes with timely responses.",
        },
        {
          title: "Actionable Insights",
          description:
            "Analyze feedback patterns to identify areas for improvement. Use data-driven insights to enhance products, service quality, and overall customer experience.",
        },
      ],
    },
    {
      id: "membership",
      name: "Membership",
      title: "Create Exclusive Membership Programs",
      description:
        "Build exclusive membership tiers that reward your most valuable customers with premium benefits and experiences.",
      benefits: [
        {
          title: "Tiered Membership Levels",
          description:
            "Create multiple membership tiers with increasing benefits. Reward frequent visitors with exclusive perks, priority service, and special access.",
        },
        {
          title: "VIP Experiences",
          description:
            "Offer exclusive experiences like VIP invitations, special events, and early access to new products or services. Make members feel valued and special.",
        },
        {
          title: "Member-Only Benefits",
          description:
            "Provide cashbacks, free items, and personalized offers exclusively for members. Drive loyalty and increase customer lifetime value.",
        },
      ],
    },
    {
      id: "qr",
      name: "QR Codes",
      title: "Easy Check-In and Data Capture with QR Codes",
      description:
        "Simplify customer check-ins and capture valuable customer data instantly with QR code technology.",
      benefits: [
        {
          title: "Quick Check-In Process",
          description:
            "Customers can check in instantly by scanning a QR code. No need for physical cards or manual entry. Streamline the customer experience.",
        },
        {
          title: "Instant Data Capture",
          description:
            "Capture customer contact information and preferences automatically when they scan. Build your customer database effortlessly.",
        },
        {
          title: "Seamless Integration",
          description:
            "QR codes integrate directly with your POS system and loyalty program. Every scan updates customer profiles and rewards automatically.",
        },
      ],
    },
    {
      id: "referral",
      name: "Referral",
      title: "Grow Your Customer Base with Referral Programs",
      description:
        "Turn your loyal customers into advocates and grow your customer base faster with genuine recommendations.",
      benefits: [
        {
          title: "Customer-Driven Growth",
          description:
            "Encourage existing customers to refer friends and family. Reward both the referrer and the new customer to create a win-win situation.",
        },
        {
          title: "Easy Sharing",
          description:
            "Make it simple for customers to share referral links via WhatsApp, SMS, or email. Track referrals and reward automatically when new customers visit.",
        },
        {
          title: "Track Referral Performance",
          description:
            "Monitor which customers are your best advocates. See referral conversion rates and reward top referrers with special benefits.",
        },
      ],
    },
  ];

  const activeFeature = features.find((f) => f.id === activeTab) || features[0];

  if (!activeFeature) {
    return null;
  }

  return (
    <>
      <main className="min-h-screen">
        {/* Hero Section */}
        <section
          aria-label="Hero section"
          className="from-background via-background to-primary/5 relative overflow-hidden bg-linear-to-br py-16 sm:py-24 lg:py-32"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Build Customer Loyalty That{" "}
                <span className="from-primary to-primary/60 bg-linear-to-r bg-clip-text text-transparent">
                  Drives Revenue
                </span>
              </h1>
              <p className="text-foreground/70 mx-auto mt-6 max-w-2xl text-lg leading-8 sm:text-xl lg:text-2xl">
                Reward your best customers with a branded, automated loyalty
                program that boosts repeat visits and increases average order
                value.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                <a
                  href={DEMO_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-foreground/20 bg-background text-foreground hover:border-foreground/40 hover:bg-foreground/5 focus-visible:outline-primary w-full rounded-lg border-2 px-8 py-4 text-base font-semibold shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto"
                >
                  Schedule a Demo
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section
          aria-label="Achievements"
          className="bg-foreground/5 py-12 sm:py-16 lg:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                What DY&apos;s Loyalty Platform Can Do for Your Business
              </h2>
            </div>
            <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-4 sm:mt-16 sm:gap-6 lg:mt-24 lg:max-w-none lg:grid-cols-4 lg:gap-8">
              <div className="bg-background ring-foreground/5 flex flex-col items-center rounded-xl p-6 text-center shadow-sm ring-1 sm:p-8">
                <div className="text-primary text-3xl font-bold sm:text-4xl lg:text-5xl">
                  1 Cr+
                </div>
                <p className="text-foreground/70 mt-3 text-xs leading-5 sm:text-sm">
                  Generated via loyalty program
                </p>
              </div>
              <div className="bg-background ring-foreground/5 flex flex-col items-center rounded-xl p-6 text-center shadow-sm ring-1 sm:p-8">
                <div className="text-primary text-3xl font-bold sm:text-4xl lg:text-5xl">
                  1M
                </div>
                <p className="text-foreground/70 mt-3 text-xs leading-5 sm:text-sm">
                  Customer data captured via loyalty
                </p>
              </div>
              <div className="bg-background ring-foreground/5 flex flex-col items-center rounded-xl p-6 text-center shadow-sm ring-1 sm:p-8">
                <div className="text-primary text-3xl font-bold sm:text-4xl lg:text-5xl">
                  38%
                </div>
                <p className="text-foreground/70 mt-3 text-xs leading-5 sm:text-sm">
                  Loyalty retention rate
                </p>
              </div>
              <div className="bg-background ring-foreground/5 flex flex-col items-center rounded-xl p-6 text-center shadow-sm ring-1 sm:p-8">
                <div className="text-primary text-3xl font-bold sm:text-4xl lg:text-5xl">
                  10K/Month
                </div>
                <p className="text-foreground/70 mt-3 text-xs leading-5 sm:text-sm">
                  Amount spent by top 20-30 customers
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Tabs Section */}
        <section
          id="features"
          aria-label="Features"
          className="py-12 sm:py-16 lg:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Everything You Need to Grow Your Business
              </h2>
              <p className="text-foreground/70 mt-4 text-base leading-7 sm:text-lg">
                Powerful features designed specifically for business success
              </p>
            </div>

            {/* Tabs */}
            <div className="mx-auto mt-12 max-w-7xl">
              <div className="border-foreground/10 border-b">
                <nav
                  className="-mb-px flex flex-wrap gap-2 pb-4 sm:gap-4 sm:space-x-2"
                  aria-label="Tabs"
                >
                  {features.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => setActiveTab(feature.id)}
                      className={`border-b-2 px-2 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:px-3 sm:py-3 sm:text-sm lg:px-4 lg:text-base ${
                        activeTab === feature.id
                          ? "border-primary text-primary"
                          : "text-foreground/60 hover:border-foreground/30 hover:text-foreground border-transparent"
                      } `}
                      aria-selected={activeTab === feature.id}
                      aria-controls={`tab-panel-${feature.id}`}
                    >
                      {feature.name}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Panels */}
              <div className="mt-8 lg:mt-12">
                <div
                  id={`tab-panel-${activeFeature.id}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${activeFeature.id}`}
                >
                  <div className="mx-auto max-w-5xl">
                    <div className="text-center">
                      <h3 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                        {activeFeature.title}
                      </h3>
                      <p className="text-foreground/70 mx-auto mt-4 max-w-2xl text-base leading-7 sm:text-lg">
                        {activeFeature.description}
                      </p>
                    </div>

                    {/* Stats for features that have them */}
                    {activeFeature.stats && (
                      <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                        {activeFeature.stats.map((stat, index) => (
                          <div
                            key={index}
                            className="bg-foreground/5 flex flex-col items-center rounded-lg p-4 text-center sm:p-6"
                          >
                            <div className="text-primary text-2xl font-bold sm:text-3xl lg:text-4xl">
                              {stat.label}
                            </div>
                            <p className="text-foreground/70 mt-2 text-xs leading-5 sm:text-sm">
                              {stat.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Benefits */}
                    <div className="mx-auto mt-12 max-w-4xl">
                      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
                        {activeFeature.benefits.map((benefit, index) => (
                          <div
                            key={index}
                            className="bg-background ring-foreground/5 rounded-xl p-6 ring-1 sm:p-8"
                          >
                            <h4 className="text-foreground text-lg font-semibold sm:text-xl">
                              {benefit.title}
                            </h4>
                            <p className="text-foreground/70 mt-3 text-sm leading-6 sm:text-base">
                              {benefit.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section
          aria-label="Testimonials"
          className="bg-foreground/5 py-12 sm:py-16 lg:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Trusted by Businesses Nationwide
              </h2>
            </div>
            <div className="mx-auto mt-12 max-w-4xl">
              <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
                <div className="bg-background ring-foreground/10 rounded-xl p-6 text-sm leading-6 ring-1 sm:p-8">
                  <blockquote className="text-foreground">
                    <p>
                      &ldquo;DY helped us generate incredible traffic for our
                      festival campaign. The campaign delivered a remarkable
                      204× ROI.&rdquo;
                    </p>
                  </blockquote>
                  <figcaption className="mt-4">
                    <div className="text-foreground font-semibold">
                      Business Owner
                    </div>
                    <div className="text-foreground/70">Bercos</div>
                  </figcaption>
                </div>
                <div className="bg-background ring-foreground/10 rounded-xl p-6 text-sm leading-6 ring-1 sm:p-8">
                  <blockquote className="text-foreground">
                    <p>
                      &ldquo;Helped us generate ₹2.5 Cr+ in additional revenue
                      through our loyalty program. The automated features saved
                      us countless hours.&rdquo;
                    </p>
                  </blockquote>
                  <figcaption className="mt-4">
                    <div className="text-foreground font-semibold">
                      Business Chain
                    </div>
                    <div className="text-foreground/70">Multiple Locations</div>
                  </figcaption>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          id="get-started"
          aria-label="Get started"
          className="bg-primary py-12 sm:py-16 lg:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Ready to Make Loyalty Work for Your Brand?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/90 sm:text-lg">
                Join thousands of businesses already using DY to transform their
                customer relationships and drive revenue growth.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                <a
                  href={DEMO_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-lg border-2 border-white/20 bg-transparent px-8 py-4 text-base font-semibold text-white shadow-sm transition-all hover:border-white/40 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
                >
                  Schedule a Demo
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer
        className="border-foreground/10 bg-background border-t py-8"
        role="contentinfo"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-foreground/70 text-sm">
              &copy; {new Date().getFullYear()} DY. All Rights Reserved.
            </p>
            <p className="text-foreground/70 text-sm">
              Own Data. Build Loyalty. Drive Growth.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
