"""一次生成北方分区全部数据：python3 campaigns/barbarossa-1941/pipeline/build/north_all.py"""
import north_places, north_de, north_su, north_fi, north_routes, north_events

if __name__ == '__main__':
    north_places.build()
    north_de.build()
    north_su.build()
    north_fi.build()
    north_routes.build()
    north_events.build()
