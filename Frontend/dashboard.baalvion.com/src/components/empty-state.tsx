
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface EmptyStateProps {
  title: string;
  description: string;
  actionButton: React.ReactNode;
  imageSeed: string;
  imageHint: string;
}

export default function EmptyState({ title, description, actionButton, imageSeed, imageHint }: EmptyStateProps) {
  return (
    <Card className="flex items-center justify-center p-8 lg:p-16">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
            <Image 
                src={`https://picsum.photos/seed/${imageSeed}/300/200`}
                alt={title}
                width={300}
                height={200}
                className="rounded-lg object-cover"
                data-ai-hint={imageHint}
            />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 text-muted-foreground">{description}</p>
        <div className="mt-6">
          {actionButton}
        </div>
      </div>
    </Card>
  );
}
