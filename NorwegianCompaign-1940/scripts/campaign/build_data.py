"""Source-backed scenario data for the copied Poland engine. No precise march or ship tracks are claimed."""
import json, math
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'src/data'
def save(path, value):
    p = ROOT / path; p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
def t(day, hour='12:00'): return '1940-' + day + 'T' + hour
HYPER = 'https://www.ibiblio.org/hyperwar/UN/UK/UK-NWE-Norway/'
sources = [
    {'id':'no_army','title':'挪威武装部队 · 1940年本土战役','author':'Forsvaret','url':'https://www.forsvaret.no/om-forsvaret/organisasjon/haeren/haeren-400-ar/historien/felthistorien/felthistorien-19401945-felttoget-hjemme'},
    {'id':'oscarsborg_archive','title':'奥斯卡堡 4月9日警卫日志','author':'Nasjonalarkivet','url':'https://www.nasjonalarkivet.no/innbyggere-nearingsliv/norges-dokumentarv/vaktjournalen-fra-oscarsborg-9-april-1940/'},
    {'id':'government_archive','title':'二战挪威政府会议记录','author':'Nasjonalarkivet','url':'https://www.nasjonalarkivet.no/regjeringsprotokoller-fra-andre-verdenskrig/'},
    {'id':'raf_timeline','title':'皇家空军博物馆 · 1940航空年表','author':'RAF Museum','url':'https://www.rafmuseum.org.uk/research/research-enquiries/history-of-aviation-timeline/british-military-aviation/1940-2/'},
    {'id':'gratangen','title':'格拉唐根战斗纪念地','author':'Gratangen kommune','url':'https://www.gratangen.kommune.no/tjenesteomrader/oppvekst-og-kultur/kultur/kulturminner/kulturminneskilt-minnelunden-i-gratangsbotn-og-krigsminnebautaer'},
    {'id':'narvik_museum','title':'纳尔维克战争博物馆 · 62天战役','url':'https://www.kampenomnarvik.no/en/the-battle-of-narvik/'},
    {'id':'natural_earth','title':'Natural Earth 1:10m 地理数据','license':'Public domain','url':'https://www.naturalearthdata.com/about/terms-of-use/'},
    {'id':'terrain_tiles','title':'Mapzen / AWS Terrain Tiles 高程','url':'https://registry.opendata.aws/terrain-tiles/','license':'各高程源署名，见 LICENSES.md'},
]
for chap in [3,4,5,6,7,8,9,10,11,12,13,14,'B']:
    sources.append({'id':'uk_ch'+str(chap).lower(),'title':'英国官方战史 · '+('参战部队附录' if chap=='B' else '第'+str(chap)+'章'),
        'author':'T. K. Derry / HMSO（HyperWar 转录）','year':1952,'url':HYPER+'UK-NWE-Norway-'+str(chap)+'.html'})
save('src/data/sources/campaign.json', sources)

places = [
 ('oslo','奥斯陆','Oslo',10.75,59.91,'capital',1),('fornebu','福尼布机场','Fornebu',10.62,59.90,'airfield',3),
 ('oscarsborg','奥斯卡堡','Oscarsborg',10.61,59.68,'fort',3),('dr_obak','德勒巴克海峡','Drøbak',10.60,59.67,'crossing',4),
 ('sola','索拉机场','Sola',5.64,58.88,'airfield',3),('stavanger','斯塔万格','Stavanger',5.73,58.97,'port',2),
 ('egersund','埃格尔松','Egersund',6.00,58.45,'port',3),('bergen','卑尔根','Bergen',5.32,60.39,'port',2),
 ('kristiansand','克里斯蒂安桑','Kristiansand',8.00,58.15,'port',2),('trondheim','特隆赫姆','Trondheim',10.40,63.43,'port',2),
 ('vaernes','韦尔内斯机场','Værnes',10.92,63.46,'airfield',3),('hegra','赫格拉要塞','Hegra',11.17,63.45,'fort',3),
 ('storen','斯特伦','Støren',10.28,63.04,'town',3),('namsos','纳姆索斯','Namsos',11.49,64.47,'port',2),
 ('grong','格龙','Grong',12.32,64.47,'town',3),('steinkjer','斯泰因谢尔','Steinkjer',11.50,64.01,'town',3),
 ('verdal','韦尔达尔','Verdal',11.48,63.80,'town',4),('andalsnes','翁达尔斯内斯','Åndalsnes',7.69,62.57,'port',2),
 ('molde','莫尔德','Molde',7.16,62.74,'port',3),('dombas','栋博斯','Dombås',9.13,62.08,'crossing',3),
 ('lillehammer','利勒哈默尔','Lillehammer',10.47,61.12,'town',3),('tretten','特雷滕','Tretten',10.30,61.31,'town',3),
 ('elverum','埃尔沃吕姆','Elverum',11.56,60.88,'town',3),('otta','奥塔','Otta',9.54,61.77,'town',4),
 ('lesjaskog','莱沙斯库格冰湖','Lesjaskogsvatnet',8.47,62.21,'airfield',3),('mosjoen','莫舍恩','Mosjøen',13.20,65.84,'town',3),
 ('hemnesberget','海姆内斯贝格','Hemnesberget',13.61,66.22,'port',3),('mo','摩城','Mo i Rana',14.14,66.31,'town',3),
 ('saltdal','萨尔特达尔','Saltdal',15.43,66.82,'region',3),('bodo','博德','Bodø',14.38,67.28,'port',2),
 ('harstad','哈尔斯塔','Harstad',16.54,68.80,'port',2),('narvik','纳尔维克','Narvik',17.43,68.44,'port',1),
 ('bjerkvik','比耶克维克','Bjerkvik',17.56,68.55,'port',3),('gratangen','格拉唐根','Gratangsbotn',17.68,68.65,'town',3),
 ('ankenes','安克内斯','Ankenes',17.38,68.42,'town',4),('oyjord','厄于约德','Øyjord',17.49,68.47,'village',4),
 ('beisfjord','拜斯峡湾','Beisfjord',17.60,68.38,'town',4),('bjornfjell','比约恩山','Bjørnfjell',18.03,68.42,'crossing',3),
 ('bardufoss','巴尔杜福斯机场','Bardufoss',18.54,69.06,'airfield',2),('tromso','特罗姆瑟','Tromsø',18.95,69.65,'port',2),
 ('bjerkaker','比耶尔卡克','Bjerkaker',9.99,62.84,'town',4),('vestfjord','韦斯特峡湾','Vestfjord',15.80,68.10,'sea',3),
 ('ofotfjord','奥福特峡湾','Ofotfjord',16.91,68.43,'sea',3),('glorious_sea','光荣号海战海域','Norwegian Sea (approx.)',4.10,68.63,'sea',3),
 ('scapa','斯卡帕湾','Scapa Flow',-3.05,58.90,'port',3),('hatston','哈特斯顿机场','Hatston',-2.91,59.00,'airfield',3),
 ('north_sea','北海航路','North Sea',1.0,59.0,'sea',4),('narvik_offshore','北部运输海域','North Norway approaches',13.4,69.0,'sea',4),
 ('kiel','基尔','Kiel',10.14,54.32,'port',3),('wilhelmshaven','威廉港','Wilhelmshaven',8.12,53.53,'port',4),
]
gaz = {p[0]:[p[3],p[4]] for p in places}
save('src/data/gazetteer/base.json',[{'id':p[0],'zh':p[1],'orig':p[2],'pos':[p[3],p[4]],'kind':p[5],'rank':p[6]} for p in places])

