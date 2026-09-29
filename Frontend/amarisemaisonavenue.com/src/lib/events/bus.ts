/**
 * @fileOverview Global Event Bus Implementation
 * Orchestrates cross-module communication with persistence and retry logic.
 */

import { MaisonEvent, MaisonEventType, EventHandler, EventStatus } from './types';

class GlobalEventBus {
  private static instance: GlobalEventBus;
  private subscribers: Map<MaisonEventType, EventHandler[]> = new Map();
  private eventLog: MaisonEvent[] = []; // Mock persistence store

  private constructor() {}

  public static getInstance(): GlobalEventBus {
    if (!GlobalEventBus.instance) {
      GlobalEventBus.instance = new GlobalEventBus();
    }
    return GlobalEventBus.instance;
  }

  /**
   * Subscribe a module handler to a specific event type
   */
  public subscribe(type: MaisonEventType, handler: EventHandler) {
    const handlers = this.subscribers.get(type) || [];
    handlers.push(handler);
    this.subscribers.set(type, handlers);
  }

  /**
   * Publish an event to the global bus
   */
  public async publish(event: Omit<MaisonEvent, 'id' | 'status' | 'retryCount' | 'createdAt' | 'maxRetries'>) {
    const fullEvent: MaisonEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString()
    };

    this.eventLog.unshift(fullEvent);
    console.log(`%c[EVENT BUS] 📡 Published: ${fullEvent.type} from ${fullEvent.source}`, "color: #7E3F98; font-weight: bold;");

    // Async execution to simulate real-world behavior
    this.dispatchEvent(fullEvent);
    
    return fullEvent.id;
  }

  /**
   * Dispatches event to all relevant subscribers with retry logic
   */
  private async dispatchEvent(event: MaisonEvent) {
    const handlers = this.subscribers.get(event.type) || [];
    
    if (handlers.length === 0) {
      this.updateEventStatus(event.id, 'processed');
      return;
    }

    this.updateEventStatus(event.id, 'processing');

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error: any) {
        console.error(`%c[EVENT BUS] ❌ Failure in handler for ${event.type}: ${error.message}`, "color: #ef4444;");
        await this.handleFailure(event, error.message);
      }
    }

    this.updateEventStatus(event.id, 'processed');
  }

  private async handleFailure(event: MaisonEvent, error: string) {
    if (event.retryCount < event.maxRetries) {
      event.retryCount++;
      console.log(`%c[EVENT BUS] 🔄 Retrying ${event.type} (Attempt ${event.retryCount})`, "color: #F59E0B;");
      setTimeout(() => this.dispatchEvent(event), 1000 * event.retryCount);
    } else {
      this.updateEventStatus(event.id, 'dead_letter', error);
    }
  }

  private updateEventStatus(id: string, status: EventStatus, error?: string) {
    const evt = this.eventLog.find(e => e.id === id);
    if (evt) {
      evt.status = status;
      evt.processedAt = new Date().toISOString();
      if (error) evt.error = error;
    }
  }

  public getLogs() {
    return this.eventLog;
  }
}

export const eventBus = GlobalEventBus.getInstance();
