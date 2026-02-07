import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { LanguageToggle } from "../../ui/LanguageToggle.jsx";

export const BaseAuthModal = ({
                                  open,
                                  onClose,
                                  title,
                                  subtitle,
                                  children,
                                  maxWidth = "500px",
                                  showLanguageToggle = true
                              }) => {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.98, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.98, opacity: 0, y: 10 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        style={{ maxWidth }}
                        className="bg-white rounded-[2.5rem] p-3 shadow-2xl w-full relative border border-slate-100 max-h-[95vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute left-8 top-8 z-10">
                            {showLanguageToggle && <LanguageToggle />}
                        </div>

                        <div className="absolute right-8 top-8 z-10">
                            <button
                                onClick={onClose}
                                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto custom-inner-scrollbar w-full h-full p-6 pt-10">
                            <div className="mb-6 text-center">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                                    {title}
                                </h2>
                                {subtitle && (
                                    <p className="text-xs text-slate-500 mt-1 font-medium">
                                        {subtitle}
                                    </p>
                                )}
                            </div>

                            {/* Контент форми */}
                            <div className="pb-2">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};