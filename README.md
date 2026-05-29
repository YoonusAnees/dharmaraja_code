# Dharmaraja College OBA Registration System

## Overview
A full‑stack web application that allows alumni of **Dharmaraja College** to register for the Old Boys Association (OBA), pay the registration fee via **PayHere**, and manage their accounts. The system includes:
- Secure user registration with email verification via OTP
- Payment integration and backend verification of payment status
- Forgot‑password flow with OTP verification and password reset
- Member‑only pages (Events, Profile, Notifications) behind authentication
- Admin‑only approval workflow for new registrations

The UI follows a premium design language with gradient buttons, glass‑morphism backgrounds, subtle micro‑animations and responsive layouts.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide‑React icons
- **Backend**: Node.js, Express, MongoDB (or any DB), PayHere SDK
- **Styling**: Tailwind utilities, custom CSS for glass effects and gradients
- **Payments**: PayHere payment gateway (sandbox/production)
- **Auth**: JSON Web Tokens (JWT) stored in HttpOnly cookies

## Project Structure
```
Dharmaraja_collage_be/
├─ src/                     # Backend source
│   ├─ routes/              # Express routes (auth, payment, member)
│   ├─ controllers/         # Route handlers
│   ├─ models/              # Mongoose models (User, PasswordReset, etc.)
│   └─ services/            # Email, notification, payment services
├─ fe/                      # Frontend (React + Vite)
│   ├─ src/pages/auth/      # ForgotPassword, ResetPassword, VerifyOtp, Register, Login
│   ├─ src/pages/member/    # Member‑only pages (Events, Profile, etc.)
│   ├─ src/components/      # Shared UI components (layout, NotificationBell)
│   └─ vite.config.js       # Vite config with API proxy
└─ README.md                # This file
```

## Getting Started
1. **Clone the repository**
   ```bash
   git clone <repo_url>
   cd Dharmaraja_collage_be
   ```
2. **Install backend dependencies**
   ```bash
   npm install   # runs in the root folder (backend)
   ```
3. **Install frontend dependencies**
   ```bash
   cd fe/dharmaraja_collage_fe
   npm install
   ```
4. **Configure environment variables**
   - Create a `.env` file in the project root (backend) with the required keys (e.g., `MONGODB_URI`, `JWT_SECRET`, `PAYHERE_MERCHANT_ID`, `PAYHERE_SECRET_KEY`).
   - The frontend uses the Vite proxy; no additional env vars are needed for the API base URL.
5. **Run the backend**
   ```bash
   npm run dev   # starts Express on http://localhost:8000
   ```
6. **Run the frontend**
   ```bash
   cd fe/dharmaraja_collage_fe
   npm run dev   # starts Vite dev server on http://localhost:5173
   ```
   The Vite config proxies any request starting with `/api` to `http://localhost:8000`, so you can call the backend with relative URLs like `/api/auth/register`.

## API Proxy Configuration (vite.config.js)
```js
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // keep the /api prefix
      },
    },
  },
});
```
This eliminates CORS issues during development.

## Premium UI Design Details
- **Background**: dark slate with subtle gradient glows (`bg-slate-950/60`, `bg-emerald-500/10` etc.)
- **Buttons**: gradient‑to‑right (emerald → teal) or gold for call‑to‑action, with hover scaling and shadow effects.
- **Forms**: glass‑morphism containers (`backdrop-blur-xl`, semi‑transparent borders) and focus rings in gold.
- **Animations**: `transition-all`, `hover:scale-105`, icons spin on loading (`animate-spin`).
- **Responsive**: `max-w-xl` forms, flex‑grid layout for inputs, mobile‑first adjustments.

## Testing the Flow
1. Visit `http://localhost:5173/register` and fill the registration form.
2. After submitting, you will be redirected to the PayHere sandbox. Complete a test payment.
3. Upon success, the backend marks the registration as *pending* and the UI shows a success message.
4. Use the **Forgot Password** page to request an OTP, verify it on the **Verify OTP** page, then reset the password.

## Contributing
- Fork the repository and create a feature branch.
- Follow the existing coding style (Tailwind classes, Prettier formatting).
- Run `npm run lint` and ensure no errors before submitting a PR.
- Update the README if you add new features or change the setup.

## License
This project is licensed under the MIT License.

---
*Built with love for the Dharmaraja College alumni community.*
