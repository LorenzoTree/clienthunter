import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  const payload = await req.text();
  const headerPayload = headers();

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET as string);

  try {
    const evt = wh.verify(payload, {
      "svix-id": headerPayload.get("svix-id") || "",
      "svix-timestamp": headerPayload.get("svix-timestamp") || "",
      "svix-signature": headerPayload.get("svix-signature") || "",
    });

    const event = evt as any;
    const eventType = event.type;

    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses } = event.data;
      const email = email_addresses?.[0]?.email_address ?? null;

      await supabase
        .from("users")
        .upsert({ clerk_id: id, email }, { onConflict: "clerk_id" });
    }

    if (eventType === "user.deleted") {
      const { id } = event.data;
      await supabase.from("users").delete().eq("clerk_id", id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
}
