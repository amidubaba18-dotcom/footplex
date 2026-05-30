import React from 'react';

export default function BracketConnector({ isEven, roundIndex }) {
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
}