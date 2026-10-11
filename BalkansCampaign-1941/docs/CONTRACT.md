# 巴尔干战役共享契约

仅允许修改 BalkansCampaign-1941 内文件；两参考目录只读。schema 是唯一类型真值，由主智能体维护。

- 时间：1940-10-28T00:00—1941-06-01T23:59，YYYY-MM-DDTHH:mm；固定 UTC+2 绘图时间。日级事件 precision=day（落轴用12:00），已知时刻 precision=minute。
- 地图 bbox=[12.5,34.5,29.5,48.0]，国家国界采用1940年开战时状态。坐标优先用 @place_id，标识全局唯一。
- Side=DE,IT,HU,BG,GR,YU,GB,AU,NZ；单位id前缀为小写国家+点。国家父子编制同国；联合司令部可用平行树/简报组织。
- ModelId保留原19种，并增加inf_it/inf_gr/inf_yu/inf_gb/inf_hu/inf_bg/inf_au/inf_nz/para_de。UnitType增加airborne、air。原建模器复用。
- TrackPoint.movement 与 Route.movement 可选 land|sea|air；轨迹点表示到下一点的移动方式；非地面转移时不显示地面模型。Route.until 可控制主图路线结束时刻。
- ControlKeyframe.DE=轴心控制多边形，SU=[]。全部多边形为[外环,洞]。阿尔巴尼亚在初始DE中，不能设固定Axis home mask。希军推进使DE缩小。所有数据附sources和confidence。
- 地理掩膜：bit0=GR+AL战区，bit5=YU（4/6启用），bit4=LAND，其余陆地bit6；bit1/2/3全空。沿用Topo对象名countries1939，仅为兼容引擎。deferred YU按时间启用；3D同步。
- 阶段id：invasion(10/28),counterattack(11/14),winter(1/11),invasion1941(4/6),evacuation(4/18),crete(5/20)。最后一章截至6/1。
- Mainland agent：scripts/campaign/build_mainland.py, src/data/oob/mainland.json, routes/mainland.json, gazetteer/mainland.json, sources/mainland.json，fronts中早于5/20的帧，fragments/mainland.json(含events,pockets,equipment,forces字段)。控制区要带来4/30全部大陆战区Axis，但Crete在5/20前不能被占。
- Crete agent：scripts/campaign/build_crete.py, oob/crete.json,routes/crete.json,gazetteer/crete.json,sources/crete.json，fronts中5/20及之后的帧，fragments/crete.json；public/photos/balkans、public/history；.work/crete-assets.json资产清单。避免和mainland重复地名id，岛内地名用cr_前缀。保留大陆最终控制区（读取mainland最后帧或由汇总器合入）。5/20 07:59必须有无岛上Axis控制帧。
- 地理agent：scripts/geo/**、scripts/frame/**、config/frame.json、public/geo/**、public/terrain/**、public/tiles/**；可创建自己的.venv。
- 主智能体：共享schema、app/map/ui/3D/audio/CSS、汇总events/pockets/equipment/forces/keyframes、校验器、测试、文档、最终字体。

部队、地名、路线必须位于图幅；至埃及海路在南缘出图，标明图外目的地。历史国界/控制区/战线分开。原资产保留，但巴尔干事件不得使用波兰法国照片冒充。

## 连续地图背景

核心frame及战役SDF/数据位置不变。独立context世界范围[-8192,-4019,16384,12057]，瓦片origin[-8192,-4019]，pixel→world=origin+pixel/scale。2D缩放和平移必须将整个视口限制在有真实地图数据的背景范围内；核心高精度底图叠加在同一投影上。周边物理矢量用于海岸/河流/湖泊，历史边界仍以核心1940层为真值。
