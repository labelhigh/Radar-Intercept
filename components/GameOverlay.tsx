
import React from 'react';
import { GameStatus } from '../types';

interface GameOverlayProps {
    status: GameStatus;
    score: number;
    onStart: () => void;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({ status, score, onStart }) => {
    const messages = {
        start_menu: { title: "RADAR INTERCEPT", subtitle: "Protect the base from incoming threats." },
        level_complete: { title: "LEVEL COMPLETE", subtitle: `Score: ${score}` },
        game_over: { title: "GAME OVER", subtitle: `Final Score: ${score}` },
    };

    const message = messages[status];

    return (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
            <h1 className="text-6xl font-bold text-green-400 mb-4 tracking-widest">{message.title}</h1>
            <p className="text-xl text-slate-300 mb-8">{message.subtitle}</p>
            <button
                onClick={onStart}
                className="px-8 py-4 text-2xl font-bold text-black bg-yellow-400 hover:bg-yellow-300 rounded-lg shadow-lg transition-all duration-200 border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1"
            >
                {status === 'start_menu' ? 'START GAME' : 'PLAY AGAIN'}
            </button>
            { status === 'start_menu' &&
                <div className="mt-12 text-center text-slate-500 max-w-2xl">
                    <h3 className="text-lg text-slate-300 mb-2">How to Play</h3>
                    <p>1. Click on green blips on the radar to lock them.</p>
                    <p>2. Select the appropriate weapon from the panel on the right.</p>
                    <p>3. Press the LAUNCH button to fire a missile.</p>
                    <p>4. Do not attack friendly neutral targets.</p>
                    <p>5. Protect the base at the center at all costs!</p>
                </div>
            }
        </div>
    );
};