import * as React from 'react';
import { useState, useEffect, lazy, Suspense } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  where, 
  doc, 
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Student, AttendanceRecord, Notice } from '../types';
import DashboardLayout from '../components/DashboardLayout';
const SchoolInfoSection = lazy(() => import('../components/SchoolInfoSection'));
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  User, 
  Phone, 
  MapPin, 
  School, 
  CheckCircle2, 
  XCircle,
  Award,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Info,
  Bell,
  ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { calculateAttendancePercentage, getAttendanceStatusColor, getAttendanceStatusBg } from '../lib/attendance-utils';
import { motion, AnimatePresence } from 'motion/react';

export default function StudentDashboard({ profile }: { profile: UserProfile }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('date', 'desc'), limit(10));
    const unsubNotices = onSnapshot(q, (snapshot) => {
      const noticesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
      setNotices(noticesData);
    });
    return () => unsubNotices();
  }, []);

  useEffect(() => {
    if (!profile.studentId) {
      // Try to find student by userId
      const findStudent = async () => {
        const q = query(collection(db, 'students'), where('userId', '==', profile.uid));
        const snap = await getDoc(doc(db, 'users', profile.uid)); // Refresh profile
        
        // In a real app, we'd have the studentId linked. 
        // For this demo, we'll search by userId if not in profile.
        const q2 = query(collection(db, 'students'), where('userId', '==', profile.uid));
        const querySnapshot = await onSnapshot(q2, (snapshot) => {
          if (!snapshot.empty) {
            setStudent({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Student);
          } else {
            // Fallback: search by email if name matches (simplified for demo)
            // In production, the admin would link the userId to the studentId
          }
        });
        return querySnapshot;
      };
      findStudent();
    } else {
      const unsubStudent = onSnapshot(doc(db, 'students', profile.studentId), (doc) => {
        if (doc.exists()) {
          setStudent({ id: doc.id, ...doc.data() } as Student);
        }
      });
      return () => unsubStudent();
    }
  }, [profile]);

  useEffect(() => {
    if (student) {
      const q = query(collection(db, 'attendance'), where('studentId', '==', student.id));
      const unsubAttendance = onSnapshot(q, (snapshot) => {
        const attendanceData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
        setAttendance(attendanceData);
        setLoading(false);
      });
      return () => unsubAttendance();
    }
  }, [student]);

  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return 0;
    const present = attendance.filter(a => a.status === 'Present').length;
    return Math.round((present / attendance.length) * 100);
  };

  if (!student && !loading) {
    return (
      <DashboardLayout profile={profile} activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="p-4 bg-amber-50 rounded-full">
            <User className="h-12 w-12 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Profile Not Linked</h2>
          <p className="text-slate-500 max-w-md">
            Your user account is not yet linked to a student record. Please contact the school administrator to link your profile.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const attendancePercentage = calculateAttendancePercentage();

  return (
    <DashboardLayout profile={profile} activeTab={activeTab} setActiveTab={setActiveTab}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
          {attendancePercentage < 75 && attendancePercentage > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 flex items-start gap-4 animate-pulse">
              <div className="p-3 bg-destructive/20 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
              </div>
              <div>
                <h4 className="text-destructive font-black uppercase tracking-wider text-sm">Low Attendance Alert!</h4>
                <p className="text-destructive/80 text-sm font-medium mt-1">Your attendance is currently {attendancePercentage}%, which is below the required 75%. Please ensure you attend classes regularly.</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className={cn("premium-card overflow-hidden group", attendancePercentage < 75 && attendancePercentage > 0 ? "border-destructive/20" : "")}>
              <CardContent className="p-0">
                <div className="p-8 flex items-center justify-between relative">
                  <div className="z-10">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 opacity-70">Attendance</p>
                    <h3 className={cn("text-3xl font-bold tracking-tight", getAttendanceStatusColor(attendancePercentage))}>{attendancePercentage}%</h3>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-70">
                      <ClipboardList className="h-3 w-3" />
                      <span>Academic Standing</span>
                    </div>
                  </div>
                  <div className={cn("p-4 rounded-xl transition-all duration-300", getAttendanceStatusBg(attendancePercentage))}>
                    <ClipboardList className={cn("h-7 w-7", getAttendanceStatusColor(attendancePercentage))} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card overflow-hidden group">
              <CardContent className="p-0">
                <div className="p-8 flex items-center justify-between relative">
                  <div className="z-10">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 opacity-70">Current Class</p>
                    <h3 className="text-3xl font-bold tracking-tight text-foreground">{student?.class}</h3>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase tracking-wider">
                      <School className="h-3 w-3" />
                      <span>Enrolled</span>
                    </div>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-xl transition-all duration-300">
                    <School className="h-7 w-7 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card overflow-hidden group">
              <CardContent className="p-0">
                <div className="p-8 flex items-center justify-between relative">
                  <div className="z-10">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 opacity-70">Section</p>
                    <h3 className="text-3xl font-bold tracking-tight text-foreground">{student?.section}</h3>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                      <Award className="h-3 w-3" />
                      <span>Assigned</span>
                    </div>
                  </div>
                  <div className="p-4 bg-amber-500/10 rounded-xl transition-all duration-300">
                    <Award className="h-7 w-7 text-amber-600" />
                  </div>
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
                <CardTitle className="text-xl font-extrabold tracking-tight">Recent Attendance</CardTitle>
                <CardDescription className="text-xs font-medium">Your last 5 attendance records</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {attendance.slice(-5).reverse().map(record => (
                    <div key={record.id} className="flex items-center justify-between p-4 bg-accent/30 hover:bg-accent/50 rounded-2xl border border-border/50 transition-all duration-300 group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-extrabold text-foreground">{format(record.date.toDate(), 'PPP')}</span>
                      </div>
                      <Badge className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        record.status === 'Present' ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                      )} variant="outline">
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                  {attendance.length === 0 && (
                    <div className="text-center py-10 space-y-2">
                      <Calendar className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                      <p className="text-sm font-bold text-muted-foreground/50">No attendance records found.</p>
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
          <div className="grid grid-cols-1 gap-4">
            {notices.map((notice) => (
              <Card key={notice.id} className={notice.isImportant ? "border-destructive/50 shadow-sm" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {notice.isImportant && <Badge variant="destructive">Important</Badge>}
                      {notice.title}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {notice.date?.toDate ? format(notice.date.toDate(), 'MMM dd, yyyy HH:mm') : ''}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notice.content}</p>
                </CardContent>
              </Card>
            ))}
            {notices.length === 0 && (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">No notices have been posted yet.</p>
              </div>
            )}
          </div>
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
              <Suspense fallback={
                <div className="flex items-center justify-center p-20">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                <SchoolInfoSection />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto space-y-8"
            >
          <Card className="premium-card overflow-hidden">
            <CardHeader className="text-center border-b border-border/50 pb-10 pt-10 relative">
              <div className="absolute top-0 left-0 w-full h-24 premium-gradient opacity-10" />
              <div className="mx-auto h-28 w-28 rounded-3xl premium-gradient p-1 shadow-2xl relative z-10">
                <div className="w-full h-full rounded-[20px] bg-card flex items-center justify-center">
                  <User className="h-12 w-12 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter mt-6">{student?.name}</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">Student ID: {student?.id}</CardDescription>
            </CardHeader>
            <CardContent className="pt-10 pb-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 group">
                    <div className="p-3 bg-accent/50 rounded-2xl border border-border/50 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-300">
                      <School className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Class & Section</p>
                      <p className="text-foreground font-extrabold">Class {student?.class} • Section {student?.section}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <div className="p-3 bg-accent/50 rounded-2xl border border-border/50 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-300">
                      <Phone className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Phone Number</p>
                      <p className="text-foreground font-extrabold">{student?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start gap-4 group">
                    <div className="p-3 bg-accent/50 rounded-2xl border border-border/50 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-300">
                      <Calendar className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Date of Birth</p>
                      <p className="text-foreground font-extrabold">{student?.dob || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group">
                    <div className="p-3 bg-accent/50 rounded-2xl border border-border/50 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-300">
                      <MapPin className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Address</p>
                      <p className="text-foreground font-extrabold">{student?.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-border/50">
                <div className="flex items-center justify-between p-6 bg-accent/30 rounded-3xl border border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Attendance Status</p>
                      <p className="text-lg font-black tracking-tight">{attendancePercentage}% Overall</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    attendancePercentage >= 75 ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                  )} variant="outline">
                    {attendancePercentage >= 75 ? 'Excellent' : 'Needs Improvement'}
                  </Badge>
                </div>
              </div>
            </CardContent>
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
              className="space-y-8"
            >
          <CardHeader className="border-b border-border/50 pb-6">
            <CardTitle className="text-2xl font-black tracking-tight">Attendance History</CardTitle>
            <CardDescription className="text-sm font-medium">Complete record of your academic presence</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/50">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60">Date</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.slice().reverse().map((record) => (
                  <TableRow key={record.id} className="group hover:bg-accent/30 transition-colors border-b border-border/50 last:border-0">
                    <TableCell className="py-4 font-extrabold text-sm group-hover:text-primary transition-colors">{format(record.date.toDate(), 'PPPP')}</TableCell>
                    <TableCell className="py-4">
                      <Badge className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        record.status === 'Present' ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                      )} variant="outline">
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-muted-foreground text-xs font-medium">-</TableCell>
                  </TableRow>
                ))}
                {attendance.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-20">
                      <div className="space-y-3">
                        <Calendar className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                        <p className="text-sm font-bold text-muted-foreground/50">No attendance records found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
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
              <CardTitle className="text-2xl font-black tracking-tight">Academic Results</CardTitle>
              <CardDescription className="text-sm font-medium">Detailed breakdown of your performance</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              {student?.result ? (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(student.result).filter(([key]) => key !== 'remarks').map(([subject, score]) => (
                      <div key={subject} className="p-8 bg-accent/30 rounded-[32px] border border-border/50 flex flex-col items-center justify-center space-y-3 group hover:bg-primary/5 hover:border-primary/20 transition-all duration-500">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] group-hover:text-primary transition-colors">{subject}</p>
                        <p className="text-5xl font-black tracking-tighter text-foreground group-hover:scale-110 transition-transform duration-500">{score}</p>
                        <div className="h-1 w-12 bg-primary/20 rounded-full group-hover:w-20 transition-all duration-500" />
                        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Out of 100</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-8 bg-primary/5 rounded-[32px] border border-primary/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
                      <Award className="h-24 w-24 text-primary" />
                    </div>
                    <h4 className="font-black text-foreground mb-4 flex items-center gap-3 uppercase tracking-wider text-sm">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Award className="h-4 w-4 text-primary" />
                      </div>
                      Teacher's Remarks
                    </h4>
                    <p className="text-muted-foreground italic leading-relaxed font-medium relative z-10">
                      "{student.result.remarks || 'No remarks provided for this assessment.'}"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="p-6 bg-accent/50 rounded-full">
                    <Award className="h-16 w-16 text-muted-foreground/20" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black tracking-tight">Results Not Available</h3>
                    <p className="text-sm font-medium text-muted-foreground max-w-xs">Your academic results have not been uploaded yet. Please check back later.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
}
