# Prism Design System

**Slogan**: "One source. Every tool."
**Design Baseline**: `prism-frontend.html`（PRD 指定为前端设计基准）

---

## 1. Design Philosophy

| Principle | Implementation |
|-----------|---------------|
| **Warm Minimalism** | Warm off-white backgrounds, warm gray text — never cold grays |
| **Generous Whitespace** | Section gaps 48→64px, card padding 24px, page margins breathe |
| **Soft Gradients** | Hero sections use subtle radial warm gradients, never harsh |
| **Organic Roundness** | Border radius 6→18px (matches prism-frontend.html tokens) |
| **Restrained Elegance** | One accent color (warm orange), subtle shadows, no neon |
| **Content First** | UI chrome recedes; content and data are the focus |

### Anti-Patterns (Avoid)

- Dark terminal aesthetic (`bg-zinc-950`, `text-emerald-400`, `border-zinc-800`)
- Neon/glow effects (`shadow-emerald-500/20`, `bg-emerald-500/5 blur-3xl`)
- Cold grays (`zinc-400`, `zinc-600`, `zinc-700`)
- Hard borders — use subtle warm borders
- Harsh shadows — use soft, low-opacity shadows
- Monospace as UI body font — monospace for code only
- Noise overlays or scan-line effects (terminal nostalgia)
- Dark-only forced mode
- Mixing multiple accent colors (emerald + cyan + teal)

---

## 2. Color Palette

### 2.1 Semantic Tokens (CSS Variables)

All colors flow through semantic tokens. Never use raw hex in components.

#### Light Theme (`:root`)

```css
--background: #f5f4ef          /* warm paper-like page bg */
--foreground: #141413          /* warm dark text */

--card: #ffffff                /* clean white surface */
--card-foreground: #141413
--popover: #ffffff
--popover-foreground: #141413

--primary: #d97757             /* warm orange accent */
--primary-foreground: #ffffff

--secondary: #faf9f5           /* warm light surface */
--secondary-foreground: #5a5850

--muted: #faf9f5               /* subtle bg */
--muted-foreground: #9c9890    /* warm gray for secondary text */

--accent: #f0ede6              /* hover/pressed surface */
--accent-foreground: #5a5850

--destructive: #c0504a         /* warm red, not harsh */
--destructive-foreground: #ffffff

--border: #e4e1d8              /* warm subtle border */
--input: #e4e1d8
--ring: #d97757                /* focus ring in primary */

--chart-1: #d97757             /* warm orange */
--chart-2: #788c5d             /* muted sage green */
--chart-3: #dcb06c             /* warm gold */
--chart-4: #6a9bcc             /* muted blue */
--chart-5: #c0504a             /* warm muted red */

--radius: 0.625rem             /* 10px — matches prism-frontend */

/* Sidebar */
--sidebar: #faf9f5
--sidebar-foreground: #5a5850
--sidebar-primary: #d97757
--sidebar-primary-foreground: #ffffff
--sidebar-accent: #f0ede6
--sidebar-accent-foreground: #5a5850
--sidebar-border: #e4e1d8
--sidebar-ring: #d97757
```

#### Dark Theme (`.dark`)

```css
--background: #1a1614          /* warm dark brown-black */
--foreground: #ede4dc          /* warm light cream */

--card: #221e1c                /* slightly lighter */
--card-foreground: #ede4dc
--popover: #221e1c
--popover-foreground: #ede4dc

--primary: #e08a65             /* slightly lighter warm accent */
--primary-foreground: #1a1614

--secondary: #2a2522
--secondary-foreground: #d4c8bd

--muted: #2a2522
--muted-foreground: #9c8e83

--accent: #2a2522
--accent-foreground: #d4c8bd

--destructive: #d46060
--destructive-foreground: #1a1614

--border: #2a2522
--input: #2a2522
--ring: #e08a65

--chart-1: #e08a65
--chart-2: #788c5d
--chart-3: #dcb06c
--chart-4: #6a9bcc
--chart-5: #d46060

--sidebar: #1e1a18
--sidebar-foreground: #ede4dc
--sidebar-primary: #e08a65
--sidebar-primary-foreground: #1a1614
--sidebar-accent: #2a2522
--sidebar-accent-foreground: #d4c8bd
--sidebar-border: #2a2522
--sidebar-ring: #e08a65
```

### 2.2 Color Usage Rules

