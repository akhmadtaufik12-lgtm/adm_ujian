import React, { useState, useMemo } from 'react';
import { ExamConfig, ExamRoom, Student, ExamScheduleItem } from '../types';
import { BarcodeSVG } from '../utils/barcode';
import { IMAGE_SAMPLE_SCHEDULE, MTS_MADRASAH_SCHEDULE } from '../data/schedulePresets';
import { 
  Printer, 
  Search, 
  Layers, 
  Award, 
  Calendar,
  Settings2,
  Sparkles,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Clock,
  BookOpen,
  ExternalLink,
  AlertCircle,
  X
} from 'lucide-react';

interface ExamCardsViewProps {
  config: ExamConfig;
  students: Student[];
  rooms: ExamRoom[];
  schedules?: ExamScheduleItem[];
  onUpdateSchedules?: (schedules: ExamScheduleItem[]) => void;
}

// Group schedules by day for the table
interface GroupedScheduleDay {
  dayName: string;
  date: string;
  sessions: {
    id: string;
    jamKe: number;
    time: string;
    subject: string;
    overallIndex: number;
  }[];
}

export const ExamCardsView: React.FC<ExamCardsViewProps> = ({
  config,
  students,
  rooms,
  schedules: propSchedules,
  onUpdateSchedules,
}) => {
  // Filters
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Card Format: 'schedule_card' matches the user's uploaded image with the table on the right
  const [cardFormat, setCardFormat] = useState<'schedule_card' | 'compact_card'>('schedule_card');
  const [paperSize, setPaperSize] = useState<'F4' | 'A4'>('F4');
  const [cardLayout, setCardLayout] = useState<'3_per_page' | '2_per_page' | '1_per_page' | '6_per_page' | '4_per_page'>('3_per_page');
  const [signatory, setSignatory] = useState<'committee' | 'principal'>('committee'); // Ketua Pelaksana as in example image

  // Schedule management
  const [activePreset, setActivePreset] = useState<'sample_image' | 'mts' | 'custom'>('sample_image');
  const [localSchedules, setLocalSchedules] = useState<ExamScheduleItem[]>(() => {
    return IMAGE_SAMPLE_SCHEDULE;
  });
  const [scheduleTitle, setScheduleTitle] = useState('JADWAL UAS GENAP KELAS VII DAN VIII');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // All unique classes
  const classes = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.className))).sort();
  }, [students]);

  // Filter students for printing
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchRoom = selectedRoom === 'ALL' || s.roomId === selectedRoom;
      const matchClass = selectedClass === 'ALL' || s.className === selectedClass;
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.examNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nisn.includes(searchTerm);
      return matchRoom && matchClass && matchSearch;
    });
  }, [students, selectedRoom, selectedClass, searchTerm]);

  // iFrame preview detection (in sandbox iframes, browsers often suppress window.print modal)
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const [showPrintHelperModal, setShowPrintHelperModal] = useState(false);

  // Direct standalone URL with tab=cards & autoPrint=true for 100% reliable printing in a new tab
  const printNewTabUrl = useMemo(() => {
    if (typeof window === 'undefined') return '#';
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'cards');
      url.searchParams.set('autoPrint', 'true');
      return url.toString();
    } catch {
      return window.location.href;
    }
  }, []);

  // Handle print
  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Direct window.print() failed:', err);
    }
    // If inside an iframe (like AI Studio preview), Chrome suppresses modal dialogs
    if (isIframe) {
      setShowPrintHelperModal(true);
    }
  };

  // Switch preset
  const handleSelectPreset = (preset: 'sample_image' | 'mts') => {
    setActivePreset(preset);
    if (preset === 'sample_image') {
      setLocalSchedules(IMAGE_SAMPLE_SCHEDULE);
      setScheduleTitle('JADWAL UAS GENAP KELAS VII DAN VIII');
      if (onUpdateSchedules) onUpdateSchedules(IMAGE_SAMPLE_SCHEDULE);
    } else {
      const mtsData = MTS_MADRASAH_SCHEDULE;
      setLocalSchedules(mtsData);
      setScheduleTitle(`JADWAL ASESMEN ${config.examType} KELAS VII, VIII & IX`);
      if (onUpdateSchedules) onUpdateSchedules(mtsData);
    }
  };

  // Group schedules by day
  const groupedDays: GroupedScheduleDay[] = useMemo(() => {
    const daysMap = new Map<string, GroupedScheduleDay>();
    let counter = 1;

    localSchedules.forEach((item) => {
      const key = `${item.dayName}|${item.date}`;
      if (!daysMap.has(key)) {
        daysMap.set(key, {
          dayName: item.dayName,
          date: item.date,
          sessions: [],
        });
      }
      const dayEntry = daysMap.get(key)!;
      dayEntry.sessions.push({
        id: item.id,
        jamKe: dayEntry.sessions.length + 1,
        time: item.sessionTime,
        subject: item.subject,
        overallIndex: counter++,
      });
    });

    return Array.from(daysMap.values());
  }, [localSchedules]);

  // Chunk students into pages based on selected paper layout
  const chunkSize = useMemo(() => {
    if (cardFormat === 'schedule_card') {
      if (cardLayout === '3_per_page') return 3;
      if (cardLayout === '1_per_page') return 1;
      return 2;
    } else {
      if (cardLayout === '6_per_page') return 6;
      return 4;
    }
  }, [cardFormat, cardLayout]);

  const chunkedStudents: Student[][] = [];
  for (let i = 0; i < filteredStudents.length; i += chunkSize) {
    chunkedStudents.push(filteredStudents.slice(i, i + chunkSize));
  }

  // Room number helper: extract clean integer or string (e.g. "Ruang 01" -> "1")
  const getRoomDisplay = (student: Student): string => {
    const roomName = student.roomName || (rooms.find(r => r.id === student.roomId)?.name);
    if (!roomName) return '1';
    const match = roomName.match(/\d+/);
    return match ? String(parseInt(match[0], 10)) : roomName;
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Print CSS for chosen paper size and layout */}
      <style>{`
        @media print {
          @page {
            size: ${paperSize === 'F4' ? '215mm 330mm portrait' : 'A4 portrait'};
            margin: ${paperSize === 'F4' ? '4mm 5mm' : '7mm 6mm'};
          }
        }
      `}</style>

      {/* Top Toolbar & Print Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>Cetak Kartu Peserta Ujian &amp; Jadwal Pengawas</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Desain kartu peserta lengkap dengan tabel jadwal sesi &amp; paraf tanda tangan pengawas ruang per mata pelajaran.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-all cursor-pointer"
              title="Atur Mata Pelajaran & Jadwal Ujian pada Kartu"
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Kelola Jadwal ({localSchedules.length} Sesi)</span>
            </button>

            {/* Direct Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              id="btn-cetak-kartu"
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              title="Klik untuk membuka dialog cetak browser (Ctrl+P)"
            >
              <Printer className="w-4 h-4" />
              <span>
                {paperSize === 'F4' 
                  ? cardLayout === '3_per_page'
                    ? 'Cetak Kartu (F4: 3 Kartu)' 
                    : 'Cetak Kartu (F4)'
                  : cardLayout === '2_per_page'
                    ? 'Cetak Kartu (A4: 2 Kartu)'
                    : 'Cetak Kartu (A4)'}
              </span>
            </button>

            {/* Standalone New Tab Print Button (Bypasses all iframe restrictions) */}
            <a
              href={printNewTabUrl}
              target="_blank"
              rel="noopener noreferrer"
              id="btn-buka-tab-baru-cetak"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              title="Buka kartu di tab baru browser untuk mencetak langsung tanpa batasan iframe / preview"
            >
              <ExternalLink className="w-4 h-4 text-emerald-100" />
              <span>Buka di Tab Baru (Cetak PDF)</span>
            </a>
          </div>
        </div>

        {/* Informative Banner when in iFrame Preview */}
        {isIframe && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">
                  Perhatian: Aplikasi sedang berada di dalam jendela Pratinjau (iFrame)
                </p>
                <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                  Sebagian browser (seperti Google Chrome) secara otomatis memblokir dialog cetak printer jika dipanggil dari dalam kotak pratinjau. 
                  Jika tombol <strong>Cetak Kartu</strong> tidak memunculkan dialog cetak di layar Anda, klik tombol hijau <strong>"Buka di Tab Baru (Cetak PDF)"</strong> untuk mencetak tanpa halangan.
                </p>
              </div>
            </div>
            <a
              href={printNewTabUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded shadow-xs text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Tab Baru</span>
            </a>
          </div>
        )}

        {/* Format Selector: Image Sample Schedule vs Compact Barcode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50/70 border border-indigo-200 text-xs">
            <span className="font-bold text-indigo-950 shrink-0">Model Kartu:</span>
            <button
              type="button"
              onClick={() => {
                setCardFormat('schedule_card');
                setPaperSize('F4');
                setCardLayout('3_per_page');
              }}
              className={`flex-1 py-1.5 px-3 rounded font-bold text-center transition-all cursor-pointer ${
                cardFormat === 'schedule_card'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              📋 Format Jadwal &amp; T.Tangan Pengawas (Sesuai Gambar)
            </button>
            <button
              type="button"
              onClick={() => {
                setCardFormat('compact_card');
                setPaperSize('F4');
                setCardLayout('6_per_page');
              }}
              className={`py-1.5 px-3 rounded font-bold transition-all cursor-pointer ${
                cardFormat === 'compact_card'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              🪪 Format Ringkas (Foto &amp; Barcode)
            </button>
          </div>

          {/* Schedule Preset Switcher */}
          {cardFormat === 'schedule_card' && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 shrink-0">Pilihan Jadwal:</span>
              <button
                type="button"
                onClick={() => handleSelectPreset('sample_image')}
                className={`flex-1 py-1.5 px-2.5 rounded font-semibold text-center transition-all cursor-pointer truncate ${
                  activePreset === 'sample_image'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
                title="12 Sesi: Matematika, PAI, IPA, PKn, B. Indonesia, SBK, B. Inggris, TIK, PLH, B. Jawa, IPS, BTQ"
              >
                Gambar Contoh (12 Mapel)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('mts')}
                className={`flex-1 py-1.5 px-2.5 rounded font-semibold text-center transition-all cursor-pointer truncate ${
                  activePreset === 'mts'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
                title="11 Sesi: Al-Qur'an Hadits, Akidah, Fikih, SKI, B. Arab, B. Indo, B. Ing, Mat, PPKn, IPA, IPS"
              >
                MTs Manbaul Islam (11 Mapel)
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari siswa atau no peserta..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Filter Ruang */}
          <div>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
            >
              <option value="ALL">Semua Ruang ({students.length} Siswa)</option>
              {rooms.map((r) => {
                const count = students.filter((s) => s.roomId === r.id).length;
                return (
                  <option key={r.id} value={r.id}>
                    {r.name} ({count} siswa)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Filter Kelas */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
            >
              <option value="ALL">Semua Rombel/Kelas ({classes.length} Kelas)</option>
              {classes.map((cls) => {
                const count = students.filter((s) => s.className === cls).length;
                return (
                  <option key={cls} value={cls}>
                    {cls} ({count} siswa)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Penandatangan */}
          <div>
            <select
              value={signatory}
              onChange={(e) => setSignatory(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
            >
              <option value="committee">Tanda Tangan: Ketua Pelaksana / Panitia</option>
              <option value="principal">Tanda Tangan: Kepala Sekolah</option>
            </select>
          </div>
        </div>

        {/* Layout Options bar: F4 1 Kertas 3 Kartu & A4 Options */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-700 font-bold shrink-0">Ukuran Kertas &amp; Tata Letak:</span>
            {cardFormat === 'schedule_card' ? (
              <div className="flex flex-wrap items-center gap-2">
                {/* F4 1 Kertas 3 Kartu */}
                <button
                  type="button"
                  onClick={() => {
                    setPaperSize('F4');
                    setCardLayout('3_per_page');
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    cardLayout === '3_per_page' && paperSize === 'F4'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
                  }`}
                >
                  <span>📄 Kertas F4: 1 Kertas 3 Kartu</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    cardLayout === '3_per_page' && paperSize === 'F4'
                      ? 'bg-emerald-800 text-emerald-100'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    Paling Hemat (Folio 21.5 × 33 cm)
                  </span>
                </button>

                {/* A4 1 Kertas 2 Kartu */}
                <button
                  type="button"
                  onClick={() => {
                    setPaperSize('A4');
                    setCardLayout('2_per_page');
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    cardLayout === '2_per_page' && paperSize === 'A4'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
                  }`}
                >
                  <span>📄 Kertas A4: 1 Kertas 2 Kartu</span>
                  <span className="text-[10px] opacity-75 font-normal">(Standar A4)</span>
                </button>

                {/* A4 1 Kertas 1 Kartu */}
                <button
                  type="button"
                  onClick={() => {
                    setPaperSize('A4');
                    setCardLayout('1_per_page');
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    cardLayout === '1_per_page'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
                  }`}
                >
                  <span>📄 Kertas A4: 1 Kertas 1 Kartu</span>
                  <span className="text-[10px] opacity-75 font-normal">(Ukuran Besar)</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {/* F4 1 Kertas 6 Kartu */}
                <button
                  type="button"
                  onClick={() => {
                    setPaperSize('F4');
                    setCardLayout('6_per_page');
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    cardLayout === '6_per_page' && paperSize === 'F4'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
                  }`}
                >
                  <span>📄 Kertas F4: 1 Kertas 6 Kartu (Grid 2×3)</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    cardLayout === '6_per_page' && paperSize === 'F4'
                      ? 'bg-emerald-800 text-emerald-100'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    Folio
                  </span>
                </button>

                {/* A4 1 Kertas 4 Kartu */}
                <button
                  type="button"
                  onClick={() => {
                    setPaperSize('A4');
                    setCardLayout('4_per_page');
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    cardLayout === '4_per_page' && paperSize === 'A4'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
                  }`}
                >
                  <span>📄 Kertas A4: 1 Kertas 4 Kartu (Grid 2×2)</span>
                  <span className="text-[10px] opacity-75 font-normal">(Standar A4)</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 font-medium">
              Menampilkan {filteredStudents.length} siswa • Estimasi {chunkedStudents.length} lembar {paperSize}
            </span>
          </div>
        </div>

        {/* Informative Tip when F4 is active */}
        {paperSize === 'F4' && (
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center gap-2.5">
            <span className="text-lg">💡</span>
            <div className="flex-1 leading-relaxed">
              <strong>Tips Cetak Kertas F4 / Folio (1 Kertas 3 Kartu):</strong> Saat dialog Cetak / Print browser terbuka (<kbd className="px-1 py-0.5 bg-white border border-emerald-300 rounded font-mono text-[10px]">Ctrl+P</kbd>), pastikan opsi <em>Ukuran Kertas (Paper size)</em> dipilih <strong>Folio / F4 (8.5 × 13 in / 215 × 330 mm)</strong> atau <em>Legal</em>, dan atur <em>Margin</em>: <strong>Minimum / Default</strong> agar seluruh 3 kartu pas tercetak dalam 1 lembar utuh.
            </div>
          </div>
        )}
      </div>

      {/* Printable Pages Container */}
      <div className="space-y-8">
        {filteredStudents.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
            Tidak ada siswa yang sesuai dengan filter pencarian.
          </div>
        ) : (
          chunkedStudents.map((pageGroup, pageIndex) => (
            <div
              key={pageIndex}
              className={`page-break-after-always bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs print:border-none print:shadow-none print:p-0 ${
                pageIndex > 0 ? 'print:mt-4' : ''
              }`}
            >
              {/* Page Number indicator for screen viewing */}
              <div className="text-right text-[10px] text-slate-400 font-mono mb-3 pb-1 border-b border-slate-100 no-print flex justify-between">
                <span>LEMBAR CETAK {pageIndex + 1} DARI {chunkedStudents.length} • KERTAS {paperSize}</span>
                <span>{pageGroup.length} KARTU PESERTA ({cardFormat === 'schedule_card' ? 'DENGAN JADWAL & PARAF' : 'FORMAT RINGKAS'})</span>
              </div>

              {/* Cards Layout Container */}
              <div
                className={
                  cardFormat === 'schedule_card'
                    ? cardLayout === '3_per_page'
                      ? 'flex flex-col gap-2 print:gap-1.5 print-card-stack-3'
                      : 'flex flex-col gap-5 print:gap-5 print-card-stack-2'
                    : cardLayout === '6_per_page'
                      ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5 print:gap-2 print-card-grid-6'
                      : 'grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-4 print-card-grid-4'
                }
              >
                {pageGroup.map((student, idx) => (
                  <React.Fragment key={student.id}>
                    {cardFormat === 'schedule_card' ? (
                      <ScheduleExamCardItem
                        student={student}
                        config={config}
                        signatory={signatory}
                        roomDisplayNumber={getRoomDisplay(student)}
                        scheduleTitle={scheduleTitle}
                        groupedDays={groupedDays}
                        absenNumber={student.seatNumber || (pageIndex * chunkSize + idx + 1)}
                        isF4ThreeCards={cardLayout === '3_per_page'}
                      />
                    ) : (
                      <CompactExamCardItem
                        student={student}
                        config={config}
                        signatory={signatory}
                        isCompactDense={cardLayout === '6_per_page'}
                      />
                    )}

                    {/* Cutting line guide between cards in 3_per_page layout */}
                    {cardLayout === '3_per_page' && idx < pageGroup.length - 1 && (
                      <div className="relative my-0.5 flex items-center justify-center">
                        <div className="border-t border-dashed border-slate-300 print:border-black/50 w-full" />
                        <span className="absolute bg-white px-2 text-[9px] text-slate-400 print:text-black font-mono flex items-center gap-1">
                          ✂️ Garis Potong Kertas F4 ({idx + 1}/3)
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Schedule Edit Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Pengaturan Jadwal Mata Pelajaran pada Kartu</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold px-2 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Tabel Jadwal (Kanan Kartu)</label>
                <input
                  type="text"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  placeholder="JADWAL UAS GENAP KELAS VII DAN VIII"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 font-bold uppercase text-xs"
                />
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800">Daftar Sesi Ujian ({localSchedules.length} Mata Pelajaran)</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newId = 'sch-' + Date.now();
                      const updated = [
                        ...localSchedules,
                        {
                          id: newId,
                          dayName: 'Senin',
                          date: '08 Juni 2026',
                          sessionTime: '07.30–09.00',
                          subject: 'Mata Pelajaran Baru',
                          targetLevel: 'Semua Kelas',
                        },
                      ];
                      setLocalSchedules(updated);
                      setActivePreset('custom');
                    }}
                    className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Sesi</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {localSchedules.map((sch, sIdx) => (
                    <div key={sch.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md">
                      <span className="w-5 text-center font-mono font-bold text-slate-400 shrink-0">{sIdx + 1}</span>
                      <input
                        type="text"
                        value={sch.dayName}
                        onChange={(e) => {
                          const copy = [...localSchedules];
                          copy[sIdx] = { ...copy[sIdx], dayName: e.target.value };
                          setLocalSchedules(copy);
                          setActivePreset('custom');
                        }}
                        placeholder="Hari"
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                      />
                      <input
                        type="text"
                        value={sch.date}
                        onChange={(e) => {
                          const copy = [...localSchedules];
                          copy[sIdx] = { ...copy[sIdx], date: e.target.value };
                          setLocalSchedules(copy);
                          setActivePreset('custom');
                        }}
                        placeholder="Tanggal"
                        className="w-28 px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                      />
                      <input
                        type="text"
                        value={sch.sessionTime}
                        onChange={(e) => {
                          const copy = [...localSchedules];
                          copy[sIdx] = { ...copy[sIdx], sessionTime: e.target.value };
                          setLocalSchedules(copy);
                          setActivePreset('custom');
                        }}
                        placeholder="Waktu"
                        className="w-28 px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                      />
                      <input
                        type="text"
                        value={sch.subject}
                        onChange={(e) => {
                          const copy = [...localSchedules];
                          copy[sIdx] = { ...copy[sIdx], subject: e.target.value };
                          setLocalSchedules(copy);
                          setActivePreset('custom');
                        }}
                        placeholder="Nama Mata Pelajaran"
                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs bg-white font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = localSchedules.filter((_, i) => i !== sIdx);
                          setLocalSchedules(filtered);
                          setActivePreset('custom');
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('sample_image')}
                  className="px-2.5 py-1 text-[11px] bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Reset Contoh Gambar
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('mts')}
                  className="px-2.5 py-1 text-[11px] bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Reset Jadwal MTs
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onUpdateSchedules) onUpdateSchedules(localSchedules);
                  setShowScheduleModal(false);
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs cursor-pointer shadow-xs"
              >
                Terapkan ke Kartu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Helper Modal for iFrame / Sandbox */}
      {showPrintHelperModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Perintah Cetak Terkirim</h3>
                  <span className="text-[10px] text-slate-500 font-medium">Informasi &amp; Solusi Cetak Browser</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintHelperModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Sistem telah memanggil fungsi cetak browser. Namun, karena aplikasi dibuka di dalam <strong>jendela pratinjau (iFrame)</strong>, sebagian peramban web (seperti Google Chrome) sering <strong>memblokir jendela cetak (print dialog) otomatis</strong>.
              </p>
              
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                  <ExternalLink className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Solusi: Buka di Tab Baru Layar Penuh</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-normal">
                  Klik tombol hijau di bawah untuk membuka kartu di tab baru browser. Di tab baru, dialog cetak (<kbd className="font-mono bg-white px-1 py-0.5 rounded border border-emerald-300">Ctrl + P</kbd>) dan penyimpanan PDF akan langsung bekerja normal 100%.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPrintHelperModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-xs cursor-pointer"
              >
                Tutup
              </button>
              <a
                href={printNewTabUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowPrintHelperModal(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors text-xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Tab Baru Sekarang</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 1. SCHEDULE EXAM CARD ITEM (EXACT MATCH TO USER'S IMAGE)
// ==========================================
interface ScheduleExamCardItemProps {
  student: Student;
  config: ExamConfig;
  signatory: 'committee' | 'principal';
  roomDisplayNumber: string;
  scheduleTitle: string;
  groupedDays: GroupedScheduleDay[];
  absenNumber: number | string;
  isF4ThreeCards?: boolean;
}

const ScheduleExamCardItem: React.FC<ScheduleExamCardItemProps> = ({
  student,
  config,
  signatory,
  roomDisplayNumber,
  scheduleTitle,
  groupedDays,
  absenNumber,
  isF4ThreeCards = false,
}) => {
  const isPrincipal = signatory === 'principal';
  const signerName = isPrincipal ? config.principalName : config.committeeHeadName;
  const signerNip = isPrincipal ? config.principalNip : config.committeeHeadNip;
  const signerTitle = isPrincipal ? 'Kepala Sekolah,' : 'Ketua Pelaksana,';

  return (
    <div
      className={`page-break-inside-avoid bg-white border-2 border-black text-black font-sans shadow-xs print:shadow-none w-full mx-auto select-text ${
        isF4ThreeCards
          ? 'p-2 sm:p-2.5 max-w-[820px] f4-card-item'
          : 'p-3 sm:p-4 max-w-[850px]'
      }`}
    >
      {/* 2-Column Split: Left = Identitas & Kop, Right = Jadwal UAS & Paraf Pengawas */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-black">
        
        {/* ========================================================= */}
        {/* LEFT PANEL: KOP SEKOLAH, KARTU PESERTA, BIODATA, RUANG, TTD */}
        {/* ========================================================= */}
        <div className={`md:col-span-6 border-b md:border-b-0 md:border-r border-black flex flex-col justify-between ${
          isF4ThreeCards ? 'p-2 sm:p-2.5' : 'p-3'
        }`}>
          <div>
            {/* Kop Sekolah */}
            <div className="flex items-center gap-2.5 pb-1.5">
              {/* Emblem / Logo */}
              <div className={`${isF4ThreeCards ? 'w-9 h-9' : 'w-12 h-12'} shrink-0 flex items-center justify-center`}>
                <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer Shield */}
                  <path d="M50 6 L88 20 C88 56 50 90 50 90 C50 90 12 56 12 20 Z" fill="#0284c7" stroke="#000" strokeWidth="2.5" />
                  {/* Inner White Shield */}
                  <path d="M50 12 L82 24 C82 52 50 82 50 82 C50 82 18 52 18 24 Z" fill="#f8fafc" stroke="#000" strokeWidth="1" />
                  {/* Star */}
                  <polygon points="50,22 53,30 62,30 55,36 58,45 50,40 42,45 45,36 38,30 47,30" fill="#f59e0b" stroke="#000" strokeWidth="0.8" />
                  {/* Open Book */}
                  <path d="M30 50 C38 46 46 48 50 52 C54 48 62 46 70 50 L70 66 C62 62 54 64 50 68 C46 64 38 62 30 66 Z" fill="#ffffff" stroke="#000" strokeWidth="1.5" />
                  <path d="M50 52 L50 68" stroke="#000" strokeWidth="1.5" />
                  {/* Ribbon base */}
                  <path d="M26 76 Q50 86 74 76" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              {/* School Info */}
              <div className="flex-1 text-center pr-1">
                <h3 className={`font-extrabold uppercase tracking-wide leading-tight text-black ${
                  isF4ThreeCards ? 'text-[11.5px] sm:text-xs' : 'text-[13px] sm:text-sm'
                }`}>
                  {config.schoolName || 'NAMA SEKOLAH ANDA'}
                </h3>
                <p className={`${isF4ThreeCards ? 'text-[8.5px]' : 'text-[9.5px]'} text-black leading-tight mt-0.5`}>
                  {config.address || 'Jalan Gelang Jaya'}
                </p>
                <p className={`${isF4ThreeCards ? 'text-[7.5px]' : 'text-[8.5px]'} text-black leading-tight mt-0.5`}>
                  Telp. {config.phone || '....'} Email {config.email || '......'}
                </p>
              </div>
            </div>

            {/* Banner KARTU PESERTA */}
            <div className={`border-y-2 border-black text-center ${isF4ThreeCards ? 'py-0.5 my-0.5' : 'py-1 my-1'}`}>
              <h4 className={`font-extrabold uppercase tracking-widest text-black leading-tight ${
                isF4ThreeCards ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
              }`}>
                KARTU PESERTA
              </h4>
            </div>

            {/* Biodata Siswa */}
            <div className={`text-black ${isF4ThreeCards ? 'py-1 space-y-0.5 text-[10px] sm:text-[10.5px]' : 'py-2.5 space-y-1.5 text-xs'}`}>
              <div className="flex items-baseline">
                <span className={`${isF4ThreeCards ? 'w-20 text-[10px]' : 'w-24 text-[11px] sm:text-xs'} font-normal text-black`}>Nama</span>
                <span className="w-2.5 text-center">:</span>
                <span className={`font-bold uppercase flex-1 truncate ${isF4ThreeCards ? 'text-[10px] sm:text-[10.5px]' : 'text-[11px] sm:text-xs'}`}>{student.name}</span>
              </div>
              <div className="flex items-baseline">
                <span className={`${isF4ThreeCards ? 'w-20 text-[10px]' : 'w-24 text-[11px] sm:text-xs'} font-normal text-black`}>Kelas</span>
                <span className="w-2.5 text-center">:</span>
                <span className={`font-bold flex-1 ${isF4ThreeCards ? 'text-[10px] sm:text-[10.5px]' : 'text-[11px] sm:text-xs'}`}>{student.className}</span>
              </div>
              <div className="flex items-baseline">
                <span className={`${isF4ThreeCards ? 'w-20 text-[10px]' : 'w-24 text-[11px] sm:text-xs'} font-normal text-black`}>No. Peserta</span>
                <span className="w-2.5 text-center">:</span>
                <span className={`font-bold font-mono flex-1 ${isF4ThreeCards ? 'text-[10px] sm:text-[10.5px]' : 'text-[11px] sm:text-xs'}`}>{student.examNumber}</span>
              </div>
            </div>
          </div>

          {/* Bottom section: Ruang Box & Signature */}
          <div className={`${isF4ThreeCards ? 'mt-1' : 'mt-2'}`}>
            <div className="flex items-end justify-between gap-2">
              {/* Ruang Box */}
              <div className={`border border-black text-center shrink-0 ${isF4ThreeCards ? 'w-20' : 'w-24 sm:w-28'}`}>
                <div className={`border-b border-black font-medium text-black bg-white ${isF4ThreeCards ? 'py-0 text-[9.5px]' : 'py-0.5 text-[11px]'}`}>
                  Ruang
                </div>
                <div className={`font-extrabold text-black leading-none font-sans ${isF4ThreeCards ? 'py-0.5 text-xl sm:text-2xl' : 'py-1 sm:py-2 text-2xl sm:text-3xl'}`}>
                  {roomDisplayNumber}
                </div>
              </div>

              {/* Tanda Tangan Block */}
              <div className={`text-right leading-tight text-black shrink-0 ${isF4ThreeCards ? 'text-[9px]' : 'text-[10px]'}`}>
                <p className="text-black">{config.issuePlace || 'Gresik'}, {config.issueDate || '30 September 2014'}</p>
                <p className="font-semibold mt-0.5 text-black">{signerTitle}</p>
                <div className={`flex items-center justify-end ${isF4ThreeCards ? 'h-5 sm:h-6' : 'h-8 sm:h-10'}`}>
                  {/* Space for stamp/signature */}
                </div>
                <p className={`font-bold uppercase underline leading-tight text-black ${isF4ThreeCards ? 'text-[9.5px]' : 'text-[10.5px]'}`}>{signerName}</p>
                <p className={`font-mono mt-0.5 text-black ${isF4ThreeCards ? 'text-[7.5px]' : 'text-[9px]'}`}>NIP {signerNip || '-'}</p>
              </div>
            </div>

            {/* Notice Footer */}
            <div className={`text-black border-t border-dotted border-black/40 ${isF4ThreeCards ? 'mt-1 pt-0.5 text-[8px]' : 'mt-3 pt-1 text-[9px]'}`}>
              <span className="underline italic font-medium">PERHATIAN :</span>
              <p className={`italic ${isF4ThreeCards ? 'text-[7.5px]' : 'text-[8.5px]'}`}>Selama ulangan berlangsung, kartu ini harus dibawa</p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANEL: JADWAL UAS, NO. ABSEN & TABEL PARAF PENGAWAS */}
        {/* ========================================================= */}
        <div className={`md:col-span-6 flex flex-col justify-between bg-white ${isF4ThreeCards ? 'p-1.5 sm:p-2' : 'p-2 sm:p-2.5'}`}>
          <div>
            {/* Header: Title & No. Absen */}
            <div className="flex items-start justify-between gap-2 pb-1 border-b border-black">
              <div className="flex-1 text-center pl-6">
                <h5 className={`font-extrabold uppercase tracking-tight text-black leading-tight ${
                  isF4ThreeCards ? 'text-[10px] sm:text-[10.5px]' : 'text-[11px] sm:text-xs'
                }`}>
                  {scheduleTitle}
                </h5>
                <p className={`font-bold uppercase text-black leading-tight mt-0.5 ${
                  isF4ThreeCards ? 'text-[9px] sm:text-[9.5px]' : 'text-[10px] sm:text-[10.5px]'
                }`}>
                  TAHUN PELAJARAN {config.academicYear || '2014/2015'}
                </p>
              </div>

              {/* No. Absen */}
              <div className="text-right shrink-0">
                <span className={`font-medium block text-black leading-none ${isF4ThreeCards ? 'text-[8.5px]' : 'text-[9.5px]'}`}>No. Absen</span>
                <span className={`font-mono font-bold text-black block mt-0.5 leading-none ${isF4ThreeCards ? 'text-xs sm:text-[13px]' : 'text-xs sm:text-sm'}`}>
                  {absenNumber}
                </span>
              </div>
            </div>

            {/* Schedule Table */}
            <div className="mt-1 overflow-x-auto">
              <table className={`w-full border-collapse border border-black leading-tight text-black ${
                isF4ThreeCards ? 'text-[7.5px] sm:text-[8px]' : 'text-[9px] sm:text-[9.5px]'
              }`}>
                <thead>
                  <tr className="bg-slate-100 font-bold text-black border-b border-black">
                    <th className={`border border-black text-center font-bold w-[22%] ${isF4ThreeCards ? 'p-0.5' : 'p-1'}`}>
                      Hari/Tgl.
                    </th>
                    <th className={`border border-black text-center font-bold w-[9%] ${isF4ThreeCards ? 'p-0.5' : 'p-1'}`}>
                      Jam<br />Ke
                    </th>
                    <th className={`border border-black text-center font-bold w-[21%] ${isF4ThreeCards ? 'p-0.5' : 'p-1'}`}>
                      Waktu
                    </th>
                    <th className={`border border-black text-left font-bold w-[32%] pl-1 ${isF4ThreeCards ? 'p-0.5 pl-1' : 'p-1 pl-1.5'}`}>
                      Mata Pelajaran
                    </th>
                    <th className={`border border-black text-center font-bold w-[16%] ${isF4ThreeCards ? 'p-0.5' : 'p-1'}`}>
                      T. Tangan<br />Pengawas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupedDays.map((dayGroup) => {
                    const sessionCount = dayGroup.sessions.length;
                    return dayGroup.sessions.map((session, sIdx) => (
                      <tr key={session.id} className="border-b border-black">
                        {/* Day & Date (rowSpan for sessions on the same day) */}
                        {sIdx === 0 && (
                          <td
                            rowSpan={sessionCount}
                            className={`border border-black text-center align-middle font-medium leading-tight bg-white ${
                              isF4ThreeCards ? 'p-0.5' : 'p-1'
                            }`}
                          >
                            <div className="font-bold text-black">{dayGroup.dayName}</div>
                            <div className={`text-black mt-0.5 ${isF4ThreeCards ? 'text-[7px] sm:text-[7.5px]' : 'text-[8px] sm:text-[8.5px]'}`}>{dayGroup.date}</div>
                          </td>
                        )}

                        {/* Jam Ke */}
                        <td className={`border border-black text-center align-middle font-mono font-semibold ${isF4ThreeCards ? 'p-0.5' : 'p-1'}`}>
                          {session.jamKe}
                        </td>

                        {/* Waktu */}
                        <td className={`border border-black text-center align-middle font-mono ${
                          isF4ThreeCards ? 'p-0.5 text-[7.5px] sm:text-[8px]' : 'p-1 text-[8.5px] sm:text-[9px]'
                        }`}>
                          {session.time}
                        </td>

                        {/* Mata Pelajaran */}
                        <td className={`border border-black text-left align-middle font-semibold text-black ${
                          isF4ThreeCards ? 'p-0.5 pl-1' : 'p-1 pl-1.5'
                        }`}>
                          {session.subject}
                        </td>

                        {/* T. Tangan Pengawas (with numbered slot 1, 2, 3...) */}
                        <td className={`border border-black text-left align-top relative bg-white ${
                          isF4ThreeCards ? 'p-0.5 h-4.5 sm:h-5' : 'p-1 h-6 sm:h-7'
                        }`}>
                          <span className={`font-mono font-bold text-black block leading-none ${
                            isF4ThreeCards ? 'text-[7.5px]' : 'text-[8.5px]'
                          }`}>
                            {session.overallIndex}
                          </span>
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`text-right text-slate-500 italic mt-0.5 ${isF4ThreeCards ? 'text-[7px]' : 'text-[8px]'}`}>
            * Paraf pengawas ruang wajib diisi setiap sesi ujian
          </div>
        </div>

      </div>
    </div>
  );
};

// ==========================================
// 2. COMPACT EXAM CARD ITEM (PHOTO & BARCODE)
// ==========================================
interface CompactExamCardItemProps {
  student: Student;
  config: ExamConfig;
  signatory: 'committee' | 'principal';
  isCompactDense?: boolean;
}

const CompactExamCardItem: React.FC<CompactExamCardItemProps> = ({
  student,
  config,
  signatory,
  isCompactDense = false,
}) => {
  const isPrincipal = signatory === 'principal';
  const signerName = isPrincipal ? config.principalName : config.committeeHeadName;
  const signerNip = isPrincipal ? config.principalNip : config.committeeHeadNip;
  const signerTitle = isPrincipal ? 'Kepala Sekolah,' : 'Ketua Panitia Ujian,';

  return (
    <div className={`page-break-inside-avoid bg-white border-2 border-slate-900 rounded-lg shadow-xs print:shadow-none relative overflow-hidden flex flex-col justify-between text-slate-900 font-sans ${
      isCompactDense ? 'p-2.5 sm:p-3' : 'p-4 sm:p-5'
    }`}>
      <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900"></div>

      {/* Header */}
      <div className={`flex items-start justify-between border-b border-slate-200 ${isCompactDense ? 'pb-2 mt-0.5' : 'pb-3 mt-1'}`}>
        <div className="flex gap-2.5 items-center">
          <div className={`${isCompactDense ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'} rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-bold shrink-0`}>
            🎓
          </div>
          <div>
            <h4 className={`${isCompactDense ? 'text-[11px]' : 'text-xs'} font-bold text-slate-900 leading-tight uppercase tracking-tight`}>
              KARTU TANDA PESERTA UJIAN
            </h4>
            <p className="text-[10px] text-slate-600 font-semibold uppercase mt-0.5">
              {config.examTitle}
            </p>
            <p className="text-[9px] text-slate-400 font-medium truncate max-w-[220px]">
              {config.schoolName} • TP {config.academicYear}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[9px] font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-800 uppercase">
            {student.roomName || 'BELUM DIATUR'}
          </span>
          <p className="text-[9px] text-slate-500 mt-1">
            MEJA : <strong className="text-slate-900 font-mono font-bold text-[10px]">{student.seatNumber ? String(student.seatNumber).padStart(2, '0') : '-'}</strong>
          </p>
        </div>
      </div>

      {/* Main Student Bio and Photo */}
      <div className={`flex gap-3 sm:gap-4 my-auto ${isCompactDense ? 'py-2' : 'py-3'}`}>
        <div className={`${isCompactDense ? 'w-18' : 'w-22'} shrink-0 flex flex-col items-center gap-1.5`}>
          <div className="w-full aspect-[3/4] bg-slate-50 border border-slate-200 rounded flex flex-col items-center justify-center text-slate-400 shadow-2xs">
            <span className="text-sm">👤</span>
            <span className="text-[7.5px] font-mono font-semibold uppercase text-slate-400 mt-0.5">FOTO 3x4</span>
          </div>
          
          <div className="w-full bg-slate-50 py-0.5 flex flex-col items-center justify-center border border-slate-200 rounded">
            <BarcodeSVG value={student.examNumber} width={isCompactDense ? 65 : 80} height={isCompactDense ? 14 : 18} showText={false} />
            <span className="text-[7px] font-mono font-bold text-slate-700 mt-0.5">{student.examNumber}</span>
          </div>
        </div>

        <div className={`flex-1 grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs ${isCompactDense ? 'text-[10px]' : 'text-xs'}`}>
          <div className="col-span-2">
            <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider block">Nomor Peserta</span>
            <span className="font-mono font-bold text-xs sm:text-sm text-indigo-950 tracking-wide">{student.examNumber}</span>
          </div>

          <div className="col-span-2">
            <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider block">Nama Lengkap Siswa</span>
            <span className="font-bold text-slate-900 text-xs uppercase truncate block">{student.name}</span>
          </div>

          <div>
            <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider block">NISN / NIS</span>
            <span className="font-semibold text-slate-700 font-mono text-[10.5px]">{student.nisn} / {student.nis}</span>
          </div>

          <div>
            <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider block">Tingkat / Kelas</span>
            <span className="font-semibold text-slate-800 text-[10.5px]">{student.className}</span>
          </div>

          <div className="col-span-2">
            <span className="text-[7.5px] uppercase font-bold text-slate-400 tracking-wider block">Jenis Kelamin</span>
            <span className="font-medium text-slate-600 text-[10.5px]">
              {student.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`border-t border-dashed border-slate-200 flex items-end justify-between ${isCompactDense ? 'pt-1.5 text-[8px]' : 'pt-2.5 text-[8.5px]'}`}>
        <div className="space-y-0.5">
          <p className="text-slate-400 italic font-medium">* Harap dibawa saat pelaksanaan ujian</p>
          <p className="text-slate-400 italic font-medium">* Tempel pada sudut kiri atas meja ujian</p>
          <p className="text-slate-400 italic font-medium">* Dilarang membawa HP / perangkat digital</p>
        </div>

        <div className="text-right relative">
          <p className="text-slate-500 font-medium">{config.issuePlace}, {config.issueDate}</p>
          <p className="font-bold text-slate-700 mt-0.5">{signerTitle}</p>
          <div className={`${isCompactDense ? 'h-5' : 'h-7'} flex items-center justify-end`}>
            <span className="font-serif italic text-slate-300 text-[9px] select-none mr-2">ttd &amp; cap</span>
          </div>
          <p className="font-bold text-slate-900 border-b border-slate-900 inline-block leading-tight">{signerName}</p>
          <p className="text-slate-500 font-mono text-[7px] mt-0.5">NIP. {signerNip || '-'}</p>
        </div>
      </div>
    </div>
  );
};
