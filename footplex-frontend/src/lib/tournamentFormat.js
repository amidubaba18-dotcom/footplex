export const BRACKET_FORMATS = new Set([
    'single_elim',
    'single_elimination',
    'double_elim',
    'double_elimination',
    'group_knockout'
])

export const DOUBLE_ELIM_FORMATS = new Set([
    'double_elim',
    'double_elimination'
])

export const STANDINGS_FORMATS = new Set([
    'round_robin',
    'swiss',
    'group_knockout'
])

export function isBracketFormat(format) {
    return BRACKET_FORMATS.has(format)
}

export function isDoubleEliminationFormat(format) {
    return DOUBLE_ELIM_FORMATS.has(format)
}

export function getPublicTournamentTabs(format) {
    const tabs = []

    if (STANDINGS_FORMATS.has(format)) {
        tabs.push('standings')
    }

    tabs.push('fixtures')

    if (isBracketFormat(format)) {
        tabs.push('bracket')
    }

    tabs.push('teams', 'chat', 'info')
    return tabs
}

export function getManageTournamentTabs(format) {
    const tabs = ['teams', 'fixtures']

    if (isBracketFormat(format)) {
        tabs.push('bracket')
    }

    tabs.push('scores', 'settings')
    return tabs
}

export function getFixtureLabel(match) {
    if (!match) return 'Fixtures'
    if (match.match_type === 'winners') return `Winners Round ${match.round_number}`
    if (match.match_type === 'losers') return `Losers Round ${match.round_number}`
    if (match.match_type === 'grand_final') return 'Grand Final'
    if (match.match_type === 'grand_final_reset') return 'Grand Final Reset'
    if (match.group_name) return `Group ${match.group_name} Round ${match.round_number}`
    return `Round ${match.round_number}`
}
