import React, { useState, useEffect } from 'react';
import { ActiveTab, ExamConfig, ExamRoom, ExamScheduleItem, Student } from './types';
import { initialConfig, initialRooms, initialSchedule, initialStudents } from './data/initialData';
import { distributeCrossClass, distributeSequential, generateExamNumbers, distributeCrossLevelDoubleDesk } from './utils/distribution';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ConfigView } from './components/ConfigView';
import { StudentsView } from './components/StudentsView';
import { RoomsView } from './components/RoomsView';
import { SeatingChartView } from './components/SeatingChartView';
import { ExamCardsView } from './components/ExamCardsView';
import { ExamDocumentsView } from './components/ExamDocumentsView';

const STORAGE_KEYS = {
  CONFIG: 'sim_ujian_config_mts_v2',
  STUDENTS: 'sim_ujian_students_mts_v2',
  ROOMS: 'sim_ujian_rooms_mts_v2',
  SCHEDULES: 'sim_ujian_schedules_mts_v2',
};

export default function App() {
  // Load from localStorage or initial defaults
  const [config, setConfig] = useState<ExamConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : initialConfig;
  });

  const [rooms, setRooms] = useState<ExamRoom[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROOMS);
    return saved ? JSON.parse(saved) : initialRooms;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (saved) {
      return JSON.parse(saved);
    }
    // Pre-distribute initial students using Cross-Class so user gets an instant ready-to-test preview
    const { updatedStudents } = distributeCrossClass(initialStudents, initialRooms);
    return updatedStudents;
  });

  const [schedules, setSchedules] = useState<ExamScheduleItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    return saved ? JSON.parse(saved) : initialSchedule;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as ActiveTab;
      if (tab && ['dashboard', 'config', 'students', 'rooms', 'seating', 'cards', 'documents'].includes(tab)) {
        return tab;
      }
    }
    return 'dashboard';
  });
  const [selectedRoomForSeating, setSelectedRoomForSeating] = useState<string>(rooms[0]?.id || '');
  const [notification, setNotification] = useState<string | null>(null);

  // Check URL query parameters for autoPrint when opened in a new tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autoPrint') === 'true' || params.get('print') === 'true') {
        const timer = setTimeout(() => {
          try {
            window.print();
          } catch (err) {
            console.warn('Auto print error:', err);
          }
        }, 900);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  }, [schedules]);

  // Auto-heal any same-tingkat desks from previous cached sessions
  useEffect(() => {
    if (rooms.length > 0 && (rooms[0].capacity || 0) >= 40) {
      let hasConflict = false;
      for (const r of rooms) {
        const roomS = students.filter((s) => s.roomId === r.id);
        const half = Math.floor((r.capacity || 40) / 2);
        for (let i = 1; i <= half; i++) {
          const sLeft = roomS.find((s) => s.seatNumber === i);
          const sRight = roomS.find((s) => s.seatNumber === half + i);
          if (sLeft && sRight) {
            const tL = sLeft.className.replace(/\s*[A-Z0-9].*$/i, '').trim() || sLeft.className;
            const tR = sRight.className.replace(/\s*[A-Z0-9].*$/i, '').trim() || sRight.className;
            if (tL === tR) {
              hasConflict = true;
              break;
            }
          }
        }
        if (hasConflict) break;
      }
      if (hasConflict) {
        const { updatedStudents } = distributeCrossLevelDoubleDesk(students, rooms, 'photo_order');
        setStudents(updatedStudents);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // --- Handlers ---
  const handleSaveConfig = (updated: ExamConfig) => {
    setConfig(updated);
    showToast('Konfigurasi identitas ujian berhasil disimpan.');
  };

  const handleAddStudent = (newStudent: Omit<Student, 'id'>) => {
    const student: Student = {
      ...newStudent,
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setStudents((prev) => [...prev, student]);
    showToast(`Siswa "${student.name}" berhasil ditambahkan.`);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    showToast(`Data siswa "${updatedStudent.name}" diperbarui.`);
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    showToast('Siswa berhasil dihapus.');
  };

  const handleBulkImport = (newStudents: Omit<Student, 'id'>[]) => {
    const created: Student[] = newStudents.map((s, idx) => ({
      ...s,
      id: `std-import-${Date.now()}-${idx}`,
    }));
    setStudents((prev) => [...prev, ...created]);
    showToast(`Berhasil menambahkan ${created.length} siswa baru dari Excel.`);
  };

  const handleRegenerateNumbers = () => {
    const updated = generateExamNumbers(students, config.codePrefix || '25-04');
    setStudents(updated);
    showToast('Nomor peserta berhasil di-generate otomatis per kelas/rombel.');
  };

  const handleAddRoom = (newRoom: Omit<ExamRoom, 'id'>) => {
    const room: ExamRoom = {
      ...newRoom,
      id: `room-${Date.now()}`,
    };
    setRooms((prev) => [...prev, room]);
    showToast(`Ruang "${room.name}" berhasil ditambahkan.`);
  };

  const handleUpdateRoom = (updatedRoom: ExamRoom) => {
    setRooms((prev) => prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)));
    showToast(`Data ${updatedRoom.name} diperbarui.`);
  };

  const handleDeleteRoom = (id: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== id));
    // Clear assignments for students in deleted room
    setStudents((prev) =>
      prev.map((s) => (s.roomId === id ? { ...s, roomId: undefined, roomName: undefined, seatNumber: undefined } : s))
    );
    showToast('Ruang berhasil dihapus dan peserta di dalamnya dikosongkan.');
  };

  // Distribution triggers
  const handleDistributeCross = () => {
    const { updatedStudents, unassignedStudents } = distributeCrossClass(students, rooms);
    setStudents(updatedStudents);
    if (unassignedStudents.length > 0) {
      showToast(`Pembagian Sistem Silang selesai! Catatan: ${unassignedStudents.length} siswa belum dapat ruang karena kapasitas kurang.`);
    } else {
      showToast('Pembagian Sistem Silang berhasil! Semua siswa diselingi antar kelas di setiap ruang.');
    }
  };

  const handleDistributeSequential = () => {
    const { updatedStudents, unassignedStudents } = distributeSequential(students, rooms);
    setStudents(updatedStudents);
    if (unassignedStudents.length > 0) {
      showToast(`Pembagian Berurutan selesai! Catatan: ${unassignedStudents.length} siswa belum dapat ruang.`);
    } else {
      showToast('Pembagian berurutan per rombel berhasil dialokasikan.');
    }
  };

  const handleDistributeCrossLevel = (pattern: 'photo_order' | 'sequential_desk' = 'photo_order') => {
    // If rooms currently have capacity 20, bump them up to 40 so that 40 students fit per room
    let currentRooms = rooms;
    if (rooms.length > 0 && (rooms[0].capacity || 0) < 40) {
      currentRooms = rooms.slice(0, 12).map((r, idx) => ({
        ...r,
        roomCode: `R.${String(idx + 1).padStart(2, '0')}`,
        name: `Ruang ${String(idx + 1).padStart(2, '0')}`,
        capacity: 40,
      }));
      setRooms(currentRooms);
    }
    const { updatedStudents, unassignedStudents } = distributeCrossLevelDoubleDesk(students, currentRooms, pattern);
    setStudents(updatedStudents);
    if (unassignedStudents.length > 0) {
      showToast(`Plotting Silang Antar-Tingkat selesai! Catatan: ${unassignedStudents.length} siswa belum dapat ruang.`);
    } else {
      showToast('Plotting Silang Antar-Tingkat (1 Meja 2 Siswa Beda Tingkat - 0 Meja Se-Tingkat) berhasil!');
    }
  };

  const handleSetRoomsPreset = (presetCapacity: 20 | 40) => {
    if (presetCapacity === 40) {
      const updatedRooms: ExamRoom[] = rooms.slice(0, 12).map((r, idx) => ({
        ...r,
        roomCode: `R.${String(idx + 1).padStart(2, '0')}`,
        name: `Ruang ${String(idx + 1).padStart(2, '0')}`,
        capacity: 40,
      }));
      setRooms(updatedRooms);
      const { updatedStudents } = distributeCrossLevelDoubleDesk(students, updatedRooms, 'photo_order');
      setStudents(updatedStudents);
      showToast('Kapasitas semua ruang diset 40 siswa (12 Ruang) dengan Plotting Silang Antar-Tingkat Bebas Se-Tingkat!');
    } else {
      const updatedRooms: ExamRoom[] = Array.from({ length: 24 }, (_, idx) => {
        const existing = rooms[idx];
        return {
          id: existing?.id || `room-${idx + 1}`,
          roomCode: `R.${String(idx + 1).padStart(2, '0')}`,
          name: `Ruang ${String(idx + 1).padStart(2, '0')}`,
          location: existing?.location || `Gedung A - R.${String(idx + 1).padStart(2, '0')}`,
          capacity: 20,
          proctor1: existing?.proctor1 || 'Guru Pengawas 1',
          proctor2: existing?.proctor2 || 'Guru Pengawas 2',
        };
      });
      setRooms(updatedRooms);
      const { updatedStudents } = distributeCrossClass(students, updatedRooms);
      setStudents(updatedStudents);
      showToast('Kapasitas semua ruang diset 20 siswa (24 Ruang) dengan Plotting Silang Kelas!');
    }
  };

  const handleClearDistribution = () => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        roomId: undefined,
        roomName: undefined,
        seatNumber: undefined,
      }))
    );
    showToast('Seluruh penempatan ruang dan nomor meja telah dikosongkan.');
  };

  // Swap Seats between two students
  const handleSwapSeats = (studentId1: string, studentId2: string) => {
    setStudents((prev) => {
      const s1 = prev.find((s) => s.id === studentId1);
      const s2 = prev.find((s) => s.id === studentId2);
      if (!s1 || !s2) return prev;

      return prev.map((s) => {
        if (s.id === studentId1) {
          return {
            ...s,
            roomId: s2.roomId,
            roomName: s2.roomName,
            seatNumber: s2.seatNumber,
          };
        }
        if (s.id === studentId2) {
          return {
            ...s,
            roomId: s1.roomId,
            roomName: s1.roomName,
            seatNumber: s1.seatNumber,
          };
        }
        return s;
      });
    });

    showToast('Posisi tempat duduk kedua siswa berhasil ditukar.');
  };

  // Reset to initial full realistic dataset
  const handleResetData = () => {
    if (window.confirm('Apakah Anda yakin ingin memulihkan data MTs Manbaul Islam (463 siswa, 24 ruang)?')) {
      const { updatedStudents } = distributeCrossClass(initialStudents, initialRooms);
      setConfig(initialConfig);
      setRooms(initialRooms);
      setStudents(updatedStudents);
      setSchedules(initialSchedule);
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
      localStorage.removeItem(STORAGE_KEYS.STUDENTS);
      localStorage.removeItem(STORAGE_KEYS.ROOMS);
      localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
      showToast('Data aplikasi berhasil dikembalikan ke data awal lengkap.');
    }
  };

  const handleQuickPrint = () => {
    setActiveTab('cards');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Navigation Header */}
      <Header
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetData={handleResetData}
        onQuickPrint={handleQuickPrint}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 no-print">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{notification}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            config={config}
            students={students}
            rooms={rooms}
            setActiveTab={setActiveTab}
            onDistributeCross={handleDistributeCross}
            onDistributeSequential={handleDistributeSequential}
          />
        )}

        {activeTab === 'config' && (
          <ConfigView
            config={config}
            onSaveConfig={handleSaveConfig}
          />
        )}

        {activeTab === 'students' && (
          <StudentsView
            students={students}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onBulkImport={handleBulkImport}
            onRegenerateNumbers={handleRegenerateNumbers}
            onClearAll={() => setStudents([])}
          />
        )}

        {activeTab === 'rooms' && (
          <RoomsView
            rooms={rooms}
            students={students}
            onAddRoom={handleAddRoom}
            onUpdateRoom={handleUpdateRoom}
            onDeleteRoom={handleDeleteRoom}
            onDistributeCross={handleDistributeCross}
            onDistributeCrossLevel={handleDistributeCrossLevel}
            onDistributeSequential={handleDistributeSequential}
            onClearDistribution={handleClearDistribution}
            onSetRoomsPreset={handleSetRoomsPreset}
            setActiveTab={setActiveTab}
            onSelectRoomForSeating={setSelectedRoomForSeating}
          />
        )}

        {activeTab === 'seating' && (
          <SeatingChartView
            config={config}
            rooms={rooms}
            students={students}
            selectedRoomId={selectedRoomForSeating || rooms[0]?.id || ''}
            onSelectRoom={setSelectedRoomForSeating}
            onSwapSeats={handleSwapSeats}
            onDistributeCrossLevel={handleDistributeCrossLevel}
          />
        )}

        {activeTab === 'cards' && (
          <ExamCardsView
            config={config}
            students={students}
            rooms={rooms}
            schedules={schedules}
            onUpdateSchedules={setSchedules}
          />
        )}

        {activeTab === 'documents' && (
          <ExamDocumentsView
            config={config}
            students={students}
            rooms={rooms}
            schedules={schedules}
          />
        )}
      </main>

      {/* App Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {config.schoolName} — Sistem Informasi Manajemen Ujian Sekolah (STS, SAS &amp; US)
          </span>
          <span className="text-[11px] text-slate-400">
            Mendukung kurikulum Indonesia: Pembagian Sistem Silang &amp; Kartu Ujian Cetak A4
          </span>
        </div>
      </footer>
    </div>
  );
}
