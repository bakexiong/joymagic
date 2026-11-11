"use client";

import { useEffect, useRef, useState } from "react";
import type { NavItem } from "@/shared/types/blocks/common";
import { useAppContext } from "@/shared/contexts/app";

const STORAGE_KEY = "z-image-pinned-tools";
const STORAGE_CONFIGURED_KEY = "z-image-pinned-tools-configured";

function getToolUrl(tool: NavItem): string {
  return tool.url || tool.children?.[0]?.url || "";
}

function getDefaultPinnedUrls(allTools: NavItem[]): string[] {
  const DEFAULT_PINNED_COUNT = 6;
  const preferredMatchers = [
    {
      label: "text-to-image",
      match: (tool: NavItem, url: string, title: string) =>
        url === "/text-to-image" ||
        title.includes("text to image") ||
        title.includes("文生图"),
    },
    {
      label: "image-to-image",
      match: (tool: NavItem, url: string, title: string) =>
        url === "/image-to-image" ||
        title.includes("image to image") ||
        title.includes("图生图"),
    },
    {
      label: "text-to-video",
      match: (tool: NavItem, url: string, title: string) =>
        url === "/text-to-video" ||
        title.includes("text to video") ||
        title.includes("文本生成视频"),
    },
    {
      label: "image-to-video",
      match: (tool: NavItem, url: string, title: string) =>
        url === "/image-to-video" ||
        title.includes("image to video") ||
        title.includes("图片生成视频"),
    },
  ];

  const selectedUrls: string[] = [];

  preferredMatchers.forEach(({ match }) => {
    const matchedTool = allTools.find((tool) => {
      const url = getToolUrl(tool);
      const title = `${tool.title || ""} ${tool.name || ""}`.toLowerCase();
      return Boolean(url) && match(tool, url.toLowerCase(), title);
    });

    const matchedUrl = matchedTool ? getToolUrl(matchedTool) : "";
    if (matchedUrl && !selectedUrls.includes(matchedUrl)) {
      selectedUrls.push(matchedUrl);
    }
  });

  const fallbackUrls = allTools
    .map(getToolUrl)
    .filter((url) => Boolean(url) && !selectedUrls.includes(url));

  return [...selectedUrls, ...fallbackUrls].slice(0, DEFAULT_PINNED_COUNT);
}

export function usePinnedTools(allTools: NavItem[]) {
  const { user } = useAppContext();
  // 仅在用户真实交互（pin/unpin/拖拽/移除/重置）时才同步到数据库，避免初始化阶段产生无意义请求
  const shouldSyncToDbRef = useRef(false);
  const shouldMarkConfiguredRef = useRef(false);

  // 初始值使用空数组，避免 hydration 不匹配
  const [pinnedToolUrls, setPinnedToolUrls] = useState<string[]>([]);

  // 客户端挂载后从 localStorage 读取
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const isConfigured =
        localStorage.getItem(STORAGE_CONFIGURED_KEY) === "true";
      if (stored && isConfigured) {
        setPinnedToolUrls(JSON.parse(stored));
      } else {
        // 未配置过时默认固定 6 个工具
        setPinnedToolUrls(getDefaultPinnedUrls(allTools));
      }
    } catch (error) {
      console.error("Failed to load pinned tools:", error);
      setPinnedToolUrls(getDefaultPinnedUrls(allTools));
    }
  }, [allTools]);

  // 从用户信息加载固定工具
  useEffect(() => {
    const userPinnedTools = (user as any)?.pinnedTools;
    if (!user) return;
    if (!Array.isArray(userPinnedTools)) {
      // 用户已登录但数据库里还没有保存过 pinned_tools 时，
      // 如果本地残留的是空数组，不要让它覆盖默认固定工具。
      setPinnedToolUrls((prev) => {
        if (prev.length > 0) {
          return prev;
        }
        const defaultUrls = getDefaultPinnedUrls(allTools);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUrls));
        } catch (error) {
          console.error("Failed to sync default pinned tools to localStorage:", error);
        }
        return defaultUrls;
      });
      return;
    }

    // 注意：即使是空数组，也代表「用户已经有配置」（可以是用户清空后的结果）
    setPinnedToolUrls(userPinnedTools);
    // 同步到 localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userPinnedTools));
      localStorage.setItem(STORAGE_CONFIGURED_KEY, "true");
    } catch (error) {
      console.error("Failed to sync pinned tools to localStorage:", error);
    }
  }, [user]);

  // 保存到 localStorage 和数据库
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedToolUrls));
      if (shouldMarkConfiguredRef.current) {
        localStorage.setItem(STORAGE_CONFIGURED_KEY, "true");
        shouldMarkConfiguredRef.current = false;
      }

      // 如果用户已登录，同步到数据库
      if (user) {
        // 仅在用户真实交互时才同步到数据库（初始化/回填不触发）
        if (!shouldSyncToDbRef.current) {
          return;
        }
        shouldSyncToDbRef.current = false;
        fetch("/api/user/update-pinned-tools", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pinnedTools: pinnedToolUrls }),
        }).catch((error) => {
          console.error("Failed to sync pinned tools to database:", error);
        });
      }
    } catch (error) {
      console.error("Failed to save pinned tools:", error);
    }
  }, [pinnedToolUrls, user]);

  // 获取固定的工具列表
  const pinnedTools = allTools.filter((tool) =>
    pinnedToolUrls.includes(getToolUrl(tool))
  );

  // 切换工具的固定状态
  const toggleTool = (toolUrl: string) => {
    console.log("toggleTool called:", toolUrl);
    setPinnedToolUrls((prev) => {
      const newUrls = prev.includes(toolUrl)
        ? prev.filter((url) => url !== toolUrl)
        : [...prev, toolUrl];
      console.log("Updated pinned URLs:", newUrls);
      shouldSyncToDbRef.current = true;
      shouldMarkConfiguredRef.current = true;
      return newUrls;
    });
  };

  // 移除工具
  const removeTool = (toolUrl: string) => {
    shouldSyncToDbRef.current = true;
    shouldMarkConfiguredRef.current = true;
    setPinnedToolUrls((prev) => prev.filter((url) => url !== toolUrl));
  };

  // 重置为默认
  const resetToDefault = () => {
    const defaultUrls = getDefaultPinnedUrls(allTools);
    shouldSyncToDbRef.current = true;
    shouldMarkConfiguredRef.current = true;
    setPinnedToolUrls(defaultUrls);
  };

  // 重新排序工具
  const reorderTools = (startIndex: number, endIndex: number) => {
    setPinnedToolUrls((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      shouldSyncToDbRef.current = true;
      shouldMarkConfiguredRef.current = true;
      return result;
    });
  };

  return {
    pinnedTools,
    pinnedToolUrls,
    toggleTool,
    removeTool,
    resetToDefault,
    reorderTools,
  };
}
