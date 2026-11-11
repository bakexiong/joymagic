# Design System Inspired by Mango Animate

## 1. Visual Theme & Atmosphere

Mango Animate's design system embodies a vibrant, energetic, and modern aesthetic centered on creative empowerment. The dominant golden-yellow background conveys optimism and innovation, while the carefully curated accent colors (electric blue, vibrant purple, and teal) create moments of visual excitement and guide user attention. This system balances bold, attention-grabbing hero sections with clean, minimal product cards and interfaces. The overall mood is forward-thinking, accessible, and professional — designed to appeal to content creators and businesses seeking AI-driven video production without sacrificing design elegance. Typography is clean and hierarchical; interactions are smooth and inviting.

**Key Characteristics**

- Bold, warm primary color (`#FFC100`) paired with complementary cool accents
- High-contrast, legible text on varied backgrounds
- Rounded, friendly button treatments with generous padding
- Clean white surfaces for product showcase and secondary information
- Minimal drop shadows used sparingly for depth
- Strong hierarchy through size, weight, and color intensity
- Inclusive and motion-forward visual language

## 2. Color Palette & Roles

### Primary

- **Mango Gold** (`#FFC100`): Primary call-to-action backgrounds, hero section fills, and dominant brand presence. Used for maximum visual impact and user guidance.
- **Deep Navy** (`#23282F`): Primary text color for headings and high-contrast text elements. Provides professional gravitas and readability.

### Accent Colors

- **Electric Blue** (`#00B2FF`): Secondary interactive elements, feature highlights, and accent borders. Conveys trust and technological innovation.
- **Vibrant Purple** (`#A734EE`): Tertiary accent for premium features and interactive states. Creates visual depth and differentiation.
- **Ocean Blue** (`#409EFF`): Softer blue for secondary UI elements and informational badges.
- **Teal** (`#1DBFA1`): Character/product category identifiers and complementary interactive states.

### Interactive

- **Coral Red** (`#FF5735`): Secondary button backgrounds and hover states for contrast and energy.
- **Light Purple** (`#C4B5FD`): Light interactive backgrounds and disabled states; maintains brand warmth while reducing prominence.

### Neutral Scale

- **Black** (`#000000`): Primary text, borders, and high-contrast UI elements. Used extensively throughout the interface.
- **Dark Gray** (`#333333`): Secondary text and subtle dividers.
- **Medium Gray** (`#4A5464`): Tertiary text and placeholder content.
- **Light Gray** (`#666666`): Low-contrast decorative elements.
- **Very Light Gray** (`#E5E7EB`): Backgrounds, borders, and subtle separators. Most frequently used neutral.
- **Off-White** (`#F5F7F9`): Soft background surfaces for cards and containers.
- **Pale Gray** (`#F1F2F4`): Secondary background surface for alternating sections.
- **Almost White** (`#FFFFFF`): Pure white for text on dark backgrounds and primary content areas.

### Surface & Borders

- **Border Gray** (`#E5E7EB`): Default border color for inputs, cards, and dividers.
- **Background Soft** (`#F5F7F9`): Primary background for secondary sections and card interiors.

### Semantic / Status

- **Error** (`#EF4444`): Critical error messages and destructive actions.
- **Error Alt** (`#FF4C2C`): Alternative error state for alerts and warnings.
- **Warning** (`#FFBB45`): Cautionary messages and secondary warnings.
- **Warning Alt** (`#FFC100`): Primary warning indicator (overlaps with brand primary).

## 3. Typography Rules

### Font Family

**Primary:** `Segoe UI`, `Roboto`, `Oxygen`, `Ubuntu`, `Cantarell`, `-apple-system`, `BlinkMacSystemFont`, sans-serif

**Secondary:** `Segoe UI`, `Roboto`, sans-serif (system stack)

**Fallback:** sans-serif

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|-----------------|-------|
| Display / Hero | Segoe UI | 48px | 700 | 56px | -0.5px | Large headlines on hero sections |
| Heading 1 | Segoe UI | 36px | 700 | 44px | -0.3px | Primary page headings |
| Heading 2 | Segoe UI | 28px | 600 | 36px | 0px | Secondary section headings |
| Heading 3 | Segoe UI | 22px | 600 | 32px | 0px | Subsection titles (extracted) |
| Subtitle / Large | Segoe UI | 20px | 500 | 28px | 0px | Large supporting text |
| Body Regular | Segoe UI | 16px | 400 | 24px | 0px | Standard paragraph text (extracted) |
| Body Emphasis | Segoe UI | 16px | 600 | 24px | 0px | Emphasized inline text (extracted) |
| Button / Label | Segoe UI | 16px | 600 | 24px | 0.5px | Call-to-action button labels |
| Button Large | Segoe UI | 18px | 400 | 62px | 0px | Large primary CTA buttons |
| Small Text | Segoe UI | 14px | 400 | 20px | 0px | Caption and metadata text |
| Code / Monospace | `Monaco`, `Courier New`, monospace | 14px | 400 | 20px | 0px | Code blocks and technical text |

