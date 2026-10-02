import Image from "next/image";
import Link from "next/link";

export function BaalFooter() {
  return (
    <footer className="py-12 border-t border-[#2b2538] bg-[#09080c] mt-auto">
      <div className="container mx-auto px-6 text-center">
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="relative w-64 h-32 overflow-hidden rounded-md border border-white/5 opacity-70 hover:opacity-100 transition-opacity">
            <Image 
              src="/logo.jpg" 
              alt="Baalvion Logo" 
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
        <div className="flex justify-center gap-6 mb-6 text-sm text-gray-500">
          <Link href="/forum" className="hover:text-red-400 transition-colors">Forums</Link>
          <Link href="/marketplace" className="hover:text-red-400 transition-colors">Marketplace</Link>
          <Link href="/about" className="hover:text-red-400 transition-colors">About</Link>
          <Link href="/contact" className="hover:text-red-400 transition-colors">Contact</Link>
        </div>
        <p className="text-sm text-gray-600 font-sans tracking-wide">
          © {new Date().getFullYear()} BAALVION NETWORK. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  )
}
