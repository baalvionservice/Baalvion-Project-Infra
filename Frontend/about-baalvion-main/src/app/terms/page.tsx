import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

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

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="max-w-4xl mx-auto p-8">
                <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
                <p className="text-gray-600 leading-relaxed">
                    By using this site, you agree to our terms and conditions. This page outlines your rights and responsibilities.
                </p>
            </main>
            <Footer />
        </div>
    );
}
