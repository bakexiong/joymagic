import { PAYMENTS_AVAILABLE } from "@/config/site";
import { getUserInfo } from "@/shared/models/user";
import { respData, respErr } from "@/shared/lib/resp";
import { confirmCheckoutOrder } from "@/shared/services/payment";

export async function POST(req: Request) {
  if (!PAYMENTS_AVAILABLE) {
    return Response.json(
      {
        code: -1,
        message: "Public beta: payment confirmation is unavailable.",
      },
      { status: 503 },
    );
  }
  try {
    const { order_no: orderNo } = await req.json();
    if (!orderNo) {
      return respErr("order_no is required");
    }

    const user = await getUserInfo();
    if (!user?.id) {
      return respErr("no auth, please sign in");
    }

    const result = await confirmCheckoutOrder({
      orderNo,
      userId: user.id,
    });

    return respData({
      orderNo: result.order.orderNo,
      status: result.order.status,
      productId: result.order.productId,
      productName: result.order.productName,
      paymentType: result.order.paymentType,
      callbackUrl: result.order.callbackUrl,
      amount: result.order.paymentAmount ?? result.order.amount,
      currency: result.order.paymentCurrency ?? result.order.currency,
      discountCode: result.order.discountCode,
      userEmail: result.order.paymentEmail ?? result.order.userEmail,
      paidAt: result.order.paidAt,
    });
  } catch (error: any) {
    console.error("[Payment Confirm API] confirm failed:", error);
    return respErr(error?.message || "confirm failed");
  }
}
