import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Landing from "@/pages/Landing";
import ExamSession from "@/pages/ExamSession";
import StudentExam from "@/pages/StudentExam";
import Reports from "@/pages/Reports";
import Students from "@/pages/Students";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/exams" component={Dashboard} />
      <Route path="/session/:id" component={ExamSession} />
      <Route path="/session/1" component={ExamSession} />
      <Route path="/student-exam" component={StudentExam} />
      <Route path="/reports" component={Reports} />
      <Route path="/students" component={Students} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
