import { AppRoutes } from '@/routes';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="theme">
      <AppRoutes />
      <Toaster position="top-center" richColors />
    </ThemeProvider>
  );
}

export default App;