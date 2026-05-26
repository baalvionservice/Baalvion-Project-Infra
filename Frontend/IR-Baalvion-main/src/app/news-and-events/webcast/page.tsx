"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { countries } from '@/lib/countries';

// Note: Metadata is typically handled in a parent layout or server-side page file
// for pages marked with "use client".

export default function WebcastPage() {
    const webcastImage = PlaceHolderImages.find(p => p.id === 'webcast-banner');

    return (
        <>
            <section className="bg-black text-white py-12 md:py-20">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm font-bold text-primary tracking-widest mb-2">NEWS & EVENTS</p>
                    <h1 className="text-4xl md:text-5xl font-bold">Webcast</h1>
                </div>
            </section>
            <section className="py-16 md:py-24 bg-white text-black">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-x-16 gap-y-12 items-start">
                        {/* Left Column: Event Info */}
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold">
                                Baalvion, Inc. 2025 Investor Day
                            </h2>
                            
                            {webcastImage && (
                                <div className="relative w-full aspect-[16/9]">
                                    <Image
                                        src={webcastImage.imageUrl}
                                        alt="Investor Day"
                                        data-ai-hint={webcastImage.imageHint}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-start p-4 md:p-8">
                                        <div className="bg-black text-white p-6 md:p-8">
                                            <h3 className="text-2xl md:text-3xl font-bold leading-none">Investor</h3>
                                            <h3 className="text-2xl md:text-3xl font-bold leading-none">Day</h3>
                                            <h3 className="text-2xl md:text-3xl font-bold leading-none mt-1">2025</h3>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 text-sm text-gray-700">
                                <p>
                                    Register to hear from Baalvion's leadership team on our strategy for long-term growth.
                                </p>
                                <p>
                                    Any data collected will be processed according to Baalvion's privacy policy, which can be found <Link href="#" className="text-primary underline">here</Link>.
                                </p>
                            </div>
                        </div>

                        {/* Right Column: Registration Form */}
                        <div>
                            <Card className="bg-black text-white p-6 sm:p-8 rounded-none border-none">
                                <CardHeader className="p-0 mb-6">
                                    <CardTitle className="text-xl font-normal">Complete this form to enter the webcast.</CardTitle>
                                    <CardDescription className="text-gray-400 pt-4 text-xs">(* indicates required field)</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                                        <div className="space-y-1">
                                            <Label htmlFor="first-name" className="text-xs font-normal">First Name:</Label>
                                            <Input id="first-name" className="bg-white text-black rounded-none border-black" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="last-name" className="text-xs font-normal">Last Name:</Label>
                                            <Input id="last-name" className="bg-white text-black rounded-none border-black" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="company" className="text-xs font-normal">Company:</Label>
                                            <Input id="company" className="bg-white text-black rounded-none border-black" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="email" className="text-xs font-normal">Email*:</Label>
                                            <Input id="email" type="email" className="bg-white text-black rounded-none border-black" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="location" className="text-xs font-normal">Location*:</Label>
                                            <Select>
                                                <SelectTrigger id="location" className="bg-white text-black rounded-none border-black">
                                                    <SelectValue placeholder="-" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {countries.map((country) => (
                                                        <SelectItem key={country} value={country.toLowerCase().replace(/\s/g, '-')}>
                                                            {country}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-none text-sm py-5 mt-4">
                                            Submit
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}