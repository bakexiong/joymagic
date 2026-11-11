import { CheckoutSuccess } from "@/shared/blocks/payment/checkout-success";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_no?: string }>;
}) {
  const { order_no: orderNo } = await searchParams;

  return <CheckoutSuccess orderNo={orderNo || ""} />;
}
