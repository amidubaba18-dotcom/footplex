import { TrophyIcon } from './Icons'

export default function EmptyState({ searchQuery }) {
    return (
        <div className="text-center py-14 bg-white/60 rounded-2xl border border-dashed border-[#e5b186]/40">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#e5b186]/15 flex items-center justify-center">
                <TrophyIcon className="w-6 h-6 text-[#e5b186]" />
            </div>
            <p className="font-bold text-[#5c3d2e] text-sm">
                {searchQuery ? `No results for "${searchQuery}"` : 'No tournaments yet'}
            </p>
            <p className="text-xs text-[#957467] mt-1">
                {searchQuery ? 'Try a different search' : 'Check back later or create your own'}
            </p>
        </div>
    )
}