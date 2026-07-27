# RUM Pain Points Demonstrated in The Byte Stop

This app is a hypothetical customer application built specifically to give the RUM pain-point narrative something real to point at during the live demo. Each pain point below maps to a concrete feature, failure mode, or code path in the app — not a hypothetical.

Each section also notes how [RUM without Limits](https://www.datadoghq.com/blog/rum-without-limits/) reinforces that pain point at production scale. It decouples session ingestion from retention: 100% of sessions are captured and used to compute performance metrics, while no-code retention filters decide which sessions are actually kept in full (with replay) — e.g. sessions with errors, crashes, failing network requests, or on critical views like login and checkout. This is the answer to the natural follow-up question a customer asks after seeing the demo: "this is great, but what does it cost at real traffic volume?"

## Demo priority (for a time-boxed session)

For a ~35-40 minute content window with a mixed technical/non-technical audience, run points 1 → 5 as one continuous story (business hook → proof → cost of it), then use 3 as time permits rather than as a separate standalone demo.

| Tier | Points | Why |
|---|---|---|
| 1 — core, always run | 1, 5 | One continuous narrative: broken experience (detected + reproduced) → show what it's costing. Business value up front, no separate context-switch between demos. |
| 2 — run if time allows | 3 | Strong "for the engineers in the room" moment; technical depth, aim it at the second half of the room. |
| 3 — cut first / mention verbally only | 2, 4 | Point 2 (segment-level conversion) is a nice bonus lens on top of point 5's funnel, not required to land the core story — run it only if the audience seems interested in a deeper cut of the data. Point 4 has real value but narrower audience appeal; fold a single sentence of it into point 1 if you're short on time instead of a full separate demo. |

## 1. "Something's broken for users, and we can't reproduce or understand what they actually experienced" *(Tier 1)*

Backend/APM health checks can look green while real users hit broken flows in the browser — because the failure never reaches the server, or the server sees a "successful" request that the user still experienced as broken. And once you know it's happening, a support ticket like "the page froze" or "checkout didn't work" is hard to act on without seeing the actual session.

**Where it's demonstrated:**
- `POST /api/auth/login` returns a clean `401` on wrong password and `POST /api/auth/signup` returns `409` on a duplicate email — these are normal, "working as designed" API responses from the backend's point of view, but they're a broken/blocked moment for the user in the browser.
- The checkout flow (`frontend/src/pages/Checkout.tsx` → `POST /api/checkout`) has a deliberate ~75% simulated failure rate (`backend/app/routers/order_routes.py`, `SIMULATED_FAILURE_RATE`). The backend logs a normal `502` — but without RUM, no one on the product/eng side would otherwise know how often real users are actually hitting a failed checkout, let alone what it looked like for them.
- The forgot-password flow is a deliberate demo stub (`backend/app/routers/auth_routes.py`, `forgot_password`) that returns the reset token directly in the UI instead of emailing it — this gives you a multi-step, stateful flow (request token → follow link → set new password) that's easy to replay live and easy to imagine a confused user describing badly after the fact.

**Steps to demonstrate the pain point in the app:**
1. Pull up a backend/API health view (APM service page, or just the terminal logs) and point out everything reads "healthy" — 2xx/4xx are both just "handled requests," no alerts firing.
2. In the app, go to `/login` and submit a wrong password — call out the `401` in the network tab as, technically, the backend working exactly as designed.
3. Add an item to cart and go through `/checkout`, clicking "Place order." Repeat once or twice if you don't hit the ~75% failure on the first try, so the audience sees the `502` fire live.
4. Say the line out loud: "nothing in that backend log just now told anyone this happened — and if a customer messaged support right now, all they'd say is 'checkout didn't work.'"
5. Optionally, also run the forgot-password flow once (`/forgot-password` → copy the token shown in the UI → `/reset-password/:token` → set a new password) as a second "hard to describe over a ticket" example.

**Steps to show the resolution in Datadog:**
1. Open **RUM → Error Tracking** (or the RUM Overview page) filtered to the checkout view, and show the client-side error rate spiking in real time as you retry checkout.
2. Pull up the corresponding backend/APM service view side by side — same time window, still "healthy" — to make the contrast visual, not just verbal.
3. Open **RUM → Sessions**, filter by the checkout view and an error/failed status, and find the exact session you just generated, then open **Session Replay** and scrub directly to the failure moment — the click on "Place order," the spinner, and the error state rendering.
4. With the replay open, show the synced **Actions** and **Network requests** panels so the audience sees the `502` land in the network panel at the same timestamp as the on-screen error — turning "checkout didn't work" into an exact, reproducible moment.
5. Show a **Monitor** configured on the RUM error rate for the checkout action, and note that this is what would have paged someone, independent of any backend status code.
6. If you ran the forgot-password flow, replay that session too and point out how a multi-step flow that's easy to describe badly in a ticket is trivial to follow frame-by-frame in replay.

**RUM without Limits angle:** at a real-world failure rate this severe, a business would want two things at once: an accurate view of just how bad it is, and every single failing session available to debug — not a sampled subset of either. Because metrics are computed on 100% of ingested sessions before any retention decision, the true failure rate is always accurate regardless of how much you actually retain long-term. And a retention filter can guarantee sessions on failing checkout or a failed login/reset attempt are always kept in full — Datadog's own example of a "critical view" worth guaranteed retention is literally login and checkout — so the exact reproducible session a support ticket describes is there when you go looking, instead of being one of the sessions that got sampled away.

## 2. "We don't know which users are converting worse than others — or why" *(Tier 3 — nice-to-have, no code change needed)*

Aggregate conversion numbers hide segment-level gaps: the overall funnel can look "fine on average" while one whole audience segment — a device, a browser, a traffic source — is quietly struggling, with no single slow request or thrown error to point at.

**Where it's demonstrated:**
- The full purchase funnel (browse → detail → cart → checkout) used in point 5 is already instrumented end to end and needs no extra code — RUM's native Funnel Analysis (RUM Explorer, not a separate product) can break down conversion by any RUM-captured attribute (device type, browser, OS, geography) without a deliberate bug to trigger it.
- Running that same, unmodified funnel from two different environments (a normal desktop window vs. a resized/emulated mobile viewport) produces two visibly different session profiles for identical code and identical backend behavior — which is the point: the gap isn't a performance or error problem, it's a segment problem.

**Steps to demonstrate the pain point in the app:**
1. Run the funnel once end-to-end (browse → detail → cart → checkout) in a normal desktop browser window.
2. Open the browser's device toolbar (e.g. Chrome DevTools → device toolbar, iPhone/Android profile) and run the same funnel again from `/`.
3. Optionally repeat once more in a second browser (e.g. Safari or Firefox) to add a third segment for contrast.

**Steps to show the resolution in Datadog:**
1. Open **RUM Explorer → Funnel Analysis** on the same browse → detail → cart → checkout funnel used in point 5 — this stays entirely inside RUM, no Product Analytics needed.
2. Use the funnel's **breakdown/group-by** control to split conversion by `device.type` (or `browser.name`), and show the resulting conversion lines side-by-side.
3. Call out whichever segment converts visibly worse and frame the business question out loud: "same code, same backend, same latency — so why is this segment converting worse?" — then point to **Session Replay filtered to that segment** as the natural next step to actually find out.

**RUM without Limits angle:** segment-level breakdowns are only trustworthy if the underlying session volume per segment is real, not distorted by sampling — a smaller segment (e.g. Safari users) gets an especially noisy read if only a sampled subset of its sessions feed the conversion number. Because metrics are computed against 100% of ingested sessions before any retention decision, small-segment funnel breakdowns stay statistically sound even when full-session retention (with replay) is scoped down to save cost.

## 3. "Frontend and backend issues get investigated in silos, slowing incident response" *(Tier 2 — run if time allows)*

When something's slow, frontend and backend teams often waste time pointing at each other before anyone traces the actual call path.

**Where it's demonstrated:**
- The checkout button click (`Checkout.tsx` → `handlePlaceOrder`) triggers a single `POST /api/checkout` call that is intentionally the slowest, most failure-prone path in the whole app (`order_routes.py`) — a real frontend action with a real, traceable backend call behind it, including a simulated downstream dependency ("payment processor timeout") that a trace would need to surface.

**Steps to demonstrate the pain point in the app:**
1. Reuse the same checkout click from points 1–2 (no new action needed) — narrate it as: "engineering now has to figure out if this delay/failure is a frontend bug or a backend one."

**Steps to show the resolution in Datadog:**
1. From the RUM session/replay you already have open, click the "Place order" action and use **RUM ↔ APM correlation** ("View related trace" / connected trace flame graph) to jump straight from the browser action to the backend trace.
2. In the trace, drill into the exact backend span — the `time.sleep(SIMULATED_LATENCY_SECONDS)` call and the simulated "payment processor timeout" downstream span — and show it's a single flame graph, not a Slack thread between two teams.
3. Close the loop verbally: "one click, one view, one root cause — no frontend-vs-backend finger-pointing."

**RUM without Limits angle:** retention filters can target sessions with failing network requests specifically, so the exact sessions with a trace-correlated backend failure are the ones guaranteed to be kept — meaning this investigation doesn't depend on getting lucky with a sampling window.

## 4. "We get flooded with JS errors and can't tell which ones actually matter — or the backend has no idea the app is broken at all" *(Tier 3 — cut first, or fold one line into point 1)*

Client-side JavaScript errors are invisible to backend monitoring by definition: the browser never has to tell the server it crashed. A bad third-party data update, a stale cache, or a botched catalog migration can take down a page for real users while every backend health check stays green.

**Where it's demonstrated:**
- One seeded product, "Legacy USB-C Hub (Clearance)" (`backend/app/seed.py`), has `description: None` — a stand-in for a discontinued SKU that fell through an old catalog migration. The API still returns a clean `200` with valid JSON; nothing about the response looks wrong from the backend's side.
- `frontend/src/pages/ProductDetail.tsx` assumes `description` is always a string and calls `.length`/`.slice()` on it to truncate long descriptions — for this one product, that throws an uncaught `TypeError`. An `ErrorBoundary` (`src/components/ErrorBoundary.tsx`) catches it and shows a small "Something went wrong" fallback instead of a blank page, while explicitly reporting the error to RUM via `datadogRum.addError()`.
- Run this against the **`frontend-prod` Docker profile**, not the default dev server — the dev server serves unminified source, so there's nothing for a sourcemap to unminify and the stack is already trivially readable. See README "Production bundle + sourcemaps" for the `docker compose --profile prod-demo ...` commands.

**Steps to demonstrate the pain point in the app:**
1. Before the demo: `docker compose --profile prod-demo build frontend-prod && docker compose --profile prod-demo run --rm frontend-prod npm run sourcemaps:upload && docker compose --profile prod-demo up frontend-prod`, then use http://localhost:5174 (the production bundle) instead of :5173 for this beat.
2. From the product catalog, click into "Legacy USB-C Hub (Clearance)."
3. Show the graceful fallback rendering and note the browser network tab shows a clean `200` for the underlying `GET /api/products/:id` call — the backend has no idea anything went wrong, and the user isn't shown a raw crash either.

**Steps to show the resolution in Datadog:**
1. Open **RUM → Error Tracking**, filtered to the product detail view, and find the de-duplicated `TypeError` issue.
2. Open the issue and show the stack trace — captured from a minified production bundle, but unminified back to the original `ProductDetail.tsx` source line thanks to the sourcemaps uploaded in step 1 — plus the count of real sessions that hit it.
3. Contrast this against backend logs/APM for the same request window — no error, no signal — reinforcing that this class of failure is invisible without RUM by design.

**RUM without Limits angle:** error volume is exactly the kind of thing that spikes unpredictably (one bad catalog sync can turn one error into thousands of sessions). Because error-triggering sessions are a natural no-code retention filter, every session that hit this crash is guaranteed to be kept with full replay and error context, without having to pre-guess which SKU was going to break.

## 5. "We don't know where users are actually dropping off, or which features even get used" *(Tier 1)*

Teams instrument pages and calls, but still can't answer basic product questions: where in the journey are we losing people, and are the features we shipped actually getting adopted?

**Where it's demonstrated:**
- The app already has a clean, fully-instrumented funnel: browse (`ProductList.tsx`) → product detail (`ProductDetail.tsx`) → cart (`Cart.tsx`) → checkout (`Checkout.tsx`) → confirmation. No new code is needed — the funnel is the same one used in points 1 and 2, just viewed through a different lens.
- The self-service password reset flow (`ForgotPassword.tsx` → `ResetPassword.tsx`) is a second, optional path that's easy to demo as an under-the-radar feature: is it discovered, started, and completed, or do people abandon it and contact support instead?

**Steps to demonstrate the pain point in the app:**
1. Walk the funnel live, start to finish: home/catalog → click into a product → add to cart → view cart → checkout → (let one attempt succeed and, if you've already shown the failure in point 1, reference that one too).
2. Optionally, also walk the forgot-password flow once as a second "feature adoption" example.
3. Narrate it as a product question, not a technical one: "leadership doesn't just want to know checkout is slow — they want to know how many people we're actually losing at that step."

**Steps to show the resolution in Datadog:**
1. Open **RUM Explorer → Funnel Analysis** (native to RUM, not a separate product) and build (or open a pre-built) funnel with steps: product list view → product detail view → cart view → checkout view → order-confirmed action.
2. Show the real conversion percentage drop at the checkout step, and tie it directly back to the ~75% simulated failure rate and ~1.5s latency from points 1 and 2 — same tool, "here's the number" and "here's why" in one view.
3. If you ran the forgot-password flow, optionally build a second small funnel (request reset → follow link → set new password) to show feature-level adoption/abandonment, not just the primary purchase funnel.

**RUM without Limits angle:** funnel and journey analysis depends on having every step of every session to build accurate conversion numbers — not just the sampled subset that happened to be retained in full. Metrics computed on 100% of ingested sessions mean the funnel percentages are trustworthy even when only a fraction of full sessions (with replay) are kept long-term.

---

To resume the Claude Code conversation that produced this document:

```
claude --resume 10fa5444-88f9-4317-b2c7-c8be6c0d8d14
```
