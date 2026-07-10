'use client';

import { useEffect } from 'react';
import { Image as ImageIcon, ShieldCheck, Layers, Wand2, Copy, Gauge } from 'lucide-react';
import { ComingSoonModule } from '@/components/news-intelligence/ComingSoonModule';
import { useUIStore } from '@/lib/store/uiStore';

export default function NewsImagesPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'News Intelligence', href: '/news-intelligence' }, { label: 'Images' }]); }, [setBreadcrumbs]);

  return (
    <ComingSoonModule
      title="Image Intelligence"
      description="Licensed image sourcing, AI illustration, and per-article image management"
      requiredService="an image intelligence service + S3/CDN pipeline (not built)"
      capabilities={[
        { icon: ImageIcon, title: 'Image Library', description: 'Press-kit, government, and licensed stock images by source.' },
        { icon: Wand2, title: 'AI Illustrations', description: 'Generated illustrations for topics without licensed photos.' },
        { icon: ShieldCheck, title: 'Licensing & Copyright', description: 'License type, attribution, and expiry tracked per image.' },
        { icon: Layers, title: 'Auto Sizing', description: 'Thumbnail / medium / large / social / hero variants generated on upload.' },
        { icon: Copy, title: 'Duplicate Detection', description: 'Perceptual-hash matching against the existing library.' },
        { icon: Gauge, title: 'Optimization', description: 'Compression + CDN delivery stats per image.' },
      ]}
    />
  );
}
