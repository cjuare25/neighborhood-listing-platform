import { createPublicSupabaseClient } from "@/lib/supabaseServer";
import { inquirySchema } from "@/schemas/inquiry";

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return json({ error: "Send valid JSON." }, 400);
  }

  const result = inquirySchema.safeParse(payload);

  if (!result.success) {
    return json({
      error: "Check your email address and message.",
      details: result.error.issues.map((issue) => ({
        path: issue.path.map(String),
        message: issue.message,
      })),
    }, 400);
  }

  try {
    const supabase = createPublicSupabaseClient();
    const { error } = await supabase
      .from("inquiries")
      .insert(result.data);

    if (error) {
      if (error.code === "23503" || error.code === "23514") {
        return json({ error: "Check the property and inquiry details." }, 400);
      }
      return json({ error: "Unable to send your inquiry right now." }, 503);
    }

    return json({ message: "Your inquiry has been sent." }, 201);
  } catch {
    return json({ error: "Unable to send your inquiry right now." }, 503);
  }
}
