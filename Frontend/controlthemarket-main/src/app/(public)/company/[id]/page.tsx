import { getCompany, getTasksByCompany, getUsers } from "@/lib/api";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  MapPin,
  Eye,
  Users,
  CheckCircle,
  BarChart2,
  Star,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { TaskCard } from "@/app/(app)/candidate/tasks/task-card";

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);

  if (!company) {
    notFound();
  }

  // Mock data for this profile page
  const tasks = await getTasksByCompany(company.id);
  const activeTasks = tasks.filter((t) => t.status === "published");
  const candidatesEvaluated = 128; // mock
  const hiringSuccessRate = 15; // mock percentage

  const topHires = (await getUsers())
    .filter((u) => u.role === "candidate")
    .slice(0, 3);

  return (
    <div className="flex-1 bg-muted/20 pb-20">
      {/* Header section */}
      <div className="relative h-48 w-full bg-muted">
        <Image
          src={`https://picsum.photos/seed/${company.id}/1200/300`}
          alt={`${company.name} banner`}
          fill
          style={{ objectFit: 'cover' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container -mt-16">
        {/* Main company info card */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={company.logoUrl} alt={company.name} />
              <AvatarFallback>{company.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="font-headline text-3xl font-bold">
                {company.name}
              </h1>
              <p className="text-muted-foreground">{company.description}</p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {company.industry && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{company.industry}</span>
                  </div>
                )}
                {company.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{company.location}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Follow (Mock)</Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Hiring Activity Section */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Hiring Activity</CardTitle>
                <CardDescription>
                  An overview of {company.name}'s engagement on the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="text-center">
                  <CardHeader>
                    <CardTitle>{activeTasks.length}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Open Roles</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardHeader>
                    <CardTitle>{candidatesEvaluated}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Candidates Evaluated
                    </p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardHeader>
                    <CardTitle>{hiringSuccessRate}%</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Success Rate
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Active Challenges Section */}
            <Card>
              <CardHeader>
                <CardTitle>Active Challenges</CardTitle>
                <CardDescription>
                  Explore open roles and prove your skills by completing one of
                  these tasks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {company.id === "company-3" && (
                  <div className="mb-8 rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
                    <h3 className="font-headline text-xl font-semibold">
                      Senior Backend Engineer Opportunity
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      Baalvion Inc. is seeking expert backend developers for a
                      unique virtual job simulation. Prove your skills by
                      building core modules for our next-gen investor platform.
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/demos/baalvion/hiring-portal">
                        Start the Simulation{" "}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
                {activeTasks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeTasks.map((task) => (
                      <Card key={task.id} className="flex flex-col">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {task.title}
                          </CardTitle>
                          <CardDescription>{task.roleCategory}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{task.difficulty}</Badge>
                            {task.taskTypes?.slice(0, 2).map((type) => (
                              <Badge key={type} variant="secondary">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button asChild className="w-full">
                            <Link href={`/candidate/tasks/${task.id}`}>
                              View Task <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {company.name} has no active tasks at the moment. Check back
                    soon!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel: Top Hires */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Top Hires (Mock)</CardTitle>
                <CardDescription>
                  A showcase of talent hired through SkillMatch Pro.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topHires.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.profile?.avatarUrl}
                          alt={user.name}
                        />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Frontend Developer
                        </p>
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/candidate/${user.id}`}>Profile</Link>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