### Principles

- **Hierarchy Through Weight:** Bold weights (600–700px) for headings; regular (400) for body and supporting text
- **Generous Line Height:** 1.5× to 2.5× font size ensures breathing room and readability
- **Semantic Sizing:** Each size tier increases by approximately 6–8px, creating clear visual distinction
- **Legibility First:** Minimum 16px for body text; 14px for supplementary information only
- **Motion in Text:** Emphasis through weight change rather than color alone; maintains accessibility
- **Product-Focused:** Clean, neutral typeface allows product imagery and interactive elements to shine

## 4. Component Stylings

### Buttons

#### Primary Button (Large CTA)
- **Background Color:** `#000000`
- **Text Color:** `#FFFFFF`
- **Font Size:** `18px`
- **Font Weight:** `400`
- **Padding:** `0px 48px`
- **Height:** `62px`
- **Border Radius:** `100px`
- **Border:** `0px solid`
- **Line Height:** `62px`
- **Hover State:** `background-color: #333333`; `transform: scale(1.02)`
- **Active State:** `background-color: #000000`; `box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3)`
- **Disabled State:** `background-color: #C4B5FD`; `color: #666666`; `cursor: not-allowed`

#### Secondary Button (Gold/Brand CTA)
- **Background Color:** `#FFC100`
- **Text Color:** `#000000`
- **Font Size:** `18px`
- **Font Weight:** `400`
- **Padding:** `0px 48px`
- **Height:** `62px`
- **Border Radius:** `100px`
- **Border:** `0px solid`
- **Line Height:** `62px`
- **Hover State:** `background-color: #FFB300`; `transform: scale(1.02)`
- **Active State:** `background-color: #FFC100`; `box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.2)`
- **Disabled State:** `background-color: #F1F2F4`; `color: #999999`; `cursor: not-allowed`

#### Ghost Button (Outlined)
- **Background Color:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `#000000`
- **Font Size:** `16px`
- **Font Weight:** `600`
- **Padding:** `0px 15px`
- **Height:** `34px`
- **Border Radius:** `0px`
- **Border:** `2px solid #000000`
- **Line Height:** `30px`
- **Hover State:** `background-color: #F5F7F9`; `border-color: #333333`
- **Active State:** `background-color: #E5E7EB`; `border-color: #000000`

#### Icon Button (Circular)
- **Background Color:** `#F5F7F9`
- **Text Color:** `#000000`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Padding:** `0px`
- **Height:** `56px`
- **Width:** `56px`
- **Border Radius:** `9999px`
- **Border:** `0px`
- **Line Height:** `56px`
- **Display:** `flex`; `align-items: center`; `justify-content: center`
- **Hover State:** `background-color: #E5E7EB`
- **Active State:** `background-color: #D1D5DB`

### Cards & Containers

#### Product Card
- **Background Color:** `#FFFFFF`
- **Border:** `1px solid #E5E7EB`
- **Border Radius:** `12px`
- **Padding:** `24px`
- **Box Shadow:** `rgba(0, 0, 0, 0.05) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px`
- **Hover State:** `box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px`; `transform: translateY(-2px)`

#### Surface Container
- **Background Color:** `#F5F7F9`
- **Border Radius:** `8px`
- **Padding:** `32px`
- **Border:** `1px solid #E5E7EB`

#### Message Bubble / Chat Card
- **Background Color:** `#FFFFFF`
- **Border Radius:** `16px`
- **Padding:** `20px 24px`
- **Border:** `1px solid #E5E7EB`
- **Text Color:** `#333333`
- **Font Size:** `16px`
- **Line Height:** `24px`
- **Box Shadow:** `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`

### Inputs & Forms

#### Text Input
- **Background Color:** `#FFFFFF`
- **Border:** `1px solid #E5E7EB`
- **Border Radius:** `8px`
- **Padding:** `12px 16px`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Font Family:** `Segoe UI`, sans-serif
- **Color:** `#333333`
- **Height:** `44px`
- **Line Height:** `24px`
- **Focus State:** `border-color: #00B2FF`; `box-shadow: 0 0 0 3px rgba(0, 178, 255, 0.1)`
- **Placeholder Color:** `#999999`
- **Disabled State:** `background-color: #F1F2F4`; `color: #999999`; `cursor: not-allowed`

