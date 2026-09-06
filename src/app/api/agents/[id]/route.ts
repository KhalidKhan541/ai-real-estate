import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { cache } from "@/lib/cache";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const cacheKey = `agent:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
            createdAt: true,
          },
        },
        listings: {
          include: {
            property: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
                reviews: { select: { rating: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: { select: { listings: true } },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 }
      );
    }

    const avgListingPrice =
      agent.listings.length > 0
        ? agent.listings.reduce((sum, l) => sum + l.price, 0) / agent.listings.length
        : 0;

    const result = {
      success: true,
      data: {
        ...agent,
        listingCount: agent._count.listings,
        avgListingPrice,
        _count: undefined,
        listings: agent.listings.map((l) => ({
          ...l,
          property: {
            ...l.property,
            avgRating:
              l.property.reviews.length > 0
                ? l.property.reviews.reduce((sum, r) => sum + r.rating, 0) / l.property.reviews.length
                : null,
            reviews: undefined,
          },
        })),
      },
    };

    cache.set(cacheKey, result, 10 * 60 * 1000);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Agent fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch agent" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const agent = await prisma.agent.findUnique({ where: { id } });

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    if (agent.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updateSchema = z.object({
      agency: z.string().optional(),
      bio: z.string().max(2000).optional(),
      specializations: z.array(z.string()).optional(),
      yearsExperience: z.number().min(0).max(60).optional(),
      licenseNumber: z.string().min(1).optional(),
    });

    const validatedData = updateSchema.parse(body);

    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: validatedData,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    cache.delete(`agent:${id}`);
    cache.invalidatePattern("agents:*");

    return NextResponse.json({
      success: true,
      data: updatedAgent,
      message: "Agent profile updated",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Agent update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update agent" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const agent = await prisma.agent.findUnique({ where: { id } });

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }

    await prisma.agent.delete({ where: { id } });
    await prisma.user.update({
      where: { id: agent.userId },
      data: { role: "BUYER" },
    });

    cache.delete(`agent:${id}`);
    cache.invalidatePattern("agents:*");

    return NextResponse.json({
      success: true,
      message: "Agent deleted successfully",
    });
  } catch (error) {
    console.error("Agent deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete agent" },
      { status: 500 }
    );
  }
}
