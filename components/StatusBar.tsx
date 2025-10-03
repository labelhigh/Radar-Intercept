
import React from 'react';

interface StatusBarProps {
    score: number;
    wave: number;
    baseHealth: number;
    timeToImpact: number;
}

const StatBox: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className }) => (
    <div className={`flex flex-col items-center justify-center p-2 rounded-md bg-slate-900/50 border border-green-400/30 ${className}`}>
        <span className="text-xs text-green-300 tracking-widest">{label}</span>
        <span className="text-2xl font-bold font-mono">{value}</span>
    </div>
);

export const StatusBar: React.FC<StatusBarProps> = ({ score, wave, baseHealth, timeToImpact }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="SCORE" value={score.toString().padStart(6, '0')} className="text-lime-400" />
            <StatBox label="WAVE" value={wave} className="text-yellow-400" />
            <StatBox label="BASE HEALTH" value={`${baseHealth}%`} className={baseHealth > 50 ? "text-lime-400" : "text-amber-500"} />
            <StatBox label="IMPACT IN" value={timeToImpact < Infinity ? timeToImpact.toFixed(1) + 's' : 'N/A'} className="text-amber-500" />
        </div>
    );
};