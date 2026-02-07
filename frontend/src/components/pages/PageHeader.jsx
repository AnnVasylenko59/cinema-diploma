import React from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "../ui/Atoms";

export const PageHeader = ({ title, subtitle, icon: Icon, iconBg = "bg-blue-600", onBack, backLabel }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/50 shadow-sm">
        <div className="flex items-center gap-4">
            <div className={`${iconBg} p-3 rounded-2xl shadow-lg text-white`}>
                <Icon size={24} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {subtitle}
                </p>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 truncate tracking-tighter uppercase leading-tight">
                    {title}
                </h3>
            </div>
        </div>
        <Button
            variant="ghost"
            onClick={onBack}
            className="px-10 py-4 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-blue-600 hover:border-blue-400 group"
            icon={(props) => (
                <ChevronLeft
                    {...props}
                    size={20}
                    className="group-hover:-translate-x-1 transition-transform"
                />
            )}
        >
            {backLabel}
        </Button>
    </div>
);