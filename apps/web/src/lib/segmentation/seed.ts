import { db } from "@reelo/db";
import { DEFAULT_SEGMENTS } from "./defaults";

export async function seedDefaultSegments(businessId: string): Promise<void> {
  const existing = await db.segment.findMany({
    where: { businessId },
    select: { slug: true },
  });

  if (existing.length === 0) {
    await db.segment.createMany({
      data: DEFAULT_SEGMENTS.map((d) => ({
        businessId,
        name: d.name,
        slug: d.slug,
        description: d.description,
        proTip: d.proTip,
        sortOrder: d.sortOrder,
        isSystem: true,
        recencyOperator: d.recencyOperator,
        recencyValue: d.recencyValue,
        recencyValue2: d.recencyValue2,
        recencyUnit: "DAYS",
        frequencyOperator: d.frequencyOperator,
        frequencyValue: d.frequencyValue,
        frequencyValue2: d.frequencyValue2,
        monetaryUnit: d.monetaryUnit ?? "RATIO",
        monetaryOperator: d.monetaryOperator,
        monetaryValue: d.monetaryValue,
        monetaryValue2: d.monetaryValue2,
      })),
    });
    return;
  }

  const hasOther = existing.some((s) => s.slug === "other");
  if (!hasOther) {
    const otherDef = DEFAULT_SEGMENTS.find((d) => d.slug === "other");
    if (otherDef) {
      await db.segment.create({
        data: {
          businessId,
          name: otherDef.name,
          slug: otherDef.slug,
          description: otherDef.description,
          proTip: otherDef.proTip,
          sortOrder: otherDef.sortOrder,
          isSystem: true,
          recencyOperator: null,
          recencyValue: null,
          recencyValue2: null,
          recencyUnit: "DAYS",
          frequencyOperator: null,
          frequencyValue: null,
          frequencyValue2: null,
          monetaryUnit: "RATIO",
          monetaryOperator: null,
          monetaryValue: null,
          monetaryValue2: null,
        },
      });
    }
  }
}
