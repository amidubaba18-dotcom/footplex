import React from 'react'
import { SearchIcon } from './Icons'

export default function SearchBar({ value, onChange, placeholder = 'Search tournaments...' }) {
    return (
        <div className="relative flex-1 md:max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#957467]">
                <SearchIcon />
            </div>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white border border-[#e5b186]/50 rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium text-[#5c3d2e] placeholder-[#957467]/50 focus:outline-none focus:ring-2 focus:ring-[#da513f]/15 focus:border-[#da513f]/30 shadow-sm transition-all"
            />
        </div>
    )
}