units=[]
def unit(id,side,name,orig,short,kind,ech,track,src,history,commander=None,schematic=False,model=None):
    tr=[]
    for item in track:
        day,pos,*rest=item; status=rest[0] if rest else 'active'; hour=rest[1] if len(rest)>1 else '12:00'; mode=rest[2] if len(rest)>2 else 'land'
        tr.append({'at':t(day,hour),'pos':('@'+pos if isinstance(pos,str) else pos),'status':status,'mode':mode})
    obj={'id':id,'side':side,'name':{'zh':name,'orig':orig,'short':short},'type':kind,'echelon':ech,'parent':None,
         'active':{'from':tr[0]['at']},'track':tr,'history':history,'sources':src,'confidence':'medium','schematic':schematic,
         'model':model or ('navy_token' if kind=='naval' else 'air_token' if kind=='aviation' else 'inf_de' if side=='DE' else 'inf_pl' if side=='PL' else 'inf_allied')}
    if commander: obj['commander']={'zh':commander[0],'orig':commander[1]}
    units.append(obj);return obj
landing_hist='棋子表示该师在此方向参战的分遣队，不能视为全师集中在港口。史料确定登陆目标；位置和连线为概略行动方向。'
unit('de.69_bergen','DE','第69师 · 卑尔根分遣队','69. Infanterie-Division (Bergen detachment)','69·B','infantry','group',[('04-09','bergen','active','06:00'),('06-10','bergen')],['uk_ch3'],landing_hist,schematic=True)
unit('de.69_sola','DE','第69师 · 斯塔万格分遣队','69. Infanterie-Division (Stavanger detachment)','69·S','infantry','group',[('04-09','stavanger','active','10:00'),('06-10','stavanger')],['uk_ch3'],landing_hist,schematic=True)
unit('de.163_oslo','DE','第163师 · 奥斯陆分遣队','163. Infanterie-Division (Oslo detachment)','163·O','infantry','group',[('04-09','fornebu','active','09:00'),('04-09','oslo','active','14:00'),('04-20','lillehammer','engaged','12:00','rail'),('04-30','dombas')],['uk_ch3','uk_ch9'],landing_hist,schematic=True)
unit('de.163_south','DE','第163师 · 南岸分遣队','163. Infanterie-Division (Kristiansand detachment)','163·K','infantry','group',[('04-09','kristiansand','active','11:00'),('06-10','kristiansand')],['uk_ch3'],landing_hist,schematic=True)
unit('de.3geb_trondheim','DE','第3山地师 · 特隆赫姆分遣队','3. Gebirgs-Division (Trondheim detachment)','3·T','mountain','group',[('04-09','trondheim','active','06:00'),('04-21','steinkjer','engaged'),('05-03','namsos')],['uk_ch3','uk_ch6'],landing_hist,schematic=True)
unit('de.181','DE','第181步兵师','181. Infanterie-Division','181','infantry','division',[('04-15','trondheim'),('04-30','storen'),('06-10','trondheim')],['uk_ch3','uk_ch9'],'后续增援与中部驻防。初始占领特隆赫姆的分遣队属于第3山地师，不能把第181师的抵达机械提前至4月9日。标记为主要活动区域。',schematic=True)
unit('de.196','DE','第196步兵师','196. Infanterie-Division','196','infantry','division',[('04-15','oslo'),('04-24','tretten','engaged'),('04-28','otta','engaged'),('04-29','dombas'),('04-30','bjerkaker'),('05-02','andalsnes')],['uk_ch3','uk_ch7','uk_ch9'],'由奥斯陆方向向内陆推进，与英挪部队在山谷内交战。轨迹用于表示古德布兰谷走廊方向，不能据此推断各营每日的位置。',schematic=True)
unit('de.3geb_narvik','DE','第3山地师 · 迪特尔部队','Gruppe Dietl / 3. Gebirgs-Division','Dietl','mountain','group',[('04-09','narvik','active','06:00'),('04-25','bjerkvik','engaged'),('05-13','narvik','engaged'),('05-28','narvik','withdrawing'),('05-30','bjornfjell','withdrawing'),('06-10','narvik')],['uk_ch3','uk_ch13','uk_ch14'],'迪特尔部队由驱逐舰运抵纳尔维克。海军运输编队被消灭后，山地兵与上岸海军人员继续抵抗。5月28日撤向铁路及瑞典边界附近，未把撤退画成进入中立瑞典。',('爱德华·迪特尔','Eduard Dietl'),True)
unit('de.2geb','DE','第2山地师 · 北进部队','2. Gebirgs-Division','2.Geb','mountain','division',[('05-04','trondheim'),('05-06','grong'),('05-10','mosjoen','engaged'),('05-18','mo','engaged'),('05-25','saltdal','engaged'),('06-01','bodo'),('06-10','bodo')],['uk_ch12'],'5月由特隆赫姆向北推进，先后通过莫舍恩、摩城与萨尔特达尔方向。博德与纳尔维克之间当时没有连续公路，轨迹止于博德，不虚构直接陆路救援纳尔维克。',schematic=True)
unit('de.blucher','DE','重巡洋舰布吕歇尔号','Blücher','Blücher','naval','ship',[('04-09',[10.60,59.47],'active','00:00','naval'),('04-09','oscarsborg','engaged','04:25','naval'),('04-09','oscarsborg','destroyed','06:30','naval')],['oscarsborg_archive','uk_ch3'],'奥斯陆登陆编队旗舰。4月9日清晨遭奥斯卡堡岸炮与鱼雷重创后沉没，海上首都突袭被延缓。舰位以海峡中心表示，模型仅为海军符号。')
unit('de.konigsberg','DE','轻巡洋舰柯尼斯堡号','Königsberg','Königsb.','naval','ship',[('04-09',[5.29,60.40],'engaged','06:00','naval'),('04-10',[5.29,60.40],'destroyed','12:00','naval')],['uk_ch4'],'在卑尔根登陆行动中受岸防炮火损伤，次日被从奥克尼起飞的英国海军航空兵 Skua 俯冲轰炸机击沉。')
unit('de.narvik_destroyers','DE','纳尔维克德国驱逐舰编队','German Narvik destroyers','10 DD','naval','group',[('04-09','ofotfjord','active','00:00','naval'),('04-09',[17.37,68.44],'active','06:00','naval'),('04-10','ofotfjord','engaged','04:30','naval'),('04-13','ofotfjord','destroyed','12:00','naval')],['uk_ch3','uk_ch4'],'最初10艘驱逐舰运送山地兵。4月10日损失2艘；4月13日剩余8艘被击沉或自沉。棋子聚合展示编队，不表示同一地点的一艘船。',schematic=True)
unit('de.luftwaffe','DE','德国空军 · 挪威行动','Luftwaffe Norway operations','Luftw.','aviation','group',[('04-09','sola','active','09:00','air'),('04-15','vaernes','active','12:00','air'),('04-25','vaernes','engaged','12:00','air'),('06-10','vaernes','active','12:00','air')],['uk_ch3','uk_ch6','uk_ch12'],'聚合标记机场支援与空中行动，不对应一支虚构航空中队。德国利用索拉、福尼布、韦尔内斯等机场进行空运与轰炸，对盟军港口和缺乏防空的内陆部队造成压力。',schematic=True)
unit('no.south','NO','南部挪军 · 鲁格指挥部队','Norwegian forces under Ruge','Ruge','infantry','group',[('04-09','elverum','reserve','00:00'),('04-12','lillehammer','engaged'),('04-23','tretten','withdrawing'),('04-28','otta','withdrawing'),('05-03','dombas','surrendered')],['no_army','uk_ch7','uk_ch9'],'聚合展示南部动员、山谷迟滞与退却方向，不代表一支真实番号的统一部队。鲁格4月10日接任。中部盟军撤离后各地抵抗分批结束，南部个别战斗仍持续至5月10日。',('奥托·鲁格','Otto Ruge'),True)
unit('no.oscarsborg','NO','奥斯卡堡岸防部队','Oscarsborg fortress','Oscarsb.','fortress','group',[('04-09','oscarsborg','engaged','00:00'),('04-10','oscarsborg','surrendered','12:00')],['oscarsborg_archive','uk_ch3'],'4月9日岸炮与水下鱼雷发射阵地击沉布吕歇尔号。堡垒随后停止抵抗；标记为要塞锚点，不能代表火炮和鱼雷阵地的每个实际位置。',('比尔格·埃里克森','Birger Eriksen'))
unit('no.hegra','NO','赫格拉要塞守军','Hegra fortress garrison','Hegra','fortress','group',[('04-09','hegra','reserve','00:00'),('04-15','hegra','engaged'),('05-05','hegra','surrendered')],['uk_ch9','no_army'],'要塞位于特隆赫姆东侧。周围德军逐步巩固据点时，守军仍独立抵抗，到5月5日停止作战。它的存在说明中部港口撤离不等于同日所有挪军投降。')
unit('no.6div','NO','挪威第6师 · 北部部队','6. divisjon','6 Div','mountain','division',[('04-09','bardufoss','reserve','00:00'),('04-20','gratangen','engaged'),('04-25','gratangen','engaged'),('05-13','bjerkvik','engaged'),('05-28','oyjord','engaged'),('05-30','bjornfjell','engaged'),('06-10','bjornfjell','surrendered')],['no_army','uk_ch10','uk_ch13'],'弗莱舍指挥北部部队，从山区向纳尔维克周边压迫德军，与盟军协同反攻。棋子表示第6师战区的主要行动方向，各营并未共同沿一条线行军。盟军撤离后于6月10日停止本土抵抗。',('卡尔·古斯塔夫·弗莱舍','Carl Gustav Fleischer'),True)
for id,name,orig,short,loc in [('eidsvold','艾兹沃尔号','Eidsvold','Eidsvold',[17.34,68.44]),('norge','挪威号','Norge','Norge',[17.40,68.43])]:
    unit('no.'+id,'NO','岸防舰'+name,orig,short,'naval','ship',[('04-09',loc,'engaged','00:00','naval'),('04-09',loc,'destroyed','06:00','naval')],['uk_ch3'],'4月9日在纳尔维克附近遭德国驱逐舰攻击后沉没，未能阻止山地兵登陆。标记为港湾海战概略位置。')
