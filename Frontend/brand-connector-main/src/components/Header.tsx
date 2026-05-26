import { RocketIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { Button } from './ui'

const Header = () => {

    const navLinks = [
        { name: 'Features', href: '#features' },
        { name: 'Status', href: '/status' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'LeaderBoard', href: '/leaderboard' }
    ]
    return (
        <section className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-background/80 backdrop-blur-md z-50" >
            <Link className="flex items-center justify-center" href="/">
                <div className="bg-primary p-1.5 rounded-lg mr-2">
                    <RocketIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <span className="font-headline font-bold text-xl tracking-tight text-slate-900">Baalvion <span className="text-primary">Connect</span></span>
            </Link>
            <nav className="ml-auto flex gap-4 sm:gap-6 items-center text-sm font-medium" aria-label="Landing Page Navigation">
                {
                    navLinks.map((link) => (
                        <Link key={link.name} className="hover:text-primary transition-colors hidden md:inline-flex" href={link.href}>{link.name}</Link>
                    ))
               }
                <Link className="hover:text-primary transition-colors" href="/auth/login">Login</Link>
                <Link href="/auth/signup">
                    <Button size="sm" className="rounded-full">Get Started</Button>
                </Link>
            </nav>
        </section >
    )
}

export default Header