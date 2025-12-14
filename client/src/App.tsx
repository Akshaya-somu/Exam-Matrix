import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/lib/auth";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminDashboard from "@/pages/admin/Dashboard";
import Students from "@/pages/admin/Students";
import Exams from "@/pages/admin/Exams";
import Sessions from "@/pages/admin/Sessions";
import ProctorDashboard from "@/pages/proctor/Dashboard";
import StudentDashboard from "@/pages/student/Dashboard";
import NotFound from "@/pages/not-found";
import TakeExam from "@/pages/student/TakeExam";
import EnhancedTakeExam from "@/pages/student/EnhancedTakeExam";
import LiveMonitor from "@/pages/proctor/LiveMonitor";
import EnhancedLiveMonitor from "@/pages/proctor/EnhancedLiveMonitor";
import PhoneCamera from "@/pages/PhoneCamera";

function ProtectedRoute({ component: Component, allowedRoles, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/phone-camera/:sessionId" component={PhoneCamera} />

      <Route path="/">
        {user ? (
          user.role === "admin" ? (
            <Redirect to="/admin/dashboard" />
          ) : user.role === "proctor" ? (
            <Redirect to="/proctor/dashboard" />
          ) : (
            <Redirect to="/student/dashboard" />
          )
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/students">
        <ProtectedRoute component={Students} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/exams">
        <ProtectedRoute component={Exams} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/sessions">
        <ProtectedRoute component={Sessions} allowedRoles={["admin"]} />
      </Route>

      {/* Proctor Routes */}
      <Route path="/proctor/dashboard">
        <ProtectedRoute
          component={ProctorDashboard}
          allowedRoles={["proctor", "admin"]}
        />
      </Route>
      <Route path="/proctor/monitor">
        <ProtectedRoute
          component={EnhancedLiveMonitor}
          allowedRoles={["proctor", "admin"]}
        />
      </Route>
      <Route path="/proctor/sessions">
        <ProtectedRoute
          component={Sessions}
          allowedRoles={["proctor", "admin"]}
        />
      </Route>

      {/* Student Routes */}
      <Route path="/student/dashboard">
        <ProtectedRoute
          component={StudentDashboard}
          allowedRoles={["student"]}
        />
      </Route>
      <Route path="/student/exam/:examId">
        <ProtectedRoute
          component={EnhancedTakeExam}
          allowedRoles={["student"]}
        />
      </Route>
      <Route path="/student/exams">
        <ProtectedRoute
          component={StudentDashboard}
          allowedRoles={["student"]}
        />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
