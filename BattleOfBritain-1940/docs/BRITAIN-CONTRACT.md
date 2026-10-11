# Battle of Britain 1940 implementation contract

All writes stay inside BattleOfBritain-1940. InvasionOfPoland-1939 is read-only. Root owns schema, app, model/core, map2d, UI, styles, worker and validation. No reviewer agents or unrelated refactors.

## Frozen data interfaces

- Positions: WGS84 [longitude,latitude] or @place_id. Time: YYYY-MM-DDTHH:mm, British local time (BST), hours relative to 1940-07-10T00:00. Range ends 1940-10-31T23:59. Source-unknown times are illustrative; events use timePrecision: day. Preserve original source/confidence conventions.
- Sides: GB/DE active. Existing DE/SK/PL/SU enums retained. IDs gb.*, de.*.
- Echelons added: command (-1), air_group/air_fleet (0), sector/wing (1), squadron/gruppe (2). Existing army echelons remain. Unit types added fighter/bomber. Models: spitfire,hurricane,bf109,bf110,he111,do17,ju87,ju88.
- Unit: existing structure; optional base: Pos; TrackPoint adds flightPhase: at_base|outbound|engaged|returning, altitudeM?: number. Repeat sorties must include stationary base points between flights, not multi-day interpolated flight. HQ has explicit stationary track. Strength.aircraft means represented formation, not total historical side strength.
- Route: existing id/side/unit/style/widthKm/waypoints/sources/confidence. Add role?: raid|escort|intercept|return, fadeHours?: number (default .25 for air routes), illustrative?: boolean. Separate departure/return paths may share unit. Never a 48h land-march.
- AirKeyframe in src/data/airframes/*.json: {at, raids: PolygonDef[], interceptions: PolygonDef[], note?, sources, confidence}. PolygonDef=[outer-ring,holes...]. Both sides overlap; sea is permitted. config/keyframes.json lists their timestamps. Do not emit DE/SU occupation fronts.
- Airspace in src/data/airspace.json: {groups:[{id,label,polygons:PolygonDef[]}],radar:[{id,label,pos:Pos,rangeKm:number}]}. Groups are fixed administrative sectors and range rings are schematic, not guarantees of detection.
- HistEvent adds timePrecision?: day|minute, airAction?: raid|intercept|mixed. Existing fields retained. Exactly 15 plan events; Chinese body 80-140 characters. Associate representative formations and validated Commons photo files. Unknown times never labelled historically exact.
- ForcesSummary: {sides:{GB:SideSummary,DE:SideSummary},sources:[...]}. SideSummary existing name/commander/men/divisions/tanks/aircraft/guns/losses/note; add fighters?,bombers?,asOf?. Unused land values may be zero internally and never shown. Clearly state date/category of historical aircraft totals; represented unit counters are a separate statistic.
- Equipment keeps existing schema and names of eight model ids; add countCampaign? (do not use count1939 for Britain), sides GB/DE. Source ids in own sources fragment.
- Gazetteer Place.kind adds airfield/radar. country1939 legacy optional; country?: GB|FR|BE|NL|DE|DK|NO|IE. sources? optional. Use thematic place rank to avoid crowding.
- New SFX ids fighter/air_siren; root implements synthesis. Media agent preserves original sprite/music and registers applicable assets; original Polish music files remain but are not Britain defaults.

## Ownership

1. Geography agent: scripts/geo/**, scripts/frame/emit_frame.mjs, config/frame.json; public/geo/**, public/tiles/**, public/terrain/**. Natural Earth raw cache already copied. New bbox [-8.5,48,11,60.5]. Conic conformal; width8192; tiled four LOD levels; same projection parity and terrain encoding. country TopoJSON object remains countries1939 for runtime compatibility but represents 1940 political geography; GB outline replaces PL highlight. masks retain bit4=land; air fields never clip to country/land. Public airports/radar come from data agent. No source/schema edits.
2. History/media agent: src/data/{gazetteer,oob,routes,airframes,sources}/** EXCEPT sources/equipment.json; src/data/{events,forces_summary,airspace}.json; config/keyframes.json; scripts/assets/**; public/photos/**, public/audio/**, public/maps/**, public/credits.json; LICENSES.md. Do not edit equipment.json, fonts or schema. Exactly15 milestones, 5 phases, RAF4 Groups/DE3 Luftflotten with representative event formations and closed flight loops. Every key air-battle event has sortie + RAF interception; no invented exact raid counts. Ensure schema parsing locally when root says ready. Historic-English audio external links only until redistribution is clearly supported.
3. Aircraft agent: src/three/models/**; src/data/equipment.json; src/data/sources/equipment.json; tests/unit/models.test.ts and aircraft.test.ts. Root owns Sandbox/Viewers. All eight aircraft registered alongside original19. Same buildModel/buildInstanceGeometry interface and +X-forward/+Y-up, base origin, size/triangle budgets. Change ModelKind to include aircraft; no editing root schema.

## Shared assumptions

Full campaign curated historical playback; no player-authored alternate history. Chinese UI with original names. Default focus English Channel/S England; full theatre includes Scandinavian raids. Geography and models parallel with curated data; root integrates all APIs and performs actual rendered browser QA. Existing 559-file source manifest is in .work/poland-baseline.json. Dependencies are independent physical copies of the original locked installation, no source symlinks.
