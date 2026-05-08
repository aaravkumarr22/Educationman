import * as React from 'react';
import { useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { GraduationCap, LogIn, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Default to student role for new users, unless it's the default admin
        const isAdminEmail = (user.email === "aaravkumarr22@gmail.com" || user.email === "aaravkumar6428@gmail.com");
        const role = isAdminEmail ? "admin" : "student";
        
        await setDoc(userRef, {
          email: user.email,
          role: role,
          createdAt: new Date().toISOString()
        });
        
        if (isAdminEmail) {
          toast.success("Logged in as Admin");
        } else {
          toast.info("Account created as Student. If you are a parent, please contact the administrator to update your role.");
        }
      } else {
        toast.success("Logged in successfully");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Password reset email sent! Please check your inbox.");
      setIsResetOpen(false);
      setResetEmail('');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    let loginEmail = email;
    let loginPassword = password;

    // If it's a student login (using DOB as email and password)
    // We assume the student enters their DOB in the email field
    // and we append a dummy domain for Firebase Auth
    if (!email.includes('@')) {
      loginEmail = `${email}@school.com`;
      loginPassword = email; // Password is also DOB as per request
    }

    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast.success("Logged in successfully");
    } catch (error: any) {
      console.error(error);
      toast.error("Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-outfit bg-background">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <Card className="w-full max-w-md premium-card border-none z-10 relative overflow-hidden animate-in fade-in zoom-in duration-700">
        <CardHeader className="space-y-4 text-center pt-12 pb-8">
          <div className="flex justify-center mb-2">
            <div className="p-5 bg-primary rounded-2xl shadow-md group">
              <GraduationCap className="h-12 w-12 text-white group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground uppercase">St. Xavier's</CardTitle>
            <CardDescription className="text-muted-foreground text-sm font-semibold uppercase tracking-wider opacity-70">
              School Management System
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8 px-10 pb-12">
          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email Address</Label>
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors z-10" />
                <Input 
                  id="email" 
                  placeholder="name@school.com" 
                  className="pl-12 h-14 text-base border-border/50 focus:border-primary focus:ring-primary/10 rounded-2xl transition-all bg-accent/30 relative z-0 font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Password</Label>
                <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Forgot?</button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px] rounded-3xl premium-card border-none">
                    <DialogHeader className="pt-6 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="p-4 bg-primary/10 rounded-2xl">
                          <Mail className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      <DialogTitle className="text-2xl font-bold uppercase tracking-tight">Reset Password</DialogTitle>
                      <DialogDescription className="text-muted-foreground font-medium text-xs uppercase tracking-wider mt-2">
                        Enter your email address and we'll send you a link to reset your password.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-6 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email Address</Label>
                        <Input 
                          id="reset-email" 
                          type="email" 
                          placeholder="name@school.com" 
                          className="h-12 border-border/50 focus:border-primary focus:ring-primary/10 rounded-2xl bg-accent/30 font-medium"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                        />
                      </div>
                      <DialogFooter className="pb-6">
                        <Button type="submit" className="premium-button w-full h-12 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2" disabled={loading}>
                          {loading ? "Sending..." : "Send Reset Link"}
                          {!loading && <Send className="h-4 w-4" />}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  className="h-14 text-base border-border/50 focus:border-primary focus:ring-primary/10 rounded-2xl transition-all bg-accent/30 relative z-0 font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <Button type="submit" className="premium-button w-full h-14 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 mt-4 group" disabled={loading}>
              <span className="flex items-center gap-2">
                {loading ? "Authenticating..." : "Sign In"}
                {!loading && <LogIn className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </span>
            </Button>
          </form>
          
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em]">
              <span className="bg-card px-6 text-muted-foreground/40">Or Connect With</span>
            </div>
          </div>
          
          <Button variant="outline" type="button" className="w-full h-14 text-xs font-black uppercase tracking-widest border-border/50 hover:bg-accent/50 rounded-2xl transition-all flex items-center justify-center gap-3 group" onClick={handleGoogleLogin} disabled={loading}>
            <svg className="h-5 w-5 group-hover:scale-110 transition-transform" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Google Account
          </Button>
        </CardContent>
        
        <div className="p-6 bg-accent/20 border-t border-border/50 text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Protected by Enterprise Security
          </p>
        </div>
      </Card>
    </div>
  );
}
