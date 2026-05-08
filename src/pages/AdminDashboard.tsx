import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  where, 
  getDocs,
  Timestamp,
  setDoc,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { UserProfile, Student, AttendanceRecord, Notice } from '../types';
import DashboardLayout from '../components/DashboardLayout';
const SchoolInfoSection = React.lazy(() => import('../components/SchoolInfoSection'));
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  FileDown,
  Users,
  Calendar,
  Award,
  GraduationCap,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Bell,
  FileText,
  BarChart3,
  Upload,
  File,
  School,
  ClipboardList,
  Image as ImageIcon,
  Loader2,
  Eye,
  Download,
  ExternalLink
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { toast } from 'sonner';
import { format, startOfDay, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateAttendancePercentage, getAttendanceStatusColor } from '../lib/attendance-utils';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard({ profile }: { profile: UserProfile }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Student Form State
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    name: '',
    dob: '',
    address: '',
    phone: '',
    class: '',
    section: '',
    email: '', // For creating user account
    photoURL: '',
    documents: [] as { name: string; url: string; type: string }[]
  });

  const [uploading, setUploading] = useState(false);

  // Document Viewer State
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{ name: string; url: string; type: string } | null>(null);

  // Student Details State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Notice Form State
  const [isNoticeDialogOpen, setIsNoticeDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    isImportant: false
  });

  // User Management State
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userForm, setUserForm] = useState({
    role: 'student' as any,
    studentId: ''
  });

  // Attendance State
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClass, setSelectedClass] = useState('All');
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Results State
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [selectedStudentForResult, setSelectedStudentForResult] = useState<Student | null>(null);
  const [resultForm, setResultForm] = useState({
    math: '',
    science: '',
    english: '',
    history: '',
    remarks: ''
  });

  useEffect(() => {
    const qStudents = query(collection(db, 'students'));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const studentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(studentData);
      setLoading(false);
    });

    const qAttendance = query(collection(db, 'attendance'));
    const unsubAttendance = onSnapshot(qAttendance, (snapshot) => {
      const attendanceData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setAttendance(attendanceData);
    });

    const qNotices = query(collection(db, 'notices'), orderBy('date', 'desc'));
    const unsubNotices = onSnapshot(qNotices, (snapshot) => {
      const noticesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
      setNotices(noticesData);
    });

    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setUsers(usersData);
    });

    return () => {
      unsubStudents();
      unsubAttendance();
      unsubNotices();
      unsubUsers();
    };
  }, []);

  const handleSaveNotice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (editingNotice) {
        await updateDoc(doc(db, 'notices', editingNotice.id), {
          title: noticeForm.title,
          content: noticeForm.content,
          isImportant: noticeForm.isImportant,
          date: Timestamp.now()
        });
        toast.success("Notice updated successfully");
      } else {
        await addDoc(collection(db, 'notices'), {
          title: noticeForm.title,
          content: noticeForm.content,
          isImportant: noticeForm.isImportant,
          date: Timestamp.now(),
          authorId: profile.uid
        });
        toast.success("Notice posted successfully");
      }
      setIsNoticeDialogOpen(false);
      setEditingNotice(null);
      setNoticeForm({ title: '', content: '', isImportant: false });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (confirm("Are you sure you want to delete this notice?")) {
      try {
        await deleteDoc(doc(db, 'notices', id));
        toast.success("Notice deleted");
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await updateDoc(doc(db, 'users', selectedUser.uid), {
        role: userForm.role,
        studentId: userForm.studentId
      });
      toast.success("User updated successfully");
      setIsUserDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (type === 'photo') {
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        toast.error("Photo size should be less than 2MB");
        return;
      }
    } else {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error("Invalid file type. Please upload a PDF or an image.");
        return;
      }
      const maxSize = 5 * 1024 * 1024; // 5MB for documents
      if (file.size > maxSize) {
        toast.error("File is too large. Document size should be less than 5MB.");
        return;
      }
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `students/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      if (type === 'photo') {
        setStudentForm(prev => ({ ...prev, photoURL: url }));
        toast.success("Photo uploaded successfully");
      } else {
        setStudentForm(prev => ({
          ...prev,
          documents: [...prev.documents, { name: file.name, url, type: file.type }]
        }));
        toast.success("Document uploaded successfully");
      }
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await updateDoc(doc(db, 'students', editingStudent.id), {
          name: studentForm.name,
          dob: studentForm.dob,
          address: studentForm.address,
          phone: studentForm.phone,
          class: studentForm.class,
          section: studentForm.section,
          photoURL: studentForm.photoURL,
          documents: studentForm.documents
        });
        toast.success("Student updated successfully");
      } else {
        await addDoc(collection(db, 'students'), {
          name: studentForm.name,
          dob: studentForm.dob,
          address: studentForm.address,
          phone: studentForm.phone,
          class: studentForm.class,
          section: studentForm.section,
          photoURL: studentForm.photoURL,
          documents: studentForm.documents,
          createdAt: new Date().toISOString()
        });
        
        if (studentForm.email) {
          toast.info("User account should be created with email: " + studentForm.email);
        }
        
        toast.success("Student added successfully");
      }
      setIsStudentDialogOpen(false);
      setEditingStudent(null);
      setStudentForm({ 
        name: '', dob: '', address: '', phone: '', class: '', section: '', email: '', 
        photoURL: '', documents: [] 
      });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        await deleteDoc(doc(db, 'students', id));
        toast.success("Student deleted");
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleMarkAttendance = async (studentId: string, status: 'Present' | 'Absent') => {
    setAttendanceLoading(true);
    try {
      const dateStr = selectedDate;
      const dateObj = new Date(dateStr);
      
      // Check if record exists for this student and date
      const q = query(
        collection(db, 'attendance'), 
        where('studentId', '==', studentId),
        where('dateString', '==', dateStr)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Update existing
        const recordId = querySnapshot.docs[0].id;
        await updateDoc(doc(db, 'attendance', recordId), { status });
      } else {
        // Create new
        await addDoc(collection(db, 'attendance'), {
          studentId,
          status,
          date: Timestamp.fromDate(dateObj),
          dateString: dateStr
        });
      }
      toast.success(`Marked ${status}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleSaveResult = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStudentForResult) return;
    try {
      await updateDoc(doc(db, 'students', selectedStudentForResult.id), {
        result: resultForm
      });
      toast.success("Results updated");
      setIsResultDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Student List - EduManage", 14, 15);
    
    const tableData = students.map(s => [s.name, s.class, s.section, s.phone]);
    autoTable(doc, {
      head: [['Name', 'Class', 'Section', 'Phone']],
      body: tableData,
      startY: 20,
    });
    
    doc.save("students_list.pdf");
  };

  const handleExportMonthlyReport = () => {
    const doc = new jsPDF();
    const date = new Date(selectedDate);
    const monthName = format(date, 'MMMM yyyy');
    
    doc.setFontSize(18);
    doc.text(`Monthly Attendance Report - ${monthName}`, 14, 22);
    
    const reportData = students.map(student => {
      const studentRecords = attendance.filter(a => a.studentId === student.id);
      const monthlyRecords = studentRecords.filter(a => {
        const d = a.date.toDate();
        return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
      });
      
      const present = monthlyRecords.filter(r => r.status === 'Present').length;
      const total = monthlyRecords.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      
      return [
        student.name,
        student.class,
        student.section,
        present,
        total - present,
        total,
        `${percentage}%`
      ];
    });

    autoTable(doc, {
      startY: 30,
      head: [['Student Name', 'Class', 'Section', 'Present', 'Absent', 'Total Days', 'Percentage']],
      body: reportData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`Attendance_Report_${monthName.replace(' ', '_')}.pdf`);
    toast.success("Monthly report generated");
  };

  const getStudentAttendancePercentage = (studentId: string) => {
    const studentRecords = attendance.filter(a => a.studentId === studentId);
    return calculateAttendancePercentage(studentRecords);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalStudents: students.length,
    totalClasses: new Set(students.map(s => s.class)).size,
    todayAttendance: attendance.filter(a => a.dateString === selectedDate && a.status === 'Present').length
  };

  // Analytics Data
  const classDistribution = Array.from(new Set(students.map(s => s.class))).map(className => ({
    name: `Class ${className}`,
    value: students.filter(s => s.class === className).length
  }));

  const attendanceTrend = Array.from(new Set(attendance.map(a => a.dateString)))
    .sort()
    .slice(-7)
    .map((date: any) => {
      const dayRecords = attendance.filter(a => a.dateString === date);
      const present = dayRecords.filter(r => r.status === 'Present').length;
      const total = dayRecords.length;
      return {
        date: format(new Date(date), 'MMM dd'),
        percentage: total > 0 ? Math.round((present / total) * 100) : 0
      };
    });

  const performanceStats = [
    { name: 'Math', average: 85 },
    { name: 'Science', average: 78 },
    { name: 'English', average: 82 },
    { name: 'History', average: 75 },
    { name: 'Art', average: 90 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <DashboardLayout profile={profile} activeTab={activeTab} setActiveTab={setActiveTab}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pb-10"
      >
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="premium-card overflow-hidden group">
              <CardContent className="p-0">
                <div className="p-8 flex items-center justify-between relative">
                  <div className="z-10">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 opacity-70">Total Students</p>
                    <h3 className="text-3xl font-bold tracking-tight text-foreground">{stats.totalStudents}</h3>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase tracking-wider">
                      <TrendingUp className="h-3 w-3" />
                      <span>+12% this month</span>
                    </div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-xl transition-all duration-300">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card overflow-hidden group">
              <CardContent className="p-0">
                <div className="p-8 flex items-center justify-between relative">
                  <div className="z-10">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 opacity-70">Total Classes</p>
                    <h3 className="text-3xl font-bold tracking-tight text-foreground">{stats.totalClasses}</h3>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      <School className="h-3 w-3" />
                      <span>Active sections</span>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-xl transition-all duration-300">
                    <School className="h-7 w-7 text-blue-600" />
                  </div>
                  <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card overflow-hidden group">
              <CardContent className="p-0">
                <div className="p-8 flex items-center justify-between relative">
                  <div className="z-10">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 opacity-70">Present Today</p>
                    <h3 className="text-3xl font-bold tracking-tight text-foreground">{stats.todayAttendance}</h3>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                      <ClipboardList className="h-3 w-3" />
                      <span>{Math.round((stats.todayAttendance / (stats.totalStudents || 1)) * 100)}% Attendance</span>
                    </div>
                  </div>
                  <div className="p-4 bg-amber-500/10 rounded-xl transition-all duration-300">
                    <ClipboardList className="h-7 w-7 text-amber-600" />
                  </div>
                  <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="premium-card">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-6">
                <div>
                  <CardTitle className="text-xl font-extrabold tracking-tight">Recent Notices</CardTitle>
                  <CardDescription className="text-xs font-medium">Latest school announcements</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/5" onClick={() => setActiveTab('notices')}>View All</Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {notices.slice(0, 3).map(notice => (
                  <div key={notice.id} className="p-4 bg-accent/30 hover:bg-accent/50 rounded-2xl border border-border/50 transition-all duration-300 group cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-extrabold truncate flex items-center gap-2 group-hover:text-primary transition-colors">
                        {notice.isImportant && <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full animate-pulse" />}
                        {notice.title}
                      </h4>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">
                        {notice.date?.toDate ? format(notice.date.toDate(), 'MMM dd') : ''}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 font-medium">{notice.content}</p>
                  </div>
                ))}
                {notices.length === 0 && (
                  <div className="text-center py-10 space-y-2">
                    <Bell className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                    <p className="text-sm font-bold text-muted-foreground/50">No notices posted yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardHeader className="border-b border-border/50 pb-6">
                <CardTitle className="text-xl font-extrabold tracking-tight">Recent Activity</CardTitle>
                <CardDescription className="text-xs font-medium">Latest updates from the school portal</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {students.slice(0, 3).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-accent/30 hover:bg-accent/50 rounded-2xl border border-border/50 transition-all duration-300 group">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl premium-gradient flex items-center justify-center text-primary-foreground font-black text-lg shadow-lg shadow-primary/10 group-hover:rotate-6 transition-transform">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">{s.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">Class {s.class} • Section {s.section}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-background/50 border-primary/20 text-primary">Student</Badge>
                    </div>
                  ))}
                  {students.length === 0 && (
                    <div className="text-center py-10 space-y-2">
                      <Users className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                      <p className="text-sm font-bold text-muted-foreground/50">No recent activity.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
            </motion.div>
          )}

          {activeTab === 'notices' && (
            <motion.div
              key="notices"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">School Notices</h2>
            <Dialog open={isNoticeDialogOpen} onOpenChange={setIsNoticeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => {
                  setEditingNotice(null);
                  setNoticeForm({ title: '', content: '', isImportant: false });
                }}>
                  <Plus className="h-4 w-4" />
                  Post Notice
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingNotice ? 'Edit Notice' : 'Post New Notice'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveNotice} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input 
                      id="title" 
                      value={noticeForm.title} 
                      onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <textarea 
                      id="content"
                      className="w-full min-h-[150px] p-3 rounded-md border border-input bg-background text-sm"
                      value={noticeForm.content} 
                      onChange={e => setNoticeForm({...noticeForm, content: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="isImportant" 
                      checked={noticeForm.isImportant}
                      onChange={e => setNoticeForm({...noticeForm, isImportant: e.target.checked})}
                    />
                    <Label htmlFor="isImportant">Mark as Important</Label>
                  </div>
                  <DialogFooter>
                    <Button type="submit">{editingNotice ? 'Update' : 'Post'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {notices.map(notice => (
              <Card key={notice.id} className={notice.isImportant ? "border-destructive/50" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{notice.title}</CardTitle>
                      {notice.isImportant && <Badge variant="destructive">Important</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingNotice(notice);
                        setNoticeForm({
                          title: notice.title,
                          content: notice.content,
                          isImportant: notice.isImportant
                        });
                        setIsNoticeDialogOpen(true);
                      }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteNotice(notice.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Posted on {notice.date?.toDate ? format(notice.date.toDate(), 'MMM dd, yyyy HH:mm') : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notice.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Linked Student</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : user.role === 'parent' ? 'secondary' : 'outline'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.studentId ? (
                        <span className="text-sm">{students.find(s => s.id === user.studentId)?.name || 'Unknown'}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedUser(user);
                        setUserForm({
                          role: user.role,
                          studentId: user.studentId || ''
                        });
                        setIsUserDialogOpen(true);
                      }}>
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage User: {selectedUser?.email}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select 
                    value={userForm.role} 
                    onValueChange={(val: any) => setUserForm({...userForm, role: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Link Student (Required for Parents/Students)</Label>
                  <Select 
                    value={userForm.studentId} 
                    onValueChange={(val) => setUserForm({...userForm, studentId: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Student" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.class}-{s.section})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
            </motion.div>
          )}

          {activeTab === 'school-info' && (
            <motion.div
              key="school-info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <React.Suspense fallback={
                <div className="flex items-center justify-center p-20">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              }>
                <SchoolInfoSection />
              </React.Suspense>
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div
              key="students"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search students..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={exportToPDF}>
                <FileDown className="mr-2 h-4 w-4" /> Export
              </Button>
              <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingStudent(null);
                    setStudentForm({ 
                      name: '', dob: '', address: '', phone: '', class: '', section: '', email: '', 
                      photoURL: '', documents: [] 
                    });
                  }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveStudent} className="space-y-4 pt-4">
                    <div className="flex flex-col items-center gap-4 mb-4">
                      <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted border-2 border-primary/20">
                        {studentForm.photoURL ? (
                          <img src={studentForm.photoURL} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full">
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Label htmlFor="photo-upload" className="cursor-pointer">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80">
                            <Upload className="h-4 w-4" />
                            {studentForm.photoURL ? 'Change Photo' : 'Upload Photo'}
                          </div>
                          <input 
                            id="photo-upload" 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => handleFileUpload(e, 'photo')}
                            disabled={uploading}
                          />
                        </Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input id="name" className="col-span-3" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="dob" className="text-right">DOB</Label>
                      <Input id="dob" className="col-span-3" value={studentForm.dob} onChange={e => setStudentForm({...studentForm, dob: e.target.value})} placeholder="DDMMYYYY" required />
                    </div>
                    {!editingStudent && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" className="col-span-3" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} placeholder="For login account" />
                      </div>
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="class" className="text-right">Class</Label>
                      <Input id="class" className="col-span-3" value={studentForm.class} onChange={e => setStudentForm({...studentForm, class: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="section" className="text-right">Section</Label>
                      <Input id="section" className="col-span-3" value={studentForm.section} onChange={e => setStudentForm({...studentForm, section: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone" className="text-right">Phone</Label>
                      <Input id="phone" className="col-span-3" value={studentForm.phone} onChange={e => setStudentForm({...studentForm, phone: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="address" className="text-right">Address</Label>
                      <Input id="address" className="col-span-3" value={studentForm.address} onChange={e => setStudentForm({...studentForm, address: e.target.value})} />
                    </div>

                    <div className="space-y-2">
                      <Label>Documents</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {studentForm.documents.map((doc, idx) => (
                          <Badge key={idx} variant="secondary" className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80" onClick={() => {
                            setViewingDoc(doc);
                            setIsDocViewerOpen(true);
                          }}>
                            <File className="h-3 w-3" />
                            <span className="max-w-[100px] truncate">{doc.name}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStudentForm(prev => ({
                                  ...prev,
                                  documents: prev.documents.filter((_, i) => i !== idx)
                                }));
                              }}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <Label htmlFor="doc-upload" className="cursor-pointer block">
                        <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors">
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Upload Document (PDF/Image)</span>
                        </div>
                        <input 
                          id="doc-upload" 
                          type="file" 
                          className="hidden" 
                          accept=".pdf,image/*"
                          onChange={(e) => handleFileUpload(e, 'document')}
                          disabled={uploading}
                        />
                      </Label>
                    </div>

                    <DialogFooter>
                      <Button type="submit" disabled={uploading}>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Student Details</DialogTitle>
                  </DialogHeader>
                  {selectedStudent && (
                    <div className="space-y-8 pt-6">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-32 w-32 rounded-3xl premium-gradient p-1 shadow-2xl">
                          <div className="w-full h-full rounded-[20px] bg-card overflow-hidden">
                            {selectedStudent.photoURL ? (
                              <img src={selectedStudent.photoURL} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Users className="h-12 w-12 text-primary/20" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <h3 className="text-2xl font-black tracking-tight">{selectedStudent.name}</h3>
                          <Badge variant="outline" className="mt-2 font-bold uppercase tracking-wider text-[10px]">
                            {selectedStudent.class} - {selectedStudent.section}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 opacity-60">Contact Info</p>
                            <div className="space-y-2">
                              <p className="text-sm font-semibold flex items-center gap-2">
                                <span className="text-primary">Phone:</span> {selectedStudent.phone || 'N/A'}
                              </p>
                              <p className="text-sm font-semibold flex items-center gap-2">
                                <span className="text-primary">DOB:</span> {selectedStudent.dob || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 opacity-60">Address</p>
                            <p className="text-sm font-semibold leading-relaxed">
                              {selectedStudent.address || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 opacity-60">Documents</p>
                        {selectedStudent.documents && selectedStudent.documents.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedStudent.documents.map((doc, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between p-3 bg-accent/30 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer group"
                                onClick={() => {
                                  setViewingDoc(doc);
                                  setIsDocViewerOpen(true);
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-background rounded-lg shadow-sm">
                                    <File className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold truncate max-w-[150px]">{doc.name}</span>
                                    <span className="text-[8px] font-bold text-muted-foreground uppercase">{doc.type.split('/')[1] || 'DOC'}</span>
                                  </div>
                                </div>
                                <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic bg-accent/20 p-4 rounded-xl text-center">No documents uploaded.</p>
                        )}
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isDocViewerOpen} onOpenChange={setIsDocViewerOpen}>
                <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                  <DialogHeader className="p-6 border-b bg-background z-10 flex flex-row items-center justify-between">
                    <div>
                      <DialogTitle className="text-xl font-black tracking-tight">{viewingDoc?.name}</DialogTitle>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{viewingDoc?.type}</p>
                    </div>
                    <div className="flex items-center gap-2 pr-8">
                      <Button variant="outline" size="sm" className="font-bold uppercase tracking-wider text-[10px] gap-2" asChild>
                        <a href={viewingDoc?.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" /> External
                        </a>
                      </Button>
                      <Button size="sm" className="font-bold uppercase tracking-wider text-[10px] gap-2" asChild>
                        <a href={viewingDoc?.url} download={viewingDoc?.name}>
                          <Download className="h-3 w-3" /> Download
                        </a>
                      </Button>
                    </div>
                  </DialogHeader>
                  <div className="flex-1 bg-accent/20 relative overflow-hidden flex items-center justify-center p-4">
                    {viewingDoc ? (
                      viewingDoc.type.startsWith('image/') ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <img 
                            src={viewingDoc.url} 
                            alt={viewingDoc.name} 
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                          />
                        </div>
                      ) : viewingDoc.type === 'application/pdf' ? (
                        <iframe 
                          src={`${viewingDoc.url}#toolbar=0`} 
                          className="w-full h-full rounded-lg shadow-2xl" 
                          title="PDF Viewer"
                        />
                      ) : (
                        <div className="text-center space-y-6 max-w-md p-8 bg-background rounded-3xl shadow-xl">
                          <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                            <FileText className="h-10 w-10 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold mb-2">Preview Not Available</h4>
                            <p className="text-sm text-muted-foreground">This file type ({viewingDoc.type}) cannot be previewed directly. Please download the file to view it.</p>
                          </div>
                          <Button className="w-full font-bold uppercase tracking-wider text-xs py-6" asChild>
                            <a href={viewingDoc.url} download={viewingDoc.name}>
                              <Download className="h-4 w-4 mr-2" /> Download File
                            </a>
                          </Button>
                        </div>
                      )
                    ) : null}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const percentage = getStudentAttendancePercentage(student.id);
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                            {student.photoURL ? (
                              <img src={student.photoURL} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Users className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold">{student.name}</span>
                            {percentage < 75 && percentage > 0 && (
                              <Badge variant="destructive" className="h-4 px-1 text-[10px] w-fit">
                                <AlertCircle className="h-2.5 w-2.5 mr-1" /> Low Attendance
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>{student.section}</TableCell>
                      <TableCell>
                        <span className={`font-bold ${getAttendanceStatusColor(percentage)}`}>
                          {percentage}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setSelectedStudent(student);
                            setIsDetailsOpen(true);
                          }}>
                            <Eye className="h-4 w-4 text-slate-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditingStudent(student);
                            setStudentForm({
                              name: student.name,
                              dob: student.dob || '',
                              address: student.address,
                              phone: student.phone,
                              class: student.class,
                              section: student.section,
                              email: '',
                              photoURL: student.photoURL || '',
                              documents: student.documents || []
                            });
                            setIsStudentDialogOpen(true);
                          }}>
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteStudent(student.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No students found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
            </motion.div>
          )}

          {activeTab === 'attendance' && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Mark Attendance</CardTitle>
                  <CardDescription>Select date and class to mark attendance</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" onClick={handleExportMonthlyReport}>
                    <FileText className="mr-2 h-4 w-4" /> Monthly Report
                  </Button>
                  <Input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full sm:w-40"
                  />
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Classes</SelectItem>
                      {Array.from(new Set(students.map(s => s.class))).map(c => (
                        <SelectItem key={c} value={c}>Class {c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Mark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students
                    .filter(s => selectedClass === 'All' || s.class === selectedClass)
                    .map((student) => {
                      const record = attendance.find(a => a.studentId === student.id && a.dateString === selectedDate);
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.class}</TableCell>
                          <TableCell>
                            {record ? (
                              <Badge variant={record.status === 'Present' ? 'default' : 'destructive'}>
                                {record.status}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not Marked</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant={record?.status === 'Present' ? 'default' : 'outline'}
                                onClick={() => handleMarkAttendance(student.id, 'Present')}
                                disabled={attendanceLoading}
                              >
                                P
                              </Button>
                              <Button 
                                size="sm" 
                                variant={record?.status === 'Absent' ? 'destructive' : 'outline'}
                                onClick={() => handleMarkAttendance(student.id, 'Absent')}
                                disabled={attendanceLoading}
                              >
                                A
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
            </motion.div>
          )}

          {activeTab === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
          <Card className="premium-card">
            <CardHeader className="border-b border-border/50 pb-6">
              <CardTitle className="text-xl font-extrabold tracking-tight">Manage Results</CardTitle>
              <CardDescription className="text-xs font-medium">Upload and update student academic performance</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/50">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60">Student Name</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60">Class</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest opacity-60">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} className="group hover:bg-accent/30 transition-colors border-b border-border/50 last:border-0">
                      <TableCell className="font-extrabold text-sm group-hover:text-primary transition-colors">{student.name}</TableCell>
                      <TableCell className="text-sm font-medium text-muted-foreground">Class {student.class}</TableCell>
                      <TableCell>
                        {student.result ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] font-bold uppercase tracking-wider">Uploaded</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider opacity-60">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/5 rounded-xl" onClick={() => {
                          setSelectedStudentForResult(student);
                          setResultForm({
                            math: student.result?.math || '',
                            science: student.result?.science || '',
                            english: student.result?.english || '',
                            history: student.result?.history || '',
                            remarks: student.result?.remarks || ''
                          });
                          setIsResultDialogOpen(true);
                        }}>
                          Update Result
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl border-border/50 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black tracking-tight">Update Result</DialogTitle>
                <CardDescription className="font-medium">{selectedStudentForResult?.name}</CardDescription>
              </DialogHeader>
              <form onSubmit={handleSaveResult} className="space-y-6 pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="math" className="text-right text-xs font-bold uppercase tracking-wider opacity-60">Math</Label>
                    <Input id="math" type="number" className="col-span-3 rounded-xl border-border/50 focus:ring-primary/20" value={resultForm.math} onChange={e => setResultForm({...resultForm, math: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="science" className="text-right text-xs font-bold uppercase tracking-wider opacity-60">Science</Label>
                    <Input id="science" type="number" className="col-span-3 rounded-xl border-border/50 focus:ring-primary/20" value={resultForm.science} onChange={e => setResultForm({...resultForm, science: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="english" className="text-right text-xs font-bold uppercase tracking-wider opacity-60">English</Label>
                    <Input id="english" type="number" className="col-span-3 rounded-xl border-border/50 focus:ring-primary/20" value={resultForm.english} onChange={e => setResultForm({...resultForm, english: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="history" className="text-right text-xs font-bold uppercase tracking-wider opacity-60">History</Label>
                    <Input id="history" type="number" className="col-span-3 rounded-xl border-border/50 focus:ring-primary/20" value={resultForm.history} onChange={e => setResultForm({...resultForm, history: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="remarks" className="text-right text-xs font-bold uppercase tracking-wider opacity-60">Remarks</Label>
                    <Input id="remarks" className="col-span-3 rounded-xl border-border/50 focus:ring-primary/20" value={resultForm.remarks} onChange={e => setResultForm({...resultForm, remarks: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="premium-button w-full rounded-xl py-6 font-black uppercase tracking-widest text-xs">Save Result</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="premium-card">
              <CardHeader className="border-b border-border/50 pb-6">
                <CardTitle className="text-xl font-extrabold tracking-tight">Class Distribution</CardTitle>
                <CardDescription className="text-xs font-medium">Number of students per class</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] pt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {classDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 premium-card">
              <CardHeader className="border-b border-border/50 pb-6">
                <CardTitle className="text-xl font-extrabold tracking-tight">Attendance Trend</CardTitle>
                <CardDescription className="text-xs font-medium">Average attendance percentage over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] pt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <YAxis unit="%" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Line 
                      type="monotone" 
                      dataKey="percentage" 
                      stroke="oklch(0.55 0.18 250)" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: 'oklch(0.55 0.18 250)', strokeWidth: 2, stroke: '#fff' }} 
                      activeDot={{ r: 8, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 premium-card">
              <CardHeader className="border-b border-border/50 pb-6">
                <CardTitle className="text-xl font-extrabold tracking-tight">Subject Performance</CardTitle>
                <CardDescription className="text-xs font-medium">Average scores across different subjects</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] pt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="average" fill="oklch(0.55 0.18 250)" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
}
