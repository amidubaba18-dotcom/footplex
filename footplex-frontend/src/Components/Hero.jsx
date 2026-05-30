import React from 'react'
import { ArenaBackground } from './Backgrounds'

export default function Hero() {
    return (
        <div className="relative bg-gradient-to-b from-[#f5debe]/25 to-[#fefcf2]">
            <div className="max-w-6xl mx-auto px-4 pt-6 pb-3 relative">
                <ArenaBackground />
                <div className="relative z-10">
                    <h1 className="text-2xl md:text-3xl font-black text-[#5c3d2e] tracking-tight leading-tight">
                        Explore <span className="text-[#da513f]">Tournaments</span>
                    </h1>
                    <p className="text-xs md:text-sm text-[#957467] mt-1 max-w-xs leading-relaxed">
                        Discover and join the latest competitions
                    </p>
                </div>
            </div>
        </div>
    )
}