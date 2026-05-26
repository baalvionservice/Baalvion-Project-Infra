'use client'; // Make it a client component

import { useState, useEffect, useRef } from 'react'; // import hooks
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import CodeBlock from '@/components/code-block';
import { Button } from '@/components/ui/button';
import apiDocsData from '@/lib/data/api-docs.json';
import { cn } from '@/lib/utils';

export default function ApiDocsPage() {
  const { categories } = apiDocsData;
  const mainRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      if (!mainRef.current) return;
      const sections = mainRef.current.querySelectorAll('section[id]');
      let currentId = '';
      sections.forEach(section => {
        const sectionTop = (section as HTMLElement).offsetTop;
        if (mainRef.current!.scrollTop >= sectionTop - 150) {
          currentId = section.id;
        }
      });
      const articles = mainRef.current.querySelectorAll('article[id]');
       articles.forEach(article => {
        const articleTop = (article as HTMLElement).offsetTop;
        if (mainRef.current!.scrollTop >= articleTop - 150) {
          currentId = article.id;
        }
      });
      setActiveId(currentId);
    };

    const mainEl = mainRef.current;
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll);
      handleScroll(); // set initial active id
      return () => mainEl.removeEventListener('scroll', handleScroll);
    }
  }, [categories]);

  const getEndpointId = (endpoint: {method: string, path: string}) => `${endpoint.method.toLowerCase()}${endpoint.path.replace(/\//g, '-').replace(/\{|\}/g, '')}`;

  return (
    <div className="flex min-h-screen">
      <aside className="fixed top-0 left-0 h-screen w-64 border-r bg-muted/40 p-6 hidden lg:block overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">API Reference</h2>
        <nav className="space-y-4">
          {categories.map((category) => (
            <div key={category.name}>
              <a href={`#${category.name.toLowerCase()}`} className={cn("font-semibold text-sm mb-2 block", activeId.startsWith(category.name.toLowerCase()) && "text-primary")}>
                {category.name}
              </a>
              <ul className="space-y-1 text-sm text-muted-foreground border-l pl-4">
                {category.endpoints.map((endpoint) => {
                  const endpointId = getEndpointId(endpoint);
                  return (
                    <li key={endpoint.path}>
                      <a href={`#${endpointId}`} className={cn("hover:text-primary block py-1", activeId === endpointId && "text-primary font-medium")}>
                        {endpoint.path}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <main ref={mainRef} className="flex-1 lg:ml-64 p-8 overflow-y-auto h-screen">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight">API Documentation</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Welcome to the Baalvion API. Integrate your applications with our platform.
            </p>
          </header>

          {categories.map((category) => (
            <section key={category.name} id={category.name.toLowerCase()} className="mb-16 scroll-mt-20">
              <h2 className="text-2xl font-bold border-b pb-2 mb-6">
                {category.name}
              </h2>
              <div className="space-y-12">
                {category.endpoints.map((endpoint) => (
                  <article key={endpoint.path} id={getEndpointId(endpoint)} className="scroll-mt-20">
                    <div className="flex items-center gap-2">
                      <Badge className={endpoint.method === 'GET' ? 'bg-blue-600' : endpoint.method === 'POST' ? 'bg-green-600' : 'bg-orange-500'}>{endpoint.method}</Badge>
                      <h3 className="text-xl font-semibold font-mono">{endpoint.path}</h3>
                    </div>
                    <p className="text-muted-foreground mt-2">{endpoint.description}</p>
                    
                    {endpoint.parameters.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-2">Parameters</h4>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Required</TableHead>
                                        <TableHead>Description</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {endpoint.parameters.map(param => (
                                        <TableRow key={param.name}>
                                            <TableCell className="font-mono text-sm">{param.name}</TableCell>
                                            <TableCell className="font-mono text-sm">{param.type}</TableCell>
                                            <TableCell>{param.required ? 'Yes' : 'No'}</TableCell>
                                            <TableCell>{param.description}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-6">
                        <h4 className="font-semibold mb-2">Example Request</h4>
                        <CodeBlock code={endpoint.request} />
                    </div>

                    <div className="mt-6">
                        <h4 className="font-semibold mb-2">Example Response</h4>
                        <CodeBlock code={endpoint.response} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
