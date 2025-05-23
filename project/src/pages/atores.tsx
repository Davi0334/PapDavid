import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Atores() {
  return (
    <div className="min-h-screen bg-background p-4 max-w-md mx-auto">
      <div className="flex items-center mb-6">
        <Link to="/" className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-semibold text-center flex-1 -ml-6">
          Descrição
        </h1>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-center mb-2">Quantidade de Atores:</label>
          <Input 
            className="rounded-full bg-muted border-primary/20"
            placeholder="Número de atores"
          />
        </div>

        <div>
          <label className="block text-center mb-2">Figurino:</label>
          <Textarea 
            className="min-h-[200px] rounded-3xl bg-muted border-primary/20"
            placeholder="Descreva o figurino"
          />
        </div>

        <Button 
          className="w-full bg-[#0A1628] text-white rounded-full hover:bg-[#0A1628]/90"
        >
          Recriar Grupo
        </Button>

        <div className="text-center text-sm text-muted-foreground">ou</div>

        <Button 
          variant="outline"
          className="w-full bg-primary/10 text-primary rounded-full border-primary/20 hover:bg-primary/20"
        >
          <Upload className="mr-2 h-4 w-4" />
          Importar Documento
        </Button>
      </div>
    </div>
  );
}