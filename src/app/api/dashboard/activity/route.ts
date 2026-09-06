import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type");

    const isAdmin = session.user.role === "ADMIN";

    const whereClause: Record<string, unknown> = {};
    if (!isAdmin) {
      whereClause.userId = session.user.id;
    }

    const notifications = await prisma.notification.findMany({
      where: {
        ...(isAdmin ? {} : whereClause),
        ...(type && { type }),
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        ...(isAdmin ? {} : whereClause),
        read: false,
      },
    });

    const activityItems = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: activityItems,
      unreadCount,
      pagination: {
        offset,
        limit,
        hasMore: activityItems.length === limit,
      },
    });
  } catch (error) {
    console.error("Activity fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activity" },
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
    const markSchema = z.object({
      ids: z.array(z.string()).optional(),
      markAll: z.boolean().default(false),
    });

    const validatedData = markSchema.parse(body);

    if (validatedData.markAll) {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        data: { read: true },
      });
    } else if (validatedData.ids?.length) {
      await prisma.notification.updateMany({
        where: {
          id: { in: validatedData.ids },
          userId: session.user.id,
        },
        data: { read: true },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Activity update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update activity" },
      { status: 500 }
    );
  }
}
