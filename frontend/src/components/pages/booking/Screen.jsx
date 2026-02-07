import React from "react";

const Screen = ({ label }) => (
    <div className="relative w-full mb-12 flex flex-col items-center">
        <div className="relative w-full max-w-2xl">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full h-[80px] bg-gradient-to-b from-blue-500/20 to-transparent rounded-full blur-[40px] pointer-events-none" />

            <svg viewBox="0 0 200 30" className="w-full h-auto drop-shadow-[0_12px_15px_rgba(59,130,246,0.3)] relative z-10" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="screenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                        <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.1" />
                    </linearGradient>
                </defs>
                <path d="M 10,25 Q 100,5 190,25" fill="none" stroke="url(#screenGradient)" strokeWidth="4" strokeLinecap="round" />
            </svg>
        </div>

        <p className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-400 mt-6 leading-none">
            {label}
        </p>
    </div>
);

export default Screen;