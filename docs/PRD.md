# Things Web - Product Requirements Document (PRD)

## 1) Summary
Things Web is a map-first discovery and listing experience for local items, stores, and events ("Things"). The core product value is fast discovery by location with privacy-aware display, plus a simple posting and management flow for creators.

This PRD focuses on tightening the discovery and creation experience, clarifying the core user problem, and defining measurable outcomes for UX/UI and engineering execution.

## 2) Problem Statement
People want to discover interesting local items, stores, and events near them, but existing experiences are fragmented across platforms and hard to scan by location. Creators want a simple way to list and manage their things without complex setup.

## 3) Goals and Success Metrics
### Primary goals
- Improve discovery usefulness and reduce time-to-find.
- Increase successful creation of new Things.
- Build trust in listings through consistent signals and privacy.

### Success metrics (leading)
- Map to detail CTR: target +25% from baseline.
- Search to result rate: target +20% from baseline.
- Create flow completion rate: target +20% from baseline.
- Average time to create a Thing: target -20%.

### Success metrics (lagging)
- Weekly active users (WAU): target +15%.
- Returning users within 30 days: target +10%.
- Active listings per user: target +10%.

## 4) Users and Jobs-to-be-Done (JTBD)
### Personas
- Explorer: wants to find interesting things nearby quickly.
- Creator: wants to post and manage their things with minimal friction.

### JTBD statements
- When I am in a location, I want to scan what is around me so that I can discover relevant things quickly.
- When I have something to share, I want to post it fast and be confident it appears correctly.

## 5) Scope
### In scope (Now)
- Discovery and map/list cohesion improvements.
- Filters and sorting expansion.
- Better onboarding and empty states.
- Instrumentation of core events.

### In scope (Next)
- Save/share, basic trust signals, and reporting.
- Ranking improvements (relevance, recency, distance).
- Improved media processing.

### Out of scope (for this PRD)
- Full marketplace checkout.
- Complex social network features.
- Enterprise or B2B tooling.

## 6) Key User Flows
1. Discover: Open app -> map shows nearby -> refine search -> open detail.
2. Create: Sign in -> add Thing -> add location & images -> submit -> see in My Things.
3. Manage: Open My Things -> filter/sort -> edit or delete.

## 7) Requirements
### Discovery
- Map and list must stay in sync (hover/tap highlights both).
- Add a "Search this area" call-to-action after map movement.
- Add filters for type, status, price range, event date range, distance.
- Sorting options: newest, price (low to high, high to low), distance.

### Detail
- Stronger hero image treatment and status badge.
- Show clear location context without exposing exact coordinates unless allowed.
- Add save/share actions.
- Add trust indicator block (verification or report link in Next scope).

### Create
- Reduce required fields for first post (only name, type, and location required).
- Clear inline validation and error states.
- Show image previews and limit to 5.

### My Things
- Provide status filters and clear empty state.
- Confirm destructive actions (delete).

### Analytics
- Track core funnel events (see section 9).

## 8) Acceptance Criteria (Examples)
- If a user moves the map and stops, a "Search this area" CTA appears within 2s.
- Selecting a marker highlights the corresponding list item (and vice versa).
- A user can filter by type and see the count update without a full page refresh.
- Creating a Thing with only required fields succeeds.
- A user can save a Thing and find it later (Next scope).

## 9) Instrumentation Plan
### Events
- discovery_map_move
- discovery_search_submit
- discovery_filters_apply
- discovery_result_click
- detail_view
- create_start
- create_submit_success
- create_submit_error
- mythings_view
- mythings_edit_start
- mythings_delete_confirm

### Properties (common)
- user_id (if signed in)
- location_bounds
- filters
- sort
- thing_id (when applicable)

## 10) Risks and Mitigations
- Privacy expectations: use approximate location by default and expose exact location only with explicit permission.
- API cost for geocoding: debounce and cache search results.
- Low listing quality: require basic fields and add later moderation hooks.

## 11) Open Questions
- What is the primary business model (ads, subscriptions, fees, lead-gen)?
- Should guest users be allowed to create listings?
- How will trust signals be verified (manual, automated, or community)?

## 12) Dependencies
- Google Maps API key and usage limits.
- Backend support for new filters and sorting.
- Analytics pipeline availability.

## 13) Deliverables
- UX/UI designs for discovery, detail, and create flows.
- Engineering tasks and estimates for API changes and UI updates.
- Analytics event tracking implementation.
