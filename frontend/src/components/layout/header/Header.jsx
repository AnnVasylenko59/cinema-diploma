import React from "react";
import { Logo } from "./Logo";
import { Navigation } from "./Navigation";
import { AuthBar } from "./AuthBar";

export const Header = ({ step, setStep, user, onLogout, onOpenLoginModal, onMenuSelect, theme, setTheme }) => {
    return (
        <header className="sticky top-0 z-[100] backdrop-blur-xl bg-white/70 border-b border-gray-100/50 shadow-sm">
            <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">

                <Logo onClick={() => setStep("home")} />

                <Navigation step={step} setStep={setStep} />

                <div className="flex justify-end flex-shrink-0">
                    <div className="bg-gray-50/50 p-1 rounded-2xl border border-gray-100/50 shadow-sm">
                        <AuthBar
                            user={user}
                            onLogout={onLogout}
                            onOpenLoginModal={onOpenLoginModal}
                            onMenuSelect={onMenuSelect}
                            theme={theme}
                            setTheme={setTheme}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};