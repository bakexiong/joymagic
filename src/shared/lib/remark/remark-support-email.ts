import { visit } from 'unist-util-visit';

/** 在渲染时统一支持邮箱，保留内容源文件。 */
export function remarkSupportEmail() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@barkobear.com';
  const replaceEmail = (value: string) => value.replace(/support@joymagic\.fun/gi, email);

  return (tree: any) => {
    visit(tree, (node: any) => {
      if (node.type === 'text' && typeof node.value === 'string') {
        node.value = replaceEmail(node.value);
      }
      if ((node.type === 'link' || node.type === 'definition') && typeof node.url === 'string') {
        node.url = replaceEmail(node.url);
      }
    });
  };
}
