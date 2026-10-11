"""Four public-domain UK government photographs, checked on their Commons file pages.
Optional enhancement: the application still works when these downloads fail.
"""
import json, hashlib, time, io
from pathlib import Path
import requests
from PIL import Image
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/photos'
PHOTOS = [
 ('File:Troops pick through the ruins of Namsos in Norway after a German air raid, April 1940. N97.jpg', 'namsos-ruins', '1940年4月，英军穿过纳姆索斯空袭后的废墟（IWM N97；具体拍摄日不明）', 'Geoffrey Keating / IWM N97'),
 ('File:British troops arriving on the quayside at Namsos in Norway prior to evacuation, 2 May 1940. N108.jpg', 'namsos-evacuation', '1940年5月2日，纳姆索斯码头上的撤运准备；撤离在5月3日完成（IWM N108）', 'Geoffrey Keating / IWM N108'),
 ('File:The Second British Naval Action Off Narvik. 13 April 1940, Aerial Photographs From a Fleet Air Arm Aircraft. A33.jpg', 'narvik-naval', '1940年4月13日，第二次纳尔维克海战中的英国舰艇（IWM A33）', 'British official photograph / IWM A33'),
 ('File:HMS Warspite, Norway 1940.jpg', 'warspite', '1940年4月13日，英国厌战号在纳尔维克海战中炮击（IWM A38）', 'British official photograph / IWM A38'),
]
session = requests.Session()
session.headers['User-Agent'] = 'NorwayCampaignEducationalMap/1.0 (Wikimedia public-domain asset attribution)'
index = json.loads((OUT/'index.json').read_text())
credits = json.loads((ROOT/'public/credits.json').read_text())
for title, slug, caption, author in PHOTOS:
    source = 'https://commons.wikimedia.org/wiki/' + requests.utils.quote(title.replace(' ','_'), safe=':,_')
    try:
        url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + requests.utils.quote(title[5:].replace(' ','_'), safe=',_')
        r = session.get(url, timeout=35)
        r.raise_for_status()
        im = Image.open(io.BytesIO(r.content)).convert('RGB')
        im.thumbnail((1280,1000))
        im.save(OUT/(slug+'.webp'), 'WEBP', quality=86)
        index[title] = {'src':'photos/'+slug+'.webp','w':im.width,'h':im.height,'caption':caption,'author':author,'license':'Public domain · PD-UKGov','licenseUrl':'https://commons.wikimedia.org/wiki/Template:PD-UKGov','sourceUrl':source}
        print('Saved',slug,im.size,flush=True)
    except Exception as ex:
        print('Optional photo unavailable:',slug,type(ex).__name__,str(ex)[:100],flush=True)
(OUT/'index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
credits['photos']=[{'file':v['src'],'title':v['caption'],'author':v['author'],'license':v['license'],'licenseUrl':v['licenseUrl'],'sourceUrl':v['sourceUrl']} for v in index.values()]
(ROOT/'public/credits.json').write_text(json.dumps(credits,ensure_ascii=False,indent=2)+'\n')
mapping={'e.namsos_bomb':PHOTOS[0][0],'e.namsos_evacuate':PHOTOS[1][0],'e.second_narvik':PHOTOS[3][0],'e.first_narvik':PHOTOS[2][0]}
# The A33 photo depicts April 13, never the earlier April 10 engagement.
mapping.pop('e.first_narvik')
events=json.loads((ROOT/'src/data/events.json').read_text())
for e in events:
    title=mapping.get(e['id'])
    if title in index: e['photo']={'commons':title,'caption':index[title]['caption']}
(ROOT/'src/data/events.json').write_text(json.dumps(events,ensure_ascii=False,indent=2)+'\n')
