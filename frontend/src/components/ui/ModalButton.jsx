import React from "react";
import { RefreshCw } from "lucide-react";

export const ModalButton = ({
                                onClick,
                                children,
                                icon: Icon,
                                variant = "outline",
                                loading = false,
                                className = "",
                                type = "button"
                            }) => {
    const baseStyles = "flex items-center justify-center gap-2 px-10 py-4 rounded-full font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap group";

    const variants = {
        outline: "bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10",
        primary: "bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/20"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={loading}
            className={`${baseStyles} ${variants[variant]} ${loading ? "opacity-70 cursor-not-allowed" : ""} ${className}`}
        >
            {loading ? (
                <RefreshCw size={18} strokeWidth={3} className="animate-spin" />
            ) : Icon && (
                <Icon size={18} strokeWidth={3} className="transition-transform duration-500 group-hover:scale-110" />
            )}
            <span className="leading-none">{children}</span>
        </button>
    );
};