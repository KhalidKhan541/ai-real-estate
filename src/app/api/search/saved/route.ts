import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: savedSearches });
  } catch (error) {
    console.error("Saved searches fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch saved searches" },
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
      name: z.string().min(1).max(100),
      query: z.record(z.unknown()),
      alerts: z.boolean().default(true),
    });

    const validatedData = createSchema.parse(body);

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        query: validatedData.query,
        alerts: validatedData.alerts,
      },
    });

    return NextResponse.json(
      { success: true, data: savedSearch, message: "Search saved successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Saved search creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save search" },
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
        { success: false, error: "Search ID required" },
        { status: 400 }
      );
    }

    const savedSearch = await prisma.savedSearch.findUnique({ where: { id } });

    if (!savedSearch || savedSearch.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Saved search not found" },
        { status: 404 }
      );
    }

    await prisma.savedSearch.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Saved search deleted successfully",
    });
  } catch (error) {
    console.error("Saved search deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete saved search" },
      { status: 500 }
    );
  }
}
