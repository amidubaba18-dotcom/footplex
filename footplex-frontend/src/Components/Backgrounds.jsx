import React from 'react'

export const ArenaBackground = () => (
    <svg viewBox="0 0 800 200" className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" preserveAspectRatio="xMidYMid slice">
        <defs>
            <linearGradient id="arenaSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5debe" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#fefcf2" stopOpacity="0" />
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#arenaSky)" />
        <path d="M0 160 Q200 110 400 100 Q600 110 800 160 L800 200 L0 200 Z" fill="#da513f" opacity="0.06" />
        <path d="M0 175 Q200 135 400 125 Q600 135 800 175 L800 200 L0 200 Z" fill="#5c3d2e" opacity="0.04" />
        <line x1="100" y1="20" x2="100" y2="110" stroke="#e5b186" strokeWidth="2.5" opacity="0.25" strokeLinecap="round" />
        <line x1="700" y1="20" x2="700" y2="110" stroke="#e5b186" strokeWidth="2.5" opacity="0.25" strokeLinecap="round" />
        <ellipse cx="100" cy="22" rx="30" ry="10" fill="#fefcf2" opacity="0.12" />
        <ellipse cx="700" cy="22" rx="30" ry="10" fill="#fefcf2" opacity="0.12" />
        <rect x="120" y="125" width="560" height="55" rx="6" fill="#92cfc6" opacity="0.08" />
        <rect x="120" y="125" width="560" height="55" rx="6" stroke="#92cfc6" strokeWidth="1" fill="none" opacity="0.2" />
        <line x1="400" y1="125" x2="400" y2="180" stroke="#92cfc6" strokeWidth="1" opacity="0.25" strokeDasharray="5 4" />
        <circle cx="400" cy="152" r="14" stroke="#92cfc6" strokeWidth="1" fill="none" opacity="0.2" />
        <rect x="155" y="138" width="35" height="30" rx="2" stroke="#92cfc6" strokeWidth="1" fill="none" opacity="0.15" />
        <rect x="610" y="138" width="35" height="30" rx="2" stroke="#92cfc6" strokeWidth="1" fill="none" opacity="0.15" />
        <circle cx="400" cy="152" r="4" fill="#fefcf2" stroke="#da513f" strokeWidth="1" opacity="0.8" />
        <g opacity="0.3">
            <circle cx="300" cy="142" r="4" fill="#da513f" />
            <path d="M300 146 L300 162 M300 154 L294 158 M300 154 L306 158 M300 162 L296 170 M300 162 L304 170" stroke="#da513f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>
        <g opacity="0.3">
            <circle cx="500" cy="148" r="4" fill="#92cfc6" />
            <path d="M500 152 L500 168 M500 160 L494 164 M500 160 L506 164 M500 168 L496 176 M500 168 L504 176" stroke="#92cfc6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>
        <circle cx="220" cy="80" r="1.5" fill="#da513f" opacity="0.15" />
        <circle cx="580" cy="90" r="1.5" fill="#92cfc6" opacity="0.15" />
        <circle cx="350" cy="70" r="1" fill="#e5b186" opacity="0.2" />
    </svg>
)

export const CardStadiumBg = ({ type }) => {
    const isEfootball = type === 'efootball'
    return (
        <svg viewBox="0 0 300 120" className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none" preserveAspectRatio="xMidYMid slice">
            <defs>
                <linearGradient id={`cardGrad-${type}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isEfootball ? "#5c3d2e" : "#da513f"} stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#fefcf2" stopOpacity="0" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill={`url(#cardGrad-${type})`} />
            <path d="M0 40 Q75 15 150 20 Q225 15 300 40 L300 120 L0 120 Z" fill="#da513f" opacity="0.06" />
            <line x1="150" y1="50" x2="150" y2="110" stroke="#92cfc6" strokeWidth="1.5" opacity="0.2" strokeDasharray="4 3" />
            <circle cx="150" cy="80" r="12" stroke="#92cfc6" strokeWidth="1" fill="none" opacity="0.15" />
            <rect x="40" y="65" width="25" height="30" rx="2" stroke="#92cfc6" strokeWidth="0.8" fill="none" opacity="0.12" />
            <rect x="235" y="65" width="25" height="30" rx="2" stroke="#92cfc6" strokeWidth="0.8" fill="none" opacity="0.12" />
            <circle cx="150" cy="80" r="3" fill="#da513f" opacity="0.3" />
            <circle cx="100" cy="75" r="2" fill="#da513f" opacity="0.2" />
            <circle cx="200" cy="85" r="2" fill="#92cfc6" opacity="0.2" />
            {isEfootball && (
                <rect x="110" y="25" width="80" height="35" rx="3" stroke="#e5b186" strokeWidth="0.8" fill="none" opacity="0.15" />
            )}
        </svg>
    )
}