#### Checkbox
- **Width:** `20px`
- **Height:** `20px`
- **Border:** `2px solid #E5E7EB`
- **Border Radius:** `4px`
- **Background Color:** `#FFFFFF`
- **Checked State:** `background-color: #00B2FF`; `border-color: #00B2FF`; `background-image: url('data:image/svg+xml...')`
- **Focus State:** `box-shadow: 0 0 0 3px rgba(0, 178, 255, 0.1)`

#### Radio Button
- **Width:** `20px`
- **Height:** `20px`
- **Border:** `2px solid #E5E7EB`
- **Border Radius:** `50%`
- **Background Color:** `#FFFFFF`
- **Selected State:** `border-color: #00B2FF`; `box-shadow: inset 0 0 0 4px #FFFFFF, inset 0 0 0 6px #00B2FF`
- **Focus State:** `box-shadow: 0 0 0 3px rgba(0, 178, 255, 0.1)`

### Navigation

#### Primary Navigation (Header)
- **Background Color:** `#FFC100`
- **Height:** `64px`
- **Padding:** `0px 40px`
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `space-between`
- **Border:** `0px`

#### Navigation Link (Desktop)
- **Color:** `#000000`
- **Font Size:** `16px`
- **Font Weight:** `600`
- **Padding:** `8px 12px`
- **Border Radius:** `4px`
- **Text Decoration:** `none`
- **Hover State:** `color: #333333`; `background-color: rgba(0, 0, 0, 0.05)`
- **Active State:** `color: #000000`; `border-bottom: 3px solid #000000`

#### Navigation Dropdown
- **Background Color:** `#FFFFFF`
- **Border:** `1px solid #E5E7EB`
- **Border Radius:** `8px`
- **Padding:** `8px 0px`
- **Box Shadow:** `rgba(0, 0, 0, 0.1) 0px 10px 15px -3px`
- **Min Width:** `200px`

### Badges

#### Badge Primary
- **Background Color:** `#FFC100`
- **Color:** `#000000`
- **Font Size:** `14px`
- **Font Weight:** `600`
- **Padding:** `6px 12px`
- **Border Radius:** `20px`
- **Display:** `inline-block`

#### Badge Secondary
- **Background Color:** `#F5F7F9`
- **Color:** `#333333`
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Padding:** `6px 12px`
- **Border Radius:** `20px`

#### Badge Error
- **Background Color:** `#FFF0F0`
- **Color:** `#EF4444`
- **Font Size:** `14px`
- **Font Weight:** `600`
- **Padding:** `6px 12px`
- **Border Radius:** `20px`

#### Badge Success
- **Background Color:** `#F0FDF4`
- **Color:** `#22C55E`
- **Font Size:** `14px`
- **Font Weight:** `600`
- **Padding:** `6px 12px`
- **Border Radius:** `20px`

## 5. Layout Principles

### Spacing System

**Base Unit:** `4px`

**Scale:**
- `4px`: Micro spacing for inline elements and tight grouping
- `8px`: Compact spacing between related components
- `12px`: Small padding within buttons and form elements
- `16px`: Standard internal padding for cards and inputs
- `20px`: Medium spacing for content sections
- `24px`: Card padding and section separation
- `28px`: Large vertical spacing
- `32px`: Extra-large card padding and section margins
- `36px`: Heading separation margins
- `40px`: Container padding and navigation height
- `48px`: Button horizontal padding and major section breaks
- `56px`: Large element heights (icon buttons) and top-level spacing
- `64px`: Header height and major layout sections
- `80px`: Hero section spacing and full-width margins

**Usage Context:**
- `4–8px`: Inline component spacing, badge padding
- `12–16px`: Form element padding, button text padding
- `20–24px`: Card padding, section margins
- `32–40px`: Container padding, major content sections
- `48–80px`: Hero sections, top-level layout margins

### Grid & Container

**Maximum Container Width:** `1440px`

**Column Strategy:** 12-column grid system
- Columns are flexible and scale responsively
- Gutter width: `24px` on desktop, `16px` on tablet, `8px` on mobile

**Section Patterns:**
- Full-width hero sections with centered content (max 1200px interior)
- Three-column product card grid on desktop (4-column on large screens)
- Two-column layouts for feature + image pairing
- Single-column layouts for text-heavy sections

**Padding Strategy:**
- Desktop: `40px–80px` horizontal padding per section
- Tablet: `24px–40px` horizontal padding per section
- Mobile: `16px–24px` horizontal padding per section

### Whitespace Philosophy

