"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { placementService } from "@/services/placement.service";
import { collegeService } from "@/services/college.service";
import { studentService } from "@/services/student.service";
import type { Placement, Student, College } from "@/types/placement.types";
import {
  Building2,
  Users,
  GraduationCap,
  CheckCircle2,
  ShieldCheck,
  ClipboardList,
  Handshake,
  Star,
  ArrowRight,
  Award,
  FileCheck,
  BarChart3,
  Briefcase,
  Globe,
  Layers,
  Search,
  UserCheck,
  TrendingUp,
  Lock,
} from "lucide-react";

interface EnrichedPlacement extends Placement {
  studentName?: string;
  collegeType?: "1" | "2" | "3";
  documents?: {
    offerLetterUrl?: string;
    idProofUrl?: string;
  };
}

interface Stats {
  totalStudents: number;
  totalCompanies: number;
  successRate: string;
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do colleges join the TalentOS Campus Placement Program?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Colleges apply through the TalentOS platform by submitting institutional details, accreditation documents, and a placement cell contact. Our team verifies eligibility and onboards the institution, typically within 5–7 business days. Once onboarded, colleges receive a dedicated placement dashboard.",
      },
    },
    {
      "@type": "Question",
      name: "What does 'verified placement' mean on TalentOS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A verified placement means the offer letter, student ID proof, and company appointment letter have all been cross-verified by the TalentOS compliance team. Records are tamper-evident and publicly visible on the placement board, ensuring zero fraud in reported statistics.",
      },
    },
    {
      "@type": "Question",
      name: "Is the TalentOS Campus Placement platform free for students?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Students registered through their college never pay a platform fee. Creating a TalentOS student profile, appearing in recruiter searches, completing skill assessments, and receiving offer notifications are all free.",
      },
    },
    {
      "@type": "Question",
      name: "How do recruiters and employers access campus talent?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Employers register as verified recruiters on TalentOS. After KYC verification, they gain access to a talent pool filtered by college tier, skill scores, branch, graduation year, and GPA. Employers can post JDs, schedule drives, and manage offers directly from the recruiter dashboard.",
      },
    },
    {
      "@type": "Question",
      name: "What are Type 1, Type 2, and Type 3 colleges?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TalentOS categorises partner institutions into three tiers based on accreditation, placement history, and employer preference signals. Type 1 includes premier research universities and IITs/NITs-equivalent institutions; Type 2 covers established state and autonomous colleges; Type 3 includes emerging and regional colleges building their employer network. All tiers have equal access to recruiters — the categorisation helps employers set expectations, not limit opportunity.",
      },
    },
    {
      "@type": "Question",
      name: "How do I get started as a student or college on TalentOS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Students can register directly at jobs.baalvion.com/register or ask their placement officer to enrol the institution. Colleges can contact us through the Contact page. Recruiters can sign up and request verification through the Careers portal.",
      },
    },
  ],
};

