// src/components/BracketView.jsx – corrected for group_knockout
import { isDoubleEliminationFormat } from '../lib/tournamentFormat';

function getTeamName(match, side) {
    const nameKey = side === 'home' ? 'home_team_name' : 'away_team_name';
    const idKey = side === 'home' ? 'home_team_id' : 'away_team_id';
    const otherIdKey = side === 'home' ? 'away_team_id' : 'home_team_id';

    if (match[nameKey]) return match[nameKey];
    if (!match[idKey] && match[otherIdKey]) return 'BYE';
    return 'TBD';
}

function MatchCard({ match, accentClass = 'border-gray-200' }) {
    const homeName = getTeamName(match, 'home');
    const awayName = getTeamName(match, 'away');
    const homeWon = match.winner_team_id === match.home_team_id;
    const awayWon = match.winner_team_id === match.away_team_id;
    const isDone = match.status === 'completed';

    return (
        <div className={`w - 56 rounded-xl overflow-hidden border shadow-sm ${accentClass}`}>
            <div className={`flex items-center justify-between px-3 py-2.5 border - b ${homeWon ? 'bg-brand-50 border-brand-100' : 'border-gray-100'}`}>
                <span className={`text-sm truncate flex-1 ${homeName === 'TBD' ? 'text-gray-300 italic' : homeName === 'BYE' ? 'text-gray-400 italic' : homeWon ? 'font-bold text-brand-600' : isDone ? 'text-gray-400' : 'font-medium text-gray-900'}`}>
                    {homeName}
                </span>
                <div className="flex items-center gap-1 ml-2">
                    {isDone && (
                        <span className={`text-sm font-bold w-5 text-right ${homeWon ? 'text-brand-600' : 'text-gray-400'}`}>
                            {match.home_score}
                        </span>
                    )}
                    {homeWon && <span className="text-brand-500 text-xs">✓</span>}
                </div >
            </div >
            <div className={`flex items-center justify-between px-3 py-2.5 ${awayWon ? 'bg-brand-50' : 'bg-white'}`}>
                <span className={`text-sm truncate flex-1 ${awayName === 'TBD' ? 'text-gray-300 italic' : awayName === 'BYE' ? 'text-gray-400 italic' : awayWon ? 'font-bold text-brand-600' : isDone ? 'text-gray-400' : 'font-medium text-gray-900'}`}>
                    {awayName}
                </span>
                <div className="flex items-center gap-1 ml-2">
                    {isDone && (
                        <span className={`text-sm font-bold w-5 text-right ${awayWon ? 'text-brand-600' : 'text-gray-400'}`}>
                            {match.away_score}
                        </span>
                    )}
                    {awayWon && <span className="text-brand-500 text-xs">✓</span>}
                </div >
            </div >
        </div >
    );
}

function getKnockoutRoundName(roundNumber, totalRounds) {
    const fromEnd = totalRounds - roundNumber + 1;
    if (fromEnd === 1) return 'Final';
    if (fromEnd === 2) return 'Semi-Finals';
    if (fromEnd === 3) return 'Quarter-Finals';
    if (fromEnd === 4) return 'Round of 16';
    if (fromEnd === 5) return 'Round of 32';
    return `Round ${roundNumber}`;
}

function BracketSection({ title, rounds, roundName, accentClass = 'bg-gray-100 text-gray-500' }) {
    if (rounds.length === 0) return null;
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <span className="text-xs text-gray-400">{rounds.reduce((sum, round) => sum + round.matches.length, 0)} matches</span>
            </div>
            <div className="overflow-x-auto pb-2">
                <div className="flex gap-8 min-w-max items-start">
                    {rounds.map(round => (
                        <div key={`${title}-${round.roundNumber}`} className="flex flex-col gap-3">
                            <div className={`text - center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${accentClass}`}>
                                {roundName(round.roundNumber, rounds.length)}
                            </div>
                            <div className="flex flex-col gap-6 justify-around" style={{ minHeight: `${Math.max(round.matches.length, 1) * 92}px` }}>
                                {round.matches.map(match => (
                                    <MatchCard key={match.id} match={match} accentClass={title === 'Grand Finals' ? 'border-yellow-200' : 'border-gray-200'} />
                                ))}
                            </div>
                        </div>
                    ))}

                </div >
            </div >
        </div >
    );
}

function getRounds(matches) {
    return [...new Set(matches.map(m => m.round_number))]
        .sort((a, b) => a - b)
        .map(roundNumber => ({
            roundNumber,
            matches: matches.filter(m => m.round_number === roundNumber)
        }));
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
        const rounds = getRounds(bracketMatches);
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
                <div className="p-6">
                    <BracketSection title="Knockout" rounds={rounds} roundName={getKnockoutRoundName} />
                </div>
            </div>
        );
    }

    // Double elimination handling (unchanged)
    const winnersRounds = getRounds(fixtures.filter(m => m.match_type === 'winners'));
    const losersRounds = getRounds(fixtures.filter(m => m.match_type === 'losers'));
    const finalsRounds = [
        ...getRounds(fixtures.filter(m => m.match_type === 'grand_final')),
        ...getRounds(fixtures.filter(m => m.match_type === 'grand_final_reset')).map(round => ({ ...round, roundNumber: round.roundNumber + 1 }))
    ];
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
            <div className="p-6 space-y-8">
                <BracketSection title="Winners Bracket" rounds={winnersRounds} roundName={roundNumber => `Round ${roundNumber}`} />
                <BracketSection title="Losers Bracket" rounds={losersRounds} roundName={roundNumber => `Round ${roundNumber}`} accentClass="bg-orange-50 text-orange-700" />
                <BracketSection title="Grand Finals" rounds={finalsRounds} roundName={roundNumber => roundNumber === 1 ? 'Grand Final' : 'Reset Final'} accentClass="bg-yellow-100 text-yellow-900" />
            </div>
        </div>
    );
}