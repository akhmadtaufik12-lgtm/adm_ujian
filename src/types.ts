export type ExamCategory = 'STS' | 'SAS' | 'SAT' | 'US';

export interface ExamConfig {
  schoolName: string;
  npsn: string;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  examType: ExamCategory;
  examTitle: string;
  principalName: string;
  principalNip: string;
  committeeHeadName: string;
  committeeHeadNip: string;
  issueDate: string;
  issuePlace: string;
  stampEnabled: boolean;
  schoolLevel: 'SMK' | 'SMA' | 'SMP' | 'SD';
  codePrefix: string; // e.g. "26-04"
}

export interface Student {
  id: string;
  examNumber: string;
  nisn: string;
  nis: string;
  name: string;
  className: string;
  gender: 'L' | 'P';
  session: number;
  roomId?: string;
  roomName?: string;
  seatNumber?: number;
}

export interface ExamRoom {
  id: string;
  roomCode: string;
  name: string;
  location: string;
  capacity: number;
  proctor1: string;
  proctor2: string;
}

export type DistributionMethod = 'cross_class' | 'sequential';

export interface ExamScheduleItem {
  id: string;
  dayName: string;
  date: string;
  sessionTime: string;
  subject: string;
  targetLevel: string; // e.g., "Semua Kelas" or "Kelas X, XI, XII"
}

export type ActiveTab = 
  | 'dashboard'
  | 'config'
  | 'students'
  | 'rooms'
  | 'seating'
  | 'cards'
  | 'documents';