unit('uk.destroyers','UK','英国驱逐舰突击队','2nd Destroyer Flotilla (attack group)','2 Flot','naval','group',[('04-10','vestfjord','active','00:00','naval'),('04-10','narvik','engaged','04:30','naval'),('04-10','ofotfjord','withdrawing','12:00','naval'),('04-11','vestfjord','withdrawing','12:00','naval')],['uk_ch4'],'4月10日5艘英国驱逐舰突入纳尔维克。双方均损失2艘驱逐舰；英舰Hardy与Hunter损失。海战胜利没有在同日把纳尔维克城区交给盟军。',schematic=True)
unit('uk.warspite','UK','战列舰厌战号及护航编队','HMS Warspite and destroyers','Warspite','naval','group',[('04-13','vestfjord','active','00:00','naval'),('04-13','ofotfjord','engaged','12:00','naval'),('04-14','vestfjord','active','12:00','naval'),('05-13',[17.42,68.52],'engaged','12:00','naval'),('05-15','vestfjord','evacuated','12:00','naval')],['uk_ch4','uk_ch13'],'4月13日厌战号与英国驱逐舰进入奥福特峡湾，摧毁剩余德国驱逐舰。5月对北部两栖进攻提供舰炮支援；长时间间隔表示任务节点，不是持续航迹。',schematic=True)
unit('uk.146','UK','第146步兵旅','146th Infantry Brigade','146 Bde','infantry','brigade',[('04-16','namsos'),('04-19','steinkjer','engaged'),('04-23','namsos','withdrawing'),('05-02','namsos','withdrawing'),('05-03',[7.5,65],'evacuated','12:00','naval')],['uk_ch6','uk_ch9','uk_chb'],'纳姆索斯登陆后的北翼攻势意在威胁特隆赫姆。斯泰因谢尔方向受德军反击与空袭，随后退回港口，5月3日撤运完成。海上终点表示离开挪威战区。')
unit('uk.148','UK','第148步兵旅','148th Infantry Brigade','148 Bde','infantry','brigade',[('04-18','andalsnes'),('04-19','dombas','active','12:00','rail'),('04-20','lillehammer','engaged','12:00','rail'),('04-23','tretten','engaged'),('04-24','tretten','ineffective')],['uk_ch7','uk_chb'],'经翁达尔斯内斯与栋博斯进入古德布兰谷支援挪军，在特雷滕受到德军重创，部分人员被俘、余部退却。淡出表示原旅作为完整作战力量不再继续，不意味着每一名士兵全部阵亡。')
unit('uk.15','UK','第15步兵旅','15th Infantry Brigade','15 Bde','infantry','brigade',[('04-23','andalsnes'),('04-24','dombas','active','12:00','rail'),('04-25','otta','engaged','12:00','rail'),('04-28','dombas','withdrawing'),('05-01','andalsnes','withdrawing'),('05-02',[3.8,63],'evacuated','12:00','naval')],['uk_ch8','uk_ch9','uk_chb'],'英军正规旅增援中部南翼，在山谷实施迟滞战后沿罗姆斯达尔方向退到港口。5月2日撤离完成，北部纳尔维克战区仍继续作战。')
unit('uk.24','UK','第24近卫旅 · 北部部队','24th (Guards) Brigade','24 Gds','infantry','brigade',[('04-15','harstad'),('04-26',[16.9,68.52],'engaged'),('05-13',[16.93,68.52]),('06-04','harstad','withdrawing'),('06-08',[10,69],'evacuated','12:00','naval')],['uk_ch10','uk_ch12','uk_ch14','uk_chb'],'哈尔斯塔建立北部基地后在纳尔维克外围作战。部分营后来转移至摩城、博德等方向；本棋子只表示旅的北部作战部分，不把分散营的运动合成虚假的完整轨迹。',schematic=True)
unit('uk.faa','UK','海军航空兵 Skua 编队','Fleet Air Arm Skua attack','FAA','aviation','group',[('04-10','hatston','active','00:00','air'),('04-10','bergen','engaged','12:00','air'),('04-10','hatston','active','18:00','air')],['uk_ch4'],'从奥克尼哈特斯顿起飞袭击卑尔根港的柯尼斯堡号。飞行线仅连接出发基地与打击目标，不声称重建各飞机航迹。',schematic=True)
unit('uk.263_south','UK','RAF第263中队 · 冰湖部署','No. 263 Squadron RAF (Lesjaskog)','263 RAF','aviation','squadron',[('04-24','lesjaskog','active','12:00','air'),('04-25','lesjaskog','engaged','12:00','air'),('04-26','lesjaskog','inactive','12:00','air')],['raf_timeline','uk_chb'],'Gladiator战斗机4月24日飞抵冰封莱沙斯库格湖，25日受到空袭，26日因飞机与燃料不足退出。此棋子仅表示这次部署，不把全中队永久解散；5月北部重新部署另设标记。')
unit('uk.263_north','UK','RAF第263中队 · 北部部署','No. 263 Squadron RAF (Bardufoss)','263 RAF','aviation','squadron',[('05-21','bardufoss','active','12:00','air'),('05-28','bardufoss','engaged','12:00','air'),('06-07','bardufoss','withdrawing','12:00','air'),('06-08',[13,69.3],'evacuated','00:00','air')],['uk_ch13','uk_ch14','uk_chb'],'5月21日在巴尔杜福斯建立新的Gladiator战斗机部署，为北部反攻提供支援。6月撤离中飞机转运回航母；舰载运输的损失另由光荣号事件说明。')
unit('uk.46','UK','RAF第46中队','No. 46 Squadron RAF','46 RAF','aviation','squadron',[('05-26','bardufoss','active','12:00','air'),('05-28','bardufoss','engaged','12:00','air'),('06-07','bardufoss','withdrawing','12:00','air'),('06-08',[13,69.3],'evacuated','00:00','air')],['uk_ch13','uk_ch14','uk_chb'],'Hurricane中队于5月下旬加入北部空战，最终在缺乏舰载着舰训练的条件下飞回光荣号。棋子体现机场部署与撤出，战斗机航迹为概略。')
unit('uk.glorious','UK','航空母舰光荣号','HMS Glorious','Glorious','naval','ship',[('06-07',[13.2,69.2],'withdrawing','12:00','naval'),('06-08','glorious_sea','engaged','16:00','naval'),('06-08','glorious_sea','destroyed','18:00','naval')],['uk_ch14'],'6月8日返航途中，光荣号与驱逐舰Ardent、Acasta遭沙恩霍斯特、格奈森瑙拦截后沉没。外海标记只表示文献所述海域；具体舰位和分钟级航迹未复原。')
unit('uk.devonshire','UK','巡洋舰德文郡号 · 政府撤运','HMS Devonshire','Devonsh.','naval','ship',[('06-07','tromso','active','12:00','naval'),('06-08',[14,70],'withdrawing','12:00','naval'),('06-10',[-2,60],'evacuated','12:00','naval')],['government_archive','uk_ch14'],'6月7日载挪威国王、政府离开特罗姆瑟，驶向英国继续战争。轨迹终点只表示英国方向，不声称6月10日已到达最终港口。')
unit('fr.alp_namsos','FR','法国山地猎兵 · 中部','Chasseurs Alpins (Namsos force)','Alpins C','mountain','group',[('04-19','namsos'),('04-23','grong','engaged'),('05-02','namsos','withdrawing'),('05-03',[7.5,65],'evacuated','12:00','naval')],['uk_ch6','uk_ch9','uk_chb'],'纳姆索斯方向的法国山地猎兵与英国北翼力量协同。聚合展示该战区法军，不把法国多个半旅或营虚构为同一个真实番号旅。',schematic=True)
unit('fr.alp_north','FR','法国山地猎兵 · 北部','Chasseurs Alpins (North Norway)','Alpins N','mountain','group',[('04-28','harstad'),('05-06','gratangen','engaged'),('05-13','bjerkvik','engaged'),('05-28','bjornfjell','engaged'),('06-05','harstad','withdrawing'),('06-08',[12.5,69],'evacuated','12:00','naval')],['uk_ch10','uk_ch13','uk_ch14','uk_chb'],'北部法国山地猎兵参与山区推进并与挪威第6师协同。地图只描述战区主要方向，各营实际位置不同。6月初随盟军撤出。',schematic=True)
unit('fr.13dble','FR','第13外籍军团半旅','13e Demi-Brigade de Légion Étrangère','13 DBLE','infantry','regiment',[('05-06','harstad'),('05-12',[17.42,68.52],'active','12:00','naval'),('05-13','bjerkvik','engaged'),('05-27','oyjord','active'),('05-28','narvik','engaged'),('06-04','narvik','withdrawing'),('06-06','harstad','withdrawing'),('06-08',[11.5,69],'evacuated','12:00','naval')],['uk_ch13','uk_ch14','uk_chb'],'在比耶克维克登陆，5月28日参与跨罗姆巴克峡湾夺回纳尔维克。作为半旅以团级符号表示。6月虽已取得局部胜利，仍因法国战局变化奉命撤离。')
unit('pl.podhale','PL','波兰独立山地旅','Samodzielna Brygada Strzelców Podhalańskich','Podhale','mountain','brigade',[('05-09','harstad'),('05-15',[16.9,68.52]),('05-27','ankenes','engaged'),('05-28','beisfjord','engaged'),('06-03','ankenes','withdrawing'),('06-05','harstad','withdrawing'),('06-08',[10.8,69],'evacuated','12:00','naval')],['uk_ch13','uk_ch14','uk_chb'],'5月抵达北部，主要在纳尔维克南翼安克内斯、拜斯峡湾方向作战。与挪法北岸进攻并行，不能画成该旅全部从北面跨罗姆巴克峡湾。6月随盟军撤出。',('齐格蒙特·博胡什-希什科','Zygmunt Bohusz-Szyszko'))
for u in units:
    if u['id'] in ['uk.destroyers','uk.faa']: u['active']['to'] = t('04-11','23:59')
