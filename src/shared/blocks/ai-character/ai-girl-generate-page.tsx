"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { History, Loader2, RotateCcw, Sparkles } from "lucide-react";

import { useRouter } from "@/core/i18n/navigation";
import { CreateLayout } from "@/shared/blocks/create/create-layout";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { useAppContext } from "@/shared/contexts/app";
import { useUserAccessCheck } from "@/shared/hooks/use-user-access-check";
import { executeGeneration } from "@/shared/lib/ai-generation";
import {
  AI_GIRL_CHARACTER_ID_STORAGE_KEY,
  AI_GIRL_DNA_STORAGE_KEY,
  defaultAiGirlCharacterDNA,
  getAiGirlDnaSummary,
  isValidAiGirlCharacterDNA,
  type AiGirlCharacterDNA,
} from "@/shared/lib/ai-character";
import type { NavItem } from "@/shared/types/blocks/common";

type CharacterHistoryItem = {
  id: string;
  version: number;
  action: string;
  snapshot: string;
  changes: string | null;
  rollbackFromVersion: number | null;
  createdAt: string;
};

export function AiGirlGeneratePage({ navItems }: { navItems: NavItem[] }) {
  const router = useRouter();
  const tCommonApi = useTranslations("common.api");
  const { user, setIsShowPaymentModal, setIsShowSignModal, fetchUserInfo } =
    useAppContext();
  const { checkAccess } = useUserAccessCheck({
    errorTranslationKey: "landing.wavespeed.errors",
  });

  const [dna, setDna] = useState<AiGirlCharacterDNA>(defaultAiGirlCharacterDNA);
  const [extraDescription, setExtraDescription] = useState("");
  const [statusText, setStatusText] = useState("等待生成");
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [requiredCredits, setRequiredCredits] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(true);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [characterId, setCharacterId] = useState("");
  const [historyItems, setHistoryItems] = useState<CharacterHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const loadHistory = async (targetCharacterId: string) => {
    if (!targetCharacterId) {
      setHistoryItems([]);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `/api/ai-girl/history?characterId=${encodeURIComponent(targetCharacterId)}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.code !== 0) {
        throw new Error(result.message || "Failed to load history");
      }

      setHistoryItems(result.data || []);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Failed to load history",
      );
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(AI_GIRL_DNA_STORAGE_KEY);
      const storedCharacterId = sessionStorage.getItem(
        AI_GIRL_CHARACTER_ID_STORAGE_KEY,
      );
      if (!stored) {
        if (storedCharacterId) {
          setCharacterId(storedCharacterId);
        }
      } else {
        const parsed = JSON.parse(stored);
        setDna({
          ...defaultAiGirlCharacterDNA,
          ...parsed,
        });
      }

      if (storedCharacterId) {
        setCharacterId(storedCharacterId);
      }
    } catch {
      // ignore invalid session cache
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRequiredCredits = async () => {
      setIsEstimating(true);
      setEstimateError(null);

      try {
        const response = await fetch("/api/ai-girl/estimate-credits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (result.code !== 0) {
          throw new Error(result.message || "Failed to estimate credits");
        }

        if (!cancelled) {
          setRequiredCredits(result.data?.requiredCredits ?? null);
        }
      } catch (nextError) {
        if (!cancelled) {
          setRequiredCredits(null);
          setEstimateError(
            nextError instanceof Error
              ? nextError.message
              : "Failed to estimate credits",
          );
        }
      } finally {
        if (!cancelled) {
          setIsEstimating(false);
        }
      }
    };

    void loadRequiredCredits();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!characterId) {
      setHistoryItems([]);
      return;
    }

    let cancelled = false;

    void (async () => {
      if (!cancelled) {
        await loadHistory(characterId);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [characterId]);

  const dnaSummary = useMemo(() => getAiGirlDnaSummary(dna), [dna]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    setImageUrl("");
    setStatusText("正在提交生成任务");

    try {
      const result = await executeGeneration(
        {
          apiEndpoint: "/api/ai-girl/generate",
          scenario: "ai-girl-generate",
          requestBody: {
            characterId: characterId || undefined,
            dna,
            extraDescription,
          },
          requiredCredits,
          remainingCredits: user?.credits?.remainingCredits ?? 0,
          buildStatusEndpoint: (requestId) =>
            `/api/ai/status?taskId=${encodeURIComponent(requestId)}&scenario=nano-banana-2-text-to-image`,
        },
        {
          checkAccess: () => checkAccess(),
          showPricingModal: () => setIsShowPaymentModal(true),
          showSignModal: () => setIsShowSignModal(true),
          fetchUserInfo: async () => {
            await fetchUserInfo();
          },
          onStatusUpdate: (status) => setStatusText(status),
          onError: (nextError) => setError(nextError),
          translateApiError: (translationKey) =>
            tCommonApi(translationKey as any),
        },
        (_key, params) => params?.defaultValue || "",
      );

      if (result.success && result.url) {
        setImageUrl(result.url);
        setStatusText("生成完成，图片已保存");
      }
      const nextCharacterId =
        typeof result.data?.characterId === "string"
          ? result.data.characterId
          : characterId;
      if (nextCharacterId) {
        setCharacterId(nextCharacterId);
        sessionStorage.setItem(
          AI_GIRL_CHARACTER_ID_STORAGE_KEY,
          nextCharacterId,
        );
        await loadHistory(nextCharacterId);
      }
      sessionStorage.setItem(AI_GIRL_DNA_STORAGE_KEY, JSON.stringify(dna));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRollback = async (version: number) => {
    if (!characterId) {
      return;
    }

    setIsRollingBack(true);
    setError("");

    try {
      const response = await fetch("/api/ai-girl/rollback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          characterId,
          version,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.code !== 0) {
        throw new Error(result.message || "Failed to rollback");
      }

      const snapshot = result.data?.snapshot;
      if (snapshot?.dna && isValidAiGirlCharacterDNA(snapshot.dna)) {
        setDna(snapshot.dna);
        setExtraDescription(snapshot.extraDescription || "");
        setImageUrl(snapshot.imageUrl || "");
        setStatusText(`已回滚到版本 v${version}`);
        sessionStorage.setItem(
          AI_GIRL_DNA_STORAGE_KEY,
          JSON.stringify(snapshot.dna),
        );
      }

      await loadHistory(characterId);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Failed to rollback",
      );
    } finally {
      setIsRollingBack(false);
    }
  };

  const toolPanelContent = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/6 bg-[linear-gradient(180deg,#151820,#101217)]">
      <div className="border-b border-white/6 px-5 py-4">
        <div className="text-[1.02rem] font-semibold text-white">
          AI Girl Image Route
        </div>
        <p className="mt-1 text-sm text-white/48">
          服务端会自动组装 Character DNA 与额外描述，不在前端暴露模型和最终提示词。
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-white/38">
            Character DNA
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {dnaSummary.map((item) => (
              <span
                key={item.key}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/72"
              >
                {item.label}
              </span>
            ))}
          </div>
          <Button
            variant="outline"
            className="mt-4 w-full border-white/12 bg-white/[0.02] text-white hover:bg-white/[0.06]"
            onClick={() => router.push("/ai-girl")}
          >
            返回编辑 Character DNA
          </Button>
        </section>

        <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-white/38">
            Extra Description
          </div>
          <Textarea
            value={extraDescription}
            onChange={(event) => setExtraDescription(event.target.value)}
            placeholder="例如：她站在落地窗前，穿白色丝绸衬衫，夜景霓虹反射在玻璃上，电影感肖像摄影。"
            className="mt-3 min-h-[180px] resize-none border-white/10 bg-[#0e1117] text-white placeholder:text-white/30"
          />
          <div className="mt-2 text-xs text-white/40">
            固定输出：4K 分辨率，适合 ai-girl 竖版肖像生成。
          </div>
        </section>

        <section className="rounded-3xl border border-[#ff9838]/20 bg-[linear-gradient(180deg,rgba(255,152,56,0.12),rgba(255,255,255,0.03))] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-[#ffbf85]">
                Generate
              </div>
              <p className="mt-1 text-sm text-white/56">
                {isEstimating
                  ? "积分计算中"
                  : requiredCredits
                    ? `预计消耗 ${requiredCredits} credits`
                    : estimateError || "暂时无法获取积分"}
              </p>
            </div>
            <Sparkles className="size-5 text-[#ffbf85]" />
          </div>

          <Button
            className="mt-4 h-11 w-full bg-[#ff9838] text-black hover:bg-[#ffab5c]"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                正在生成
              </>
            ) : (
              "开始生成并写入数据库"
            )}
          </Button>
        </section>

        <section className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-white/38">
                Version History
              </div>
              <p className="mt-1 text-xs text-white/42">
                每次修改都会生成一个新版本，可随时回滚。
              </p>
            </div>
            <History className="size-4 text-white/40" />
          </div>

          <div className="mt-3 space-y-2">
            {!characterId ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-xs text-white/34">
                生成一次后会出现版本历史
              </div>
            ) : isLoadingHistory ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-xs text-white/34">
                正在加载历史版本
              </div>
            ) : historyItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-xs text-white/34">
                暂无历史记录
              </div>
            ) : (
              historyItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">
                        v{item.version} · {item.action}
                      </div>
                      <div className="mt-1 text-xs text-white/42">
                        {new Date(item.createdAt).toLocaleString("zh-CN")}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/12 bg-transparent text-white hover:bg-white/[0.06]"
                      onClick={() => handleRollback(item.version)}
                      disabled={isRollingBack}
                    >
                      <RotateCcw className="size-3.5" />
                      回滚
                    </Button>
                  </div>
                  {item.rollbackFromVersion ? (
                    <div className="mt-2 text-xs text-[#ffbf85]">
                      来自回滚：v{item.rollbackFromVersion}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );

  const mainPanelContent = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/6 bg-[linear-gradient(180deg,#111318,#0d0f14)]">
      <div className="border-b border-white/6 px-5 py-4">
        <div className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-white/36">
          Result
        </div>
        <div className="mt-2 text-sm text-white/58">{statusText}</div>
        {error ? <div className="mt-2 text-sm text-[#ff8d8d]">{error}</div> : null}
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Generated ai girl"
            className="max-h-full w-full rounded-[28px] border border-white/10 object-contain shadow-[0_24px_60px_rgba(0,0,0,0.36)]"
          />
        ) : (
          <div className="flex h-full min-h-[420px] w-full items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] text-sm text-white/34">
            生成后的图片会显示在这里，并同步保存到 ai_character / ai_task
          </div>
        )}
      </div>
    </div>
  );

  return (
    <CreateLayout
      navItems={navItems}
      category="Image"
      toolPanelContent={toolPanelContent}
      mainPanelContent={mainPanelContent}
      variant="two-column"
    />
  );
}
