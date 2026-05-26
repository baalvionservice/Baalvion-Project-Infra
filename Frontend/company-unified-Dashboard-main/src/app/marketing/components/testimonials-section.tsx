import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const testimonials = [
  {
    name: 'Aarav Shah',
    title: 'CEO, NexGenTech India',
    quote: "Baalvion gave us complete visibility across all 3 of our businesses. It replaced 6 different tools.",
    avatarId: "user-alex-davis"
  },
  {
    name: 'Emily Ross',
    title: 'Co-Founder, CloudScale UK',
    quote: "The equity management alone is worth the price. Our investors love the portal.",
    avatarId: "user-priya-sharma"
  },
  {
    name: 'Mohammed Al Rashid',
    title: 'MD, GulfVentures UAE',
    quote: "Finally a dashboard that understands multi-country operations. Game-changer.",
    avatarId: "user-fatima-al-fassi"
  }
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">Loved by Founders Worldwide</h2>
          <p className="mt-2 text-lg text-muted-foreground">Don't just take our word for it. Here's what they're saying.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => {
            const userImage = PlaceHolderImages.find(p => p.id === testimonial.avatarId);
            return (
              <Card key={index} className="flex flex-col">
                <CardContent className="p-6 flex-grow">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-lg font-medium">"{testimonial.quote}"</blockquote>
                </CardContent>
                <CardHeader className="flex-row gap-4 items-center pt-0">
                  <Avatar>
                    {userImage && <AvatarImage src={userImage.imageUrl} />}
                    <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{testimonial.name}</CardTitle>
                    <CardDescription>{testimonial.title}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  );
}
