"use client";

import { useState } from 'react';
import { generateArticleOutline, AIContentOutlineToolOutput } from '@/ai/flows/ai-content-outline-tool';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Plus, CheckCircle2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

const OutlineGenerator = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIContentOutlineToolOutput | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    try {
      const output = await generateArticleOutline({ financialSubject: topic });
      setResult(output);
    } catch (error) {
      console.error('Failed to generate outline:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      <Card className="glass-card shadow-2xl border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold">AI Content Strategist</CardTitle>
          <p className="text-muted-foreground mt-2 font-body">
            Generate SEO-optimized financial article outlines and key topics instantly.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="flex gap-2">
            <Input
              placeholder="Enter a financial subject (e.g., Yield Curve Inversion)..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="h-12 text-lg"
              disabled={loading}
            />
            <Button size="lg" type="submit" disabled={loading || !topic.trim()} className="h-12 px-8 font-bold">
              {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Sparkles className="mr-2 h-5 w-5" />}
              {loading ? 'Analyzing...' : 'Generate'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-6">
              <Card className="glass-card overflow-hidden">
                <CardHeader className="bg-primary/5 border-b">
                  <Badge variant="outline" className="w-fit mb-2 text-primary border-primary">SEO Optimized Title</Badge>
                  <CardTitle className="text-2xl font-headline text-foreground">{result.articleTitle}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <h3 className="font-bold mb-4 flex items-center">
                    <Plus className="mr-2 h-4 w-4 text-primary" />
                    Structured Article Outline
                  </h3>
                  <Accordion type="multiple" className="w-full">
                    {result.outline.map((section, idx) => (
                      <AccordionItem key={idx} value={`item-${idx}`} className="border-b-white/5">
                        <AccordionTrigger className="font-bold text-base hover:text-primary py-4">
                          {section.heading}
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 pl-4 border-l-2 border-primary/20">
                            {section.subSections.map((sub, sIdx) => (
                              <li key={sIdx} className="text-muted-foreground flex items-start gap-2 py-1">
                                <CheckCircle2 className="h-4 w-4 text-secondary mt-1 shrink-0" />
                                <span>{sub}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            <div className="w-full md:w-80 shrink-0 space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg font-headline">Key SEO Topics</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {result.keyTopics.map((topic, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors">
                      {topic}
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              <div className="p-6 rounded-xl bg-primary/10 border border-primary/20">
                <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Ready to Publish?
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  This outline is ready for the Content Engine. You can now assign this to a specialized creator.
                </p>
                <Button variant="outline" className="w-full font-bold border-primary/30 hover:bg-primary/10">
                  Export to CMS
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutlineGenerator;
