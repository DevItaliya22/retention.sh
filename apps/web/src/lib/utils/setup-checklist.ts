export type SetupChecklistItemId = "loyalty" | "referral" | "feedback";

export type SetupChecklistItem = {
  id: SetupChecklistItemId;
  title: string;
  description: string;
  href: string;
  done: boolean;
};

export type SetupChecklistPayload = {
  items: SetupChecklistItem[];
  completedCount: number;
  total: number;
};

type BusinessSetupFields = {
  loyalty: { id: string } | null;
  referralProgram: { id: string } | null;
  feedbackSetupCompletedAt: Date | null;
};

const SETUP_ITEMS_META: Omit<SetupChecklistItem, "done">[] = [
  {
    id: "loyalty",
    title: "Loyalty program",
    description:
      "Configure earning, rewards, and how customers collect points.",
    href: "/settings/loyalty",
  },
  {
    id: "referral",
    title: "Referral program",
    description: "Reward customers who refer friends and grow organically.",
    href: "/settings/referral",
  },
  {
    id: "feedback",
    title: "Feedback",
    description: "Collect reviews and follow up after each visit.",
    href: "/settings/feedback",
  },
];

export function buildSetupChecklist(
  business: BusinessSetupFields,
): SetupChecklistPayload {
  const doneMap: Record<SetupChecklistItemId, boolean> = {
    loyalty: business.loyalty != null,
    referral: business.referralProgram != null,
    feedback: business.feedbackSetupCompletedAt != null,
  };

  const items: SetupChecklistItem[] = SETUP_ITEMS_META.map((meta) => ({
    ...meta,
    done: doneMap[meta.id],
  }));

  const completedCount = items.filter((i) => i.done).length;

  return {
    items,
    completedCount,
    total: items.length,
  };
}