export default function PlacementPage() {
  const [placements, setPlacements] = useState<EnrichedPlacement[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalCompanies: 0,
    successRate: "0%",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [approvedPlacements, allStudents, allColleges] = await Promise.all([
          placementService.getApprovedPlacements(),
          studentService.getAllStudents(),
          collegeService.getAllColleges(),
        ]);

        const studentsMap = new Map(allStudents.map((s) => [s.id, s]));
        const collegesMap = new Map(allColleges.map((c: any) => [c.id, c]));

        const enrichedPlacements = approvedPlacements.map((p) => {
          const student = studentsMap.get(p.studentId);
          const college = student ? collegesMap.get(student.collegeId) : undefined;
          return {
            ...p,
            studentName: student?.name || "Unknown Student",
            collegeType: college?.type || "3",
            documents: student?.documents,
          };
        });

        setPlacements(enrichedPlacements);

        const uniqueCompanies = new Set(enrichedPlacements.map((p) => p.companyName)).size;
        setStats({
          totalStudents: enrichedPlacements.length,
          totalCompanies: uniqueCompanies,
          successRate: "100%",
        });
      } catch (error) {
        console.error("Failed to fetch placement data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-muted/40 font-sans">
      {/* FAQ JSON-LD (static, safe to use dangerouslySetInnerHTML for structured data) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section className="bg-primary text-primary-foreground py-20 px-8 text-center">
        <div className="container mx-auto">
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">
            Baalvion TalentOS · Campus Placement Program
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 mt-2">
            Verified Campus Placements
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto opacity-90">
            India&apos;s trusted education-to-employment platform — connecting colleges,
            students, and global recruiters through a document-verified, merit-based
            placement ecosystem across Type&nbsp;1, Type&nbsp;2, and Type&nbsp;3
            institutions.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/onboarding/student">Join as a Student</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <Link href="/onboarding/college">Onboard Your College</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Stats Section ────────────────────────────────────────── */}
      <section className="py-12 px-8">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-4xl font-bold text-primary">{stats.totalStudents}+</h2>
              <p className="text-muted-foreground mt-2">Students Placed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-4xl font-bold text-primary">{stats.totalCompanies}+</h2>
              <p className="text-muted-foreground mt-2">Partner Companies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-4xl font-bold text-primary">{stats.successRate}</h2>
              <p className="text-muted-foreground mt-2">Placement Success Rate</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── How Campus Placement Works ───────────────────────────── */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              How Campus Placement Works
            </h2>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
              A transparent, end-to-end process — from college onboarding to
              verified offer letter — managed entirely on TalentOS.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-0.5 bg-border" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                {
                  icon: <Building2 className="h-7 w-7 text-primary" />,
                  step: "01",
                  title: "College Onboarding",
                  description:
                    "Institutions apply and complete KYC. We verify accreditation, placement records, and assign a college tier.",
                },
                {
                  icon: <UserCheck className="h-7 w-7 text-primary" />,
                  step: "02",
                  title: "Student Verification",
                  description:
                    "Students register via their college. ID proof and academic credentials are verified before the profile goes live.",
                },
                {
                  icon: <ClipboardList className="h-7 w-7 text-primary" />,
                  step: "03",
                  title: "Skill Assessment",
                  description:
                    "Students complete domain and aptitude assessments. Scores are added to their public recruiter-facing profile.",
                },
                {
                  icon: <Search className="h-7 w-7 text-primary" />,
                  step: "04",
                  title: "Recruiter Matching",
                  description:
                    "Employers search and filter verified talent by tier, branch, score, and graduation year. Drives are scheduled on-platform.",
                },
                {
                  icon: <Award className="h-7 w-7 text-primary" />,
                  step: "05",
                  title: "Verified Offer & Placement",
                  description:
                    "Offer letters are submitted to TalentOS. Our compliance team verifies them and publishes the placement record publicly.",
                },
              ].map((item) => (
                <div key={item.step} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full bg-background border-2 border-primary shadow-sm mb-4">
                    {item.icon}
                    <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Audience Value Sections ──────────────────────────────── */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Built for Every Stakeholder
            </h2>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
              TalentOS delivers measurable value to colleges, recruiters, and students
              — all from one verified platform.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* For Colleges */}
            <Card className="flex flex-col border-t-4 border-t-blue-500">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    Colleges &amp; Universities
                  </Badge>
                </div>
                <CardTitle className="text-xl">Automate Your Placement Cell</CardTitle>
                <CardDescription>
                  Stop managing placements through spreadsheets. TalentOS gives your
                  institution a real-time, compliance-ready placement system.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {[
                    { icon: <BarChart3 className="h-4 w-4" />, text: "Real-time placement analytics and dashboards" },
                    { icon: <FileCheck className="h-4 w-4" />, text: "Automated offer letter verification and record-keeping" },
                    { icon: <Globe className="h-4 w-4" />, text: "Access to a national employer network across sectors" },
                    { icon: <TrendingUp className="h-4 w-4" />, text: "Historical placement trends to benchmark performance" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 text-blue-600">{item.icon}</span>
                      <span className="text-muted-foreground">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <Button asChild className="w-full">
                  <Link href="/onboarding/college">
                    Register Your Institution <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* For Recruiters */}
            <Card className="flex flex-col border-t-4 border-t-green-500">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Briefcase className="h-6 w-6 text-green-600" />
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    Recruiters &amp; Employers
                  </Badge>
                </div>
                <CardTitle className="text-xl">Hire Verified Campus Talent</CardTitle>
                <CardDescription>
                  Skip screening noise. TalentOS delivers a pre-verified, skill-assessed
                  talent pool ready for faster, compliant hiring.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {[
                    { icon: <ShieldCheck className="h-4 w-4" />, text: "Pre-verified student IDs and academic credentials" },
                    { icon: <Layers className="h-4 w-4" />, text: "Filter talent across Type 1, 2, and 3 college tiers" },
                    { icon: <ClipboardList className="h-4 w-4" />, text: "Skill assessment scores available upfront" },
                    { icon: <FileCheck className="h-4 w-4" />, text: "End-to-end offer management with compliance trail" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 text-green-600">{item.icon}</span>
                      <span className="text-muted-foreground">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-6 pt-0 flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link href="/contact">
                    Become a Hiring Partner <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/careers/open-positions">View Open Positions</Link>
                </Button>
              </div>
            </Card>

            {/* For Students */}
            <Card className="flex flex-col border-t-4 border-t-purple-500">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-purple-600" />
                  </div>
                  <Badge variant="outline" className="text-purple-600 border-purple-300">
                    Students
                  </Badge>
                </div>
                <CardTitle className="text-xl">Launch Your Career the Right Way</CardTitle>
                <CardDescription>
                  Build a verified profile, demonstrate your skills, and receive
                  real — not inflated — placement offers from verified companies.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {[
                    { icon: <UserCheck className="h-4 w-4" />, text: "Verified identity and academic credential badge" },
                    { icon: <Star className="h-4 w-4" />, text: "Domain and aptitude skill assessment scores" },
                    { icon: <Award className="h-4 w-4" />, text: "Transparent offer letters with zero hidden terms" },
                    { icon: <Handshake className="h-4 w-4" />, text: "Internship-to-placement pathway with tracked progress" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 text-purple-600">{item.icon}</span>
                      <span className="text-muted-foreground">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-6 pt-0 flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link href="/onboarding/student">
                    Create Your Profile <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/careers/internship-program">Explore Internships</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── College Tiers Explainer ──────────────────────────────── */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Understanding College Tiers
            </h2>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
              TalentOS categorises partner institutions into three tiers to help
              recruiters set context — not to limit opportunity. Every student,
              from every tier, competes on verified merit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                tier: "Type 1",
                label: "Premier Institutions",
                color: "border-t-amber-500",
                badgeColor: "text-amber-700 border-amber-400 bg-amber-50",
                icon: <Award className="h-8 w-8 text-amber-600" />,
                description:
                  "Nationally ranked research universities, IIT/NIT-equivalent engineering institutions, and premier management schools with a strong global employer network and high average CTC track record.",
                traits: ["Strong research pedigree", "High employer brand recall", "National NIRF / NAAC A++ accreditation"],
              },
              {
                tier: "Type 2",
                label: "Established Colleges",
                color: "border-t-sky-500",
                badgeColor: "text-sky-700 border-sky-400 bg-sky-50",
                icon: <GraduationCap className="h-8 w-8 text-sky-600" />,
                description:
                  "Well-established state and autonomous colleges with consistent placement records, strong alumni networks, and accreditation from NAAC, NBA, or equivalent bodies.",
                traits: ["Consistent placement history", "NAAC A / NBA accredited", "Broad industry linkages"],
              },
              {
                tier: "Type 3",
                label: "Emerging Institutions",
                color: "border-t-emerald-500",
                badgeColor: "text-emerald-700 border-emerald-400 bg-emerald-50",
                icon: <TrendingUp className="h-8 w-8 text-emerald-600" />,
                description:
                  "Regional and emerging colleges actively building their employer relationships. TalentOS gives these institutions the same tools and employer access as Type 1 — levelling the playing field through merit.",
                traits: ["Growing employer network", "Access to all TalentOS recruiters", "Skill-score-first matching"],
              },
            ].map((item) => (
              <Card key={item.tier} className={`border-t-4 ${item.color}`}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    {item.icon}
                    <Badge variant="outline" className={item.badgeColor}>
                      {item.tier}
                    </Badge>
                  </div>
                  <CardTitle>{item.label}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {item.traits.map((trait) => (
                      <li key={trait} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        {trait}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8 max-w-xl mx-auto">
            College tier is a contextual label, not a gate. Every verified student
            profile is searchable by all TalentOS recruiters.
          </p>
        </div>
      </section>

      {/* ─── Placement Table ──────────────────────────────────────── */}
      <section className="py-12 px-8 container mx-auto">
        <h2 className="text-3xl font-semibold text-center mb-8 text-foreground">
          Recent Approved Placements
        </h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>College Type</TableHead>
                <TableHead>Documents</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-12 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ))
              ) : placements.length > 0 ? (
                placements.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.studentName}</TableCell>
                    <TableCell>{p.companyName}</TableCell>
                    <TableCell>{p.role}</TableCell>
                    <TableCell>Type {p.collegeType}</TableCell>
                    <TableCell>
                      {p.documents?.offerLetterUrl && (
                        <Link
                          href={p.documents.offerLetterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm mr-2"
                        >
                          Offer Letter
                        </Link>
                      )}
                      {p.documents?.idProofUrl && (
                        <Link
                          href={p.documents.idProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          ID Proof
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No approved placements to show.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* ─── Why Verified Placements Matter ──────────────────────── */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Why Verified Placements Matter
            </h2>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
              Inflated placement statistics are a widespread problem in Indian higher
              education. TalentOS is built to end that — permanently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <ShieldCheck className="h-8 w-8 text-primary" />,
                title: "Zero Fraud Policy",
                description:
                  "Every placement record is backed by document verification. Unverified or contested offers are never published.",
              },
              {
                icon: <FileCheck className="h-8 w-8 text-primary" />,
                title: "Document-Verified Offers",
                description:
                  "Offer letters and student ID proofs are cross-checked by our compliance team before a placement appears on the public board.",
              },
              {
                icon: <Lock className="h-8 w-8 text-primary" />,
                title: "Tamper-Evident Records",
                description:
                  "Placement records are immutable once verified. No retroactive edits or deletion by colleges or recruiters.",
              },
              {
                icon: <Users className="h-8 w-8 text-primary" />,
                title: "Transparent to All Stakeholders",
                description:
                  "Students, colleges, and employers all see the same verified data. No hidden aggregation or cherry-picking.",
              },
            ].map((item) => (
              <Card key={item.title} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-3">{item.icon}</div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 p-6 bg-background rounded-xl border flex flex-col md:flex-row items-center gap-6 max-w-3xl mx-auto">
            <div className="flex-shrink-0 text-primary">
              <ShieldCheck className="h-12 w-12" />
            </div>
            <div>
              <p className="font-semibold text-lg">
                TalentOS is operated by Baalvion Industries Pvt Ltd
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                A technology company committed to building trustworthy, transparent
                infrastructure for India&apos;s employment ecosystem. Learn more at{" "}
                <a
                  href="https://www.baalvion.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  baalvion.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ──────────────────────────────────────────── */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground mt-4">
              Everything colleges, students, and recruiters need to know before
              joining TalentOS.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {[
              {
                value: "q1",
                question: "How do colleges join the TalentOS Campus Placement Program?",
                answer:
                  "Colleges apply through the TalentOS platform by submitting institutional details, accreditation documents, and a placement cell contact. Our team verifies eligibility and onboards the institution within 5–7 business days. Once onboarded, colleges receive a dedicated placement dashboard. Contact us via the Contact page to start the process.",
              },
              {
                value: "q2",
                question: "What does 'verified placement' mean on TalentOS?",
                answer:
                  "A verified placement means the offer letter, student ID proof, and company appointment letter have all been cross-verified by the TalentOS compliance team. Records are tamper-evident and publicly visible on the placement board, ensuring zero fraud in reported statistics. No placement is published without passing document verification.",
              },
              {
                value: "q3",
                question: "Is TalentOS free for students?",
                answer:
                  "Yes. Students registered through their college never pay a platform fee. Creating a TalentOS student profile, appearing in recruiter searches, completing skill assessments, and receiving offer notifications are completely free for students.",
              },
              {
                value: "q4",
                question: "How do recruiters and employers access campus talent?",
                answer:
                  "Employers register as verified recruiters on TalentOS. After KYC verification, they gain access to a talent pool filtered by college tier, skill scores, branch, graduation year, and GPA. Employers can post job descriptions, schedule placement drives, and manage offer letters directly from the recruiter dashboard.",
              },
              {
                value: "q5",
                question: "What are Type 1, Type 2, and Type 3 colleges?",
                answer:
                  "TalentOS categorises partner institutions into three tiers based on accreditation level, placement history, and employer preference signals. Type 1 includes premier research universities and IITs/NITs-equivalent institutions. Type 2 covers established state and autonomous colleges. Type 3 includes emerging and regional colleges actively building their employer network. All tiers have equal access to recruiters — the categorisation helps employers set context, not limit opportunity.",
              },
              {
                value: "q6",
                question: "How do I get started?",
                answer:
                  "Students can register directly at jobs.baalvion.com/register or ask their placement officer to enrol the institution. Colleges can reach us through the Contact page. Recruiters and employers can sign up and request verification through the Careers portal.",
              },
            ].map((item) => (
              <AccordionItem key={item.value} value={item.value}>
                <AccordionTrigger className="text-left font-medium">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm">
              Still have questions?{" "}
              <Link href="/faqs" className="text-primary hover:underline font-medium">
                Browse the full FAQ
              </Link>{" "}
              or{" "}
              <Link href="/contact" className="text-primary hover:underline font-medium">
                contact our team
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ─── Explore More ─────────────────────────────────────────── */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight">Explore More</h2>
            <p className="text-muted-foreground mt-2">
              Related resources across the Baalvion TalentOS platform.
            </p>
          </div>

          <Separator className="mb-10" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                href: "/careers",
                label: "Careers at Baalvion",
                description: "Browse roles at Baalvion Industries Pvt Ltd.",
                icon: <Briefcase className="h-5 w-5" />,
              },
              {
                href: "/careers/open-positions",
                label: "Open Positions",
                description: "Live job openings across all departments.",
                icon: <ClipboardList className="h-5 w-5" />,
              },
              {
                href: "/careers/internship-program",
                label: "Internship Program",
                description: "Structured internships with a placement pathway.",
                icon: <GraduationCap className="h-5 w-5" />,
              },
              {
                href: "/about",
                label: "About Baalvion",
                description: "Our mission, values, and leadership team.",
                icon: <Building2 className="h-5 w-5" />,
              },
              {
                href: "/about/team",
                label: "Our Team",
                description: "Meet the people building TalentOS.",
                icon: <Users className="h-5 w-5" />,
              },
              {
                href: "/register",
                label: "Student Registration",
                description: "Create your verified TalentOS student profile.",
                icon: <UserCheck className="h-5 w-5" />,
              },
              {
                href: "/login",
                label: "Log In",
                description: "Access your placement dashboard.",
                icon: <Lock className="h-5 w-5" />,
              },
              {
                href: "https://www.baalvion.com",
                label: "Baalvion Corporate",
                description: "Learn about our broader business.",
                icon: <Globe className="h-5 w-5" />,
                external: true,
              },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group flex items-start gap-3 p-4 rounded-lg border bg-background hover:border-primary hover:shadow-sm transition-all"
              >
                <span className="mt-0.5 text-muted-foreground group-hover:text-primary transition-colors">
                  {link.icon}
                </span>
                <div>
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">
                    {link.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────── */}
      <section className="bg-background py-16 px-8 text-center">
        <div className="container mx-auto">
          <h2 className="text-3xl font-semibold mb-4">Ready to Transform Campus Hiring?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Whether you are a college seeking placement automation, an employer hunting
            verified talent, or a student building your career — TalentOS is your platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/onboarding/college">Onboard Your College</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/onboarding/student">Join as a Student</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
