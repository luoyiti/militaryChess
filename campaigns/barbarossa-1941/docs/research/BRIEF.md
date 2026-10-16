# 巴巴罗萨行动 · 多代理协作简报（所有代理必读）

Repository root: `/Users/luoyiti/Project/VibeCoding/militaryChess`. Campaign package: `campaigns/barbarossa-1941/`.
This is a retro "war-room" wargame-map replay of Operation Barbarossa (1941-06-22 03:15 → 1941-12-05 23:59).
The engine is finished; we only author **data** (JSON) for this campaign. **Interface language is Chinese** — every
user-visible string (`zh`, `history`, `body`, `note`, `caption`, `desc`, labels) is written in Simplified Chinese.

Read first (formats are strict, a validator enforces them):
- `docs/DATA-FORMAT.md` — data format v2 (Unit, Route, ControlKeyframe, HistEvent, Pocket, Equipment, forces)
- `engine/core/types.ts` — runtime types; `engine/schema/zod.ts` — the exact schema the validator applies
- Example of a finished campaign: `campaigns/poland-1939/data/` (oob/de.json, oob/su.json, events.json, fronts/, pockets.json, routes/)
- Validate: `npm run validate -- --campaign barbarossa-1941` (ERROR must be fixed; WARN reviewed). Other agents are writing
  in parallel, so errors in files you do not own are not your concern — fix your own.

## 1. Historical depth is the point
Research deeply: use WebSearch / WebFetch on English, German and Russian sources (Wikipedia EN/DE/RU and their cited works,
lexikon-der-wehrmacht.de, axishistory.com, rkka.ru, soldat.ru, militera.lib.ru (Russian memoirs/official histories),
Glantz, Stahel, Erickson, DRZW Bd. 4, Bergström, Kirchubel/Osprey, etc.). Cross-check dates and places. Prefer specifics
(who, which unit, where, when, outcome, numbers). Record uncertainty with `confidence` and wording like「一说」.
Keep a research log in `campaigns/barbarossa-1941/docs/research/<your-area>.md` (key facts, dates, contested points, sources with URLs).

## 2. Conventions
- **Time**: `'YYYY-MM-DDTHH:mm'` in **Berlin time (CEST = UTC+2)**. Moscow time is Berlin+1h (e.g. the 03:15 Berlin H-hour
  = 04:15 Moscow). Convert Soviet-dated hours to Berlin time. If only the day is known, use a plausible hour and set
  `precision: "day"` on events. All times must be real calendar dates within 1941-06-22T00:00 … 1941-12-06T23:59.
- **Coordinates**: `[lon, lat]` WGS84 decimal, 3 decimals is plenty; or `"@placeId"` referencing the gazetteer.
  Map frame bbox is lon 20–42, lat 44–62 (positions slightly outside are tolerated for off-map assembly/withdrawal only).
- **Sides & id prefixes**: DE `de.` 德国 · FI `fi.` 芬兰 · RO `ro.` 罗马尼亚 · HU `hu.` 匈牙利 · SK `sk.` 斯洛伐克 · IT `it.` 意大利 · SU `su.` 苏联.
  Cross-side subordination (e.g. Hungarian Mobile Corps under German 17th Army) is allowed: `parentExceptions` will be set to
  allow FI/RO/HU/SK/IT units to have DE parents and DE units to have RO parents.
- **Unit id scheme** (lowercase, `[a-z0-9_.-]`):
  - German: army groups `de.hgr_nord|hgr_mitte|hgr_sued`; armies `de.16a`; panzer groups `de.pzgr1`…`de.pzgr4` (echelon `army`, type `armor`, they became Panzerarmee 1/2 in Oct — keep the same id, note the rename in `history`);
    corps `de.i_ak` (infantry), `de.xli_mk` (motorized "Armeekorps (mot.)"), `de.xlvii_mk`; divisions `de.1pz`, `de.3idmot`, `de.121id`,
    `de.1gd` (Gebirgs), `de.1kd` (1. Kavallerie-Division), `de.ss_reich`, `de.ss_totenkopf`, `de.ss_wiking`, `de.ss_polizei`, `de.lssah`, `de.gd_rgt` (IR Großdeutschland), `de.250id` (Spanish Blue Division), `de.707sd` (security).
  - Soviet: fronts `su.f_nw` (Northwestern), `su.f_w` (Western), `su.f_sw`, `su.f_s`, `su.f_n` (Northern), `su.f_len`, `su.f_volkhov`, `su.f_res` (Reserve), `su.f_bry` (Bryansk), `su.f_central`, `su.f_kalinin`;
    armies `su.11a`; a re-formed army with the same number gets a suffix `su.19a_2`; operational groups `su.og_luga`;
    corps `su.6mk` (mechanized), `su.21sk` (rifle), `su.6kk` (cavalry), `su.5vdk` (airborne); divisions `su.100sd` (rifle), `su.7td` (tank), `su.1md` (motorized), `su.32kd` (cavalry), `su.1dno` (militia/ДНО), `su.316sd`; brigades `su.4tbr` (tank).
  - Finnish `fi.karelian_army`, `fi.iv_ak`, `fi.12d`; Romanian `ro.3a`, `ro.4a`, `ro.mtn_corps`, `ro.1gd`; Hungarian `hu.carpathian_group`, `hu.mobile_corps`, `hu.1mot_bde`; Italian `it.csir`, `it.pasubio`, `it.torino`, `it.celere`; Slovak `sk.army_group`, `sk.rapid_bde`, `sk.rapid_div`.
