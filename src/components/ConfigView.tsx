import React, { useState } from 'react';
import { ExamCategory, ExamConfig } from '../types';
import { Settings, Check, Building2, UserCheck, Calendar, ShieldCheck, Eye } from 'lucide-react';

interface ConfigViewProps {
  config: ExamConfig;
  onSaveConfig: (updated: ExamConfig) => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({ config, onSaveConfig }) => {
  const [formData, setFormData] = useState<ExamConfig>(config);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleExamTypeChange = (type: ExamCategory) => {
    let defaultTitle = '';
    if (type === 'STS') {
      defaultTitle = `SUMATIF TENGAH SEMESTER (STS) ${formData.semester.toUpperCase()}`;
    } else if (type === 'SAS') {
      defaultTitle = `SUMATIF AKHIR SEMESTER (SAS) GANJIL`;
    } else if (type === 'SAT') {
      defaultTitle = `ASESMEN SUMATIF AKHIR TAHUN (SAT) GENAP`;
    } else if (type === 'US') {
      defaultTitle = `UJIAN SEKOLAH (US / USPB) TINGKAT AKHIR`;
    }

    setFormData({
      ...formData,
      examType: type,
      examTitle: defaultTitle,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <span>Pengaturan Identitas Sekolah &amp; Pelaksanaan Ujian</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi jenis ujian (STS, SAS, SAT, US), profil sekolah untuk kop surat, nama kepala sekolah &amp; ketua panitia.
          </p>
        </div>

        {showSavedToast && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-300 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Exam Type Selector */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>1. Jenis Ujian &amp; Periode Pelaksanaan</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Pilih Kategori Ujian Sekolah:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'STS', title: 'STS', desc: 'Sumatif Tengah Semester (PTS)' },
                { id: 'SAS', title: 'SAS', desc: 'Sumatif Akhir Semester Ganjil (PAS)' },
                { id: 'SAT', title: 'SAT', desc: 'Sumatif Akhir Tahun Genap (PAT)' },
                { id: 'US', title: 'Ujian Sekolah', desc: 'Ujian Sekolah / Asesmen Akhir (US/USPB)' },
              ].map((item) => {
                const isSelected = formData.examType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleExamTypeChange(item.id as ExamCategory)}
                    className={`p-3.5 rounded-lg text-left border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold">{item.title}</span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 font-bold" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun Pelajaran (TP)
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="2025/2026"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Semester
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value as 'Ganjil' | 'Genap' })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Awalan Kode No. Peserta (Prefix)
              </label>
              <input
                type="text"
                value={formData.codePrefix}
                onChange={(e) => setFormData({ ...formData, codePrefix: e.target.value })}
                placeholder="25-04"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                required
              />
              <span className="text-[10px] text-slate-400">Contoh: 25-04 menghasilkan 25-04-01-001</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Resmi Ujian (Ditampilkan pada Kartu &amp; Berkas Ujian)
            </label>
            <input
              type="text"
              value={formData.examTitle}
              onChange={(e) => setFormData({ ...formData, examTitle: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-slate-800"
              required
            />
          </div>
        </div>

        {/* Section 2: School Profile (Kop Surat) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>2. Identitas Sekolah &amp; Kop Surat Resmi</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Sekolah Resmi
              </label>
              <input
                type="text"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                placeholder="SMK NEGERI 1 ..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenjang Sekolah
              </label>
              <select
                value={formData.schoolLevel}
                onChange={(e) => setFormData({ ...formData, schoolLevel: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                <option value="SD">SD (Sekolah Dasar)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NPSN Sekolah
              </label>
              <input
                type="text"
                value={formData.npsn}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                placeholder="20234567"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Jalan &amp; Kompleks
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Jl. Merdeka Pendidikan No. 45"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kecamatan</label>
              <input
                type="text"
                value={formData.subdistrict}
                onChange={(e) => setFormData({ ...formData, subdistrict: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kabupaten / Kota</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Provinsi</label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Pos</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. Telepon</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Resmi</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Website</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Officials & Signatures */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>3. Pejabat Penandatangan &amp; Titimangsa Kartu Ujian</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kepala Sekolah */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kepala Sekolah</span>
              </h4>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Lengkap &amp; Gelar
                </label>
                <input
                  type="text"
                  value={formData.principalName}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                  placeholder="Drs. H. ..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={formData.principalNip}
                  onChange={(e) => setFormData({ ...formData, principalNip: e.target.value })}
                  placeholder="1971..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono"
                />
              </div>
            </div>

            {/* Ketua Panitia Ujian */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ketua Panitia Ujian</span>
              </h4>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Lengkap &amp; Gelar
                </label>
                <input
                  type="text"
                  value={formData.committeeHeadName}
                  onChange={(e) => setFormData({ ...formData, committeeHeadName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  NIP Ketua Panitia
                </label>
                <input
                  type="text"
                  value={formData.committeeHeadNip}
                  onChange={(e) => setFormData({ ...formData, committeeHeadNip: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kota / Tempat Terbit Kartu
              </label>
              <input
                type="text"
                value={formData.issuePlace}
                onChange={(e) => setFormData({ ...formData, issuePlace: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Titimangsa Kartu
              </label>
              <input
                type="text"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                placeholder="01 Desember 2025"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="stampCheck"
                checked={formData.stampEnabled}
                onChange={(e) => setFormData({ ...formData, stampEnabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="stampCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Tampilkan Stempel Resmi Sekolah pada Kartu Ujian
              </label>
            </div>
          </div>
        </div>

        {/* Live Preview of School Letterhead (Kop Surat) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pratinjau Kop Surat Resmi</span>
            </span>
            <span className="text-[11px] text-slate-400">Ditampilkan pada lembar kartu &amp; administrasi</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 text-center font-serif text-slate-900">
            <div className="text-xs tracking-wider uppercase font-semibold text-slate-700">
              PEMERINTAH DAERAH PROVINSI {formData.province.toUpperCase()}
            </div>
            <div className="text-xs tracking-wider uppercase font-semibold text-slate-700">
              DINAS PENDIDIKAN DAN KEBUDAYAAN
            </div>
            <div className="text-base sm:text-lg font-black tracking-tight text-slate-950 uppercase mt-0.5">
              {formData.schoolName}
            </div>
            <div className="text-[11px] font-sans text-slate-600 mt-1">
              {formData.address}, {formData.subdistrict}, {formData.district} - {formData.postalCode}
            </div>
            <div className="text-[10px] font-sans text-slate-500">
              Telp: {formData.phone} | Email: {formData.email} | Web: {formData.website}
            </div>
            <div className="border-b-2 border-slate-900 mt-2"></div>
            <div className="border-b border-slate-900 mt-0.5"></div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Perubahan Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