for side in ['DE','NO','UK','FR','PL']: save('src/data/oob/'+side.lower()+'.json',[u for u in units if u['side']==side])

routes=[]
def route(id,side,uid,kind,label,wps,src,style='main',width=7):
    routes.append({'id':'r.'+id,'side':side,'unit':uid,'kind':kind,'style':style,'widthKm':width,'label':label,
      'waypoints':[{'at':t(day,hour),'pos':('@'+pos if isinstance(pos,str) else pos)} for day,hour,pos in wps],
      'sources':src,'confidence':'medium','schematic':True})
# Invasion routes are staged at the edge of the map at 00:00: the operation began earlier outside this date window.
for id,uid,target,start,mid,hr in [
 ('narvik','de.3geb_narvik','narvik',[14.8,67.4],'ofotfjord','06:00'),
 ('trondheim','de.3geb_trondheim','trondheim',[7.6,63.7],[9.8,63.6],'06:00'),
 ('bergen','de.69_bergen','bergen',[3.9,59.8],[4.9,60.1],'06:00'),
 ('stavanger','de.69_sola','stavanger',[4.9,58.3],[5.4,58.6],'10:00'),
 ('kristiansand','de.163_south','kristiansand',[8.5,57.5],[8.1,57.9],'11:00'),
 ('oslo','de.blucher','oscarsborg',[10.65,58.6],[10.60,59.4],'04:25')]:
    route('weser_'+id,'DE',uid,'landing','登陆 · '+next(p[1] for p in places if p[0]==target),[('04-09','00:00',start),('04-09','03:00',mid),('04-09',hr,target)],['uk_ch3'],width=9)
route('air_sola','DE','de.luftwaffe','air','空降索拉',[('04-09','00:00',[9,55.5]),('04-09','09:00','sola')],['uk_ch3'])
route('air_fornebu','DE','de.163_oslo','air','空运福尼布',[('04-09','00:00',[10,56]),('04-09','09:00','fornebu')],['uk_ch3'])
route('skua','UK','uk.faa','air','Skua · 卑尔根袭击',[('04-10','00:00','hatston'),('04-10','12:00','bergen')],['uk_ch4'])
route('naval_first','UK','uk.destroyers','naval','首次纳尔维克海战',[('04-10','00:00','vestfjord'),('04-10','04:00','ofotfjord'),('04-10','04:30','narvik')],['uk_ch4'])
route('naval_second','UK','uk.warspite','naval','厌战号 · 奥福特峡湾',[('04-13','00:00','vestfjord'),('04-13','12:00','ofotfjord')],['uk_ch4'])
for name,side,uid,day,dest,entry in [('namsos','UK','uk.146','04-16','namsos',[9.4,64.6]),('andalsnes','UK','uk.148','04-18','andalsnes',[5.8,63.2]),('harstad','UK','uk.24','04-15','harstad',[14.8,69.2]),('french','FR','fr.13dble','05-06','harstad',[14.8,69.2]),('polish','PL','pl.podhale','05-09','harstad',[14.5,69.3])]:
    route('allied_'+name,side,uid,'landing','盟军增援',[ (day,'00:00',entry),(day,'12:00',dest)],['uk_chb','uk_ch10'])
