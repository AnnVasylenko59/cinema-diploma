import React, { useState, useEffect, useMemo } from "react";
import { Mail, Lock, User, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "../../ui/Atoms.jsx";
import { useTranslation } from "react-i18next";
import { BaseAuthModal } from "./BaseAuthModal.jsx";
import { FormField } from "./FormField.jsx";
import { PasswordRequirements } from "./PasswordRequirements.jsx";
import { AuthFooter } from "./AuthFooter.jsx";
import { authAPI } from "../../../services/api.js";

export const RegisterModal = ({ open, onClose, onSwitchToLogin, onRegister }) => {
    const { t } = useTranslation();

    // Основні стани форми
    const [login, setLogin] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Стани для валідації "на льоту"
    const [loginError, setLoginError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [checkingLogin, setCheckingLogin] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Очищення форми при закритті
    useEffect(() => {
        if (!open) {
            setLogin(""); setName(""); setEmail(""); setPassword(""); setConfirmPassword("");
            setLoginError(""); setEmailError("");
            setShowPassword(false); setError(""); setLoading(false);
        }
    }, [open]);

    // Перевірка доступності ЛОГІНА (Debounce)
    useEffect(() => {
        if (login.length < 3) {
            setLoginError("");
            return;
        }

        const timeoutId = setTimeout(async () => {
            setCheckingLogin(true);
            try {
                const { data } = await authAPI.checkAvailability({ login });
                if (!data.available) {
                    setLoginError(t('auth.errors.login_taken') || "Цей логін вже зайнятий");
                } else {
                    setLoginError("");
                }
            } catch (err) {
                console.error("Login check error:", err);
            } finally {
                setCheckingLogin(false);
            }
        }, 600);

        return () => clearTimeout(timeoutId);
    }, [login, t]);

    // Перевірка доступності EMAIL (Debounce)
    useEffect(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError("");
            return;
        }

        const timeoutId = setTimeout(async () => {
            setCheckingEmail(true);
            try {
                const { data } = await authAPI.checkAvailability({ email });
                if (!data.available) {
                    setEmailError(t('auth.errors.email_taken') || "Цей email вже використовується");
                } else {
                    setEmailError("");
                }
            } catch (err) {
                console.error("Email check error:", err);
            } finally {
                setCheckingEmail(false);
            }
        }, 600);

        return () => clearTimeout(timeoutId);
    }, [email, t]);

    const passwordRequirements = useMemo(() => [
        { label: t('auth.requirements.length'), met: password.length >= 8 },
        { label: t('auth.requirements.upper'), met: /[A-Z]/.test(password) },
        { label: t('auth.requirements.lower'), met: /[a-z]/.test(password) },
        { label: t('auth.requirements.digit'), met: /[0-9]/.test(password) },
    ], [password, t]);

    const isPasswordValid = passwordRequirements.every(r => r.met);

    // Чи можна відправляти форму
    const isFormValid = useMemo(() => {
        return isPasswordValid &&
            password === confirmPassword &&
            login.length >= 3 &&
            !loginError &&
            !emailError &&
            email && name;
    }, [isPasswordValid, password, confirmPassword, login, loginError, emailError, email, name]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        setLoading(true);
        try {
            const result = await onRegister({ login, name, email, password });
            if (result.success) onClose(); else setError(result.error);
        } catch {
            setError(t('auth.error_default'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseAuthModal open={open} onClose={onClose} title={t('auth.register_title')} subtitle={t('auth.register_subtitle')} maxWidth="500px">
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                        label={t('auth.fields.login')}
                        value={login}
                        icon={User}
                        onChange={e => setLogin(e.target.value)}
                        placeholder="user123"
                        loading={checkingLogin}
                        error={loginError}
                        required
                    />
                    <FormField
                        label={t('auth.fields.name')}
                        value={name}
                        icon={User}
                        onChange={e => setName(e.target.value)}
                        placeholder={t('auth.fields.name_placeholder')}
                        loading={loading}
                        required
                    />
                </div>

                <FormField
                    label={t('auth.fields.email')}
                    type="email"
                    value={email}
                    icon={Mail}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('auth.fields.email_placeholder')}
                    loading={checkingEmail}
                    error={emailError}
                    required
                />

                <div className="space-y-2">
                    <FormField
                        label={t('auth.fields.password')}
                        value={password}
                        icon={Lock}
                        type={showPassword ? "text" : "password"}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        rightElement={
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        }
                    />
                    <PasswordRequirements isVisible={password.length > 0} requirements={passwordRequirements} />
                </div>

                <FormField
                    label={t('auth.fields.confirm_password')}
                    value={confirmPassword}
                    icon={Lock}
                    type={showPassword ? "text" : "password"}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    error={confirmPassword && password !== confirmPassword ? t('auth.fields.mismatch') : ""}
                    loading={loading}
                    required
                />

                {error && <div className="text-red-600 text-[11px] font-bold text-center bg-red-50 p-2.5 rounded-xl border border-red-100">{error}</div>}

                <Button
                    type="submit"
                    disabled={loading || !isFormValid || checkingLogin || checkingEmail}
                    className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest hover:bg-[#ef4444] transition-all mt-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? t('auth.register_loading') : t('auth.register_button')}
                </Button>
            </form>

            <AuthFooter text={t('auth.have_account')} linkText={t('auth.login_link')} onClick={() => { onClose(); onSwitchToLogin(); }} />
        </BaseAuthModal>
    );
};