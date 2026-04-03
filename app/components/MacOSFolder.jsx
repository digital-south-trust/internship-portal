import React from 'react';

const MacOSFolder = ({ size = 24, className = "" }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path 
            d="M2 5.5C2 4.11929 3.11929 3 4.5 3H9.17157C9.5694 3 9.95092 3.15804 10.2322 3.43934L12.7678 5.97466C13.0491 6.25596 13.4306 6.414 13.8284 6.414H19.5C20.8807 6.414 22 7.53329 22 8.914V18.5C22 19.8807 20.8807 21 19.5 21H4.5C3.11929 21 2 19.8807 2 18.5V5.5Z" 
            fill="#007AFF"
            fillOpacity="0.85"
        />
        <path 
            d="M2 8.914C2 7.53329 3.11929 6.414 4.5 6.414H11.5L9.5 4H4.5C3.11929 4 2 5.11929 2 6.5V8.914Z" 
            fill="#0056B3"
        />
        <path 
            d="M22 10V18.5C22 19.8807 20.8807 21 19.5 21H4.5C3.11929 21 2 19.8807 2 18.5V10H22Z" 
            fill="#007AFF"
        />
        {/* Subtle highlight on the top edge */}
        <path 
            d="M4.5 6.914H19.5C20.3284 6.914 21 7.58557 21 8.414V8.914H3V8.414C3 7.58557 3.67157 6.914 4.5 6.914Z" 
            fill="white" 
            fillOpacity="0.1"
        />
    </svg>
);

export default MacOSFolder;
