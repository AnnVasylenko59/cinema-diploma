import React from "react";
import { RefreshCw } from "lucide-react";

export const Badge = ({ children, variant = "default", className = "" }) => {
    const variants = {
        default: "bg-slate-50 border-slate-100 text-slate-500",
        primary: "bg-blue-50 border-blue-100 text-blue-500",
        warning: "bg-yellow-400/10 border-yellow-400/20 text-yellow-600",
        danger: "bg-red-50 border-red-100 text-red-500",
        success: "bg-emerald-50 border-emerald-100 text-emerald-600",
    };
    return (
        <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

export const Card = ({ children, onClick, className = "" }) => (
    <div onClick={onClick} className={`rounded-[2.5rem] border border-slate-100 p-4 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 cursor-pointer bg-white relative overflow-hidden group ${className}`}>
        {children}
    </div>
);

export const Button = ({ children, onClick, variant = "primary", className = "", loading = false, icon: Icon }) => {
    const variants = {
        primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-200 shadow-red-500/20",
        outline: "bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 shadow-sm",
        ghost: "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600",
    };

    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`flex items-center justify-center gap-3 rounded-[1.5rem] px-8 py-4 font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${variants[variant]} ${className}`}
        >
            {loading ? <RefreshCw className="animate-spin" size={16} /> : Icon && <Icon size={18} />}
            {children && <span className="leading-none">{children}</span>}
        </button>
    );
};