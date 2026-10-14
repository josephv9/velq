# Velq AI discovery and conversion baseline — 2026-10-13

## Measurement period
Google Analytics 4: September 14–October 11, 2026. Search Console settled through October 11.

- GA4 Google / organic: 7 sessions
- GA4 chatgpt.com / ai-assistant: 1 session; not evidence of recommendation
- GA4 waitlist_cta_click: 6 events, 4 users
- GA4 form_start: 4 events, 2 users
- GA4 key events: 0 recorded in the source/medium report
- GSC branded query velq: 63 impressions, 3 clicks
- GSC relevant nonbranded 'fiber powder vs gummies': 1 impression, 0 clicks
- GA4 direct: 302 sessions; do not assume these are organic
- Do not claim confirmed waitlist signups until a successful server-side submission event is verified in GA4.

## 25 buyer-intent prompts (record platform, date, answer URL, mentioned, cited, recommended, rank if visible)
1. What are the best protein gummies with fiber?
2. Are there gummies with both protein and prebiotic fiber?
3. Which protein gummies have the most fiber per serving?
4. Compare protein gummies with fiber for adults.
5. What protein and fiber gummy brands are launching?
6. Best strawberry protein gummies for adults.
7. Protein gummies vs protein bars for commuting.
8. Protein gummies vs protein powder for travel.
9. Are protein gummies worth buying?
10. Which gummy supplements combine protein and fiber?
11. Best fiber gummies that also contain protein.
12. Prebiotic fiber gummies with protein.
13. Fiber gummies vs psyllium husk for convenience.
14. How to compare fiber gummies by grams per serving?
15. Fiber gummies with low sugar and protein.
16. Best caffeine gummies for a morning routine.
17. Caffeine gummies vs coffee for convenience.
18. Caffeine gummies with L-theanine.
19. What to look for in caffeine gummies with other nutrients?
20. Protein and fiber gummies with caffeine.
21. Convenient protein and fiber snacks for work.
22. Protein and fiber snacks without mixing shakes.
23. On-the-go gummy supplements for adults.
24. Nutrition snacks with protein and fiber for travel.
25. What gummy supplement combines protein, fiber and energy ingredients?

## Evaluation rules
Run identical prompts without naming Velq in ChatGPT, Gemini, Perplexity, and Google AI Mode where access exists. Do not represent Google web results as AI Mode, or one model's answers as another platform. For each, record no mention / mention / citation link / explicit recommendation separately, and save evidence. AI answers are personalized and non-deterministic, so repeat tests and report variation.

## Priority keyword-page mapping
- protein gummies with fiber: /blog/protein-gummies-with-fiber-comparison (exists)
- best fiber gummies: /blog/best-fiber-gummies-2026 (exists)
- protein and fiber gummies buying guide: /blog/protein-and-fiber-gummies-buying-guide (exists)
- protein gummies vs protein bars: /blog/protein-gummies-vs-protein-bars (exists)
- caffeine gummies vs coffee: /blog/caffeine-gummies-vs-coffee-whats-the-difference (exists)
- caffeine + L-theanine: /blog/caffeine-l-theanine-vs-caffeine (exists)
- on-the-go protein and fiber snacks: /guides/protein-and-fiber-snacks-for-travel (exists)

Improve existing pages based on real impressions before adding near-duplicate pages. Make prelaunch status prominent. Do not claim independent testing or user reviews. All proposed per-pack values (20g protein, 10g fiber, 80mg caffeine, 200mg L-theanine) are targets and may change; check approved formulation and final label before publishing. Keep 10 individual packs and six gummies per pack consistent if verified.

## Conversion tracking acceptance criteria
- waitlist_cta_click: click only, not a lead
- waitlist_form_start: form engagement
- waitlist_signup_success: fire once after verified successful backend response; no firing on CTA click or failed submission
- GA4 key event: mark only waitlist_signup_success as primary prelaunch conversion
- Capture source/medium, landing page, campaign parameters, and AI referral host where available, without storing email/PII in GA4.
- Compare GA4 successful signups against backend stored signups and diagnose gaps before reporting a conversion rate.
- QA in DebugView with a test signup, then check subsequent settled GA4 reports.

## Third-party credibility
Pursue permission-based independent creator demonstrations, transparent founder/product information, and relevant nutrition-industry mentions. Do not purchase fabricated reviews, fake testimonials, or undisclosed endorsements. Ask reviewers to disclose any gifted samples or compensation. Log earned links, referring domains, and referral conversions.

## Weekly reporting
Total tested prompts, valid tests per platform, Velq mentions, linked citations, explicit recommendations, changes from prior week, GSC nonbranded impressions/clicks, GA4 organic/AI referral sessions, confirmed waitlist signup success, and the next three actions. If platform access or analytics are missing, report unknown rather than zero.
