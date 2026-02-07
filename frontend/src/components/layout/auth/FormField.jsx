import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const FormField = ({
                              label,
                              icon: Icon,
                              rightElement,
                              error,
                              loading,
                              className = "",
                              ...props
                          }) => {

    // Динамічні класи для станів поля
    const inputClasses = `
        w-full border rounded-2xl py-3.5 text-base font-medium outline-none transition-all
        ${Icon ? 'pl-11' : 'px-4'} 
        ${(rightElement || error || loading) ? 'pr-11' : 'px-4'}
        ${error
        ? 'border-red-300 bg-red-50 focus:ring-4 focus:ring-red-400/5 focus:border-red-500 text-red-900'
        : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white text-slate-900'
    }
        ${loading ? 'opacity-70 cursor-wait' : ''} 
        ${className}
    `.replace(/\s+/g, ' ').trim();

    return (
        <div className="space-y-1.5 w-full">
            {label && (
                <label className="text-[13px] font-semibold text-slate-700 ml-1 uppercase tracking-wider flex justify-between">
                    <span>
                        {label} {props.required && <span className="text-red-500">*</span>}
                    </span>
                </label>
            )}

            <div className="relative">
                {/* Ліва іконка */}
                {Icon && (
                    <Icon
                        size={18}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors z-10 ${
                            error ? 'text-red-400' : 'text-slate-400'
                        }`}
                    />
                )}

                <input
                    {...props}
                    disabled={loading || props.disabled}
                    className={inputClasses}
                />

                {/* Правий блок: Спінер, Елемент або Помилка */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {loading ? (
                        <Loader2 size={18} className="text-blue-500 animate-spin" />
                    ) : (
                        <>
                            {rightElement}
                            {error && !rightElement && (
                                <AlertCircle size={18} className="text-red-500" />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Анімоване повідомлення про помилку */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -5 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <p className="mt-1 text-red-600 text-[11px] font-bold ml-1">
                            {error}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};