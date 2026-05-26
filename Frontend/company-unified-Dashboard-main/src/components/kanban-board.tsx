import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import allUsers from '@/lib/data/users.json';
import type { User } from '@/lib/types';

const tasks = {
  'In Progress': [
    { id: 'task-1', title: 'Develop new homepage design', business: 'TechCorp India', assigneeId: 'user_4' },
    { id: 'task-2', title: 'Draft Q3 financial report', business: 'FinanceHub USA', assigneeId: 'user_3' },
  ],
  'Review': [
    { id: 'task-3', title: 'User authentication flow', business: 'TechCorp India', assigneeId: 'user_2' },
  ],
  'Done': [
    { id: 'task-4', title: 'Onboard new marketing intern', business: 'FinanceHub USA', assigneeId: 'user_1' },
    { id: 'task-5', title: 'Setup analytics dashboard', business: 'TechCorp India', assigneeId: 'user_4' },
  ],
};

export default function KanbanBoard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Task Board</CardTitle>
                <CardDescription>Overview of project tasks across shared businesses.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {Object.entries(tasks).map(([status, taskList]) => (
                        <div key={status} className="rounded-lg bg-muted/50 p-4">
                            <h3 className="mb-4 font-bold">{status} <Badge variant="secondary" className="ml-2">{taskList.length}</Badge></h3>
                            <div className="space-y-4">
                                {taskList.map(task => {
                                    const assignee = allUsers.find(u => u.id === task.assigneeId) as User;
                                    const userImage = PlaceHolderImages.find(img => img.id === assignee.imageId);
                                    return (
                                        <Card key={task.id}>
                                            <CardContent className="p-4">
                                                <p className="mb-2 font-medium">{task.title}</p>
                                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                    <Badge variant="outline">{task.business}</Badge>
                                                    <Avatar className="h-6 w-6">
                                                        {userImage && <AvatarImage src={userImage.imageUrl} />}
                                                        <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
