import * as React from 'react';
import { motion } from 'motion/react';
import { 
  Info, 
  Target, 
  Eye, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  BookOpen, 
  FlaskConical, 
  Gamepad2, 
  MessageSquare,
  Send,
  User,
  School
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SchoolInfoSection() {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent successfully! We will get back to you soon.");
    setFormData({ name: '', email: '', message: '' });
  };

  const faculty = [
    { name: "Aarav Kumar", role: "Director", subject: "Administration", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav" },
    { name: "Mrs. Priya Singh", role: "Senior Teacher", subject: "Mathematics", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya" },
    { name: "Mr. Rajesh Sharma", role: "Senior Teacher", subject: "Science", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh" },
    { name: "Ms. Anjali Verma", role: "Teacher", subject: "English", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali" },
  ];

  const facilities = [
    { name: "Smart Classrooms", icon: School, desc: "Equipped with modern digital learning tools." },
    { name: "Digital Library", icon: BookOpen, desc: "Over 10,000 books and digital resources." },
    { name: "Science & Computer Labs", icon: FlaskConical, desc: "State-of-the-art laboratories for practical learning." },
    { name: "Sports Complex", icon: Gamepad2, desc: "Large playground and indoor sports facilities." },
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <section className="relative h-[400px] rounded-3xl overflow-hidden shadow-2xl">
        <img 
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=2070" 
          alt="School Campus" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">St. Xavier's International School</h2>
            <p className="text-xl text-white/80 max-w-2xl">Nurturing minds, building character, and inspiring excellence since 1995.</p>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 premium-card">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>About Our School</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              St. Xavier's International School, located in the historic city of Gaya, Bihar, is a premier educational institution dedicated to providing holistic education. We believe in empowering students with knowledge, skills, and values necessary to excel in a rapidly changing world.
            </p>
            <p>
              Under the visionary leadership of our Director, <strong>Aarav Kumar</strong>, the school has consistently achieved academic excellence while fostering a culture of innovation and creativity.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="p-6 bg-accent/30 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="h-5 w-5 text-primary" />
                  <h4 className="font-bold text-foreground">Our Mission</h4>
                </div>
                <p className="text-sm">To provide a stimulating learning environment that encourages every student to reach their full potential.</p>
              </div>
              <div className="p-6 bg-accent/30 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <Eye className="h-5 w-5 text-primary" />
                  <h4 className="font-bold text-foreground">Our Vision</h4>
                </div>
                <p className="text-sm">To be a global leader in education, shaping future leaders who are compassionate and innovative.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle>School Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Address</p>
                <p className="text-sm font-medium">Gaya, Bihar, India - 823001</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Contact Number</p>
                <p className="text-sm font-medium">+91 98765 43210</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Email Address</p>
                <p className="text-sm font-medium">info@stxaviersgaya.edu.in</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Director</p>
                <p className="text-sm font-medium">Aarav Kumar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Faculty Section */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-3xl font-bold tracking-tight">Our Distinguished Faculty</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {faculty.map((member, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="premium-card text-center overflow-hidden group">
                <div className="h-32 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                <CardContent className="-mt-16 pb-8">
                  <div className="relative inline-block mb-4">
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="h-24 w-24 rounded-2xl border-4 border-background shadow-xl"
                    />
                  </div>
                  <h4 className="font-bold text-lg">{member.name}</h4>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.subject}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Infrastructure Section */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg">
            <School className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-3xl font-bold tracking-tight">World-Class Facilities</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {facilities.map((facility, idx) => (
            <Card key={idx} className="premium-card hover:translate-y-[-4px] transition-transform">
              <CardContent className="p-6">
                <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                  <facility.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-bold mb-2">{facility.name}</h4>
                <p className="text-sm text-muted-foreground">{facility.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Map & Contact Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="premium-card overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle>Find Us</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[400px]">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d115681.29592731265!2d84.9313921!3d24.7913957!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f32a4406e1f74f%3A0x5104c2c3c50ae01!2sGaya%2C%20Bihar!5e0!3m2!1sen!2sin!4v1712999999999!5m2!1sen!2sin" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>Contact Us</CardTitle>
            </div>
            <CardDescription>Have questions? Send us a message and we'll respond shortly.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@example.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea 
                  id="message" 
                  placeholder="How can we help you?" 
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  required 
                />
              </div>
              <Button type="submit" className="w-full premium-button gap-2">
                Send Message
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
