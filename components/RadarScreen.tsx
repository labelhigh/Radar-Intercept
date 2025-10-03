import React from 'react';
import { Enemy, FriendlyMissile, Explosion } from '../types';
import { RADAR_RADIUS, SCAN_FADE_TIME_MS } from '../constants';

interface RadarScreenProps {
    enemies: Enemy[];
    neutrals: Enemy[];
    missiles: FriendlyMissile[];
    explosions: Explosion[];
    lockedTargetId: string | null;
    scanAngle: number;
    onLockTarget: (id: string | null) => void;
}

const RadarGrid = React.memo(() => (
    <>
        {/* Radar Circles */}
        {[0.25, 0.5, 0.75, 1].map(r => (
            <circle key={r} cx="50%" cy="50%" r={`${r * 50}%`} fill="none" stroke="rgba(101, 163, 13, 0.15)" strokeWidth="1" />
        ))}
        {/* Radar Lines */}
        {[0, 45, 90, 135].map(angle => (
            <line key={angle} x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(101, 163, 13, 0.15)" strokeWidth="1" transform={`rotate(${angle} 250 250)`} />
        ))}
        <circle cx="50%" cy="50%" r="5" fill="#a3e635" />
    </>
));

// FIX: The original `Unit` component accessed properties specific to the `Enemy` type (`signatureSize`, `lastScanTime`, `isVisible`)
// on a union type `Enemy | FriendlyMissile`, causing TypeScript errors. The logic has been refactored
// to perform all rendering for `Enemy` types within the `'lastScanTime' in unit` type guard block. This ensures
// `unit` is correctly narrowed to the `Enemy` type, resolving the property access errors.
const Unit: React.FC<{unit: Enemy | FriendlyMissile, isLocked: boolean, onClick: () => void, isNeutral?: boolean}> = ({unit, isLocked, onClick, isNeutral = false}) => {
    const toSvgX = (x: number) => 50 + (x / RADAR_RADIUS) * 50;
    const toSvgY = (y: number) => 50 - (y / RADAR_RADIUS) * 50;
    
    if ('lastScanTime' in unit) { // It's an Enemy or Neutral
        const timeSinceScan = Date.now() - unit.lastScanTime;
        const isNormallyVisible = unit.isVisible && unit.lastScanTime > 0 && timeSinceScan < SCAN_FADE_TIME_MS;

        // A locked target is always visible. Otherwise, it's only visible if it's not stealthed and has been scanned recently.
        if (!isLocked && !isNormallyVisible) {
            return null;
        }

        const opacity = isLocked ? 1 : Math.max(0, 1 - (timeSinceScan / SCAN_FADE_TIME_MS));

        const baseColor = isNeutral ? 'fill-green-400' : 'fill-lime-400';
        const strokeColor = isLocked ? 'stroke-yellow-400' : (isNeutral ? 'stroke-green-700' : 'stroke-red-800');
        const shape = unit.type === 'Civilian' 
            ? <rect x={`${toSvgX(unit.x) - 1}%`} y={`${toSvgY(unit.y) - 1}%`} width="2%" height="2%" className={`${baseColor} ${strokeColor}`} strokeWidth="0.5"/>
            : <circle cx={`${toSvgX(unit.x)}%`} cy={`${toSvgY(unit.y)}%`} r={`${unit.signatureSize}%`} className={`${baseColor} ${strokeColor} transition-all duration-100`} strokeWidth="0.5" />;
        
        return (
            <g onClick={onClick} cursor="pointer" style={{ opacity }}>
                {shape}
                {(isLocked || unit.lastScanTime > 0) && ( // Show text if locked or recently scanned
                    <text x={`${toSvgX(unit.x) + 1.5}%`} y={`${toSvgY(unit.y) + 0.5}%`} fontSize="6" className="fill-lime-300 font-mono pointer-events-none">
                        {unit.type.substring(0, 4).toUpperCase()}
                    </text>
                )}
            </g>
        );

    } else { // It's a friendly missile - always visible
        return (
            <g onClick={onClick} cursor="pointer">
                 <circle cx={`${toSvgX(unit.x)}%`} cy={`${toSvgY(unit.y)}%`} r="0.5%" className="fill-cyan-400" />
            </g>
        );
    }
};

export const RadarScreen: React.FC<RadarScreenProps> = ({ enemies, neutrals, missiles, explosions, lockedTargetId, scanAngle, onLockTarget }) => {
    const rangeRings = [
        { r: 0.25, label: '50km' },
        { r: 0.5, label: '100km' },
        { r: 0.75, label: '150km' },
    ];

    return (
        <div className="w-full h-full aspect-square max-h-full mx-auto relative" onClick={(e) => {
            if (e.target === e.currentTarget) onLockTarget(null);
        }}>
            <svg viewBox="0 0 500 500" className="w-full h-full">
                <RadarGrid />
                {rangeRings.map(ring => (
                    <text key={ring.label} x="51%" y={`${50 - (ring.r * 50)}%`} dy="-2" fontSize="8" fill="rgba(163, 230, 53, 0.3)" className="font-mono">{ring.label}</text>
                ))}
                {neutrals.map(unit => (
                    <Unit key={unit.id} unit={unit} isLocked={unit.id === lockedTargetId} onClick={() => onLockTarget(unit.id)} isNeutral={true} />
                ))}
                {enemies.map(unit => (
                    <Unit key={unit.id} unit={unit} isLocked={unit.id === lockedTargetId} onClick={() => onLockTarget(unit.id)} />
                ))}
                {missiles.map(missile => (
                    <Unit key={missile.id} unit={missile} isLocked={false} onClick={() => {}} />
                ))}

                {explosions.map(exp => {
                     const toSvgX = (x: number) => 50 + (x / RADAR_RADIUS) * 50;
                     const toSvgY = (y: number) => 50 - (y / RADAR_RADIUS) * 50;
                     const radius = (exp.radius / RADAR_RADIUS) * 50;
                     return (
                        <circle
                            key={exp.id}
                            cx={`${toSvgX(exp.x)}%`}
                            cy={`${toSvgY(exp.y)}%`}
                            r={`${radius}%`}
                            className="fill-orange-400/70"
                            style={{ animation: 'explosion-fade 0.5s forwards' }}
                        />
                     )
                })}
            </svg>
            <div
                className="scan-wedge"
                style={{ transform: `rotate(${scanAngle}deg)`, pointerEvents: 'none' }}
            ></div>
            <style>{`
                @keyframes explosion-fade {
                    from { opacity: 0.7; transform: scale(0.1); }
                    to { opacity: 0; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};