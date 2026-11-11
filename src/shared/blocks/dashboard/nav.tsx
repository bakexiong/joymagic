'use client';

import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';

import { Link, usePathname, useRouter } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { toCdnUrl } from '@/shared/lib/cdn';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/shared/components/ui/sidebar';
import { NavItem, type Nav as NavType } from '@/shared/types/blocks/common';

// 独立的 Collapsible Item 组件，避免在循环中使用 hooks
function NavCollapsibleItem({ item, pathname, mounted }: { item: NavItem; pathname: string; mounted: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  // 在客户端挂载后设置初始状态，避免 hydration mismatch
  useEffect(() => {
    setIsOpen(item?.is_expand || false);
  }, [item?.is_expand]);

  return (
    <Collapsible
      asChild
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group/collapsible"
    >
              <SidebarMenuItem>
                {item?.children ? (
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item?.title}
                      className={`${
                        item?.is_active ||
                        (mounted &&
                          item?.url &&
                          pathname.startsWith(item?.url as string))
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 hover:text-sidebar-accent-foreground active:bg-sidebar-accent/90 active:text-sidebar-accent-foreground min-w-8 duration-200 ease-linear'
                          : ''
                      }`}
                    >
                      {toCdnUrl(item?.icon_url) ? (
                        <img src={toCdnUrl(item.icon_url)!} alt={item.title || ''} className="size-5 object-contain" />
                      ) : item?.icon ? (
                        <SmartIcon name={item.icon as string} />
                      ) : null}
                      <span>{item?.title || ''}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                ) : (
                  <SidebarMenuButton
                    asChild
                    tooltip={item?.title}
                    className={`${
                      item?.is_active ||
                      (mounted &&
                        item?.url &&
                        pathname.startsWith(item?.url as string))
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 hover:text-sidebar-accent-foreground active:bg-sidebar-accent/90 active:text-sidebar-accent-foreground min-w-8 duration-200 ease-linear'
                        : ''
                    }`}
                  >
                    <Link
                      href={item?.url as string}
                      target={item?.target as string}
                    >
                      {toCdnUrl(item?.icon_url) ? (
                        <img src={toCdnUrl(item.icon_url)!} alt={item.title || ''} className="size-5 object-contain" />
                      ) : item?.icon ? (
                        <SmartIcon name={item.icon as string} />
                      ) : null}
                      <span>{item?.title || ''}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
                {item?.children && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.children?.map((subItem: NavItem) => (
                        <SidebarMenuSubItem
                          key={subItem.title || subItem.title}
                        >
                          <SidebarMenuSubButton
                            asChild
                            className={`${
                              subItem.is_active ||
                              (mounted &&
                                pathname.endsWith(subItem.url as string))
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 hover:text-sidebar-accent-foreground active:bg-sidebar-accent/90 active:text-sidebar-accent-foreground min-w-8 duration-200 ease-linear'
                                : ''
                            }`}
                          >
                            <Link
                              href={subItem.url as string}
                              target={subItem.target as string}
                            >
                              {toCdnUrl(subItem.icon_url) ? (
                                <img src={toCdnUrl(subItem.icon_url)!} alt={subItem.title || ''} className="size-4 object-contain" />
                              ) : subItem.icon ? (
                                <SmartIcon name={subItem.icon as string} className="size-4" />
                              ) : null}
                              <span className={subItem.icon_url || subItem.icon ? '' : 'px-2'}>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
    </Collapsible>
  );
}

export function Nav({ nav, className }: { nav: NavType; className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SidebarGroup className={className}>
      <SidebarGroupContent className="mt-0 flex flex-col gap-2">
        {nav.title && <SidebarGroupLabel>{nav.title}</SidebarGroupLabel>}
        <SidebarMenu>
          {nav.items.map((item: NavItem | undefined) => (
            <NavCollapsibleItem
              key={item?.title || item?.title || ''}
              item={item!}
              pathname={pathname}
              mounted={mounted}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
