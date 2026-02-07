import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { styles } from "./EmptyStateStyles";

export const EmptyState = ({
                               icon: Icon,
                               title,
                               description,
                               onAction,
                               actionLabel,
                               variant = "dashed"
                           }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${styles[variant]} flex flex-col items-center justify-center`}
        >
            <div className="bg-white p-8 rounded-full shadow-xl mb-6 relative group">
                <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                {Icon && <Icon size={60} className="text-slate-300 relative z-10" strokeWidth={1.5} />}
            </div>

            <h2 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">
                {title}
            </h2>

            <p className="text-slate-400 mt-2 max-w-sm text-center font-medium text-sm px-6">
                {description}
            </p>

            {actionLabel && (
                <button
                    onClick={onAction}
                    className="mt-8 flex items-center justify-center gap-2 px-8 py-3.5 bg-white border border-slate-200 rounded-full font-black text-[11px] uppercase tracking-widest text-slate-600 hover:text-blue-600 hover:border-blue-400 transition-all active:scale-95 shadow-sm"
                >
                    <ChevronLeft size={16} strokeWidth={3} />
                    <span>{actionLabel}</span>
                </button>
            )}
        </motion.div>
    );
};