import { getPaymentService } from "@/shared/services/payment";

import { handlePaymentNotifyEvent } from "../shared";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const startTime = Date.now();
  try {
    const { provider } = await params;

    if (!provider) {
      throw new Error("provider is required");
    }

    const headerEntries = Object.fromEntries(req.headers.entries());
    console.log("[payment notify] request received", {
      provider,
      method: req.method,
      headerKeys: Object.keys(headerEntries).sort(),
      webhookId: headerEntries["webhook-id"] || "",
      webhookTimestamp: headerEntries["webhook-timestamp"] || "",
      hasWebhookSignature: Boolean(headerEntries["webhook-signature"]),
    });

    const paymentService = await getPaymentService();
    const paymentProvider = paymentService.getProvider(provider);
    if (!paymentProvider) {
      throw new Error("payment provider not found");
    }

    // get payment event from webhook notification
    const event = await paymentProvider.getPaymentEvent({ req });
    if (!event) {
      throw new Error("payment event not found");
    }

    console.log("[payment notify] event parsed", {
      provider,
      eventType: event.eventType,
      orderNo: event.paymentSession?.metadata?.order_no || "",
      transactionId: event.paymentSession?.paymentInfo?.transactionId || "",
      subscriptionId: event.paymentSession?.subscriptionId || "",
      paymentStatus: event.paymentSession?.paymentStatus || "",
    });

    await handlePaymentNotifyEvent({ event, provider });

    console.log("[payment notify] event handled", {
      provider,
      eventType: event.eventType,
      durationMs: Date.now() - startTime,
    });

    return Response.json({
      message: "success",
    });
  } catch (err: any) {
    console.log("handle payment notify failed", {
      message: err?.message || "unknown error",
      stack: err?.stack || "",
      durationMs: Date.now() - startTime,
    });
    return Response.json(
      {
        message: `handle payment notify failed: ${err.message}`,
      },
      {
        status: 500,
      },
    );
  }
}
