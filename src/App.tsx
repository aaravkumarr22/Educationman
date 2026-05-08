/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';
import { Toaster } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from './components/ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';

const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));

const LoadingFallback = () => (
  <div className="h-screen w-full flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide uppercase">Preparing your dashboard...</p>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile({ uid: firebaseUser.uid, ...docSnap.data() } as UserProfile);
          } else {
            // Check if it's the default admin
            if (firebaseUser.email === "aaravkumarr22@gmail.com" || firebaseUser.email === "aaravkumar6428@gmail.com") {
              setProfile({ uid: firebaseUser.uid, email: firebaseUser.email!, role: 'admin' });
            } else {
              setProfile(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </motion.div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="school-app-theme">
      <Router>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
          <Suspense fallback={<LoadingFallback />}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route 
                  path="/login" 
                  element={
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                    >
                      {user ? <Navigate to="/" replace /> : <Login />}
                    </motion.div>
                  } 
                />
                
                <Route 
                  path="/" 
                  element={
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      {!user ? <Navigate to="/login" replace /> : 
                      profile?.role === 'admin' ? <AdminDashboard profile={profile} /> :
                      profile?.role === 'student' ? <StudentDashboard profile={profile} /> :
                      profile?.role === 'parent' ? <ParentDashboard profile={profile} /> :
                      <div className="p-8 text-center">
                        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                        <p className="mt-2">Your account does not have a role assigned. Please contact the administrator.</p>
                        <button 
                          onClick={() => auth.signOut()}
                          className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
                        >
                          Sign Out
                        </button>
                      </div>}
                    </motion.div>
                  } 
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
          <Toaster position="top-right" />
        </div>
      </Router>
    </ThemeProvider>
  );
}

