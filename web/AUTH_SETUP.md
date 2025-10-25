# Authentication Setup Guide

This document describes the authentication system that has been implemented.

## 📁 Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx          # Auth pages layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx        # Login form
│   │   │   └── signup/
│   │   │       └── page.tsx        # Signup form
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Protected dashboard page
│   │   └── page.tsx                # Home page (updated with auth links)
│   ├── components/
│   │   └── logout-button.tsx       # Reusable logout button
│   ├── data/
│   │   ├── actions/
│   │   │   └── auth-actions.ts     # Server actions (login, register, logout)
│   │   └── services/
│   │       └── auth-service.ts     # API service functions
│   ├── lib/
│   │   └── auth-helpers.ts         # Helper functions (getAuthToken, isAuthenticated)
│   └── middleware.ts               # Route protection middleware
```

## 🔑 Key Features

### 1. **Authentication Actions** (`src/data/actions/auth-actions.ts`)

- `loginUserAction()` - Login with username/email and password
- `registerUserAction()` - Register new user
- `logoutAction()` - Logout and clear session
- Includes Zod validation for form inputs
- Manages JWT tokens in HTTP-only cookies

### 2. **API Services** (`src/data/services/auth-service.ts`)

- `loginUserService()` - Calls backend `/api/auth/login`
- `registerUserService()` - Calls backend `/api/auth/register`
- Configurable backend URL via `NEXT_PUBLIC_BACKEND_URL`

### 3. **Middleware** (`src/middleware.ts`)

- Protects `/dashboard` and other authenticated routes
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from `/login` and `/signup`

### 4. **Pages**

- **Home** (`/`) - Shows different content based on auth state
- **Login** (`/login`) - Simple login form
- **Signup** (`/signup`) - Simple registration form
- **Dashboard** (`/dashboard`) - Protected page with logout button

## 🚀 Getting Started

### Mock Backend Included! 🎉

**Good news!** This project includes a mock backend for testing, so you can try the authentication flow immediately without setting up an external backend.

The mock backend stores users in a local JSON file (`data/users.json`) and provides:

- User registration
- User login
- Fake JWT token generation

See `MOCK_BACKEND_README.md` for details about the mock backend.

### 1. Start Testing Right Away

**No configuration needed!** The system is ready to use out of the box with the mock backend.

Just run:

```bash
pnpm dev
```

Then visit:

- `http://localhost:3000/signup` - Create an account
- `http://localhost:3000/login` - Login
- `http://localhost:3000/dashboard` - Protected page

### 2. (Optional) Use External Backend

If you want to use your own backend instead of the mock, create a `.env.local` file:

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Host domain for cookies
HOST=localhost
```

### 3. Backend API Requirements

If using an external backend, it should provide these endpoints:

- `POST /api/auth/login` - Login endpoint

  ```json
  Request: { "identifier": "user@email.com", "password": "password123" }
  Response: { "jwt": "token...", "user": {...} }
  Error: { "error": { "message": "Error message" } }
  ```

- `POST /api/auth/register` - Registration endpoint
  ```json
  Request: { "username": "user", "email": "user@email.com", "password": "password123" }
  Response: { "jwt": "token...", "user": {...} }
  Error: { "error": { "message": "Error message" } }
  ```

### 3. Run the Development Server

```bash
cd web
pnpm dev
```

Visit:

- `http://localhost:3000` - Home page
- `http://localhost:3000/login` - Login page
- `http://localhost:3000/signup` - Signup page
- `http://localhost:3000/dashboard` - Protected dashboard (requires login)

## 🔒 Security Features

- **HTTP-only cookies** - JWT tokens stored securely
- **Server-side validation** - Zod schema validation
- **Protected routes** - Middleware authentication
- **Secure in production** - Cookies marked as secure in production

## 🎨 Styling

- Uses **Tailwind CSS** for styling
- **Dark mode** compatible
- Clean, simple forms without external UI libraries
- Responsive design

## 📝 Customization

### Add More Protected Routes

Edit `src/middleware.ts`:

```typescript
const protectedRoutes = [
  "/dashboard",
  "/profile", // Add new routes here
  "/settings",
];
```

### Change Backend URL

Update `src/data/services/auth-service.ts`:

```typescript
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
```

### Customize Forms

Edit the form components in:

- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`

## 🧪 Testing the Flow

1. **Visit home page** - See login/signup buttons
2. **Click "Sign Up"** - Create a new account
3. **After signup** - Automatically redirected to dashboard
4. **Visit home page** - Now see "Dashboard" button
5. **Click "Logout"** - Redirected to home page
6. **Try visiting `/dashboard`** - Redirected to login

## 📦 Dependencies Added

- `zod` (v4.1.12) - Form validation

## 🔄 Next Steps

1. **Connect to your backend** - Update `NEXT_PUBLIC_BACKEND_URL`
2. **Test authentication flow** - Try signup, login, logout
3. **Customize styling** - Adjust Tailwind classes as needed
4. **Add user data display** - Fetch and display user profile
5. **Add more protected pages** - Expand the dashboard section

## 💡 Tips

- JWT token is stored in cookie named `"jwt"`
- Token expires after 7 days
- Use `getAuthToken()` to access token in server components
- Use `isAuthenticated()` to check auth status
