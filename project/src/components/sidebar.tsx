import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  DollarSign,
  Home,
  Theater,
  Users,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Cenários', href: '/cenarios', icon: Theater },
  { name: 'Atores', href: '/atores', icon: Users },
  { name: 'Convidar', href: '/convidar-participantes', icon: CalendarIcon },
];

export function Sidebar() {
  // Esta barra lateral não será mais exibida na aplicação
  // O componente foi mantido apenas para compatibilidade com código existente
  return null;
}