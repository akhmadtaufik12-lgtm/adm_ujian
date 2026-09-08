import React from 'react';
import { ActiveTab, ExamConfig } from '../types';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  DoorOpen, 
  Grid3X3, 
  IdCard, 
  FileText, 
  Printer,
  RotateCcw,
  ExternalLink
} from 'lucide-react';

interface HeaderProps {
  config: ExamConfig;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onResetData: () => void;
  onQuickPrint: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  activeTab,
  setActiveTab,
  onResetData,
  onQuickPrint,
}) => {
  const examBadgeColors: Record<string, string> = {
    STS: 'bg-amber-50 text-amber-700 border-amber-200',
    SAS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    SAT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    US: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'config', label: 'Identitas & Ujian', icon: <Settings className="w-4 h-4" /> },
    { id: 'students', label: 'Data Peserta', icon: <Users className="w-4 h-4" /> },
    { id: 'rooms', label: 'Ruang & Plotting', icon: <DoorOpen className="w-4 h-4" /> },
    { id: 'seating', label: 'Denah Meja', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'cards', label: 'Cetak Kartu', icon: <IdCard className="w-4 h-4" /> },
    { id: 'documents', label: 'Dokumen Ujian', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & App Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-xs">
              <div className="w-5 h-1 bg-white rounded-full mb-1"></div>
              <div className="w-5 h-1 bg-white rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight leading-none text-base">
                  EXAM-SYNC
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${examBadgeColors[config.examType] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  {config.examType}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">
                Sistem Manajemen Ujian
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs with Clean Minimalism Border-Bottom Active Indicator */}
          <nav className="hidden lg:flex items-center gap-6 h-full" aria-label="Tabs">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`h-full flex items-center gap-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-slate-500 hover:text-slate-800 border-transparent'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Section: School / User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[200px]">
                {config.schoolName}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-medium tracking-wide">
                TP {config.academicYear} • Panitia
              </p>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              {typeof window !== 'undefined' && window.self !== window.top && (
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Buka aplikasi di tab baru browser (layar penuh untuk cetak lancar tanpa batasan iframe)"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden md:inline">Buka Tab Baru</span>
                </a>
              )}

              <button
                onClick={onResetData}
                title="Kembalikan ke data contoh lengkap"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onQuickPrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cetak PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden border-t border-slate-100 py-1 overflow-x-auto scrollbar-none flex gap-4">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-2 px-1 flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-slate-500 hover:text-slate-800 border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
