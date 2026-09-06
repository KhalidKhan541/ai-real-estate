import { NextAuthOptions, getServerSession } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { env } from "./config";
import type { UserRole } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Type Augmentation
// ─────────────────────────────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      role: UserRole;
      isVerified: boolean;
      isActive: boolean;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    isVerified: boolean;
    isActive: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    isVerified: boolean;
    isActive: boolean;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
    newUser: "/onboarding",
  },
  providers: [
    // ─── Credentials Provider ──────────────────────────────────────────────
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          throw new Error("No account found with this email");
        }

        if (!user.password) {
          throw new Error(
            "This account uses social login. Please sign in with your provider."
          );
        }

        if (!user.isActive) {
          throw new Error(
            "Your account has been deactivated. Please contact support."
          );
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Update last login timestamp
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
        };
      },
    }),

    // ─── GitHub Provider ───────────────────────────────────────────────────
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          role: "BUYER" as UserRole,
          isVerified: true,
          isActive: true,
        };
      },
    }),

    // ─── Google Provider ──────────────────────────────────────────────────
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "BUYER" as UserRole,
          isVerified: true,
          isActive: true,
        };
      },
    }),
  ],

  callbacks: {
    // ─── JWT Callback ──────────────────────────────────────────────────────
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isVerified = user.isVerified;
        token.isActive = user.isActive;
      }

      // Handle session update (e.g., after role change)
      if (trigger === "update" && session) {
        const updatedUser = await db.user.findUnique({
          where: { id: token.id },
          select: { role: true, isVerified: true, isActive: true },
        });

        if (updatedUser) {
          token.role = updatedUser.role;
          token.isVerified = updatedUser.isVerified;
          token.isActive = updatedUser.isActive;
        }
      }

      return token;
    },

    // ─── Session Callback ──────────────────────────────────────────────────
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isVerified = token.isVerified;
        session.user.isActive = token.isActive;
      }

      return session;
    },

    // ─── Sign In Callback ──────────────────────────────────────────────────
    async signIn({ user, account, profile }) {
      if (!account || !user) return false;

      // For OAuth providers, check if user exists and create if not
      if (account.provider !== "credentials") {
        const existingUser = await db.user.findUnique({
          where: { email: user.email?.toLowerCase() ?? "" },
          include: { accounts: true },
        });

        if (existingUser) {
          // Check if this OAuth provider is already linked
          const hasProvider = existingUser.accounts.some(
            (a) =>
              a.provider === account.provider &&
              a.providerAccountId === account.providerAccountId
          );

          if (!hasProvider) {
            // Link the new OAuth provider to existing account
            await db.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            });
          }

          // Update user's last login
          await db.user.update({
            where: { id: existingUser.id },
            data: { lastLoginAt: new Date() },
          });

          user.id = existingUser.id;
          user.role = existingUser.role;
          user.isVerified = existingUser.isVerified;
          user.isActive = existingUser.isActive;
        }
      }

      // Check if user is active
      if (user.isActive === false) {
        return false;
      }

      return true;
    },

    // ─── Redirect Callback ─────────────────────────────────────────────────
    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      // Allow redirects to the same origin
      if (new URL(url).origin === baseUrl) return url;

      return baseUrl;
    },
  },

  events: {
    // ─── Sign In Event ─────────────────────────────────────────────────────
    async signIn({ user, account, isNewUser }) {
      if (isNewUser && user.id) {
        // Create default notification preferences for new users
        await db.notificationPreference.create({
          data: {
            userId: user.id,
            emailNotifications: true,
            pushNotifications: true,
          },
        });
      }
    },
  },

  // ─── Debug Mode ──────────────────────────────────────────────────────────
  debug: env.NODE_ENV === "development",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function canAccessResource(
  userRole: UserRole,
  resourceOwnerId: string,
  userId: string
): boolean {
  // Admins and super admins can access everything
  if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") return true;

  // Owners can access their own resources
  return resourceOwnerId === userId;
}

export function canPerformAction(
  userRole: UserRole,
  action: string,
  resource?: { ownerId?: string; userId?: string }
): boolean {
  const permissions: Record<UserRole, string[]> = {
    SUPER_ADMIN: ["*"],
    ADMIN: [
      "manage_users",
      "manage_listings",
      "manage_transactions",
      "view_analytics",
      "manage_settings",
      "delete_content",
    ],
    BROKER: [
      "manage_agents",
      "manage_listings",
      "view_transactions",
      "view_analytics",
    ],
    AGENT: [
      "manage_properties",
      "manage_listings",
      "manage_clients",
      "create_transactions",
      "view_own_analytics",
    ],
    SELLER: [
      "manage_own_properties",
      "view_own_listings",
      "respond_to_offers",
      "view_own_transactions",
    ],
    BUYER: [
      "search_properties",
      "save_searches",
      "make_offers",
      "view_own_transactions",
      "schedule_appointments",
    ],
  };

  const rolePermissions = permissions[userRole] || [];

  // Wildcard check
  if (rolePermissions.includes("*")) return true;

  // Check specific action
  if (rolePermissions.includes(action)) {
    // If resource is provided, check ownership
    if (resource?.ownerId) {
      return resource.ownerId === resource?.userId;
    }
    return true;
  }

  return false;
}
