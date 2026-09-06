import { UserRole } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Permission Constants
// ─────────────────────────────────────────────────────────────────────────────

export const PERMISSIONS = {
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
  CLIENT: {
    CREATE: "client:create",
    READ: "client:read",
    UPDATE: "client:update",
    DELETE: "client:delete",
    MANAGE: "client:manage",
    VIEW_ALL: "client:view_all",
  },
  APPOINTMENT: {
    CREATE: "appointment:create",
    READ: "appointment:read",
    UPDATE: "appointment:update",
    DELETE: "appointment:delete",
    MANAGE: "appointment:manage",
    VIEW_ALL: "appointment:view_all",
  },
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
  NEIGHBORHOOD: {
    CREATE: "neighborhood:create",
    READ: "neighborhood:read",
    UPDATE: "neighborhood:update",
    DELETE: "neighborhood:delete",
    MANAGE: "neighborhood:manage",
  },
  PAYMENT: {
    CREATE: "payment:create",
    READ: "payment:read",
    UPDATE: "payment:update",
    REFUND: "payment:refund",
    MANAGE: "payment:manage",
    VIEW_ALL: "payment:view_all",
  },
  INVOICE: {
    CREATE: "invoice:create",
    READ: "invoice:read",
    UPDATE: "invoice:update",
    SEND: "invoice:send",
    CANCEL: "invoice:cancel",
    MANAGE: "invoice:manage",
  },
  NOTIFICATION: {
    READ: "notification:read",
    UPDATE: "notification:update",
    DELETE: "notification:delete",
    MANAGE: "notification:manage",
    SEND: "notification:send",
  },
  REVIEW: {
    CREATE: "review:create",
    READ: "review:read",
    UPDATE: "review:update",
    DELETE: "review:delete",
    RESPOND: "review:respond",
    MANAGE: "review:manage",
  },
  ANALYTICS: {
    VIEW_OWN: "analytics:view_own",
    VIEW_ALL: "analytics:view_all",
    VIEW_AGENT: "analytics:view_agent",
    VIEW_MARKET: "analytics:view_market",
    EXPORT: "analytics:export",
  },
  SYSTEM: {
    SETTINGS: "system:settings",
    AUDIT_LOG: "system:audit_log",
    DATABASE: "system:database",
    BACKUP: "system:backup",
    MAINTENANCE: "system:maintenance",
  },
  VIRTUAL_TOUR: {
    CREATE: "virtual_tour:create",
    READ: "virtual_tour:read",
    UPDATE: "virtual_tour:update",
    DELETE: "virtual_tour:delete",
    PUBLISH: "virtual_tour:publish",
  },
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
    ...Object.values(PERMISSIONS).flatMap((group) => Object.values(group)),
  ],
  ADMIN: [
    PERMISSIONS.PROPERTY.CREATE, PERMISSIONS.PROPERTY.READ, PERMISSIONS.PROPERTY.UPDATE,
    PERMISSIONS.PROPERTY.DELETE, PERMISSIONS.PROPERTY.MANAGE, PERMISSIONS.PROPERTY.PUBLISH,
    PERMISSIONS.PROPERTY.FEATURE, PERMISSIONS.PROPERTY.SEARCH,
    PERMISSIONS.LISTING.CREATE, PERMISSIONS.LISTING.READ, PERMISSIONS.LISTING.UPDATE,
    PERMISSIONS.LISTING.DELETE, PERMISSIONS.LISTING.MANAGE, PERMISSIONS.LISTING.PUBLISH,
    PERMISSIONS.LISTING.WITHDRAW, PERMISSIONS.LISTING.MARK_SOLD,
    PERMISSIONS.OFFER.READ, PERMISSIONS.OFFER.MANAGE, PERMISSIONS.OFFER.ACCEPT, PERMISSIONS.OFFER.REJECT,
    PERMISSIONS.TRANSACTION.READ, PERMISSIONS.TRANSACTION.MANAGE,
    PERMISSIONS.TRANSACTION.UPLOAD_DOCUMENT, PERMISSIONS.TRANSACTION.CLOSE, PERMISSIONS.TRANSACTION.CANCEL,
    PERMISSIONS.CLIENT.VIEW_ALL, PERMISSIONS.APPOINTMENT.VIEW_ALL, PERMISSIONS.APPOINTMENT.MANAGE,
    PERMISSIONS.AGENT.CREATE, PERMISSIONS.AGENT.READ, PERMISSIONS.AGENT.UPDATE,
    PERMISSIONS.AGENT.DELETE, PERMISSIONS.AGENT.MANAGE, PERMISSIONS.AGENT.VERIFY,
    PERMISSIONS.AGENT.FEATURE, PERMISSIONS.AGENT.VIEW_ALL_PROFILES,
    PERMISSIONS.USER.CREATE, PERMISSIONS.USER.READ, PERMISSIONS.USER.UPDATE,
    PERMISSIONS.USER.DELETE, PERMISSIONS.USER.MANAGE, PERMISSIONS.USER.CHANGE_ROLE,
    PERMISSIONS.USER.DEACTIVATE, PERMISSIONS.USER.VERIFY, PERMISSIONS.USER.VIEW_ALL,
    PERMISSIONS.NEIGHBORHOOD.CREATE, PERMISSIONS.NEIGHBORHOOD.READ,
    PERMISSIONS.NEIGHBORHOOD.UPDATE, PERMISSIONS.NEIGHBORHOOD.DELETE, PERMISSIONS.NEIGHBORHOOD.MANAGE,
    PERMISSIONS.PAYMENT.READ, PERMISSIONS.PAYMENT.MANAGE, PERMISSIONS.PAYMENT.REFUND, PERMISSIONS.PAYMENT.VIEW_ALL,
    PERMISSIONS.INVOICE.READ, PERMISSIONS.INVOICE.MANAGE,
    PERMISSIONS.NOTIFICATION.MANAGE, PERMISSIONS.NOTIFICATION.SEND,
    PERMISSIONS.REVIEW.READ, PERMISSIONS.REVIEW.MANAGE, PERMISSIONS.REVIEW.DELETE,
    PERMISSIONS.ANALYTICS.VIEW_ALL, PERMISSIONS.ANALYTICS.VIEW_AGENT,
    PERMISSIONS.ANALYTICS.VIEW_MARKET, PERMISSIONS.ANALYTICS.EXPORT,
    PERMISSIONS.SYSTEM.SETTINGS, PERMISSIONS.SYSTEM.AUDIT_LOG, PERMISSIONS.SYSTEM.MAINTENANCE,
    PERMISSIONS.VIRTUAL_TOUR.CREATE, PERMISSIONS.VIRTUAL_TOUR.READ,
    PERMISSIONS.VIRTUAL_TOUR.UPDATE, PERMISSIONS.VIRTUAL_TOUR.DELETE, PERMISSIONS.VIRTUAL_TOUR.PUBLISH,
  ],
  BROKER: [
    PERMISSIONS.PROPERTY.READ, PERMISSIONS.PROPERTY.MANAGE, PERMISSIONS.PROPERTY.SEARCH,
    PERMISSIONS.LISTING.READ, PERMISSIONS.LISTING.MANAGE, PERMISSIONS.LISTING.PUBLISH,
    PERMISSIONS.OFFER.READ, PERMISSIONS.OFFER.COUNTER, PERMISSIONS.OFFER.ACCEPT, PERMISSIONS.OFFER.REJECT,
    PERMISSIONS.TRANSACTION.READ, PERMISSIONS.TRANSACTION.MANAGE,
    PERMISSIONS.TRANSACTION.UPLOAD_DOCUMENT, PERMISSIONS.TRANSACTION.CLOSE,
    PERMISSIONS.CLIENT.VIEW_ALL, PERMISSIONS.APPOINTMENT.READ, PERMISSIONS.APPOINTMENT.VIEW_ALL,
    PERMISSIONS.AGENT.READ, PERMISSIONS.AGENT.MANAGE, PERMISSIONS.AGENT.VIEW_ALL_PROFILES,
    PERMISSIONS.USER.READ, PERMISSIONS.NEIGHBORHOOD.READ,
    PERMISSIONS.PAYMENT.READ, PERMISSIONS.PAYMENT.VIEW_ALL,
    PERMISSIONS.INVOICE.READ, PERMISSIONS.INVOICE.CREATE, PERMISSIONS.INVOICE.SEND,
    PERMISSIONS.NOTIFICATION.READ, PERMISSIONS.REVIEW.READ,
    PERMISSIONS.ANALYTICS.VIEW_ALL, PERMISSIONS.ANALYTICS.VIEW_AGENT, PERMISSIONS.ANALYTICS.EXPORT,
    PERMISSIONS.VIRTUAL_TOUR.READ, PERMISSIONS.VIRTUAL_TOUR.CREATE, PERMISSIONS.SAVED_SEARCH.READ,
  ],
  AGENT: [
    PERMISSIONS.PROPERTY.CREATE, PERMISSIONS.PROPERTY.READ, PERMISSIONS.PROPERTY.UPDATE, PERMISSIONS.PROPERTY.SEARCH,
    PERMISSIONS.LISTING.CREATE, PERMISSIONS.LISTING.READ, PERMISSIONS.LISTING.UPDATE, PERMISSIONS.LISTING.WITHDRAW,
    PERMISSIONS.OFFER.READ, PERMISSIONS.OFFER.CREATE, PERMISSIONS.OFFER.COUNTER, PERMISSIONS.OFFER.WITHDRAW,
    PERMISSIONS.TRANSACTION.CREATE, PERMISSIONS.TRANSACTION.READ, PERMISSIONS.TRANSACTION.UPDATE,
    PERMISSIONS.TRANSACTION.UPLOAD_DOCUMENT, PERMISSIONS.TRANSACTION.SIGN_DOCUMENT,
    PERMISSIONS.CLIENT.CREATE, PERMISSIONS.CLIENT.READ, PERMISSIONS.CLIENT.UPDATE,
    PERMISSIONS.CLIENT.DELETE, PERMISSIONS.CLIENT.MANAGE,
    PERMISSIONS.APPOINTMENT.CREATE, PERMISSIONS.APPOINTMENT.READ,
    PERMISSIONS.APPOINTMENT.UPDATE, PERMISSIONS.APPOINTMENT.DELETE,
    PERMISSIONS.AGENT.READ, PERMISSIONS.NEIGHBORHOOD.READ,
    PERMISSIONS.PAYMENT.READ,
    PERMISSIONS.INVOICE.CREATE, PERMISSIONS.INVOICE.READ, PERMISSIONS.INVOICE.SEND,
    PERMISSIONS.NOTIFICATION.READ, PERMISSIONS.NOTIFICATION.UPDATE,
    PERMISSIONS.REVIEW.READ, PERMISSIONS.REVIEW.CREATE, PERMISSIONS.REVIEW.RESPOND,
    PERMISSIONS.ANALYTICS.VIEW_OWN, PERMISSIONS.ANALYTICS.VIEW_AGENT,
    PERMISSIONS.VIRTUAL_TOUR.CREATE, PERMISSIONS.VIRTUAL_TOUR.READ, PERMISSIONS.VIRTUAL_TOUR.UPDATE,
    PERMISSIONS.SAVED_SEARCH.CREATE, PERMISSIONS.SAVED_SEARCH.READ,
    PERMISSIONS.SAVED_SEARCH.UPDATE, PERMISSIONS.SAVED_SEARCH.DELETE,
  ],
  SELLER: [
    PERMISSIONS.PROPERTY.READ, PERMISSIONS.PROPERTY.UPDATE,
    PERMISSIONS.LISTING.READ,
    PERMISSIONS.OFFER.READ, PERMISSIONS.OFFER.ACCEPT, PERMISSIONS.OFFER.REJECT, PERMISSIONS.OFFER.COUNTER,
    PERMISSIONS.TRANSACTION.READ, PERMISSIONS.TRANSACTION.UPDATE,
    PERMISSIONS.TRANSACTION.UPLOAD_DOCUMENT, PERMISSIONS.TRANSACTION.SIGN_DOCUMENT,
    PERMISSIONS.APPOINTMENT.CREATE, PERMISSIONS.APPOINTMENT.READ,
    PERMISSIONS.APPOINTMENT.UPDATE, PERMISSIONS.APPOINTMENT.DELETE,
    PERMISSIONS.NEIGHBORHOOD.READ,
    PERMISSIONS.NOTIFICATION.READ, PERMISSIONS.NOTIFICATION.UPDATE,
    PERMISSIONS.REVIEW.READ, PERMISSIONS.REVIEW.CREATE, PERMISSIONS.VIRTUAL_TOUR.READ,
  ],
  BUYER: [
    PERMISSIONS.PROPERTY.READ, PERMISSIONS.PROPERTY.SEARCH,
    PERMISSIONS.LISTING.READ,
    PERMISSIONS.OFFER.CREATE, PERMISSIONS.OFFER.READ, PERMISSIONS.OFFER.UPDATE, PERMISSIONS.OFFER.WITHDRAW,
    PERMISSIONS.TRANSACTION.READ, PERMISSIONS.TRANSACTION.UPDATE,
    PERMISSIONS.TRANSACTION.UPLOAD_DOCUMENT, PERMISSIONS.TRANSACTION.SIGN_DOCUMENT,
    PERMISSIONS.APPOINTMENT.CREATE, PERMISSIONS.APPOINTMENT.READ,
    PERMISSIONS.APPOINTMENT.UPDATE, PERMISSIONS.APPOINTMENT.DELETE,
    PERMISSIONS.NEIGHBORHOOD.READ,
    PERMISSIONS.NOTIFICATION.READ, PERMISSIONS.NOTIFICATION.UPDATE,
    PERMISSIONS.REVIEW.READ, PERMISSIONS.REVIEW.CREATE, PERMISSIONS.VIRTUAL_TOUR.READ,
    PERMISSIONS.SAVED_SEARCH.CREATE, PERMISSIONS.SAVED_SEARCH.READ,
    PERMISSIONS.SAVED_SEARCH.UPDATE, PERMISSIONS.SAVED_SEARCH.DELETE,
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

export function canAccessResource(ownership: ResourceOwnership, requiredPermission?: string): boolean {
  const { ownerId, userId, userRole } = ownership;
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;
  if (ownerId === userId) return true;
  if (userRole === "BROKER") return true;
  if (requiredPermission) return hasPermission(userRole, requiredPermission);
  return false;
}

export function canModifyResource(ownership: ResourceOwnership): boolean {
  const { userRole } = ownership;
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "BROKER") return true;
  return ownership.ownerId === ownership.userId;
}

