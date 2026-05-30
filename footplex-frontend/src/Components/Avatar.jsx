import React, { useState } from 'react';

function getInitials(name) {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
}

export default function Avatar({ src, name, size = 'w-8 h-8', text_size = 'text-xs', rounded = 'rounded-full', border = 'border-gray-100' }) {
    const [imageError, setImageError] = useState(false);

    const handleError = () => {
        setImageError(true);
    };

    if (src && !imageError) {
        return (
            <img
                src={src}
                alt={name || 'Avatar'}
                className={`${size} ${rounded} object-cover border ${border} flex-shrink-0`}
                onError={handleError}
            />
        );
    }

    return (
        <span className={`${size} ${rounded} bg-gray-100 inline-flex items-center justify-center font-bold ${text_size} text-gray-400 border ${border} flex-shrink-0`}>
            {getInitials(name)}
        </span>
    );
}