| Element | Light | Dark |
|---------|-------|------|
| Page background | `--background` (#f5f4ef) | `--background` (#1a1614) |
| Cards / Dialogs | `--card` (#ffffff) | `--card` (#221e1c) |
| Primary buttons | `--primary` (#d97757) | `--primary` (#e08a65) |
| Body text | `--foreground` (#141413) | `--foreground` (#ede4dc) |
| Secondary text | `--muted-foreground` (#9c9890) | `--muted-foreground` (#9c8e83) |
| Borders | `--border` (#e4e1d8) | `--border` (#2a2522) |
| Focus ring | `--ring` (#d97757) | `--ring` (#e08a65) |

---

## 3. Typography System

### 3.1 Font Stack

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| UI Sans | **Geist Sans** (via next/font) | 400, 500, 600 | Body, labels, navigation, buttons, headings |
| Code Mono | **JetBrains Mono** (via next/font) | 400, 500, 600 | Inline code, command snippets, data tables, terminal demos |

### 3.2 Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-xs` | 12px | 400 | 1.5 | Captions, badges, tertiary info |
| `text-sm` | 14px | 400 | 1.5 | Body, navigation, form labels |
| `text-base` | 16px | 400 | 1.6 | Long-form body, descriptions |
| `text-lg` | 18px | 500 | 1.5 | Card titles, emphasized body |
| `text-xl` | 20px | 500 | 1.4 | Section headings |
| `text-2xl` | 24px | 600 | 1.3 | Page titles |
| `text-3xl` | 30px | 600 | 1.2 | Hero subheadings |
| `text-4xl` | 36px | 600 | 1.15 | Major headings |
| `text-5xl` | 48px | 600 | 1.1 | Hero heading |
| `text-6xl` | 60px | 600 | 1.05 | Brand wordmark |

---

## 4. Spacing Standard

### 4.1 Base Grid: 4px

All spacing multiplies of 4px. Use Tailwind spacing scale.

### 4.2 Layout Specifics

| Context | Mobile | Desktop |
|---------|--------|---------|
| Page horizontal padding | 16px (`px-4`) | 32px (`px-8`) |
| Content max-width | Full width | 1280px (`max-w-7xl`) |
| Card padding | 20px | 24px (`p-6`) |
| Sidebar width | Full screen (overlay) | 224px (matches prism-frontend) |
| Form field gap | 16px | 16px |

---

## 5. Card Spec

```css
.prism-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;        /* radius-lg per prism-frontend */
  padding: 24px;              /* p-6 */
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 4px 16px rgba(0, 0, 0, 0.04);
  transition: box-shadow 200ms ease, border-color 200ms ease;
}

.prism-card:hover {
  border-color: var(--primary);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 8px 24px rgba(0, 0, 0, 0.06);
}
```

---

## 6. Button Spec

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| **Primary** | `--primary` | `--primary-foreground` | none | `brightness(1.08)` |
| **Secondary** | `--secondary` | `--secondary-foreground` | none | `brightness(0.96)` |
| **Outline** | transparent | `--foreground` | `--border` | bg-secondary |
| **Ghost** | transparent | `--foreground` | none | bg-accent |
| **Destructive** | transparent | `--destructive` | `--destructive/20` | bg-destructive/10 |
| **Link** | transparent | `--primary` | none | underline |

| Size | Height | Padding | Font |
|------|--------|---------|------|
| xs | 28px | `px-2.5` | 12px |
| sm | 32px | `px-3` | 13px |
| md (default) | 40px | `px-5` | 14px |
| lg | 48px | `px-6` | 16px |
| icon | 40px | 0 | — |

All touch targets ≥ 44px.

---

## 7. Effects & Motion

### 7.1 Shadows

```css
--shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md:  0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.05);
--shadow-lg:  0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.06);
--shadow-xl:  0 4px 16px rgba(0, 0, 0, 0.08), 0 16px 40px rgba(0, 0, 0, 0.08);
```

### 7.2 Transitions

| Context | Duration | Easing |
|---------|----------|--------|
| Hover (color/bg) | 150ms | `ease` |
| Hover (shadow) | 200ms | `ease` |
| Enter (modal, sheet) | 200ms | `ease-out` |
| Exit (modal, sheet) | 150ms | `ease-in` |
| Page transition | 300ms | `ease-out` |

---

## 8. Iconography

- **Library**: Lucide React (`lucide-react`)
- **Default size**: 16px (`size-4`) for UI, 20px (`size-5`) for standalone
- **No emojis** as structural icons

---

## 9. Breakpoints

| Breakpoint | Width | Typical Device |
|------------|-------|---------------|
| `sm` | 640px | Large phone landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / small laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |

Design mobile-first. All styles start at 375px viewport.

---

## 10. Accessibility

- **Contrast**: Body text ≥4.5:1, large text ≥3:1, UI components ≥3:1
- **Touch targets**: All interactive elements ≥44×44px
- **Focus rings**: Visible 2px outline with 2px offset
- **Reduced motion**: Respect `prefers-reduced-motion`
- **Color not alone**: Never convey meaning by color alone — always pair with icon or text

---

## 11. Implementation Checklist

When implementing any UI, verify:

- [ ] No emojis used as icons
- [ ] All colors use semantic CSS variables
- [ ] Monospace only for code/commands, sans for UI labels
- [ ] Touch targets ≥44px
- [ ] Focus rings visible on all interactive elements
- [ ] Both light and dark themes tested
- [ ] Body text contrast ≥4.5:1 in both themes
- [ ] No `ring-white/*` or `border-white/*` hardcoded classes
- [ ] No `bg-zinc-950`, `text-emerald-*`, `text-cyan-*` hardcoded colors
- [ ] Border radius: `--radius-sm` (6px), `--radius` (10px), `--radius-lg` (14px), `--radius-xl` (18px)
- [ ] Spacing follows 4px grid
- [ ] No instant transitions (0ms) — use 150–300ms
