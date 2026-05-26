import { Instagram, Linkedin, Rocket, Twitter } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { Button, Input } from './ui'

const Footer = () => {
    return (
        <footer className="w-full py-20 bg-slate-950 text-slate-400 border-t border-white/5" role="contentinfo">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-6">
                        <Link className="flex items-center" href="/">
                            <Rocket className="h-8 w-8 text-primary mr-2" aria-hidden="true" />
                            <span className="font-headline font-bold text-2xl text-white tracking-tight">Baalvion</span>
                        </Link>
                        <p className="max-w-xs text-sm leading-relaxed">
                            The leading influencer marketplace connecting visionary brands with world-class creative talent through AI-powered performance matching.
                        </p>
                        <div className="flex gap-4">
                            <Link href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all" aria-label="Visit our Twitter">
                                <Twitter className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all" aria-label="Visit our LinkedIn">
                                <Linkedin className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all" aria-label="Visit our Instagram">
                                <Instagram className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-headline font-bold text-white mb-6 uppercase tracking-wider text-xs">Platform</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="#" className="hover:text-primary transition-colors">Campaign Discovery</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">AI Matching Engine</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Pricing Plans</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Creator Showcase</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Performance Analytics</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-headline font-bold text-white mb-6 uppercase tracking-wider text-xs">Company</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="#" className="hover:text-primary transition-colors">About Baalvion</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Success Stories</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Support Center</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="font-headline font-bold text-white mb-6 uppercase tracking-wider text-xs">Stay Updated</h4>
                        <p className="text-sm">Subscribe to our monthly newsletter for the latest creator trends and market insights.</p>
                        <form className="flex flex-col gap-2">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl"
                                aria-label="Email address for newsletter"
                            />
                            <Button className="w-full rounded-xl font-bold bg-primary hover:bg-primary/90 text-white">Subscribe</Button>
                        </form>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                    <p>© 2024 Baalvion Connect. All rights reserved. Built for the future of creator marketing.</p>
                    <div className="flex gap-6">
                        <Link href="#" className="hover:text-white transition-colors">Status</Link>
                        <Link href="#" className="hover:text-white transition-colors">Security</Link>
                        <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer