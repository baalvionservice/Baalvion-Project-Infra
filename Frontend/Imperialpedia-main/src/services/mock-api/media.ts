import { ApiResponse } from '@/types';

/**
 * @fileOverview Mock service for media library assets.
 */

export interface MediaItem {
  id: string;
  name: string;
  type: "image" | "video";
  url: string;
  uploadedAt: string;
  category?: string;
  size?: string;
}

const mockMedia: MediaItem[] = [
  { 
    id: 'med-1', 
    name: 'Yield Curve Inversion Chart', 
    type: 'image', 
    url: 'https://picsum.photos/seed/chart1/800/600', 
    uploadedAt: '2024-03-01T10:00:00Z', 
    category: 'Analysis',
    size: '1.2MB'
  },
  { 
    id: 'med-2', 
    name: 'Compound Interest Infographic', 
    type: 'image', 
    url: 'https://picsum.photos/seed/info1/800/600', 
    uploadedAt: '2024-03-05T11:30:00Z', 
    category: 'Education',
    size: '850KB'
  },
  { 
    id: 'med-3', 
    name: 'Platform Hero Background', 
    type: 'image', 
    url: 'https://picsum.photos/seed/hero/1920/1080', 
    uploadedAt: '2024-02-20T09:00:00Z', 
    category: 'System',
    size: '2.4MB'
  },
  { 
    id: 'med-4', 
    name: 'Market Summary - Q1 2024', 
    type: 'video', 
    url: '#', 
    uploadedAt: '2024-03-10T15:00:00Z', 
    category: 'Multimedia',
    size: '45MB'
  },
];

export const getMediaItems = async (): Promise<ApiResponse<MediaItem[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: mockMedia,
    status: 200,
  };
};
