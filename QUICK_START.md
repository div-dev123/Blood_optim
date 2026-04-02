# Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation Steps

1. **Navigate to project directory**
   ```bash
   cd /Users/viksitchadha/Desktop/Blood_Donation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   
   This will install all required packages including:
   - React 18+ with TypeScript
   - Vite for build tooling
   - Tailwind CSS for styling
   - Framer Motion for animations
   - Recharts for data visualization
   - React Router for navigation
   - And more...

3. **Start development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

### Run the Backend (Required for Login/Register)

Login/Register now uses the FastAPI backend with a SQLite database for persistence (stored at `backend/app.db`).

The hospital **Predictions** page also calls the backend for live **TFT** demand forecasts and **PatchGRU** expiry-risk forecasts. If ML artifacts are missing, the backend will still run, but forecast endpoints may return `503`.

1. **Install backend dependencies**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Start the API server**
   ```bash
   # Option A (recommended): run from inside backend/
   python -m uvicorn app.main:app --reload --port 8000

   # Option B: run from repo root (avoids: ModuleNotFoundError: No module named 'app')
   # python -m uvicorn app.main:app --reload --port 8000 --app-dir backend
   ```

3. **Demo credentials (seeded on startup)**
   - Hospital: `admin@hospital.demo` / `demo1234`
   - Donor: `donor@demo.com` / `demo1234`

Vite is configured to proxy `/api/*` to `http://127.0.0.1:8000` in dev.

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

## 📱 Pages Overview

### Public Pages
- **`/`** - Landing page with hero section and features
- **`/login`** - Login page with social auth options
- **`/register`** - Multi-step registration form

### Hospital Pages (Requires login)
- **`/hospital/dashboard`** - Main dashboard with inventory overview
- **`/hospital/inventory`** - Blood unit management
- **`/hospital/predictions`** - AI demand forecasting
- **`/hospital/redistribution`** - Blood redistribution center
- **`/hospital/match-score`** - Smart compatibility matching
- **`/hospital/analytics`** - Analytics and reports

### Donor Pages
- **`/donor/home`** - Donor dashboard with gamification

### Settings
- **`/settings`** - User preferences and account management

## 🎨 Key Features to Demo

1. **Landing Page**
   - Animated statistics counters
   - Feature showcase cards
   - Smooth scroll animations

2. **Hospital Dashboard**
   - Real-time inventory cards
   - AI prediction widgets
   - Interactive charts
   - Recent activity feed

3. **AI Predictions**
   - 7-day demand forecast
   - Confidence scores
   - Shortage alerts
   - Model performance metrics

4. **Match Score Viewer**
   - Compatibility scoring
   - Radar chart visualization
   - Unit comparison table

5. **Donor Marketplace**
   - Credit score display
   - Achievement badges
   - Nearby opportunities
   - Donation history

## 🐛 Troubleshooting

### Port Already in Use
If port 5173 is already in use, Vite will automatically use the next available port.

### Build Errors
- Ensure Node.js version is 18+
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Check TypeScript errors: `npm run build`

### Styling Issues
- Ensure Tailwind CSS is properly configured
- Check `tailwind.config.js` for custom theme settings

## 📦 Project Structure

```
Blood_Donation/
├── public/           # Static assets
├── src/
│   ├── components/   # Reusable components
│   ├── pages/        # Page components
│   ├── data/         # Mock data
│   ├── hooks/        # Custom hooks
│   ├── store/        # State management
│   ├── styles/       # Global styles
│   ├── types/        # TypeScript types
│   ├── utils/        # Utility functions
│   ├── App.tsx       # Main app
│   └── main.tsx      # Entry point
├── index.html        # HTML template
├── package.json      # Dependencies
├── tailwind.config.js # Tailwind config
├── tsconfig.json     # TypeScript config
└── vite.config.ts    # Vite config
```

## 🎯 Next Steps

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Open browser: `http://localhost:5173`
4. Explore all pages and features!

## 💡 Tips

- Use browser DevTools to inspect components
- Check console for any warnings
- All data is mocked - perfect for demos
- Theme toggle available in navbar
- Responsive design works on all devices

---

**Happy Coding! 🎉**
