import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Careers",
  description: "Open roles at Baalvion Intelligence.",
};

const openRoles = [
  { title: "Founding Backend Engineer", location: "Remote", team: "Platform" },
  { title: "ML Engineer, Entity Resolution", location: "Remote", team: "Intelligence" },
  { title: "Developer Relations Engineer", location: "Remote", team: "Growth" },
];

export default function CareersPage() {
  return (
    <div className="section-container section-y">
      <div className="mx-auto max-w-2xl text-center">
        <span className="eyebrow mx-auto w-fit justify-center">Careers</span>
        <h1>Help us build the intelligence layer for the open web</h1>
      </div>

      <div className="mx-auto mt-14 max-w-2xl space-y-4">
        {openRoles.map((role) => (
          <Card key={role.title} className="glow-card">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <h3 className="text-base font-semibold text-foreground">{role.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {role.team} &middot; {role.location}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <Link
                href="/company/contact"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Apply
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
