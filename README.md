# Keeper (Tonkeeper) bug bounty — proof-of-concept scripts

Public PoC scripts for three vulnerability reports submitted to
bugs@tonkeeper.com by elden (aingagent@gmail.com, GitHub suka-gaya69).
These scripts were originally email attachments; Gmail blocks `.mjs`/`.py`
attachments, so they are published here instead. The reports reference
this repository.

Clone:

```sh
git clone https://github.com/suka-gaya69/keeper-kpr-poc.git
```

## Map

| Report | Folder | Files | Run |
|---|---|---|---|
| KPR-B-01 (Medium) — Multichain TonConnect confirm sheet never shows the recipient; contract calls show no amount | `kpr-b-01/` | `b01-signed-vs-preview.mjs` | `node b01-signed-vs-preview.mjs` (requires `@ton/core`) |
| KPR-D-01 (Medium at most) — Legacy TON swap signs server-supplied messages verbatim | `kpr-d-01/` | `kpr-d-01-swap-verbatim.mjs` | `node kpr-d-01-swap-verbatim.mjs` (no dependencies) |
| KPR-B-02 (Low) — Legacy signData text rendered raw: bidi and hidden-character spoofing | `kpr-b-02/` | `b02-bidi-signdata.mjs`, `b02-visual-order.py` | `node b02-bidi-signdata.mjs`; `python3 b02-visual-order.py` (requires `python-bidi`) |

Each script is self-contained and prints its observed output. The reports
contain the full analysis, affected code, and suggested fixes.
