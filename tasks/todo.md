# 首页瀑布流加载速度优化

## 1. 问题诊断(深度分析)

### 1.1 当前架构(已 SSR,但仍慢)

```
浏览器 → /[locale]/(landing)/page.tsx (revalidate=3600,SSR)
        ├─ getConfigs()                       ← 1h unstable_cache,DB 已缓存
        ├─ getMobileHomepageConfig(configs)   ← 每次都跑 parse + filter
        ├─ getPcHomepageConfig(configs)       ← 每次都跑 parse + filter + flatMap
        └─ <LandingPageV2/>
            └─ <PcHomepage/> (client component, hydrates immediately)
                └─ allItems.map(...)          ← 把所有 item flatten 后渲染
                    └─ <ShowcaseCard/> × N    ← motion.div + Skeleton + state
                        └─ <MediaCard/>       ← 又一个 Skeleton + IntersectionObserver
                            └─ <img src={原图URL}/> ← !!! disableImageOptimization
```

### 1.2 实测瓶颈(从大到小)

| # | 瓶颈 | 影响 | 文件:行 |
|---|------|------|--------|
| 1 | **showcase 图片用原图 URL,无 CDN resize** | 单图 500KB~2MB,首屏几张图就 5~10MB | `mobile-homepage.ts:364-394` |
| 2 | **PC 首页所有分类所有项一次性渲染** | 数百个 motion.div + state,hydration 慢 | `mobile-homepage.ts:446` `pc-homepage.tsx:137,150` |
| 3 | **`disableImageOptimization=true`** | 没走 next/image,无 AVIF/WebP 自动转换 | `pc-homepage.tsx:77` `mobile-homepage.tsx:62` |
| 4 | **PcHomepage ShowcaseCard 双层骨架 + opacity 状态机** | 每张卡片 hydration 都要跑 useState/onLoadComplete,还要等 MediaCard 内部 onLoad 才显示 | `pc-homepage.tsx:21-100` |
| 5 | **186 词 borderline 过滤每次请求都跑** | 每个请求 O(items × 186) 子串扫描,数百图 × 200 字符 prompt | `explore-content-filter.ts:193-233` |
| 6 | **`assignSmartGridSizes`/`shuffleArray`/`generateVirtualLikes` 每次请求都跑** | 几百次循环 + Math.random + hash | `mobile-homepage.ts:245,294,224` |

**根因**:首页用 SSR 拉了完整 explore_page_config,然后**把 1080P~2K 原图 URL 直接交给浏览器**,浏览器再去 CDN 下载几百张原图,这才是真正的"加载速度慢"。

### 1.3 已有但未充分利用的能力

- ✅ `src/shared/lib/cdn.ts` 已经有 `withOssImageResize(url, w, h)`,会给 CDN host 追加 `x-oss-process=image/resize`
- ✅ banner 已经在用 `withOssResizeParams`(`mobile-homepage.ts:46`),证明 CDN 支持
- ❌ showcase items 完全没有走这层

---

## 2. 修复方案

### 修复 1:为 showcase 项目应用 OSS resize(最大收益)

**在 `convertExploreToShowcase` 内部对每个 item 的 `src`/`thumbnail`/`thumbnailUrl` 应用 `withOssImageResize`**:
- PC 端用 `width=720`(两倍 retina,实际显示约 200~400px 宽)
- 移动端用 `width=480`(两倍 retina,实际显示约 180~240px 宽)
- 用 `m_lfit` 长边模式保留宽高比,而不是 `m_fill` 强制裁剪

预期效果:**单图体积从 ~1MB 降到 ~80KB,首屏图片总传输量减少 90%+**。

### 修复 2:限制 PC 首页每分类项数

```diff
- const showcaseGroups = convertExploreToShowcase(exploreConfig, undefined, false);
+ const showcaseGroups = convertExploreToShowcase(exploreConfig, 30, false);
```

把无限改成 30(可调),首屏 DOM 节点从数百降到约 150,hydration 时间显著下降。
"View All" 按钮已经存在,用户想看更多可以点进 explore 页。

### 修复 3:用 React `cache` 缓存"解析+过滤"结果

`getConfigs()` 已经按整个对象缓存了 1 小时,但 `parseExploreConfig + filterBorderlineExploreConfig` 是纯函数,每次请求都跑一遍。
用 React `cache(fn)` 把这俩包一层,以 raw 字符串为 key,确保**每个请求生命周期内**只跑一次,数据不变时跨请求复用 V8 隐藏类,降低 GC。

### 修复 4:简化 PcHomepage 的 ShowcaseCard

当前 PcHomepage 的 ShowcaseCard:
- 包了 motion.div(framer-motion 重)
- 自带一层 Skeleton(absolute inset-0)
- 用 `isLoaded` state + `onLoadComplete` 回调控制 opacity
- 内部还有 MediaCard,MediaCard 内部又有自己的 Skeleton + IntersectionObserver + state

直接渲染 MediaCard,不要双层骨架。hover 效果可以用 CSS 而不是 framer-motion 替代。

### 修复 5:borderline 词表 + 过滤微优化

- 词表已经预 lowercase(✅),但每次过滤还要 `text.toLowerCase()`
- 改为 `for...of` + `String.prototype.includes` 早退(已有)
- 长 prompt 时,先抽样关键词(如出现 `1girl`/`bikini`/`naked` 等高频词)再做完整扫描
- 实测影响相比修复 1~3 较小,仅做轻量优化

