import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;

    const offset = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          property: { select: { id: true, title: true, city: true, state: true } },
        },
        orderBy: { [sort]: order },
        skip: offset,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    const ratingDistribution = await prisma.review.groupBy({
      by: ["rating"],
      where,
      _count: { rating: true },
    });

    const distribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: ratingDistribution.find((r) => r.rating === rating)?._count.rating || 0,
    }));

    const avgRating =
      total > 0
        ? distribution.reduce((sum, d) => sum + d.rating * d.count, 0) / total
        : 0;

    return NextResponse.json({
      success: true,
      data: reviews,
      stats: {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: total,
        distribution,
      },
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
    console.error("Reviews fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
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
      propertyId: z.string(),
      rating: z.number().min(1).max(5),
      title: z.string().max(200).optional(),
      content: z.string().max(2000).optional(),
    });

    const validatedData = createSchema.parse(body);

    const property = await prisma.property.findUnique({
      where: { id: validatedData.propertyId },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_propertyId: {
          userId: session.user.id,
          propertyId: validatedData.propertyId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: "You have already reviewed this property" },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        propertyId: validatedData.propertyId,
        rating: validatedData.rating,
        title: validatedData.title,
        content: validatedData.content,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        property: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: review, message: "Review submitted" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Review creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create review" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Review ID required" },
        { status: 400 }
      );
    }

    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    if (review.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    await prisma.review.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Review deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
