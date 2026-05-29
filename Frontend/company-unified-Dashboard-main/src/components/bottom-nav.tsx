'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Grid3x3, Building, PiggyBank, Users, MoreHorizontal, LogOut, Briefcase } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { navItems } from '@/lib/nav-config';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@/lib/types';
import { useState, useEffect } from 'react';

const mainNav = [
  { href: '/dashboard', icon: Grid3x3, label: 'Dashboard' },
  { href: '/businesses', icon: Briefcase, label: 'Businesses' },
  { href: '/finance', icon: PiggyBank, label: 'Finance' },
  { href: '/employees', icon: Users, label: 'Employees' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const role = searchParams.get('role');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  useEffect(() => { setCurrentUser(getCurrentUser()); }, []);
  const userImage = PlaceHolderImages.find(img => img.id === currentUser?.imageId);

  const secondaryNav = navItems.filter(
    item => !mainNav.some(mainItem => mainItem.href === item.href || (item.href !== '/dashboard' && item.href.startsWith(mainItem.href + '/')))
  );

  return (
    <div className="md:hidden">
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-background/95 p-2 backdrop-blur-sm">
        {mainNav.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={{ pathname: item.href}} className={cn("flex flex-col items-center gap-1 rounded-md p-2 text-xs font-medium", isActive ? 'text-primary' : 'text-muted-foreground')}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-1 rounded-md p-2 text-xs font-medium text-muted-foreground">
              <MoreHorizontal className="h-5 w-5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80%]">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
             <div className="grid gap-4 py-4 overflow-y-auto h-full pb-20">
                <div className="flex items-center gap-3 rounded-lg p-3 bg-muted">
                    <Avatar className="h-10 w-10">
                        {userImage && <AvatarImage src={userImage.imageUrl} />}
                        <AvatarFallback>{currentUser?.name?.charAt(0) ?? '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{currentUser?.name ?? ''}</p>
                        <p className="text-sm text-muted-foreground">{currentUser?.email ?? ''}</p>
                    </div>
                </div>
                <Separator />
                <nav className="grid gap-2">
                    {secondaryNav.map(item => (
                        <Link key={item.href} href={{ pathname: item.href, query: { role: role || undefined } }} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                    <Separator />
                     <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-destructive transition-all hover:bg-destructive/10">
                        <LogOut className="h-4 w-4" />
                        Log Out
                    </Link>
                </nav>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
