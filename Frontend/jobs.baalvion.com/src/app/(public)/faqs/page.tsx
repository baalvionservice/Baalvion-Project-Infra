import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
    title: "Frequently Asked Questions",
    description: "How applying at Baalvion works: your Candidate ID, tracking an application, messaging the hiring team, and what happens to your data.",
    alternates: {
        canonical: '/faqs',
    },
    openGraph: {
        title: "Frequently Asked Questions",
        description: "How applying at Baalvion works: your Candidate ID, tracking an application, messaging the hiring team, and what happens to your data.",
        url: '/faqs'
    }
};

// Answers describe what the portal actually does today. Anything not built yet stays
// off this page — a wrong answer here is worse than a missing one.
const faqs = [
    {
        question: "How do I apply for a job?",
        answer: "Open any role from Open Positions and choose Apply. The form runs in three steps — your details, your skills and projects, then verification documents — and you can only move on once the required fields on each step are filled. You do not need an account to apply; one is created for you when you do.",
    },
    {
        question: "Can I apply for jobs outside the countries you list?",
        answer: "Yes. Roles are posted in any country, state or town, so a position in a small city is listed the same way as one in a hub. You can also apply from anywhere — where you live does not limit which roles you may apply for, though a specific role may still carry its own work-authorisation requirements.",
    },
    {
        question: "What is my Candidate ID?",
        answer: "It is your permanent reference with us, in the form BAAL-C-2026-000123. You get one the moment you register or submit your first application, it appears at the top of your dashboard, and it is quoted at the foot of every email we send you. Include it whenever you write to us and we can find your file immediately.",
    },
    {
        question: "Can I apply for multiple positions?",
        answer: "Yes, and each application is assessed on its own. Your profile and Candidate ID stay the same across all of them, so you fill in your details once. You cannot submit the same role twice — a second attempt is rejected as a duplicate rather than creating a second record.",
    },
    {
        question: "How can I track my application status?",
        answer: "Sign in and open your dashboard. Every application you have submitted is listed with its current stage, and opening one shows its timeline, any scheduled interviews and the documents attached to it. The dashboard is the same record the hiring team works from — there is no separate internal status you cannot see.",
    },
    {
        question: "Can I message the hiring team about my application?",
        answer: "Yes. Each application has a message thread on its detail page. What you send reaches the hiring team by email as well as in their console, and their reply appears in the same thread and in your inbox. It keeps one conversation per application rather than a scatter of separate emails.",
    },
    {
        question: "What happens after I apply?",
        answer: "You get a confirmation email straight away with your Candidate ID. From there the team reviews the application and moves it through screening, interview and offer — every one of those moves emails you and updates the dashboard the moment it happens, so you are never waiting on a status that has already changed.",
    },
    {
        question: "What is an Employee ID, and when do I get one?",
        answer: "It is a separate number, BAAL-E-2026-00045, issued only when an application reaches hired. It arrives by email and joins your Candidate ID on your dashboard, and it is what identifies you for onboarding, payroll and IT access. If you are hired again later you keep the original number.",
    },
    {
        question: "Is my data safe?",
        answer: "Your documents are stored in private object storage and served only to you and the hiring team; your password is never held by this site, only by the central Baalvion identity service. What we collect and how long we keep it is set out in full on our Privacy Policy and Data Protection pages.",
    },
];

const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
};

export default function FAQsPage() {
    return (
        <main className="bg-background text-foreground">
            {/* FAQPage markup — this is the page that should own it, and it had none. */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
            />
            <section className="py-24 sm:py-32 bg-muted/30">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Frequently Asked Questions</h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        How applying works, what your IDs mean, and what happens to your data.
                    </p>
                </div>
            </section>
            <Separator />
            <div className="container mx-auto max-w-3xl py-16 lg:py-24">
                {/*
                  Native <details> rather than a JS accordion: the Radix version unmounts
                  its content when collapsed, so a crawler saw nine questions and not one
                  answer. This keeps every answer in the DOM, works with JavaScript off,
                  and still collapses.
                */}
                <div className="divide-y border-y">
                    {faqs.map((faq) => (
                        <details key={faq.question} className="group py-5">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                                <h2 className="text-lg font-semibold">{faq.question}</h2>
                                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                            </summary>
                            <p className="mt-3 max-w-prose leading-relaxed text-muted-foreground">
                                {faq.answer}
                            </p>
                        </details>
                    ))}
                </div>

                <p className="mt-10 text-sm text-muted-foreground">
                    Still stuck? <Link href="/contact" className="font-medium text-foreground underline">Get in touch</Link> — or,
                    if it is about a live application, message the hiring team from{' '}
                    <Link href="/my-account" className="font-medium text-foreground underline">your dashboard</Link>, which reaches them faster.
                </p>
            </div>
        </main>
    );
}
