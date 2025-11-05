import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const payload = await req.text();
    const headerPayload = await headers();

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

    // Verify webhook
    const evt = wh.verify(payload, {
      "svix-id": headerPayload.get("svix-id") || "",
      "svix-timestamp": headerPayload.get("svix-timestamp") || "",
      "svix-signature": headerPayload.get("svix-signature") || "",
    });

    const { data } = JSON.parse(payload);
    const eventType = (evt as any).type;

    console.log("🟢 Incoming Clerk Event:", eventType);

    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses } = (evt as any).data;
      const email = email_addresses?.[0]?.email_address ?? null;

      const { error } = await supabase
        .from("users")
        .upsert({ clerk_id: id, email }, { onConflict: "clerk_id" });

      if (error) {
        console.error("❌ Supabase upsert failed:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("✅ User upsert successful:", id);
    }

    if (eventType === "user.deleted") {
      const { id } = (evt as any).data;
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("clerk_id", id);

      if (error) {
        console.error("❌ Supabase delete failed:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("✅ User delete successful:", id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("🔥 Webhook failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

