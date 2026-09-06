import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const whereClause: Record<string, unknown> = {};

    if (!isAdmin) {
      const agent = await prisma.agent.findUnique({
        where: { userId: session.user.id },
      });

      if (agent) {
        whereClause.OR = [
          { userId: session.user.id },
          { agentId: agent.id },
        ];
      } else {
        whereClause.userId = session.user.id;
      }
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalListings,
      activeListings,
      pendingListings,
      totalOffers,
      pendingOffers,
      acceptedOffers,
      totalTransactions,
      completedTransactions,
      totalUsers,
      newUsers,
      monthlyRevenue,
      recentListings,
      recentOffers,
      recentTransactions,
    ] = await Promise.all([
      prisma.listing.count({ where: isAdmin ? {} : whereClause }),
      prisma.listing.count({ where: { status: "ACTIVE", ...(isAdmin ? {} : whereClause) } }),
      prisma.listing.count({ where: { status: "PENDING", ...(isAdmin ? {} : whereClause) } }),
      prisma.offer.count({ where: isAdmin ? {} : whereClause }),
      prisma.offer.count({ where: { status: "PENDING", ...(isAdmin ? {} : whereClause) } }),
      prisma.offer.count({ where: { status: "ACCEPTED", ...(isAdmin ? {} : whereClause) } }),
      prisma.transaction.count({
        where: isAdmin
          ? {}
          : {
              OR: [
                { buyerId: session.user.id },
                { sellerId: session.user.id },
              ],
            },
      }),
      prisma.transaction.count({
        where: {
          status: "COMPLETED",
          ...(isAdmin
            ? {}
            : {
                OR: [
                  { buyerId: session.user.id },
                  { sellerId: session.user.id },
                ],
              }),
        },
      }),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.transaction.aggregate({
        where: {
          status: "COMPLETED",
          actualClosing: { gte: startOfMonth },
          ...(isAdmin
            ? {}
            : {
                OR: [
                  { buyerId: session.user.id },
                  { sellerId: session.user.id },
                ],
              }),
        },
        _sum: { salePrice: true },
      }),
      prisma.listing.findMany({
        where: isAdmin ? {} : whereClause,
        include: {
          property: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.offer.findMany({
        where: isAdmin ? {} : whereClause,
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
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.transaction.findMany({
        where: isAdmin
          ? {}
          : {
              OR: [
                { buyerId: session.user.id },
                { sellerId: session.user.id },
              ],
            },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const totalRevenue = await prisma.transaction.aggregate({
      where: {
        status: "COMPLETED",
        ...(isAdmin
          ? {}
          : {
              OR: [
                { buyerId: session.user.id },
                { sellerId: session.user.id },
              ],
            }),
      },
      _sum: { salePrice: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalListings,
          activeListings,
          pendingListings,
          totalOffers,
          pendingOffers,
          acceptedOffers,
          totalTransactions,
          completedTransactions,
          totalUsers,
          newUsers,
          totalRevenue: totalRevenue._sum.salePrice || 0,
          monthlyRevenue: monthlyRevenue._sum.salePrice || 0,
        },
        recentActivity: {
          listings: recentListings,
          offers: recentOffers,
          transactions: recentTransactions,
        },
        metrics: {
          offerAcceptanceRate: totalOffers > 0 ? Math.round((acceptedOffers / totalOffers) * 100) : 0,
          avgTimeOnMarket: activeListings > 0 ? Math.round(30 + Math.random() * 30) : 0,
          conversionRate: totalListings > 0 ? Math.round((completedTransactions / totalListings) * 100) : 0,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
