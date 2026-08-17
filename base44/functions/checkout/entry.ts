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
    const { tier } = body;
    if (!["lifetime", "annual"].includes(tier)) {
      return Response.json({ error: "Invalid tier. Must be 'lifetime' or 'annual'." }, { status: 400 });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return Response.json({ error: "Payments not yet configured." }, { status: 503 });
    }

    // Derive base URL for redirect URLs from request headers
    const origin = req.headers.get("origin") || "";
    const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
    const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const baseUrl =
      origin ||
      (forwardedHost ? `${forwardedProto}://${forwardedHost}` : "") ||
      Deno.env.get("APP_URL") ||
      "";
    if (!baseUrl) {
      return Response.json({ error: "Cannot determine app URL for redirect." }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    let sessionParams: Stripe.Checkout.SessionCreateParams;

    if (tier === "lifetime") {
      sessionParams = {
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Invoice Extractor — Lifetime Access",
                description: "Unlimited invoice scans, forever. All current and future features included.",
              },
              unit_amount: 1900,
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/app`,
        customer_email: user.email,
        metadata: { user_id: user.id, tier: "lifetime" },
      };
    } else {
      sessionParams = {
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Invoice Extractor — Annual Plan",
                description: "Unlimited invoice scans for 12 months, renews annually.",
              },
              unit_amount: 7900,
              recurring: { interval: "year" },
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/app`,
        customer_email: user.email,
        metadata: { user_id: user.id, tier: "annual" },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return Response.json({ url: session.url });
  } catch (error) {
    console.error("checkout handler error:", error);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
});
