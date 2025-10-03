
import { GameState, WeaponType, EnemyType } from './types';

export const RADAR_RADIUS = 200;
export const SCAN_WIDTH_DEGREES = 30;
export const SCAN_FADE_TIME_MS = 3000; // 3 seconds for phosphor decay effect

export const INITIAL_GAME_STATE: GameState = {
    status: 'start_menu',
    score: 0,
    level: 1,
    wave: 0,
    baseHealth: 100,
    time: 0,
    timeToImpact: Infinity,
    scanAngle: 0,
    enemies: [],
    friendlyMissiles: [],
    neutrals: [],
    explosions: [],
    lockedTargetId: null,
    selectedWeapon: WeaponType.Falcon,
    ammo: {
        [WeaponType.Falcon]: 20,
        [WeaponType.Grizzly]: 5,
        [WeaponType.Aegis]: 10,
        [WeaponType.EMP]: 3,
        [WeaponType.Viper]: 15,
        [WeaponType.Titan]: 2,
    },
};

export const WEAPON_STATS: Record<WeaponType, { name: string; description: string; speed: number; blastRadius: number; homingStrength: number; }> = {
    [WeaponType.Falcon]: { name: "Falcon", description: "Slow but plentiful missile. Best for predictable targets.", speed: 0.4, blastRadius: 15, homingStrength: 0.9 },
    [WeaponType.Grizzly]: { name: "Grizzly", description: "Very fast missile with a large blast radius. For bombers/swarms.", speed: 1.4, blastRadius: 50, homingStrength: 0.5 },
    [WeaponType.Aegis]: { name: "Aegis", description: "A standard, agile interceptor for fast-moving threats.", speed: 1.0, blastRadius: 10, homingStrength: 1.0 },
    [WeaponType.EMP]: { name: "EMP", description: "Destroys all units in a massive electronic burst.", speed: 1.7, blastRadius: 60, homingStrength: 0.6 },
    [WeaponType.Viper]: { name: "Viper", description: "A nimble micro-missile for agile single targets.", speed: 0.6, blastRadius: 8, homingStrength: 0.95 },
    [WeaponType.Titan]: { name: "Titan", description: "Devastating warhead, massive blast. Extremely fast deployment.", speed: 2.0, blastRadius: 80, homingStrength: 0.3 },
};

export const ENEMY_STATS: Record<EnemyType, { speed: number; threatLevel: number; signatureSize: number; }> = {
    [EnemyType.Fighter]: { speed: 0.1, threatLevel: 2, signatureSize: 0.8 },
    [EnemyType.Bomber]: { speed: 0.05, threatLevel: 4, signatureSize: 1.5 },
    [EnemyType.DroneSwarm]: { speed: 0.04, threatLevel: 1, signatureSize: 0.5 }, // swarm is multiple units
    [EnemyType.StealthFighter]: { speed: 0.12, threatLevel: 5, signatureSize: 0.6 },
    [EnemyType.Civilian]: { speed: 0.05, threatLevel: 0, signatureSize: 1.2 },
    [EnemyType.Missile]: { speed: 0.2, threatLevel: 3, signatureSize: 0.4 },
};

interface WaveGroup {
    type: EnemyType;
    count: number;
}

interface LevelDefinition {
    waves: WaveGroup[][];
}

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
    { // Level 1
        waves: [
            [{ type: EnemyType.Fighter, count: 2 }],
            [{ type: EnemyType.Fighter, count: 3 }],
            [{ type: EnemyType.Bomber, count: 1 }, { type: EnemyType.Fighter, count: 2 }],
            [{ type: EnemyType.DroneSwarm, count: 5 }],
            [{ type: EnemyType.Bomber, count: 2 }, { type: EnemyType.StealthFighter, count: 1 }],
        ]
    }
];