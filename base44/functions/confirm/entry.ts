import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import Stripe from "npm:stripe@13.11.0";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try {
      user = await base44.auth.me();
    } catch {
      return Response.json({ error: "auth_required" }, { status: 401 });
    }
    if (!user) return Response.json({ error: "auth_required" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { session_id } = body;
    if (!session_id) {
      return Response.json({ error: "session_id required" }, { status: 400 });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return Response.json({ error: "Payments not configured." }, { status: 503 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(session_id);
    } catch {
      return Response.json({ error: "Invalid session." }, { status: 400 });
    }

    // Verify payment succeeded
    if (session.status !== "complete") {
      return Response.json({ error: "Payment not completed." }, { status: 402 });
    }

    // Security: confirm the session belongs to this user
    if (session.metadata?.user_id !== user.id) {
      return Response.json({ error: "Session does not belong to this user." }, { status: 403 });
    }

    const tier = session.metadata?.tier;
    if (!["lifetime", "annual"].includes(tier || "")) {
      return Response.json({ error: "Invalid tier in session." }, { status: 400 });
    }

    // Idempotency: if an entitlement already exists for this session, return success
    const existing = await base44.asServiceRole.entities.Entitlement.filter(
      { stripe_session_id: session_id },
      "-created_date",
      1
    );
    if (existing.length > 0) {
      return Response.json({ success: true, already_exists: true });
    }

    const entitlementData: Record<string, unknown> = {
      type: tier,
      stripe_session_id: session_id,
      created_by_id: user.id,
    };

    if (tier === "annual") {
      // Give 13 months of access so there's buffer around the annual renewal
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 13);
      entitlementData.expires_at = expiresAt.toISOString();
    }

    await base44.asServiceRole.entities.Entitlement.create(entitlementData);
    return Response.json({ success: true });
  } catch (error) {
    console.error("confirm handler error:", error);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
});
