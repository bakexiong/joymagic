import { redirect } from "next/navigation";

import { envConfigs } from "@/config";
import { getUserInfo } from "@/shared/models/user";
import { confirmCheckoutOrder } from "@/shared/services/payment";

export async function GET(req: Request) {
  let redirectUrl = "";

  try {
    // get callback params
    const { searchParams } = new URL(req.url);
    const orderNo = searchParams.get("order_no");

    if (!orderNo) {
      throw new Error("invalid callback params");
    }

    // get sign user
    const user = await getUserInfo();
    if (!user || !user.email) {
      throw new Error("no auth, please sign in");
    }

    const { order } = await confirmCheckoutOrder({
      orderNo,
      userId: user.id,
    });

    redirectUrl =
      order.callbackUrl ||
      (order.paymentType === "subscription"
        ? `${envConfigs.app_url}/settings/billing`
        : `${envConfigs.app_url}/settings/payments`);
  } catch (e: any) {
    console.log("checkout callback failed:", e);
    redirectUrl = `${envConfigs.app_url}/pricing`;
  }

  redirect(redirectUrl);
}
