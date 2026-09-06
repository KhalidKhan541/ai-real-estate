import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { hash } from "bcryptjs";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        createdAt: true,
        agent: {
          select: {
            id: true,
            licenseNumber: true,
            agency: true,
            bio: true,
            specializations: true,
            yearsExperience: true,
            verified: true,
          },
        },
        savedSearches: {
          select: { id: true, name: true, alerts: true, createdAt: true },
          orderBy: { updatedAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            favorites: true,
            reviews: true,
            offers: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        stats: {
          favorites: user._count.favorites,
          reviews: user._count.reviews,
          offers: user._count.offers,
        },
        _count: undefined,
      },
    });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updateSchema = z.object({
      name: z.string().min(2).max(100).optional(),
      avatar: z.string().url().optional(),
      phone: z.string().optional(),
      currentPassword: z.string().optional(),
      newPassword: z
        .string()
        .min(8)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .optional(),
      agentProfile: z
        .object({
          bio: z.string().max(2000).optional(),
          agency: z.string().optional(),
          specializations: z.array(z.string()).optional(),
          yearsExperience: z.number().min(0).max(60).optional(),
        })
        .optional(),
    });

    const validatedData = updateSchema.parse(body);

    if (validatedData.currentPassword && validatedData.newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      const { compare } = await import("bcryptjs");
      const isValid = await compare(validatedData.currentPassword, user.password);

      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.avatar) updateData.avatar = validatedData.avatar;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;

    if (validatedData.newPassword) {
      updateData.password = await hash(validatedData.newPassword, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        updatedAt: true,
      },
    });

    if (validatedData.agentProfile) {
      const agent = await prisma.agent.findUnique({
        where: { userId: session.user.id },
      });

      if (agent) {
        await prisma.agent.update({
          where: { userId: session.user.id },
          data: validatedData.agentProfile,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "Settings updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Settings update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role === "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin accounts cannot be deleted" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id: session.user.id } });

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
