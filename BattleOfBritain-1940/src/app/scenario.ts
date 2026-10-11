import config from '../../config/scenario.json';
import type { Side, LonLat } from '../schema';
export const SCENARIO = { ...config, sides: config.sides as Side[], focus: config.focus as LonLat };
