"use client";

import {
  ArrowRight,
  ChevronDown,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
} from "lucide-react";
import { useState } from "react";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    services: "",
    budget: "",
    project: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section className="relative min-h-screen bg-[#F1F1F1] py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 md:mb-16">
          <div className="max-w-3xl">
            <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
              Let's work together!
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
              Let us help you become even greater at what you do. Fill out the
              following form and we will get back to you in the next 24 hours.
            </p>
          </div>
        </div>

        <div className="grid gap-8 md:gap-12 lg:grid-cols-2">
          <div className="space-y-6 md:space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              <div className="relative pl-10 md:pl-12">
                <div className="border-foreground/30 bg-background absolute top-0 left-0 flex size-6 items-center justify-center rounded-full border text-[10px] font-medium md:size-7 md:text-xs">
                  01
                </div>
                <div>
                  <label
                    htmlFor="name"
                    className="text-foreground mb-2 block text-sm font-medium"
                  >
                    What's your name?
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="border-foreground/20 text-foreground placeholder:text-muted-foreground focus:border-primary w-full border-0 border-b-2 bg-transparent px-0 py-2 focus:outline-none"
                    placeholder="Type your full name"
                  />
                </div>
              </div>

              <div className="relative pl-10 md:pl-12">
                <div className="border-foreground/30 bg-background absolute top-0 left-0 flex size-6 items-center justify-center rounded-full border text-[10px] font-medium md:size-7 md:text-xs">
                  02
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="text-foreground mb-2 block text-sm font-medium"
                  >
                    What's your email address?
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="border-foreground/20 text-foreground placeholder:text-muted-foreground focus:border-primary w-full border-0 border-b-2 bg-transparent px-0 py-2 focus:outline-none"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <div className="relative pl-10 md:pl-12">
                <div className="border-foreground/30 bg-background absolute top-0 left-0 flex size-6 items-center justify-center rounded-full border text-[10px] font-medium md:size-7 md:text-xs">
                  03
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="text-foreground mb-2 block text-sm font-medium"
                  >
                    What's your phone number?
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="border-foreground/20 text-foreground placeholder:text-muted-foreground focus:border-primary w-full border-0 border-b-2 bg-transparent px-0 py-2 focus:outline-none"
                    placeholder="+11 2222 333344"
                  />
                </div>
              </div>

              <div className="relative pl-10 md:pl-12">
                <div className="border-foreground/30 bg-background absolute top-0 left-0 flex size-6 items-center justify-center rounded-full border text-[10px] font-medium md:size-7 md:text-xs">
                  04
                </div>
                <div>
                  <label
                    htmlFor="company"
                    className="text-foreground mb-2 block text-sm font-medium"
                  >
                    What's your company/organization name?
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="border-foreground/20 text-foreground placeholder:text-muted-foreground focus:border-primary w-full border-0 border-b-2 bg-transparent px-0 py-2 focus:outline-none"
                    placeholder="Type your company/organization name"
                  />
                </div>
              </div>

              <div className="relative pl-10 md:pl-12">
                <div className="border-foreground/30 bg-background absolute top-0 left-0 flex size-6 items-center justify-center rounded-full border text-[10px] font-medium md:size-7 md:text-xs">
                  05
                </div>
                <div>
                  <label
                    htmlFor="services"
                    className="text-foreground mb-2 block text-sm font-medium"
                  >
                    What services are you looking for?
                  </label>
                  <div className="relative">
                    <select
                      id="services"
                      name="services"
                      value={formData.services}
                      onChange={handleChange}
                      className="border-foreground/20 text-foreground focus:border-primary w-full appearance-none border-0 border-b-2 bg-transparent px-0 py-2 pr-8 focus:outline-none"
                    >
                      <option value="">Choose from a list here</option>
                      <option value="loyalty-program">Loyalty Program</option>
                      <option value="marketing-campaigns">
                        Marketing Campaigns
                      </option>
                      <option value="customer-engagement">
                        Customer Engagement
                      </option>
                      <option value="analytics">Analytics & Reporting</option>
                    </select>
                    <ChevronDown className="text-foreground/50 pointer-events-none absolute top-1/2 right-0 size-5 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="relative pl-10 md:pl-12">
                <div className="border-foreground/30 bg-background absolute top-0 left-0 flex size-6 items-center justify-center rounded-full border text-[10px] font-medium md:size-7 md:text-xs">
                  06
                </div>
                <div>
                  <label
                    htmlFor="budget"
                    className="text-foreground mb-2 block text-sm font-medium"
                  >
                    What have you budgeted for this project?
                  </label>
                  <div className="relative">
                    <select
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="border-foreground/20 text-foreground focus:border-primary w-full appearance-none border-0 border-b-2 bg-transparent px-0 py-2 pr-8 focus:outline-none"
                    >
                      <option value="">Choose from a list here</option>
                      <option value="under-10k">Under $10,000</option>
                      <option value="10k-50k">$10,000 - $50,000</option>
                      <option value="50k-100k">$50,000 - $100,000</option>
                      <option value="over-100k">Over $100,000</option>
                    </select>
                    <ChevronDown className="text-foreground/50 pointer-events-none absolute top-1/2 right-0 size-5 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="relative pl-10 md:pl-12">
                <div className="border-foreground/30 bg-background absolute top-0 left-0 flex size-6 items-center justify-center rounded-full border text-[10px] font-medium md:size-7 md:text-xs">
                  07
                </div>
                <div>
                  <label
                    htmlFor="project"
                    className="text-foreground mb-2 block text-sm font-medium"
                  >
                    Tell us about your project
                  </label>
                  <textarea
                    id="project"
                    name="project"
                    rows={4}
                    value={formData.project}
                    onChange={handleChange}
                    className="border-foreground/20 text-foreground placeholder:text-muted-foreground focus:border-primary w-full resize-none border-0 border-b-2 bg-transparent px-0 py-2 focus:outline-none"
                    placeholder="Please type your project description"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="group border-foreground bg-foreground text-background hover:bg-foreground/90 flex w-full items-center justify-center gap-2 rounded-lg border-2 px-6 py-3 text-xs font-semibold uppercase transition-colors sm:gap-3 sm:px-8 sm:py-4 sm:text-sm"
              >
                SEND MESSAGE
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-1 sm:size-4" />
              </button>
            </form>
          </div>

          <div className="space-y-8 md:space-y-12">
            <div>
              <h2 className="text-foreground/70 mb-4 text-base font-bold tracking-wider uppercase md:mb-6 md:text-lg">
                CALL US
              </h2>
              <div className="text-foreground space-y-2">
                <p className="text-base md:text-lg">+11 2158 973027</p>
                <p className="text-base md:text-lg">+11 4845 996738</p>
              </div>
            </div>

            <div>
              <h2 className="text-foreground/70 mb-4 text-base font-bold tracking-wider uppercase md:mb-6 md:text-lg">
                ADDRESS
              </h2>
              <p className="text-foreground text-sm leading-relaxed md:text-base">
                2154 Glen Falls Road
                <br />
                Plymouth Meeting, Pennsylvania(PA), 19462
              </p>
            </div>

            <div>
              <h2 className="text-foreground/70 mb-4 text-base font-bold tracking-wider uppercase md:mb-6 md:text-lg">
                FOLLOW US
              </h2>
              <div className="flex gap-3 md:gap-4">
                <a
                  href="#"
                  className="border-foreground/20 text-foreground hover:border-primary hover:text-primary flex size-10 items-center justify-center rounded-full border-2 transition-colors md:size-12"
                  aria-label="Facebook"
                >
                  <Facebook className="size-4 md:size-5" />
                </a>
                <a
                  href="#"
                  className="border-foreground/20 text-foreground hover:border-primary hover:text-primary flex size-10 items-center justify-center rounded-full border-2 transition-colors md:size-12"
                  aria-label="Twitter"
                >
                  <Twitter className="size-4 md:size-5" />
                </a>
                <a
                  href="#"
                  className="border-foreground/20 text-foreground hover:border-primary hover:text-primary flex size-10 items-center justify-center rounded-full border-2 transition-colors md:size-12"
                  aria-label="Instagram"
                >
                  <Instagram className="size-4 md:size-5" />
                </a>
                <a
                  href="#"
                  className="border-foreground/20 text-foreground hover:border-primary hover:text-primary flex size-10 items-center justify-center rounded-full border-2 transition-colors md:size-12"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="size-4 md:size-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
