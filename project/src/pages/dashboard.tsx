import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Theater,
  Calendar as CalendarIcon,
  Clock,
} from 'lucide-react';

const stats = [
  {
    name: 'Active Members',
    value: '48',
    icon: Users,
    description: 'Current team size',
  },
  {
    name: 'Ongoing Productions',
    value: '3',
    icon: Theater,
    description: 'In rehearsal',
  },
  {
    name: 'Upcoming Events',
    value: '7',
    icon: CalendarIcon,
    description: 'Next 30 days',
  },
  {
    name: 'Total Hours',
    value: '2,456',
    icon: Clock,
    description: 'Rehearsal time',
  },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your theater production overview
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}