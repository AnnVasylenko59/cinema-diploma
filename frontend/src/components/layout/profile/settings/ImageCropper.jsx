import React from "react";
import Cropper from 'react-easy-crop';
import { ZoomIn, ZoomOut } from "lucide-react";

export const ImageCropper = ({ image, crop, zoom, setCrop, setZoom, onCropComplete }) => (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
        <div className="relative w-full h-[280px] bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100">
            <Cropper
                image={image} crop={crop} zoom={zoom} aspect={1}
                onCropChange={setCrop} onZoomChange={setZoom}
                onCropComplete={onCropComplete} objectFit="contain"
            />
        </div>
        <div className="flex items-center gap-4 px-2 py-1">
            <ZoomOut size={16} className="text-slate-400" />
            <input
                type="range" value={zoom} min={1} max={3} step={0.1}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <ZoomIn size={16} className="text-slate-400" />
        </div>
    </div>
);