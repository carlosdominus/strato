import React from 'react';

interface TomatoIconProps {
  className?: string;
  size?: number;
}

export const TomatoIcon: React.FC<TomatoIconProps> = ({ className = 'w-6 h-6', size }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        {/* Gradient for juicy tomato body */}
        <radialGradient id="tomatoBodyGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FF5C38" />
          <stop offset="55%" stopColor="#E13513" />
          <stop offset="100%" stopColor="#A81D05" />
        </radialGradient>
        
        {/* Soft highlight */}
        <linearGradient id="tomatoHighlight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Leaf green gradient */}
        <linearGradient id="leafGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#11310C" />
        </linearGradient>
      </defs>

      {/* Tomato Body */}
      <path
        d="M16 8.5C10 8.5 4.5 11.5 4.5 18C4.5 24.5 9.5 28.5 16 28.5C22.5 28.5 27.5 24.5 27.5 18C27.5 11.5 22 8.5 16 8.5Z"
        fill="url(#tomatoBodyGrad)"
      />

      {/* Subtle shine curve */}
      <path
        d="M9.5 13C11 11.5 13.5 10.8 15.5 10.8C15 11.8 14 13.5 11 14.5C9.8 14.2 9.5 13.5 9.5 13Z"
        fill="url(#tomatoHighlight)"
      />

      {/* Stem Loop */}
      <path
        d="M16 9.5C16 9.5 15.2 6 17.5 4.5C18.2 4 19 4.2 18.8 5C18.4 6 17.2 7.8 16 9.5Z"
        fill="url(#leafGrad)"
      />

      {/* Tomato Calyx / Leaves (Star Crown) */}
      <path
        d="M16 9.2C14.5 8 11 7.2 9.5 8.2C11 9.5 13 10.2 15 10.5C14 12 12.5 13.5 12 15C13.5 14 15 12.2 16 11C17 12.2 18.5 14 20 15C19.5 13.5 18 12 17 10.5C19 10.2 21 9.5 22.5 8.2C21 7.2 17.5 8 16 9.2Z"
        fill="url(#leafGrad)"
      />
    </svg>
  );
};
