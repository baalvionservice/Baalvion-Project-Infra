
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

const teamMembers = [
  { name: 'Alex Johnson', role: 'Founder & CEO', avatar: 'https://picsum.photos/seed/team1/100/100' },
  { name: 'Brenda Smith', role: 'Chief Technology Officer', avatar: 'https://picsum.photos/seed/team2/100/100' },
  { name: 'Charlie Brown', role: 'Head of Product', avatar: 'https://picsum.photos/seed/team3/100/100' },
  { name: 'Diana Prince', role: 'Lead UX Designer', avatar: 'https://picsum.photos/seed/team4/100/100' },
];

export default function AboutPage() {
  return (
    <div className="bg-background">
      <div className="container py-12 md:py-20">
        {/* Hero Section */}
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-6xl">
            The Future of Hiring is Based on Proof, Not Resumes.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            SkillMatch Pro was founded on a simple premise: the best way to know if someone can do a job is to see them do the work. We're on a mission to create a more equitable and effective hiring landscape by replacing outdated credential-based screening with real-world, performance-based skill verification.
          </p>
        </div>

        {/* Mission & Vision Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="relative aspect-video">
                <Image src="https://picsum.photos/seed/about1/600/400" alt="Team collaborating" layout="fill" objectFit="cover" className="rounded-lg" />
            </div>
            <div className="flex flex-col justify-center">
                <h2 className="font-headline text-3xl font-bold">Our Mission</h2>
                <p className="mt-4 text-muted-foreground">To build a global ecosystem where talent is recognized by proven ability, not by the words on a resume. We empower companies to make smarter hiring decisions with objective data, and we enable candidates to showcase their true skills and potential, regardless of their background.</p>
            </div>
        </div>

        {/* Team Section */}
        <div className="mt-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight">
              Meet the Team
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We're a passionate group of technologists, recruiters, and innovators dedicated to fixing the hiring process.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member) => (
              <Card key={member.name} className="text-center">
                <CardContent className="pt-6">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <p className="text-sm text-primary">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