route('ruge_retreat','NO','no.south','land','挪军山谷迟滞 / 退却',[('04-12','12:00','lillehammer'),('04-23','12:00','tretten'),('04-28','12:00','otta'),('05-03','12:00','dombas')],['no_army','uk_ch7'],style='retreat')
route('north_pincer','UK','uk.146','land','中部北翼：特隆赫姆方向',[('04-16','12:00','namsos'),('04-19','12:00','steinkjer')],['uk_ch6'])
route('south_valley','UK','uk.148','land','中部南翼：经栋博斯支援',[('04-18','12:00','andalsnes'),('04-19','12:00','dombas'),('04-20','12:00','lillehammer')],['uk_ch7'])
route('german_valley','DE','de.196','land','古德布兰谷推进',[('04-20','12:00','lillehammer'),('04-24','12:00','tretten'),('04-28','12:00','otta'),('04-30','12:00','dombas')],['uk_ch7','uk_ch9'])
route('steinkjer','DE','de.3geb_trondheim','land','特隆赫姆北向反击',[('04-18','12:00','trondheim'),('04-20','12:00','verdal'),('04-22','12:00','steinkjer')],['uk_ch6'])
route('namsos_air','DE','de.luftwaffe','air','港口 / 补给空袭',[('04-20','00:00','vaernes'),('04-20','12:00','namsos')],['uk_ch6'])
route('lesjaskog_air','DE','de.luftwaffe','air','冰湖机场空袭',[('04-25','00:00','vaernes'),('04-25','12:00','lesjaskog')],['raf_timeline'])
route('central_evacuate_a','UK','uk.15','evacuation','翁达尔斯内斯撤运',[('05-01','12:00','andalsnes'),('05-02','00:00',[5.8,63.2]),('05-02','12:00',[3.8,63])],['uk_ch9'],style='retreat')
route('central_evacuate_n','UK','uk.146','evacuation','纳姆索斯撤运',[('05-02','12:00','namsos'),('05-03','00:00',[9.4,64.6]),('05-03','12:00',[7.5,65])],['uk_ch9'],style='retreat')
route('german_north','DE','de.2geb','land','第2山地师分段北进',[('05-04','12:00','trondheim'),('05-06','12:00','grong'),('05-10','12:00','mosjoen'),('05-18','12:00','mo'),('05-25','12:00','saltdal'),('06-01','12:00','bodo')],['uk_ch12'])
route('hemnes_landing','DE','de.2geb','landing','沿海运输 / 后方包抄',[('05-09','12:00',[12.1,65.6]),('05-10','12:00','hemnesberget')],['uk_ch12'],style='secondary')
route('bjerkvik','FR','fr.13dble','landing','比耶克维克两栖进攻',[('05-12','12:00',[17.42,68.52]),('05-13','12:00','bjerkvik')],['uk_ch13'],style='counter',width=5)
route('norwegian_north','NO','no.6div','land','挪军山地反攻',[('04-25','12:00','gratangen'),('05-13','12:00','bjerkvik')],['uk_ch10','uk_ch13'],style='counter',width=6)
route('narvik_landing','FR','fr.13dble','landing','罗姆巴克峡湾短渡',[('05-28','00:00','oyjord'),('05-28','12:00','narvik')],['uk_ch13'],style='counter',width=3)
route('polish_south','PL','pl.podhale','land','波军 · 南翼反攻',[('05-27','12:00','ankenes'),('05-28','12:00','beisfjord')],['uk_ch13'],style='counter',width=3)
route('dietl_retreat','DE','de.3geb_narvik','land','德军向边界附近退却',[('05-28','12:00','narvik'),('05-30','12:00','bjornfjell')],['uk_ch13'],style='retreat',width=4)
route('raf_north','UK','uk.263_north','air','北部空中支援',[('05-21','00:00',[15,69.6]),('05-21','12:00','bardufoss')],['uk_ch13'])
route('bodo_air','DE','de.luftwaffe','air','博德遭空袭',[('05-27','00:00','vaernes'),('05-27','12:00','bodo')],['uk_ch12'])
route('alphabet','UK','uk.24','evacuation','Alphabet · 北部撤离',[('06-04','12:00','harstad'),('06-05','12:00',[14,69.2]),('06-08','12:00',[7.0,68.5])],['uk_ch14'],style='retreat',width=10)
route('government','UK','uk.devonshire','evacuation','王室与政府赴英国',[('06-07','12:00','tromso'),('06-08','12:00',[14,70]),('06-10','12:00',[-2,60])],['government_archive','uk_ch14'],style='retreat')
route('glorious','UK','uk.glorious','naval','光荣号返航 / 海战',[('06-07','12:00',[13.2,69.2]),('06-08','16:00','glorious_sea')],['uk_ch14'],style='retreat')
for side in ['DE','NO','UK','FR','PL']: save('src/data/routes/'+side.lower()+'.json',[r for r in routes if r['side']==side])

events=[]
def event(id,day,title,orig,body,place,cat,side,uid,src,importance=2,zoom=5,hour='12:00',precision='day',narration=None):
    e={'id':'e.'+id,'at':t(day,hour),'title':{'zh':title,'orig':orig},'body':body,'place':'@'+place,'category':cat,'side':side,
       'units':uid,'sources':src,'confidence':'high','importance':importance,'zoom':zoom,'timePrecision':precision,
       'mapNote':'城市/机场为地理锚点；路线与控制区为概略作战示意。'}
    if precision=='day': e['mapNote']+='该日时分仅用于播放排序。'
    e['sfx']=[{'naval':'ship_gun','air':'bomber','battle':'artillery','movement':'morse','political':'radio','surrender':'bell'}.get(cat,'morse')]
    if narration:e['narration']=narration
    events.append(e)
