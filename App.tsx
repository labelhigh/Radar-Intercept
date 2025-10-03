
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { RadarScreen } from './components/RadarScreen';
import { WeaponPanel } from './components/WeaponPanel';
import { TargetInfoPanel } from './components/TargetInfoPanel';
import { StatusBar } from './components/StatusBar';
import { GameOverlay } from './components/GameOverlay';
import { useGameLoop } from './hooks/useGameLoop';
import { GameState, WeaponType, Enemy, Explosion, FriendlyMissile } from './types';
import { INITIAL_GAME_STATE, WEAPON_STATS } from './constants';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
    const audioCtx = useRef<AudioContext | null>(null);

    const startGame = useCallback(() => {
        if (!audioCtx.current) {
            // Create audio context on first user gesture
            audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        setGameState({ ...INITIAL_GAME_STATE, status: 'playing' });
    }, []);

    const playHitSound = useCallback(() => {
        if (!audioCtx.current) return;
        const oscillator = audioCtx.current.createOscillator();
        const gainNode = audioCtx.current.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.current.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, audioCtx.current.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioCtx.current.currentTime);

        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.current.currentTime + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.15);

        oscillator.start(audioCtx.current.currentTime);
        oscillator.stop(audioCtx.current.currentTime + 0.15);
    }, []);

    const playScanSound = useCallback(() => {
        if (!audioCtx.current) return;
        const oscillator = audioCtx.current.createOscillator();
        const gainNode = audioCtx.current.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.current.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(150, audioCtx.current.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioCtx.current.currentTime);
        
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.2);

        oscillator.start(audioCtx.current.currentTime);
        oscillator.stop(audioCtx.current.currentTime + 0.2);
    }, []);

    const playLaunchSound = useCallback(() => {
        if (!audioCtx.current) return;
        const oscillator = audioCtx.current.createOscillator();
        const gainNode = audioCtx.current.createGain();
        const now = audioCtx.current.currentTime;

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.current.destination);

        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(0.3, now + 0.05);

        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(1500, now + 0.3);

        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }, []);

    const playDetectSound = useCallback(() => {
        if (!audioCtx.current) return;
        const oscillator = audioCtx.current.createOscillator();
        const gainNode = audioCtx.current.createGain();
        const now = audioCtx.current.currentTime;

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.current.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, now);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }, []);

    const handleLockTarget = useCallback((id: string | null) => {
        setGameState(prev => ({ ...prev, lockedTargetId: id }));
    }, []);

    const handleSelectWeapon = useCallback((weapon: WeaponType) => {
        setGameState(prev => ({ ...prev, selectedWeapon: weapon }));
    }, []);

    const handleLaunchMissile = useCallback(() => {
        setGameState(prev => {
            if (!prev.lockedTargetId || prev.ammo[prev.selectedWeapon] <= 0) {
                return prev;
            }

            const newMissile: FriendlyMissile = {
                id: `m_${Date.now()}_${Math.random()}`,
                x: 0,
                y: 0,
                angle: 0,
                speed: WEAPON_STATS[prev.selectedWeapon].speed,
                isAlive: true,
                type: prev.selectedWeapon,
                targetId: prev.lockedTargetId,
                blastRadius: WEAPON_STATS[prev.selectedWeapon].blastRadius,
                homingStrength: WEAPON_STATS[prev.selectedWeapon].homingStrength,
                fuse: 10000, // 10 seconds
            };
            
            return {
                ...prev,
                // FIX: The spread operator was incorrectly using `prev` (the whole state) instead of `prev.ammo` when updating the ammo count.
                // This caused a type mismatch. Changed to spread `prev.ammo` to correctly update the ammo record.
                ammo: { ...prev.ammo, [prev.selectedWeapon]: prev.ammo[prev.selectedWeapon] - 1 },
                friendlyMissiles: [...prev.friendlyMissiles, newMissile],
            };
        });
    }, []);

    useGameLoop(gameState.status === 'playing', setGameState, playHitSound, playScanSound, playDetectSound);

    // Effect to play launch sound when a missile is fired
    const missilesCountRef = useRef(gameState.friendlyMissiles.length);
    useEffect(() => {
        if (gameState.status === 'playing' && gameState.friendlyMissiles.length > missilesCountRef.current) {
            playLaunchSound();
        }
        missilesCountRef.current = gameState.friendlyMissiles.length;
    }, [gameState.friendlyMissiles, gameState.status, playLaunchSound]);


    const lockedTarget = useMemo(() => {
        return gameState.enemies.find(e => e.id === gameState.lockedTargetId) ||
               gameState.neutrals.find(n => n.id === gameState.lockedTargetId) ||
               null;
    }, [gameState.enemies, gameState.neutrals, gameState.lockedTargetId]);

    return (
        <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center p-4 lg:p-8 select-none">
            <div className="w-full h-full flex flex-col lg:flex-row gap-4">
                <div className="flex-grow flex flex-col gap-4">
                    <StatusBar
                        score={gameState.score}
                        wave={gameState.wave}
                        baseHealth={gameState.baseHealth}
                        timeToImpact={gameState.timeToImpact}
                    />
                    <div className="relative flex-grow border-2 border-green-400/30 bg-black/50 rounded-lg overflow-hidden">
                        <RadarScreen
                            enemies={gameState.enemies}
                            neutrals={gameState.neutrals}
                            missiles={gameState.friendlyMissiles}
                            explosions={gameState.explosions}
                            lockedTargetId={gameState.lockedTargetId}
                            scanAngle={gameState.scanAngle}
                            onLockTarget={handleLockTarget}
                        />
                    </div>
                    <TargetInfoPanel target={lockedTarget} />
                </div>
                <div className="w-full lg:w-72 flex flex-col gap-4 lg:shrink-0">
                    <WeaponPanel
                        ammo={gameState.ammo}
                        selectedWeapon={gameState.selectedWeapon}
                        onSelectWeapon={handleSelectWeapon}
                    />
                    <button
                        onClick={handleLaunchMissile}
                        disabled={!gameState.lockedTargetId || gameState.ammo[gameState.selectedWeapon] <= 0 || (lockedTarget && lockedTarget.type === 'Civilian')}
                        className="w-full h-24 text-3xl font-bold text-white bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg shadow-lg transition-all duration-200 border-b-4 border-green-900 disabled:border-gray-800 active:border-b-0 active:translate-y-1"
                    >
                        LAUNCH
                    </button>
                </div>
            </div>
            {gameState.status !== 'playing' && (
                <GameOverlay status={gameState.status} score={gameState.score} onStart={startGame} />
            )}
        </div>
    );
};

export default App;
