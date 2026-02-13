import type { Metadata } from "next";
import { FeedbackPageClient } from "./_components/FeedbackPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessSlug: string; token: string }>;
}): Promise<Metadata> {
  const { businessSlug } = await params;
  return {
    title: "Feedback",
    description: `Share your feedback – ${businessSlug}`,
  };
}

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ businessSlug: string; token: string }>;
}) {
  const { businessSlug, token } = await params;
  return <FeedbackPageClient businessSlug={businessSlug} token={token} />;
}
