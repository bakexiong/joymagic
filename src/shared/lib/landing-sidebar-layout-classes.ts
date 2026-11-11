import { cn } from "@/shared/lib/utils";

/** 固定基础类，供所有函数复用 */
const BASE_CONTAINER_CLASSES =
  "md:group-data-[layout=with-sidebar]/sidebar-layout:max-w-none md:group-data-[layout=with-sidebar]/sidebar-layout:pl-6 md:group-data-[layout=with-sidebar]/sidebar-layout:pr-6";

const BASE_INNER_CLASSES =
  "md:group-data-[layout=with-sidebar]/sidebar-layout:mx-0 md:group-data-[layout=with-sidebar]/sidebar-layout:mr-auto";

const BASE_ROW_CLASSES =
  "md:group-data-[layout=with-sidebar]/sidebar-layout:mx-0 md:group-data-[layout=with-sidebar]/sidebar-layout:mr-auto md:group-data-[layout=with-sidebar]/sidebar-layout:pl-6";

/** 侧栏布局下完全居中的行：无 mr-auto/ml-auto */
const BASE_ROW_CENTERED_CLASSES =
  "md:group-data-[layout=with-sidebar]/sidebar-layout:mx-auto md:group-data-[layout=with-sidebar]/sidebar-layout:pl-6";

/**
 * 与 landing layout 中 `group/sidebar-layout` + `data-layout="with-sidebar"` 配合：
 * 主内容靠侧栏左对齐，并减小左侧 gutter（避免 container + mx-auto 在大屏留出宽缝）。
 */
export function landingSidebarContainerCn(
  ...classes: (string | undefined | false | null)[]
) {
  return cn(BASE_CONTAINER_CLASSES, ...classes);
}

export function landingSidebarInnerCn(
  ...classes: (string | undefined | false | null)[]
) {
  return cn(BASE_INNER_CLASSES, ...classes);
}

/** 无 `.container` 的块级行（如 FAQ、瀑布流区）：左贴齐 + 小左侧间距
 * @param centered 为 true 时完全居中（无 mr-auto） */
export function landingSidebarRowCn(
  ...classes: (string | undefined | false | null)[]
) {
  return cn(BASE_ROW_CLASSES, ...classes);
}

export function landingSidebarRowCenteredCn(
  ...classes: (string | undefined | false | null)[]
) {
  return cn(BASE_ROW_CENTERED_CLASSES, ...classes);
}

