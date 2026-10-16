#!/usr/bin/env python3
"""下载战役照片（Wikimedia Commons，核实许可）→ public/campaigns/river-plate-1939/photos/<slug>.webp + index.json。
照片清单与中文说明在 PHOTOS；事件引用写在 pipeline/build/events.py 的 PHOTO 映射里。可重复执行，已下载的跳过。
用法：python3 campaigns/river-plate-1939/pipeline/scripts/fetch_photos.py"""
from __future__ import annotations
import io, json, re, sys
from pathlib import Path
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parent))
import commons  # noqa: E402

CAMP = Path(__file__).resolve().parents[2]
OUT = CAMP.parents[1] / 'public/campaigns' / CAMP.name / 'photos'
OK = re.compile(r'^(public domain|pd|cc0|cc by(-sa)? [1-4]\.0|cc-by(-sa)?-[1-4]\.0)', re.I)

PHOTOS = {  # 文件名: (slug, 角色, 说明)
 'File:The German pocket battleship ADMIRAL GRAF SPEE in flames after being scuttled off Montevideo, Uruguay, after the Battle of the River Plate, 17 December 1939. A6.jpg':
   ('graf-spee-scuttled-a6', 'intro', '1939 年 12 月 17 日，施佩伯爵号在蒙得维的亚港外自沉后燃烧（英国帝国战争博物馆 A 6）'),
 'File:The "Graf Spee," scuttled off Montevideo - NARA - 197095.jpg':
   ('graf-spee-scuttled-nara', 'side', '自沉后坐沉浅水的施佩伯爵号，上层建筑仍露出水面（美国国家档案馆）'),
 'File:Panzerschiff Admiral Graf Spee in 1936.jpg':
   ('graf-spee-1936', 'side', '1936 年的施佩伯爵海军上将号装甲舰'),
 "File:Exeter'sDamage1939.jpg":
   ('exeter-damage', 'side', '海战后埃克塞特号的战损'),
 'File:Hans Langsdorff.jpg':
   ('langsdorff', 'side', '1939 年 12 月 15 日蒙得维的亚，朗斯多夫（白色制服）为阵亡水兵送葬，行的是海军礼'),
 'File:Rear Admiral Henry Harwood on HMNZS Achilles.jpg':
   ('harwood-achilles', 'side', '哈伍德在阿喀琉斯号上，身后的舰徽牌上已刻有「Graf Spee 1939」'),
 'File:HMS Cumberland (57).jpg':
   ('cumberland', 'side', '肯特级重巡洋舰坎伯兰号'),
 'File:Altmark in Jøssingfjord.jpg':
   ('altmark-1940', 'side', '1940 年 2 月英国空中侦察拍摄的挪威约辛峡湾，阿尔特马克号就藏在峡湾里'),
}

def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    idx_path = OUT / 'index.json'
    index = json.loads(idx_path.read_text('utf-8')) if idx_path.exists() else {}
    info = commons.query_files(list(PHOTOS), thumb_width=1000)
    for title, (slug, role, caption) in PHOTOS.items():
        i = info.get(title, {})
        if not i.get('exists'):
            print('✗ 不存在', title); continue
        lic = i.get('license', '')
        if not OK.match(lic):
            print('✗ 许可不符', lic, title); continue
        dst = OUT / f'{slug}.webp'
        if not dst.exists():
            r = commons.get(i['thumburl'])
            im = Image.open(io.BytesIO(r.content)).convert('RGB')
            if im.width > 900: im = im.resize((900, round(im.height * 900 / im.width)), Image.LANCZOS)
            im.save(dst, 'WEBP', quality=78)
        im = Image.open(dst)
        index[title] = {
            'src': f'photos/{slug}.webp', 'title': title[5:], 'author': i.get('artist') or '佚名',
            'license': lic, 'licenseUrl': commons.license_url_fallback(lic, i.get('licenseUrl', '')),
            'sourceUrl': i.get('descriptionurl', ''), 'caption': caption, 'role': role, 'w': im.width, 'h': im.height,
        }
        print('✓', slug, lic)
    idx_path.write_text(json.dumps(index, ensure_ascii=False, indent=1) + '\n', 'utf-8')

if __name__ == '__main__':
    main()
