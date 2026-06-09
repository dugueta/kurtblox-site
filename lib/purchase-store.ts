import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type PurchaseStatus = "pending" | "confirmed" | "cancelled";

export type PurchaseRecord = {
  id: string;
  accountEmail: string;
  robloxUser: string;
  packageId: string;
  amount: string;
  price: string;
  total: string;
  paymentMethod: "pix" | "card";
  coupon?: string;
  status: PurchaseStatus;
  createdAt: string;
  confirmedAt?: string;
  gatewayPaymentId?: string;
  gatewayProvider?: string;
  gatewayStatus?: string;
  gatewayEventAt?: string;
  paymentUrl?: string;
  pixCopyPaste?: string;
  pixQrCode?: string;
  cardHolderName?: string;
  cardLast4?: string;
};

type PurchasesData = {
  purchases: PurchaseRecord[];
};

const purchasesPath = path.join(process.cwd(), "data", "purchases.json");
const writablePurchasesPath = process.env.VERCEL
  ? path.join("/tmp", "kurtblox", "purchases.json")
  : purchasesPath;
const purchasesKvKey = "kurtblox:purchases";

function createEmptyData(): PurchasesData {
  return { purchases: [] };
}

function hasKvStore() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function readPurchasesFromKv(): Promise<PurchasesData | null> {
  if (!hasKvStore()) return null;

  const response = await fetch(process.env.KV_REST_API_URL!, {
    body: JSON.stringify(["GET", purchasesKvKey]),
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`KV read failed with HTTP ${response.status}`);
  }

  const data = await response.json() as { result?: string | PurchasesData | null };

  if (!data.result) return null;
  if (typeof data.result === "string") return JSON.parse(data.result) as PurchasesData;

  return data.result;
}

async function writePurchasesToKv(data: PurchasesData) {
  if (!hasKvStore()) return false;

  const response = await fetch(process.env.KV_REST_API_URL!, {
    body: JSON.stringify(["SET", purchasesKvKey, JSON.stringify(data)]),
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`KV write failed with HTTP ${response.status}`);
  }

  return true;
}

async function readPurchasesData(): Promise<PurchasesData> {
  try {
    const kvData = await readPurchasesFromKv();

    if (kvData) return kvData;
  } catch (error) {
    console.error("Nao foi possivel ler compras do KV.", error);
  }

  try {
    return JSON.parse(await readFile(writablePurchasesPath, "utf8")) as PurchasesData;
  } catch {
    try {
      return JSON.parse(await readFile(purchasesPath, "utf8")) as PurchasesData;
    } catch {
      return createEmptyData();
    }
  }
}

async function writePurchasesData(data: PurchasesData) {
  try {
    if (await writePurchasesToKv(data)) return;
  } catch (error) {
    console.error("Nao foi possivel gravar compras no KV.", error);
  }

  await mkdir(path.dirname(writablePurchasesPath), { recursive: true });
  await writeFile(writablePurchasesPath, JSON.stringify(data, null, 2));
}

export async function getPurchases(input?: { accountEmail?: string; confirmedOnly?: boolean }) {
  const data = await readPurchasesData();
  const accountEmail = input?.accountEmail?.toLowerCase();

  return data.purchases
    .filter((purchase) => !accountEmail || purchase.accountEmail.toLowerCase() === accountEmail)
    .filter((purchase) => !input?.confirmedOnly || purchase.status === "confirmed")
    .toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function createPurchase(input: Omit<PurchaseRecord, "id" | "status" | "createdAt" | "confirmedAt">) {
  const data = await readPurchasesData();
  const purchase: PurchaseRecord = {
    ...input,
    id: randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  data.purchases.push(purchase);
  await writePurchasesData(data);

  return purchase;
}

export async function updatePurchaseStatus(input: { id: string; status: PurchaseStatus }) {
  const data = await readPurchasesData();
  const purchase = data.purchases.find((item) => item.id === input.id);

  if (!purchase) {
    return null;
  }

  purchase.status = input.status;
  purchase.confirmedAt = input.status === "confirmed" ? new Date().toISOString() : undefined;
  await writePurchasesData(data);

  return purchase;
}

function applyStatus(purchase: PurchaseRecord, status: PurchaseStatus, gatewayStatus?: string) {
  purchase.status = status;
  purchase.confirmedAt = status === "confirmed" ? new Date().toISOString() : undefined;

  if (gatewayStatus) {
    purchase.gatewayStatus = gatewayStatus;
    purchase.gatewayEventAt = new Date().toISOString();
  }
}

export async function updatePurchaseGateway(input: {
  id: string;
  gatewayPaymentId?: string;
  gatewayProvider?: string;
  paymentUrl?: string;
  pixCopyPaste?: string;
  pixQrCode?: string;
}) {
  const data = await readPurchasesData();
  const purchase = data.purchases.find((item) => item.id === input.id);

  if (!purchase) {
    return null;
  }

  purchase.gatewayPaymentId = input.gatewayPaymentId;
  purchase.gatewayProvider = input.gatewayProvider;
  purchase.paymentUrl = input.paymentUrl;
  purchase.pixCopyPaste = input.pixCopyPaste;
  purchase.pixQrCode = input.pixQrCode;
  await writePurchasesData(data);

  return purchase;
}

export async function updatePurchaseStatusByReference(input: { reference: string; status: PurchaseStatus }) {
  const data = await readPurchasesData();
  const purchase = data.purchases.find((item) => item.id === input.reference || item.gatewayPaymentId === input.reference);

  if (!purchase) {
    return null;
  }

  applyStatus(purchase, input.status);
  await writePurchasesData(data);

  return purchase;
}

export async function updatePurchaseStatusFromGateway(input: {
  reference: string;
  status: PurchaseStatus;
  gatewayStatus: string;
}) {
  const data = await readPurchasesData();
  const purchase = data.purchases.find((item) => item.id === input.reference || item.gatewayPaymentId === input.reference);

  if (!purchase) {
    return null;
  }

  applyStatus(purchase, input.status, input.gatewayStatus);
  await writePurchasesData(data);

  return purchase;
}
