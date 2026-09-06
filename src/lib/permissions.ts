import { UserRole } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Permission Constants
// ─────────────────────────────────────────────────────────────────────────────

export const PERMISSIONS = {
  // Property Permissions
  PROPERTY: {
    CREATE: "property:create",
    READ: "property:read",
    UPDATE: "property:update",
    DELETE: "property:delete",
    MANAGE: "property:manage",
    PUBLISH: "property:publish",
    FEATURE: "property:feature",
    SEARCH: "property:search",
  },

  // Listing Permissions
  LISTING: {
    CREATE: "listing:create",
    READ: "listing:read",
    UPDATE: "listing:update",
    DELETE: "listing:delete",
    MANAGE: "listing:manage",
    PUBLISH: "listing:publish",
    WITHDRAW: "listing:withdraw",
    MARK_SOLD: "listing:mark_sold",
  },

  // Offer Permissions
  OFFER: {
    CREATE: "offer:create",
    READ: "offer:read",
    UPDATE: "offer:update",
    DELETE: "offer:delete",
    COUNTER: "offer:counter",
    ACCEPT: "offer:accept",
    REJECT: "offer:reject",
    WITHDRAW: "offer:withdraw",
  },

  // Transaction Permissions
  TRANSACTION: {
    CREATE: "transaction:create",
    READ: "transaction:read",
    UPDATE: "transaction:update",
    DELETE: "transaction:delete",
    MANAGE: "transaction:manage",
    UPLOAD_DOCUMENT: "transaction:upload_document",
    SIGN_DOCUMENT: "transaction:sign_document",
    CLOSE: "transaction:close",
    CANCEL: "transaction:cancel",
  },

  // Client Permissions
  CLIENT: {
    CREATE: "client:create",
    READ: "client:read",
    UPDATE: "client:update",
    DELETE: "client:delete",
    MANAGE: "client:manage",
    VIEW_ALL: "client:view_all",
  },

  // Appointment Permissions
  APPOINTMENT: {
    CREATE: "appointment:create",
    READ: "appointment:read",
    UPDATE: "appointment:update",
    DELETE: "appointment:delete",
    MANAGE: "appointment:manage",
    VIEW_ALL: "appointment:view_all",
  },

  // Agent Permissions
  AGENT: {
    CREATE: "agent:create",
    READ: "agent:read",
    UPDATE: "agent:update",
    DELETE: "agent:delete",
    MANAGE: "agent:manage",
    VERIFY: "agent:verify",
    FEATURE: "agent:feature",
    VIEW_ALL_PROFILES: "agent:view_all_profiles",
  },

  // User Permissions
  USER: {
    CREATE: "user:create",
    READ: "user:read",
    UPDATE: "user:update",
    DELETE: "user:delete",
    MANAGE: "user:manage",
    CHANGE_ROLE: "user:change_role",
    DEACTIVATE: "user:deactivate",
    VERIFY: "user:verify",
    VIEW_ALL: "user:view_all",
  },

  // Neighborhood Permissions
  NEIGHBORHOOD: {
    CREATE: "neighborhood:create",
    READ: "neighborhood:read",
    UPDATE: "neighborhood:update",
    DELETE: "neighborhood:delete",
    MANAGE: "neighborhood:manage",
  },

  // Payment Permissions
  PAYMENT: {
    CREATE: "payment:create",
    READ: "payment:read",
    UPDATE: "payment:update",
    REFUND: "payment:refund",
    MANAGE: "payment:manage",
    VIEW_ALL: "payment:view_all",
  },

  // Invoice Permissions
  INVOICE: {
    CREATE: "invoice:create",
    READ: "invoice:read",
    UPDATE: "invoice:update",
    SEND: "invoice:send",
    CANCEL: "invoice:cancel",
    MANAGE: "invoice:manage",
  },

  // Notification Permissions
  NOTIFICATION: {
    READ: "notification:read",
    UPDATE: "notification:update",
    DELETE: "notification:delete",
    MANAGE: "notification:manage",
    SEND: "notification:send",
  },

  // Review Permissions
  REVIEW: {
    CREATE: "review:create",
    READ: "review:read",
    UPDATE: "review:update",
    DELETE: "review:delete",
    RESPOND: "review:respond",
    MANAGE: "review:manage",
  },

  // Analytics Permissions
  ANALYTICS: {
    VIEW_OWN: "analytics:view_own",
    VIEW_ALL: "analytics:view_all",
    VIEW_AGENT: "analytics:view_agent",
    VIEW_MARKET: "analytics:view_market",
    EXPORT: "analytics:export",
  },

  // System Permissions
  SYSTEM: {
    SETTINGS: "system:settings",
    AUDIT_LOG: "system:audit_log",
    DATABASE: "system:database",
    BACKUP: "system:backup",
    MAINTENANCE: "system:maintenance",
  },

  // Virtual Tour Permissions
  VIRTUAL_TOUR: {
    CREATE: "virtual_tour:create",
    READ: "virtual_tour:read",
    UPDATE: "virtual_tour:update",
    DELETE: "virtual_tour:delete",
    PUBLISH: "virtual_tour:publish",
  },

  // Saved Search Permissions
  SAVED_SEARCH: {
    CREATE: "saved_search:create",
    READ: "saved_search:read",
    UPDATE: "saved_search:update",
    DELETE: "saved_search:delete",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Role-Permission Mapping
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: [
    // Super admin has all permissions
    ...Object.values(PERMISSIONS).flatMap((group) =>
      Object.values(group)
    ),
  ],

  ADMIN: [
    // Property Management
    PERMISSIONS.PROPERTY.CREATE,
    PERMISSIONS.PROPERTY.READ,
    PERMISSIONS.PROPERTY.UPDATE,
    PERMISSIONS.PROPERTY.DELETE,
    PERMISSIONS.PROPERTY.MANAGE,
    PERMISSIONS.PROPERTY.PUBLISH,
    PERMISSIONS.PROPERTY.FEATURE,
    PERMISSIONS.PROPERTY.SEARCH,

    // Listing Management
    PERMISSIONS.LISTING.CREATE,
    PERMISSIONS.LISTING.READ,
    PERMISSIONS.LISTING.UPDATE,
    PERMISSIONS.LISTING.DELETE,
    PERMISSIONS.LISTING.MANAGE,
    PERMISSIONS.LISTING.PUBLISH,
    PERMISSIONS.LISTING.WITHDRAW,
    PERMISSIONS.LISTING.MARK_SOLD,

    // Offer Management
    PERMISSIONS.OFFER.READ,
    PERMISSIONS.OFFER.MANAGE,
    PERMISSIONS.OFFER.ACCEPT,
    PERMISSIONS.OFFER.REJECT,

    // Transaction Management
    PERMISSIONS.TRANSACTION.READ,
    PERMISSIONS.TRANSACTION.MANAGE,
    PERMISSIONS.TRANSACTION.UPLOAD_DOCUMENT,
    PERMISSIONS.TRANSACTION.CLOSE,
    PERMISSIONS.TRANSACTION.CANCEL,

    // Client Management
    PERMISSIONS.CLIENT.VIEW_ALL,

    // Appointment Management
    PERMISSIONS.APPOINTMENT.VIEW_ALL,
    PERMISSIONS.APPOINTMENT.MANAGE,

    // Agent Management
    PERMISSIONS.AGENT.CREATE,
    PERMISSIONS.AGENT.READ,
    PERMISSIONS.AGENT.UPDATE,
    PERMISSIONS.AGENT.DELETE,
    PERMISSIONS.AGENT.MANAGE,
    PERMISSIONS.AGENT.VERIFY,
    PERMISSIONS.AGENT.FEATURE,
    PERMISSIONS.AGENT.VIEW_ALL_PROFILES,

    // User Management
    PERMISSIONS.USER.CREATE,
    PERMISSIONS.USER.READ,
    PERMISSIONS.USER.UPDATE,
    PERMISSIONS.USER.DELETE,
    PERMISSIONS.USER.MANAGE,
    PERMISSIONS.USER.CHANGE_ROLE,
    PERMISSIONS.USER.DEACTIVATE,
    PERMISSIONS.USER.VERIFY,
    PERMISSIONS.USER.VIEW_ALL,

    // Neighborhood
    PERMISSIONS.NEIGHBORHOOD.CREATE,
    PERMISSIONS.NEIGHBORHOOD.READ,
    PERMISSIONS.NEIGHBORHOOD.UPDATE,
    PERMISSIONS.NEIGHBORHOOD.DELETE,
    PERMISSIONS.NEIGHBORHOOD.MANAGE,

    // Payment
    PERMISSIONS.PAYMENT.READ,
    PERMISSIONS.PAYMENT.MANAGE,
    PERMISSIONS.PAYMENT.REFUND,
    PERMISSIONS.PAYMENT.VIEW_ALL,

    // Invoice
    PERMISSIONS.INVOICE.READ,
    PERMISSIONS.INVOICE.MANAGE,

    // Notification
    PERMISSIONS.NOTIFICATION.MANAGE,
    PERMISSIONS.NOTIFICATION.SEND,

    // Review
    PERMISSIONS.REVIEW.READ,
    PERMISSIONS.REVIEW.MANAGE,
    PERMISSIONS.REVIEW.DELETE,

    // Analytics
    PERMISSIONS.ANALYTICS.VIEW_ALL,
    PERMISSIONS.ANALYTICS.VIEW_AGENT,
    PERMISSIONS.ANALYTICS.VIEW_MARKET,
    PERMISSIONS.ANALYTICS.EXPORT,

    // System
    PERMISSIONS.SYSTEM.SETTINGS,
    PERMISSIONS.SYSTEM.AUDIT_LOG,
    PERMISSIONS.SYSTEM.MAINTENANCE,

    // Virtual Tour
    PERMISSIONS.VIRTUAL_TOUR.CREATE,
    PERMISSIONS.VIRTUAL_TOUR.READ,
    PERMISSIONS.VIRTUAL_TOUR.UPDATE,
    PERMISSIONS.VIRTUAL_TOUR.DELETE,
    PERMISSIONS.VIRTUAL_TOUR.PUBLISH,
  ],

  BROKER: [
    // Property (read + manage agents' properties)
    PERMISSIONS.PROPERTY.READ,
    PERMISSIONS.PROPERTY.MANAGE,
    PERMISSIONS.PROPERTY.SEARCH,

    // Listing
    PERMISSIONS.LISTING.READ,
    PERMISSIONS.LISTING.MANAGE,
    PERMISSIONS.LISTING.PUBLISH,

    // Offer
    PERMISSIONS.OFFER.READ,
    PERMISSIONS.OFFER.COUNTER,
    PERMISSIONS.OFFER.ACCEPT,
    PERMISSIONS.OFFER.REJECT,

    // Transaction
    PERMISSIONS.TRANSACTION.READ,
    PERMISSIONS.TRANSACTION.MANAGE,
    PERMISSIONS.TRANSACTION.UPLOAD_DOCUMENT,
    PERMISSIONS.TRANSACTION.CLOSE,

    // Client
    PERMISSIONS.CLIENT.VIEW_ALL,

    // Appointment
    PERMISSIONS.APPOINTMENT.READ,
    PERMISSIONS.APPOINTMENT.VIEW_ALL,

    // Agent
    PERMISSIONS.AGENT.READ,
    PERMISSIONS.AGENT.MANAGE,
    PERMISSIONS.AGENT.VIEW_ALL_PROFILES,

    // User
    PERMISSIONS.USER.READ,

    // Neighborhood
    PERMISSIONS.NEIGHBORHOOD.READ,

    // Payment
    PERMISSIONS.PAYMENT.READ,
    PERMISSIONS.PAYMENT.VIEW_ALL,

    // Invoice
    PERMISSIONS.INVOICE.READ,
    PERMISSIONS.INVOICE.CREATE,
    PERMISSIONS.INVOICE.SEND,

    // Notification
    PERMISSIONS.NOTIFICATION.READ,

    // Review
    PERMISSIONS.REVIEW.READ,

    // Analytics
    PERMISSIONS.ANALYTICS.VIEW_ALL,
    PERMISSIONS.ANALYTICS.VIEW_AGENT,
    PERMISSIONS.ANALYTICS.EXPORT,

    // Virtual Tour
    PERMISSIONS.VIRTUAL_TOUR.READ,
    PERMISSIONS.VIRTUAL_TOUR.CREATE,

    // Saved Search
    PERMISSIONS.SAVED_SEARCH.READ,
  ],

  AGENT: [
    // Property
    PERMISSIONS.PROPERTY.CREATE,
    PERMISSIONS.PROPERTY.READ,
    PERMISSIONS.PROPERTY.UPDATE,
    PERMISSIONS.PROPERTY.SEARCH,

    // Listing
    PERMISSIONS.LISTING.CREATE,
    PERMISSIONS.LISTING.READ,
    PERMISSIONS.LISTING.UPDATE,
    PERMISSIONS.LISTING.WITHDRAW,

    // Offer
    PERMISSIONS.OFFER.READ,
    PERMISSIONS.OFFER.CREATE,
    PERMISSIONS.OFFER.COUNTER,
    PERMISSIONS.OFFER.WITHDRAW,

    // Transaction
    PERMISSIONS.TRANSACTION.CREATE,
    PERMISSIONS.TRANSACTION.READ,
    PERMISSIONS.TRANSACTION.UPDATE,
    PERMISSIONS.TRANSACTION.UPLOAD_DOCUMENT,
    PERMISSIONS.TRANSACTION.SIGN_DOCUMENT,

    // Client
    PERMISSIONS.CLIENT.CREATE,
    PERMISSIONS.CLIENT.READ,
    PERMISSIONS.CLIENT.UPDATE,
    PERMISSIONS.CLIENT.DELETE,
    PERMISSIONS.CLIENT.MANAGE,

    // Appointment
    PERMISSIONS.APPOINTMENT.CREATE,
    PERMISSIONS.APPOINTMENT.READ,
    PERMISSIONS.APPOINTMENT.UPDATE,
    PERMISSIONS.APPOINTMENT.DELETE,

    // Agent (own profile)
    PERMISSIONS.AGENT.READ,

    // Neighborhood
    PERMISSIONS.NEIGHBORHOOD.READ,

    // Payment
    PERMISSIONS.PAYMENT.READ,

    // Invoice
    PERMISSIONS.INVOICE.CREATE,
    PERMISSIONS.INVOICE.READ,
    PERMISSIONS.INVOICE.SEND,

    // Notification
    PERMISSIONS.NOTIFICATION.READ,
    PERMISSIONS.NOTIFICATION.UPDATE,

    // Review
    PERMISSIONS.REVIEW.READ,
    PERMISSIONS.REVIEW.CREATE,
    PERMISSIONS.REVIEW.RESPOND,

    // Analytics
    PERMISSIONS.ANALYTICS.VIEW_OWN,
    PERMISSIONS.ANALYTICS.VIEW_AGENT,

    // Virtual Tour
    PERMISSIONS.VIRTUAL_TOUR.CREATE,
    PERMISSIONS.VIRTUAL_TOUR.READ,
    PERMISSIONS.VIRTUAL_TOUR.UPDATE,

    // Saved Search
    PERMISSIONS.SAVED_SEARCH.CREATE,
    PERMISSIONS.SAVED_SEARCH.READ,
    PERMISSIONS.SAVED_SEARCH.UPDATE,
    PERMISSIONS.SAVED_SEARCH.DELETE,
  ],

  SELLER: [
    // Property (own only)
    PERMISSIONS.PROPERTY.READ,
    PERMISSIONS.PROPERTY.UPDATE,

    // Listing (own properties only)
    PERMISSIONS.LISTING.READ,

    // Offer
    PERMISSIONS.OFFER.READ,
    PERMISSIONS.OFFER.ACCEPT,
    PERMISSIONS.OFFER.REJECT,
    PERMISSIONS.OFFER.COUNTER,

    // Transaction
    PERMISSIONS.TRANSACTION.READ,
    PERMISSIONS.TRANSACTION.UPDATE,
    PERMISSIONS.TRANSACTION.UPLOAD_DOCUMENT,
    PERMISSIONS.TRANSACTION.SIGN_DOCUMENT,

    // Appointment
    PERMISSIONS.APPOINTMENT.CREATE,
    PERMISSIONS.APPOINTMENT.READ,
    PERMISSIONS.APPOINTMENT.UPDATE,
    PERMISSIONS.APPOINTMENT.DELETE,

    // Neighborhood
    PERMISSIONS.NEIGHBORHOOD.READ,

    // Notification
    PERMISSIONS.NOTIFICATION.READ,
    PERMISSIONS.NOTIFICATION.UPDATE,

    // Review
    PERMISSIONS.REVIEW.READ,
    PERMISSIONS.REVIEW.CREATE,

    // Virtual Tour
    PERMISSIONS.VIRTUAL_TOUR.READ,
  ],

  BUYER: [
    // Property
    PERMISSIONS.PROPERTY.READ,
    PERMISSIONS.PROPERTY.SEARCH,

    // Listing
    PERMISSIONS.LISTING.READ,

    // Offer
    PERMISSIONS.OFFER.CREATE,
    PERMISSIONS.OFFER.READ,
    PERMISSIONS.OFFER.UPDATE,
    PERMISSIONS.OFFER.WITHDRAW,

    // Transaction
    PERMISSIONS.TRANSACTION.READ,
    PERMISSIONS.TRANSACTION.UPDATE,
    PERMISSIONS.TRANSACTION.UPLOAD_DOCUMENT,
    PERMISSIONS.TRANSACTION.SIGN_DOCUMENT,

    // Appointment
    PERMISSIONS.APPOINTMENT.CREATE,
    PERMISSIONS.APPOINTMENT.READ,
    PERMISSIONS.APPOINTMENT.UPDATE,
    PERMISSIONS.APPOINTMENT.DELETE,

    // Neighborhood
    PERMISSIONS.NEIGHBORHOOD.READ,

    // Notification
    PERMISSIONS.NOTIFICATION.READ,
    PERMISSIONS.NOTIFICATION.UPDATE,

    // Review
    PERMISSIONS.REVIEW.READ,
    PERMISSIONS.REVIEW.CREATE,

    // Virtual Tour
    PERMISSIONS.VIRTUAL_TOUR.READ,

    // Saved Search
    PERMISSIONS.SAVED_SEARCH.CREATE,
    PERMISSIONS.SAVED_SEARCH.READ,
    PERMISSIONS.SAVED_SEARCH.UPDATE,
    PERMISSIONS.SAVED_SEARCH.DELETE,
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Permission Checking Functions
// ─────────────────────────────────────────────────────────────────────────────

export function hasPermission(role: UserRole, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] ?? [];
  return rolePermissions.includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: string[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function getPermissionsForRole(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function getRolesWithPermission(permission: string): UserRole[] {
  return (Object.keys(ROLE_PERMISSIONS) as UserRole[]).filter((role) =>
    hasPermission(role, permission)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Resource Access Control
// ─────────────────────────────────────────────────────────────────────────────

export interface ResourceOwnership {
  ownerId: string;
  userId: string;
  userRole: UserRole;
}

export function canAccessResource(
  ownership: ResourceOwnership,
  requiredPermission?: string
): boolean {
  const { ownerId, userId, userRole } = ownership;

  // Super admin and admin can access everything
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
    return true;
  }

  // Check if user owns the resource
  if (ownerId === userId) {
    return true;
  }

  // Broker can access their agents' resources
  if (userRole === "BROKER") {
    // In a real app, you'd check if the agent belongs to this broker
    return true;
  }

  // Check specific permission if provided
  if (requiredPermission) {
    return hasPermission(userRole, requiredPermission);
  }

  return false;
}

export function canModifyResource(
  ownership: ResourceOwnership
): boolean {
  const { ownerId, userId, userRole } = ownership;

  // Super admin can modify anything
  if (userRole === "SUPER_ADMIN") {
    return true;
  }

  // Admin can modify most things
  if (userRole === "ADMIN") {
    return true;
  }

  // Broker can modify their agents' resources
  if (userRole === "BROKER") {
    return true;
  }

  // Only owner can modify their own resources
  return ownerId === userId;
}

export function canDeleteResource(
  ownership: ResourceOwnership
): boolean {
  const { userRole } = ownership;

  // Only super admin and admin can delete
  return userRole === "SUPER_ADMIN" || userRole === "ADMIN";
}

// ─────────────────────────────────────────────────────────────────────────────
// Property-Specific Permissions
// ─────────────────────────────────────────────────────────────────────────────

export function canViewProperty(
  userRole: UserRole,
  userId: string,
  propertyOwnerId: string,
  isPublic: boolean
): boolean {
  // Public properties can be viewed by anyone
  if (isPublic) return true;

  // Super admin and admin can view all
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;

  // Broker can view all
  if (userRole === "BROKER") return true;

  // Owner can view their own
  if (propertyOwnerId === userId) return true;

  return false;
}

export function canEditProperty(
  userRole: UserRole,
  userId: string,
  propertyOwnerId: string
): boolean {
  // Super admin can edit anything
  if (userRole === "SUPER_ADMIN") return true;

  // Admin can edit most things
  if (userRole === "ADMIN") return true;

  // Broker can edit their agents' properties
  if (userRole === "BROKER") return true;

  // Agent can edit their own properties
  if (userRole === "AGENT" && propertyOwnerId === userId) return true;

  // Seller can edit their own properties
  if (userRole === "SELLER" && propertyOwnerId === userId) return true;

  return false;
}

export function canDeleteProperty(
  userRole: UserRole,
  userId: string,
  propertyOwnerId: string
): boolean {
  // Only super admin and admin can delete properties
  if (userRole === "SUPER_ADMIN") return true;
  if (userRole === "ADMIN") return true;

  // Broker can delete their agents' properties
  if (userRole === "BROKER") return true;

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Listing-Specific Permissions
// ─────────────────────────────────────────────────────────────────────────────

export function canManageListing(
  userRole: UserRole,
  userId: string,
  listingAgentId?: string,
  propertyOwnerId?: string
): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;
  if (userRole === "BROKER") return true;

  if (userRole === "AGENT" && listingAgentId === userId) return true;

  if (
    (userRole === "SELLER" || userRole === "BUYER") &&
    propertyOwnerId === userId
  ) {
    return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Offer-Specific Permissions
// ─────────────────────────────────────────────────────────────────────────────

export function canViewOffer(
  userRole: UserRole,
  userId: string,
  offerBuyerId: string,
  offerSellerId?: string,
  listingAgentId?: string
): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;
  if (userRole === "BROKER") return true;

  // Buyer can view their own offers
  if (offerBuyerId === userId) return true;

  // Seller can view offers on their properties
  if (offerSellerId === userId) return true;

  // Listing agent can view offers
  if (listingAgentId === userId) return true;

  return false;
}

export function canModifyOffer(
  userRole: UserRole,
  userId: string,
  offerBuyerId: string,
  offerSellerId?: string
): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;

  // Buyer can modify their own offers
  if (offerBuyerId === userId) return true;

  // Seller can counter offers
  if (offerSellerId === userId && hasPermission(userRole, PERMISSIONS.OFFER.COUNTER)) {
    return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction-Specific Permissions
// ─────────────────────────────────────────────────────────────────────────────

export function canViewTransaction(
  userRole: UserRole,
  userId: string,
  transactionBuyerId: string,
  transactionSellerId?: string,
  transactionAgentId?: string
): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;
  if (userRole === "BROKER") return true;

  if (transactionBuyerId === userId) return true;
  if (transactionSellerId === userId) return true;
  if (transactionAgentId === userId) return true;

  return false;
}

export function canCloseTransaction(
  userRole: UserRole,
  userId: string,
  transactionAgentId?: string
): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;
  if (userRole === "BROKER") return true;

  // Agent can close their own transactions
  if (userRole === "AGENT" && transactionAgentId === userId) return true;

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client-Specific Permissions
// ─────────────────────────────────────────────────────────────────────────────

export function canViewClient(
  userRole: UserRole,
  userId: string,
  clientAgentId: string
): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;
  if (userRole === "BROKER") return true;

  // Agent can view their own clients
  if (userRole === "AGENT" && clientAgentId === userId) return true;

  return false;
}

export function canManageClient(
  userRole: UserRole,
  userId: string,
  clientAgentId: string
): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;
  if (userRole === "BROKER") return true;

  // Agent can manage their own clients
  if (userRole === "AGENT" && clientAgentId === userId) return true;

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Appointment-Specific Permissions
// ─────────────────────────────────────────────────────────────────────────────

export function canViewAppointment(
  userRole: UserRole,
  userId: string,
  appointmentUserId: string,
  appointmentClientId?: string
): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;
  if (userRole === "BROKER") return true;

  if (appointmentUserId === userId) return true;

  // Client can view their own appointments
  if (appointmentClientId && userRole === "BUYER") {
    return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware Helpers
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthContext {
  userId: string;
  userRole: UserRole;
  isVerified: boolean;
  isActive: boolean;
}

export function requirePermission(
  auth: AuthContext,
  permission: string
): void {
  if (!auth.isActive) {
    throw new Error("Account is deactivated");
  }

  if (!hasPermission(auth.userRole, permission)) {
    throw new Error(`Insufficient permissions: ${permission} required`);
  }
}

export function requireOwnershipOrPermission(
  auth: AuthContext,
  resourceOwnerId: string,
  permission: string
): void {
  if (!auth.isActive) {
    throw new Error("Account is deactivated");
  }

  if (auth.userId === resourceOwnerId) return;

  if (!hasPermission(auth.userRole, permission)) {
    throw new Error(`Insufficient permissions: ${permission} required`);
  }
}
