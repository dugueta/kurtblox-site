type ParadisePixInput = {
  purchaseId: string;
  amountCents: number;
  robloxAmount: string;
  customer: {
    document: string;
    email: string;
    name: string;
    phone: string;
  };
  postbackUrl?: string;
};

export type ParadisePixPayment = {
  gatewayPaymentId?: string;
  paymentUrl?: string;
  pixCopyPaste?: string;
  pixQrCode?: string;
  raw: unknown;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Configure ${name} para gerar pagamentos na Paradise.`);
  }

  return value;
}

function joinUrl(baseUrl: string, endpoint: string) {
  return new URL(endpoint, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
}

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

export function isParadiseConfigured() {
  return Boolean(process.env.PARADISE_API_TOKEN?.trim());
}

export async function createParadisePixPayment(input: ParadisePixInput): Promise<ParadisePixPayment> {
  const token = getRequiredEnv("PARADISE_API_TOKEN");
  const baseUrl = process.env.PARADISE_API_URL?.trim() || "https://multi.paradisepags.com";
  const endpoint = process.env.PARADISE_PIX_ENDPOINT?.trim() || "/api/v1/transaction.php";
  const authScheme = process.env.PARADISE_AUTH_SCHEME?.trim() ?? "Bearer";
  const authHeader = process.env.PARADISE_AUTH_HEADER?.trim() || "Authorization";
  const amountMode = process.env.PARADISE_AMOUNT_MODE?.trim() || "cents";
  const amount = amountMode === "decimal" ? input.amountCents / 100 : input.amountCents;

  const body = {
    amount,
    customer: {
      document: input.customer.document,
      email: input.customer.email,
      name: input.customer.name,
      phone: input.customer.phone,
    },
    description: `${input.robloxAmount} Robux`,
    postback_url: input.postbackUrl,
    reference: input.purchaseId,
    source: "api_externa",
  };

  const response = await fetch(joinUrl(baseUrl, endpoint), {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      [authHeader]: authScheme && authScheme.toLowerCase() !== "none" ? `${authScheme} ${token}` : token,
    },
    method: "POST",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await response.json().catch(() => null) as unknown : null;

  if (!response.ok) {
    const message = findString(data, ["message", "error", "detail"]) ?? `Paradise retornou HTTP ${response.status}. Confira PARADISE_API_URL e PARADISE_PIX_ENDPOINT.`;
    throw new Error(message);
  }

  if (!data) {
    throw new Error(`Paradise respondeu ${contentType || "sem content-type"}, mas era esperado JSON. Confira PARADISE_PIX_ENDPOINT.`);
  }

  return {
    gatewayPaymentId: findString(data, ["id", "transactionId", "transaction_id", "paymentId", "payment_id"]),
    paymentUrl: findString(data, ["paymentUrl", "payment_url", "checkoutUrl", "checkout_url", "url"]),
    pixCopyPaste: findString(data, ["pix_code", "qr_code", "pixCopyPaste", "pix_copy_paste", "copyPaste", "copy_paste", "brCode", "brcode"]),
    pixQrCode: findString(data, ["qr_code_base64", "pixQrCode", "pix_qr_code", "qrCodeBase64", "qrCodeImage", "qr_code_image"]),
    raw: data,
  };
}
