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
import { ScanText } from 'lucide-react';
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

  // FAIL CLOSED: for any state that is not signed-in (unauthenticated, unknown,
  // errored), show a sign-in screen. Never render the tool or Settings.
  if (!isAuthenticated || !user) {
    return <SignInScreen onSignIn={() => navigateToLogin()} />;
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

function SignInScreen({ onSignIn }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ScanText className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold text-foreground">Sign in to use Invoice Extractor</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need an account to extract contacts and manage your scans.
        </p>
        <button
          type="button"
          onClick={onSignIn}
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}


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