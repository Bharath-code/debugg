<!--
 * Debugg Svelte Integration Example
 * Demonstrates comprehensive error handling for Svelte applications
 -->

<script>
  import { onMount } from 'svelte';
  import { ErrorHandler, createConsoleReporter } from '../src/index';

  // 🎨 Initialize Debugg for Svelte application
  const debugg = new ErrorHandler({
    serviceName: 'svelte-app',
    environment: import.meta.env.MODE || 'development',
    defaultSeverity: 'medium'
  });

  // 🚀 Add console reporter for development
  if (import.meta.env.MODE === 'development') {
    debugg.addReporter(createConsoleReporter());
  }

  // 📱 Component state
  let user = null;
  let loading = false;
  let error = null;
  let formError = null;
  let name = '';

  // 🔍 Fetch user data with Debugg error handling
  async function fetchUser() {
    loading = true;
    error = null;

    try {
      const response = await fetch('/api/user/profile');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      user = await response.json();

      // 📊 Log successful fetch
      debugg.handle(new Error('User fetched successfully'), {
        type: 'success',
        endpoint: '/api/user/profile',
        user,
        severityOverride: 'info'
      });
    } catch (fetchError) {
      // 🐞 Capture fetch error with Debugg
      await debugg.handle(fetchError, {
        endpoint: '/api/user/profile',
        method: 'GET',
        component: 'UserProfile',
        action: 'fetch_user'
      });

      error = 'Failed to load user profile. Please try again.';
    } finally {
      loading = false;
    }
  }

  // 💻 Handle form submission with Debugg
  async function handleSubmit() {
    formError = null;

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`);
      }

      const updatedUser = await response.json();
      user = updatedUser;

      // 🎉 Log successful update
      debugg.handle(new Error('Profile updated successfully'), {
        type: 'success',
        newName: name,
        severityOverride: 'info'
      });
    } catch (submitError) {
      // 🚨 Capture form submission error
      await debugg.handle(submitError, {
        action: 'form_submission',
        formName: 'profile_update',
        fieldValues: { name },
        component: 'UserProfile'
      });

      formError = 'Failed to update profile. Please try again.';
    }
  }

  // 🎯 Svelte lifecycle with Debugg
  onMount(async () => {
    try {
      await fetchUser();

      // 📊 Log component mount
      debugg.handle(new Error('Component mounted'), {
        type: 'lifecycle',
        component: 'UserProfile',
        severityOverride: 'info'
      });
    } catch (mountError) {
      // 🛡️ Capture mount error
      await debugg.handle(mountError, {
        type: 'lifecycle_error',
        component: 'UserProfile',
        lifecycle: 'onMount'
      });
      error = 'Failed to initialize component';
    }
  });

  // 📝 Global error handler for Svelte
  function handleGlobalError(error, context = {}) {
    debugg.handle(error, {
      ...context,
      framework: 'svelte',
      component: 'UserProfile'
    }).catch(console.error);
  }

  // 📚 Export debugg for other components
  export { debugg, handleGlobalError };
</script>

<svelte:head>
  <title>Debugg Svelte Integration</title>
  <style>
    .user-profile { max-width: 600px; margin: 0 auto; padding: 20px; }
    .error { color: #FF4757; background: #FFE5E5; padding: 10px; border-radius: 4px; margin: 10px 0; }
    .loading { color: #1E90FF; font-style: italic; }
    button { background: #FF4757; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    button:hover { background: #FF6348; }
    button:disabled { background: #ccc; cursor: not-allowed; }
    input { width: 100%; padding: 8px; margin: 8px 0; border: 1px solid #ddd; border-radius: 4px; }
    .form-error { color: #FF4757; font-size: 0.9rem; margin: 5px 0; }
  </style>
</svelte:head>

<div class="user-profile">
  <h1>🐞 Debugg Svelte Integration</h1>

  {#if loading}
    <div class="loading">Loading user data...</div>
  {:else if error}
    <div class="error">{error}</div>
    <button on:click={fetchUser}>Retry</button>
  {:else if user}
    <div>
      <h2>{user.name}'s Profile</h2>
      <p><strong>Email:</strong> {user.email}</p>

      <form on:submit|preventDefault={handleSubmit}>
        <div>
          <label for="name">Update Name:</label>
          <input id="name" type="text" bind:value={name} placeholder={user.name} required />
        </div>
        {#if formError}
          <div class="form-error">{formError}</div>
        {/if}
        <button type="submit" disabled={!name.trim()}>
          Update Profile
        </button>
      </form>
    </div>
  {:else}
    <div class="loading">No user data available</div>
  {/if}

  <footer style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
    <p>Powered by Debugg - Smart Error Handling for Svelte 🚀</p>
  </footer>
</div>

<!-- 🛡️ Svelte error boundary equivalent -->
{svelte:window on:error={e => {
  handleGlobalError(e, {
    type: 'uncaught_error',
    message: e.message,
    component: 'UserProfile'
  });
}}/>