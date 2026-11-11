import { getScopedPaymentService } from '@/shared/services/payment';

import { handlePaymentNotifyEvent } from '../../shared';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;

    if (!provider) {
      throw new Error('provider is required');
    }

    const paymentService = await getScopedPaymentService('zimage');
    const paymentProvider = paymentService.getProvider(provider);
    if (!paymentProvider) {
      throw new Error('payment provider not found');
    }

    const event = await paymentProvider.getPaymentEvent({ req });
    if (!event) {
      throw new Error('payment event not found');
    }

    await handlePaymentNotifyEvent({ event, provider });

    return Response.json({
      message: 'success',
    });
  } catch (err: any) {
    console.log('handle zimage payment notify failed', err);
    return Response.json(
      {
        message: `handle zimage payment notify failed: ${err.message}`,
      },
      {
        status: 500,
      }
    );
  }
}
