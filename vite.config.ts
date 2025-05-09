
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Define environment variables with default values
  define: {
    'import.meta.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify('https://gtatdbpfopsxkrkgvqiv.supabase.co'),
    'import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YXRkYnBmb3BzeGtya2d2cWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzI2NDUsImV4cCI6MjA2MDMwODY0NX0.0yv0L-NC5moCSZ2wgsvsP7DepwxNZYTnFhopOArxOdI'),
  },
}));
