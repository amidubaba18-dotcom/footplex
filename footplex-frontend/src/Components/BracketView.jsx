// src/components/BracketView.jsx – corrected for group_knockout
import { isDoubleEliminationFormat } from '../lib/tournamentFormat';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

function getTeamName(match, side) {
    const nameKey = side === 'home' ? 'home_team_name' : 'away_team_name';
    const idKey = side === 'home' ? 'home_team_id' : 'away_team_id';
    const otherIdKey = side === 'home' ? 'away_team_id' : 'home_team_id';

    if (match[nameKey]) return match[nameKey];
    if (!match[idKey] && match[otherIdKey]) return 'BYE';
    return 'TBD';
}

const MatchCard = ({ match, isFinal }) => {
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
                <span className={`text-[11px] truncate flex-1 ${homeName === 'TBD' ? 'text-gray-300 italic' : homeWon ? 'font-bold text-brand-600' : 'text-gray-700'}`}>
                    {homeName}
                </span>
                {isDone && (
                    <span className={`text-xs font-mono font-bold ${homeWon ? 'text-brand-600' : 'text-gray-400'}`}>{match.home_score}</span>
                )}
            </div>
            <div className={`flex items-center justify-between px-3 py-2 ${awayWon ? 'bg-brand-50' : ''}`}>
                <span className={`text-[11px] truncate flex-1 ${awayName === 'TBD' ? 'text-gray-300 italic' : awayWon ? 'font-bold text-brand-600' : 'text-gray-700'}`}>
                    {awayName}
                </span>
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
};

