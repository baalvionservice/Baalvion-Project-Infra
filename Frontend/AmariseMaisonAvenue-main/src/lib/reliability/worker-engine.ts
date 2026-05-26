/**
 * @fileOverview Institutional Background Worker & Retry Engine
 * Simulates real-world cron jobs, async processing, and exponential backoff recovery.
 */

import { BackgroundJob, JobStatus, JobType } from '../types';

class WorkerEngine {
  private static instance: WorkerEngine;
  private jobs: BackgroundJob[] = [];

  private constructor() {}

  public static getInstance(): WorkerEngine {
    if (!WorkerEngine.instance) {
      WorkerEngine.instance = new WorkerEngine();
    }
    return WorkerEngine.instance;
  }

  /**
   * Enqueue a new background task
   */
  public enqueue(params: {
    type: JobType;
    payload: any;
    country?: string;
    maxRetries?: number;
  }) {
    const job: BackgroundJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: params.type,
      payload: params.payload,
      status: 'pending',
      retryCount: 0,
      maxRetries: params.maxRetries || 3,
      nextRunAt: new Date().toISOString(),
      country: params.country || 'global',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.jobs.unshift(job);
    console.log(`%c[WORKER ENQUEUED] ⏳ ${job.type} | ID: ${job.id}`, 'color: #7E3F98; font-weight: bold;');
    
    // Simulate immediate processing for mock environment
    setTimeout(() => this.processJob(job.id), 1500);
    
    return job.id;
  }

  /**
   * Process a single background job
   */
  public async processJob(jobId: string) {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job || job.status === 'completed' || job.status === 'running') return;

    job.status = 'running';
    job.updatedAt = new Date().toISOString();

    try {
      console.log(`%c[WORKER RUNNING] 🏃 ${job.type}...`, 'color: #3B82F6;');
      
      // Simulated Logic per Type
      await this.executeJobLogic(job);

      job.status = 'completed';
      console.log(`%c[WORKER SUCCESS] ✅ ${job.type} completed.`, 'color: #10b981; font-weight: bold;');
    } catch (error: any) {
      console.error(`%c[WORKER FAILURE] ❌ ${job.type}: ${error.message}`, 'color: #ef4444;');
      this.handleFailure(job, error.message);
    } finally {
      job.updatedAt = new Date().toISOString();
    }
  }

  private async executeJobLogic(job: BackgroundJob) {
    // Artificial latency
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulated fail-points for demo
    if (job.type === 'NOTIF_DISPATCH' && Math.random() > 0.8) {
      throw new Error("SMTP_GATEWAY_TIMEOUT");
    }
    
    if (job.type === 'PAYMENT_VERIFY' && Math.random() > 0.9) {
      throw new Error("GATEWAY_WEBHOOK_CONGESTION");
    }
  }

  private handleFailure(job: BackgroundJob, error: string) {
    job.error = error;
    
    if (job.retryCount < job.maxRetries) {
      job.retryCount++;
      job.status = 'retrying';
      
      // Exponential Backoff Logic: delay = 2^count * 2000ms
      const delay = Math.pow(2, job.retryCount) * 2000;
      const nextRun = new Date(Date.now() + delay);
      job.nextRunAt = nextRun.toISOString();

      console.log(`%c[RETRY ENGINE] 🔄 Retrying ${job.type} in ${delay}ms (Attempt ${job.retryCount})`, 'color: #F59E0B;');
      setTimeout(() => this.processJob(job.id), delay);
    } else {
      job.status = 'failed';
      console.error(`%c[DEAD LETTER] 💀 Job ${job.id} exhausted all retries. Moved to DLQ.`, 'color: #000; background: #ef4444; padding: 2px;');
    }
  }

  public getRegistry() {
    return this.jobs;
  }
}

export const workerEngine = WorkerEngine.getInstance();
