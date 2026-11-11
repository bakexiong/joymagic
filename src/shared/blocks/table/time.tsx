import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useLocale } from 'next-intl';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';
import 'dayjs/locale/de';
import 'dayjs/locale/ko';
import 'dayjs/locale/ja';
import 'dayjs/locale/es';
import 'dayjs/locale/it';
import 'dayjs/locale/pt-br';
import 'dayjs/locale/ru';
import 'dayjs/locale/tr';

dayjs.extend(relativeTime);

export function Time({
  value,
  placeholder,
  metadata,
  className,
}: {
  value: string | Date;
  placeholder?: string;
  metadata?: Record<string, any>;
  className?: string;
}) {
  if (!value) {
    if (placeholder) {
      return <div className={className}>{placeholder}</div>;
    }

    return null;
  }

  let locale = useLocale();
  if (locale === 'zh') {
    locale = 'zh-cn';
  }

  return (
    <div className={className}>
      {metadata?.format
        ? dayjs(value).locale(locale).format(metadata?.format)
        : dayjs(value).locale(locale).fromNow()}
    </div>
  );
}
