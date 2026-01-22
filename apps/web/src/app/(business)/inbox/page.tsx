import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export default async function InboxPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  console.log(session?.user,"From inbox page");

  return (
    <div>
      <h1>Inbox</h1>
    </div>
  );
}