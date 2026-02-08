# Firebase Setup Guide for Google Sign-In

## The Problem
Your Google sign-in is failing because Firebase isn't configured with real credentials. The popup appears and closes immediately because Firebase can't authenticate.

## Solution: Set Up Firebase

### Step 1: Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard (you can disable Google Analytics if you want)

### Step 2: Enable Google Authentication
1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click on the **Sign-in method** tab
3. Click on **Google** in the providers list
4. Toggle **Enable**
5. Add a support email (your email)
6. Click **Save**

### Step 3: Register Your Web App
1. Go to **Project Settings** (gear icon in the left sidebar)
2. Scroll down to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname (e.g., "Lunchbox App")
5. Copy the `firebaseConfig` object that appears

### Step 4: Update Your Code
Replace the placeholder config in `frontend/src/firebase.js` with your real config:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};
```

### Step 5: Configure Authorized Domains
1. In Firebase Console, go to **Authentication** > **Settings** tab
2. Scroll to **Authorized domains**
3. Add your domains:
   - `localhost` (for local development)
   - Your production domain (e.g., `yourapp.vercel.app`)

### Step 6: Test
1. Save your changes
2. Restart your frontend dev server
3. Try Google sign-in again

## Alternative: Test Without Firebase (Mock Implementation)

If you want to test the app without setting up Firebase, I can create a mock Google login that simulates the authentication flow for development purposes.

Would you like me to:
1. Help you set up Firebase properly (recommended for production)
2. Create a mock implementation for testing (quick solution for development)

## Troubleshooting

### Error: "Firebase not configured"
- Make sure you replaced ALL placeholder values in `firebase.js`
- Check that your Firebase project has Google authentication enabled

### Error: "auth/unauthorized-domain"
- Add your domain to Authorized domains in Firebase Console

### Popup closes immediately
- This usually means the Firebase config is invalid
- Double-check your `apiKey` and `authDomain`

### Error: "auth/popup-blocked"
- Your browser is blocking popups
- Allow popups for localhost or your domain
