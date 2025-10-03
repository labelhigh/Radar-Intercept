import React, { useEffect, useRef } from 'react';
import { GameState, Enemy, FriendlyMissile, WeaponType, Explosion } from '../types';
import { RADAR_RADIUS, LEVEL_DEFINITIONS, ENEMY_STATS, WEAPON_STATS, SCAN_WIDTH_DEGREES, SCAN_FADE_TIME_MS } from '../constants';

const FRAME_TIME = 1000 / 60; // 60 FPS
const SCAN_DURATION_MS = 12000; // 12 seconds for a full 360-degree scan

export const useGameLoop = (
    isPlaying: boolean,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    playHitSound: () => void,
    playScanSound: () => void,
    playDetectSound: () => void
) => {
    const lastFrameTime = useRef<number>(Date.now());
    
    useEffect(() => {
        if (!isPlaying) return;

        let animationFrameId: number;
        
        const gameLoop = () => {
            const now = Date.now();
            const deltaTime = (now - lastFrameTime.current);

            if (deltaTime >= FRAME_TIME) {
                const deltaInSeconds = deltaTime / 1000;
                lastFrameTime.current = now;
                
                setGameState(prev => {
                    if (!prev || prev.status !== 'playing') return prev;

                    let nextState = { ...prev };

                    // 1. Update Scan Angle
                    const oldScanAngle = prev.scanAngle;
                    const angleIncrement = (360 / SCAN_DURATION_MS) * deltaTime;
                    const newScanAngle = (oldScanAngle + angleIncrement) % 360;
                    if (newScanAngle < oldScanAngle) {
                        playScanSound();
                    }
                    nextState.scanAngle = newScanAngle;


                    // 2. Update last scan time for enemies and neutrals, and play detection sound
                    const unitsToScan = [...nextState.enemies, ...nextState.neutrals];
                    let wasTargetDetectedInFrame = false;

                    unitsToScan.forEach(unit => {
                        const unitAngle = (Math.atan2(unit.x, unit.y) * 180 / Math.PI + 360) % 360;
                        
                        let diff = nextState.scanAngle - unitAngle;
                        if (diff > 180) diff -= 360;
                        if (diff < -180) diff += 360;

                        const wasVisible = (now - unit.lastScanTime) < SCAN_FADE_TIME_MS;

                        if (Math.abs(diff) < SCAN_WIDTH_DEGREES / 2) {
                           if (!wasVisible && unit.lastScanTime > 0) { // Play sound if it just became visible again
                               wasTargetDetectedInFrame = true;
                           }
                           unit.lastScanTime = now;
                        }
                    });

                    if (wasTargetDetectedInFrame) {
                        playDetectSound(); // Play one sound even if multiple are detected at once to avoid cacophony
                    }


                    // 3. Move Enemies and Neutrals
                    const updateUnit = (unit: Enemy): Enemy => {
                        const dx = -unit.x;
                        const dy = -unit.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 1) return unit; // Avoid division by zero if at center
                        const moveX = (dx / dist) * unit.speed;
                        const moveY = (dy / dist) * unit.speed;
                        return { ...unit, x: unit.x + moveX, y: unit.y + moveY };
                    };
                    nextState.enemies = nextState.enemies.map(updateUnit);
                    nextState.neutrals = nextState.neutrals.map(updateUnit);

                    // 4. Move Missiles
                    let newMissiles: FriendlyMissile[] = [];
                    for (const missile of nextState.friendlyMissiles) {
                        const target = nextState.enemies.find(e => e.id === missile.targetId);
                        if (!target || !missile.isAlive) continue;

                        const dx = target.x - missile.x;
                        const dy = target.y - missile.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < 1) continue;

                        const moveX = (dx / dist) * missile.speed;
                        const moveY = (dy / dist) * missile.speed;
                        
                        let updatedMissile = { ...missile, x: missile.x + moveX, y: missile.y + moveY };
                        newMissiles.push(updatedMissile);
                    }
                    nextState.friendlyMissiles = newMissiles;
                    
                    // 5. Handle Collisions and Hits
                    let newExplosions: Explosion[] = [...nextState.explosions];
                    let hitEnemyIds = new Set<string>();

                    for (const missile of nextState.friendlyMissiles) {
                        const target = nextState.enemies.find(e => e.id === missile.targetId);
                        if (!target || !missile.isAlive) continue;
                        
                        const dist = Math.hypot(missile.x - target.x, missile.y - target.y);
                        if (dist < 10) { // Proximity fuse
                            missile.isAlive = false;
                            newExplosions.push({ id: `exp_${Date.now()}`, x: missile.x, y: missile.y, radius: missile.blastRadius, createdAt: Date.now(), duration: 500 });

                            // Guaranteed kill on the primary target.
                            hitEnemyIds.add(target.id);

                            // Then, check for collateral damage on ALL enemies within the blast radius.
                            nextState.enemies.forEach(enemy => {
                                if (Math.hypot(missile.x - enemy.x, missile.y - enemy.y) < missile.blastRadius) {
                                    hitEnemyIds.add(enemy.id);
                                }
                            });
                        }
                    }

                    if (hitEnemyIds.size > 0) {
                        playHitSound();
                        nextState.enemies = nextState.enemies.filter(e => !hitEnemyIds.has(e.id));
                        nextState.score += hitEnemyIds.size * 10;
                    }

                    // 6. Clean up dead things
                    nextState.friendlyMissiles = nextState.friendlyMissiles.filter(m => m.isAlive);
                    nextState.explosions = newExplosions.filter(exp => Date.now() - exp.createdAt < exp.duration);
                    
                    // 7. Check for base impact
                    nextState.enemies.forEach(enemy => {
                        if (Math.hypot(enemy.x, enemy.y) < 5) {
                            nextState.baseHealth -= 10;
                            enemy.isAlive = false;
                        }
                    });
                    nextState.enemies = nextState.enemies.filter(e => e.isAlive);
                    
                    // 8. Check win/loss conditions
                    if (nextState.baseHealth <= 0) {
                        return { ...nextState, status: 'game_over' };
                    }
                    
                    // New: Check for out of ammo
                    // FIX: Operator '<=' cannot be applied to types 'unknown' and 'number'.
                    // Explicitly typing the accumulator and value in the reduce function ensures
                    // `totalAmmo` is correctly inferred as a number, resolving the issue.
                    const totalAmmo = Object.values(nextState.ammo).reduce((a: number, b: number) => a + b, 0);
                    if (totalAmmo <= 0 && nextState.friendlyMissiles.length === 0 && nextState.enemies.length > 0) {
                        return { ...nextState, status: 'game_over' };
                    }

                    if (nextState.enemies.length === 0 && LEVEL_DEFINITIONS[nextState.level-1].waves.length === nextState.wave) {
                         // This is a simplification; a more complex game would handle level progression
                        return { ...nextState, status: 'game_over', score: nextState.score + nextState.baseHealth * 10 };
                    }

                    // 9. Spawn new wave
                    if (nextState.enemies.length === 0) {
                        const levelDef = LEVEL_DEFINITIONS[nextState.level - 1];
                        if (levelDef && nextState.wave < levelDef.waves.length) {
                            const newWave = nextState.wave + 1;
                            const waveDef = levelDef.waves[newWave - 1];
                            const newEnemies: Enemy[] = [];
                            waveDef.forEach(group => {
                                for(let i = 0; i < group.count; i++) {
                                    const angle = Math.random() * 360;
                                    const rad = angle * (Math.PI / 180);
                                    const stats = ENEMY_STATS[group.type];
                                    const spawnRadius = RADAR_RADIUS * 1.2;
                                    newEnemies.push({
                                        id: `${group.type}_${Date.now()}_${i}`,
                                        x: Math.cos(rad) * spawnRadius,
                                        y: Math.sin(rad) * spawnRadius,
                                        angle,
                                        speed: stats.speed,
                                        isAlive: true,
                                        type: group.type,
                                        threatLevel: stats.threatLevel,
                                        signatureSize: stats.signatureSize,
                                        isVisible: true,
                                        evasion: 0,
                                        lastScanTime: 0,
                                    });
                                }
                            });
                            return { ...nextState, wave: newWave, enemies: newEnemies };
                        }
                    }

                    // 10. Update stealth fighter visibility
                    nextState.enemies = nextState.enemies.map(e => {
                        if (e.type === 'StealthFighter') {
                            const distFromCenter = Math.hypot(e.x, e.y);
                            // Only allow stealth flickering if the enemy is inside the radar radius
                            if (distFromCenter < RADAR_RADIUS) {
                                if (Math.random() < 0.02) {
                                    e.isVisible = !e.isVisible;
                                }
                            } else {
                                // If outside the radius, it must be visible
                                e.isVisible = true;
                            }
                        }
                        return e;
                    });
                    
                    // 11. Calculate time to impact
                    let minTime = Infinity;
                    nextState.enemies.forEach(e => {
                        const dist = Math.hypot(e.x, e.y);
                        const time = dist / e.speed / 60; // in seconds
                        if (time < minTime) minTime = time;
                    });
                    nextState.timeToImpact = minTime;

                    return nextState;
                });
            }

            animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);

    }, [isPlaying, setGameState, playHitSound, playScanSound, playDetectSound]);
};