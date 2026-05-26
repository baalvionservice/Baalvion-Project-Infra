import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Briefcase, Clock, FileText, BarChart2 } from "lucide-react";
import { RoleWelcomeBanner } from "@/components/role-welcome-banner";
import KanbanBoard from "@/components/kanban-board";

export default function CoFounderView() {
  return (
    <div className="space-y-8 min-w-0">
      <RoleWelcomeBanner />
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Co-Founder Dashboard
        </h1>
        <p className="text-muted-foreground">Manage your shared ventures.</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Shared Businesses
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              TechCorp India, FinanceHub USA
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Joint Monthly Revenue
            </CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$9.1M</div>
            <p className="text-xs text-muted-foreground">
              +14.2% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Decisions
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Signed Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">This quarter</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <KanbanBoard />
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Pending Decisions</CardTitle>
              <CardDescription>
                Items needing your review and approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <Clock className="h-5 w-5 mt-1 text-yellow-500" />
                  <div>
                    <p className="font-medium">Approve Q3 Marketing Budget</p>
                    <p className="text-sm text-muted-foreground">
                      TechCorp India
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Clock className="h-5 w-5 mt-1 text-yellow-500" />
                  <div>
                    <p className="font-medium">Review New York Office Lease</p>
                    <p className="text-sm text-muted-foreground">
                      FinanceHub USA
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Clock className="h-5 w-5 mt-1 text-yellow-500" />
                  <div>
                    <p className="font-medium">Finalize ESOP Allocation</p>
                    <p className="text-sm text-muted-foreground">
                      TechCorp India
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
