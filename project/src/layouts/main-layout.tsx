import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from '@/components/bottom-nav';

export function AppLayout() {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Lista de rotas onde o menu inferior NÃO deve aparecer
  const hideBottomNavRoutes = ['/login', '/register', '/nova-senha'];
  const shouldShowBottomNav = !hideBottomNavRoutes.includes(pathname);

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Conteúdo principal */}
      <Outlet />
      
      {/* Menu inferior fixo - só aparece em rotas específicas */}
      {shouldShowBottomNav && <BottomNav />}
    </div>
  );
}