- **Chinese naming style** (match `campaigns/poland-1939`): spaces around numerals:「第 4 装甲集群」「第 XLI 摩托化军」「第 1 装甲师」「第 3 摩托化步兵师」「第 11 集团军」「第 6 机械化军」「第 21 步兵军」「第 100 步兵师」「第 7 坦克师」。
  `name.orig` = original name (German `16. Armee`, `XXXXI. Armeekorps (mot.)`; Russian `11-я армия`, `6-й механизированный корпус`, `100-я стрелковая дивизия`; Finnish `Karjalan Armeija`; Romanian `Armata a 3-a`; Hungarian `Gyorshadtest`; Italian `Corpo di Spedizione Italiano in Russia`).
  `name.short` = counter label, ≤ 8 chars: German `16.A` `PzGr 4` `XLI` `1.Pz` `3.ID(m)` `121.ID` `SS-R`; Soviet `11 A` `6 МК` `21 СК` `100 СД` `7 ТД` (Cyrillic abbreviations as in poland-1939 su.json).
  Commanders: `{ "zh": "勒布", "orig": "Wilhelm Ritter von Leeb" }`; Soviet with 1941 rank/name `{ "zh": "库兹涅佐夫上将", "orig": "генерал-полковник Ф. И. Кузнецов" }`. If command changed, name the main commander and list changes in `history`.
- **Unit fields**: `echelon` (armygroup/front = label-only tree nodes, army, corps, division, brigade, regiment), `type` (hq armor motorized infantry mountain cavalry cavalry_mech border fortress naval marine artillery reserve airborne …),
  `model` (3D figure; registered ids: `pz2 pz3 pz4 pz35t pz38t sdkfz231 t26 bt7 inf_de inf_su inf_sk inf_hu inf_it cav_su art_gun navy_token`; `t34`, `kv1`, `inf_fi`, `inf_ro` are being added — you may use them),
  `strength` (men/tanks/guns at start), `equipment` (ids from data/equipment.json — owned by the media agent: `pz2 pz3 pz4 pz38t pz35t stug3 sdkfz251 t26 bt7 t34 kv1 kv2 t28 t35 t37 ba10 …`; unknown ids only WARN),
  `active.from` for units arriving later (reinforcements) and `track` (strictly increasing times).
- **Tracks**: give **every army, corps and division its own track** (do not rely on centroids — parents change over time).
  Divisions: a point every 1–4 days in mobile phases, at every battle/encirclement/river crossing, sparser in static periods.
  Use `status` transitions: `active` → `engaged` (in combat) → `encircled` (inside a pocket) → `destroyed` / `surrendered` (terminal, fades out),
  `withdrawing`, `reserve`, `ineffective` (terminal: wrecked & withdrawn), `disbanded` (terminal), `inactive`. Short `note` on key points (Chinese).
  Ground speed limits (validator WARN above): infantry 45 km/day, motorized/armor 100 km/day; use `"movement": "rail"` on the point *before*
  a rail transfer (up to 700 km/day) and `"movement": "sea"` for sea moves.
  Positions must agree with the front lines: German units on/behind the front, Soviet units on/in front of it unless `encircled`.
  Units arriving later: first track point at their arrival time (`active.from` equal to it). Units destroyed: terminal status at the date of destruction.
- **Every object** has `sources` (ids from `data/sources/*.json`) and `confidence` (high/medium/low). Add your own sources to
  `data/sources/<your-area>.json` (ids `^[a-z0-9_]+$`, globally unique — check `data/sources/core.json` and the other files first; prefix with your area if in doubt, e.g. `north_kirchubel`).
