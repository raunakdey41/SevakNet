import React from 'react';

export default function SevakNetLogo({ size = 40, showText = true, textColor = '#534AB7', dark = false }) {
    const s = size;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.28, textDecoration: 'none' }}>
            {/* SVG Icon — geometric network node */}
            <svg width={s} height={s} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                {/* Dark circle background */}
                <circle cx="40" cy="40" r="39" fill={dark ? '#0D1B2A' : '#1A1A2E'} />
                {/* Outer glow ring */}
                <circle cx="40" cy="40" r="38" stroke="url(#ringGrad)" strokeWidth="1.2" fill="none" opacity="0.7" />

                {/* Hexagon outline lines */}
                {/* Top */}
                <line x1="40" y1="14" x2="52" y2="21" stroke="#2DD4BF" strokeWidth="0.8" opacity="0.5" />
                <line x1="40" y1="14" x2="28" y2="21" stroke="#2DD4BF" strokeWidth="0.8" opacity="0.5" />
                {/* Middle */}
                <line x1="52" y1="21" x2="52" y2="35" stroke="#2DD4BF" strokeWidth="0.8" opacity="0.4" />
                <line x1="28" y1="21" x2="28" y2="35" stroke="#2DD4BF" strokeWidth="0.4" opacity="0.4" />
                {/* Bottom */}
                <line x1="52" y1="35" x2="40" y2="42" stroke="#2DD4BF" strokeWidth="0.8" opacity="0.5" />
                <line x1="28" y1="35" x2="40" y2="42" stroke="#2DD4BF" strokeWidth="0.8" opacity="0.5" />

                {/* Outer spoke lines */}
                <line x1="40" y1="10" x2="40" y2="14" stroke="#2DD4BF" strokeWidth="0.7" opacity="0.6" />
                <line x1="58" y1="20" x2="55" y2="22" stroke="#2DD4BF" strokeWidth="0.7" opacity="0.5" />
                <line x1="22" y1="20" x2="25" y2="22" stroke="#2DD4BF" strokeWidth="0.7" opacity="0.5" />
                <line x1="58" y1="44" x2="55" y2="42" stroke="#534AB7" strokeWidth="0.7" opacity="0.5" />
                <line x1="22" y1="44" x2="25" y2="42" stroke="#534AB7" strokeWidth="0.7" opacity="0.5" />
                <line x1="40" y1="56" x2="40" y2="52" stroke="#534AB7" strokeWidth="0.7" opacity="0.5" />

                {/* Outer nodes — teal */}
                <circle cx="40" cy="14" r="2.5" fill="#2DD4BF" opacity="0.9" />
                <circle cx="28" cy="21" r="2.2" fill="#2DD4BF" opacity="0.8" />
                <circle cx="52" cy="21" r="2.2" fill="#2DD4BF" opacity="0.8" />
                <circle cx="40" cy="52" r="2.5" fill="#2DD4BF" opacity="0.9" />

                {/* Mid nodes — purple */}
                <circle cx="28" cy="35" r="3" fill="#A855F7" opacity="0.95" />
                <circle cx="52" cy="35" r="3" fill="#A855F7" opacity="0.95" />

                {/* Inner hexagon lines */}
                <line x1="40" y1="22" x2="48" y2="27" stroke="#534AB7" strokeWidth="0.8" opacity="0.7" />
                <line x1="40" y1="22" x2="32" y2="27" stroke="#534AB7" strokeWidth="0.8" opacity="0.7" />
                <line x1="48" y1="27" x2="48" y2="36" stroke="#534AB7" strokeWidth="0.8" opacity="0.6" />
                <line x1="32" y1="27" x2="32" y2="36" stroke="#534AB7" strokeWidth="0.8" opacity="0.6" />
                <line x1="48" y1="36" x2="40" y2="42" stroke="#534AB7" strokeWidth="0.8" opacity="0.7" />
                <line x1="32" y1="36" x2="40" y2="42" stroke="#534AB7" strokeWidth="0.8" opacity="0.7" />

                {/* Inner hex corners to center */}
                <line x1="40" y1="22" x2="40" y2="31" stroke="#7C3AED" strokeWidth="0.6" opacity="0.5" />
                <line x1="48" y1="27" x2="40" y2="31" stroke="#7C3AED" strokeWidth="0.6" opacity="0.5" />
                <line x1="32" y1="27" x2="40" y2="31" stroke="#7C3AED" strokeWidth="0.6" opacity="0.5" />
                <line x1="48" y1="36" x2="40" y2="31" stroke="#7C3AED" strokeWidth="0.6" opacity="0.5" />
                <line x1="32" y1="36" x2="40" y2="31" stroke="#7C3AED" strokeWidth="0.6" opacity="0.5" />
                <line x1="40" y1="42" x2="40" y2="31" stroke="#7C3AED" strokeWidth="0.6" opacity="0.5" />

                {/* Inner hex corner nodes — small teal */}
                <circle cx="40" cy="22" r="1.8" fill="#2DD4BF" opacity="0.85" />
                <circle cx="48" cy="27" r="1.8" fill="#2DD4BF" opacity="0.75" />
                <circle cx="32" cy="27" r="1.8" fill="#2DD4BF" opacity="0.75" />
                <circle cx="48" cy="36" r="1.8" fill="#2DD4BF" opacity="0.75" />
                <circle cx="32" cy="36" r="1.8" fill="#2DD4BF" opacity="0.75" />
                <circle cx="40" cy="42" r="1.8" fill="#2DD4BF" opacity="0.85" />

                {/* Center glow */}
                <circle cx="40" cy="31" r="6" fill="url(#centerGlow)" opacity="0.9" />
                <circle cx="40" cy="31" r="4" fill="url(#innerGlow)" />
                <circle cx="40" cy="31" r="2" fill="white" opacity="0.95" />

                <defs>
                    <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#A855F7" stopOpacity="1" />
                        <stop offset="100%" stopColor="#534AB7" stopOpacity="0.2" />
                    </radialGradient>
                    <radialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#C084FC" stopOpacity="1" />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.8" />
                    </radialGradient>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.6" />
                        <stop offset="50%" stopColor="#A855F7" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#534AB7" stopOpacity="0.6" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Text */}
            {showText && (
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                    <span style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 700,
                        fontSize: size * 0.45,
                        letterSpacing: size * 0.02,
                        color: textColor,
                    }}>
                        SEVAKNET
                    </span>
                    {size >= 36 && (
                        <span style={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 400,
                            fontSize: size * 0.17,
                            letterSpacing: size * 0.025,
                            color: textColor === '#534AB7' ? '#4A4A6A' : 'rgba(255,255,255,0.55)',
                            marginTop: 1,
                            textTransform: 'uppercase',
                        }}>
                            Intelligent Networks · Infinite Reach
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}