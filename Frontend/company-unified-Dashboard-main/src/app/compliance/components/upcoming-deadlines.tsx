import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Calendar, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const deadlines = [
  { id: 1, title: 'UAE VAT Filing', dueIn: '12 days', severity: 'medium' },
  { id: 2, title: 'UK GDPR Review', dueIn: '25 days', severity: 'low' },
  { id: 3, title: 'India TDS Payment', dueIn: '7 days', severity: 'high' },
  { id: 4, title: 'US Form 941 Filing', dueIn: '1 month', severity: 'low' },
  { id: 5, title: 'SG Corp Tax Estimate', dueIn: '2 months', severity: 'low' },
];

export default function UpcomingDeadlines() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Deadlines</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {deadlines.map(deadline => (
            <li key={deadline.id} className="flex items-start gap-3">
                <div className={cn("mt-1",
                    deadline.severity === 'high' && "text-red-500",
                    deadline.severity === 'medium' && "text-orange-500",
                    deadline.severity === 'low' && "text-blue-500"
                )}>
                    {deadline.severity === 'high' ? <AlertTriangle className="h-4 w-4"/> : <Calendar className="h-4 w-4"/>}
                </div>
              <div className="flex-1">
                <p className="font-medium">{deadline.title}</p>
                <p className={cn("text-sm",
                    deadline.severity === 'high' && "text-red-600 font-semibold",
                    deadline.severity === 'medium' && "text-orange-600 font-semibold",
                    deadline.severity === 'low' && "text-muted-foreground"
                )}>
                  Due in {deadline.dueIn}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
