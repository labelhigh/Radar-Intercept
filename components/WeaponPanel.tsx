
import React from 'react';
import { WeaponType } from '../types';
import { WEAPON_STATS } from '../constants';

interface WeaponPanelProps {
    ammo: Record<WeaponType, number>;
    selectedWeapon: WeaponType;
    onSelectWeapon: (weapon: WeaponType) => void;
}

const WEAPON_ORDER: WeaponType[] = [WeaponType.Falcon, WeaponType.Aegis, WeaponType.Viper, WeaponType.Grizzly, WeaponType.Titan, WeaponType.EMP];

export const WeaponPanel: React.FC<WeaponPanelProps> = ({ ammo, selectedWeapon, onSelectWeapon }) => {
    return (
        <div className="p-4 bg-slate-900/50 border border-green-400/30 rounded-lg flex-grow">
            <h2 className="text-green-300 text-lg mb-4 text-center tracking-widest">WEAPON SYSTEMS</h2>
            <div className="space-y-3">
                {WEAPON_ORDER.map(type => {
                    const stats = WEAPON_STATS[type];
                    const isSelected = selectedWeapon === type;
                    const isDisabled = ammo[type] <= 0;

                    return (
                        <button
                            key={type}
                            onClick={() => onSelectWeapon(type)}
                            disabled={isDisabled}
                            className={`w-full text-left p-3 rounded-md transition-all duration-200 border-2 ${
                                isSelected 
                                    ? 'bg-green-500/30 border-green-400 text-white' 
                                    : 'bg-slate-800/50 border-transparent hover:border-green-500/50'
                            } ${
                                isDisabled 
                                    ? 'opacity-50 cursor-not-allowed'
                                    : ''
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-md">{stats.name.toUpperCase()}</span>
                                <span className="text-xl font-mono bg-black/30 px-2 rounded">{ammo[type]}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{stats.description}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};