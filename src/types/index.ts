export type UserRole = 'admin' | 'student' | 'parent';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  studentId?: string;
}

export interface Student {
  id: string;
  name: string;
  dob: string;
  address: string;
  phone: string;
  class: string;
  section: string;
  result?: Record<string, any>;
  userId?: string;
  photoURL?: string;
  documents?: { name: string; url: string; type: string }[];
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: any; // Firestore Timestamp
  dateString: string;
  status: 'Present' | 'Absent';
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: any; // Firestore Timestamp
  isImportant: boolean;
  authorId: string;
}
