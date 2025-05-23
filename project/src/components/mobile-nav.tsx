import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Calendar as CalendarIcon,
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

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const location = useLocation();

  return (
    <nav className={cn('py-2 px-4 flex justify-around', className)}>
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-md transition-colors',
              location.pathname === item.href
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}