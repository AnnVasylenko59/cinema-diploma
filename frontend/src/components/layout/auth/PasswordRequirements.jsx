import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

export const PasswordRequirements = ({ isVisible, requirements = [] }) => (
    <AnimatePresence>
        {isVisible && (
            <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="grid grid-cols-2 gap-x-4 gap-y-2 px-1 overflow-hidden"
            >
                {requirements.map((req, i) => (
                    <div
                        key={i}
                        className={`flex items-center gap-2 transition-colors duration-300 ${
                            req.met ? "text-green-500" : "text-slate-400"
                        }`}
                    >
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all ${
                            req.met ? "bg-green-500 border-green-500" : "border-slate-200"
                        }`}>
                            <Check size={9} className="text-white" strokeWidth={4} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tight">
                            {req.label}
                        </span>
                    </div>
                ))}
            </motion.div>
        )}
    </AnimatePresence>
);