import React, { useState, useCallback, useEffect } from 'react';

export default function ScoreInput({ match, onSave, disabled = false }) {
    const [homeScore, setHomeScore] = useState(match.home_score ?? '');
    const [awayScore, setAwayScore] = useState(match.away_score ?? '');
    const [homePenalty, setHomePenalty] = useState(match.home_penalty_score ?? '');
    const [awayPenalty, setAwayPenalty] = useState(match.away_penalty_score ?? '');
    const [status, setStatus] = useState('idle'); // idle | saving | success | error
    const [error, setError] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    // Reset local state when match prop changes
    useEffect(() => {
        setHomeScore(match.home_score ?? '');
        setAwayScore(match.away_score ?? '');
        setHomePenalty(match.home_penalty_score ?? '');
        setAwayPenalty(match.away_penalty_score ?? '');
        setStatus('idle');
        setError(null);
        setIsDirty(false);
    }, [match.id, match.home_score, match.away_score, match.home_penalty_score, match.away_penalty_score]);

    const validate = useCallback(() => {
        const h = homeScore === '' ? null : Number(homeScore);
        const a = awayScore === '' ? null : Number(awayScore);

        if (h === null || a === null) {
            return 'Both scores are required';
        }
        if (!Number.isInteger(h) || !Number.isInteger(a)) {
            return 'Scores must be whole numbers';
        }
        if (h < 0 || a < 0) {
            return 'Scores cannot be negative';
        }

        // Penalties validation (only if scores are tied)
        if (h === a) {
            const hp = homePenalty === '' ? null : Number(homePenalty);
            const ap = awayPenalty === '' ? null : Number(awayPenalty);
            if (hp !== null || ap !== null) {
                if (hp === null || ap === null) {
                    return 'Both penalty scores are required if one is entered';
                }
                if (!Number.isInteger(hp) || !Number.isInteger(ap)) {
                    return 'Penalty scores must be whole numbers';
                }
                if (hp < 0 || ap < 0) {
                    return 'Penalty scores cannot be negative';
                }
                if (hp === ap) {
                    return 'Penalty scores cannot be tied';
                }
            }
        }

        return null;
    }, [homeScore, awayScore, homePenalty, awayPenalty]);

    const handleSave = useCallback(async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            setStatus('error');
            return;
        }

        setError(null);
        setStatus('saving');

        try {
            await onSave({
                home_score: Number(homeScore),
                away_score: Number(awayScore),
                home_penalty_score: homePenalty === '' ? null : Number(homePenalty),
                away_penalty_score: awayPenalty === '' ? null : Number(awayPenalty),
            });
            setStatus('success');
            setIsDirty(false);
            // Reset success state after 2 seconds
            setTimeout(() => setStatus('idle'), 2000);
        } catch (err) {
            setError(err.message || 'Failed to save score');
            setStatus('error');
        }
    }, [homeScore, awayScore, homePenalty, awayPenalty, validate, onSave]);

    const handleChange = (setter) => (e) => {
        const val = e.target.value;
        if (val === '' || /^\d*$/.test(val)) {
            setter(val);
            setIsDirty(true);
            setStatus('idle');
            setError(null);
        }
    };

    const isTied = homeScore !== '' && awayScore !== '' && Number(homeScore) === Number(awayScore);

    return (
        <div className={`rounded-xl border bg-white p-4 shadow-sm transition-colors ${
            status === 'error' ? 'border-red-300 bg-red-50/30' :
            status === 'success' ? 'border-green-300 bg-green-50/30' :
            isDirty ? 'border-brand-300' :
            'border-gray-200'
        }`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Enter Score</span>
                {status === 'success' && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Saved</span>
                )}
                {status === 'saving' && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Saving…</span>
                )}
            </div>

            <div className="flex items-center gap-3">
                {/* Home score */}
                <div className="flex-1">
                    <label className="block text-[10px] text-gray-400 mb-1 truncate">{match.home_team_name || 'Home'}</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={homeScore}
                        onChange={handleChange(setHomeScore)}
                        disabled={disabled || status === 'saving'}
                        className={`w-full text-center text-sm font-mono font-bold py-2 rounded-lg border outline-none transition-all ${
                            status === 'error' ? 'border-red-300 focus:ring-2 focus:ring-red-200' :
                            'border-gray-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100'
                        } disabled:bg-gray-50 disabled:text-gray-400`}
                        placeholder="0"
                    />
                </div>

                <span className="text-xs font-bold text-gray-300 pt-4">vs</span>

                {/* Away score */}
                <div className="flex-1">
                    <label className="block text-[10px] text-gray-400 mb-1 truncate">{match.away_team_name || 'Away'}</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={awayScore}
                        onChange={handleChange(setAwayScore)}
                        disabled={disabled || status === 'saving'}
                        className={`w-full text-center text-sm font-mono font-bold py-2 rounded-lg border outline-none transition-all ${
                            status === 'error' ? 'border-red-300 focus:ring-2 focus:ring-red-200' :
                            'border-gray-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100'
                        } disabled:bg-gray-50 disabled:text-gray-400`}
                        placeholder="0"
                    />
                </div>
            </div>

            {/* Penalty shootout inputs (shown when tied) */}
            {isTied && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Penalty Shootout</p>
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={homePenalty}
                                onChange={handleChange(setHomePenalty)}
                                disabled={disabled || status === 'saving'}
                                className="w-full text-center text-sm font-mono font-bold py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
                                placeholder="Pen"
                            />
                        </div>
                        <span className="text-xs font-bold text-gray-300">-</span>
                        <div className="flex-1">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={awayPenalty}
                                onChange={handleChange(setAwayPenalty)}
                                disabled={disabled || status === 'saving'}
                                className="w-full text-center text-sm font-mono font-bold py-2 rounded-lg border border-gray-200 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
                                placeholder="Pen"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <p className="mt-2 text-[11px] text-red-500 font-medium">{error}</p>
            )}

            {/* Save button */}
            <button
                onClick={handleSave}
                disabled={disabled || status === 'saving' || (!isDirty && status !== 'error')}
                className={`mt-3 w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    status === 'success'
                        ? 'bg-green-500 text-white shadow-green-200'
                        : status === 'error'
                        ? 'bg-red-500 text-white shadow-red-200'
                        : isDirty
                        ? 'bg-brand-500 text-white shadow-brand-200 hover:bg-brand-600'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                } disabled:opacity-60`}
            >
                {status === 'saving' ? 'Saving…' : status === 'success' ? 'Saved!' : status === 'error' ? 'Try Again' : 'Save Score'}
            </button>
        </div>
    );
}