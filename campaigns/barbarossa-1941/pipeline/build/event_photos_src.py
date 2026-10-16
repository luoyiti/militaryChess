"""整合者：把媒体代理照片池（pipeline/scripts/assets/extra_photos.json）里的照片挂到各分区事件上 → pipeline/build/event_photos.json。
merge_events.py 合并时给尚无照片的事件补上。键为文件名前缀（须唯一匹配）。
    python3 campaigns/barbarossa-1941/pipeline/build/event_photos_src.py
"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
pool = json.load(open(os.path.join(HERE, '../scripts/assets/extra_photos.json')))
M = {
    'e.luftwaffe_first_strike': 'File:Kaunas airfield',
    'e.brest_fortress': 'File:Russische soldaten hebben zich overgegeven in de vesting Brest',
    'e.minsk_falls': 'File:На одной из улиц в Минске',
    'e.bialystok_minsk_end': 'File:Bundesarchiv Bild 146-1982-077-11',
    'e.lvov_falls': 'File:Lwów, ul.Kazimierzowska',
    'e.dubno_brody': 'File:German soldiers inspecting KV-2',
    'e.raseiniai': 'File:Kowno Panzerschlacht',
    'e.borisov_bridge': 'File:Przeprawa wojsk niemieckich przez Berezynę',
    'e.carpathian_group': 'File:Kilőtt T-26-os',
    'e.green_brama': 'File:Duits-Hongaarse opmars',
    'e.odessa_siege': 'File:Odessa Soviet artillery',
    'e.odessa_evacuation': 'File:Roemeense soldaten marcheren',
    'e.smolensk_falls': 'File:Wkroczenie wojsk niemieckich do Smoleńska',
    'e.timoshenko_counteroffensive': 'File:RIAN archive 2415',
    'e.smolensk_breakout': 'File:RIAN archive 76 On the battlefield',
    'e.luga_bridgeheads': 'File:Жительницы Ленинграда роют',
    'e.leningrad_assault': 'File:RIAN archive 604176',
    'e.shlisselburg_falls': 'File:RIAN archive 888 Nurses',
    'e.kronstadt_raid': 'File:Anti aircraft Leningrad 1941',
    'e.tikhvin_falls': 'File:RIAN archive 397 Cutters',
    'e.vyborg': 'File:Finnish forces cross Vuoksi',
    'e.petrozavodsk': 'File:Äänislinna capture',
    'e.petrikovka': 'File:CSIR a Gorlowka',
    'e.stalino': 'File:1941. Итальянские мотоциклисты',
    'e.kiev_falls': 'File:Wkroczenie wojsk niemieckich do Kijowa',
    'e.kiev_pocket_end': 'File:Prigionieri Armata Rossa',
    'e.kremenchug_breakout': 'File:Przeprawa wojsk niemieckich przez Dniepr',
    'e.perekop': 'File:Wojska niemieckie na przesmyku Perekop',
    'e.vyazma_pocket': 'File:Duitse tanks rukken op',
    'e.bryansk_pocket': 'File:Bundesarchiv Bild 101I-140-1210-26A',
    'e.kalinin_falls': 'File:Zajęcie przez wojska niemieckie miasta Kalinin',
    'e.kharkov_falls': 'File:Walki uliczne w Charkowie',
    'e.azov_pocket': 'File:Wkroczenie wojsk niemieckich do Taganrogu',
    'e.borodino_mozhaisk': 'File:RIAN archive 789 People digging',
    'e.second_offensive': 'File:Панфилов',
    'e.tula_holds': 'File:A Soviet machine gunner covers',
    'e.kalinin_volga': 'File:RIAN archive 284',
    'e.yakhroma': 'File:RIAN archive 2564',
    'e.krasnaya_polyana': 'File:Protivotankovy yozh',
    'e.riga_falls': 'File:Soviet damaged I-16',
    'e.rostov_liberated': 'File:Ростов на Дону',
    'e.evacuation_council': 'File:Беженцы на дороге',
}
out = {}
for eid, pre in M.items():
    hits = [k for k in pool if k.startswith(pre)]
    assert len(hits) == 1, (eid, pre, hits)
    out[eid] = {'commons': hits[0], 'caption': pool[hits[0]]['caption']}
json.dump(out, open(os.path.join(HERE, 'event_photos.json'), 'w'), ensure_ascii=False, indent=1)
print(len(out), '张照片 → pipeline/build/event_photos.json')
