import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

interface ResearchInputProps {
  onSearch: (query: string) => void;
  loading?: boolean;
}

export const ResearchInput = ({ onSearch, loading }: ResearchInputProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Query the Analyst Engine..."
        className="h-12 bg-card/50 border-primary/20 rounded-xl"
      />
      <Button disabled={loading} className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
        Analyze
      </Button>
    </form>
  );
};