- **Gazetteer**: `data/gazetteer/core.json` has ~120 major places (ids like `moscow kiev minsk smolensk brest lvov dvinsk pskov vyazma tula kalinin rostov sevastopol tikhvin`).
  **Reuse them.** Add places you need to **your own** `data/gazetteer/<your-area>.json`. Before adding, check all `data/gazetteer/*.json` for an existing place
  within ~5 km (reuse its id). New ids: lowercase ASCII transliteration of the common 1941 name (`staraya_russa`, `velikiye_luki` → already `velikie_luki`!).
  Place: `{ id, zh, orig (1941 official local name), alt?, pos:[lon,lat], kind, rank (1 capital … 4 village/battle point), country (1941: SU/DE/RO/FI/HU…) }`.
  Use rank 4 for minor battle sites so they only show when zoomed in. Do not add hundreds of trivial villages — prefer raw coordinates in tracks.
- **Events**: staged per area in `campaigns/barbarossa-1941/pipeline/events/<your-area>.json` (an array of HistEvent); the integrator merges them into
  `data/events.json`. id `e.<snake>`; `body` **80–140 Chinese characters** (validator WARN outside 60–170), factual, specific, neutral tone, no Markdown;
  `title.zh` short (≤ 14 chars) + `title.orig` (German/Russian/other original name of the battle/event); `importance` 1 = campaign-defining (rare: ~5 per area),
  2 = major, 3 = notable; `category` battle/air/naval/political/atrocity/movement/surrender/siege; `place` (gazetteer ref or coords); `units` (ids you own or that exist);
  `sfx` optional from: typewriter bell stamp paper explosion artillery stuka bomber engine tank ship_gun siren radio morse mg rifle march cavalry fighter;
  `zoomRel` (1 = whole map; ~3–5 regional, 6–9 local); `wide: true` for front-wide events. `photo` only via the media agent (leave it out).
  Atrocities (e.g. Babi Yar, Kaunas, Lviv pogroms, Kamianets-Podilskyi, Commissar Order, POW deaths) are covered factually and soberly.
- **Routes** (advance arrows): `data/routes/<your-area>.json`, `{ id: "r.<snake>", side, unit, style: main|secondary|counter|retreat|breakout, widthKm (8–40), label?, waypoints:[{at,pos}…], sources, confidence }`.
  One arrow per major thrust/counterattack/breakout (e.g. Panzer group drives, Soviet counterstrokes, breakout attempts), waypoints dated so the arrow grows over time.
  Waypoint times strictly increasing; `unit` must exist (one you own).
- **No Markdown/HTML in data strings**; Chinese punctuation（，。、「」“”）; numbers like「约 3.5 万人」「1941 年 7 月 16 日」.

## 3. Ownership (to avoid write conflicts)
Each agent writes **only** its own files. Units that move between sectors stay with the agent that owns them (full-period track).

| Agent | Files it owns |
|---|---|
| **north** | `data/oob/north_de.json`, `data/oob/north_su.json`, `data/oob/fi.json`, `data/routes/north.json`, `data/gazetteer/north.json`, `data/sources/north.json`, `pipeline/events/north.json`, `docs/research/north.md`, builder scripts in `pipeline/build/north*` |
| **center** | `data/oob/center_de.json`, `data/oob/center_su.json`, `data/routes/center.json`, `data/gazetteer/center.json`, `data/sources/center.json`, `pipeline/events/center.json`, `docs/research/center.md`, `pipeline/build/center*` |
| **south** | `data/oob/south_de.json`, `data/oob/south_su.json`, `data/oob/ro.json`, `data/oob/hu.json`, `data/oob/it.json`, `data/oob/sk.json`, `data/routes/south.json`, `data/gazetteer/south.json`, `data/sources/south.json`, `pipeline/events/south.json`, `docs/research/south.md`, `pipeline/build/south*` |
| **fronts** | `data/fronts/*.json`, `data/pockets.json`, `data/demarcation.json`, `data/gazetteer/fronts.json`, `data/sources/fronts.json`, `pipeline/fronts/**`, `docs/research/fronts.md` |
| **media** | `data/equipment.json`, `data/forces.json`, `data/sources/media.json`, `pipeline/events/strategic.json`, `public/campaigns/barbarossa-1941/photos/**`, `public/campaigns/barbarossa-1941/credits.json`, `pipeline/scripts/assets/**`, `docs/research/media.md`, `docs/research/manifest-texts.md` |
| **models** | `engine/three/models/**` (adds t34, kv1, inf_fi, inf_ro), related tests |

The integrator (lead) owns `campaign.json`, `data/events.json`, `config/**`, `tests/**`, and the empty placeholder files `data/oob/{de,su,…}.json`.

