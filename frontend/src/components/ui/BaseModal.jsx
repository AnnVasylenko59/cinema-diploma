import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export const BaseModal = ({
                              open, onClose, title, icon: Icon,
                              iconColorClass = "text-blue-500",
                              iconBgClass = "bg-blue-50",
                              maxWidth = "max-w-2xl",
                              children, footer
                          }) => {
    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className={`bg-white w-full ${maxWidth} rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/20`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ХЕДЕР — Зменшено py-8 до py-5 */}
                    <div className="flex items-center justify-between px-8 py-5 border-b border-gray-50 flex-shrink-0">
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tighter">
                            {Icon && (
                                <div className={`p-2.5 ${iconBgClass} rounded-xl shadow-sm`}>
                                    <Icon className={iconColorClass} size={20} fill={iconColorClass.includes('fill') ? 'currentColor' : 'none'} />
                                </div>
                            )}
                            {title}
                        </h2>
                        <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-full border transition-all text-gray-400 hover:text-gray-900">
                            <X size={18} />
                        </button>
                    </div>

                    {/* КОНТЕНТ — Зменшено py-8 до py-4 */}
                    <div className="flex-1 overflow-y-auto custom-inner-scrollbar px-8 pt-4 pb-2 pr-4 mr-6 mb-2">
                        {children}
                    </div>

                    {/* ФУТЕР — Зменшено p-8 до p-5 */}
                    {footer && (
                        <div className="bg-gray-50/50 p-5 border-t border-gray-100 flex-shrink-0">
                            {footer}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};