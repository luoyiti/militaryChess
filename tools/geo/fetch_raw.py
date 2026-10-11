"""下载地理管线的原始矢量到 .cache/geo/raw/（已存在则跳过；全部战役共用）。
    python tools/geo/fetch_raw.py
Natural Earth 1:10m（公有领域）+ historical-basemaps world_1938（A. Ourednik 等，GPL-3.0）。
"""
import io
import os
import sys
import zipfile
import requests

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
RAW = os.path.join(ROOT, '.cache', 'geo', 'raw')
NE = 'https://naciscdn.org/naturalearth/10m'
SOURCES = {
    'ne_10m_land.geojson': f'{NE}/physical/ne_10m_land.zip',
    'ne_10m_coastline.geojson': f'{NE}/physical/ne_10m_coastline.zip',
    'ne_10m_lakes.geojson': f'{NE}/physical/ne_10m_lakes.zip',
    'ne_10m_lakes_europe.geojson': f'{NE}/physical/ne_10m_lakes_europe.zip',
    'ne_10m_rivers_lake_centerlines.geojson': f'{NE}/physical/ne_10m_rivers_lake_centerlines.zip',
    'ne_10m_rivers_europe.geojson': f'{NE}/physical/ne_10m_rivers_europe.zip',
    'ne_10m_admin_0_countries.geojson': f'{NE}/cultural/ne_10m_admin_0_countries.zip',
    'ne_10m_populated_places_simple.geojson': f'{NE}/cultural/ne_10m_populated_places_simple.zip',
    'world_1938.geojson': 'https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_1938.geojson',
}


def shp_zip_to_geojson(data: bytes, dst: str):
    """Natural Earth 发布的是 shapefile 压缩包：用 mapshaper（仓库 devDependency）转成 GeoJSON。"""
    import subprocess, tempfile
    with tempfile.TemporaryDirectory() as tmp:
        zipfile.ZipFile(io.BytesIO(data)).extractall(tmp)
        shp = next(os.path.join(tmp, f) for f in os.listdir(tmp) if f.endswith('.shp'))
        ms = os.path.join(ROOT, 'node_modules', '.bin', 'mapshaper')
        subprocess.run([ms, '-i', shp, 'encoding=utf8', '-o', dst, 'format=geojson'], check=True)


def main():
    os.makedirs(RAW, exist_ok=True)
    for name, url in SOURCES.items():
        dst = os.path.join(RAW, name)
        if os.path.exists(dst) and os.path.getsize(dst) > 10_000:
            print(f'[skip] {name}')
            continue
        print(f'[get ] {name} <- {url}')
        r = requests.get(url, timeout=300, headers={'User-Agent': 'war-room-campaigns (educational)'})
        r.raise_for_status()
        if url.endswith('.zip'):
            shp_zip_to_geojson(r.content, dst)
        else:
            open(dst, 'wb').write(r.content)
    print('完成：', RAW)


if __name__ == '__main__':
    sys.exit(main())
