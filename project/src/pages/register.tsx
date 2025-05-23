import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import GoogleIcon from '@/components/google-icon';

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validate email
    if (!email) {
      toast.error('Por favor, insira um email');
      return;
    }

    // Validate password
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    try {
      setLoading(true);
      await register(email, password);
      navigate('/');
    } catch (error) {
      // Error is already handled in AuthProvider
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // Implementação futura
    toast.error('Cadastro com Google será implementado em breve');
  };

  return (
    <div className="flex min-h-screen bg-white flex-col px-4">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Logo */}
        <h1 className="text-2xl font-bold text-center mb-12">ServeFirst</h1>

        {/* Form Fields */}
        <div className="space-y-4 w-full">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 rounded-xl border border-[#FF7F7F] bg-[#F9F9FE] placeholder:text-gray-500 px-4"
            placeholder="Email"
            required
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 rounded-xl border border-[#FF7F7F] bg-[#F9F9FE] placeholder:text-gray-500 px-4"
            placeholder="Senha"
            required
          />
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-14 rounded-xl border border-[#FF7F7F] bg-[#F9F9FE] placeholder:text-gray-500 px-4"
            placeholder="Confirmar Senha"
            required
          />
        </div>

        {/* Register Button */}
        <Button 
          className="w-full h-14 mt-6 bg-[#FF7F7F] hover:bg-[#ff6b6b] text-white rounded-xl text-lg font-medium"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? 'Cadastrando...' : 'Entrar'}
        </Button>

        {/* Already have account */}
        <p className="mt-6 text-base text-gray-600 text-center">
          Já possui uma conta?
        </p>

        {/* Use Google */}
        <p className="mt-2 text-base text-[#FF7F7F] text-center">
          ou utilize o google
        </p>

        {/* Google Button */}
        <Button 
          className="w-full h-14 mt-4 bg-[#0A1628] hover:bg-[#162a45] text-white rounded-xl flex items-center justify-center gap-2 text-lg font-medium"
          onClick={handleGoogleSignup}
        >
          <GoogleIcon className="h-6 w-6" />
          Google
        </Button>
      </div>
    </div>
  );
}