Generous whitespace creates visual breathing room and guides user focus. Sections are separated by minimum `48px` vertical spacing; card interiors use `24px` padding; text elements maintain 1.5× line height minimum. The design avoids visual clutter by leveraging negative space as a design tool. Whitespace intensity increases around CTAs and hero content to emphasize importance.

### Border Radius Scale

- `0px`: No radius — used for minimal, geometric borders and strict layouts
- `4px`: Minimal radius for subtle definition on secondary UI (badges, small elements)
- `8px`: Standard radius for inputs, secondary cards, and medium components
- `12px`: Primary radius for product cards and main containers
- `16px`: Rounded radius for chat bubbles and featured content areas
- `20px`: Large radius for badge and pill-shaped elements
- `100px`: Fully rounded edge for button treatments (pill buttons)
- `9999px`: Perfect circle for icon buttons and circular elements

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (0) | No shadow; `box-shadow: none` | Backgrounds, borders, text-only surfaces |
| Subtle (1) | `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px` | Minimal depth; dividers, small badges |
| Light (2) | `rgba(0, 0, 0, 0.05) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px` | Cards, inputs, buttons at rest |
| Medium (3) | `rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.05) 0px 2px 4px -1px` | Modals, dropdowns, hover states |
| High (4) | `rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px` | Floating elements, cards on hover, prominent overlays |
| Maximum (5) | `rgba(0, 0, 0, 0.2) 0px 20px 25px -5px, rgba(0, 0, 0, 0.1) 0px 10px 10px -5px` | Full-screen modals, top-level popovers, hero overlays |

**Shadow Philosophy:**

Shadows are used subtly to create perceived depth and guide hierarchy. Rather than heavy drop shadows, this system uses layered, soft shadows that suggest elevation without dominating the visual landscape. Shadows increase in strength and blur radius as elevation increases. Interactive elements (buttons, cards) gain subtle shadows at rest and more pronounced shadows on hover to signal interactivity. The most prominent shadows are reserved for modals and floating content that requires clear visual separation from the background.

## 7. Do's and Don'ts

### Do

- Use `#FFC100` (Mango Gold) for primary CTAs and brand-critical moments; it commands attention while maintaining warmth
- Maintain minimum `16px` font size for body text to ensure accessibility across all devices and viewing distances
- Apply the `100px` border radius to all pill-shaped buttons for consistent, friendly interaction patterns
- Layer shadows incrementally — use Level 2 for cards at rest, Level 4 on hover — to create perceived depth
- Preserve whitespace around hero headings and major CTAs; negative space amplifies impact
- Pair warm yellows with cool blues (`#00B2FF`) for visual balance and accent contrast
- Use `#000000` for high-contrast text; pair only with light backgrounds for WCAG AA compliance
- Implement hover states with subtle transforms (`scale(1.02)`) and color shifts for responsive feedback
- Group related form inputs with consistent `8–12px` spacing
- Deploy the 12-column grid to create flexible, scalable layouts that respond predictably across breakpoints

### Don't

- Avoid using `#FFC100` for body text or low-contrast surfaces; reserve it for interactive, high-priority elements
- Don't mix border radii arbitrarily; stick to the defined scale (`4px`, `8px`, `12px`, `16px`, `100px`, `9999px`)
- Don't apply heavy shadows (`Level 5`) to every element; reserve high-elevation shadows for modals and floating overlays only
- Avoid text smaller than `14px` except in captions and metadata; smaller sizes harm readability
- Don't nest more than two levels of depth in dropdown navigation; simplify information hierarchy
- Avoid using red (`#EF4444`) for neutral UI; reserve error colors for warnings, destructive actions, and validation states
- Don't reduce button padding below `12px` vertical or `24px` horizontal; maintain touch target minimums
- Avoid placing text directly on images without a semi-transparent overlay (`rgba(0, 0, 0, 0.3)–0.5`); ensure text remains readable
- Don't use `#E5E7EB` as a text color; it's reserved for borders and subtle separators only
- Avoid mixing font weights erratically; use `400` for body, `600` for emphasis, `700` for headings only

## 8. Responsive Behavior

### Breakpoints

| Breakpoint Name | Width | Key Changes |
|-----------------|-------|-------------|
| Mobile | `320px–639px` | Single-column layouts; `16px` padding; `14px` body text; hamburger navigation |
| Tablet | `640px–1023px` | Two-column grids; `24px` padding; `16px` body text; simplified navigation |
| Desktop | `1024px–1439px` | Three-column grids; `40px` padding; full navigation; hero images at 2x scale |
| Large Desktop | `1440px+` | Four-column grids; `80px` padding; max-width containers at `1440px` |

