import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Home from '@/pages/Home';
import Settings from '@/pages/Settings';
import BottomNav from '@/components/invoice-extractor/BottomNav';
import SignInModal from '@/components/SignInModal';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Add page imports here

const AuthenticatedApp = () => {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // User not registered for this app — dedicated screen.
  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  const onAuthRequired = () => setSignInOpen(true);

  return (
    <>
      <Routes>
        {/* Public auth routes — reachable while signed out */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* App content */}
        <Route path="/" element={<Home onAuthRequired={onAuthRequired} />} />
        <Route
          path="/settings"
          element={isAuthenticated ? <Settings /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      {!isAuthenticated && signInOpen && (
        <SignInModal onClose={() => setSignInOpen(false)} />
      )}
      {isAuthenticated && <BottomNav />}
    </>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App