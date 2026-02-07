import React from "react";
import { User, Camera } from "lucide-react";

export const AvatarSection = ({ avatar, onFileClick, fileInputRef, onFileChange }) => (
    <div className="flex flex-col items-center pb-1">
        <div className="relative group">
            <div className="w-24 h-24 rounded-[2rem] bg-slate-50 border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center">
                {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <User size={40} className="text-slate-300" strokeWidth={1.5} />
                )}
            </div>
            <button
                type="button"
                onClick={onFileClick}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2.5 rounded-full border-2 border-white shadow-lg hover:bg-blue-700 hover:scale-110 transition-all z-10"
            >
                <Camera size={16} strokeWidth={2.5} />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileChange} />
        </div>
    </div>
);