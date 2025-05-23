import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FF7F7F] to-[#FFFFFF] flex flex-col justify-center items-center p-4">
      {/* Layout para páginas de autenticação */}
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-sm">
        <Outlet />
      </div>
    </div>
  );
} 