### Touch Targets

- **Minimum size:** `44px × 44px` for all interactive elements (buttons, links, icon buttons)
- **Recommended size:** `56px × 56px` for primary CTAs and high-frequency interactions
- **Padding around targets:** Maintain `8px` minimum space between adjacent touch targets to prevent accidental activation
- **Mobile optimizations:** Increase button height to `48px–56px`; expand tap areas; avoid small, clustered controls

### Collapsing Strategy

**Header / Navigation:**
- Desktop: Horizontal navigation links visible at `40px` height
- Tablet (640px): Reduce horizontal padding to `16px`; condense navigation links to `12px` padding
- Mobile (< 640px): Collapse into hamburger menu; full-height drawer overlay; `56px` menu button in top-right

**Hero Section:**
- Desktop: Two-column layout (image right, text left); `1200px` max-width
- Tablet: Stack to single column; image above text; `80%` width
- Mobile: Full-width, single column; image scales to `100%` width; reduce heading to `28px`

**Product Cards:**
- Desktop: Three-column grid (`33% width` each) with `24px` gutter
- Tablet: Two-column grid (`50% width` each) with `16px` gutter
- Mobile: Single-column full-width (`100%` with `16px` padding)

**Forms & Inputs:**
- Desktop: Two-column layout for multi-input forms
- Tablet: Single column with `100%` width inputs
- Mobile: Always single column; full-width inputs; increase height to `48px` for touch

**Spacing Collapse:**
- Desktop: `48–80px` vertical section spacing
- Tablet: `32–48px` vertical spacing
- Mobile: `24–32px` vertical spacing; reduce horizontal padding proportionally

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA:** Mango Gold (`#FFC100`) for maximum visibility and brand recognition
- **Secondary CTA / Body:** Black (`#000000`) for primary interactive elements and text
- **Accent Highlight:** Electric Blue (`#00B2FF`) for secondary actions and informational badges
- **Background / Surface:** Off-White (`#FFFFFF`) or Soft Gray (`#F5F7F9`) for card and container fills
- **Heading Text:** Deep Navy (`#23282F`) or Black (`#000000`) for strong hierarchy
- **Body Text:** Dark Gray (`#333333`) or Black (`#000000`) for readability
- **Borders & Dividers:** Light Gray (`#E5E7EB`) for subtle separation
- **Error State:** Error Red (`#EF4444`) for validation and destructive warnings
- **Warning State:** Warning Yellow (`#FFBB45`) for cautionary messages

### Iteration Guide

1. **Start with typography:** All text must use Segoe UI family with explicit sizes from the Hierarchy table; no smaller than `14px` for captions, `16px` for body.

2. **Apply color systematically:** Use `#FFC100` for primary buttons and hero sections; `#000000` for secondary CTAs and high-contrast text; reserve accent colors (`#00B2FF`, `#A734EE`) for secondary UI only.

3. **Button treatment is identity:** All primary buttons use `100px` border radius, `62px` height, `18px` weight-400 text, `0px 48px` padding; maintain consistency across the interface.

4. **Whitespace amplifies hierarchy:** Minimum `24px` padding inside cards; minimum `48px` vertical spacing between sections; double spacing around hero CTAs.

5. **Shadows are subtle:** Use Level 2 (`rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`) for cards at rest; Level 4 (`rgba(0, 0, 0, 0.1) 0px 10px 15px -3px`) for hover or modal effects; never apply Level 5 to non-modal elements.

6. **Responsive is mobile-first:** Design for `320px` width minimum; use the Breakpoints table to define specific width-based layout shifts; test all layouts at `640px`, `1024px`, and `1440px` widths.

7. **Form inputs are generous:** All inputs minimum `44px` height (`48px` preferred on mobile); `12px 16px` padding; `1px solid #E5E7EB` border; focus state adds `0 0 0 3px rgba(0, 178, 255, 0.1)` glow.

8. **Contrast is non-negotiable:** Text on background must meet WCAG AA (4.5:1 minimum); always pair `#000000` or `#23282F` text with `#FFFFFF` or `#F5F7F9` backgrounds; test hover states for sufficient contrast.

9. **Animation is motion-light:** Hover transforms use `scale(1.02)` or subtle color shifts; transitions are `150–250ms` duration; avoid parallax or heavy motion that distracts from content.

10. **Grid system is 12-column:** All layouts derive from a 12-column flexible grid; cards span `4 columns` (desktop), `6 columns` (tablet), `12 columns` (mobile); maintain `24px` gutters (desktop), `16px` (tablet), `8px` (mobile).