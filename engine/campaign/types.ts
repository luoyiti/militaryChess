/**
 * 战役包清单（campaign.json, schemaVersion 2）。所有战役专属的常量都在这里，引擎代码不得写死任何战役的取值。
 * 字段缺省 = 引擎默认（与克里特/法国一系一致）。离线校验：engine/schema/manifest.ts。
 */
import type { LonLat, Side, ModelId, UnitType, Echelon } from '../core/types';
import type { CampaignPlugin } from '../plugins/api';

export type CampaignStatus = 'published' | 'draft' | 'planned';

export interface CounterColors { bg: string; edge: string; text: string; box: string; ink: string }

export interface SideDef {
  id: Side; // 'DE'
  prefix: string; // 部队 id 前缀 'de'
  name: string; // 中文名 '德国'
  nation?: string; // ISO 国别（展示用，可与 id 不同，如 NO 战役的 UK→GB）
  coalition: 'axis' | 'allies' | 'comintern' | 'neutral';
  counter: CounterColors; // 棋子配色
  /** 页面 CSS 色：主色/深色（色块、标签、路线全程线） */
  css: { main: string; dark: string };
  /** 推进箭头配色，缺省由 counter 推导 */
  arrow?: { fill: string; stroke: string };
  /** 3D 底座/丝带色，缺省 = counter.bg */
  sandbox?: string;
  defaultModel?: ModelId; // 3D 沙盘找不到模型时的兜底，缺省 inf_<id小写>
  restHeading?: number; // 3D 静止朝向（π 的倍数：0=向东，1=向西），缺省第一个阵营 0、其余 1
  commandMark?: string; // command 梯队棋子上的标记（如 RAF / LW）
  planesFrom?: 'W' | 'N' | 'E'; // 导演特效：该方飞机入场方向
  planeColor?: string; // 导演特效飞机剪影颜色（缺省 #2d3036）
}

export interface SlotDef {
  key: string; // fronts/*.json control 中的键
  label: string; // 图例文字
  /** 本土掩膜比特：占领场并入这些比特对应的格子（空战模式忽略） */
  homeBits?: number[];
  /** 2D 填充纹样：SVG <pattern> 内容（userSpaceOnUse，size×size），缺省按槽位：A=斜线蓝，B=交叉线褐 */
  pattern?: { size: number; svg: string };
  /** 图例色块 CSS background */
  legend?: string;
  /** 战线颜色（CSS） */
  line?: string;
  /** 3D 着色（0..1 RGB） */
  sandboxFill?: [number, number, number];
  sandboxLine?: [number, number, number];
  /** 2D 填充整体透明度（GB 空战 B 槽 0.65） */
  opacity?: number;
}

export interface PhaseDef { id: string; from: string; to?: string; name: string; short?: string; sub: string; center?: LonLat; zoom?: number }

export interface LayerDef { key: string; label: string; default?: boolean }

export interface MusicCue { from: string; track: string }
export interface IntensityCue { from: string; value: number }
/** 导演警报规则：所有给定条件同时满足时播放 sfx（maxImportance=1 表示只对最重要事件） */
export interface SirenRule { events?: string[]; idIncludes?: string; category?: string; maxImportance?: number; sfx: string; volume?: number }

