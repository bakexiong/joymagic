import { VerificationCode } from '@/shared/blocks/email/verification-code';
import { respData, respErr } from '@/shared/lib/resp';
import { getEmailService } from '@/shared/services/email';
import { getAllConfigs } from '@/shared/models/config';

export async function POST(req: Request) {
  try {
    const { emails, subject } = await req.json();

    const configs = await getAllConfigs();
    const emailService = getEmailService(configs);

    const result = await emailService.sendEmail({
      to: emails,
      subject: subject,
      react: VerificationCode({ code: '123455' }),
    });

    console.log('send email result', result);

    return respData(result);
  } catch (e) {
    console.log('send email failed:', e);
    return respErr('send email failed');
  }
}
