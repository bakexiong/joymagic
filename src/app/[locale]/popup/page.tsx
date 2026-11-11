import PopupPreview from './popup-preview';

export default async function PopupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  return <PopupPreview />;
}
