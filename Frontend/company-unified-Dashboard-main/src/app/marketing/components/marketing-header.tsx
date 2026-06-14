"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const BaalvionLogo = () => (
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 120 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-auto"
  >
    <path
      d="M13.298 2.09999C6.206 2.09999 0.5 7.80599 0.5 14.898C0.5 21.99 6.206 27.696 13.298 27.696C18.686 27.696 22.844 24.594 24.542 20.07L19.226 17.844C18.266 20.124 16.04 21.822 13.298 21.822C9.59 21.822 6.62 18.792 6.62 14.898C6.62 11.004 9.59 7.97399 13.298 7.97399C16.04 7.97399 18.266 9.67199 19.226 11.952L24.542 9.72599C22.844 5.19599 18.686 2.09999 13.298 2.09999ZM32.4132 2.65199V27.148H38.5332V16.894L43.8492 27.148H49.1652L43.4592 16.204C47.3532 15.31 49.8552 11.806 49.8552 7.82799C49.8552 3.84999 46.8852 0.983989 42.1752 0.983989H32.4132V2.65199ZM38.5332 6.15999V8.51799H42.5832C43.9152 8.51799 44.8752 7.62399 44.8752 6.46399C44.8752 5.30399 43.9152 4.40799 42.5832 4.40799H38.5332V6.15999ZM57.5133 27.148H72.2913V21.274H63.6333V2.65199H57.5133V27.148ZM79.6233 27.148H85.7433V2.65199H79.6233V27.148ZM92.1783 2.09999C87.4683 2.09999 83.6403 5.75999 83.6403 10.944L83.7123 18.864C83.7123 24.048 87.4683 27.708 92.1783 27.708C96.8883 27.708 100.716 24.048 100.716 18.864L100.644 10.944C100.644 5.75999 96.8883 2.09999 92.1783 2.09999ZM92.1783 21.93C90.2223 21.93 89.6523 20.052 89.6523 18.864L89.5803 10.944C89.5803 9.75599 90.2223 7.87799 92.1783 7.87799C94.1343 7.87799 94.7043 9.75599 94.7043 10.944L94.7763 18.864C94.7763 20.052 94.1343 21.93 92.1783 21.93ZM104.918 27.148H119.696V21.274H111.038V2.65199H104.918V27.148Z"
      className="fill-foreground"
    />
  </svg>
);

export default function MarketingHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 left-0 right-0 z-50 p-4 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/marketing">
          <BaalvionLogo />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="#features" className="hover:text-primary">
            Features
          </Link>
          <Link href="#pricing" className="hover:text-primary">
            Pricing
          </Link>
          <Link href="/docs/help" className="hover:text-primary">
            Docs
          </Link>
          <Link href="#blog" className="hover:text-primary">
            Blog
          </Link>
        </nav>
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/signup">Get Started</Link>
          </Button>
        </div>
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col gap-6 text-lg font-medium mt-8">
                <Link
                  href="#features"
                  onClick={() => setIsOpen(false)}
                  className="hover:text-primary"
                >
                  Features
                </Link>
                <Link
                  href="#pricing"
                  onClick={() => setIsOpen(false)}
                  className="hover:text-primary"
                >
                  Pricing
                </Link>
                <Link
                  href="/docs/help"
                  onClick={() => setIsOpen(false)}
                  className="hover:text-primary"
                >
                  Docs
                </Link>
                <Link
                  href="#blog"
                  onClick={() => setIsOpen(false)}
                  className="hover:text-primary"
                >
                  Blog
                </Link>
                <hr />
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
