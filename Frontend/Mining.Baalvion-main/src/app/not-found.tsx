import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="inline-flex p-6 rounded-[2.5rem] bg-primary/5 text-primary">
            <Globe className="h-16 w-16 opacity-20" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black text-slate-900 uppercase italic tracking-tighter">404: Resource Not Found</h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              The trade record or page you are looking for does not exist in our global registry. It may have been archived or moved.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Link href="/dashboard">
              <Button className="w-full bg-primary h-12 font-bold shadow-lg">Return to Command Center</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full text-slate-400 font-bold gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
