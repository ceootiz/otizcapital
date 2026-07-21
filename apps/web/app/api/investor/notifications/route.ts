import { NextResponse } from "next/server";
import {
  countUnreadInvestorNotifications,
  isProductFeatureEnabled,
  listInvestorNotifications,
  searchInvestorNotifications,
  serializeInvestorNotification
} from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

function parseFavoriteIds(value: string | null) {
  if (!value) return undefined;
  return value
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^[a-zA-Z0-9_-]{1,64}$/.test(id))
    .slice(0, 100);
}

function dateFromPreset(value: string | null) {
  const days = value === "7" ? 7 : value === "30" ? 30 : null;
  return days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined;
}

export async function GET(request: Request) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  const centerEnabled = await isProductFeatureEnabled("notification-center");

  if (centerEnabled) {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const favoriteIds = parseFavoriteIds(url.searchParams.get("favoriteIds"));
    const [result, unreadCount] = await Promise.all([
      searchInvestorNotifications(auth.investor.id, {
        query: url.searchParams.get("query") ?? undefined,
        type: url.searchParams.get("type") ?? undefined,
        isRead: status === "read" ? true : status === "unread" ? false : undefined,
        from: dateFromPreset(url.searchParams.get("days")),
        ids: url.searchParams.get("favorites") === "true" ? favoriteIds ?? [] : undefined,
        page: Number(url.searchParams.get("page")) || 1,
        pageSize: 8
      }),
      countUnreadInvestorNotifications(auth.investor.id)
    ]);
    const favoriteSet = new Set(favoriteIds ?? []);

    return NextResponse.json({
      ok: true,
      centerEnabled: true,
      unreadCount,
      notifications: result.rows.map((row) => ({
        ...serializeInvestorNotification(row),
        isFavorite: favoriteSet.has(row.id)
      })),
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  }

  const [rows, unreadCount] = await Promise.all([
    listInvestorNotifications(auth.investor.id, 20),
    countUnreadInvestorNotifications(auth.investor.id)
  ]);

  return NextResponse.json({ ok: true, centerEnabled: false, unreadCount, notifications: rows.map(serializeInvestorNotification) });
}
