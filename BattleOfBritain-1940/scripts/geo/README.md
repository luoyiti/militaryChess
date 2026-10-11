# Britain1940 offline geography

The geography stage keeps the Poland engine's projection, tile and terrain APIs
while covering the Battle of Britain theatre. Every generated runtime asset is
inside public/geo, public/tiles or public/terrain; no remote basemap is required.

Run from the project root with local Node/Python dependencies available:

    bash scripts/geo/run_all.sh
    bash scripts/geo/run_all.sh --skip-dem

PYTHON_BIN and NODE_BIN may select installed runtimes. The defaults are portable
python3 and node. Required Python modules: numpy, scipy, shapely2, pillow, requests.
No rasterio or pyproj is needed. The custom conic projection is checked against
D3 directly, including canvas-edge samples and actual theatre points.

## Coordinates and compatibility

config/frame.json is emitted from scripts/frame/emit_frame.mjs. Its bbox is
[-8.5,44,11,60.5], width8192, height10585. World units are pixels at the highest
LOD. D3 conicConformal parallels[50,58], rotate[-1.25,0], center[0,54.25].
The projection still fits the original [-8.5,48,11,60.5] anchor and retains the
same scale and translation. Extending the imagery changes only the canvas height,
so existing airport, route and field world coordinates do not move. The fixed
width may clip the expanded bbox's longitude corners. The actual rectangle is
[0,0,8192,10585]; source geography and Terrarium sampling cover all of its inverse
edges, including the southern corners at43.593N. Projected runtime vectors are
clipped to this same rectangle.

vectors.topo.json uses projected world coordinates and the six legacy names:
land, countries1939, rivers, lakes, marsh, forest. countries1939 means fixed,
dated national context for this scenario. It is never an occupation/front map.
public/geo/countries1940.geojson and britain1940.geojson are WGS84. Country
label positions in country_labels.json are WGS84 and remain editable overlays.

field_masks.bin is Uint8, row-major512x662. Cell centers are ((i+.5)*16,(j+.5)*16).
Only bit4 means land. No country/occupation/allegiance bits are set. Dynamic
airspace/air-intensity fields independently permit sea and opposing-side overlap.

Terrain preserves the existing rg16 contract: elev_m=(R*256+G)*.25-100. The
1024x1324 image contains mean real DEM elevation per8x8-world-pixel cell; water
is clamped below zero. Albedo is4096x5293; tile LOD widths1024/2048/4096/8192.
Borders, labels and river lines are not baked into the raster base.

## Source and method ledger

| Layer | Source | Evidence and caveat |
|---|---|---|
| Land/coasts/national boundaries | Natural Earth1:10m | Fixed1940 national context; generalized country outlines, not control/annexation claims. Austria grouped withGermany. British CrownDependencies grouped for theatre context and their differing legal status documented. |
| Netherlands coast | NE Flevoland admin1 and Rijkswaterstaat chronology | Removes Noordoostpolder1942 and Flevoland1957/1968 from1940 land. Urk/Schokland tiny islands are schematic. Other coasts are generalized modern geographic context. |
| Rivers/lakes | Natural Earth1:10m | Named, sourced geometry; modern reservoirs excluded. IJsselmeer expanded across post1940 polders. |
| Elevation/hillshade | Real Mapzen Terrarium z9 source tiles | Modern bare-earth terrain, cubic-resampled to the conic frame. Hillshade is a visualization of real relief; it is not a1940 surface survey. |
| Forest/wetland | Named historic envelope plus DEM-flat lowlands | Explicit approx=true; subdued cartographic orientation, not surveyed1940 land cover. |

Attribution and source links are in public/geo/credits.json. DEM source coverage,
zoom, bounds and resampling are embedded in public/terrain/terrain.json.

The map's claim is spatial context for a curated1940 air campaign. It locates
Britain, the Channel and occupied European countries without implying that
fixed country polygons are air control. The human and historical consequences
belong in the sourced event narrative; the map is a quiet geographic stage.

## Validation

run_all.sh checks D3/Python parity, 29 country test points, required theatre
rivers, TopoJSON compatibility, all454 tile files and their exact edge sizes,
terrain decoding, real mountain/lowland DEM samples in Britain andFrance, and
sea/polder masks. French samples below the old y=8055 cutoff detect the original
blank-strip regression; decoded vector bounds must remain inside the raster.
preview.py stitches the actual highest-LOD runtime tiles and overlays decoded
runtime TopoJSON to create overview/Channel/France/northernBritain/Netherlands/
Norway crops for visual inspection. The France crop crosses the former southern
cutoff at fixed world coordinates. Evidence is in
.work/a/verification.json and .work/a/preview_*.png.