const CurvedLine = ({ isEven, roundIndex }) => {
    // Vertical distance increases as we go deeper into rounds
    const verticalSpan = Math.pow(2, roundIndex) * 50;
    const path = isEven
        ? `M 0 ${verticalSpan} C 30 ${verticalSpan}, 30 ${verticalSpan * 2}, 60 ${verticalSpan * 2}`
        : `M 0 ${verticalSpan} C 30 ${verticalSpan}, 30 0, 60 0`;

    return (
        <svg width="60" height={verticalSpan * 2} className="absolute left-full top-1/2 -translate-y-1/2 pointer-events-none overflow-visible">
            <path d={path} fill="none" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
};

const CustomBracket = ({ matches, totalRounds }) => {
    const roundNumbers = [...new Set(matches.map(m => m.round_number))].sort((a, b) => a - b);

    return (
        <div className="flex gap-16 p-20 min-h-full items-center">
            {roundNumbers.map((rn, rIdx) => {
                const roundMatches = matches
                    .filter(m => m.round_number === rn)
                    .sort((a, b) => a.match_number - b.match_number);
                const isLast = rIdx === roundNumbers.length - 1;

                return (
                    <div key={rn} className="flex flex-col h-full min-w-[208px]">
                        <div className="text-center mb-10">
                            <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white border border-gray-100 shadow-sm text-gray-500">
                                {getKnockoutRoundName(rn, totalRounds)}
                            </span>
                        </div>
                        <div className="flex-1 flex flex-col justify-around">
                            {roundMatches.map((m, mIdx) => (
                                <div key={m.id} className="relative py-8">
                                    <MatchCard match={m} isFinal={isLast} />
                                    {!isLast && <CurvedLine isEven={mIdx % 2 === 0} roundIndex={rIdx} />}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

function getKnockoutRoundName(roundNumber, totalRounds) {
    const fromEnd = totalRounds - roundNumber + 1;
    if (fromEnd === 1) return '🏆 Final';
    if (fromEnd === 2) return 'Semi-Finals';
    if (fromEnd === 3) return 'Quarter-Finals';
    if (fromEnd === 4) return 'Round of 16';
    return `Round ${roundNumber}`;
}

export default function BracketView({ fixtures = [], tournament }) {
    if (tournament?.format === 'round_robin' || tournament?.format === 'swiss') {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
                Bracket view not available for {tournament.format.replace(/_/g, ' ')}. See the Fixtures tab instead.
            </div>
        );
    }

    if (fixtures.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                No fixtures generated yet
            </div>
        );
    }

    const isDoubleElim = isDoubleEliminationFormat(tournament?.format);
    const isGroupKnockout = tournament?.format === 'group_knockout';

    // For group_knockout, we separate group matches (not shown in bracket) and knockout matches
    let bracketMatches = fixtures;
    if (isGroupKnockout) {
        bracketMatches = fixtures.filter(m => !m.group_name && m.match_type === 'knockout');
        if (bracketMatches.length === 0) {
            return (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                    Group stage is still in progress. The knockout bracket will appear once qualifiers are decided.
                </div>
            );
        }
    }

    if (!isDoubleElim) {
        const roundNumbers = [...new Set(bracketMatches.map(m => m.round_number))];
        const totalMatches = bracketMatches.length;
        const completedMatches = bracketMatches.filter(m => m.status === 'completed').length;

        return (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Tournament Bracket</p>
                        <p className="text-xs text-gray-400 mt-0.5">{completedMatches} of {totalMatches} matches completed</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
                        {tournament?.format?.replace(/_/g, ' ')}
                    </span>
                </div>
                <div className="p-6 relative bg-gray-50/30">
                    <TransformWrapper
                        initialScale={0.8}
                        minScale={0.2}
                        maxScale={2}
                        centerOnInit={true}
                    >
                        {({ zoomIn, zoomOut, resetTransform }) => (
                            <div className="relative">
                                <div className="absolute bottom-4 right-6 z-10 flex gap-2">
                                    <button onClick={() => zoomIn()} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 font-bold text-gray-600">+</button>
                                    <button onClick={() => zoomOut()} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 font-bold text-gray-600">−</button>
                                    <button onClick={() => resetTransform()} className="px-3 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-[10px] font-bold uppercase text-gray-400">Reset</button>
                                </div>

                                <div className="p-6 custom-bracket-container">
                                    <style>{`
                                        .custom-bracket-container svg path {
                                            stroke: #6366f1 !important;
                                            stroke-width: 2px;
                                            opacity: 0.3;
                                        }
                                    `}</style>
                                    <TransformComponent
                                        wrapperStyle={{
                                            width: "100%",
                                            height: "500px",
                                            borderRadius: "0.75rem",
                                            cursor: "grab"
                                        }}
                                        contentStyle={{
                                            padding: "40px"
                                        }}
                                    >
                                        <CustomBracket matches={bracketMatches} totalRounds={roundNumbers.length} />
                                    </TransformComponent>
                                </div>
                            </div>
                        )}
                    </TransformWrapper>
                </div>
            </div>
        );
    }

    // Double elimination handling (unchanged)
    const completedMatches = fixtures.filter(m => m.status === 'completed').length;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-gray-900">Tournament Bracket</p>
                    <p className="text-xs text-gray-400 mt-0.5">{completedMatches} of {fixtures.length} matches completed</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
                    {tournament?.format?.replace(/_/g, ' ')}
                </span>
            </div>
            <div className="p-6 relative bg-gray-50/30">
                <TransformWrapper initialScale={0.6} centerOnInit={true}>
                    {({ zoomIn, zoomOut, resetTransform }) => (
                        <div className="relative">
                            <div className="absolute bottom-4 right-6 z-10 flex gap-2">
                                <button onClick={() => zoomIn()} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 font-bold">+</button>
                                <button onClick={() => zoomOut()} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 font-bold">−</button>
                                <button onClick={() => resetTransform()} className="px-3 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-[10px] font-bold uppercase">Reset</button>
                            </div>
                            <TransformComponent wrapperStyle={{ width: "100%", height: "700px", cursor: "grab" }}>
                                <div className="p-12 space-y-24 custom-bracket-container min-w-max">
                                    <style>{`
                                        .custom-bracket-container svg path {
                                            stroke: #6366f1 !important;
                                            stroke-width: 2px;
                                            opacity: 0.3;
                                        }
                                    `}</style>
                                    <div className="flex flex-col gap-20">
                                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Winners Bracket</h3>
                                            <CustomBracket matches={fixtures.filter(f => f.match_type === 'winners')} totalRounds={2} />
                                        </div>
                                        <div className="bg-orange-50/30 p-6 rounded-3xl border border-orange-100 shadow-sm">
                                            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">Losers Bracket</h3>
                                            <CustomBracket matches={fixtures.filter(f => f.match_type === 'losers')} totalRounds={2} />
                                        </div>
                                        <div className="bg-brand-50/30 p-6 rounded-3xl border border-brand-100 shadow-sm">
                                            <h3 className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-4">Finals</h3>
                                            <CustomBracket matches={[
                                                ...fixtures.filter(f => f.match_type === 'grand_final'),
                                                ...fixtures.filter(f => f.match_type === 'grand_final_reset')
                                            ]} totalRounds={1} />
                                        </div>
                                    </div>
                                </div>
                            </TransformComponent>
                        </div>
                    )}
                </TransformWrapper>
            </div>
        </div>
    );
}