/**
 * Debugg React Integration Example
 * Demonstrates how to integrate Debugg with React applications
 */

import React from 'react';
import { ErrorHandler, createSentryReporter } from '../src/index';

// 🎨 Initialize Debugg for React application
const debugg = new ErrorHandler({
  serviceName: 'my-react-app',
  environment: process.env.NODE_ENV || 'development',
  defaultSeverity: 'medium'
});

// 🚀 Add Sentry reporter for production error tracking
if (process.env.NODE_ENV === 'production') {
  debugg.addReporter(createSentryReporter('YOUR_SENTRY_DSN'));
}

// 🛡️ Custom Error Boundary with Debugg integration
class DebuggErrorBoundary extends React.Component<{
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 📊 Capture error with Debugg
    debugg.handle(error, {
      component: this.constructor.name,
      errorInfo: errorInfo,
      reactVersion: React.version,
      location: window.location.href,
      userAgent: navigator.userAgent
    }).catch(console.error);

    // 🔄 Call optional custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    return this.props.children;
  }
}

// 📱 Example React Component with Debugg integration
export function UserProfile() {
  const [user, setUser] = React.useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 🔍 Fetch user data with Debugg error handling
  React.useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const userData = await response.json();
        setUser(userData);
      } catch (fetchError) {
        // 🐞 Capture fetch error with Debugg
        await debugg.handle(fetchError, {
          endpoint: '/api/user/profile',
          method: 'GET',
          userId: 'current-user-id',
          component: 'UserProfile'
        });

        setError('Failed to load user profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  // 💻 Handle form submission with Debugg
  async function handleUpdateProfile(newName: string) {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`);
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      return true;
    } catch (updateError) {
      // 🔧 Capture update error with Debugg
      await debugg.handle(updateError, {
        action: 'update_profile',
        newName,
        currentUser: user,
        endpoint: '/api/user/profile',
        method: 'PUT'
      });

      setError('Failed to update profile. Please try again.');
      return false;
    }
  }

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!user) return <div>No user data available</div>;

  return (
    <div className="user-profile">
      <h2>{user.name}'s Profile</h2>
      <p>Email: {user.email}</p>
      <UserProfileForm
        currentName={user.name}
        onSubmit={handleUpdateProfile}
      />
    </div>
  );
}

// 📝 Profile Form Component
function UserProfileForm({
  currentName,
  onSubmit
}: {
  currentName: string;
  onSubmit: (newName: string) => Promise<boolean>;
}) {
  const [name, setName] = React.useState(currentName);
  const [updating, setUpdating] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUpdating(true);
    setFormError(null);

    try {
      const success = await onSubmit(name);
      if (!success) {
        setFormError('Update failed. Please check your input.');
      }
    } catch (submitError) {
      // 🚨 Capture form submission error
      await debugg.handle(submitError, {
        action: 'form_submission',
        formName: 'profile_update',
        fieldValues: { name }
      });
      setFormError('An unexpected error occurred.');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      {formError && <div className="error">{formError}</div>}
      <button type="submit" disabled={updating}>
        {updating ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  );
}

// 🎯 Usage Example
function App() {
  return (
    <DebuggErrorBoundary>
      <div className="app">
        <header>
          <h1>My Awesome App</h1>
        </header>
        <main>
          <UserProfile />
        </main>
        <footer>
          <p>Powered by Debugg - Smart Error Handling</p>
        </footer>
      </div>
    </DebuggErrorBoundary>
  );
}

// 📚 Export for usage
export { debugg, DebuggErrorBoundary, App };
export default App;