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
    const { id } = params;

    const images = await prisma.propertyImage.findMany({
      where: { propertyId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error("Images fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const property = await prisma.property.findUnique({ where: { id } });

    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }

    const body = await request.json();
    const imageSchema = z.object({
      images: z.array(
        z.object({
          url: z.string().url(),
          alt: z.string().optional(),
          isPrimary: z.boolean().default(false),
          order: z.number().int().min(0).optional(),
        })
      ).min(1).max(50),
    });

    const validatedData = imageSchema.parse(body);

    const existingImages = await prisma.propertyImage.count({
      where: { propertyId: id },
    });

    const images = await prisma.propertyImage.createMany({
      data: validatedData.images.map((img, index) => ({
        propertyId: id,
        url: img.url,
        alt: img.alt,
        isPrimary: img.isPrimary,
        order: img.order ?? existingImages + index,
      })),
    });

    const allImages = await prisma.propertyImage.findMany({
      where: { propertyId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(
      { success: true, data: allImages, message: `${images.count} images uploaded` },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Image upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload images" },
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

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: "Image ID required" },
        { status: 400 }
      );
    }

    const image = await prisma.propertyImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.propertyId !== id) {
      return NextResponse.json(
        { success: false, error: "Image not found" },
        { status: 404 }
      );
    }

    await prisma.propertyImage.delete({ where: { id: imageId } });

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Image deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete image" },
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
    const body = await request.json();

    const reorderSchema = z.object({
      imageOrders: z.array(
        z.object({
          id: z.string(),
          order: z.number().int().min(0),
          isPrimary: z.boolean().optional(),
        })
      ).min(1),
    });

    const validatedData = reorderSchema.parse(body);

    const updates = validatedData.imageOrders.map((item) =>
      prisma.propertyImage.update({
        where: { id: item.id },
        data: {
          order: item.order,
          ...(item.isPrimary !== undefined && { isPrimary: item.isPrimary }),
        },
      })
    );

    await prisma.$transaction(updates);

    const images = await prisma.propertyImage.findMany({
      where: { propertyId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: images,
      message: "Images reordered successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Image reorder error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reorder images" },
      { status: 500 }
    );
  }
}
