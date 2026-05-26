'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bot, Cpu, DollarSign, Zap, TrendingUp, AlertCircle,
  Activity, Database, Code2, CheckCircle2, XCircle, Clock,
  FlaskConical, BarChart3, Layers,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useUIStore } from '@/lib/store/uiStore';
import { aiApi } from '@/lib/api/ai';
import { formatCurrency, formatNumber, formatRelative } from '@/lib/utils/format';
import type { AiModel, AiAgent, Prompt, InferenceQueueItem } from '@/lib/types/ai.types';
import { cn } from '@/lib/utils/cn';

// ── Provider badge ────────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  openai:    'bg-green-500/10 text-green-400 border-green-500/30',
  google:    'bg-blue-500/10 text-blue-400 border-blue-500/30',
  mistral:   'bg-purple-500/10 text-purple-400 border-purple-500/30',
  cohere:    'bg-pink-500/10 text-pink-400 border-pink-500/30',
  local:     'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

function ProviderBadge({ provider }: { provider: string }) {
  return (
    <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5 capitalize', PROVIDER_COLORS[provider] ?? '')}>
      {provider}
    </Badge>
  );
}

// ── Model card ────────────────────────────────────────────────────────────────

function ModelCard({ model }: { model: AiModel }) {
  const errorPct = model.callsToday > 0 ? (model.errorRate * 100).toFixed(1) : '0';
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className={cn(
        'mt-0.5 h-8 w-8 rounded-md border flex items-center justify-center shrink-0',
        model.enabled ? 'bg-muted' : 'bg-muted/40 opacity-60'
      )}>
        <Cpu className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{model.name}</span>
          <ProviderBadge provider={model.provider} />
          {!model.enabled && <Badge variant="secondary" className="text-[10px] h-4 px-1">Disabled</Badge>}
        </div>
        <p className="text-xs text-muted-foreground font-mono">{model.modelId}</p>
        <div className="flex gap-4 mt-1 text-[11px] text-muted-foreground">
          <span>{(model.contextWindow / 1000).toFixed(0)}k ctx</span>
          <span>${model.costPer1kInput}/$1k in</span>
          <span>${model.costPer1kOutput}/$1k out</span>
        </div>
      </div>
      <div className="shrink-0 text-right space-y-0.5">
        <p className="text-xs font-medium">{formatNumber(model.callsToday)} calls</p>
        <p className="text-[11px] text-muted-foreground">{formatNumber(model.tokensToday)} tokens</p>
        <p className={cn('text-[11px]', parseFloat(errorPct) > 5 ? 'text-red-400' : 'text-muted-foreground')}>
          {errorPct}% errors
        </p>
      </div>
    </div>
  );
}

// ── Agent row ─────────────────────────────────────────────────────────────────

function AgentRow({ agent }: { agent: AiAgent }) {
  const typeColors: Record<string, string> = {
    assistant: 'text-blue-400',
    workflow:  'text-purple-400',
    rag:       'text-green-400',
    tool_use:  'text-orange-400',
  };
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className={cn('h-8 w-8 rounded-md border flex items-center justify-center shrink-0 bg-muted')}>
        <Bot className={cn('h-4 w-4', typeColors[agent.type] ?? 'text-muted-foreground')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{agent.name}</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1 capitalize">{agent.type.replace('_', ' ')}</Badge>
          {!agent.enabled && <Badge variant="outline" className="text-[10px] h-4 px-1">Disabled</Badge>}
        </div>
        <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
      </div>
      <div className="shrink-0 text-right text-[11px] text-muted-foreground">
        <p>{formatNumber(agent.callsToday)} calls</p>
        <p>{agent.avgLatencyMs}ms avg</p>
        <p className={agent.successRate >= 0.95 ? 'text-green-400' : 'text-yellow-400'}>
          {(agent.successRate * 100).toFixed(1)}% ok
        </p>
      </div>
    </div>
  );
}

// ── Queue item row ────────────────────────────────────────────────────────────

function QueueRow({ item }: { item: InferenceQueueItem }) {
  const statusIcon = {
    queued:     <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
    processing: <Activity className="h-3.5 w-3.5 text-blue-400 animate-pulse" />,
    completed:  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />,
    failed:     <XCircle className="h-3.5 w-3.5 text-red-400" />,
  }[item.status];

  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-0 text-xs">
      <div className="shrink-0">{statusIcon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[11px] text-muted-foreground truncate">{item.id.substring(0, 12)}…</p>
        <p className="text-muted-foreground">{item.modelId}</p>
      </div>
      <div className="shrink-0 text-right text-muted-foreground">
        {item.latencyMs && <p>{item.latencyMs}ms</p>}
        <p>{formatRelative(item.createdAt)}</p>
      </div>
    </div>
  );
}

