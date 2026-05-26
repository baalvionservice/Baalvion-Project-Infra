'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Text } from '@/design-system/typography/text';
import { 
  Image as ImageIcon, 
  Video, 
  Upload, 
  Search, 
  Filter, 
  MoreVertical,
  Download,
  Trash2,
  FileText,
  Loader2
} from 'lucide-react';
import { getMediaItems, MediaItem } from '@/services/mock-api/media';
import Image from 'next/image';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

/**
 * Media Library Page.
 * Grid-based digital asset manager for articles and platform content.
 */
export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const response = await getMediaItems();
        setMedia(response.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredMedia = media.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Text variant="h1" className="text-3xl font-bold">Media Intelligence Hub</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Manage visual assets and data visualization resources.
          </Text>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Upload className="mr-2 h-4 w-4" /> Upload Media
        </Button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search assets..." 
            className="pl-10 bg-background/50" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px] bg-background/50">
              <Filter className="mr-2 h-3.5 w-3.5" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Media</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="newest">
            <SelectTrigger className="w-[140px] bg-background/50">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="size">Largest Size</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="py-40 flex justify-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedia.map((item) => (
            <Card key={item.id} className="glass-card group overflow-hidden flex flex-col">
              <div className="relative aspect-video bg-muted/50 overflow-hidden">
                {item.type === 'image' ? (
                  <Image 
                    src={item.url} 
                    alt={item.name} 
                    fill 
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/40">
                    <Video className="h-12 w-12 text-primary/50" />
                  </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 bg-black/60 hover:bg-black/80 backdrop-blur-sm border-none">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Download</DropdownMenuItem>
                      <DropdownMenuItem><FileText className="mr-2 h-4 w-4" /> Edit Metadata</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white uppercase">
                    {item.type}
                  </span>
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm truncate" title={item.name}>{item.name}</CardTitle>
              </CardHeader>
              <CardFooter className="p-4 pt-0 mt-auto flex justify-between text-[10px] text-muted-foreground">
                <span>{item.category}</span>
                <span>{item.size || 'N/A'}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredMedia.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed rounded-3xl">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <Text variant="h3">No media found</Text>
          <Text variant="bodySmall" className="text-muted-foreground">Try adjusting your search or filters.</Text>
        </div>
      )}
    </div>
  );
}
