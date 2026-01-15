"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqData = [
  {
    question: "What is DY?",
    answer:
      "DY is a leading business loyalty and marketing platform that helps businesses across various industries increase customer retention and grow revenue through intelligent marketing automation, personalized loyalty programs, and comprehensive customer insights.",
  },
  {
    question: "What types of campaigns can I create with DY?",
    answer:
      "DY enables you to reach and engage customers through multiple channels including WhatsApp marketing, SMS campaigns, email marketing, and in-app notifications. All campaigns come with ready-to-use templates and automated scheduling features.",
  },
  {
    question: "How long does it take to get started with DY?",
    answer:
      "Most businesses are up and running within 24-48 hours. Our team handles the setup process, including system integration and initial campaign configuration, making it hassle-free for you to start building customer loyalty.",
  },
  {
    question: "Who can use DY?",
    answer:
      "DY is designed for businesses of all sizes across various industries including retail stores, restaurants and cafes, e-commerce platforms, service providers, SaaS companies, and any business looking to build customer loyalty and drive repeat purchases.",
  },
  {
    question: "Can I integrate DY with my existing business systems?",
    answer:
      "Yes! DY offers seamless API integrations and webhooks to connect with your CRM, POS systems, e-commerce platforms, payment gateways, and other business tools. Our flexible architecture ensures smooth integration with your existing tech stack.",
  },
  {
    question: "What types of loyalty programs does DY support?",
    answer:
      "DY supports various loyalty program types including points-based rewards, tiered memberships, referral programs, cashback offers, and custom promotional campaigns. You can create programs for birthdays, anniversaries, seasonal sales, or any special occasion.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-[#F1F1F1] py-20 md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Everything you need to know about DY's loyalty platform
          </p>
        </div>

        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="bg-card hover:border-primary/20 rounded-lg border transition-all duration-300 hover:shadow-md"
              style={{
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
              }}
            >
              <button
                onClick={() => toggleItem(index)}
                className="hover:bg-muted/30 flex w-full items-center justify-between gap-4 rounded-lg px-6 py-5 text-left transition-colors"
                aria-expanded={openIndex === index}
              >
                <span
                  className={`text-base font-semibold transition-colors sm:text-lg ${
                    openIndex === index ? "text-primary" : "text-foreground"
                  }`}
                >
                  {faq.question}
                </span>
                <ChevronDown
                  className={`text-muted-foreground size-5 shrink-0 transition-all duration-300 ${
                    openIndex === index ? "text-primary rotate-180" : "rotate-0"
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  openIndex === index
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div
                  className={`px-6 pb-5 transition-all duration-500 ${
                    openIndex === index
                      ? "translate-y-0 opacity-100"
                      : "-translate-y-2 opacity-0"
                  }`}
                >
                  <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