export interface CampaignManifest {
  schemaVersion: 2;
  id: string;
  status: CampaignStatus;
  title: {
    mark: string; // 顶栏年份章 '1941'
    zh: string; // '克里特岛战役'
    sub: string; // 顶栏副题 '水星行动 · 战旗推演'
    en: string; // 'The Battle of Crete'
    orig?: string; // 'Unternehmen Merkur'
    codename?: string; // 行动代号（中文）
    html: string; // <title>
    description: string;
    favicon?: string; // 主色
  };
  time: { epoch: string; start: string; end: string; dataEnd?: string; tzLabel: string; hoursPerSec?: number };
  sides: SideDef[];
  /** 兵力/图例/序列树的阵营顺序（缺省 = sides 顺序） */
  sideOrder?: Side[];
  /** 允许跨阵营的上下级（如斯洛伐克部队隶属德军） */
  parentExceptions?: [Side, Side][];
  control: {
    mode: 'territory' | 'air';
    landBit: number;
    theatreBits: number[];
    deferred?: { bits: number[]; from: string }[];
    slots: SlotDef[]; // 运行时最多 2 个
    remainder?: { label: string; fill?: string };
  };
  phases: PhaseDef[];
  marks?: [string, string][]; // 时间轴关键日期
  theme: {
    accent: string; accentDark: string; accentTint: string; // 主题色（侧栏标签、态势数字）
    theatreBorder: string; theatreHalo: string; // 战区国界
    restFill: string; // 剩余战区（守方控制）底色
  };
  map: {
    /** 全图适配：整个画布；或经纬度框 [minLon,minLat,maxLon,maxLat]，corners = 投影左上/右下两角，envelope = 投影后边框包络（狭长战区） */
    fit?: 'frame' | { bbox: [number, number, number, number]; mode?: 'corners' | 'envelope' };
    home3d: LonLat;
    focus?: LonLat; // 测试钩子 setZoom 缺省中心 / 回全图中心
    contextTiles?: boolean; // 周边背景瓦片/地形（BK/CR）
    hexKm?: number; // 缺省 18
    hexOverSea?: boolean;
    theatreCountries: string[]; // vectors.topo countries1939 中加粗边界的国家 id
    /** 国家大字 [名称, 经, 纬, 字号, 最小相对缩放]；海域/山脉 [名称, 经, 纬, 字号, 是否山脉, 最小相对缩放?] */
    labels?: { countries?: [string, number, number, number, number][]; waters?: [string, number, number, number, boolean, number?][] };
    labelHubs?: Record<string, [number, number]>; // 地名 id → 标注偏移（带引线）
    portMarkers?: boolean; // 港口用锚形标记
    riverLabelCrop?: [number, number, number, number]; // 河名候选中点的世界坐标范围，缺省画布内 2%–98%
    regions?: { id: string; label: string; center: LonLat; zoom: number }[];
    returnZoom?: number; // 导演回全景缩放（缺省 1.15）
    insetTop?: number; // 顶栏占位（缺省 64）
    insetBottom?: number; // 时间轴占位（缺省 150）
    liveInsets?: boolean; // 侧栏/时间轴占位随界面实时测量（每次运镜重新适配）
    sidebarInset?: 'measure' | number; // 展开侧栏时的左侧占位：缺省按侧栏实际宽度 + 20，或固定像素
    routesFullStandalone?: boolean; // 「完整路线」可单独显示（不叠加当前推进箭头）
    initialView?: { center: LonLat; zoom: number }; // 启动后的初始镜头（缺省全图）
    unitZoom?: [number, number, number]; // 选中部队时的缩放：集团军/军/师级
    mapKey?: string; // 右下角图例条（HTML）
    transportStyle?: 'dashed' | 'markers'; // 海/空运路线：虚线（缺省）或带箭头标记的行动线
    mobileZoomCap?: number;
  };
  display?: {
    hqPassThrough?: boolean; // 有下属的指挥部不显示为棋子，直接展开下属（单个部队用 unit.display='container'）
    hideTransport?: { map2d?: boolean; sandbox?: boolean }; // 海/空运途中的地面部队不显示
    counterSideCode?: boolean; // 棋子左上角显示阵营代码
    statusEchelons?: 'all' | 'divisions' | 'leaves' | 'markers'; // 侧栏态势统计口径：全部 / 仅师旅 / 仅末级编制 / 全部可见标记
  };
  sandbox?: {
    exaggeration?: number; // 高程夸张（缺省 3）
    figScale?: number; // 手办放大（缺省 17）
    restTint?: [number, number, number]; // 剩余战区着色（缺省冷色）
    restStrength?: number;
    target?: LonLat; // 初始视点（缺省当前阶段中心 / map.home3d）
    fog?: [number, number];
    segments?: number; // 地形网格横向分段（缺省 560）
    airRoute?: { height?: number; width?: number }; // 空中路线丝带高度/宽度系数（缺省 170 / 0.2）
    typeModels?: Record<string, ModelId>; // 按兵种指定 3D 模型（如 naval → navy_token）
    softwareFallback?: boolean; // 检测到软件渲染时降级（像素比、阴影、地形分段）
    maxDistance?: number; // 镜头最远距离（缺省 9000）
    follow?: boolean; // 3D 镜头跟随选中部队
    distanceFog?: boolean; // 雾效随镜头距离调整
  };
  director: {
    camera?: 'point' | 'frame'; // frame：事件镜头框住关联航线（空战），驻留后稍拉远保留来路
    dwell?: [number, number]; // 驻留时长上下限（毫秒）
    /** 驻留后回全景：point=飞到 returnCenter（缺省 home3d）@ map.returnZoom；home=回全图；phase=当前阶段中心 */
    returnTo?: 'point' | 'home' | 'phase';
    returnCenter?: LonLat;
    wideGoesHome?: boolean; // 全线事件直接回全图
    sirens?: SirenRule[];
    defaultZoom?: [number, number]; // [重要度1, 其他]
  };
  audio: {
    mode?: 'cues' | 'bed'; // cues：按时间表切换配乐并调制战场氛围；bed：单曲循环底乐
    bedTrack?: string; // bed 模式的曲目（共享配乐库 id）
    sfxAlias?: Record<string, { to: string; gain?: number }>; // 音效替换（如 radio→paper）
    music: MusicCue[]; // 按时间切换的配乐（共享配乐库 id：polonaise / elegy / hejnal / operations）
    intensity: IntensityCue[]; // 战场氛围强度
    introSting?: string; // 进入作战室时的号角：hejnal（配乐库）/ none / 任一音效 id（缺省 fanfare）
    introStingVolume?: number;
    introMusic?: string;
    battleSfx?: string[]; // 交战闪光伴随音效（缺省 artillery/mg）
    volumePanel?: boolean; // 顶栏「音量」面板（背景音乐 / 音效滑块）
    musicVol?: number; // 缺省 0.5
  };
  ui: {
    layers?: Partial<Record<string, { label?: string; default?: boolean; hidden?: boolean }>>;
    layerOrder?: string[];
    extraLayers?: { key: string; label: string; default?: boolean }[]; // 叠加层等额外图层开关
    chapterNav?: 'sidebar' | 'timeline' | 'none';
    treeActiveOnly?: boolean; // 战斗序列只列当前在场部队
    /** 日精度事件的日期写法：note =「（当日，定位时间为示意）」（缺省）；dot =「 · 当日」；plain = 只写日期 */
    precisionStyle?: 'note' | 'dot' | 'plain';
    timeline?: { jump?: boolean; dateInput?: boolean; lanes?: number; dateSuffix?: string; majorEvery?: number };
    tourOpensFirstEvent?: boolean; // 自动推演开始时先展示第一个事件
    sandboxPhaseFocus?: boolean; // 进入 3D 时飞到当前阶段中心
    brief: {
      layout?: 'forces' | 'theatres'; // forces = 兵力对比表（缺省）；theatres = 各方折叠说明 + 读图说明 + 并行战区态势
      paragraphs?: string[]; // theatres 布局的「怎样读这张地图」段落（HTML，可用 {units} 等计数占位）
      title: string; sub: string; sub2: string; stamp?: string;
      fine: string;
      forceNotes?: boolean; // 显示各方兵力口径折叠说明（= notes: 'details'）
      notes?: 'details' | 'list' | 'none'; // 兵力口径说明：折叠 / 列表 / 不显示
      notesTitle?: string;
      menFormat?: 'auto' | 'fixed1';
      sideColumns?: 2 | 3;
      byPhase?: boolean; // 按当前阶段显示 forces.byPhase
      losses?: boolean; // 伤亡表（缺省显示）
      nullLabel?: string; // 未知数字（缺省 —）
      nullBarWidth?: number; // 未知数字的条形宽度（缺省 1.5%）
      showEmptyRows?: boolean; // 各方都未知的行也显示
    };
    status: {
      cells: { sides: Side[]; metric: 'act' | 'enc' | 'out'; label: string; cls?: string; hideZero?: boolean }[];
      pocketsLabel?: string;
      /** 并行战区态势：[战区名, [[截止时刻, 文字], …, [null, 最后文字]]] */
      theatres?: { title?: string; rows: [string, [string | null, string][]][] };
      latestEvent?: boolean; // 显示「最近事件」按钮
    };
    legend: {
      counters: [Side, UnitType, Echelon, string][];
      items: string[]; // HTML 片段（可信，作者编写）
      echelons?: string; // 梯队标记 HTML（缺省 集团军/军/师/旅）
      statuses?: string; // 状态图例 HTML（缺省 交战/被合围/覆灭）
      title?: string; echelonsTitle?: string; listTitle?: string; // 小节标题覆盖
      echelonsHtml?: string; // 整段替换梯队标记区
      showSides?: boolean; // 阵营色块列表（缺省显示）
      after?: string; // 列表后的说明 HTML
      keys?: string; // 快捷键 HTML
      counterLabels?: boolean; // counters 的说明写作「说明|棋子标签」
    };
    modelLabels?: Record<string, string>;
    categoryLabels?: Record<string, string>; // 事件类别印章文字覆盖（缺省 air=空袭）
    eventPlaceWide?: string; // 全线事件的地点文字
    pocketFate?: Record<string, string>; // 包围圈结局文字覆盖（缺省 突围/解围/陷落）
    cardYear?: 'strip' | 'keep';
    labels?: { echelons?: Partial<Record<Echelon, string>>; types?: Partial<Record<UnitType, string>> };
  };
  intro: {
    stamp: string; kicker: string; title: string; en: string; dates: string;
    paragraphs: string[]; how: string; note: string;
    photo?: string; photoFallback?: string; caption?: string; photoAlt?: string;
    operation?: { code: string; coords: string; label: string };
  };
  credits: {
    historyMaps?: { href: string; alt: string; caption: string }[]; // caption 为 HTML
    geodata: string[]; // <li> 内容（HTML）
    disclaimer?: string;
    extraHtml?: string; // 地理数据之后的附加段落（HTML）
    footerHtml?: string; // 素材许可之后、史料清单之前的附注（HTML）
    sections?: [string, string][]; // [标题, credits.json 键]，缺省 照片/音效/音乐/英语旁白/字体
  };
  hub: HubEntry;
  validation?: Record<string, unknown>;
}

