import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function Detalhes() {
  return (
    <div className="min-h-screen bg-primary/90 text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/" className="text-white">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-xl font-semibold text-center flex-1 -ml-6">
            Título
          </h1>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl mb-4">Detalhes:</h2>

          <div className="grid grid-cols-3 gap-4">
            <Link to="/roteiro" className="bg-white rounded-xl p-4 aspect-square flex items-center justify-center">
              <span className="text-black font-medium">Roteiro</span>
            </Link>
            <Link to="/teatro" className="bg-white rounded-xl p-4 aspect-square flex items-center justify-center">
              <span className="text-black font-medium">Figurino</span>
            </Link>
            <Link to="/cenarios" className="bg-white rounded-xl p-4 aspect-square flex items-center justify-center">
              <span className="text-black font-medium">Cenário</span>
            </Link>
          </div>

          <Link to="/criar-grupo">
            <Button 
              className="w-full bg-[#0A1628] text-white rounded-full hover:bg-[#0A1628]/90 mt-auto"
            >
              Entrar No Teatro
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}