import React, { useState } from 'react';
import { ExamConfig, ExamRoom, ExamScheduleItem, Student } from '../types';
import { BarcodeSVG, QRCodeSVG } from '../utils/barcode';
import { 
  FileText, 
  Printer, 
  CheckSquare, 
  Tag, 
  FileCheck2, 
  DoorOpen,
  Calendar,
  ExternalLink
} from 'lucide-react';

interface ExamDocumentsViewProps {
  config: ExamConfig;
  students: Student[];
  rooms: ExamRoom[];
  schedules: ExamScheduleItem[];
}

type DocType = 'attendance' | 'desk_labels' | 'minutes' | 'door_roster';

export const ExamDocumentsView: React.FC<ExamDocumentsViewProps> = ({
  config,
  students,
  rooms,
  schedules,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DocType>('attendance');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(schedules[0]?.subject || 'Matematika');

  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  // Students in selected room sorted by seatNumber
  const roomStudents = students
    .filter((s) => s.roomId === currentRoom?.id)
    .sort((a, b) => (a.seatNumber || 0) - (b.seatNumber || 0));

  const printNewTabUrl = typeof window !== 'undefined' ? (() => {
    try {
      const u = new URL(window.location.href);
      u.searchParams.set('tab', 'documents');
      u.searchParams.set('autoPrint', 'true');
      return u.toString();
    } catch {
      return window.location.href;
    }
  })() : '#';

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Direct print error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation and Switcher Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Dokumen &amp; Kelengkapan Administrasi Ujian</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Cetak Daftar Hadir (Presensi), Stiker Meja Peserta, Berita Acara, dan Daftar Tempelan Pintu Ruang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen (A4)</span>
            </button>

            <a
              href={printNewTabUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              title="Buka di tab baru jika browser Anda memblokir dialog cetak di dalam pratinjau"
            >
              <ExternalLink className="w-4 h-4 text-emerald-100" />
              <span>Buka di Tab Baru (Cetak PDF)</span>
            </a>
          </div>
        </div>

        {/* Document Type Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'attendance', label: 'Daftar Hadir (Presensi)', icon: <CheckSquare className="w-4 h-4" /> },
            { id: 'desk_labels', label: 'Label / Stiker Meja', icon: <Tag className="w-4 h-4" /> },
            { id: 'minutes', label: 'Berita Acara Ujian', icon: <FileCheck2 className="w-4 h-4" /> },
            { id: 'door_roster', label: 'Tempelan Pintu Ruang', icon: <DoorOpen className="w-4 h-4" /> },
          ].map((item) => {
            const isSelected = selectedDoc === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedDoc(item.id as DocType)}
                className={`p-3 rounded-lg border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white font-semibold shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <div className={isSelected ? 'text-white' : 'text-slate-400'}>
                  {item.icon}
                </div>
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Room & Subject Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Ruang Ujian:
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
            >
              {rooms.map((r) => {
                const count = students.filter((s) => s.roomId === r.id).length;
                return (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.roomCode}) — {count} Siswa
                  </option>
                );
              })}
            </select>
          </div>

          {(selectedDoc === 'attendance' || selectedDoc === 'minutes') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Pelajaran:
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
              >
                {schedules.map((s) => (
                  <option key={s.id} value={s.subject}>
                    {s.subject} ({s.dayName}, {s.date})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Document View Canvas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 md:p-8 print:p-0 print:border-none print:shadow-none">
        {selectedDoc === 'attendance' && (
          <AttendanceSheet
            config={config}
            room={currentRoom}
            students={roomStudents}
            subject={selectedSubject}
          />
        )}

        {selectedDoc === 'desk_labels' && (
          <DeskLabelsSheet
            config={config}
            room={currentRoom}
            students={roomStudents}
          />
        )}

        {selectedDoc === 'minutes' && (
          <ExamMinutesSheet
            config={config}
            room={currentRoom}
            students={roomStudents}
            subject={selectedSubject}
          />
        )}

        {selectedDoc === 'door_roster' && (
          <DoorRosterSheet
            config={config}
            room={currentRoom}
            students={roomStudents}
          />
        )}
      </div>
    </div>
  );
};

/* --- 1. DAFTAR HADIR (PRESENSI RUANG UJIAN) --- */
const AttendanceSheet: React.FC<{
  config: ExamConfig;
  room?: ExamRoom;
  students: Student[];
  subject: string;
}> = ({ config, room, students, subject }) => {
  return (
    <div className="font-serif text-slate-900 text-xs space-y-4">
      {/* Official Header */}
      <div className="text-center border-b-2 border-slate-900 pb-2">
        <div className="text-[10px] uppercase font-bold text-slate-700 tracking-wider">
          PEMERINTAH DAERAH PROVINSI {config.province.toUpperCase()}
        </div>
        <div className="text-[10px] uppercase font-bold text-slate-700 tracking-wider">
          DINAS PENDIDIKAN DAN KEBUDAYAAN
        </div>
        <div className="text-base font-black uppercase text-slate-950 mt-0.5">
          {config.schoolName}
        </div>
        <div className="text-[9px] font-sans text-slate-600">
          {config.address} • Telp: {config.phone}
        </div>
        <div className="border-b border-slate-900 mt-1"></div>
        <div className="border-b-2 border-slate-900 mt-0.5"></div>
      </div>

      {/* Document Title */}
      <div className="text-center font-sans">
        <h3 className="text-sm font-black uppercase tracking-wider">
          DAFTAR HADIR PESERTA {config.examTitle}
        </h3>
        <p className="text-xs font-semibold text-slate-700">
          TAHUN PELAJARAN {config.academicYear} • SEMESTER {config.semester.toUpperCase()}
        </p>
      </div>

      {/* Metadata Bar */}
      <div className="font-sans text-[11px] grid grid-cols-2 gap-x-8 gap-y-1 bg-slate-50 p-3 rounded border border-slate-200">
        <div className="space-y-1">
          <div className="flex">
            <span className="w-28 font-semibold text-slate-700">Mata Pelajaran</span>
            <span className="w-3">:</span>
            <span className="font-bold text-slate-950">{subject}</span>
          </div>
          <div className="flex">
            <span className="w-28 font-semibold text-slate-700">Ruang Ujian</span>
            <span className="w-3">:</span>
            <span className="font-bold text-indigo-900">{room?.name} ({room?.roomCode})</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex">
            <span className="w-28 font-semibold text-slate-700">Jumlah Peserta</span>
            <span className="w-3">:</span>
            <span className="font-bold text-slate-950">{students.length} Orang</span>
          </div>
          <div className="flex">
            <span className="w-28 font-semibold text-slate-700">Pengawas Ruang</span>
            <span className="w-3">:</span>
            <span className="text-slate-800">{room?.proctor1 || '................................'}</span>
          </div>
        </div>
      </div>

      {/* Table with Zig-Zag Signature columns */}
      <div className="overflow-x-auto">
        <table className="w-full font-sans text-[10.5px] border-collapse border border-slate-900">
          <thead>
            <tr className="bg-slate-100 text-slate-900 text-center font-bold">
              <th className="border border-slate-900 py-1.5 px-2 w-10">No</th>
              <th className="border border-slate-900 py-1.5 px-3 w-32">No. Peserta</th>
              <th className="border border-slate-900 py-1.5 px-3 w-28">NISN</th>
              <th className="border border-slate-900 py-1.5 px-3 text-left">Nama Peserta</th>
              <th className="border border-slate-900 py-1.5 px-2 w-20">Kelas</th>
              <th className="border border-slate-900 py-1.5 px-2 w-16">Meja</th>
              <th className="border border-slate-900 py-1.5 px-3 w-40 text-center" colSpan={2}>
                Tanda Tangan Peserta
              </th>
              <th className="border border-slate-900 py-1.5 px-2 w-16">Ket.</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => {
              const isOdd = (idx + 1) % 2 === 1;
              return (
                <tr key={student.id} className="border-b border-slate-300">
                  <td className="border border-slate-900 py-2 px-2 text-center font-medium">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-900 py-2 px-3 font-mono font-bold text-slate-900 text-center">
                    {student.examNumber}
                  </td>
                  <td className="border border-slate-900 py-2 px-3 font-mono text-center text-slate-700">
                    {student.nisn}
                  </td>
                  <td className="border border-slate-900 py-2 px-3 font-semibold uppercase text-slate-950">
                    {student.name}
                  </td>
                  <td className="border border-slate-900 py-2 px-2 text-center">
                    {student.className}
                  </td>
                  <td className="border border-slate-900 py-2 px-2 text-center font-mono font-bold">
                    {student.seatNumber ? String(student.seatNumber).padStart(2, '0') : '-'}
                  </td>
                  {/* Zig-Zag Signature cells */}
                  <td className="border border-slate-900 py-2 px-2 w-20 text-[10px]">
                    {isOdd ? <span className="font-mono text-slate-400">{idx + 1}.......</span> : ''}
                  </td>
                  <td className="border border-slate-900 py-2 px-2 w-20 text-[10px]">
                    {!isOdd ? <span className="font-mono text-slate-400">{idx + 1}.......</span> : ''}
                  </td>
                  <td className="border border-slate-900 py-2 px-2 text-center text-slate-400">
                    
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Proctors Signature Footer */}
      <div className="pt-6 font-sans text-xs grid grid-cols-2 text-center">
        <div>
          <div className="text-slate-600">Pengawas Ruang 1</div>
          <div className="h-16"></div>
          <div className="font-bold underline text-slate-950">
            {room?.proctor1 || '(..................................................)'}
          </div>
          <div className="text-[10px] text-slate-500">NIP. .........................................</div>
        </div>

        <div>
          <div className="text-slate-600">Pengawas Ruang 2</div>
          <div className="h-16"></div>
          <div className="font-bold underline text-slate-950">
            {room?.proctor2 || '(..................................................)'}
          </div>
          <div className="text-[10px] text-slate-500">NIP. .........................................</div>
        </div>
      </div>
    </div>
  );
};

/* --- 2. STIKER / LABEL MEJA PESERTA --- */
const DeskLabelsSheet: React.FC<{
  config: ExamConfig;
  room?: ExamRoom;
  students: Student[];
}> = ({ config, room, students }) => {
  return (
    <div className="space-y-4 font-sans">
      <div className="border-b border-slate-200 pb-2 flex justify-between items-center no-print">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Label / Stiker Meja Peserta — {room?.name}
          </h3>
          <p className="text-xs text-slate-500">
            Cetak di kertas stiker/HVS lalu potong sesuai garis batas untuk ditempel di masing-masing meja siswa.
          </p>
        </div>
        <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded font-bold">
          {students.length} Stiker Meja
        </span>
      </div>

      {/* Grid of Desk Labels (2 columns standard) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
        {students.map((student) => (
          <div
            key={student.id}
            className="page-break-inside-avoid border-2 border-slate-900 rounded-lg p-4 bg-white text-slate-900 space-y-2 relative shadow-xs print:shadow-none overflow-hidden"
          >
            {/* Top minimal black bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-900"></div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 pt-0.5">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  {config.schoolName}
                </div>
                <div className="text-[11px] font-bold uppercase text-slate-900">
                  {config.examType} • {config.academicYear}
                </div>
              </div>

              {/* Huge Desk Number */}
              <div className="bg-slate-900 text-white px-2.5 py-1 rounded text-xs font-bold font-mono tracking-wider">
                MEJA {student.seatNumber ? String(student.seatNumber).padStart(2, '0') : '-'}
              </div>
            </div>

            {/* Student Info */}
            <div className="space-y-1 text-xs py-1">
              <div>
                <span className="text-[8px] uppercase font-bold text-slate-400 block tracking-wider">Nomor Peserta</span>
                <span className="font-mono text-sm font-bold text-indigo-950">{student.examNumber}</span>
              </div>
              <div>
                <span className="text-[8px] uppercase font-bold text-slate-400 block tracking-wider">Nama Peserta</span>
                <span className="font-bold text-xs text-slate-900 uppercase truncate block">{student.name}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                <span>Kelas: <strong className="text-slate-900">{student.className}</strong></span>
                <span>Ruang: <strong className="text-slate-900">{student.roomName || room?.name}</strong></span>
              </div>
            </div>

            {/* Barcode at bottom */}
            <div className="pt-2 border-t border-dashed border-slate-200 flex items-center justify-between">
              <BarcodeSVG value={student.examNumber} width={130} height={20} showText={false} />
              <QRCodeSVG value={student.examNumber} size={32} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* --- 3. BERITA ACARA UJIAN (OFFICIAL MINUTES) --- */
const ExamMinutesSheet: React.FC<{
  config: ExamConfig;
  room?: ExamRoom;
  students: Student[];
  subject: string;
}> = ({ config, room, students, subject }) => {
  return (
    <div className="font-serif text-slate-900 text-xs space-y-4 max-w-4xl mx-auto">
      {/* Official Header */}
      <div className="text-center border-b-2 border-slate-900 pb-2">
        <div className="text-[10px] uppercase font-bold text-slate-700 tracking-wider">
          PEMERINTAH DAERAH PROVINSI {config.province.toUpperCase()}
        </div>
        <div className="text-[10px] uppercase font-bold text-slate-700 tracking-wider">
          DINAS PENDIDIKAN DAN KEBUDAYAAN
        </div>
        <div className="text-base font-black uppercase text-slate-950 mt-0.5">
          {config.schoolName}
        </div>
        <div className="text-[9px] font-sans text-slate-600">
          {config.address} • Telp: {config.phone}
        </div>
        <div className="border-b border-slate-900 mt-1"></div>
        <div className="border-b-2 border-slate-900 mt-0.5"></div>
      </div>

      <div className="text-center font-sans">
        <h3 className="text-sm font-black uppercase tracking-wider">
          BERITA ACARA PELAKSANAAN UJIAN
        </h3>
        <p className="text-xs font-semibold text-slate-700 uppercase">
          {config.examTitle} TAHUN PELAJARAN {config.academicYear}
        </p>
      </div>

      {/* Formal Indonesian Minutes Statement */}
      <div className="font-serif leading-relaxed text-[11px] space-y-3 pt-2">
        <p>
          Pada hari ini ......................... tanggal ........... bulan ........................ tahun ............., di {config.schoolName} telah diselenggarakan <strong>{config.examTitle}</strong> Tahun Pelajaran {config.academicYear} untuk mata pelajaran:
        </p>

        <div className="bg-slate-50 p-3 rounded border border-slate-200 font-sans grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-semibold text-slate-600">Mata Pelajaran:</span>{' '}
            <strong className="text-slate-900">{subject}</strong>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Ruang Ujian:</span>{' '}
            <strong className="text-indigo-900">{room?.name} ({room?.roomCode})</strong>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Waktu / Sesi:</span>{' '}
            <strong className="text-slate-900">07.30 - 09.30 WIB (Sesi 1)</strong>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Tingkat / Kelas:</span>{' '}
            <strong className="text-slate-900">{config.schoolLevel}</strong>
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <div className="font-bold text-slate-900">1. Data Kehadiran Peserta:</div>
          <table className="w-full font-sans text-xs border border-slate-400">
            <tbody>
              <tr>
                <td className="p-2 border border-slate-300 w-60">Jumlah Peserta Terdaftar</td>
                <td className="p-2 border border-slate-300 font-bold">{students.length} orang</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-300">Jumlah Peserta Hadir</td>
                <td className="p-2 border border-slate-300 font-bold">........... orang</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-300">Jumlah Peserta Tidak Hadir</td>
                <td className="p-2 border border-slate-300 font-bold">........... orang</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-300">Nomor Peserta yang Tidak Hadir</td>
                <td className="p-2 border border-slate-300 text-slate-400 italic font-mono">
                  (Tuliskan nomor peserta jika ada yang berhalangan)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-1.5 pt-2">
          <div className="font-bold text-slate-900">2. Catatan Khusus Kejadian Selama Ujian:</div>
          <div className="border border-slate-400 p-4 rounded min-h-[90px] font-sans text-slate-400 italic text-[11px]">
            Pelaksanaan ujian berjalan dengan tertib, aman, dan lancar tanpa kendala teknis.
          </div>
        </div>

        <p className="pt-2">
          Demikian Berita Acara ini dibuat dengan sesungguhnya untuk dapat dipergunakan sebagaimana mestinya.
        </p>
      </div>

      {/* Proctors Signature Footer */}
      <div className="pt-6 font-sans text-xs grid grid-cols-2 text-center">
        <div>
          <div className="text-slate-600">Pengawas Ruang 1,</div>
          <div className="h-16"></div>
          <div className="font-bold underline text-slate-950">
            {room?.proctor1 || '(..................................................)'}
          </div>
          <div className="text-[10px] text-slate-500">NIP. .........................................</div>
        </div>

        <div>
          <div className="text-slate-600">Pengawas Ruang 2,</div>
          <div className="h-16"></div>
          <div className="font-bold underline text-slate-950">
            {room?.proctor2 || '(..................................................)'}
          </div>
          <div className="text-[10px] text-slate-500">NIP. .........................................</div>
        </div>
      </div>
    </div>
  );
};

/* --- 4. DAFTAR NOMINASI RUANG (TEMPELAN PINTU) --- */
const DoorRosterSheet: React.FC<{
  config: ExamConfig;
  room?: ExamRoom;
  students: Student[];
}> = ({ config, room, students }) => {
  return (
    <div className="font-sans text-slate-900 text-xs space-y-4">
      {/* Header */}
      <div className="text-center border-b-2 border-slate-900 pb-3">
        <div className="text-[10px] uppercase font-bold text-slate-600">
          {config.schoolName}
        </div>
        <h3 className="text-lg font-black uppercase text-slate-950 mt-0.5">
          DAFTAR PESERTA UJIAN DI {room?.name} ({room?.roomCode})
        </h3>
        <p className="text-xs font-semibold text-slate-700">
          {config.examTitle} • TP {config.academicYear}
        </p>
      </div>

      <div className="flex justify-between items-center bg-slate-100 p-3 rounded font-medium text-xs">
        <span>Lokasi: <strong>{room?.location}</strong></span>
        <span>Total Peserta: <strong>{students.length} Siswa</strong></span>
        <span>Kapasitas: <strong>{room?.capacity} Kursi</strong></span>
      </div>

      {/* Table */}
      <table className="w-full text-[11px] border border-slate-900 text-left">
        <thead className="bg-slate-900 text-white font-bold">
          <tr>
            <th className="p-2 w-12 text-center">No</th>
            <th className="p-2 w-16 text-center">Meja</th>
            <th className="p-2 w-32">No. Peserta</th>
            <th className="p-2">Nama Lengkap Siswa</th>
            <th className="p-2 w-24 text-center">Kelas</th>
            <th className="p-2 w-12 text-center">L/P</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300">
          {students.map((student, idx) => (
            <tr key={student.id} className="hover:bg-slate-50">
              <td className="p-2 text-center font-medium border-r border-slate-300">{idx + 1}</td>
              <td className="p-2 text-center font-mono font-bold bg-indigo-50 text-indigo-900 border-r border-slate-300">
                {student.seatNumber ? String(student.seatNumber).padStart(2, '0') : '-'}
              </td>
              <td className="p-2 font-mono font-bold text-slate-900 border-r border-slate-300">
                {student.examNumber}
              </td>
              <td className="p-2 font-semibold uppercase text-slate-950 border-r border-slate-300">
                {student.name}
              </td>
              <td className="p-2 text-center font-bold border-r border-slate-300">
                {student.className}
              </td>
              <td className="p-2 text-center font-bold">
                {student.gender}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