/** 总台（作战地图桌）上的条目：火漆印位置、战区轮廓、档案夹内容 */
export interface HubEntry {
  order?: number;
  codename: string; // 档案夹上的行动代号（中文；没有代号的战役写通行名称）
  codenameOrig?: string; // 档案夹上的原文代号（如 FALL WEISS、WATCHTOWER）
  stencil?: string; // 地图上火漆印旁的模板字（拉丁字母大写），缺省为 title.en 去掉冠词后大写
  region?: string; // 总台分区（hub/world.json 的 theatres[].id），缺省按火漆印落在哪个分区的取景框内
  pin: LonLat; // 火漆印位置
  labelAt?: 'n' | 's' | 'e' | 'w'; // 模板字相对火漆印的方位（缺省 s）
  /** 战区轮廓：总台底图中的国家/分区 id（public/hub/world1938.topo.json），或经纬度框；缺省取 frame.bbox */
  theatre?: { countries?: string[]; bbox?: [number, number, number, number]; kind?: 'land' | 'air' };
  cover?: string; // 封面照片（相对战役资源目录，须在 photos/index.json 中以便署名）
  blurb: string;
  parent?: string; // 嵌套于另一战役（如克里特之于巴尔干）
}

export interface FrameConfig {
  projection: { type?: 'conicConformal'; parallels: [number, number]; rotate: [number, number]; center: [number, number] };
  bbox: [number, number, number, number];
  width: number; height: number; scale: number; translate: [number, number]; kmPerUnit: number;
  tiles: { size: number; levels: number[] };
  field: { cell: number; w: number; h: number; clampKm: number };
  focus?: [number, number, number, number];
}

export interface LodConfig {
  levels: { name: string; echelons: string[]; minK: number; maxK: number; fallbackUp?: boolean }[];
  hysteresis: number;
  counterPx?: Record<string, number>;
  stackMax?: number;
}

/** defineCampaign() 的输入：campaign.ts 用 import.meta.glob 收集 data/** */
export interface CampaignInput {
  manifest: CampaignManifest;
  frame: FrameConfig;
  lod: LodConfig;
  data: Record<string, unknown>;
  plugins?: CampaignPlugin[];
}
export type CampaignDef = Required<Omit<CampaignInput, 'plugins'>> & { plugins: CampaignPlugin[] };