// ── Prompt row ────────────────────────────────────────────────────────────────

function PromptRow({ prompt }: { prompt: Prompt }) {
  const statusColor = { active: 'text-green-400 border-green-500', draft: 'text-yellow-400 border-yellow-500', archived: 'text-muted-foreground' }[prompt.status];
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{prompt.name}</span>
          <Badge variant="outline" className={cn('text-[10px] h-4 px-1', statusColor)}>{prompt.status}</Badge>
          <Badge variant="secondary" className="text-[10px] h-4 px-1">v{prompt.version}</Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{prompt.description}</p>
        <div className="flex gap-1 mt-1 flex-wrap">
          {prompt.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px] h-4 px-1">{t}</Badge>
          ))}
        </div>
      </div>
      <div className="shrink-0 text-right text-[11px] text-muted-foreground">
        <p>{prompt.variables.length} vars</p>
        <p>{formatRelative(prompt.updatedAt)}</p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AiPage() {
  const { setBreadcrumbs } = useUIStore();
  const [tab, setTab] = useState('models');

  useEffect(() => { setBreadcrumbs([{ label: 'AI Operations' }]); }, [setBreadcrumbs]);

  const { data: models,    isLoading: modelsLoading }  = useQuery({ queryKey: ['ai-models'],   queryFn: () => aiApi.listModels().then((r) => r.data.data)   });
  const { data: agents,    isLoading: agentsLoading }  = useQuery({ queryKey: ['ai-agents'],   queryFn: () => aiApi.listAgents({ page: 1, limit: 50 }).then((r) => r.data.data) });
  const { data: prompts,   isLoading: promptsLoading } = useQuery({ queryKey: ['ai-prompts'],  queryFn: () => aiApi.listPrompts({ page: 1, limit: 50 }).then((r) => r.data.data) });
  const { data: queue,     isLoading: queueLoading }   = useQuery({ queryKey: ['ai-queue'],    queryFn: () => aiApi.listInferenceQueue({ page: 1, limit: 20 }).then((r) => r.data.data), refetchInterval: 5000 });
  const { data: cost }                                 = useQuery({ queryKey: ['ai-cost'],     queryFn: () => aiApi.getCostSummary('30d').then((r) => r.data.data) });
  const { data: collections }                          = useQuery({ queryKey: ['ai-vectors'],  queryFn: () => aiApi.listCollections().then((r) => r.data.data) });

  const modelList:    AiModel[]          = models ?? [];
  const agentList:    AiAgent[]          = agents?.data ?? [];
  const promptList:   Prompt[]           = prompts?.data ?? [];
  const queueList:    InferenceQueueItem[] = queue?.data ?? [];

  const enabledModels  = modelList.filter((m) => m.enabled).length;
  const activeAgents   = agentList.filter((a) => a.enabled).length;
  const activePrompts  = promptList.filter((p) => p.status === 'active').length;
  const processingJobs = queueList.filter((q) => q.status === 'processing').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Operations"
        description="Models, agents, prompts, inference queue, vector store, and cost analytics"
        actions={
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3 text-green-500" /> Live queue
          </Badge>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Models',   value: `${enabledModels}/${modelList.length}`,  icon: Cpu,       color: 'text-blue-500'   },
          { label: 'Active Agents',   value: `${activeAgents}/${agentList.length}`,   icon: Bot,       color: 'text-purple-500' },
          { label: 'Active Prompts',  value: activePrompts,                           icon: Code2,     color: 'text-green-500'  },
          { label: 'Spend (30d)',     value: cost ? formatCurrency(cost.totalUsd) : '—', icon: DollarSign, color: 'text-orange-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Icon className={cn('h-4 w-4', color)} />
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="queue">
            Inference Queue
            {processingJobs > 0 && (
              <Badge variant="default" className="ml-1.5 text-[10px] h-4 px-1 bg-blue-600">{processingJobs}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="vectors">Vector Store</TabsTrigger>
          <TabsTrigger value="cost">Cost</TabsTrigger>
        </TabsList>

        {/* Models */}
        <TabsContent value="models">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Cpu className="h-4 w-4" /> AI Models
              </CardTitle>
              <CardDescription>Provider models and their usage metrics (today)</CardDescription>
            </CardHeader>
            <CardContent>
              {modelsLoading ? (
                <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : modelList.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground"><Cpu className="h-8 w-8 opacity-30" /><p className="text-sm">No models configured</p></div>
              ) : (
                <div>{modelList.map((m) => <ModelCard key={m.id} model={m} />)}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents */}
        <TabsContent value="agents">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><Bot className="h-4 w-4" /> AI Agents</CardTitle>
              </div>
              <CardDescription>Configured agents with their type and performance</CardDescription>
            </CardHeader>
            <CardContent>
              {agentsLoading ? (
                <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : agentList.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground"><Bot className="h-8 w-8 opacity-30" /><p className="text-sm">No agents configured</p></div>
              ) : (
                <div>{agentList.map((a) => <AgentRow key={a.id} agent={a} />)}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prompts */}
        <TabsContent value="prompts">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><Code2 className="h-4 w-4" /> Prompt Registry</CardTitle>
                <Button size="sm" variant="outline" className="text-xs gap-1.5">New Prompt</Button>
              </div>
            </CardHeader>
            <CardContent>
              {promptsLoading ? (
                <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : promptList.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground"><Code2 className="h-8 w-8 opacity-30" /><p className="text-sm">No prompts registered</p></div>
              ) : (
                <div>{promptList.map((p) => <PromptRow key={p.id} prompt={p} />)}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inference Queue */}
        <TabsContent value="queue">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Queue stats */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              {(['queued', 'processing', 'completed', 'failed'] as const).map((status) => {
                const count = queueList.filter((q) => q.status === status).length;
                const colorMap = { queued: 'text-muted-foreground', processing: 'text-blue-400', completed: 'text-green-400', failed: 'text-red-400' };
                return (
                  <Card key={status}>
                    <CardContent className="pt-4 pb-4">
                      <p className="text-xs text-muted-foreground capitalize">{status}</p>
                      <p className={cn('text-2xl font-bold', colorMap[status])}>{count}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Live Queue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {queueLoading ? (
                    <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : queueList.length === 0 ? (
                    <div className="flex flex-col items-center py-8 gap-2 text-muted-foreground"><Zap className="h-6 w-6 opacity-30" /><p className="text-sm">Queue is empty</p></div>
                  ) : (
                    <div>{queueList.map((q) => <QueueRow key={q.id} item={q} />)}</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Vector Store */}
        <TabsContent value="vectors">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Database className="h-4 w-4" /> Vector Collections</CardTitle>
              <CardDescription>Embedding collections for RAG pipelines</CardDescription>
            </CardHeader>
            <CardContent>
              {!collections?.length ? (
                <div className="flex flex-col items-center py-10 gap-2 text-muted-foreground">
                  <Database className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No vector collections</p>
                </div>
              ) : (
                <div>
                  {collections.map((col) => (
                    <div key={col.id} className="flex items-center gap-3 py-3 border-b last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{col.name}</span>
                          <Badge variant="secondary" className="text-[10px] h-4 px-1">{col.dimensions}d</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{col.model} · {formatNumber(col.documentCount)} docs</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{(col.sizeBytes / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost */}
        <TabsContent value="cost">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4" /> Cost by Provider (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                {!cost ? (
                  <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(cost.byProvider).sort(([, a], [, b]) => b - a).map(([provider, amount]) => {
                      const pct = (amount / cost.totalUsd) * 100;
                      return (
                        <div key={provider}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <ProviderBadge provider={provider} />
                            </div>
                            <span className="text-xs font-medium">{formatCurrency(amount)}</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t flex justify-between">
                      <span className="text-sm font-medium">Total</span>
                      <span className="text-sm font-bold">{formatCurrency(cost.totalUsd)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>30-day forecast</span>
                      <span className="font-medium text-foreground">{formatCurrency(cost.forecastUsd)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Cost by Model (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                {!cost ? (
                  <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(cost.byModel).sort(([, a], [, b]) => b - a).slice(0, 8).map(([model, amount]) => {
                      const pct = (amount / cost.totalUsd) * 100;
                      return (
                        <div key={model}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs truncate max-w-[160px]">{model}</span>
                            <span className="text-xs font-medium shrink-0 ml-2">{formatCurrency(amount)}</span>
                          </div>
                          <Progress value={pct} className="h-1" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
