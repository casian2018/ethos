"use client";

import { useState, useRef, useCallback } from "react";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export default function UploadZone({ onFileSelect, isProcessing }: UploadZoneProps) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate upload progress
  const simulateUploadProgress = useCallback(() => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Random increment for realistic feel
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
      simulateUploadProgress();
    }
  }, [onFileSelect, simulateUploadProgress]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
      simulateUploadProgress();
    }
  };

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        relative overflow-hidden rounded-2xl cursor-pointer
        transition-all duration-300 ease-out
        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer 
        hover:border-emerald-500 transition-all
        ${isDragging 
          ? "border-emerald-500 bg-emerald-500/10 scale-[1.02]" 
          : "border-slate-300 hover:border-emerald-400"
        }
        ${isProcessing ? "pointer-events-none opacity-50" : ""}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5" />
      
      <div className="relative z-10">
        {isProcessing ? (
          <div className="flex flex-col items-center">
            {/* Progress Ring */}
            <div className="w-20 h-20 mb-4 relative">
              <svg className="w-20 h-20 transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-emerald-200"
                />
                {/* Progress circle */}
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${Math.min(uploadProgress, 100) * 2.2} 220`}
                  strokeLinecap="round"
                  className="text-emerald-500 transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-emerald-600 font-bold text-lg">
                  {Math.min(Math.round(uploadProgress), 100)}%
                </span>
              </div>
            </div>
            
            {/* Progress message */}
            <p className="text-slate-700 font-medium">{t("sleep.processing")}</p>
            <p className="text-slate-500 text-sm mt-1">{t("sleep.analyzing")}</p>
            
            {/* Progress bar */}
            <div className="w-full max-w-xs mt-4">
              <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-slate-700 font-semibold text-lg">{t("sleep.dragDrop")}</p>
            <p className="text-slate-500 text-sm mt-1">{t("sleep.orClick")}</p>
            <p className="text-slate-400 text-xs mt-3">{t("sleep.supportedFormats")}</p>
          </div>
        )}
      </div>
      
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-emerald-500/0 hover:bg-emerald-500/5 transition-colors duration-300 rounded-2xl" />
    </div>
  );
}
