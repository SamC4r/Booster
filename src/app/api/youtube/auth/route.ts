import { getAuthUrl } from "@/lib/youtube";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  redirect(getAuthUrl());
}
