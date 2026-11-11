import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildCanvasAgentResolvedSkillContext,
  resolveCanvasAgentSkillSelection,
} from "@/shared/services/canvas-agent/canvas-agent-skill";

describe("Canvas Agent Skill Routing", () => {
  it("routes marketing poster prompts to the marketing poster skill", () => {
    const result = resolveCanvasAgentSkillSelection({
      requestedSkillId: "auto",
      message: "帮我做一张电商上新海报，突出品牌和促销信息",
      autoRoutingEnabled: true,
    });

    assert.equal(result.resolvedSkillId, "poster-design");
    assert.equal(result.routeStrategy, "auto-matched");
  });

  it("routes reference-heavy product edit prompts to the product edit skill", () => {
    const result = resolveCanvasAgentSkillSelection({
      requestedSkillId: "auto",
      message: "基于参考图帮我把这张商品图换成干净白底并做高级精修",
      referencesCount: 1,
      autoRoutingEnabled: true,
    });

    assert.equal(result.resolvedSkillId, "commerce-set");
    assert.equal(result.routeStrategy, "auto-matched");
  });

  it("routes video prompts to the story video skill", () => {
    const result = resolveCanvasAgentSkillSelection({
      requestedSkillId: "auto",
      message: "做一个有镜头推进和 cinematic 氛围的产品预告视频",
      autoRoutingEnabled: true,
    });

    assert.equal(result.resolvedSkillId, "marketing-video");
    assert.equal(result.routeStrategy, "auto-matched");
  });

  it("routes brand requests to the brand design skill", () => {
    const result = resolveCanvasAgentSkillSelection({
      requestedSkillId: "auto",
      message: "帮我做一个新消费护肤品牌的 logo 和 VI 方向",
      autoRoutingEnabled: true,
    });

    assert.equal(result.resolvedSkillId, "brand-design");
  });

  it("routes interior requests to the interior design skill", () => {
    const result = resolveCanvasAgentSkillSelection({
      requestedSkillId: "auto",
      message: "为这个客厅做现代极简室内设计概念图和材质板",
      autoRoutingEnabled: true,
    });

    assert.equal(result.resolvedSkillId, "interior-design");
  });

  it("routes comic requests to the smart comic skill", () => {
    const result = resolveCanvasAgentSkillSelection({
      requestedSkillId: "auto",
      message: "帮我做一个角色一致的漫剧分镜",
      autoRoutingEnabled: true,
    });

    assert.equal(result.resolvedSkillId, "smart-comic");
  });

  it("falls back to the template skill when there is no strong match", () => {
    const result = resolveCanvasAgentSkillSelection({
      requestedSkillId: "auto",
      message: "帮我生成一个森林里的幻想生物",
      autoRoutingEnabled: true,
    });

    assert.equal(result.resolvedSkillId, "template");
    assert.equal(result.routeStrategy, "auto-template");
  });

  it("builds a resolved skill context with instructions", () => {
    const context = buildCanvasAgentResolvedSkillContext({
      requestedSkillId: "poster-design",
      message: "做一张品牌海报",
      autoRoutingEnabled: true,
    });

    assert.ok(context);
    assert.equal(context?.resolvedSkillId, "poster-design");
    assert.match(context?.instructions || "", /Poster Design Skill/);
  });

  it("maps legacy skill ids to the new formal skill ids", () => {
    const result = resolveCanvasAgentSkillSelection({
      requestedSkillId: "marketing-poster",
      message: "做一张品牌海报",
      autoRoutingEnabled: true,
    });

    assert.equal(result.resolvedSkillId, "poster-design");
    assert.equal(result.routeStrategy, "explicit");
  });
});
