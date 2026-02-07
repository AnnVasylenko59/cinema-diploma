export const styles = {
    card: "bg-white/80 backdrop-blur-2xl rounded-[3.5rem] p-10 md:p-16 border border-white shadow-[0_40px_100px_rgba(0,0,0,0.05)] text-center relative overflow-hidden",
    glow: "absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-400/10 blur-[80px] rounded-full pointer-events-none",
    badge: "bg-emerald-500 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-200",
    btnHome: "flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200",
    btnDownload: "flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-[1.5rem] font-bold text-sm uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95"
};

export const badgeVariants = {
    initial: { rotate: -10, scale: 0 },
    animate: { rotate: 0, scale: 1 },
    transition: { delay: 0.2, type: "spring", stiffness: 200 }
};