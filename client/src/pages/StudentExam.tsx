import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Wifi, 
  Smartphone, 
  Video, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function StudentExam() {
  const [, setLocation] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3599); // 1 hour in seconds
  const [showWarning, setShowWarning] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Mock Questions
  const questions = [
    {
      id: 1,
      text: "Which of the following best describes the time complexity of a Binary Search algorithm?",
      options: [
        "O(n)",
        "O(n log n)",
        "O(log n)",
        "O(1)"
      ]
    },
    {
      id: 2,
      text: "What is the primary function of a mutex in concurrent programming?",
      options: [
        "To speed up thread execution",
        "To prevent race conditions by locking resources",
        "To allocate memory dynamically",
        "To schedule process execution"
      ]
    },
    {
      id: 3,
      text: "In the OSI model, which layer is responsible for routing and forwarding packets?",
      options: [
        "Data Link Layer",
        "Transport Layer",
        "Network Layer",
        "Session Layer"
      ]
    },
    {
      id: 4,
      text: "Which SQL command is used to remove all records from a table, including all spaces allocated for the records are removed?",
      options: [
        "DELETE",
        "DROP",
        "TRUNCATE",
        "REMOVE"
      ]
    },
    {
      id: 5,
      text: "What does the 'SOLID' principle 'L' stand for?",
      options: [
        "Liskov Substitution Principle",
        "Least Privilege Principle",
        "Loop Invariant Principle",
        "Lazy Loading Principle"
      ]
    }
  ];

  // Mock Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock "Look away" warning
  useEffect(() => {
    const randomWarning = setInterval(() => {
      if (Math.random() > 0.8) {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 4000);
      }
    }, 15000);
    return () => clearInterval(randomWarning);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    // In a real app, this would submit answers
    setLocation("/dashboard"); 
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <h1 className="font-heading font-bold text-lg">CS-101: Final Examination</h1>
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
            <Wifi className="w-3 h-3 mr-1" /> Connected
          </Badge>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xl font-mono font-bold text-foreground">
            <Clock className="w-5 h-5 text-muted-foreground" />
            {formatTime(timeLeft)}
          </div>
          <Button variant="destructive" size="sm" onClick={handleSubmit}>
            Finish Exam
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Question Area */}
        <main className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">Question {currentQuestion + 1} of {questions.length}</h2>
              <span className="text-sm text-muted-foreground">Multiple Choice • 5 Points</span>
            </div>
            
            <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2" />

            <Card className="border-border shadow-sm">
              <CardContent className="p-8 space-y-8">
                <p className="text-lg leading-relaxed font-medium">
                  {questions[currentQuestion].text}
                </p>

                <RadioGroup 
                  value={answers[questions[currentQuestion].id]} 
                  onValueChange={(val) => setAnswers({...answers, [questions[currentQuestion].id]: val})}
                  className="space-y-4"
                >
                  {questions[currentQuestion].options.map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                      <RadioGroupItem value={option} id={`option-${idx}`} />
                      <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer font-normal text-base">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
              <Button 
                onClick={() => {
                  if (currentQuestion < questions.length - 1) {
                    setCurrentQuestion(prev => prev + 1);
                  } else {
                    handleSubmit();
                  }
                }}
              >
                {currentQuestion === questions.length - 1 ? "Submit Exam" : "Next Question"} 
                {currentQuestion !== questions.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </main>

        {/* Side Panel: Proctoring Status */}
        <aside className="w-80 border-l border-border bg-card p-6 flex flex-col gap-6">
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Surveillance Status
            </h3>
            
            {/* Mock Webcam Feed */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-border shadow-inner group">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
              {/* This would be the user's actual webcam */}
              <div className="absolute inset-0 flex items-center justify-center text-white/20">
                <Video className="w-12 h-12" />
              </div>
              
              {/* Face Tracking Bounding Box Mock */}
              <div className="absolute top-1/4 left-1/3 w-1/3 h-1/2 border-2 border-green-500/50 rounded animate-pulse" />
              
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-mono text-white/90">REC • FACE DETECTED</span>
              </div>
            </div>

            {/* Secondary Device Status */}
            <div className="rounded-lg border border-border p-3 bg-muted/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Phone Connected</p>
                <p className="text-xs text-muted-foreground">Side Angle View Active</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
            </div>
          </div>

          {/* Warnings Log */}
          <div className="flex-1 space-y-4">
             <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              System Alerts
            </h3>
            {showWarning && (
              <Alert variant="destructive" className="animate-in slide-in-from-right fade-in duration-300">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning Detected</AlertTitle>
                <AlertDescription>
                  Please keep your eyes on the screen. Looking away repeatedly may flag your session.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="text-xs text-muted-foreground space-y-2">
              <p>• 10:00 AM - Exam Started</p>
              <p>• 10:00 AM - Environment Scan Complete</p>
              <p>• 10:05 AM - Secondary Camera Linked</p>
            </div>
          </div>
          
          <div className="mt-auto pt-4 border-t border-border">
             <p className="text-xs text-muted-foreground text-center">
               Session ID: 8824-XKA-992<br/>
               Exam Matrix Secure Browser v2.1
             </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
