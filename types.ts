
export enum EnemyType {
  Fighter = 'Fighter',
  Bomber = 'Bomber',
  DroneSwarm = 'DroneSwarm',
  StealthFighter = 'StealthFighter',
  Civilian = 'Civilian',
  Missile = 'Missile', // Enemy missile
}

export enum WeaponType {
  Falcon = 'Falcon',
  Grizzly = 'Grizzly',
  Aegis = 'Aegis',
  EMP = 'EMP',
  Viper = 'Viper',
  Titan = 'Titan',
}

export type GameStatus = 'start_menu' | 'playing' | 'level_complete' | 'game_over';

export interface Unit {
  id: string;
  x: number; // position on radar, center is 0,0
  y: number;
  angle: number; // degrees from north
  speed: number; // units per frame
  isAlive: boolean;
}

export interface Enemy extends Unit {
  type: EnemyType;
  threatLevel: number;
  signatureSize: number; // for radar display
  isVisible: boolean; // For stealth
  lastScanTime: number; // timestamp of last radar sweep hit
  evasion: number; // probability to evade
}

export interface FriendlyMissile extends Unit {
  type: WeaponType;
  targetId: string;
  blastRadius: number;
  homingStrength: number;
  fuse: number; // time until detonation/disappearance in ms
}

export interface Explosion {
  id: string;
  x: number;
  y: number;
  radius: number;
  createdAt: number;
  duration: number; // in ms
}

export interface GameState {
  status: GameStatus;
  score: number;
  level: number;
  wave: number;
  baseHealth: number;
  time: number;
  timeToImpact: number;
  scanAngle: number;
  enemies: Enemy[];
  friendlyMissiles: FriendlyMissile[];
  neutrals: Enemy[];
  explosions: Explosion[];
  lockedTargetId: string | null;
  selectedWeapon: WeaponType;
  ammo: Record<WeaponType, number>;
}