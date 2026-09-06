import {
  permissionsService,
  PermissionsService,
  Role,
  Permission,
} from "@/lib/permissions";

const service = new PermissionsService();

describe("PermissionsService", () => {
  describe("hasPermission", () => {
    it("should grant guest permissions", () => {
      expect(service.hasPermission("guest", "property:read")).toBe(true);
      expect(service.hasPermission("guest", "listing:read")).toBe(true);
      expect(service.hasPermission("guest", "agent:read")).toBe(true);
    });

    it("should deny guest write permissions", () => {
      expect(service.hasPermission("guest", "property:create")).toBe(false);
      expect(service.hasPermission("guest", "listing:publish")).toBe(false);
      expect(service.hasPermission("guest", "offer:create")).toBe(false);
    });

    it("should grant buyer permissions", () => {
      expect(service.hasPermission("buyer", "property:read")).toBe(true);
      expect(service.hasPermission("buyer", "offer:create")).toBe(true);
      expect(service.hasPermission("buyer", "offer:read")).toBe(true);
    });

    it("should deny buyer agent permissions", () => {
      expect(service.hasPermission("buyer", "listing:create")).toBe(false);
      expect(service.hasPermission("buyer", "listing:publish")).toBe(false);
    });

    it("should grant seller permissions", () => {
      expect(service.hasPermission("seller", "property:create")).toBe(true);
      expect(service.hasPermission("seller", "property:update")).toBe(true);
      expect(service.hasPermission("seller", "offer:accept")).toBe(true);
      expect(service.hasPermission("seller", "offer:reject")).toBe(true);
    });

    it("should grant agent permissions", () => {
      expect(service.hasPermission("agent", "listing:create")).toBe(true);
      expect(service.hasPermission("agent", "listing:publish")).toBe(true);
      expect(service.hasPermission("agent", "transaction:create")).toBe(true);
      expect(service.hasPermission("agent", "analytics:read")).toBe(true);
    });

    it("should grant admin all permissions", () => {
      const adminPermissions = service.getRolePermissions("admin");
      expect(adminPermissions.length).toBeGreaterThan(10);
      expect(adminPermissions).toContain("property:delete");
      expect(adminPermissions).toContain("user:delete");
      expect(adminPermissions).toContain("admin:access");
    });

    it("should grant super_admin all permissions", () => {
      const superAdminPermissions = service.getRolePermissions("super_admin");
      expect(superAdminPermissions.length).toBeGreaterThan(10);
    });
  });

  describe("hasAnyPermission", () => {
    it("should return true if any permission matches", () => {
      expect(
        service.hasAnyPermission("buyer", ["property:read", "property:create"])
      ).toBe(true);
    });

    it("should return false if no permissions match", () => {
      expect(
        service.hasAnyPermission("guest", ["property:create", "property:delete"])
      ).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("should return true if all permissions match", () => {
      expect(
        service.hasAllPermissions("agent", [
          "listing:create",
          "listing:read",
          "listing:update",
        ])
      ).toBe(true);
    });

    it("should return false if any permission missing", () => {
      expect(
        service.hasAllPermissions("buyer", [
          "property:read",
          "property:create",
        ])
      ).toBe(false);
    });
  });

  describe("canAccessResource", () => {
    it("should allow owner to access their resource", () => {
      expect(
        service.canAccessResource(
          {
            userId: "user_123",
            role: "seller",
            resourceOwnerId: "user_123",
          },
          "property:update"
        )
      ).toBe(true);
    });

    it("should deny non-owner access", () => {
      expect(
        service.canAccessResource(
          {
            userId: "user_other",
            role: "seller",
            resourceOwnerId: "user_123",
          },
          "property:update"
        )
      ).toBe(false);
    });

    it("should allow admin to access any resource", () => {
      expect(
        service.canAccessResource(
          {
            userId: "admin_123",
            role: "admin",
            resourceOwnerId: "user_123",
          },
          "property:update"
        )
      ).toBe(true);
    });

    it("should deny if no permission", () => {
      expect(
        service.canAccessResource(
          {
            userId: "user_123",
            role: "guest",
          },
          "property:create"
        )
      ).toBe(false);
    });
  });

  describe("canModifyResource", () => {
    it("should allow owner to modify their resource", () => {
      expect(
        service.canModifyResource(
          {
            userId: "user_123",
            role: "seller",
            resourceOwnerId: "user_123",
          },
          "property:update"
        )
      ).toBe(true);
    });

    it("should deny non-owner modification", () => {
      expect(
        service.canModifyResource(
          {
            userId: "user_other",
            role: "seller",
            resourceOwnerId: "user_123",
          },
          "property:update"
        )
      ).toBe(false);
    });

    it("should allow admin to modify any resource", () => {
      expect(
        service.canModifyResource(
          {
            userId: "admin_123",
            role: "admin",
            resourceOwnerId: "user_123",
          },
          "property:update"
        )
      ).toBe(true);
    });
  });

  describe("getRolesWithPermission", () => {
    it("should return roles with property:read", () => {
      const roles = service.getRolesWithPermission("property:read");

      expect(roles).toContain("guest");
      expect(roles).toContain("buyer");
      expect(roles).toContain("seller");
      expect(roles).toContain("agent");
      expect(roles).toContain("admin");
    });

    it("should return roles with admin:access", () => {
      const roles = service.getRolesWithPermission("admin:access");

      expect(roles).toContain("admin");
      expect(roles).toContain("super_admin");
      expect(roles).not.toContain("guest");
      expect(roles).not.toContain("buyer");
    });
  });

  describe("isAgentResource", () => {
    it("should return true for agent's own resource", () => {
      expect(
        service.isAgentResource({
          userId: "agt_123",
          role: "agent",
          resourceAgentId: "agt_123",
        })
      ).toBe(true);
    });

    it("should return false for non-agent resource", () => {
      expect(
        service.isAgentResource({
          userId: "user_123",
          role: "buyer",
          resourceAgentId: "agt_123",
        })
      ).toBe(false);
    });
  });

  describe("isOwnerResource", () => {
    it("should return true for owner's resource", () => {
      expect(
        service.isOwnerResource({
          userId: "user_123",
          role: "buyer",
          resourceOwnerId: "user_123",
        })
      ).toBe(true);
    });

    it("should return false for non-owner resource", () => {
      expect(
        service.isOwnerResource({
          userId: "user_other",
          role: "buyer",
          resourceOwnerId: "user_123",
        })
      ).toBe(false);
    });
  });

  describe("canViewPrivateData", () => {
    it("should allow agents to view private data", () => {
      expect(service.canViewPrivateData({ userId: "agt_123", role: "agent" })).toBe(true);
    });

    it("should allow admins to view private data", () => {
      expect(service.canViewPrivateData({ userId: "admin_123", role: "admin" })).toBe(true);
    });

    it("should deny buyers from viewing private data", () => {
      expect(service.canViewPrivateData({ userId: "user_123", role: "buyer" })).toBe(false);
    });
  });

  describe("canManageUsers", () => {
    it("should allow admins to manage users", () => {
      expect(service.canManageUsers({ userId: "admin_123", role: "admin" })).toBe(true);
    });

    it("should deny agents from managing users", () => {
      expect(service.canManageUsers({ userId: "agt_123", role: "agent" })).toBe(false);
    });
  });

  describe("canAccessAnalytics", () => {
    it("should allow agents to access analytics", () => {
      expect(service.canAccessAnalytics({ userId: "agt_123", role: "agent" })).toBe(true);
    });

    it("should deny buyers from accessing analytics", () => {
      expect(service.canAccessAnalytics({ userId: "user_123", role: "buyer" })).toBe(false);
    });
  });

  describe("canUseAI", () => {
    it("should allow buyers to use AI", () => {
      expect(service.canUseAI({ userId: "user_123", role: "buyer" })).toBe(true);
    });

    it("should deny guests from using AI", () => {
      expect(service.canUseAI({ userId: "guest_123", role: "guest" })).toBe(false);
    });
  });
});
