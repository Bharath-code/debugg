/**
 * Debugg Vue.js Integration Example
 * Demonstrates how to integrate Debugg with Vue 3 applications
 */

import { createApp } from 'vue';
import { ErrorHandler, createConsoleReporter } from '../src/index';

// 🎨 Initialize Debugg for Vue application
const debugg = new ErrorHandler({
  serviceName: 'my-vue-app',
  environment: import.meta.env.MODE || 'development',
  defaultSeverity: 'medium'
});

// 🚀 Add console reporter for development
if (import.meta.env.MODE === 'development') {
  debugg.addReporter(createConsoleReporter());
}

// 🛡️ Vue Error Handler Plugin
const DebuggPlugin = {
  install(app) {
    // 📱 Provide debugg instance to all components
    app.provide('debugg', debugg);

    // 🚨 Global error handler
    app.config.errorHandler = (err, instance, info) => {
      debugg.handle(err, {
        component: instance?.$options.name || 'unknown',
        lifecycleHook: info,
        vueVersion: '3.x',
        componentProps: instance?.$props,
        componentData: instance?.$data
      }).catch(console.error);
    };

    // 📍 Warn handler
    app.config.warnHandler = (msg, instance, trace) => {
      debugg.handle(new Error(msg), {
        type: 'vue_warning',
        component: instance?.$options.name || 'unknown',
        trace: trace,
        severityOverride: 'low'
      }).catch(console.error);
    };
  }
};

// 📱 Vue Component with Debugg integration
const UserProfile = {
  name: 'UserProfile',
  template: `
    <div class="user-profile">
      <h2 v-if="user">{{ user.name }}'s Profile</h2>
      <p v-if="user">Email: {{ user.email }}</p>
      <div v-if="loading">Loading...</div>
      <div v-if="error" class="error">{{ error }}</div>
      <button @click="refreshProfile" :disabled="loading">
        {{ loading ? 'Refreshing...' : 'Refresh Profile' }}
      </button>
    </div>
  `,
  data() {
    return {
      user: null,
      loading: false,
      error: null
    };
  },
  inject: ['debugg'],
  async created() {
    await this.fetchUserProfile();
  },
  methods: {
    async fetchUserProfile() {
      this.loading = true;
      this.error = null;

      try {
        // 🔍 Simulate API call with Debugg error handling
        const response = await fetch('/api/user/profile');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const userData = await response.json();
        this.user = userData;

        // 📊 Log successful fetch
        this.debugg.handle(new Error('Profile fetched successfully'), {
          type: 'success',
          endpoint: '/api/user/profile',
          userData,
          severityOverride: 'info'
        });
      } catch (fetchError) {
        // 🐞 Capture fetch error with Debugg
        await this.debugg.handle(fetchError, {
          endpoint: '/api/user/profile',
          method: 'GET',
          component: 'UserProfile',
          action: 'fetch_profile'
        });

        this.error = 'Failed to load profile. Please try again.';
      } finally {
        this.loading = false;
      }
    },

    async refreshProfile() {
      await this.fetchUserProfile();
    }
  }
};

// 📝 Form Component with Debugg
const ProfileForm = {
  name: 'ProfileForm',
  template: `
    <form @submit.prevent="handleSubmit" class="profile-form">
      <div>
        <label for="name">Name:</label>
        <input id="name" v-model="name" type="text" required />
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <button type="submit" :disabled="submitting">
        {{ submitting ? 'Updating...' : 'Update Profile' }}
      </button>
    </form>
  `,
  props: {
    initialName: String
  },
  data() {
    return {
      name: this.initialName || '',
      submitting: false,
      error: null
    };
  },
  inject: ['debugg'],
  methods: {
    async handleSubmit() {
      this.submitting = true;
      this.error = null;

      try {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: this.name })
        });

        if (!response.ok) {
          throw new Error(`Update failed: ${response.statusText}`);
        }

        const updatedUser = await response.json();
        this.$emit('updated', updatedUser);

        // 🎉 Log successful update
        this.debugg.handle(new Error('Profile updated successfully'), {
          type: 'success',
          newName: this.name,
          severityOverride: 'info'
        });
      } catch (submitError) {
        // 🚨 Capture form submission error
        await this.debugg.handle(submitError, {
          action: 'form_submission',
          formName: 'profile_update',
          fieldValues: { name: this.name },
          component: 'ProfileForm'
        });

        this.error = 'Failed to update profile. Please try again.';
      } finally {
        this.submitting = false;
      }
    }
  }
};

// 🎯 Main App Component
const App = {
  name: 'App',
  components: {
    UserProfile,
    ProfileForm
  },
  template: `
    <div class="app">
      <header>
        <h1>My Vue App with Debugg</h1>
      </header>
      <main>
        <UserProfile />
        <ProfileForm
          v-if="user"
          :initial-name="user.name"
          @updated="handleProfileUpdate"
        />
      </main>
      <footer>
        <p>Powered by Debugg - Smart Error Handling</p>
      </footer>
    </div>
  `,
  data() {
    return {
      user: null
    };
  },
  inject: ['debugg'],
  methods: {
    handleProfileUpdate(updatedUser) {
      this.user = updatedUser;

      // 📊 Log profile update event
      this.debugg.handle(new Error('Profile update event'), {
        type: 'user_action',
        action: 'profile_updated',
        updatedUser,
        severityOverride: 'info'
      });
    }
  }
};

// 🚀 Create and mount the Vue app with Debugg
const app = createApp(App);
app.use(DebuggPlugin);

// 🎨 Add global error handling for uncaught errors
window.addEventListener('error', (event) => {
  debugg.handle(event.error, {
    type: 'uncaught_error',
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  }).catch(console.error);
});

window.addEventListener('unhandledrejection', (event) => {
  debugg.handle(event.reason, {
    type: 'unhandled_rejection',
    promise: event.promise,
    reason: event.reason
  }).catch(console.error);
});

// 📱 Mount the application
app.mount('#app');

// 📊 Log app initialization
debugg.handle(new Error('Vue app initialized'), {
  type: 'app_lifecycle',
  environment: import.meta.env.MODE,
  timestamp: new Date().toISOString(),
  severityOverride: 'info'
}).catch(console.error);

// 📚 Export for usage
export { app, DebuggPlugin, debugg };
export default app;