event('weser','04-09','威悉演习 · 多港口同时入侵','Operation Weserübung','德国以海军运输、空降与空运突袭挪威战略港口和机场。纳尔维克、特隆赫姆、卑尔根、克里斯蒂安桑及奥斯陆方向同时遭攻击；德军先形成彼此分离的沿海据点，再向内陆扩展。长海岸与峡湾使这场战役从一开始就是多个海陆空战场并行。','trondheim','movement','DE',['de.69_bergen','de.3geb_trondheim','de.3geb_narvik'],['uk_ch3','no_army'],1,1,'00:00',narration='On the ninth of April, Germany attacked Norway at several ports at once. Sea landings and airborne forces created separate bridgeheads along the coast.')
event('blucher','04-09','奥斯卡堡击沉布吕歇尔号','Blücher at Oscarsborg','奥斯陆峡湾里的奥斯卡堡以岸炮与鱼雷重创德军登陆编队旗舰布吕歇尔号，舰船随后沉没。突入首都的海上行动受阻，为挪威王室、政府撤出争取时间。海上阻击并未阻止德军当天经机场与陆路夺取奥斯陆，但改变了政治领导层的处境。','oscarsborg','naval','NO',['no.oscarsborg','de.blucher'],['oscarsborg_archive','uk_ch3'],1,7,'06:30','day',narration='At Oscarsborg, coastal guns and torpedoes sank the German cruiser Blücher. The delay helped Norway’s government and king escape capture.')
event('narvik_landing','04-09','纳尔维克 · 铁矿港被夺取','Narvik landings','德国10艘驱逐舰输送第3山地师所属部队进入纳尔维克，挪威岸防舰艾兹沃尔号与挪威号被击沉。港口是瑞典铁矿的重要冬季出口。德军夺取城区后，挪威第6师仍在北部集结，海战与山地反攻将围绕这个孤立据点持续进行。','narvik','naval','DE',['de.3geb_narvik','de.narvik_destroyers','no.norge','no.eidsvold'],['uk_ch3','no_army'],1,6,'07:00')
event('trondheim','04-09','特隆赫姆 · 中部登陆支点','Trondheim and Værnes','德军突破特隆赫姆峡湾岸防，输送第3山地师的分遣队占据港口，并利用韦尔内斯机场建立增援和航空基地。第181步兵师属于后续增援。中部这一据点与奥斯陆尚未陆路连通，盟军随后从其南北两侧登陆，试图夺回特隆赫姆。','trondheim','movement','DE',['de.3geb_trondheim'],['uk_ch3'],2,5,'08:00')
event('sola','04-09','索拉机场与西南港口','Sola / Stavanger','德军空降与空运夺取索拉机场，在斯塔万格、埃格尔松等西南沿海地点建立据点。机场让后续人员、补给和空军力量能直接进入挪威。地图把空中行动与港口登陆分开显示；部队标记表示分遣队，不能将一个师机械放在多个城市。','sola','air','DE',['de.69_sola','de.luftwaffe'],['uk_ch3'],2,5,'10:00')
event('south_ports','04-09','卑尔根与克里斯蒂安桑登陆','Bergen / Kristiansand','德军海军编队在岸防炮火下进入卑尔根与克里斯蒂安桑，分别支持第69师、第163师所属分遣队登陆。这些港口分布很远，各自形成桥头堡。卑尔根的柯尼斯堡号受损后留在港内，次日成为英国海军航空兵的打击目标。','bergen','naval','DE',['de.69_bergen','de.163_south','de.konigsberg'],['uk_ch3'],2,3,'11:00')
event('oslo','04-09','奥斯陆失守 · 政府离开首都','Fornebu and Oslo','福尼布机场的德军机降与后续部队进入奥斯陆，首都在4月9日被占领。王室、政府及议会已经离开，之后转往内陆坚持抵抗。海峡阻击与首都失守需分开理解：一个是海军突袭受挫，另一个是德国凭航空与陆上力量实现的港城占领。','oslo','movement','DE',['de.163_oslo','no.south'],['uk_ch3','no_army'],1,5,'14:00')
event('first_narvik','04-10','第一次纳尔维克海战','First Battle of Narvik','英国5艘驱逐舰清晨突入纳尔维克港及奥福特峡湾，与德国驱逐舰交战。双方各损失2艘驱逐舰；英国Hardy、Hunter损失，突击队随后退出。地图只改变海军态势，不把城区涂成盟军占领：迪特尔的山地兵仍控制港城。','ofotfjord','naval','UK',['uk.destroyers','de.narvik_destroyers'],['uk_ch4'],1,6,'04:30','day',narration='British destroyers struck Narvik on the tenth of April. Both sides lost ships, but German mountain troops still held the town.')
event('konigsberg','04-10','卑尔根港 · 柯尼斯堡号被击沉','Skua raid on Königsberg','英国海军航空兵的Skua俯冲轰炸机从奥克尼哈特斯顿起飞，袭击留在卑尔根港内的柯尼斯堡号并将其击沉。远距离空中行动说明海岸据点也受到英国海军反制。飞行线仅连接已知出发基地与打击目标，不能解读为逐分钟航迹。','bergen','air','UK',['uk.faa','de.konigsberg'],['uk_ch4'],2,5,'12:00')
event('ruge','04-12','挪威集结 · 内陆迟滞抵抗','Norwegian resistance under Ruge','鲁格于4月10日接任挪威军队指挥，随后组织南部抵抗，等待盟军支援。挪军利用内陆山谷和交通走廊迟滞德军，由米约萨湖及利勒哈默尔一带逐步北撤。这里的集群棋子表示多支部队的作战方向，不是一支虚构番号的统一军团。','lillehammer','battle','NO',['no.south'],['no_army','uk_ch7'],2,4)
event('second_narvik','04-13','第二次纳尔维克海战','Warspite in Ofotfjord','厌战号战列舰与英国驱逐舰进入奥福特峡湾，摧毁余下德国驱逐舰。失去运输舰艇的德军仍在陆地抵抗，上岸海军人员也加入战斗。海军编队的消失和山地部队的存在同时显示，解释为什么海上胜利没有立即带来纳尔维克易手。','ofotfjord','naval','UK',['uk.warspite','de.narvik_destroyers','de.3geb_narvik'],['uk_ch4'],1,6,narration='Warspite and British destroyers destroyed the remaining German destroyers. The naval battle was won, but the land campaign had only begun.')
event('namsos_advance','04-14','纳姆索斯先遣登陆','Namsos naval advance party','英国海军先遣队抵达纳姆索斯，准备为随后到来的部队建立港口基地。第146步兵旅从4月16日起登陆，法国山地猎兵随后加入。盟军计划从北面逼近特隆赫姆，登陆日期与陆军正式投入作战的日期在地图中分开编排。','namsos','movement','UK',[],['uk_ch6'],2,5)
event('harstad','04-15','哈尔斯塔 · 北部盟军基地','Harstad landings','英国第24近卫旅在哈尔斯塔登陆，以此作为纳尔维克方向的基地。海军与陆军对行动节奏存在分歧，山区和峡湾也限制推进。盟军在港城外围逐步展开，同时挪威第6师从北部内陆施压，这与中部特隆赫姆行动是两个并行战场。','harstad','movement','UK',['uk.24','no.6div'],['uk_ch10','uk_chb'],2,4)
event('namsos','04-16','中部北翼 · 第146旅登陆','146th Brigade at Namsos','第146步兵旅在纳姆索斯展开，向斯泰因谢尔方向推进，意在从北面威胁特隆赫姆。法国山地猎兵随后支援。狭长交通走廊与德军空袭使港口和补给极易受损；这条箭头表示行动方向，不表示盟军已经控制整条峡湾或到达特隆赫姆。','namsos','movement','UK',['uk.146','fr.alp_namsos'],['uk_ch6','uk_chb'],1,4)
event('andalsnes','04-18','中部南翼 · 翁达尔斯内斯登陆','Åndalsnes and the Gudbrandsdal','17日海军先遣队抵达，18日英国第148旅登陆。部队经罗姆斯达尔谷地和栋博斯向南支援挪军，而原先夺回特隆赫姆的计划逐步转向防御。地图用折线路径经过已知交通节点，避免把港口至利勒哈默尔画成穿越山体的直线。','andalsnes','movement','UK',['uk.148','no.south'],['uk_ch7','uk_ch9','uk_chb'],1,4)
event('namsos_bomb','04-20','纳姆索斯遭轰炸 · 补给承压','Air raids on Namsos','德军空袭严重破坏纳姆索斯的港区和城区，盟军的补给、集结与防空受到压力。占据韦尔内斯等机场让德国能反复打击中部登陆基地。空中线只表示航空基地与目标的关系，海港部队仍需继续在陆地抵抗，不能用一次空袭替代整场战斗。','namsos','air','DE',['de.luftwaffe','uk.146'],['uk_ch6'],2,5)
event('steinkjer','04-22','斯泰因谢尔方向 · 德军反击','Steinkjer and Vist','德军从特隆赫姆向北推进，并利用峡湾侧翼登陆威胁英挪军队。斯泰因谢尔及周边战斗使盟军北钳形攻势受挫，部队被迫退回纳姆索斯方向。陆路推进、海上包抄与空中优势相互配合，不能被压缩成一条简单的北向前线。','steinkjer','battle','DE',['de.3geb_trondheim','uk.146'],['uk_ch6'],2,5)
event('tretten','04-23','特雷滕战斗 · 英军遭重创','Battle of Tretten','第148旅在古德布兰谷的特雷滕遭德军攻击，出现严重伤亡和被俘，原旅作为完整作战力量难以继续。第15旅随后投入迟滞战。棋子淡出表示旅的作战组织失去完整性，不能理解为全旅人员全部阵亡或在同一时刻投降。','tretten','battle','DE',['uk.148','uk.15','de.196','no.south'],['uk_ch7','uk_ch8','uk_chb'],2,5)
event('lesjaskog','04-24','RAF抵达冰湖机场','No. 263 Squadron at Lesjaskog','英国皇家空军第263中队的Gladiator战斗机飞抵冰封莱沙斯库格湖，尝试支援中部地面部队。25日德国空袭破坏了飞机与基地，26日因可用飞机、燃料不足退出。这次短暂部署显示盟军在挪威建立空中支援的困难。','lesjaskog','air','UK',['uk.263_south'],['raf_timeline'],2,5)
event('lesjaskog_raid','04-25','冰湖基地遭空袭','Lesjaskog airfield under attack','德军袭击莱沙斯库格冰湖基地，第263中队的飞机和补给受到破坏。抵达与受袭并非同一天：24日部署，25日受袭，26日退出中部行动。保持这些节点分开，能看到航空基地生存能力怎样限制地面部队获得持续空中掩护。','lesjaskog','air','DE',['uk.263_south','de.luftwaffe'],['raf_timeline'],2,5)
event('gratangen','04-25','格拉唐根 · 挪军山地抵抗','Gratangen','纳尔维克北面的格拉唐根发生激烈战斗，挪威第6师战区内的I/IR12营遭德国反击并损失严重。山区抵抗仍继续，为后续挪法协同反攻铺路。地图的师级棋子表示整个战区的方向，不把一个营的损失写成第6师覆灭。','gratangen','battle','NO',['no.6div','de.3geb_narvik'],['gratangen','uk_ch10'],2,6)
event('linkup','04-30','南北德军会师 · 中部连接','Oslo–Trondheim link-up','由奥斯陆向北与由特隆赫姆向南的德军在斯特伦以南接通，建立了较稳固的中部陆路联系。盟军南北钳形行动已难达成夺回特隆赫姆的目标，撤离成为主要决策。连接只发生在中部，不能延伸成一直通往纳尔维克的连续德军前线。','bjerkaker','movement','DE',['de.196','de.181'],['uk_ch9'],1,3)
event('andalsnes_evacuate','05-02','翁达尔斯内斯与莫尔德撤离完成','Central withdrawal: Åndalsnes / Molde','英军经翁达尔斯内斯、莫尔德撤出中部南翼，海上撤运在5月2日完成。挪军随后面对独立继续抵抗的困境，但不能将这一日期写成挪威全境停止作战。中部港口的盟军棋子撤出，北部哈尔斯塔与纳尔维克战区仍保持活动。','andalsnes','movement','UK',['uk.15','no.south'],['uk_ch9','no_army'],1,4)
event('namsos_evacuate','05-03','纳姆索斯撤离完成','Namsos evacuation','盟军于2日到3日夜间撤出纳姆索斯，完成中部北翼撤运。返航受到德军空袭，英国Afridi与法国Bison驱逐舰损失。盟军从中部退出，并不等于失去所有海上运输能力；北部法国、波兰增援仍继续进入纳尔维克战区。','namsos','movement','UK',['uk.146','fr.alp_namsos'],['uk_ch9'],1,4)
event('hegra','05-05','赫格拉要塞停止抵抗','Hegra fortress surrenders','特隆赫姆东侧的赫格拉要塞在长期孤立抵抗后停止作战。此前中部盟军已经撤走，但要塞一直维持独立抵抗，南部个别地区战斗还会持续至5月10日。本节点只改变要塞守军状态，不能写成挪威全国投降或北部战役结束。','hegra','surrender','NO',['no.hegra'],['uk_ch9','no_army'],2,6)
event('french_reinforce','05-06','法国外籍军团增援北部','13e DBLE lands in North Norway','法国外籍军团第13半旅抵达北部，与此前法国山地猎兵和英国部队一同准备反攻。哈尔斯塔仍是主要运输基地。法国不同部队以独立标记表示，避免将山地猎兵与外籍军团揉成一支不存在的统一旅；具体舰次和营级位置未复原。','harstad','movement','FR',['fr.13dble','fr.alp_north'],['uk_ch13','uk_chb'],2,4)
event('polish_reinforce','05-09','波兰独立山地旅抵达','Polish Independent Highland Brigade','波兰独立山地旅抵达北部，随后在纳尔维克南翼安克内斯、拜斯峡湾方向投入战斗。波兰军人的参战与德国入侵波兰后的海外继续作战相联系。国家颜色与单位卡单独标明波军，不能用法国或英国标识代替实际的参战力量。','harstad','movement','PL',['pl.podhale'],['uk_ch13','uk_chb'],2,4)
event('hemnes','05-10','海姆内斯贝格 · 海空包抄','Hemnesberget landing','德军利用沿海轮船Nord-Norge和水上飞机在海姆内斯贝格实施包抄，威胁莫舍恩至摩城方向的后方交通。第2山地师同时由南向北推进。海上登陆与陆上北进分开绘制，展示崎岖地形中沿海运输怎样绕过盟军的山谷迟滞线。','hemnesberget','naval','DE',['de.2geb'],['uk_ch12'],2,5)
event('bjerkvik','05-13','比耶克维克 · 两栖反攻','Allied landing at Bjerkvik','法国第13外籍军团半旅在英国舰炮支援下从赫尔扬峡湾登陆比耶克维克，挪法山地部队从格拉唐根方向施压。海上登陆和山地推进共同压缩迪特尔部队。登陆箭头与挪军陆上箭头同时显示，说明这场反攻的多国与协同性质。','bjerkvik','battle','FR',['fr.13dble','no.6div','uk.warspite','de.3geb_narvik'],['uk_ch13'],1,7,narration='At Bjerkvik, French Foreign Legion troops landed under British naval gunfire. Norwegian and French troops pressed south through the mountains.')
event('raf_north','05-21','巴尔杜福斯 · 北部空中支援','RAF returns to Bardufoss','第263中队5月21日进驻巴尔杜福斯，第46中队在26日加入北部行动。Gladiator与Hurricane战斗机为纳尔维克反攻提供支援，但数量、基地和补给仍有限。地图以机场标记与概略空中行动线表达支援范围，不声称恢复每一次空战。','bardufoss','air','UK',['uk.263_north'],['uk_ch13','uk_chb'],2,4)
event('withdrawal_decision','05-25','法国战局改变优先级 · 撤离指示','Decision to withdraw from North Norway','法国战局恶化后，盟军决定撤出挪威北部，前线在5月25日收到指示。军事行动仍继续，以掩护撤运并破坏德军据点。此时只标记战略决策，不提前清空部队或取消5月28日夺城；战术胜利与战略撤离将在随后同时出现。','harstad','political','UK',['uk.24','fr.13dble','pl.podhale'],['uk_ch13','uk_ch14'],2,3)
event('raf46','05-26','Hurricane中队加入北部','No. 46 Squadron RAF','皇家空军第46中队的Hurricane战斗机抵达北部，转用巴尔杜福斯基地，与第263中队共同支援纳尔维克地区。盟军已有撤离指示，却仍需要空中掩护地面攻击和运输。机场棋子显示部署变化，不将整个挪威上空画成盟军制空区。','bardufoss','air','UK',['uk.46','uk.263_north'],['uk_ch13','uk_chb'],2,5)
event('bodo','05-27','博德空袭 · 北进战场的压力','Air attack on Bodø','德国空袭重创博德，南面第2山地师沿莫舍恩、摩城及萨尔特达尔方向北进。盟军在北部南翼实施迟滞并准备撤退。博德与纳尔维克之间没有连续公路，本图将这两个战区分开，避免用一条贯穿海岸的陆上箭头制造错误联系。','bodo','air','DE',['de.2geb','de.luftwaffe'],['uk_ch12'],2,5)
event('narvik_recapture','05-28','盟军夺回纳尔维克','Recapture of Narvik','挪威与法国部队从罗姆巴克峡湾渡海攻击，波兰部队在安克内斯、拜斯峡湾方向从南翼推进，英国海军提供支援。德军向铁路和瑞典边界附近退却。盟军夺回城区，是重要的局部胜利；但法国战局已决定撤离，胜利未能转化为长期控制。','narvik','battle','FR',['fr.13dble','no.6div','pl.podhale','de.3geb_narvik'],['uk_ch13','no_army'],1,7,narration='On May twenty-eighth, Norwegian and French troops recaptured Narvik, while Polish troops attacked on the southern flank. Germany lost the town, but Allied evacuation orders were already in place.')
event('alphabet','06-04','Alphabet行动 · 北部撤运开始','Operation Alphabet','盟军主力开始从北部港口登船，计划将人员运回英国，随后在6月8日完成撤离。纳尔维克的攻城胜利没有改变撤运安排。海上撤离线与仍在内陆的挪军标记同时存在，说明盟军离开和挪威本土停止抵抗是不同的时间节点。','harstad','movement','UK',['uk.24','fr.13dble','pl.podhale'],['uk_ch14'],1,3,narration='Operation Alphabet evacuated Allied troops from northern Norway. The withdrawal was completed by June eighth, leaving Norway’s army without its foreign partners.')
event('government','06-07','王室与政府从特罗姆瑟赴英','Norwegian government goes into exile','挪威国王和政府在特罗姆瑟进行最后的本土政府会议，随后乘德文郡号离开，赴英国继续战争。海上轨迹只表示赴英方向。本土战局即将结束，但合法政府、海外部队与挪威抵抗并未随之消失，不能将流亡等同于政治上的投降。','tromso','political','NO',['uk.devonshire','no.6div'],['government_archive','uk_ch14'],1,4)
event('glorious','06-08','光荣号及护航舰被击沉','Loss of HMS Glorious','光荣号携返运飞机离开北部后，在挪威海外海遭德国沙恩霍斯特与格奈森瑙拦截。航母与Ardent、Acasta两艘驱逐舰沉没，造成严重人员损失。此时盟军主力撤运已接近完成，海战仍暴露了撤离行动的风险；沉船标记为概略海域。','glorious_sea','naval','DE',['uk.glorious'],['uk_ch14'],1,3,'18:00',narration='The carrier Glorious and her two escort destroyers were sunk by German warships on June eighth, during the withdrawal from Norway.')
event('end','06-10','本土战役结束 · 抵抗延续','End of the campaign in mainland Norway','盟军撤离后，挪威本土部队停止抵抗，德国建立对挪威的军事占领。6月10日标志这场本土战役结束，而不是挪威政府和海外部队退出战争。长海岸的港口、机场与海上基地落入德国控制，也为此后的北大西洋战争带来持续影响。','narvik','surrender','NO',['no.6div','de.3geb_narvik'],['no_army','uk_ch14'],1,1,narration='On June tenth, Norway’s mainland forces ceased resistance. The government in exile and Norwegian forces abroad continued the war.')
events.sort(key=lambda e:e['at'])
photo_index = json.loads((ROOT/'public/photos/index.json').read_text())
photo_map = {'e.namsos_bomb':'namsos-ruins','e.namsos_evacuate':'namsos-evacuation','e.second_narvik':'narvik-naval'}
for e in events:
    slug=photo_map.get(e['id'])
    photo=next(((key,v) for key,v in photo_index.items() if v['src']==f'photos/{slug}.webp'),None)
    if photo: e['photo']={'commons':photo[0],'caption':photo[1]['caption']}
