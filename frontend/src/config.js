// ----------------------------------------------------------------------
// 🔌 API CONFIGURATION
// ----------------------------------------------------------------------

// "import.meta.env.PROD" is a special variable provided by Vite.
// It is TRUE when deployed to Vercel, and FALSE when running locally.

export const API_URL = import.meta.env.PROD 
  ? 'https://atithi-saas.vercel.app'  // 🚀 Production URL (Vercel)
  : 'http://127.0.0.1:8000';          // 💻 Local Development URL