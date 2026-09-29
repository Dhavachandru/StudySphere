import React, { useState, useEffect } from 'react';
import { Download, X, Laptop, Smartphone } from 'lucide-react';
import { usePwaInstall } from '../lib/usePwaInstall';
import { InstallAppModal } from './InstallAppModal';

export function InstallAppBanner() {
  const { isInstalled, platform } = usePwaInstall();
  const [showBanner, setShowBanner] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Check if dismissed previously this session
    const isDismissed = sessionStorage.getItem('studysphere_install_dismissed');
    if (!isInstalled && !isDismissed) {
      // Delay display slightly so it doesn't jarringly pop up on immediate mount
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isInstalled]);

  if (!showBanner || isInstalled) return (
    <>
      <InstallAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('studysphere_install_dismissed', 'true');
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40">
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/95 border border-indigo-500/30 text-white shadow-2xl shadow-indigo-500/20 backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30">
            {platform === 'android' ? (
              <Smartphone size={20} className="text-white" />
            ) : (
              <Laptop size={20} className="text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h5 className="font-semibold text-xs sm:text-sm truncate">
              {platform === 'android' ? 'Get Android App' : 'Get Desktop App'}
            </h5>
            <p className="text-[11px] text-slate-400 truncate">
              Install for offline notes, AI &amp; quick launch
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 flex items-center gap-1 transition"
            >
              <Download size={13} /> Install
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              aria-label="Dismiss banner"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>

      <InstallAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
