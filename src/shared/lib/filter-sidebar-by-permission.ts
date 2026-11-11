import type { Nav, NavItem } from "@/shared/types/blocks/common";
import type { Sidebar } from "@/shared/types/blocks/dashboard";

function hasPermission(
  permissionCodes: string[],
  required?: string | string[],
): boolean {
  if (!required) {
    return true;
  }

  const targets = Array.isArray(required) ? required : [required];

  return targets.some((target) => {
    if (permissionCodes.includes(target) || permissionCodes.includes("*")) {
      return true;
    }

    const parts = target.split(".");
    for (let i = parts.length - 1; i > 0; i--) {
      const wildcard = `${parts.slice(0, i).join(".")}.*`;
      if (permissionCodes.includes(wildcard)) {
        return true;
      }
    }

    return false;
  });
}

function filterNavItem(
  item: NavItem,
  permissionCodes: string[],
): NavItem | null {
  if (!hasPermission(permissionCodes, item.permission)) {
    return null;
  }

  const children = item.children
    ?.map((child) => filterNavItem(child, permissionCodes))
    .filter(Boolean) as NavItem[] | undefined;

  if (item.children && (!children || children.length === 0) && !item.url) {
    return null;
  }

  return {
    ...item,
    children,
  };
}

function filterNav(nav: Nav, permissionCodes: string[]): Nav | null {
  const items = nav.items
    .map((item) => filterNavItem(item, permissionCodes))
    .filter(Boolean) as NavItem[];

  if (items.length === 0) {
    return null;
  }

  return {
    ...nav,
    items,
  };
}

export function filterSidebarByPermission(
  sidebar: Sidebar,
  permissionCodes: string[],
): Sidebar {
  const bottomNav = sidebar.bottom_nav
    ? filterNav(sidebar.bottom_nav, permissionCodes)
    : null;

  return {
    ...sidebar,
    main_navs: sidebar.main_navs
      ?.map((nav) => filterNav(nav, permissionCodes))
      .filter(Boolean) as Nav[] | undefined,
    bottom_nav: (bottomNav as Nav) || undefined,
  };
}
