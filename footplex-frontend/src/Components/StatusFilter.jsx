import React from 'react'

const statusFilters = [
    { key: 'all', label: 'All' },
    { key: 'registration', label: 'Open' },
    { key: 'active', label: 'Live' },
    { key: 'completed', label: 'Done' },
]

export default function StatusFilter({ active, onChange }) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x md:snap-none">
            {statusFilters.map(({ key, label }) => (
                <button
                    key={key}
                    onClick={() => onChange(key)}
                    className={`
                        flex-shrink-0 snap-start px-3.5 py-2 rounded-full text-xs font-bold border transition-all active:scale-95
                        ${active === key
                            ? 'bg-[#da513f] border-[#da513f] text-white shadow-sm shadow-[#da513f]/20'
                            : 'bg-white border-[#e5b186]/50 text-[#957467] hover:border-[#da513f]/30'}
                    `}
                >
                    {label}
                </button>
            ))}
        </div>
    )
}