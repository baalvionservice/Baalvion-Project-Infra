import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export const metadata = {
    title: "Privacy Policy | Baalvion",
    description: "Privacy policy for Baalvion global trade infrastructure platform.",
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: "https://about.baalvion.com/privacy",
    },
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="max-w-4xl mx-auto p-8">
                <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
                <p className="text-gray-600 leading-relaxed">
                    This page describes how we collect, use, and protect your personal data. We are committed to transparency and strong data privacy protections.
                </p>
            </main>
            <Footer />
        </div>
    );
}
