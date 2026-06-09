import { NextRequest, NextResponse } from "next/server";

import { updatePurchaseStatusFromGateway, type PurchaseStatus } from "@/lib/purchase-store";

function findString(value: unknown, keys: string[]): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;

  for (const key of keys) {
    const direct = record[key];
    if (typeof direct === "string" && direct.trim()) return direct;
  }

  for (const nested of Object.values(record)) {
    const found = findString(nested, keys);
    if (found) return found;
  }

  return undefined;
}

function normalizeStatus(status?: string): PurchaseStatus | null {
  const cleanStatus = status?.toLowerCase();

  if (!cleanStatus) return null;
  if (["approved", "paid", "confirmed", "completed", "success", "succeeded"].includes(cleanStatus)) return "confirmed";
  if (["cancelled", "canceled", "refused", "failed", "expired", "chargeback"].includes(cleanStatus)) return "cancelled";
  if (["pending", "waiting_payment", "processing"].includes(cleanStatus)) return "pending";

  return null;
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.PARADISE_WEBHOOK_SECRET?.trim();

  if (webhookSecret) {
    const receivedSecret = request.headers.get("x-webhook-secret") ?? request.headers.get("x-paradise-secret");

    if (receivedSecret !== webhookSecret) {
      return NextResponse.json({ error: "Webhook nao autorizado." }, { status: 401 });
    }
  }

  const body = await request.json().catch(() => null) as unknown;
  const reference = findString(body, ["purchaseId", "externalId", "external_id", "reference", "id", "transactionId", "transaction_id"]);
  const gatewayStatus = findString(body, ["status", "paymentStatus", "payment_status", "event"]);
  const status = normalizeStatus(gatewayStatus);

  if (!reference || !status) {
    return NextResponse.json({ error: "Webhook sem referencia ou status reconhecido." }, { status: 400 });
  }

  const purchase = await updatePurchaseStatusFromGateway({
    gatewayStatus: gatewayStatus ?? status,
    reference,
    status,
  });

  if (!purchase) {
    return NextResponse.json({ error: "Compra nao encontrada." }, { status: 404 });
  }

  return NextResponse.json({ purchase });
}
