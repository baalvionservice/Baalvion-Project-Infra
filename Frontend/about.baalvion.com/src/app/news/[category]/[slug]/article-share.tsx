'use client';

import { Share2, Link2, Twitter, Facebook, Linkedin, Mail } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

/**
 * Client-only share control. Extracted so the surrounding article page can be a
 * Server Component (server-rendered HTML + per-article metadata for crawlers).
 */
export function ArticleShare({ emailLabel = 'Email Brief' }: { emailLabel?: string }) {
  const { toast } = useToast();

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Strategic Link Copied',
        description: 'The article destination has been stored in your clipboard buffer.',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors text-xs font-bold text-gray-700 outline-none">
          <Share2 className="w-3 h-3 text-[#FF9900]" /> Share
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white border-gray-100 shadow-2xl rounded-md p-1">
        <DropdownMenuItem onClick={handleCopyLink} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-sm">
          <Link2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">Copy Link</span>
        </DropdownMenuItem>
        <div className="h-px bg-gray-50 my-1" />
        <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-sm">
          <Twitter className="w-4 h-4 text-[#1DA1F2]" />
          <span className="text-sm font-bold text-gray-700">Twitter / X</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-sm">
          <Facebook className="w-4 h-4 text-[#4267B2]" />
          <span className="text-sm font-bold text-gray-700">Facebook</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-sm">
          <Linkedin className="w-4 h-4 text-[#0077B5]" />
          <span className="text-sm font-bold text-gray-700">LinkedIn</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-sm">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-700">{emailLabel}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
