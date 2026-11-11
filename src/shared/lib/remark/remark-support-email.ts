import { visit } from "unist-util-visit";

/** 在渲染时统一支持邮箱，保留内容源文件。 */
export function remarkSupportEmail() {
  const email =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@barkobear.com";
  const replaceEmail = (value: string) =>
    /^https?:\/\/(?:ocdn|cdn)\.10b\.ai\//i.test(value)
      ? value
      : value
          .replace(/support@joymagic\.fun/gi, email)
          .replace(
            /https?:\/\/(?:www\.)?(?:joymagic\.fun|10b\.ai)/gi,
            "https://barkobear.com",
          )
          .replace(/\bjoymagic\b/gi, "Barko Bear")
          .replace(/\b10b\.ai\b/gi, "Barko Bear");

  return (tree: any) => {
    visit(tree, (node: any) => {
      if (node.type === "text" && typeof node.value === "string") {
        node.value = replaceEmail(node.value);
      }
      if (
        (node.type === "link" || node.type === "definition") &&
        typeof node.url === "string"
      ) {
        node.url = replaceEmail(node.url);
      }
    });
  };
}
