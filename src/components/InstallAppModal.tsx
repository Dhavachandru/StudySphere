import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, Laptop, Smartphone, CheckCircle, ExternalLink,
  Sparkles, Zap, Shield, Bell, Check, ArrowRight
} from 'lucide-react';
import { usePwaInstall } from '../lib/usePwaInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const { isInstallable, isInstalled, platform, triggerInstall } = usePwaInstall();
  const [activeTab, setActiveTab] = useState<'windows' | 'android' | 'pwa'>(
    platform === 'android' ? 'android' : 'windows'
  );
  const [installedSuccess, setInstalledSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    if (isInstallable) {
      const success = await triggerInstall();
      if (success) {
        setInstalledSuccess(true);
      }
    } else {
      // Guide user based on browser
      alert(
        platform === 'windows'
          ? 'To install on Windows: Click the "Install" or "App available" icon in your browser address bar (Edge or Chrome).'
          : 'To install on Android: Tap the 3-dots browser menu and choose "Add to Home screen" or "Install app".'
      );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-slate-900 border border-white/10 text-white shadow-2xl shadow-indigo-500/10"
        >
          {/* Header Background Glow */}
          <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-br from-indigo-600/30 via-purple-600/20 to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="relative p-6 sm:p-8">
            {/* Title & App Badge */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <img
                  src="/icons/icon-192x192.png"
                  alt="StudySphere Logo"
                  className="w-16 h-16 rounded-2xl shadow-xl shadow-indigo-500/25 border border-white/10 object-cover"
                />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">Get StudySphere App</h2>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    v1.0 Ready
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  Available for Google Play Store, Microsoft Store &amp; Instant Web App
                </p>
              </div>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex p-1 bg-white/5 rounded-2xl mb-6 border border-white/5 overflow-x-auto scrollbar-none gap-1">
              <button
                onClick={() => setActiveTab('windows')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap min-h-[42px] active:scale-95 ${
                  activeTab === 'windows'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Laptop size={16} /> Microsoft Store (Windows)
              </button>
              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap min-h-[42px] active:scale-95 ${
                  activeTab === 'android'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone size={16} /> Google Play (Android)
              </button>
              <button
                onClick={() => setActiveTab('pwa')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap min-h-[42px] active:scale-95 ${
                  activeTab === 'pwa'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap size={16} /> Direct 1-Click Install
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'windows' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      {/* Windows Logo */}
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.8" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-base">Microsoft Store Package</h4>
                      <p className="text-xs text-slate-400">
                        Packaged with Windows App SDK &amp; MSIX for Windows 10 &amp; 11
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleDirectInstall}
                      className="w-full sm:w-auto px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-1.5 active:scale-95 transition min-h-[44px]"
                    >
                      <Download size={15} /> Install on Windows
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                    <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                    <span>Native Windows Start Menu &amp; Taskbar integration</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                    <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                    <span>Hardware acceleration &amp; zero browser tab memory load</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                    <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                    <span>Live tiles, system notifications &amp; offline mode</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'android' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      {/* Google Play Logo */}
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a1.99 1.99 0 0 1-.61-1.428V3.242c0-.555.226-1.059.61-1.428zm11.242 11.245l2.42 2.42-12.022 6.942 9.602-9.362zm0-2.118L5.25 1.579 17.27 8.52l-2.42 2.421zm1.06 1.059l3.525 2.036c.866.5.866 1.328 0 1.828l-3.525 2.036-2.06-2.06 2.06-2.04z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-base">Google Play Store Bundle</h4>
                      <p className="text-xs text-slate-400">
                        Native Android build with APK / AAB &amp; full hardware support
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleDirectInstall}
                      className="w-full sm:w-auto px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 active:scale-95 transition min-h-[44px]"
                    >
                      <Download size={15} /> Install on Android
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                    <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                    <span>Smooth mobile gestures &amp; bottom-sheet navigation</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                    <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                    <span>Android Adaptive rounded icons &amp; splash screen</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                    <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                    <span>Instant offline note taking &amp; timetable alarms</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pwa' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base">Direct Browser App</h4>
                      <p className="text-xs text-slate-400">
                        {isInstalled
                          ? 'StudySphere is already installed on this device!'
                          : isInstallable
                          ? 'Ready to install immediately with one click!'
                          : 'Install via your browser’s "Install App" button in the URL bar'}
                      </p>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto">
                    {isInstalled || installedSuccess ? (
                      <div className="px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-emerald-500/30 min-h-[44px]">
                        <Check size={16} /> App Installed!
                      </div>
                    ) : (
                      <button
                        onClick={handleDirectInstall}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-purple-500/25 flex items-center justify-center gap-1.5 active:scale-95 transition min-h-[44px]"
                      >
                        <Download size={15} /> Install Now
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
                  <Sparkles size={16} className="shrink-0 text-indigo-400" />
                  <span>
                    No download or app store sign-in required! Installs directly to your home screen or desktop application list in under 2 seconds.
                  </span>
                </div>
              </div>
            )}

            {/* App Features List */}
            <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-indigo-400" />
                <span>100% Secure &amp; Sandboxed</span>
              </div>
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-indigo-400" />
                <span>Live Class &amp; Exam Alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-indigo-400" />
                <span>Lightning Instant Launch</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