export function canDeleteResource(ownership: ResourceOwnership): boolean {
  const { userRole } = ownership;
  return userRole === "SUPER_ADMIN" || userRole === "ADMIN";
}

// ─────────────────────────────────────────────────────────────────────────────
// Property-Specific Permissions
// ─────────────────────────────────────────────────────────────────────────────

export function canViewProperty(userRole: UserRole, userId: string, propertyOwnerId: string, isPublic: boolean): boolean {
  if (isPublic) return true;
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "BROKER") return true;
  if (propertyOwnerId === userId) return true;
  return false;
}

export function canEditProperty(userRole: UserRole, userId: string, propertyOwnerId: string): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "BROKER") return true;
  if ((userRole === "AGENT" || userRole === "SELLER") && propertyOwnerId === userId) return true;
  return false;
}

export function canDeleteProperty(userRole: UserRole, userId: string, propertyOwnerId: string): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "BROKER") return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Listing-Specific Permissions
// ─────────────────────────────────────────────────────────────────────────────

export function canManageListing(userRole: UserRole, userId: string, listingAgentId?: string, propertyOwnerId?: string): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "BROKER") return true;
  if (userRole === "AGENT" && listingAgentId === userId) return true;
  if ((userRole === "SELLER" || userRole === "BUYER") && propertyOwnerId === userId) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Offer-Specific Permissions
