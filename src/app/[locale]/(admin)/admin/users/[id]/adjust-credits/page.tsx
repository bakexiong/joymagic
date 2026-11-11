import { getTranslations, setRequestLocale } from 'next-intl/server';

import {
  PERMISSIONS,
  requireAllPermissions,
} from '@/core/rbac';
import { Empty } from '@/shared/blocks/common';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { FormCard } from '@/shared/blocks/form';
import { getSnowId, getUuid } from '@/shared/lib/hash';
import {
  CreditStatus,
  CreditTransactionScene,
  CreditTransactionType,
  createCredit,
  consumeCredits,
  getRemainingCredits,
} from '@/shared/models/credit';
import { findUserById } from '@/shared/models/user';
import { Crumb } from '@/shared/types/blocks/common';
import { Form } from '@/shared/types/blocks/form';

type AdjustType = 'purchase' | 'compensation' | 'refund' | 'deduction';

const ADJUST_TYPES: AdjustType[] = [
  'purchase',
  'compensation',
  'refund',
  'deduction',
];

export default async function AdjustCreditsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  await requireAllPermissions({
    codes: [PERMISSIONS.USERS_READ, PERMISSIONS.CREDITS_WRITE],
    redirectUrl: '/admin/no-permission',
    locale,
  });

  const user = await findUserById(id);
  if (!user) {
    return <Empty message="User not found" />;
  }

  const remainingCredits = await getRemainingCredits(id);
  const t = await getTranslations('admin.users');

  const crumbs: Crumb[] = [
    { title: t('adjust_credits.crumbs.admin'), url: '/admin' },
    { title: t('adjust_credits.crumbs.users'), url: '/admin/users' },
    { title: t('adjust_credits.crumbs.adjust'), is_active: true },
  ];

  const typeOptions = ADJUST_TYPES.map((type) => ({
    value: type,
    title: t(`adjust_credits.types.${type}`),
  }));

  const form: Form = {
    fields: [
      {
        name: 'email',
        type: 'text',
        title: t('fields.email'),
        attributes: { disabled: true },
      },
      {
        name: 'name',
        type: 'text',
        title: t('fields.name'),
        attributes: { disabled: true },
      },
      {
        name: 'remainingCredits',
        type: 'number',
        title: t('fields.remaining_credits'),
        attributes: { disabled: true },
      },
      {
        name: 'type',
        type: 'select',
        title: t('adjust_credits.fields.type'),
        placeholder: t('adjust_credits.fields.type_placeholder'),
        options: typeOptions,
        validation: { required: true },
      },
      {
        name: 'amount',
        type: 'number',
        title: t('adjust_credits.fields.amount'),
        placeholder: t('adjust_credits.fields.amount_placeholder'),
        validation: { required: true, min: 1 },
      },
      {
        name: 'description',
        type: 'textarea',
        title: t('adjust_credits.fields.description'),
        placeholder: t('adjust_credits.fields.description_placeholder'),
      },
    ],
    passby: {
      user,
    },
    data: {
      ...user,
      remainingCredits,
      type: typeOptions[0]?.value,
    },
    submit: {
      button: {
        title: t('adjust_credits.buttons.submit'),
      },
      handler: async (data, passby) => {
        'use server';

        const { user } = passby;

        if (!user) {
          throw new Error('no auth');
        }

        const adjustType = data.get('type') as AdjustType;
        const amountRaw = data.get('amount') as string;
        const description = ((data.get('description') as string) || '').trim();
        const amount = Number(amountRaw);

        if (!ADJUST_TYPES.includes(adjustType)) {
          throw new Error('invalid adjustment type');
        }

        if (!amount || Number.isNaN(amount) || amount <= 0) {
          throw new Error('amount must be greater than 0');
        }

        const metadata = JSON.stringify({
          adjustType,
          description,
          admin: true,
        });
        const recordDescription =
          description || `Manual adjustment: ${adjustType}`;

        if (adjustType === 'purchase' || adjustType === 'compensation') {
          const credits = amount;
          await createCredit({
            id: getUuid(),
            userId: user.id,
            userEmail: user.email,
            orderNo: '',
            subscriptionNo: '',
            transactionNo: getSnowId(),
            transactionType: CreditTransactionType.GRANT,
            transactionScene: CreditTransactionScene.ADMIN_ADJUST,
            credits,
            remainingCredits: credits,
            description: recordDescription,
            expiresAt: null,
            status: CreditStatus.ACTIVE,
            metadata,
          });
        } else {
          // refund or deduction -> consume credits
          await consumeCredits({
            userId: user.id,
            credits: amount,
            scene: CreditTransactionScene.ADMIN_ADJUST,
            description: recordDescription,
            metadata,
          });
        }

        return {
          status: 'success',
          message: 'Credits adjusted',
          redirect_url: '/admin/users',
        };
      },
    },
  };

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader title={t('adjust_credits.title')} />
        <FormCard form={form} className="md:max-w-xl" />
      </Main>
    </>
  );
}
