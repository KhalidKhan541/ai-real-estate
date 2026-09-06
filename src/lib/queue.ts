export interface QueueJob<T = unknown> {
  id: string;
  data: T;
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: "exponential" | "fixed";
    delay: number;
  };
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
  timestamp?: number;
}

export interface QueueOptions {
  concurrency?: number;
  limiter?: {
    max: number;
    duration: number;
  };
  defaultJobOptions?: Partial<QueueJob>;
}

export interface JobResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export type JobHandler<T = unknown, R = unknown> = (
  job: QueueJob<T>
) => Promise<R>;

export class Queue<T = unknown> {
  private name: string;
  private jobs: QueueJob<T>[] = [];
  private processing: boolean = false;
  private handlers: Map<string, JobHandler<T>> = new Map();
  private options: QueueOptions;
  private listeners: Map<string, Set<(job: QueueJob<T>) => void>> = new Map();

  constructor(name: string, options: QueueOptions = {}) {
    this.name = name;
    this.options = options;
  }

  async add(jobData: T, options: Partial<QueueJob<T>> = {}): Promise<QueueJob<T>> {
    const job: QueueJob<T> = {
      id: `${this.name}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
      data: jobData,
      timestamp: Date.now(),
      attempts: 0,
      ...this.options.defaultJobOptions,
      ...options,
    };

    this.jobs.push(job);
    this.emit("job:added", job);

    if (this.options.concurrency) {
      this.processNext();
    }

    return job;
  }

  async addBulk(jobsData: Array<{ data: T; options?: Partial<QueueJob<T>> }>): Promise<QueueJob<T>[]> {
    const addedJobs: QueueJob<T>[] = [];
    for (const { data, options } of jobsData) {
      const job = await this.add(data, options);
      addedJobs.push(job);
    }
    return addedJobs;
  }

  process(handler: JobHandler<T>): void {
    const defaultHandler = this.handlers.get("default");
    if (defaultHandler) {
      this.processNext();
    }
    this.handlers.set("default", handler);
  }

  private async processNext(): Promise<void> {
    if (this.processing) return;
    if (this.jobs.length === 0) return;

    this.processing = true;
    const handler = this.handlers.get("default");

    while (this.jobs.length > 0 && handler) {
      const job = this.jobs.shift()!;
      if (job.delay && Date.now() - (job.timestamp || 0) < job.delay) {
        this.jobs.push(job);
        continue;
      }

      job.attempts = (job.attempts || 0) + 1;

      try {
        this.emit("job:processing", job);
        const result = await handler(job);

        if (job.removeOnComplete !== false) {
          this.emit("job:completed", { job, result });
        }
      } catch (error) {
        const maxAttempts = job.attempts || 3;
        if (job.attempts < maxAttempts) {
          const backoffDelay = job.backoff?.type === "exponential"
            ? (job.backoff?.delay || 1000) * Math.pow(2, job.attempts - 1)
            : job.backoff?.delay || 1000;

          setTimeout(() => {
            this.jobs.push(job);
            this.processNext();
          }, backoffDelay);
        } else {
          if (job.removeOnFail !== false) {
            this.emit("job:failed", { job, error: error as Error });
          }
        }
      }
    }

    this.processing = false;
  }

  async getJob(jobId: string): Promise<QueueJob<T> | undefined> {
    return this.jobs.find((job) => job.id === jobId);
  }

  async getJobs(): Promise<QueueJob<T>[]> {
    return [...this.jobs];
  }

  async removeJob(jobId: string): Promise<boolean> {
    const index = this.jobs.findIndex((job) => job.id === jobId);
    if (index > -1) {
      this.jobs.splice(index, 1);
      return true;
    }
    return false;
  }

  async getJobCount(): Promise<number> {
    return this.jobs.length;
  }

  on(event: string, callback: (job: QueueJob<T>) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(data as QueueJob<T>);
      }
    }
  }

  async close(): Promise<void> {
    this.jobs = [];
    this.handlers.clear();
    this.listeners.clear();
  }
}

export class QueueManager {
  private queues: Map<string, Queue> = new Map();

  getQueue<T = unknown>(name: string, options?: QueueOptions): Queue<T> {
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue<T>(name, options));
    }
    return this.queues.get(name) as Queue<T>;
  }

  async removeQueue(name: string): Promise<boolean> {
    const queue = this.queues.get(name);
    if (queue) {
      await queue.close();
      return this.queues.delete(name);
    }
    return false;
  }

  getQueueNames(): string[] {
    return Array.from(this.queues.keys());
  }

  async closeAll(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    this.queues.clear();
  }
}

export const queueManager = new QueueManager();

export const emailQueue = queueManager.getQueue<{
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}>("email", { concurrency: 5 });

export const notificationQueue = queueManager.getQueue<{
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}>("notification", { concurrency: 10 });

export const webhookQueue = queueManager.getQueue<{
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
}>("webhook", { concurrency: 3 });

export const imageProcessingQueue = queueManager.getQueue<{
  imageUrl: string;
  operations: string[];
}>("image-processing", { concurrency: 2 });

export default queueManager;
