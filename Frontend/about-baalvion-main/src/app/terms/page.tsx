import { sanitizeRichHtml } from "@/lib/sanitize";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { cmsGetSitePage } from "@/lib/cms";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Terms of Service | Baalvion",
    description: "Terms of service for Baalvion global trade infrastructure platform.",
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: "https://about.baalvion.com/terms",
    },
};

const FALLBACK_BODY =
    "<p>By using this site, you agree to our terms and conditions. This page outlines your rights and responsibilities.</p>";

export default async function TermsPage() {
    // Body is authored by platform admins in the central CMS console (first-party,
    // trusted source), falling back to the built-in text if the CMS is unreachable.
    const page = await cmsGetSitePage("terms");
    const title = page?.title || "Terms of Service";
    const bodyHtml = page?.bodyHtml || FALLBACK_BODY;

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="max-w-4xl mx-auto p-8">
                <h1 className="text-3xl font-bold mb-4">{title}</h1>
                <div
                    className="prose prose-gray max-w-none text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(bodyHtml) }}
                />
            </main>
            <Footer />
        </div>
    );
}
