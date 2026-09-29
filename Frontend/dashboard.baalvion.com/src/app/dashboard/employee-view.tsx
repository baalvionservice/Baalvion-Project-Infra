"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Star, Target } from "lucide-react";
import { RoleWelcomeBanner } from "@/components/role-welcome-banner";
import { useGlobalFinancials } from "@/hooks/use-global-financials";
import { useDashboardRefs } from "@/hooks/use-dashboard-refs";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const myTasks = [
  { id: 1, title: "Create social media graphics for Client X", status: "Done" },
  {
    id: 2,
    title: "Schedule posts for next week's campaign",
    status: "In Progress",
  },
  {
    id: 3,
    title: "Analyze competitor's new ad campaign",
    status: "In Progress",
  },
  { id: 4, title: "Draft copy for email newsletter", status: "Todo" },
  { id: 5, title: "Prepare weekly performance report", status: "Todo" },
];

const attendance = [
  { day: "Mon", time: "09:02 AM" },
  { day: "Tue", time: "08:58 AM" },
  { day: "Wed", time: "09:05 AM" },
  { day: "Thu", time: "09:00 AM" },
  { day: "Fri", time: "09:10 AM" },
];

export default function EmployeeView() {
  const { businesses } = useGlobalFinancials();
  const { employees } = useDashboardRefs();
  const employee = employees[0];
  const business = businesses[0];

  if (!employee || !business) return <div>Loading...</div>;

  const userImage = PlaceHolderImages.find(
    (img) => img.id === employee.imageId
  );
  const businessImage = PlaceHolderImages.find(
    (img) => img.id === business.imageId
  );

  return (
    <div className="space-y-8 min-w-0">
      <RoleWelcomeBanner />
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Employee Dashboard
        </h1>
        <p className="text-muted-foreground">Your personal workspace.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-8 lg:col-span-1 min-w-0">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                {userImage && <AvatarImage src={userImage.imageUrl} />}
                <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{employee.name}</CardTitle>
                <CardDescription>Marketing Manager</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  {businessImage && (
                    <AvatarImage src={businessImage.imageUrl} />
                  )}
                  <AvatarFallback>{business.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{business.name}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Attendance This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {attendance.map((item) => (
                  <li
                    key={item.day}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium">{item.day}</span>
                    <span className="text-muted-foreground">{item.time}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="grid auto-rows-max items-start gap-8 lg:col-span-2 min-w-0">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Tasks Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <CheckCircle className="text-green-500" />
                  12
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Hours Logged
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <Clock />
                  38.5
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Performance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <Star className="text-yellow-500" />
                  4.8/5
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>
                Your current tasks for this week.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {myTasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-4">
                    {task.status === "Done" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Target className="h-5 w-5 text-muted-foreground" />
                    )}
                    <p
                      className={`font-medium ${
                        task.status === "Done"
                          ? "text-muted-foreground line-through"
                          : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.status === "In Progress" && (
                      <Badge>In Progress</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
