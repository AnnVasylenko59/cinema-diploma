import React, { useState, useRef, useEffect, useCallback } from "react";
import { User, Camera, Save, RefreshCw, ChevronLeft, ZoomIn, ZoomOut, X, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { authAPI, movieAPI } from "../../../../services/api";

import { BaseModal } from "../../../ui/BaseModal.jsx";
import { ModalButton } from "../../../ui/ModalButton.jsx";
import { LoadingState } from "../../../pages/LoadingState.jsx";

import { AvatarSection } from "./AvatarSection";
import { ImageCropper } from "./ImageCropper";
import { styles } from "./SettingsStyles";

export const ProfileSettingsModal = ({ open, onClose, user, onSave, onGoHome }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [genresLoading, setGenresLoading] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({ name: "", email: "", avatar: "", favoriteGenres: [] });
    const [availableGenres, setAvailableGenres] = useState([]);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showCropper, setShowCropper] = useState(false);

    useEffect(() => {
        if (open && user) {
            setFormData({
                name: user.name || "", email: user.email || "",
                avatar: user.avatar || "", favoriteGenres: user.favoriteGenres || []
            });
            fetchGenres();
        }
    }, [user, open]);

    const fetchGenres = async () => {
        setGenresLoading(true);
        try {
            const res = await movieAPI.getGenres();
            setAvailableGenres(res.data.genres || res.data || []);
        } catch (err) { console.error(err); }
        finally { setGenresLoading(false); }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await authAPI.updateProfile(formData);
            onSave(res.data.user || res.data);
            onClose();
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const onFileChange = (e) => {
        if (e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onload = () => { setImageSrc(reader.result); setShowCropper(true); };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const Footer = showCropper ? (
        <div className="flex gap-3">
            <ModalButton variant="outline" onClick={() => setShowCropper(false)} icon={X} className="flex-1">{t('profile.cropper.cancel')}</ModalButton>
            <ModalButton variant="primary" onClick={async () => {/* Логіка handleDoCrop */}} icon={loading ? RefreshCw : Check} className="flex-[1.5]" loading={loading}>{t('profile.cropper.apply')}</ModalButton>
        </div>
    ) : (
        <div className="flex flex-col gap-3">
            <ModalButton variant="primary" onClick={handleSave} icon={Save} loading={loading}>{t('profile.buttons.save')}</ModalButton>
            <ModalButton variant="outline" onClick={onGoHome} icon={ChevronLeft}>{t('profile.buttons.home')}</ModalButton>
        </div>
    );

    return (
        <BaseModal
            open={open} onClose={onClose} footer={Footer} maxWidth="max-w-md"
            title={showCropper ? t('profile.cropper.title') : t('profile.settings')}
            icon={showCropper ? Camera : User}
            iconBgClass="bg-blue-50 border border-blue-100 shadow-inner"
        >
            {showCropper ? (
                <ImageCropper image={imageSrc} crop={crop} zoom={zoom} setCrop={setCrop} setZoom={setZoom} onCropComplete={(_, p) => setCroppedAreaPixels(p)} />
            ) : (
                <div className="space-y-4">
                    <div className="flex p-1 bg-slate-100 rounded-[1.2rem] gap-1">
                        {["profile", "genres"].map(id => (
                            <button
                                key={id} onClick={() => setActiveTab(id)}
                                className={`${styles.tabBtn} ${activeTab === id ? styles.activeTab : styles.inactiveTab}`}
                            >
                                {t(`profile.tabs.${id}`)}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[270px]">
                        {activeTab === "profile" ? (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <AvatarSection avatar={formData.avatar} onFileClick={() => fileInputRef.current.click()} fileInputRef={fileInputRef} onFileChange={onFileChange} />
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className={styles.inputLabel}>{t('profile.fields.name')}</label>
                                        <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={styles.input} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={styles.inputLabel}>{t('profile.fields.email')}</label>
                                        <input type="email" value={formData.email} readOnly className={`${styles.input} bg-transparent cursor-not-allowed opacity-50`} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <p className="text-[11px] font-bold uppercase text-slate-400 opacity-70">{t('profile.genres.instruction')}</p>
                                {genresLoading ? (
                                    <LoadingState />
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {availableGenres.map(genre => {
                                            const name = typeof genre === 'string' ? genre : (genre.name || genre.title);
                                            const isSelected = formData.favoriteGenres.includes(name);
                                            return (
                                                <button
                                                    key={name}
                                                    onClick={() => setFormData({...formData, favoriteGenres: isSelected ? formData.favoriteGenres.filter(g => g !== name) : [...formData.favoriteGenres, name]})}
                                                    className={`${styles.genreBtn} ${isSelected ? "bg-blue-600 border-blue-600 text-white shadow-blue-100" : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"}`}
                                                >
                                                    {name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </BaseModal>
    );
};