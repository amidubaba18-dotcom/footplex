import React from 'react';
import { isDoubleEliminationFormat } from '../../lib/tournamentFormat';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import BracketRound from './BracketRound';
import BracketZoomControls from './BracketZoomControls';

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

    const roundNumbers = [...new Set(bracketMatches.map(m => m.round_number))].sort((a, b) => a - b);
    const totalMatches = bracketMatches.length;
    const completedMatches = bracketMatches.filter(m => m.status === 'completed').length;

    if (!isDoubleElim) {
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
                                <BracketZoomControls
                                    zoomIn={zoomIn}
                                    zoomOut={zoomOut}
                                    resetTransform={resetTransform}
                                />
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
                                        <div className="flex gap-16 p-20 min-h-full items-center">
                                            {roundNumbers.map((rn, rIdx) => (
                                                <BracketRound
                                                    key={rn}
                                                    roundNumber={rn}
                                                    roundIndex={rIdx}
                                                    matches={bracketMatches}
                                                    totalRounds={roundNumbers.length}
                                                    isLast={rIdx === roundNumbers.length - 1}
                                                />
                                            ))}
                                        </div>
                                    </TransformComponent>
                                </div>
                            </div>
                        )}
                    </TransformWrapper>
                </div>
            </div>
        );
    }

    // Double elimination handling
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
                            <BracketZoomControls
                                zoomIn={zoomIn}
                                zoomOut={zoomOut}
                                resetTransform={resetTransform}
                            />
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
                                            <div className="flex gap-16 p-20 min-h-full items-center">
                                                {[...new Set(fixtures.filter(f => f.match_type === 'winners').map(m => m.round_number))].sort((a, b) => a - b).map((rn, rIdx, arr) => (
                                                    <BracketRound
                                                        key={`w-${rn}`}
                                                        roundNumber={rn}
                                                        roundIndex={rIdx}
                                                        matches={fixtures.filter(f => f.match_type === 'winners')}
                                                        totalRounds={2}
                                                        isLast={rIdx === arr.length - 1}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-orange-50/30 p-6 rounded-3xl border border-orange-100 shadow-sm">
                                            <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">Losers Bracket</h3>
                                            <div className="flex gap-16 p-20 min-h-full items-center">
                                                {[...new Set(fixtures.filter(f => f.match_type === 'losers').map(m => m.round_number))].sort((a, b) => a - b).map((rn, rIdx, arr) => (
                                                    <BracketRound
                                                        key={`l-${rn}`}
                                                        roundNumber={rn}
                                                        roundIndex={rIdx}
                                                        matches={fixtures.filter(f => f.match_type === 'losers')}
                                                        totalRounds={2}
                                                        isLast={rIdx === arr.length - 1}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-brand-50/30 p-6 rounded-3xl border border-brand-100 shadow-sm">
                                            <h3 className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-4">Finals</h3>
                                            <div className="flex gap-16 p-20 min-h-full items-center">
                                                {[...new Set([
                                                    ...fixtures.filter(f => f.match_type === 'grand_final'),
                                                    ...fixtures.filter(f => f.match_type === 'grand_final_reset')
                                                ].map(m => m.round_number))].sort((a, b) => a - b).map((rn, rIdx, arr) => (
                                                    <BracketRound
                                                        key={`f-${rn}`}
                                                        roundNumber={rn}
                                                        roundIndex={rIdx}
                                                        matches={[
                                                            ...fixtures.filter(f => f.match_type === 'grand_final'),
                                                            ...fixtures.filter(f => f.match_type === 'grand_final_reset')
                                                        ]}
                                                        totalRounds={1}
                                                        isLast={rIdx === arr.length - 1}
                                                    />
                                                ))}
                                            </div>
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