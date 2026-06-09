import { NextRequest, NextResponse } from "next/server";

import { createParadisePixPayment, isParadiseConfigured } from "@/lib/paradise-gateway";
import { createPurchase, getPurchases, updatePurchaseGateway, updatePurchaseStatus, type PurchaseStatus } from "@/lib/purchase-store";
import { requireAdmin } from "@/lib/admin-auth";

const statuses: PurchaseStatus[] = ["pending", "confirmed", "cancelled"];

function parsePriceToCents(price: string) {
  const numeric = Number(price.replace("R$", "").replace(/\./g, "").replace(",", ".").trim());
  return Math.round(numeric * 100);
}

export async function GET(request: NextRequest) {
  const accountEmail = request.nextUrl.searchParams.get("email") ?? undefined;
  const confirmedOnly = request.nextUrl.searchParams.get("confirmedOnly") === "true";

  if (!accountEmail) {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;
  }

  return NextResponse.json({
    purchases: await getPurchases({ accountEmail, confirmedOnly }),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    accountEmail?: string;
    robloxUser?: string;
    packageId?: string;
    customerEmail?: string;
    customerDocument?: string;
    customerPhone?: string;
    cardHolderName?: string;
    cardLast4?: string;
    amount?: string;
    price?: string;
    total?: string;
    paymentMethod?: "pix" | "card";
    coupon?: string;
  } | null;

  const customerDocument = body?.customerDocument?.replace(/\D/g, "") ?? "";
  const customerPhone = body?.customerPhone?.replace(/\D/g, "") ?? "";
  const customerEmail = body?.customerEmail?.trim() || body?.accountEmail?.trim() || "";
  const accountEmail = body?.accountEmail?.trim() || customerEmail;

  if (!accountEmail || !customerEmail.includes("@") || !body?.robloxUser?.trim() || !body.packageId || !body.amount || !body.price || !body.total || !body.paymentMethod || customerPhone.length < 10) {
    return NextResponse.json({ error: "Preencha os dados da compra." }, { status: 400 });
  }

  if (body.paymentMethod === "pix" && !isParadiseConfigured()) {
    return NextResponse.json({ error: "Configure PARADISE_API_TOKEN no .env.local antes de gerar pagamentos." }, { status: 500 });
  }

  const purchase = await createPurchase({
    accountEmail,
    robloxUser: body.robloxUser.trim(),
    packageId: body.packageId,
    amount: body.amount,
    price: body.price,
    total: body.total,
    paymentMethod: body.paymentMethod,
    coupon: body.coupon?.trim() || undefined,
    cardHolderName: body.paymentMethod === "card" ? body.cardHolderName?.trim() || undefined : undefined,
    cardLast4: body.paymentMethod === "card" ? body.cardLast4?.replace(/\D/g, "").slice(-4) || undefined : undefined,
  });

  if (body.paymentMethod === "card") {
    return NextResponse.json({ purchase }, { status: 201 });
  }

  try {
    const payment = await createParadisePixPayment({
      amountCents: parsePriceToCents(body.total),
      customer: {
        document: customerDocument || undefined,
        email: customerEmail,
        name: body.robloxUser.trim(),
        phone: customerPhone,
      },
      postbackUrl: `${request.nextUrl.origin}/api/paradise/webhook`,
      purchaseId: purchase.id,
      robloxAmount: body.amount,
    });

    const updatedPurchase = await updatePurchaseGateway({
      id: purchase.id,
      gatewayPaymentId: payment.gatewayPaymentId,
      gatewayProvider: "paradise",
      paymentUrl: payment.paymentUrl,
      pixCopyPaste: payment.pixCopyPaste,
      pixQrCode: payment.pixQrCode,
    });

    return NextResponse.json({ payment, purchase: updatedPurchase ?? purchase }, { status: 201 });
  } catch (error) {
    await updatePurchaseStatus({ id: purchase.id, status: "cancelled" });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nao foi possivel gerar o pagamento na Paradise." },
      { status: 502 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null) as {
    id?: string;
    status?: PurchaseStatus;
  } | null;

  if (!body?.id || !body.status || !statuses.includes(body.status)) {
    return NextResponse.json({ error: "Status invalido." }, { status: 400 });
  }

  const purchase = await updatePurchaseStatus({ id: body.id, status: body.status });

  if (!purchase) {
    return NextResponse.json({ error: "Compra nao encontrada." }, { status: 404 });
  }

  return NextResponse.json({ purchase });
}
