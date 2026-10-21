#!/usr/bin/env python3
"""从维基共享资源抓取武汉会战照片（直链 thumb 模式）→ photos/*.webp + index.json。

upload.wikimedia.org 的 thumb 直链可用；API 域名在当前网络被限流，故改用已知 thumb URL 模板。
用法：.venv/bin/python campaigns/wuhan-1938/pipeline/fetch_photos.py
"""
import io
import json
import os
import subprocess
import sys
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
PHOTOS = os.path.join(ROOT, 'public', 'campaigns', 'wuhan-1938', 'photos')
INDEX = os.path.join(PHOTOS, 'index.json')
EVIDENCE = os.path.join(HERE, 'photo-evidence.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
PD = 'Public domain'
PD_URL = 'https://creativecommons.org/publicdomain/mark/1.0/'

# (本地名, Commons File 名, thumb 的 URL 路径片段, 中文图注)
# thumb URL = https://upload.wikimedia.org/wikipedia/commons/thumb/<h1>/<h2>/<filename>/<width>px-<filename>
WANTED = [
    ('machine-gun', 'File:Wuhan 1938.jpg', '8/88/Wuhan_1938.jpg',
     '武汉会战中操作三十节式重机枪的中国军队；Commons编目，具体拍摄日与地点未详。'),
    ('wanjialing-charge', 'File:NRAWanjialing1.jpg', '0/00/NRAWanjialing1.jpg',
     '万家岭战役中的国民革命军；Commons编目。'),
    ('german-divs', 'File:Wuhan german divs.jpg', 'e/e9/Wuhan_german_divs.jpg',
     '开赴武汉方向的德械师部队；Commons编目。'),
    ('snlf-june11', 'File:Japanese Special Naval Landing Forces on the deck board of the IJN xxx, June 11th.jpg',
     '7/7b/Japanese_Special_Naval_Landing_Forces_on_the_deck_board_of_the_IJN_xxx%2C_June_11th.jpg',
     '1938年6月11日在军舰甲板上的日本海军特别陆战队，向安庆方向输送；Commons编目。'),
    ('hankou-fallen', 'File:Hankou city has fallen No.1 1938.jpg', '3/31/Hankou_city_has_fallen_No.1_1938.jpg',
     '1938年10月沦陷后的汉口；Commons编目（日方写真）。'),
    ('japan-capture', 'File:Japan Capture of Wuhan.jpg', 'e/e6/Japan_Capture_of_Wuhan.jpg',
     '庆祝攻占武汉的日军；Commons编目（日方写真）。'),
    ('xinyang-troops', 'File:Chinese Troops in Xinyang.jpg', '2/2e/Chinese_Troops_in_Xinyang.jpg',
     '武汉会战期间防守信阳地区的国民革命军第十七军团；Commons编目。'),
    ('defenders-river', 'File:Defenders Around River.jpg', 'd/dc/Defenders_Around_River.jpg',
     '武汉战役中防守长江地区的中国军队；Commons编目，具体地点未详。'),
    ('yellow-flood', 'File:1938 Yellow River flood.jpg', '5/57/1938_Yellow_River_flood.jpg',
     '1938年6月黄河决堤后涉水行进的中国军队；Commons编目。'),
    ('tankettes-naxi', 'File:Japanese tankettes with pioneer troops marching towards Wu-han, near Na-hsi.jpg',
     'e/eb/Japanese_tankettes_with_pioneer_troops_marching_towards_Wu-han%2C_near_Na-hsi.jpg',
     '向武汉推进的日军装甲车队（近南昌方向）；Commons编目（日方写真）。'),
]


def fetch(url: str) -> bytes:
    r = subprocess.run(['curl', '-sS', '-A', UA, '--max-time', '60', '-o', '-', url],
                       capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.decode()[:200])
    return r.stdout


def main():
    os.makedirs(PHOTOS, exist_ok=True)
    from PIL import Image
    index, evidence = {}, {'accepted': [], 'excluded': []}
    for slug, title, path, caption in WANTED:
        fname = path.split('/')[-1]
        for width in (1280, 800, 640):
            url = f'https://upload.wikimedia.org/wikipedia/commons/thumb/{path}/{width}px-{fname}'
            try:
                raw = fetch(url)
                img = Image.open(io.BytesIO(raw)).convert('RGB')
                break
            except Exception:
                img = None
        if img is None:
            evidence['excluded'].append({'commons': title, 'reason': 'thumb 各档宽度均下载失败'})
            print('FAIL', title); continue
        w, h = img.size
        if max(w, h) > 1600:
            s = 1600 / max(w, h)
            img = img.resize((round(w * s), round(h * s)), Image.LANCZOS)
            w, h = img.size
        img.save(os.path.join(PHOTOS, slug + '.webp'), 'WEBP', quality=82)
        src_url = 'https://commons.wikimedia.org/wiki/' + urllib.parse.quote(title.replace(' ', '_'))
        index[title] = {
            'src': f'photos/{slug}.webp', 'w': w, 'h': h,
            'title': caption.split('；')[0].split('。')[0],
            'author': '作者不详（Commons编目）', 'license': PD, 'licenseUrl': PD_URL,
            'sourceUrl': src_url, 'caption': caption,
        }
        evidence['accepted'].append({'commons': title, 'sourceUrl': src_url, 'permissionTemplate': PD,
                                     'limits': 'Commons编目；拍摄日与具体地点多未详，不指认某日战斗现场。'})
        print('OK  ', slug, f'{w}x{h}')
    evidence['excluded'] += [
        {'commons': 'File:Battle of Wanjialing 1938.png', 'reason': '战局示意图 PNG，仅作 fronts 绘图参照，不贴入照片。'},
        {'commons': "File:The Japanese 11th Army's assault on Wuhan, 1938.png", 'reason': '战局示意图 PNG，仅作 fronts 参照。'},
        {'commons': 'File:429武漢空戰.png', 'reason': '空战示意图 PNG，仅作参照。'},
        {'commons': 'File:Rippei Ogisu.jpg', 'reason': '人物肖像，非战役现场照片，本卷不采用。'},
        {'commons': 'File:Japanese_soldiers_tie_a_young_man.jpg', 'reason': '战争罪行照片，本卷不用于事件配图，保留于研究记录。'},
    ]
    json.dump(index, open(INDEX, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump(evidence, open(EVIDENCE, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'\nindex.json: {len(index)} 张；excluded: {len(evidence["excluded"])} 张')


if __name__ == '__main__':
    sys.exit(main())
