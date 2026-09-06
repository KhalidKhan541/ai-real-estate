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

    const virtualTour = await prisma.virtualTour.findUnique({
      where: { propertyId: id },
    });

    if (!virtualTour) {
      return NextResponse.json(
        { success: false, error: "No virtual tour found for this property" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: virtualTour });
  } catch (error) {
    console.error("Virtual tour fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch virtual tour" },
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

    const existingTour = await prisma.virtualTour.findUnique({
      where: { propertyId: id },
    });

    if (existingTour) {
      return NextResponse.json(
        { success: false, error: "Virtual tour already exists. Use PUT to update." },
        { status: 409 }
      );
    }

    const body = await request.json();
    const tourSchema = z.object({
      url: z.string().url("Invalid virtual tour URL"),
      type: z.enum(["3d", "360", "video", "matterport"]).default("3d"),
      provider: z.string().optional(),
    });

    const validatedData = tourSchema.parse(body);

    const virtualTour = await prisma.virtualTour.create({
      data: {
        propertyId: id,
        url: validatedData.url,
        type: validatedData.type,
        provider: validatedData.provider,
      },
    });

    return NextResponse.json(
      { success: true, data: virtualTour, message: "Virtual tour created" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Virtual tour creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create virtual tour" },
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

    const updateSchema = z.object({
      url: z.string().url().optional(),
      type: z.enum(["3d", "360", "video", "matterport"]).optional(),
      provider: z.string().optional(),
    });

    const validatedData = updateSchema.parse(body);

    const virtualTour = await prisma.virtualTour.upsert({
      where: { propertyId: id },
      create: {
        propertyId: id,
        url: validatedData.url || "",
        type: validatedData.type || "3d",
        provider: validatedData.provider,
      },
      update: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: virtualTour,
      message: "Virtual tour updated",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Virtual tour update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update virtual tour" },
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
    const existingTour = await prisma.virtualTour.findUnique({
      where: { propertyId: id },
    });

    if (!existingTour) {
      return NextResponse.json(
        { success: false, error: "No virtual tour found" },
        { status: 404 }
      );
    }

    await prisma.virtualTour.delete({ where: { propertyId: id } });

    return NextResponse.json({
      success: true,
      message: "Virtual tour deleted successfully",
    });
  } catch (error) {
    console.error("Virtual tour deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete virtual tour" },
      { status: 500 }
    );
  }
}
