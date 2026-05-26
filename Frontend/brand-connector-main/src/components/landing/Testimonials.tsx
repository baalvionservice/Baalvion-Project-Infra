'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle2, Quote } from 'lucide-react';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const TESTIMONIALS = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Creator',
    company: 'TechTalks with Sarah',
    avatar: 'https://picsum.photos/seed/tc1/100/100',
    rating: 5,
    quote: "Baalvion changed my career. The AI matching isn't just a buzzword—it actually found brands that perfectly align with my tech audience. I've seen a 40% increase in my long-term partnerships.",
  },
  {
    id: '2',
    name: 'David Miller',
    role: 'Brand',
    company: 'Lumina Gadgets',
    avatar: 'https://picsum.photos/seed/tb1/100/100',
    rating: 5,
    quote: "We used to spend weeks vetting influencers. With Baalvion, we launched a campaign in 48 hours. The verified ROI tracking is a game-changer for our marketing budget transparency.",
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    role: 'Creator',
    company: 'StyleByElena',
    avatar: 'https://picsum.photos/seed/tc2/100/100',
    rating: 5,
    quote: "The escrow system gives me peace of mind. I know the funds are secured before I start filming. It makes the professional relationship so much smoother and more respectful.",
  },
  {
    id: '4',
    name: 'Marcus Thorne',
    role: 'Brand',
    company: 'Velocity Sports',
    avatar: 'https://picsum.photos/seed/tb2/100/100',
    rating: 4,
    quote: "Finding high-engagement fitness creators in specific regions used to be a nightmare. Baalvion's location filters and audience data are incredibly accurate. Highly recommended.",
  },
  {
    id: '5',
    name: 'Priya Kapoor',
    role: 'Creator',
    company: 'The Wanderlust Soul',
    avatar: 'https://picsum.photos/seed/tc3/100/100',
    rating: 5,
    quote: "I love the community hub! I've connected with other creators for collaborations and learned so much about pricing my work fairly. It's more than just a marketplace.",
  },
  {
    id: '6',
    name: 'Jonathan Wu',
    role: 'Brand',
    company: 'EcoStream',
    avatar: 'https://picsum.photos/seed/tb3/100/100',
    rating: 5,
    quote: "Our sustainability campaign needed creators who actually cared about the environment. Baalvion's niche targeting helped us find authentic voices that resonated with our core values.",
  },
  {
    id: '7',
    name: 'Sophie Laurent',
    role: 'Creator',
    company: 'Kitchen Stories',
    avatar: 'https://picsum.photos/seed/tc4/100/100',
    rating: 5,
    quote: "The platform is so intuitive. From applying to campaigns to submitting deliverables, everything is streamlined. It allows me to focus on what I do best: creating content.",
  },
  {
    id: '8',
    name: 'Robert Vance',
    role: 'Brand',
    company: 'Modern Home',
    avatar: 'https://picsum.photos/seed/tb4/100/100',
    rating: 5,
    quote: "The analytics dashboard provides insights we never had before. Seeing the direct correlation between creator posts and our sales lift has made influencer marketing our top acquisition channel.",
  }
];

export function Testimonials() {
  const [api, setApi] = useState<CarouselApi>();

  // Simple autoplay implementation
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api]);

  return (
    <section id="testimonials" className="py-24 bg-slate-900 text-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl mb-4">
              Loved by Brands and Creators Alike
            </h2>
            <p className="text-slate-400 text-lg max-w-[700px] mx-auto">
              Join thousands of successful collaborators who are growing their impact and ROI on Baalvion Connect.
            </p>
          </motion.div>
        </div>

        <div className="relative px-12">
          <Carousel
            setApi={setApi}
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full max-w-6xl mx-auto"
          >
            <CarouselContent className="-ml-4">
              {TESTIMONIALS.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="h-full"
                  >
                    <Card className="bg-slate-800/50 border-slate-700 h-full flex flex-col shadow-xl">
                      <CardContent className="p-8 flex flex-col h-full">
                        <div className="flex items-center gap-1 mb-6">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} 
                            />
                          ))}
                        </div>
                        
                        <div className="relative mb-8 flex-1">
                          <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/20 -z-10" />
                          <p className="text-slate-300 italic leading-relaxed relative z-10">
                            "{testimonial.quote}"
                          </p>
                        </div>

                        <div className="flex items-center gap-4 mt-auto pt-6 border-t border-slate-700/50">
                          <Avatar className="h-12 w-12 border-2 border-primary/30">
                            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-sm">{testimonial.name}</span>
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                            </div>
                            <span className="text-xs text-slate-400 font-medium">{testimonial.company}</span>
                            <Badge 
                              variant="outline" 
                              className={`mt-1.5 w-fit text-[10px] py-0 px-2 border-none rounded-full ${
                                testimonial.role === 'Brand' ? 'bg-indigo-500/10 text-indigo-300' : 'bg-emerald-500/10 text-emerald-300'
                              }`}
                            >
                              {testimonial.role}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white -left-12" />
              <CarouselNext className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white -right-12" />
            </div>
          </Carousel>
        </div>
        
        <div className="flex justify-center gap-8 mt-16 opacity-30 grayscale contrast-125">
          {/* Trust badges/logos would go here */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-24 bg-white/20 rounded-md" />
          ))}
        </div>
      </div>
    </section>
  );
}
