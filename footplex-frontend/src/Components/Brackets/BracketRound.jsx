import React from 'react';
import BracketMatch from './BracketMatch';
import BracketConnector from './BracketConnector';

export function getKnockoutRoundName(roundNumber, totalRounds) {
    const fromEnd = totalRounds - roundNumber + 1;
    if (fromEnd === 1) return '🏆 Final';
    if (fromEnd === 2) return 'Semi-Finals';
    if (fromEnd === 3) return 'Quarter-Finals';
    if (fromEnd === 4) return 'Round of 16';
    return `Round ${roundNumber}`;
}

export default function BracketRound({ roundNumber, roundIndex, matches, totalRounds, isLast }) {
    const roundMatches = matches
        .filter(m => m.round_number === roundNumber)
        .sort((a, b) => a.match_number - b.match_number);

    return (
        <div className="flex flex-col h-full min-w-[208px]">
            <div className="text-center mb-10">
                <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white border border-gray-100 shadow-sm text-gray-500">
                    {getKnockoutRoundName(roundNumber, totalRounds)}
                </span>
            </div>
            <div className="flex-1 flex flex-col justify-around">
                {roundMatches.map((m, mIdx) => (
                    <div key={m.id} className="relative py-8">
                        <BracketMatch match={m} isFinal={isLast} />
                        {!isLast && <BracketConnector isEven={mIdx % 2 === 0} roundIndex={roundIndex} />}
                    </div>
                ))}
            </div>
        </div>
    );
}