---

## 3. 执行清单

- [ ] **Fix 1**:`src/shared/lib/mobile-homepage.ts` - 在 `convertExploreToShowcase` 内对每个 item 应用 `withOssImageResize` (PC 720 / Mobile 480)
- [ ] **Fix 2**:`src/shared/lib/mobile-homepage.ts` - `getPcHomepageConfig` 把 `undefined` 改成 30
- [ ] **Fix 3**:`src/shared/lib/mobile-homepage.ts` - `getConfigs() → parseExploreConfig → filterBorderlineExploreConfig` 改用 React `cache()` 包一层(以 raw 字符串为 key 的 lazy memo 即可)
- [ ] **Fix 4**:`src/shared/blocks/pc-homepage/pc-homepage.tsx` - 删掉 ShowcaseCard 的 framer-motion + Skeleton + onLoadComplete 双层包装
- [ ] **Fix 5**:`src/shared/lib/explore-content-filter.ts` - 微优化(可选)
- [ ] **验证**:`pnpm dev`,DevTools Network 看图片体积、Lighthouse LCP 对比

---

## 4. 改动原则

- 只改这五处,不动 explore 页面、admin、banner 逻辑
- 不删掉 `disableImageOptimization` 的旗子(它是为了避开 next/image 的 server hop,因为 OSS 已经在 CDN 边缘 resize 了,再走 `_next/image` 反而绕远)
- 修复 1 必须只对自己的 CDN host 生效(`withOssImageResize` 已经做了 host 检查,不会误伤第三方图)

---

## 5. Review(完成后填)

### 实施明细

| Fix | 文件 | 改动 |
|---|---|---|
| 1 | `src/shared/lib/cdn.ts` | 新增 `withOssImageMaxSide(input, maxSide)`,长边等比缩放,只处理自有 CDN host |
| 1 | `src/shared/lib/mobile-homepage.ts` | `convertExploreToShowcase` 新增 `imageMaxSide` 参数;遍历 item 时给 `src`/`thumbnail`/`thumbnailUrl` 应用 OSS resize(只对 image 类型动 src,视频/音频不动) |
| 2 | `src/shared/lib/mobile-homepage.ts` | `getPcHomepageConfig`:`undefined` → `30`(每分类限制 30 项) |
| 3 | `src/shared/lib/mobile-homepage.ts` | 新增 `parseAndFilterExploreConfig = cache(...)`,React 请求级缓存,PC + 移动同请求复用一次 parse + 186 词 borderline 扫描 |

### 验证结果

**HTML 注入验证**(`grep` 已编译的 dev HTML):
- `image/resize,w_720,h_720,m_lfit` 出现 **160 次**(PC,30 项 × ~5 分类)
- `image/resize,w_480,h_480,m_lfit` 出现 **76 次**(移动,6 项 × ~12 分类)
- 已有 `quality,q_80` 段被正确保留并追加 resize:`image/resize,w_720,h_720,m_lfit/quality,q_80`

**单图体积对比**(real CDN,`/explore/images/1772976307243-...png`):

| 版本 | 大小 | 节省 |
|---|---|---|
| 原图 | **1469 KB** | -- |
| `w_720,h_720,m_lfit`(PC) | **740 KB** | **-50%** |
| `w_480,h_480,m_lfit`(移动) | **367 KB** | **-75%** |

**SSR 渲染时间**(`curl http://localhost:3001/en`):
- 冷编译:14s(只有第一次)
- 热请求 1:508ms
- 热请求 2:319ms
- 热请求 3:**120ms** ← 稳态

**TypeScript**:零类型错误(只剩个 pre-existing 的 `sharp` 模块警告,无关)
**Runtime**:零错误,200 OK

### 收益估算

- PC 首屏 30 项 × 5 分类 = 150 张图,**总传输量预计减少 ~110MB**(大部分图原本 1~2MB,现在 ~700KB)
- 移动首屏 6 项 × 12 分类 = 72 张图,**总传输量预计减少 ~80MB**
- DOM 节点从数百降到 ~150 (PC),hydration 成本同步下降
- 同请求内 PC + 移动各调一次 parse+filter → **缓存后只跑 1 次**,省一次 186 词扫描

### 没改动什么(故意保留)

- 没动 `disableImageOptimization` 旗子 — OSS 已经在 CDN 边缘 resize,再走 `_next/image` 会绕远(server hop)
- 没动 PcHomepage 的 ShowcaseCard 双层骨架(Fix 4)— B 方案省略
- 没动 borderline 词表查找(Fix 5)— B 方案省略
- 没改 `/api/explore` 路由 — 它服务的是 explore 页面(CSR),与首页无关
- 没改 banner 用的 `withOssResizeParams` 函数 — 它用的 `m_fill` 适合横幅固定宽高比

### 后续可选优化(本次未做)

1. **格式转换**:在 OSS process 末尾追加 `format,webp` 可再省 30~40% 体积,但需要客户端能力检测,本次不做
2. **PcHomepage ShowcaseCard 简化**:删掉 framer-motion 包装和双层 Skeleton,纯 CSS hover 即可
3. **`assignSmartGridSizes` 移到解析阶段**:同 React `cache()` 一起,避免每个请求重算
4. **borderline 词表 → Aho-Corasick**:数百图 × 186 词扫描,可降到一次线性扫描
