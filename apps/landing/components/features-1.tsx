import { cn } from "@/lib/utils";
import {
  BarChart3,
  MessageSquare,
  QrCode,
  Send,
  Star,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

export default function Features() {
  const features = [
    {
      title: "WhatsApp Marketing",
      description:
        "Connect with customers where they're most responsive. Launch campaigns in seconds with ready-to-use templates and automated scheduling.",
      icon: <MessageSquare className="size-6" />,
    },
    {
      title: "Complete Customer View",
      description:
        "Automatically capture and organize data from every interaction. Build comprehensive customer profiles with preferences, behaviors, and key dates.",
      icon: <Users className="size-6" />,
    },
    {
      title: "Automated Campaigns",
      description:
        "Engage customers at the right time without manual work. Send personalized birthday greetings, win-back campaigns, and welcome messages automatically.",
      icon: <Send className="size-6" />,
    },
    {
      title: "Multi-Channel Reach",
      description:
        "Reach maximum customers across platforms. Send messages through email, WhatsApp, and SMS with real-time campaign performance reports.",
      icon: <TrendingUp className="size-6" />,
    },
    {
      title: "Smart QR Codes",
      description:
        "Turn every scan into a growth opportunity. Use QR codes at events and locations to acquire and tag new customers effortlessly.",
      icon: <QrCode className="size-6" />,
    },
    {
      title: "Referral Programs",
      description:
        "Turn loyal customers into brand advocates. Run end-to-end referral programs automatically with incentives that drive growth without breaking the bank.",
      icon: <UserCheck className="size-6" />,
    },
    {
      title: "Reviews & Feedback",
      description:
        "Take control of your digital reputation. Receive instant alerts for feedback, push positive reviews to major platforms, and gather insights to improve.",
      icon: <Star className="size-6" />,
    },
    {
      title: "Advanced Analytics",
      description:
        "Track which campaigns generate actual visits and revenue. Get comprehensive insights to understand customer behavior and optimize your strategies.",
      icon: <BarChart3 className="size-6" />,
    },
  ];
  return (
    <section className="bg-[#F1F1F1] py-16 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold text-balance sm:text-4xl lg:text-5xl">
            Built to cover your needs
          </h2>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg">
            Powerful features designed to help you build and manage successful
            loyalty programs for your business.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "border-foreground/10 group/feature relative flex flex-col py-10 lg:border-r",
        (index === 0 || index === 4) && "border-foreground/10 lg:border-l",
        index < 4 && "border-foreground/10 lg:border-b",
      )}
    >
      {index < 4 && (
        <div className="from-background/50 pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-t to-transparent opacity-0 transition duration-200 group-hover/feature:opacity-100" />
      )}
      {index >= 4 && (
        <div className="from-background/50 pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-b to-transparent opacity-0 transition duration-200 group-hover/feature:opacity-100" />
      )}
      <div className="text-foreground/60 relative z-10 mb-4 px-6 md:px-10">
        {icon}
      </div>
      <div className="relative z-10 mb-2 px-6 text-lg font-bold md:px-10">
        <div className="bg-foreground/20 group-hover/feature:bg-primary absolute inset-y-0 left-0 h-6 w-1 origin-center rounded-tr-full rounded-br-full transition-all duration-200 group-hover/feature:h-8" />
        <span className="text-foreground inline-block transition duration-200 group-hover/feature:translate-x-2">
          {title}
        </span>
      </div>
      <p className="text-muted-foreground relative z-10 max-w-xs px-6 text-sm md:px-10">
        {description}
      </p>
    </div>
  );
};
