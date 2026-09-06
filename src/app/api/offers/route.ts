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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status");
    const listingId = searchParams.get("listingId");

    const where: Record<string, unknown> = {};

    if (session.user.role === "ADMIN") {
      if (listingId) where.listingId = listingId;
    } else {
      const agent = await prisma.agent.findUnique({
        where: { userId: session.user.id },
      });

      if (agent) {
        const agentListings = await prisma.listing.findMany({
          where: { agentId: agent.id },
          select: { id: true },
        });
        const agentListingIds = agentListings.map((l) => l.id);

        where.OR = [
          { userId: session.user.id },
          { listingId: { in: agentListingIds } },
        ];
      } else {
        where.userId = session.user.id;
      }
    }

    if (status) where.status = status;
    if (listingId && !where.OR) where.listingId = listingId;

    const offset = (page - 1) * limit;

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        include: {
          listing: {
            include: {
              property: {
                include: {
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.offer.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: offers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Offers fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch offers" },
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

    const body = await request.json();
    const createSchema = z.object({
      listingId: z.string(),
      amount: z.number().positive(),
      conditions: z.array(z.string()).default([]),
      financingType: z.enum(["cash", "conventional", "fha", "va", "usda"]).optional(),
      inspectionPeriod: z.number().min(0).max(30).default(10),
      closingDate: z.string().optional(),
      message: z.string().max(2000).optional(),
    });

    const validatedData = createSchema.parse(body);

    const listing = await prisma.listing.findUnique({
      where: { id: validatedData.listingId },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Listing is not active" },
        { status: 400 }
      );
    }

    if (listing.userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot make an offer on your own listing" },
        { status: 400 }
      );
    }

    const existingOffer = await prisma.offer.findFirst({
      where: {
        listingId: validatedData.listingId,
        userId: session.user.id,
        status: { in: ["PENDING", "COUNTERED"] },
      },
    });

    if (existingOffer) {
      return NextResponse.json(
        { success: false, error: "You already have an active offer on this listing" },
        { status: 409 }
      );
    }

    const offer = await prisma.offer.create({
      data: {
        listingId: validatedData.listingId,
        userId: session.user.id,
        amount: validatedData.amount,
        conditions: validatedData.conditions,
        financingType: validatedData.financingType,
        inspectionPeriod: validatedData.inspectionPeriod,
        closingDate: validatedData.closingDate ? new Date(validatedData.closingDate) : null,
        message: validatedData.message,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      include: {
        listing: {
          include: {
            property: { include: { images: { where: { isPrimary: true }, take: 1 } } },
          },
        },
      },
    });

    await prisma.listing.update({
      where: { id: validatedData.listingId },
      data: { inquiries: { increment: 1 } },
    });

    return NextResponse.json(
      { success: true, data: offer, message: "Offer submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Offer creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create offer" },
      { status: 500 }
    );
  }
}
