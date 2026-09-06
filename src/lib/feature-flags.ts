export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  allowedUsers?: string[];
  allowedRoles?: string[];
  startDate?: string;
  endDate?: string;
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  defaults?: {
    enabled: boolean;
    rolloutPercentage?: number;
  };
}

export type FlagValue = boolean | string | number;

export interface FlagVariant {
  name: string;
  weight: number;
  payload?: Record<string, unknown>;
}

class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  private defaults: { enabled: boolean; rolloutPercentage?: number };
  private overrides: Map<string, boolean> = new Map();

  constructor(config?: FeatureFlagConfig) {
    this.defaults = config?.defaults || { enabled: false, rolloutPercentage: 0 };

    if (config?.flags) {
      for (const [name, flag] of Object.entries(config.flags)) {
        this.flags.set(name, flag);
      }
    }
  }

  isEnabled(name: string, context?: { userId?: string; role?: string }): boolean {
    const override = this.overrides.get(name);
    if (override !== undefined) return override;

    const flag = this.flags.get(name);
    if (!flag) return this.defaults.enabled;

    if (!flag.enabled) return false;

    if (flag.startDate && new Date(flag.startDate) > new Date()) {
      return false;
    }

    if (flag.endDate && new Date(flag.endDate) < new Date()) {
      return false;
    }

    if (context?.userId && flag.allowedUsers) {
      return flag.allowedUsers.includes(context.userId);
    }

    if (context?.role && flag.allowedRoles) {
      return flag.allowedRoles.includes(context.role);
    }

    if (flag.rolloutPercentage !== undefined && context?.userId) {
      const hash = this.hashString(`${name}:${context.userId}`);
      const percentage = hash % 100;
      return percentage < flag.rolloutPercentage;
    }

    return flag.enabled;
  }

  setOverride(name: string, enabled: boolean): void {
    this.overrides.set(name, enabled);
  }

  clearOverride(name: string): void {
    this.overrides.delete(name);
  }

  clearAllOverrides(): void {
    this.overrides.clear();
  }

  getFlag(name: string): FeatureFlag | undefined {
    return this.flags.get(name);
  }

  getAllFlags(): Record<string, FeatureFlag> {
    return Object.fromEntries(this.flags);
  }

  setFlag(name: string, flag: FeatureFlag): void {
    this.flags.set(name, flag);
  }

  removeFlag(name: string): void {
    this.flags.delete(name);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

const defaultFlags: Record<string, FeatureFlag> = {
  "ai-property-valuation": {
    name: "ai-property-valuation",
    enabled: true,
    description: "AI-powered property valuation feature",
    rolloutPercentage: 100,
  },
  "ai-chat-assistant": {
    name: "ai-chat-assistant",
    enabled: true,
    description: "AI chat assistant for property inquiries",
    rolloutPercentage: 75,
  },
  "virtual-tours": {
    name: "virtual-tours",
    enabled: true,
    description: "360-degree virtual property tours",
    rolloutPercentage: 50,
  },
  "advanced-analytics": {
    name: "advanced-analytics",
    enabled: true,
    description: "Advanced analytics dashboard",
    allowedRoles: ["admin", "agent"],
  },
  "bulk-listings": {
    name: "bulk-listings",
    enabled: true,
    description: "Bulk listing management",
    allowedRoles: ["admin", "agent"],
  },
  "property-comparison": {
    name: "property-comparison",
    enabled: true,
    description: "Compare multiple properties",
    rolloutPercentage: 100,
  },
  "mortgage-calculator": {
    name: "mortgage-calculator",
    enabled: true,
    description: "Mortgage calculator tool",
    rolloutPercentage: 100,
  },
  "market-trends": {
    name: "market-trends",
    enabled: true,
    description: "Market trends and insights",
    rolloutPercentage: 100,
  },
  "agent-matching": {
    name: "agent-matching",
    enabled: true,
    description: "AI agent matching for buyers",
    rolloutPercentage: 50,
  },
  "document-generation": {
    name: "document-generation",
    enabled: true,
    description: "Automated document generation",
    allowedRoles: ["admin", "agent"],
  },
};

export const featureFlags = new FeatureFlagService({
  flags: defaultFlags,
  defaults: {
    enabled: false,
    rolloutPercentage: 0,
  },
});

export default featureFlags;
