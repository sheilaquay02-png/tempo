# Phase 145 — Card long-press edit mode patch

Base applied before this patch:

- `tempo_phase144.zip`
- Phase 144 ledger correction patch
- Phase 144 home/ledger/popup correction patch
- Phase 144 account/card editor bugfix patch
- Phase 144 home visual correction patch
- Phase 144 home popup/month fix patch
- Phase 145 budget plan patch
- Phase 145 account card grid patch

## Changes

- Added 3-second long press on Budget Home income/expense cards to enter card edit mode.
- Added 3-second long press on Budget Account cards to enter account edit mode.
- Edit mode exposes quick delete and left/right rearrange controls.
- Added Done controls to exit Home card edit mode and Account card edit mode.
- Fixed mobile Home income-card grid so income cards also stay 3 per row.
- Account card click/open behavior remains unchanged outside edit mode.
- Home card tap-to-record behavior remains unchanged outside edit mode.

## Check

- Budget → Home: long-press Food/Mother/etc. for 3 seconds.
- Confirm edit mode appears.
- Use × to delete a card.
- Use ‹ / › to rearrange cards.
- Tap Done to leave edit mode.
- Confirm normal card tap still opens transaction popup after leaving edit mode.
- Budget → Account: long-press a bank/account card for 3 seconds.
- Confirm edit mode appears.
- Use × to delete an account card.
- Use ‹ / › to rearrange account cards within their group.
- Confirm mobile Home income cards render 3 per row.
