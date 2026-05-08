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
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  FileText, 
  Bell,
  TrendingUp,
  School,
  Award,
  AlertTriangle,
  Info,
  ClipboardList
} from 'lucide-react';
import { calculateAttendancePercentage, getAttendanceStatusColor, getAttendanceStatusBg } from '../lib/attendance-utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function ParentDashboard({ profile }: { profile: UserProfile }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile.studentId) {
      setLoading(false);
      return;
    }

    // Fetch Student Data
    const unsubStudent = onSnapshot(doc(db, 'students', profile.studentId), (docSnap) => {
      if (docSnap.exists()) {
        setStudent({ id: docSnap.id, ...docSnap.data() } as Student);
      }
      setLoading(false);
    });

    // Fetch Attendance
    const qAttendance = query(
      collection(db, 'attendance'),
      where('studentId', '==', profile.studentId)
    );
    const unsubAttendance = onSnapshot(qAttendance, (snapshot) => {
      const attendanceData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      setAttendance(attendanceData);
    });

    // Fetch Notices
    const qNotices = query(collection(db, 'notices'), orderBy('date', 'desc'), limit(10));
    const unsubNotices = onSnapshot(qNotices, (snapshot) => {
      const noticesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
      setNotices(noticesData);
    });

    return () => {
      unsubStudent();
      unsubAttendance();
      unsubNotices();
    };
  }, [profile.studentId]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile.studentId) {
    return (
      <DashboardLayout profile={profile} activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <div className="p-4 bg-amber-100 rounded-full">
            <AlertTriangle className="h-12 w-12 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold">No Student Linked</h2>
          <p className="text-muted-foreground max-w-md">
            Your parent account is not yet linked to a student. Please contact the school administrator with your child's Student ID.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const attendancePercentage = calculateAttendancePercentage(attendance);

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
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-2xl font-black tracking-tight text-foreground">Child's Overview</h2>
              <p className="text-sm font-medium text-muted-foreground">{student?.name} • Student Portal</p>
            </div>
          </div>

          {attendancePercentage < 75 && attendancePercentage > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 flex items-start gap-4 animate-pulse">
              <div className="p-3 bg-destructive/20 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
              </div>
              <div>
                <h4 className="text-destructive font-black uppercase tracking-wider text-sm">Low Attendance Alert!</h4>
                <p className="text-destructive/80 text-sm font-medium mt-1">Your child's attendance is currently {attendancePercentage}%, which is below the required 75%.</p>
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
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 opacity-70">Class & Section</p>
                    <h3 className="text-3xl font-bold tracking-tight text-foreground">{student?.class}-{student?.section}</h3>
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
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 opacity-70">Latest Result</p>
                    <h3 className="text-3xl font-bold tracking-tight text-foreground">View</h3>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                      <Award className="h-3 w-3" />
                      <span>Academic Performance</span>
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
                  <CardTitle className="text-xl font-extrabold tracking-tight">School Notices</CardTitle>
                  <CardDescription className="text-xs font-medium">Latest school announcements</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/5" onClick={() => setActiveTab('notices')}>View All</Button>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {notices.length > 0 ? (
                  notices.slice(0, 3).map((notice) => (
                    <div key={notice.id} className="p-4 bg-accent/30 hover:bg-accent/50 rounded-2xl border border-border/50 transition-all duration-300 group cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-extrabold truncate flex items-center gap-2 group-hover:text-primary transition-colors">
                          {notice.isImportant && <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full animate-pulse" />}
                          {notice.title}
                        </h4>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">
                          {notice.date?.toDate ? format(notice.date.toDate(), 'MMM dd, yyyy') : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 font-medium">{notice.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 space-y-2">
                    <Bell className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                    <p className="text-sm font-bold text-muted-foreground/50">No recent notices.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardHeader className="border-b border-border/50 pb-6">
                <CardTitle className="text-xl font-extrabold tracking-tight">Recent Attendance</CardTitle>
                <CardDescription className="text-xs font-medium">Last 5 days of attendance</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60">Date</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest opacity-60">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.slice(0, 5).map((record) => (
                      <TableRow key={record.id} className="group hover:bg-accent/30 transition-colors border-b border-border/50 last:border-0">
                        <TableCell className="font-extrabold text-sm group-hover:text-primary transition-colors">
                          {record.date?.toDate ? format(record.date.toDate(), 'MMM dd, yyyy') : ''}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={cn(
                            "text-[10px] font-bold uppercase tracking-widest",
                            record.status === 'Present' ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                          )} variant="outline">
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
            <CardDescription className="text-sm font-medium">Full attendance record for {student?.name}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/50">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest opacity-60">Date</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest opacity-60">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record.id} className="group hover:bg-accent/30 transition-colors border-b border-border/50 last:border-0">
                    <TableCell className="py-4 font-extrabold text-sm group-hover:text-primary transition-colors">
                      {record.date?.toDate ? format(record.date.toDate(), 'MMM dd, yyyy') : ''}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <Badge className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        record.status === 'Present' ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                      )} variant="outline">
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {attendance.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-20">
                      <div className="space-y-3">
                        <CalendarCheck className="h-12 w-12 text-muted-foreground/20 mx-auto" />
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
              <CardDescription className="text-sm font-medium">Current semester performance for {student?.name}</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              {student?.result ? (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {Object.entries(student.result).map(([subject, score]) => (
                      subject !== 'remarks' && (
                        <div key={subject} className="p-8 bg-accent/30 rounded-[32px] border border-border/50 flex flex-col items-center justify-center space-y-3 group hover:bg-primary/5 hover:border-primary/20 transition-all duration-500">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] group-hover:text-primary transition-colors">{subject}</p>
                          <p className="text-5xl font-black tracking-tighter text-foreground group-hover:scale-110 transition-transform duration-500">{score}</p>
                          <div className="h-1 w-12 bg-primary/20 rounded-full group-hover:w-20 transition-all duration-500" />
                          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Out of 100</p>
                        </div>
                      )
                    ))}
                  </div>
                  
                  {student?.result?.remarks && (
                    <div className="p-8 bg-primary/5 rounded-[32px] border border-primary/10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
                        <Award className="h-24 w-24 text-primary" />
                      </div>
                      <h4 className="font-black text-foreground mb-4 flex items-center gap-3 uppercase tracking-wider text-sm">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <Info className="h-4 w-4 text-primary" />
                        </div>
                        Teacher's Remarks
                      </h4>
                      <p className="text-muted-foreground italic leading-relaxed font-medium relative z-10">
                        "{student.result.remarks}"
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="p-6 bg-accent/50 rounded-full">
                    <FileText className="h-16 w-16 text-muted-foreground/20" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black tracking-tight">Results Not Available</h3>
                    <p className="text-sm font-medium text-muted-foreground max-w-xs">Academic results have not been published yet.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
          <div className="grid grid-cols-1 gap-6">
            {notices.map((notice) => (
              <Card key={notice.id} className={cn("premium-card overflow-hidden", notice.isImportant ? "border-destructive/20 shadow-destructive/5" : "")}>
                <CardHeader className="pb-4 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-extrabold tracking-tight flex items-center gap-3">
                      {notice.isImportant && <Badge variant="destructive" className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">Important</Badge>}
                      {notice.title}
                    </CardTitle>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                      {notice.date?.toDate ? format(notice.date.toDate(), 'MMM dd, yyyy HH:mm') : ''}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed font-medium">{notice.content}</p>
                </CardContent>
              </Card>
            ))}
            {notices.length === 0 && (
              <div className="text-center py-20 space-y-4">
                <div className="p-6 bg-accent/50 rounded-full w-fit mx-auto">
                  <Bell className="h-12 w-12 text-muted-foreground/20" />
                </div>
                <p className="text-sm font-bold text-muted-foreground/50">No notices have been posted yet.</p>
              </div>
            )}
          </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
}
