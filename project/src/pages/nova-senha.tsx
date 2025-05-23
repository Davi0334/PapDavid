import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function NovaSenha() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-12">
          <Link to="/login" className="text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-12">Nova Senha</h1>

        <div className="space-y-6">
          <div>
            <label className="block text-lg mb-2">
              Código De confirmação:
            </label>
            <Input
              className="rounded-xl border-primary/20 bg-primary/5"
              placeholder="Digite o código recebido"
            />
          </div>

          <Button 
            className="w-full bg-[#0A1628] text-white rounded-xl flex items-center justify-center gap-2"
          >
            Alterar Senha
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-2">
          <div className="max-w-md mx-auto grid grid-cols-4 gap-4">
            <Link to="/" className="flex flex-col items-center gap-1">
              <span className="h-5 w-5">🏠</span>
              <span className="text-xs">INÍCIO</span>
            </Link>
            <Link to="/buscar" className="flex flex-col items-center gap-1">
              <span className="h-5 w-5">🔍</span>
              <span className="text-xs">BUSCAR</span>
            </Link>
            <Link to="/eventos" className="flex flex-col items-center gap-1">
              <span className="h-5 w-5">📝</span>
              <span className="text-xs">EVENTOS</span>
            </Link>
            <Link to="/perfil" className="flex flex-col items-center gap-1">
              <span className="h-5 w-5">👤</span>
              <span className="text-xs">PERFIL</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}