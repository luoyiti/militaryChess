# 拉普拉塔河口海战 · 研究代理简报（所有研究代理必读）

Repository root: `/Users/luoyiti/Project/VibeCoding/militaryChess`. Campaign package (being built): `campaigns/river-plate-1939/`.
This is a retro "war-room" map replay (2D staff map + 3D sandbox) of the **Battle of the River Plate** and the
**Admiral Graf Spee commerce-raiding cruise** that led to it. It is the project's FIRST NAVAL campaign: ship tracks are
replayed minute-by-minute during the battle, with salvoes, hits, torpedoes, smoke screens and spotter aircraft drawn on
the map. Your research is the factual foundation: be deep, specific and source-critical. The UI is Chinese, but your
research notes may be in English or Chinese (Chinese preferred for prose, keep original names/quotes in original language).

## Scope of the campaign
- Time window: **1939-09-26 → 1939-12-21** (raiding authorised 26 Sep; Clement sunk 30 Sep; hunting groups formed 5 Oct;
  battle 13 Dec; Montevideo 14–17 Dec; scuttling 17 Dec; Langsdorff's suicide night of 19/20 Dec; funeral 21 Dec).
  Earlier context (departure from Wilhelmshaven 21 Aug 1939, waiting in the South Atlantic in September) belongs in notes.
- Map frame: South Atlantic, lon −70…+40, lat −56…+16 (River Plate, Brazil, Falklands, Cape Town, Freetown, Dakar,
  Mozambique Channel). Positions outside are tolerated only for off-map arrivals.

## Conventions (strict)
- **Coordinates** as decimal degrees `[lon, lat]` (west & south negative), 3–4 decimals. Convert DMS carefully
  (34°27'S 49°55'W → [-49.917, -34.45]). Always record the original DMS / source wording next to converted values.
- **Times**: record every time exactly as the source gives it AND the clock it is in (e.g. "0614 (British ship time, zone +2?)",
  "6.17 Uhr (German, MEZ?)", "GMT"). One task of the battle researcher is to establish which zone each side's
  clocks used on 13 Dec 1939 and the offset between German and British times — everybody should note any evidence they see.
- **Sources**: every fact needs a source id. Keep a source table at the top of your notes:
  `id | author | title | year | url | what it supports`. Use ids `^[a-z0-9_]+$` (e.g. `harwood_despatch`, `pope_1956`,
  `bidlingmaier`, `rasenack`, `millington_drake`, `admiralty_bs26`, `navweaps`, `naval_history_net`, `wiki_en_river_plate`).
  Prefer primary documents (Harwood's despatch, London Gazette No. 38017 supplement 17 June 1947; Admiralty Battle Summary
  No. 26; ship logs; German KTB / Rasenack / Langsdorff's report; Uruguayan & Argentine documents) and serious secondary
  works (Dudley Pope *The Battle of the River Plate* 1956; Eugen Millington-Drake *The Drama of Graf Spee* 1964;
  Richard Woodman; Eric Grove *The Price of Disobedience* 2000; Gerhard Bidlingmaier; Friedrich Wilhelm Rasenack
  *Panzerschiff Admiral Graf Spee*; Paul Kennedy? etc.), cross-checked with good web resources (naval-history.net, navweaps.com,
  uboat.net-like merchant-loss databases, wrecksite.eu, Wikipedia EN/DE/ES with their citations, Achilles/Ajax/Exeter
  association sites, NZ History (nzhistory.govt.nz), Uruguayan sources such as the Graf Spee museum / armada.mil.uy).
- Contested points: give all versions with sources and say which you prefer and why (confidence high/medium/low).
- Do NOT write campaign data JSON yet. Write research notes + the machine-readable tables requested in your task.
  Put everything under `campaigns/river-plate-1939/docs/research/` — only the files your task names (other agents write in parallel).
- Use WebSearch and WebFetch extensively (dozens of queries); fetch the primary documents where they are online
  (e.g. London Gazette supplement 38017 PDF, HyperWar / naval-history.net transcriptions, archive.org scans).
- Finish with a short report: what you produced, key findings, gaps/uncertainties.
