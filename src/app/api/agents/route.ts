import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { cache } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const verified = searchParams.get("verified");
    const specializations = searchParams.get("specializations");
    const sort = searchParams.get("sort") || "rating";
    const order = searchParams.get("order") || "desc";

    const cacheKey = `agents:${JSON.stringify({ page, limit, verified, specializations, sort, order })}`;
    const cached = cache.get(cacheKey);
    if (cached) return NextResponse.json(cached);

    const where: Record<string, unknown> = {};

    if (verified === "true") {
      where.verified = true;
    }

    if (specializations) {
      const specs = specializations.split(",");
      where.specializations = { hasSome: specs };
    }

    const offset = (page - 1) * limit;

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
          _count: { select: { listings: true } },
        },
        orderBy: { [sort]: order },
        skip: offset,
        take: limit,
      }),
      prisma.agent.count({ where }),
    ]);

    const enrichedAgents = agents.map((agent) => ({
      ...agent,
      listingCount: agent._count.listings,
      _count: undefined,
    }));

    const result = {
      success: true,
      data: enrichedAgents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };

    cache.set(cacheKey, result, 5 * 60 * 1000);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Agents fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const createSchema = z.object({
      userId: z.string(),
      licenseNumber: z.string().min(1),
      agency: z.string().optional(),
      bio: z.string().max(2000).optional(),
      specializations: z.array(z.string()).default([]),
      yearsExperience: z.number().min(0).max(60).optional(),
    });

    const validatedData = createSchema.parse(body);

    const existingAgent = await prisma.agent.findUnique({
      where: { userId: validatedData.userId },
    });

    if (existingAgent) {
      return NextResponse.json(
        { success: false, error: "User is already an agent" },
        { status: 409 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        userId: validatedData.userId,
        licenseNumber: validatedData.licenseNumber,
        agency: validatedData.agency,
        bio: validatedData.bio,
        specializations: validatedData.specializations,
        yearsExperience: validatedData.yearsExperience,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.user.update({
      where: { id: validatedData.userId },
      data: { role: "AGENT" },
    });

    cache.invalidatePattern("agents:*");

    return NextResponse.json(
      { success: true, data: agent, message: "Agent created successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Agent creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
