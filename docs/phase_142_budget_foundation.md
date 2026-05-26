# Phase 142 — Budget App Shell + Budget Foundation

## Scope

Phase 142 adds the first Budget foundation without changing the existing Schedule behavior.

## Added

- Budget / Schedule / Overall mode switch in the app shell.
- Budget mode page.
- Overall mode placeholder page.
- Budget V1 default profile based on the pasted savings plan.
- Editable budget buckets.
- Multiple bank/account skeleton.
- Ledger skeleton for personal, Australia, investments, travel/photography, and side business money.
- Budget persistence fields in local and cloud settings.
- Budget-only local data detection so budget data is not ignored when a user has no schedule data yet.

## Budget V1 default allocation

| Bucket | Monthly Amount | Type |
| --- | ---: | --- |
| Australia Fund | SGD 1,075.00 | Protected goal |
| Entertainment / Travel / Photography | SGD 663.50 | Sinking fund |
| Investments | SGD 400.00 | Protected goal |
| Mother | SGD 500.00 | Fixed commitment |
| Food | SGD 180.00 | Flexible spending |
| Transport | SGD 100.00 | Flexible spending |
| Needs | SGD 180.00 | Flexible spending |
| Wants / Flex | SGD 50.00 | Flexible spending |
| Side Business Fund | SGD 50.00 | Sinking fund |

Total: SGD 3,198.50.

## What was intentionally not added yet

- Transaction entry.
- Spending pace tracker.
- Damage-control repair logic.
- Bonus allocation flow.
- Yearly auto-increases.
- Net worth/Australia projection dashboard.
- Weekly budget check-in.
- Budget/schedule pattern analysis.

These are next phases, after the foundation shell is tested.

## Manual QA

1. Open the app signed in.
2. Use the mode switch to go Schedule → Budget → Overall → Schedule.
3. Confirm Schedule pages still work normally.
4. In Budget, edit monthly income and confirm the unallocated card changes.
5. Edit account balances and confirm Australia-ready funds change when accounts are marked Australia-ready.
6. Edit bucket amounts and confirm allocated/unallocated values update.
7. Refresh the app and confirm Budget edits persist.
8. Confirm no assistant/OpenAI route or UI returned.
