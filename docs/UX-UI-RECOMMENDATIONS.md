# Things Web - UX/UI Recommendations

## 1) Objectives
- Improve discovery speed and clarity in the map-first experience.
- Reduce friction in the create flow.
- Increase trust in listings without sacrificing privacy.
- Ensure accessibility and mobile usability (WCAG AA minimum).

## 2) Key Screens and UX Priorities
### A) Home / Discovery (Map + List)
- Add a visible “Search this area” CTA after map movement.
- Tighten map↔list linking: marker hover/tap highlights the list item and scrolls it into view.
- Add compact filter bar for Type, Price/Range, Date (events), Distance.
- Keep sorting visible: Newest, Price, Distance.
- Replace “Loading…” with skeleton cards in list.
- Add clear empty state: “No results here. Try moving the map or searching a place.”

### B) Thing Detail
- Improve hero image treatment (full-width, crop-safe) with fallback placeholder.
- Promote status badge (Available / Unavailable / Sold / Ended).
- Add action row (Save, Share, Report) with unobtrusive icons.
- Add trust block (verification, reported count, or “Google source”) and show last updated.
- Clarify location context without precise address unless explicitly allowed.

### C) Create Thing
- Reduce cognitive load with step-like grouping:
  - Step 1: Basics (Name, Type, Category)
  - Step 2: Location (Map, City, Country)
  - Step 3: Details (Price/Range/Date)
  - Step 4: Images
- Use inline validation with clear guidance.
- Add a “Use my location” success toast + map pin feedback.
- Improve media upload UI: drag/drop zone, image count, and max file size note.

### D) My Things
- Add status filter chips at top (All, Active, Inactive, Sold).
- Provide “Empty state + CTA” when no items: “Create your first Thing.”
- Make edit/delete actions clearly distinct (secondary + danger).

## 3) Information Architecture
- Keep navigation shallow; ensure “My Things” and “Create” are top-level actions.
- Provide clear breadcrumb or back navigation on detail and edit pages.

## 4) Visual Design Guidance
- Use a consistent spacing scale (4/8/16/24/32) across components.
- Limit typography to 2 font families and 5-6 sizes max.
- Use semantic colors (primary, success, warning, danger) and ensure contrast.
- Standardize shadows (2–3 elevation levels) to reduce UI noise.

## 5) Interaction & Feedback
- Confirm destructive actions with an inline modal or toast confirmation.
- Provide undo for delete if possible.
- For all async actions >200ms, show skeletons or progress UI.
- Use micro-interactions sparingly (map CTA fade-in, hover states on cards).

## 6) Accessibility Requirements
- Minimum 4.5:1 contrast for text.
- All controls keyboard accessible (map controls, filters, modals).
- Provide labels for all inputs and aria-live for important changes.
- Touch targets 44x44px minimum.

## 7) Mobile-First Guidelines
- Position filters and sort within thumb zones.
- Keep the “Results” sheet draggable and stateful.
- Avoid stacked modals; keep overlays short and dismissible.

## 8) Performance & Perceived Speed
- Use image placeholders (blur or dominant color) in cards and detail hero.
- Lazy load list items and below-the-fold content.
- Debounce map movement and geocoding calls.

## 9) Deliverables for UX/UI Specialist
- Updated sitemap + user flows.
- Low-fidelity wireframes for Home, Detail, Create, My Things.
- High-fidelity mockups with component specs.
- Prototype showing map/list interaction and create flow.
- Accessibility checklist and test plan.

## 10) Open Questions for Design Review
- Should “Save” be a first-class action or hidden in overflow?
- Do we want a compact list overlay or full-screen list on mobile?
- How should trust signals be displayed without cluttering the detail page?
