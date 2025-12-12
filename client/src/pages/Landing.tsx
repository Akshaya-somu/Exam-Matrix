import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";
import { Link, useLocation } from "wouter";
import heroImage from "@assets/generated_images/hero_image_of_ai_proctoring_interface.png";
import logoImage from "@assets/generated_images/minimalist_tech_logo_for_exam_matrix.png";

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <nav className="relative z-10 container mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="Exam Matrix Logo" className="w-10 h-10 object-contain" />
          <span className="font-heading font-bold text-2xl tracking-tight">Exam Matrix</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/about">About</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/contact">Contact</Link>
          </Button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center py-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <ShieldCheck className="w-4 h-4" />
              <span>AI-Powered Security 2.0</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-heading font-bold tracking-tight leading-[1.1]">
              Secure Exams. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Zero Compromise.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              The advanced proctoring platform that ensures integrity with 360° environment scanning and real-time behavioral analysis.
            </p>
          </div>

          <form onSubmit={handleLogin} className="max-w-md space-y-4 p-6 rounded-2xl border border-border bg-white/50 backdrop-blur-sm shadow-xl dark:bg-black/50">
            <div className="space-y-2">
              <label className="text-sm font-medium">Institution ID</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 bg-background/50" placeholder="Enter ID" defaultValue="MIT-2024-X" />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full text-base">
              Access Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              By logging in, you agree to our privacy policy and surveillance terms.
            </p>
          </form>

          <div className="flex items-center gap-8 pt-4 grayscale opacity-60">
            {/* Mock Partner Logos */}
            <div className="font-heading font-bold text-xl">Harvard</div>
            <div className="font-heading font-bold text-xl">Stanford</div>
            <div className="font-heading font-bold text-xl">MIT</div>
            <div className="font-heading font-bold text-xl">Yale</div>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-card aspect-[4/3] group">
            <img 
              src={heroImage} 
              alt="Dashboard Preview" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            
            {/* Overlay UI Mockup */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
              <div className="w-full p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50">
                    <ShieldCheck className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold">System Secure</h3>
                    <p className="text-sm text-white/80">AI monitoring active. No threats detected.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary rounded-full blur-2xl opacity-20" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-secondary rounded-full blur-2xl opacity-20" />
        </div>
      </main>
    </div>
  );
}
