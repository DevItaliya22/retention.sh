import { Building2, DollarSign, Users } from "lucide-react";

export default function StatsSection() {
  const stats = [
    {
      title: "More Revenue",
      icon: <DollarSign className="size-12" />,
      percentage: "87%",
      description:
        "of businesses saw a 25-50% increase in revenue with DY's loyalty platform.",
    },
    {
      title: "Stronger Brand",
      icon: <Building2 className="size-12" />,
      percentage: "92%",
      description:
        "of businesses say DY helps them build stronger customer relationships and brand loyalty.",
    },
    {
      title: "More Customers",
      icon: <Users className="size-12" />,
      percentage: "78%",
      description:
        "of businesses report increased customer retention and repeat purchases using DY.",
    },
  ];

  return (
    <section className="bg-[#F1F1F1] py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-foreground text-3xl font-bold sm:text-4xl md:text-5xl">
            Why Businesses Love DY
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`,
              }}
            >
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="bg-primary/20 absolute inset-0 rounded-full blur-2xl"></div>
                  <div className="bg-primary/10 text-primary relative flex size-24 items-center justify-center rounded-full">
                    {stat.icon}
                  </div>
                </div>
              </div>
              <h3 className="text-foreground mb-4 text-xl font-semibold">
                {stat.title}
              </h3>
              <div className="text-foreground mb-4 text-5xl font-bold">
                {stat.percentage}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
