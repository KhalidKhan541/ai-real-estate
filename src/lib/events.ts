export type EventCallback<T = unknown> = (data: T) => void | Promise<void>;

export interface EventOptions {
  once?: boolean;
  priority?: number;
}

export interface EventSubscription {
  id: string;
  callback: EventCallback;
  options: EventOptions;
  unsubscribe: () => void;
}

export class TypedEventEmitter<Events extends Record<string, unknown>> {
  private listeners: Map<string, Set<EventSubscription>> = new Map();
  private maxListeners: number;

  constructor(maxListeners: number = 10) {
    this.maxListeners = maxListeners;
  }

  on<K extends keyof Events>(
    event: K,
    callback: EventCallback<Events[K]>,
    options?: EventOptions
  ): EventSubscription {
    return this.addListener(event as string, callback, options);
  }

  once<K extends keyof Events>(
    event: K,
    callback: EventCallback<Events[K]>
  ): EventSubscription {
    return this.addListener(event as string, callback, { once: true });
  }

  off<K extends keyof Events>(
    event: K,
    callback: EventCallback<Events[K]>
  ): void {
    this.removeListener(event as string, callback);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const listeners = this.listeners.get(event as string);
    if (!listeners) return;

    const toRemove: EventSubscription[] = [];

    for (const subscription of listeners) {
      try {
        subscription.callback(data);
        if (subscription.options.once) {
          toRemove.push(subscription);
        }
      } catch (error) {
        console.error(`Error in event listener for "${event as string}":`, error);
      }
    }

    for (const subscription of toRemove) {
      listeners.delete(subscription);
    }
  }

  async emitAsync<K extends keyof Events>(event: K, data: Events[K]): Promise<void> {
    const listeners = this.listeners.get(event as string);
    if (!listeners) return;

    const sortedListeners = Array.from(listeners).sort(
      (a, b) => (b.options.priority || 0) - (a.options.priority || 0)
    );

    const toRemove: EventSubscription[] = [];

    for (const subscription of sortedListeners) {
      try {
        await subscription.callback(data);
        if (subscription.options.once) {
          toRemove.push(subscription);
        }
      } catch (error) {
        console.error(`Error in async event listener for "${event as string}":`, error);
      }
    }

    for (const subscription of toRemove) {
      listeners.delete(subscription);
    }
  }

  removeAllListeners<K extends keyof Events>(event?: K): void {
    if (event) {
      this.listeners.delete(event as string);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount<K extends keyof Events>(event: K): number {
    const listeners = this.listeners.get(event as string);
    return listeners ? listeners.size : 0;
  }

  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  private addListener(
    event: string,
    callback: EventCallback,
    options: EventOptions = {}
  ): EventSubscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const listeners = this.listeners.get(event)!;
    if (listeners.size >= this.maxListeners) {
      console.warn(
        `Max listeners (${this.maxListeners}) exceeded for event "${event}"`
      );
    }

    const id = `${event}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const subscription: EventSubscription = {
      id,
      callback,
      options,
      unsubscribe: () => {
        listeners.delete(subscription);
      },
    };

    listeners.add(subscription);
    return subscription;
  }

  private removeListener(event: string, callback: EventCallback): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;

    for (const subscription of listeners) {
      if (subscription.callback === callback) {
        listeners.delete(subscription);
        break;
      }
    }
  }
}

export interface PropertyEvents {
  "property:created": { propertyId: string; agentId: string };
  "property:updated": { propertyId: string; changes: Record<string, unknown> };
  "property:deleted": { propertyId: string };
  "property:viewed": { propertyId: string; viewerId?: string };
  "property:favorited": { propertyId: string; userId: string };
  "property:priceChanged": {
    propertyId: string;
    oldPrice: number;
    newPrice: number;
  };
  "property:statusChanged": {
    propertyId: string;
    oldStatus: string;
    newStatus: string;
  };
}

export interface UserEvents {
  "user:registered": { userId: string; email: string };
  "user:login": { userId: string; timestamp: number };
  "user:logout": { userId: string };
  "user:profileUpdated": { userId: string; changes: Record<string, unknown> };
}

export interface OfferEvents {
  "offer:created": { offerId: string; propertyId: string; buyerId: string };
  "offer:accepted": { offerId: string; propertyId: string };
  "offer:rejected": { offerId: string; propertyId: string };
  "offer:countered": { offerId: string; propertyId: string; newAmount: number };
  "offer:expired": { offerId: string; propertyId: string };
}

export interface SearchEvents {
  "search:executed": { query: string; filters: Record<string, unknown>; resultCount: number };
  "search:suggestion": { query: string; suggestions: string[] };
}

export interface NotificationEvents {
  "notification:new": { userId: string; type: string; title: string; message: string };
  "notification:read": { notificationId: string; userId: string };
  "notification:allRead": { userId: string };
}

export type AppEvents = PropertyEvents &
  UserEvents &
  OfferEvents &
  SearchEvents &
  NotificationEvents;

export const eventEmitter = new TypedEventEmitter<AppEvents>();

export default eventEmitter;