### Sector ownership of units (by 22 June position)
- Reinforcements that were **not** at the front on 22 June belong to the sector where they first arrive (e.g. 2. & 5. PzD and XL Mot. Corps → center (Typhoon); 250. ID (Blue Division) and SS-Polizei → north; Siberian/Far-Eastern divisions → wherever they detrain).
- **north**: Heeresgruppe Nord (16. & 18. Armee; Panzergruppe 4 HQ and its original corps XLI & LVI Mot. with their divisions 1., 6., 8. PzD, 3., 36. ID(mot), 269., 290. ID, SS-Totenkopf — full-period tracks, i.e. including PzGr 4 HQ's September transfer to Heeresgruppe Mitte for Typhoon (Moscow, Istra, Krasnaya Polyana) and XLI corps' move to the Kalinin axis under PzGr 3), Finnish forces (Karelian Army, IV & II Corps on the Karelian Isthmus, etc.), German units in Finland only if they enter the map; Soviet Northern/Leningrad Front, Northwestern Front (8, 11, 27, 34, 48 A, 3/12/21 MK …), Volkhov Front, 4/52/54/55/42/23/7/8 A, Luga Operational Group, Neva Operational Group, Baltic Fleet units, Hanko, Tallinn, Moonsund, Oranienbaum.
  Also XXXIX Mot. Corps' Tikhvin operation divisions **after** they arrive in the north? → No: XXXIX corps and its divisions (12. PzD, 18., 20. ID mot) are owned by **center**, who tracks their August transfer north and the Tikhvin offensive.
- **center**: Heeresgruppe Mitte (9., 4., 2. Armee, Panzergruppe 2 incl. the Kiev turn and Tula, Panzergruppe 3 incl. Kalinin/Klin, XXXIX Mot. Corps → Tikhvin), the units added for Typhoon that came from the south (e.g. XLVIII Mot. Corps) are owned by **south**; Soviet Western Front (3, 4, 10, 13 A, 6/11/13/14/17/20 MK, Brest fortress), 2nd strategic echelon (16, 19, 20, 21, 22 A, 5 & 7 MK), Central Front, Reserve Front (24, 28, 29–33, 43, 49 A), Bryansk Front (50, 3, 13 A), Kalinin Front, the Mozhaisk line and Moscow defence (5, 16, 43, 49, 50, 30, 1st Shock, 20 A, 10 A), Tula.
- **south**: Heeresgruppe Süd (6., 17., 11. Armee, Panzergruppe 1), Romanian 3rd & 4th Armies, Hungarian Carpathian Group / Mobile Corps, Italian CSIR, Slovak forces; Soviet Southwestern Front (5, 6, 12, 26 A; 4/8/9/15/16/19/22/24 MK), Southern Front (9, 18 A), 37, 38, 40, 21 A (after its transfer to SW Front Aug), Independent Coastal Army (Odessa, Sevastopol), 51 A (Crimea), 56 A, 12 A (re-formed), Black Sea Fleet units, Kharkov, Donbas, Rostov.
  21st Army and 13th/3rd armies that fought in the Gomel–Kiev area after mid-August: center owns them (they started in center's sector).

## 4. Phases (integrator will put these in campaign.json; use them to plan coverage)
1. `border` 6.22–7.9 边境交战（比亚韦斯托克—明斯克包围、杜布诺—布罗迪坦克战、波罗的海三国、德维纳河）
2. `smolensk` 7.10–8.24 斯摩棱斯克与乌曼（斯摩棱斯克包围、叶利尼亚、卢加防线、乌曼包围、敖德萨被围）
3. `kiev` 8.25–9.29 基辅与列宁格勒（基辅大包围、列宁格勒被封锁、塔林撤退、彼列科普）
4. `typhoon` 9.30–11.14 台风行动（维亚济马—布良斯克包围、莫扎伊斯克防线、亚速海、克里米亚、哈尔科夫、季赫温）
5. `moscow` 11.15–12.5 兵临莫斯科（第二次攻势、罗斯托夫反击、季赫温反击、反攻开始）

## 5. Front keyframes (owned by **fronts**; for everyone's reference)
Keyframe file `data/fronts/<at with ':'→'-'>.json`, control slots: `DE` = all non-Finnish Axis-held Soviet territory (polygons, holes = Soviet pockets/enclaves), `FI` = Finnish-held Soviet territory.
The A-slot area is clipped to the Soviet theatre, so polygons may extend far west over Axis home territory.

## 6. Quality bar
- Prefer fewer, well-researched objects over many vague ones; but cover the campaign's whole arc in your sector.
- Write your JSON with a Python/Node builder script in `pipeline/build/` (recommended: helper functions for tracks) so it is reproducible; output pretty-printed JSON (indent 1–2), UTF-8, `ensure_ascii=False`.
- Run the validator on your files before finishing; report what you built, open questions and known gaps in your final message.
