import React from 'react';
import Avatar from '../Avatar';

function getTeamName(match, side) {
    const nameKey = side === 'home' ? 'home_team_name' : 'away_team_name';
    const idKey = side === 'home' ? 'home_team_id' : 'away_team_id';
    const otherIdKey = side === 'home' ? 'away_team_id' : 'home_team_id';

    if (match[nameKey]) return match[nameKey];
    if (!match[idKey] && match[otherIdKey]) return 'BYE';
    return 'TBD';
}

export default function BracketMatch({ match, isFinal }) {
    const isDone = match.status === 'completed';
    const homeName = getTeamName(match, 'home');
    const awayName = getTeamName(match, 'away');
    const homeWon = isDone && match.winner_team_id === match.home_team_id;
    const awayWon = isDone && match.winner_team_id === match.away_team_id;
    const hasPenalties = match.home_penalty_score != null || match.away_penalty_score != null;

    return (
        <div className={`w-52 rounded-xl border shadow-sm bg-white overflow-hidden relative group ${isFinal ? 'border-brand-500 ring-4 ring-brand-50' : 'border-gray-200'}`}>
            {/* Match Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-white/10">
                <p className="font-bold border-b border-white/10 pb-1 mb-1">Match Details</p>
                <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="capitalize text-brand-400">{match.status}</span>
                </div>
                {match.played_at && (
                    <div className="flex justify-between mt-1">
                        <span>Played:</span>
                        <span>{new Date(match.played_at).toLocaleDateString()}</span>
                    </div>
                )}
            </div>

            <div className={`flex items-center justify-between px-3 py-2 border-b ${homeWon ? 'bg-brand-50' : ''}`}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar src={match.home_team_logo} name={homeName} size="w-4 h-4" text_size="text-[9px]" />
                    <span className={`text-[11px] truncate ${homeName === 'TBD' ? 'text-gray-300 italic' : homeWon ? 'font-bold text-brand-600' : 'text-gray-700'}`}>
                        {homeName}
                    </span>
                </div>
                {isDone && (
                    <span className={`text-xs font-mono font-bold ${homeWon ? 'text-brand-600' : 'text-gray-400'}`}>{match.home_score}</span>
                )}
            </div>
            <div className={`flex items-center justify-between px-3 py-2 ${awayWon ? 'bg-brand-50' : ''}`}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar src={match.away_team_logo} name={awayName} size="w-4 h-4" text_size="text-[9px]" />
                    <span className={`text-[11px] truncate ${awayName === 'TBD' ? 'text-gray-300 italic' : awayWon ? 'font-bold text-brand-600' : 'text-gray-700'}`}>
                        {awayName}
                    </span>
                </div>
                {isDone && (
                    <span className={`text-xs font-mono font-bold ${awayWon ? 'text-brand-600' : 'text-gray-400'}`}>{match.away_score}</span>
                )}
            </div>
            {hasPenalties && (
                <div className="bg-gray-50 px-3 py-1 border-t border-gray-100 flex justify-center">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                        Penalties: {match.home_penalty_score} - {match.away_penalty_score}
                    </span>
                </div>
            )}
        </div>
    );
}