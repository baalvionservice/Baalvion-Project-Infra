import type { Metadata } from 'next';
import { getCompanies } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Companies Hiring',
  description:
    'Explore innovative companies on ControlTheMarket that find top talent based on proven skills — not resumes. Browse open opportunities today.',
  alternates: {
    canonical: 'https://controlthemarket.com/companies',
  },
  openGraph: {
    url: 'https://controlthemarket.com/companies',
    title: 'Companies Hiring | ControlTheMarket',
    description:
      'Explore innovative companies finding top talent based on proven skills — not resumes.',
  },
};
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Briefcase } from 'lucide-react';

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
          Meet the Companies Hiring
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Explore innovative companies finding top talent based on proven skills.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {companies.map(company => (
          <Card key={company.id} className="flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-4">
                     <Avatar className="h-12 w-12">
                        <AvatarImage src={company.logoUrl} alt={company.name} />
                        <AvatarFallback>{company.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle>{company.name}</CardTitle>
                        {company.industry && <CardDescription>{company.industry}</CardDescription>}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-3">{company.description}</p>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full" variant="outline">
                    <Link href={`/company/${company.id}`}>
                        View Profile <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