// ─────────────────────────────────────────────────────────────────────────────

export function canViewOffer(userRole: UserRole, userId: string, offerBuyerId: string, offerSellerId?: string, listingAgentId?: string): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "BROKER") return true;
  if (offerBuyerId === userId) return true;
  if (offerSellerId === userId) return true;
  if (listingAgentId === userId) return true;
  return false;
}

export function canModifyOffer(userRole: UserRole, userId: string, offerBuyerId: string, offerSellerId?: string): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;
  if (offerBuyerId === userId) return true;
  if (offerSellerId === userId && hasPermission(userRole, PERMISSIONS.OFFER.COUNTER)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction-Specific Permissions
// ─────────────────────────────────────────────────────────────────────────────

export function canViewTransaction(userRole: UserRole, userId: string, transactionBuyerId: string, transactionSellerId?: string, transactionAgentId?: string): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "BROKER") return true;
  if (transactionBuyerId === userId || transactionSellerId === userId || transactionAgentId === userId) return true;
  return false;
}

export function canCloseTransaction(userRole: UserRole, userId: string, transactionAgentId?: string): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "BROKER") return true;
  if (userRole === "AGENT" && transactionAgentId === userId) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client-Specific Permissions
// ─────────────────────────────────────────────────────────────────────────────

export function canViewClient(userRole: UserRole, userId: string, clientAgentId: string): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "BROKER") return true;
  if (userRole === "AGENT" && clientAgentId === userId) return true;
  return false;
}

export function canManageClient(userRole: UserRole, userId: string, clientAgentId: string): boolean {
  if (userRole === "SUPER_ADMIN" || userRole === "ADMIN" || userRole === "BROKER") return true;
  if (userRole === "AGENT" && clientAgentId === userId) return true;
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

export function requirePermission(auth: AuthContext, permission: string): void {
  if (!auth.isActive) throw new Error("Account is deactivated");
  if (!hasPermission(auth.userRole, permission)) {
    throw new Error(`Insufficient permissions: ${permission} required`);
  }
}

export function requireOwnershipOrPermission(auth: AuthContext, resourceOwnerId: string, permission: string): void {
  if (!auth.isActive) throw new Error("Account is deactivated");
  if (auth.userId === resourceOwnerId) return;
  if (!hasPermission(auth.userRole, permission)) {
    throw new Error(`Insufficient permissions: ${permission} required`);
  }
}
