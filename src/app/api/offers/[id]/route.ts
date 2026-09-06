import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            property: {
              include: {
                images: { orderBy: { order: "asc" } },
                neighborhoods: true,
                aiValuation: true,
              },
            },
            user: { select: { id: true, name: true, email: true } },
          },
        },
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, error: "Offer not found" },
        { status: 404 }
      );
    }

    const isOwner = offer.userId === session.user.id;
    const isSeller = offer.listing.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isSeller && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const similarOffers = await prisma.offer.findMany({
      where: {
        listingId: offer.listingId,
        id: { not: id },
        status: { not: "WITHDRAWN" },
      },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
      },
      orderBy: { amount: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...offer,
        similarOffers,
        isOwner,
        isSeller,
      },
    });
  } catch (error) {
    console.error("Offer fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch offer" },
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
    const offer = await prisma.offer.findUnique({ where: { id } });

    if (!offer) {
      return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateSchema = z.object({
      status: z.enum(["ACCEPTED", "REJECTED", "EXPIRED", "WITHDRAWN"]).optional(),
      amount: z.number().positive().optional(),
      message: z.string().max(2000).optional(),
    });

    const validatedData = updateSchema.parse(body);

    if (validatedData.status) {
      const listing = await prisma.listing.findUnique({
        where: { id: offer.listingId },
      });

      const isSeller = listing?.userId === session.user.id;
      const isBuyer = offer.userId === session.user.id;
      const isAdmin = session.user.role === "ADMIN";

      if (!isSeller && !isBuyer && !isAdmin) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }

      if (validatedData.status === "ACCEPTED" && !isSeller) {
        return NextResponse.json(
          { success: false, error: "Only the seller can accept offers" },
          { status: 403 }
        );
      }

      if (["REJECTED", "EXPIRED"].includes(validatedData.status) && !isSeller && !isAdmin) {
        return NextResponse.json(
          { success: false, error: "Only the seller can reject or expire offers" },
          { status: 403 }
        );
      }

      if (validatedData.status === "WITHDRAWN" && !isBuyer) {
        return NextResponse.json(
          { success: false, error: "Only the buyer can withdraw an offer" },
          { status: 403 }
        );
      }

      if (validatedData.status === "ACCEPTED") {
        await prisma.offer.updateMany({
          where: {
            listingId: offer.listingId,
            id: { not: id },
            status: { in: ["PENDING", "COUNTERED"] },
          },
          data: { status: "REJECTED" },
        });
      }
    }

    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: {
        ...(validatedData.status && { status: validatedData.status as never }),
        ...(validatedData.amount && { amount: validatedData.amount }),
        ...(validatedData.message !== undefined && { message: validatedData.message }),
      },
      include: {
        listing: {
          include: {
            property: { include: { images: { where: { isPrimary: true }, take: 1 } } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedOffer,
      message: `Offer ${validatedData.status?.toLowerCase() || "updated"}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Offer update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update offer" },
      { status: 500 }
    );
  }
}
