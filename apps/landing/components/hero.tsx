import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#F1F1F1] py-20 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Build lasting loyalty that drives growth
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg sm:text-xl">
            Transform your customer relationships into lasting loyalty. Let AI
            create personalized rewards while you focus on growing your
            business.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="#"
              className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-primary rounded-lg px-8 py-3 text-sm font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Get started for free
            </Link>
          </div>
        </div>

        {/* <div className="relative mt-16 md:mt-24">
          <div className="relative mx-auto max-w-4xl">
            <div className="bg-card relative rounded-2xl border p-4 shadow-2xl md:p-8">
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">My Programs</span>
                    <span className="text-muted-foreground text-sm">/</span>
                    <span className="text-muted-foreground text-sm">
                      Loyalty Campaign
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">
                        Introduction
                      </h3>
                      <div className="space-y-2">
                        <div className="bg-muted h-2 w-full rounded"></div>
                        <div className="bg-muted h-2 w-3/4 rounded"></div>
                        <div className="bg-muted h-2 w-5/6 rounded"></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">Goal</h3>
                      <div className="bg-muted mb-2 h-2 w-full overflow-hidden rounded-full">
                        <div className="bg-primary h-full w-3/4"></div>
                      </div>
                      <div className="bg-background h-10 w-full rounded border px-3 py-2 text-sm">
                        <span className="animate-pulse">|</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-popover w-full rounded-lg border p-4 shadow-lg md:w-80 md:p-6">
                  <h3 className="mb-4 text-sm font-semibold">
                    What type of campaign?
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border-primary bg-primary/5 rounded-lg border-2 p-4">
                      <div className="bg-primary/10 mb-2 flex size-10 items-center justify-center rounded">
                        <svg
                          className="text-primary size-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-xs font-medium">Points</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="bg-muted mb-2 flex size-10 items-center justify-center rounded">
                        <svg
                          className="text-muted-foreground size-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                          />
                        </svg>
                      </div>
                      <p className="text-muted-foreground text-xs font-medium">
                        Rewards
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="bg-muted mb-2 flex size-10 items-center justify-center rounded">
                        <svg
                          className="text-muted-foreground size-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-muted-foreground text-xs font-medium">
                        Referral
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="bg-muted mb-2 flex size-10 items-center justify-center rounded">
                        <svg
                          className="text-muted-foreground size-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                          />
                        </svg>
                      </div>
                      <p className="text-muted-foreground text-xs font-medium">
                        Branding
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="absolute -bottom-20 -left-20 -z-10 size-96 rounded-full bg-orange-200/30 blur-3xl"
              aria-hidden="true"
            ></div>
            <div
              className="absolute -right-20 -bottom-20 -z-10 size-96 rounded-full bg-pink-200/30 blur-3xl"
              aria-hidden="true"
            ></div>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center justify-center gap-4 md:mt-24">
          <p className="text-muted-foreground text-sm">
            Join 80,000+ businesses
          </p>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="border-background size-10 rounded-full border-2 bg-gradient-to-br from-blue-400 to-purple-500"
                ></div>
              ))}
            </div>
            <div className="bg-primary text-primary-foreground rounded-full px-4 py-1.5 text-xs font-semibold">
              1,234+
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
}