save('src/data/events.json',events)

# State changes are discontinuities, never a precise national front. Land clipping happens in the inherited SDF engine.
def pocket(place,rx=.45,ry=.22):
    x,y=gaz[place]; return [[[x+rx*math.cos(a*math.pi/12),y+ry*math.sin(a*math.pi/12)] for a in range(24)]]
def corridor(a,b,width=.13):
    x,y=gaz[a]; xx,yy=gaz[b];dx=xx-x;dy=yy-y; length=math.hypot(dx,dy);nx=-dy/length*width;ny=dx/length*width
    return [[[x+nx,y+ny],[xx+nx,yy+ny],[xx-nx,yy-ny],[x-nx,y-ny]]]
states=[]
def frame(day,hr,de,al,note):
    states.append({'at':t(day,hr),'DE':de,'AL':al,'transition':('smooth' if day in ['04-23','04-30','05-10','05-25'] else 'step'),'note':note+' 控制区为据点及交通走廊示意，不是精确边界。','sources':['uk_ch3','uk_ch9','uk_ch13','uk_ch14','no_army'],'confidence':'medium'})
de=[];al=[]
frame('04-09','00:00',de,al,'登陆前；挪军控制范围不作整国精确推断。')
de=[pocket('bergen'),pocket('trondheim'),pocket('narvik',.17,.08)]
frame('04-09','08:00',de,al,'分散港口桥头堡；奥斯陆仍未着色。')
de=de+[pocket('stavanger'),pocket('kristiansand')]
frame('04-09','11:00',de,al,'西南沿海据点；海面保持独立。')
de=de+[pocket('oslo',.6,.3)]
frame('04-09','14:00',de,al,'首都失守；各港口尚未接通。')
frame('04-13','12:00',de,al,'德军驱逐舰被消灭，但纳尔维克城区仍由德军控制。')
al=[pocket('harstad',.3,.16),pocket('namsos',.3,.16)]
frame('04-16','12:00',de,al,'北部与中部盟军登陆。')
al=al+[pocket('andalsnes',.3,.16)]
frame('04-18','12:00',de,al,'中部南翼登陆。')
de=de+[corridor('oslo','lillehammer'),corridor('trondheim','steinkjer'),pocket('steinkjer',.25,.16)]
frame('04-23','12:00',de,al,'中部山谷与斯泰因谢尔作战走廊。')
de=de+[corridor('lillehammer','dombas'),corridor('dombas','storen'),corridor('storen','trondheim')]
frame('04-30','12:00',de,al,'中部陆路接通；不是连接纳尔维克的全国前线。')
al=[pocket('harstad',.3,.16),pocket('namsos',.3,.16)]
frame('05-02','12:00',de,al,'翁达尔斯内斯方向盟军撤离。')
al=[pocket('harstad',.3,.16)];de=de+[pocket('namsos',.35,.2),pocket('andalsnes',.35,.2)]
frame('05-03','12:00',de,al,'盟军退出中部，北部行动继续。')
de=de+[corridor('grong','mosjoen'),pocket('mosjoen',.3,.2),pocket('hemnesberget',.25,.16)]
frame('05-10','12:00',de,al,'第2山地师北进和海姆内斯贝格包抄。')
al=al+[pocket('bjerkvik',.08,.04),pocket('gratangen',.1,.04)]
frame('05-13','12:00',de,al,'比耶克维克盟军据点；纳尔维克城区仍由德军控制。')
de=de+[corridor('mosjoen','mo'),corridor('mo','saltdal')]
frame('05-25','12:00',de,al,'北部南翼迟滞；博德与纳尔维克之间不画连续推进。')
de=[p for p in de if p!=pocket('narvik',.17,.08)] + [pocket('bjornfjell',.09,.05)]
al=al+[pocket('narvik',.14,.055),pocket('ankenes',.1,.05),pocket('beisfjord',.08,.04)]
frame('05-28','12:00',de,al,'盟军夺回纳尔维克；德军退至边界附近。')
de=de+[pocket('bodo',.4,.25)]
frame('06-04','12:00',de,al,'北部撤离开始，盟军尚在港口。')
al=[];de=de+[pocket('narvik',.17,.08),pocket('harstad',.3,.16)]
frame('06-08','23:00',de,al,'盟军撤出；挪军内陆抵抗到6月10日。')
# National surrender is a status transition: the schematic islands remain rather than pretending a surveyed occupation polygon.
frame('06-10','12:00',de,al,'挪威本土战役结束，德国占领；全境行政控制由状态文字说明。')
for f in states:save('src/data/fronts/'+f['at'].replace(':','-')+'.json',f)
save('config/keyframes.json',{'keyframes':[f['at'] for f in states]})
save('src/data/pockets.json',[]);save('src/data/demarcation.json',[])
summaries={
 'DE':('德国','法尔肯霍斯特；迪特尔','分散登陆部队、后续步兵与山地兵','海军运输、空降、空运与陆路推进；拥有主要航空基地。'),
 'NO':('挪威','鲁格；弗莱舍','南部动员部队、北部第6师与岸防','分散动员与山谷迟滞，北部山区反攻；本土抵抗到6月10日。'),
 'UK':('英国','麦克西；科克伯爵','海军、146/148/15/24旅、RAF','主导海军反制、盟军运输与撤运，参与中部和北部地面作战。'),
 'FR':('法国','贝图阿尔','山地猎兵、第13外籍军团半旅','参与中部登陆、北部山地行动和比耶克维克/纳尔维克反攻。'),
 'PL':('波兰','博胡什-希什科','独立山地旅等海外力量','本图重点显示北部独立山地旅的南翼攻势；未逐舰列出波兰海军。'),
}
save('src/data/forces_summary.json',{'sides':{k:{'name':v[0],'commander':v[1],'divisions':v[2],'note':v[3],'losses':{'killed':'未统一统计','wounded':'未统一统计'}} for k,v in summaries.items()},'sources':['uk_chb','no_army']})
save('src/data/equipment.json',[])
print('Built campaign:',len(places),'places;',len(units),'units;',len(routes),'actions;',len(states),'control states;',len(events),'events;',len(sources),'sources.')
