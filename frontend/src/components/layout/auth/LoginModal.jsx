import React, { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "../../ui/Atoms.jsx";
import { useTranslation } from "react-i18next";
import { BaseAuthModal } from "./BaseAuthModal.jsx";
import { FormField } from "./FormField.jsx";
import { AuthFooter } from "./AuthFooter.jsx";

export const LoginModal = ({ open, onClose, onLogin, onSwitchToRegister }) => {
    const { t } = useTranslation();
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            setLogin(""); setPassword(""); setShowPassword(false); setError(""); setLoading(false);
        }
    }, [open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!login || !password) { setError(t('auth.error_empty')); return; }
        setLoading(true);
        try {
            const result = await onLogin({ login, password });
            if (result.success) onClose(); else setError(result.error);
        } catch { setError(t('auth.error_unexpected')); } finally { setLoading(false); }
    };

    return (
        <BaseAuthModal open={open} onClose={onClose} title={t('auth.login_title')} subtitle={t('auth.login_subtitle')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label={t('auth.fields.login')} icon={Mail} autoFocus disabled={loading} placeholder={t('auth.fields.login_placeholder')} value={login} onChange={e => setLogin(e.target.value)} />

                <FormField
                    label={t('auth.fields.password')}
                    icon={Lock}
                    type={showPassword ? "text" : "password"}
                    disabled={loading}
                    placeholder={t('auth.fields.password_placeholder')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    rightElement={<button type="button" className="text-slate-400" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
                />

                {error && <div className="text-red-600 text-xs font-bold text-center bg-red-50 p-2.5 rounded-xl border border-red-100">{error}</div>}

                <Button type="submit" disabled={loading} className="w-full py-4 bg-[#ef4444] text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-600 transition-all mt-2">
                    {loading ? t('auth.login_loading') : t('auth.login_button')}
                </Button>
            </form>

            <AuthFooter text={t('auth.no_account')} linkText={t('auth.register_link')} onClick={() => { onClose(); onSwitchToRegister(); }} />
        </BaseAuthModal>
    );
};