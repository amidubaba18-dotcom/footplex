import React from 'react';

export default function BracketZoomControls({ zoomIn, zoomOut, resetTransform }) {
    return (
        <div className="absolute bottom-4 right-6 z-10 flex gap-2">
            <button
                onClick={() => zoomIn()}
                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 font-bold text-gray-600 transition-colors"
                aria-label="Zoom in"
            >
                +
            </button>
            <button
                onClick={() => zoomOut()}
                className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 font-bold text-gray-600 transition-colors"
                aria-label="Zoom out"
            >
                −
            </button>
            <button
                onClick={() => resetTransform()}
                className="px-3 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-[10px] font-bold uppercase text-gray-400 transition-colors"
                aria-label="Reset zoom"
            >
                Reset
            </button>
        </div>
    );
}