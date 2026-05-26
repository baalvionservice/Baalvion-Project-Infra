import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';

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
        className="fill-muted-foreground"
      />
    </svg>
  );

export default function MarketingFooter() {
  return (
    <footer className="bg-muted">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-1">
            <BaalvionLogo />
            <p className="mt-4 text-sm text-muted-foreground">The Global Business Operating System.</p>
             <div className="mt-4 flex space-x-4">
                <Link href="#" className="text-muted-foreground hover:text-foreground"><Github /></Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground"><Twitter /></Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground"><Linkedin /></Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Product</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="#features" className="text-muted-foreground hover:text-foreground">Features</Link></li>
              <li><Link href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Updates</Link></li>
              <li><Link href="#blog" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Company</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">About</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Careers</Link></li>
              <li><Link href="/marketing/demo" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Resources</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/docs/api" className="text-muted-foreground hover:text-foreground">API Docs</Link></li>
              <li><Link href="/docs/help" className="text-muted-foreground hover:text-foreground">Help Center</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} Baalvion, Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
