
import React, { useState, useEffect } from 'react';
import { Enemy } from '../types';

interface TargetInfoPanelProps {
    target: Enemy | null;
}

const InfoBox: React.FC<{ label: string; value: string | number; valueClassName?: string }> = ({ label, value, valueClassName = '' }) => (
    <div className="flex flex-col justify-center p-2 rounded bg-slate-800/50">
        <span className="text-slate-400 text-xs tracking-widest">{label}</span>
        <span className={`font-mono text-xl truncate ${valueClassName}`}>{value}</span>
    </div>
);

const marqueeMessages = [
    "TARGET INFO",
    "SYSTEM STATUS: NOMINAL",
    "AWAITING COMMAND",
    "SCANNING FOR THREATS",
    "WEAPONS HOT",
    "BASE INTEGRITY MONITOR: ONLINE",
    "RADAR SWEEP IN PROGRESS",
    "MONITORING AIRSPACE",
    "NO NEW CONTACTS",
    "THREAT LEVEL: LOW",
    "STANDBY FOR ORDERS",
    "AMMUNITION CHECK: PASSED",
    "COMMUNICATIONS LINK: SECURE",
    "SATELLITE UPLINK: ACTIVE",
    "TRACKING MULTIPLE SIGNATURES",
    "CAUTION: HOSTILE ACTIVITY DETECTED",
    "VERIFY TARGET IFF",
    "DEFENSE GRID ONLINE",
    "ENGAGEMENT PROTOCOLS ENABLED",
    "ALL SYSTEMS OPERATIONAL"
];

export const TargetInfoPanel: React.FC<TargetInfoPanelProps> = ({ target }) => {
    const [marqueeIndex, setMarqueeIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setMarqueeIndex(prevIndex => (prevIndex + 1) % marqueeMessages.length);
        }, 10000); // Change message every 10 seconds

        return () => clearInterval(intervalId);
    }, []);

    const threatDisplay = target && target.type !== 'Civilian' 
        ? '█'.repeat(target.threatLevel) + '░'.repeat(5 - target.threatLevel) 
        : '░'.repeat(5);
    const threatColor = target && target.type !== 'Civilian' ? 'text-amber-500' : 'text-slate-600';

    return (
        <div className="p-4 bg-slate-900/50 border border-green-400/30 rounded-lg h-48 flex flex-col">
            <div className="relative h-6 mb-4 flex-shrink-0 overflow-hidden">
                <h2 
                    key={marqueeIndex}
                    className="absolute whitespace-nowrap text-green-300 text-lg tracking-widest"
                    style={{ animation: 'marquee 20s linear infinite' }}
                >
                    {marqueeMessages[marqueeIndex]}
                </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 flex-grow">
                <InfoBox 
                    label="ID" 
                    value={target ? target.id.substring(0, 8).toUpperCase() : '--------'} 
                    valueClassName="text-lime-300"
                />
                <InfoBox 
                    label="TYPE" 
                    value={target ? target.type : '----'} 
                    valueClassName={target?.type === 'Civilian' ? 'text-green-400' : 'text-lime-400'} 
                />
                <InfoBox 
                    label="SPEED" 
                    value={target ? `${(target.speed * 10).toFixed(0)} kps` : '---'} 
                    valueClassName="text-yellow-300"
                />
                <InfoBox 
                    label="THREAT" 
                    value={threatDisplay} 
                    valueClassName={threatColor} 
                />
            </div>
            <style>{`
                @keyframes marquee {
                    from { left: 100%; }
                    to { left: -200%; }
                }
            `}</style>
        </div>
    );
};
