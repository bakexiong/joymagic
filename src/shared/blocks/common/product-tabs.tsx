'use client';

import { useEffect, useState } from 'react';
import { Link, usePathname } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { NavItem } from '@/shared/types/blocks/common';
import { cn } from '@/shared/lib/utils';

interface ProductTabsProps {
    className?: string;
    headerNavItems?: NavItem[];
}

interface TabData {
    title: string;
    children: NavItem[];
}

type ActiveTabType = 'image' | 'video';

export function ProductTabs({ className, headerNavItems }: ProductTabsProps) {
    const pathname = usePathname();
    const [imageTab, setImageTab] = useState<TabData | null>(null);
    const [videoTab, setVideoTab] = useState<TabData | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTabType>('image');

    // 检查 URL 是否匹配当前路径
    const isActive = (url?: string): boolean => {
        if (!url) return false;
        // 在首页默认高亮 Auto
        if (pathname === '/' && url === '/text-to-image/gpt-image-2') {
            return true;
        }
        return pathname === url || pathname.startsWith(`${url}/`);
    };

    // 检查 URL 是否是最精确匹配（用于子项，确保只激活最精确的那个）
    const isMostSpecificActive = (url: string, allUrls: string[]): boolean => {
        if (!url) return false;
        // 精确匹配总是激活
        if (pathname === url) return true;
        
        // 前缀匹配时，检查是否有更具体的匹配
        if (pathname.startsWith(`${url}/`)) {
            // 找到所有匹配的 URL，按长度排序（最长的最精确）
            const matchingUrls = allUrls.filter(u => 
                u && (pathname === u || pathname.startsWith(`${u}/`))
            ).sort((a, b) => (b?.length || 0) - (a?.length || 0));
            
            // 如果当前 URL 不是最精确的匹配，返回 false
            return matchingUrls.length > 0 && matchingUrls[0] === url;
        }
        
        return false;
    };

    // 检查子项是否激活
    const hasActiveChild = (item: NavItem): boolean => {
        if (!item.children?.length) return false;
        // 在首页时，如果这个分组包含默认文生图入口 (/text-to-image/gpt-image-2)，默认高亮
        if (pathname === '/') {
            const hasAutoChild = item.children.some((child) => {
                if (child.url === '/text-to-image/gpt-image-2') return true;
                if (child.children) {
                    return child.children.some((nested) => nested.url === '/text-to-image/gpt-image-2');
                }
                return false;
            });
            if (hasAutoChild) return true;
        }
        return item.children.some((child) => {
            if (child.url && isActive(child.url)) return true;
            if (child.children) {
                return child.children.some((nested) => nested.url && isActive(nested.url));
            }
            return false;
        });
    };

    // 从 headerNavItems 提取 Image AI 和 Video AI 数据
    useEffect(() => {
        if (!headerNavItems?.length) {
            setImageTab(null);
            setVideoTab(null);
            return;
        }

        const imageMenu = headerNavItems.find(
            (item) => item?.icon === 'Image' && item.children?.length
        );

        const videoMenu = headerNavItems.find(
            (item) => item?.icon === 'Video' && item.children?.length
        );

        if (imageMenu?.title && imageMenu.children?.length) {
            setImageTab({
                title: imageMenu.title,
                children: imageMenu.children,
            });
        } else {
            setImageTab(null);
        }

        if (videoMenu?.title && videoMenu.children?.length) {
            setVideoTab({
                title: videoMenu.title,
                children: videoMenu.children,
            });
        } else {
            setVideoTab(null);
        }
    }, [headerNavItems]);

    // 根据当前 URL 自动切换到对应的 tab
    useEffect(() => {
        if (!imageTab && !videoTab) return;

        // 检查当前路径是否匹配 Video AI 的子项
        const isVideoPath = (tab: TabData | null): boolean => {
            if (!tab?.children) return false;
            return tab.children.some((item) => {
                if (item.url && isActive(item.url)) return true;
                if (item.children) {
                    return item.children.some((child) => child.url && isActive(child.url));
                }
                return false;
            });
        };

        // 检查当前路径是否匹配 Image AI 的子项
        const isImagePath = (tab: TabData | null): boolean => {
            if (!tab?.children) return false;
            return tab.children.some((item) => {
                if (item.url && isActive(item.url)) return true;
                if (item.children) {
                    return item.children.some((child) => child.url && isActive(child.url));
                }
                return false;
            });
        };

        if (isVideoPath(videoTab)) {
            setActiveTab('video');
        } else if (isImagePath(imageTab)) {
            setActiveTab('image');
        }
        // 首页默认保持 image tab
    }, [pathname, imageTab, videoTab]);

    // 渲染单个链接项（一级选项，无子项）
    const renderLinkItem = (item: NavItem, index: number) => {
        if (!item.url) return null;

        const linkActive = isActive(item.url);
        return (
            <Link
                key={index}
                href={item.url}
                prefetch
                className={cn(
                    'group relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer',
                    'transition-all duration-200 ease-out',
                    'hover:border-amber-400/60 hover:bg-amber-500/15 hover:shadow-[0_0_20px_-5px_rgba(251,191,36,0.3)] hover:-translate-y-0.5',
                    linkActive
                        ? 'border-amber-400/60 bg-amber-500/20 shadow-[0_0_20px_-5px_rgba(251,191,36,0.25)]'
                        : 'border-white/10 bg-white/5 backdrop-blur-sm'
                )}
            >
                {item.icon && (
                    <SmartIcon
                        name={item.icon as string}
                        className={cn(
                            'h-4 w-4 shrink-0 transition-colors duration-200',
                            linkActive ? 'text-amber-400' : 'text-foreground/70 group-hover:text-amber-400'
                        )}
                    />
                )}
                <span className={cn(
                    'font-medium transition-colors duration-200 whitespace-nowrap',
                    linkActive ? 'text-amber-100' : 'text-foreground group-hover:text-amber-100'
                )}>
                    {item.title}
                </span>
                {item.badge && (
                    <span className="inline-flex items-center rounded-full bg-linear-to-r from-red-500/30 to-pink-500/30 px-2 py-0.5 text-[10px] font-bold text-red-300 ring-1 ring-inset ring-red-400/40 shadow-sm">
                        {item.badge}
                    </span>
                )}
            </Link>
        );
    };

    // 渲染分组（有子项的分类）
    const renderGroup = (item: NavItem, index: number) => {
        const groupActive = hasActiveChild(item);

        return (
            <div
                key={index}
                className={cn(
                    'rounded-xl border p-2 md:p-3 transition-all duration-300',
                    'backdrop-blur-md',
                    groupActive
                        ? 'border-amber-400/30 bg-linear-to-br from-amber-500/10 via-amber-500/5 to-transparent shadow-[0_4px_30px_-10px_rgba(251,191,36,0.2)]'
                        : 'border-white/10 bg-white/3'
                )}
            >
                {/* 一级选项 - 分组标题 */}
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                    {item.icon && (
                        <div className={cn(
                            'flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-200',
                            groupActive
                                ? 'bg-amber-500/20'
                                : 'bg-white/10'
                        )}>
                            <SmartIcon
                                name={item.icon as string}
                                className={cn(
                                    'h-4 w-4 transition-colors duration-200',
                                    groupActive ? 'text-amber-400' : 'text-foreground/80'
                                )}
                            />
                        </div>
                    )}
                    <h4 className={cn(
                        'text-sm font-bold transition-colors duration-200 whitespace-nowrap',
                        groupActive ? 'text-amber-300' : 'text-foreground'
                    )}>
                        {item.title}
                    </h4>
                </div>

                {/* 二级选项 - 移动端两列网格，桌面端水平排列 */}
                <div className="grid grid-cols-2 gap-1.5 md:flex md:flex-row md:flex-wrap md:items-center md:gap-2">
                    {item.children?.map((child, childIndex) => {
                        if (!child.url) return null;
                        // 获取所有子项的 URL 列表，用于精确匹配判断
                        const allChildUrls = item.children
                            ?.map(c => c.url)
                            .filter((url): url is string => !!url) || [];
                        // 使用 isMostSpecificActive 确保只激活最精确匹配的项
                        const childActive = isMostSpecificActive(child.url, allChildUrls);
                        return (
                            <Link
                                key={childIndex}
                                href={child.url}
                                prefetch
                                className={cn(
                                    'group relative flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm cursor-pointer',
                                    'transition-all duration-200 ease-out',
                                    'hover:border-amber-400/40 hover:bg-amber-500/10 hover:-translate-y-0.5',
                                    childActive
                                        ? 'border-amber-400/40 bg-amber-500/15 shadow-sm'
                                        : 'border-white/5 bg-white/2'
                                )}
                            >
                                {child.icon && (
                                    <SmartIcon
                                        name={child.icon as string}
                                        className={cn(
                                            'h-3.5 w-3.5 shrink-0 transition-colors duration-200',
                                            childActive ? 'text-amber-400/80' : 'text-foreground/50 group-hover:text-amber-400/80'
                                        )}
                                    />
                                )}
                                <span className={cn(
                                    'font-normal transition-colors duration-200 whitespace-nowrap',
                                    childActive ? 'text-amber-100' : 'text-foreground/70 group-hover:text-foreground'
                                )}>
                                    {child.title}
                                </span>
                                {child.badge && (
                                    <span className="inline-flex items-center rounded-full bg-linear-to-r from-red-500/30 to-pink-500/30 px-1.5 py-0.5 text-[10px] font-bold text-red-300 ring-1 ring-inset ring-red-400/40">
                                        {child.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        );
    };

    // 根据分组数量获取网格类名
    const getGridClassName = (count: number) => {
        if (count === 1) return 'grid grid-cols-1';
        if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2';
        if (count === 3) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
        // 4个或更多时，使用自适应布局
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    };

    // 渲染 tab 内容
    const renderTabContent = (tab: TabData | null) => {
        if (!tab || !tab.children?.length) return null;

        // 分离有子项的分组和普通链接项
        const groups: NavItem[] = [];
        const links: NavItem[] = [];

        tab.children.forEach((item) => {
            if (item.children && item.children.length > 0) {
                groups.push(item);
            } else if (item.url) {
                links.push(item);
            }
        });

        return (
            <div className="space-y-2 md:space-y-3">
                {/* 分组内容 - 自适应网格，撑满区域 */}
                {groups.length > 0 && (
                    <div className={cn(getGridClassName(groups.length), 'gap-2 md:gap-3')}>
                        {groups.map((group, index) => renderGroup(group, index))}
                    </div>
                )}

                {/* 普通链接项 */}
                {links.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 md:flex md:flex-row md:flex-wrap md:items-center md:gap-2">
                        {links.map((item, index) => renderLinkItem(item, index))}
                    </div>
                )}
            </div>
        );
    };

    // 如果没有数据，不渲染
    if (!imageTab && !videoTab) {
        return null;
    }

    // 获取当前激活的 tab 数据
    const currentTab = activeTab === 'image' ? imageTab : videoTab;

    return (
        <div className={cn('w-full', className)}>
            <div className="mx-auto max-w-6xl px-4">
                {/* 整体布局：移动端垂直堆叠，桌面端左右排布 */}
                <div className="flex flex-col gap-2 md:flex-row md:gap-3">
                    {/* Tab 切换按钮 - 移动端水平排布，桌面端垂直排布 */}
                    <div className="flex flex-row gap-2 md:flex-col md:shrink-0">
                        {imageTab && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('image')}
                                className={cn(
                                    'group flex items-center justify-center gap-2 rounded-xl border px-3 py-2 cursor-pointer',
                                    'flex-1 md:flex-initial md:w-full md:justify-start md:py-2.5',
                                    'transition-all duration-200 ease-out',
                                    activeTab === 'image'
                                        ? 'border-amber-400/50 bg-linear-to-br from-amber-500/20 to-orange-500/15 shadow-[0_0_20px_-5px_rgba(251,191,36,0.3)]'
                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8 backdrop-blur-sm'
                                )}
                            >
                                <div className={cn(
                                    'flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-200',
                                    activeTab === 'image'
                                        ? 'bg-amber-500/25'
                                        : 'bg-white/10 group-hover:bg-white/15'
                                )}>
                                    <SmartIcon
                                        name="Image"
                                        className={cn(
                                            'h-4 w-4 transition-colors duration-200',
                                            activeTab === 'image' ? 'text-amber-400' : 'text-foreground/70 group-hover:text-foreground'
                                        )}
                                    />
                                </div>
                                <span className={cn(
                                    'font-semibold text-sm transition-colors duration-200 whitespace-nowrap',
                                    activeTab === 'image' ? 'text-amber-100' : 'text-foreground/80 group-hover:text-foreground'
                                )}>
                                    {imageTab.title}
                                </span>
                            </button>
                        )}
                        {videoTab && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('video')}
                                className={cn(
                                    'group flex items-center justify-center gap-2 rounded-xl border px-3 py-2 cursor-pointer',
                                    'flex-1 md:flex-initial md:w-full md:justify-start md:py-2.5',
                                    'transition-all duration-200 ease-out',
                                    activeTab === 'video'
                                        ? 'border-amber-400/50 bg-linear-to-br from-amber-500/20 to-orange-500/15 shadow-[0_0_20px_-5px_rgba(251,191,36,0.3)]'
                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8 backdrop-blur-sm'
                                )}
                            >
                                <div className={cn(
                                    'flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-200',
                                    activeTab === 'video'
                                        ? 'bg-amber-500/25'
                                        : 'bg-white/10 group-hover:bg-white/15'
                                )}>
                                    <SmartIcon
                                        name="Video"
                                        className={cn(
                                            'h-4 w-4 transition-colors duration-200',
                                            activeTab === 'video' ? 'text-amber-400' : 'text-foreground/70 group-hover:text-foreground'
                                        )}
                                    />
                                </div>
                                <span className={cn(
                                    'font-semibold text-sm transition-colors duration-200 whitespace-nowrap',
                                    activeTab === 'video' ? 'text-amber-100' : 'text-foreground/80 group-hover:text-foreground'
                                )}>
                                    {videoTab.title}
                                </span>
                            </button>
                        )}
                    </div>

                    {/* 内容容器 - 移动端在下方，桌面端在右侧 */}
                    <div className="flex-1">
                        {renderTabContent(currentTab)}
                    </div>
                </div>
            </div>
        </div>
    );
}
