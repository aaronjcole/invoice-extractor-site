import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Home from '@/pages/Home';
import Settings from '@/pages/Settings';
import BottomNav from '@/components/invoice-extractor/BottomNav';
import SignInModal from '@/components/SignInModal';
// Add page imports here

const AuthenticatedApp = () => {
  const { user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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

  // Not signed in: show the landing/hero page with a sign-in modal overlay.
  if (!isAuthenticated || !user) {
    return (
      <>
        <Home />
        <SignInModal onSignIn={() => navigateToLogin()} />
      </>
    );
  }

  // Render the main app
  return (
    <>
      <Routes>
        {/* Add your page Route elements here */}
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <BottomNav />
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