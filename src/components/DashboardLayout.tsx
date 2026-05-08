import { ReactNode, useState } from 'react';
import { auth } from '../firebase';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  BookOpen, 
  LogOut, 
  Menu, 
  X,
  GraduationCap,
  UserCircle,
  Moon,
  Sun,
  Bell,
  BarChart3,
  School,
  ClipboardList,
  Award,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserProfile } from '../types';
import { ModeToggle } from './ModeToggle';
import { Badge } from '@/components/ui/badge';

interface DashboardLayoutProps {
  children: ReactNode;
  profile: UserProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function DashboardLayout({ children, profile, activeTab, setActiveTab }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const adminNavItems = [
    { id: 'overview', label: 'Overview', icon: School },
    { id: 'school-info', label: 'School Info', icon: Info },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: ClipboardList },
    { id: 'results', label: 'Results', icon: Award },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'notices', label: 'Notices', icon: Bell },
    { id: 'users', label: 'Users', icon: UserCircle },
  ];

  const studentNavItems = [
    { id: 'overview', label: 'My Dashboard', icon: School },
    { id: 'school-info', label: 'School Info', icon: Info },
    { id: 'profile', label: 'My Profile', icon: UserCircle },
    { id: 'attendance', label: 'Attendance', icon: ClipboardList },
    { id: 'results', label: 'Results', icon: Award },
    { id: 'notices', label: 'Notices', icon: Bell },
  ];

  const parentNavItems = [
    { id: 'overview', label: 'Dashboard', icon: School },
    { id: 'school-info', label: 'School Info', icon: Info },
    { id: 'attendance', label: 'Child Attendance', icon: ClipboardList },
    { id: 'results', label: 'Child Results', icon: Award },
    { id: 'notices', label: 'School Notices', icon: Bell },
  ];

  const navItems = profile.role === 'admin' 
    ? adminNavItems 
    : profile.role === 'parent' 
      ? parentNavItems 
      : studentNavItems;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          x: isSidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -256 : 0)
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card/80 backdrop-blur-xl border-r shadow-2xl lg:relative lg:translate-x-0 lg:shadow-none"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary rounded-xl shadow-sm">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-foreground leading-none">St. Xavier's</span>
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mt-1">School Management</span>
              </div>
            </div>
            <button 
              className="lg:hidden p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
            {navItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 group",
                  activeTab === item.id 
                    ? "premium-button" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                  activeTab === item.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                )} />
                {item.label}
              </motion.button>
            ))}
          </nav>

          <div className="p-4 border-t border-border/50 space-y-4">
            <div className="bg-accent/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-70">Logged in as</p>
              <p className="text-sm font-bold truncate text-foreground">{profile.email}</p>
              <div className="mt-2">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-background/50 border-primary/20 text-primary">
                  {profile.role}
                </Badge>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all font-semibold"
              onClick={() => auth.signOut()}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-card/50 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-6 lg:px-10 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="p-2.5 lg:hidden text-muted-foreground hover:bg-accent rounded-xl transition-all"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold lg:text-2xl tracking-tight text-foreground">
                  {navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
                </h1>
                <div className="hidden sm:block h-4 w-px bg-border/50 mx-2" />
                <span className="hidden sm:block text-xs font-bold text-primary uppercase tracking-widest">St. Xavier's International</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium hidden sm:block">Excellence in Education • School Management Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-8">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-full border border-border/50">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">System Online</span>
            </div>

            <div className="flex items-center gap-3">
              <ModeToggle />
              
              <div className="h-10 w-px bg-border/50 mx-2 hidden sm:block" />

              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-extrabold leading-none mb-1 text-foreground">{profile.email.split('@')[0]}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-70">{profile.role}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm cursor-pointer">
                  {profile.email[0].toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-background/30">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
