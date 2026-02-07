import React from "react";
import { RefreshCw } from "lucide-react";

export const LoadingState = ({ label }) => (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
        <RefreshCw className="animate-spin text-blue-500" size={40} />
        {label && (
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {label}
            </span>
        )}
    </div>
);