import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type AccountProvider = "email" | "google";

export type AccountRecord = {
  id: string;
  name: string;
  email: string;
  password?: string;
  provider: AccountProvider;
  createdAt: string;
  lastLoginAt: string;
};

export type AccountsData = {
  accounts: AccountRecord[];
};

const accountsPath = path.join(process.cwd(), "data", "accounts.json");
const writableAccountsPath = process.env.VERCEL
  ? path.join("/tmp", "kurtblox", "accounts.json")
  : accountsPath;
const passwordHashPrefix = "scrypt";

function createEmptyData(): AccountsData {
  return { accounts: [] };
}

async function readAccountsData(): Promise<AccountsData> {
  try {
    return JSON.parse(await readFile(writableAccountsPath, "utf8")) as AccountsData;
  } catch {
    try {
      return JSON.parse(await readFile(accountsPath, "utf8")) as AccountsData;
    } catch {
      return createEmptyData();
    }
  }
}

async function writeAccountsData(data: AccountsData) {
  await mkdir(path.dirname(writableAccountsPath), { recursive: true });
  await writeFile(writableAccountsPath, JSON.stringify(data, null, 2));
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `${passwordHashPrefix}$${salt}$${hash}`;
}

function verifyPassword(inputPassword: string, storedPassword?: string) {
  if (!storedPassword) return false;

  if (!storedPassword.startsWith(`${passwordHashPrefix}$`)) {
    return inputPassword === storedPassword;
  }

  const [, salt, hash] = storedPassword.split("$");

  if (!salt || !hash) return false;

  const inputHash = scryptSync(inputPassword, salt, 64);
  const storedHash = Buffer.from(hash, "hex");

  if (inputHash.length !== storedHash.length) return false;

  return timingSafeEqual(inputHash, storedHash);
}

export async function getAccounts() {
  const data = await readAccountsData();

  return data.accounts.toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function getAccountById(id: string) {
  const data = await readAccountsData();

  return data.accounts.find((account) => account.id === id) ?? null;
}

export async function validateEmailLogin(input: {
  identifier: string;
  password: string;
}) {
  const data = await readAccountsData();
  const identifier = input.identifier.toLowerCase();
  const account = data.accounts.find(
    (item) =>
      item.provider === "email" &&
      (item.email.toLowerCase() === identifier || item.name.toLowerCase() === identifier)
  );

  if (!account || !verifyPassword(input.password, account.password)) {
    return null;
  }

  if (account.password && !account.password.startsWith(`${passwordHashPrefix}$`)) {
    account.password = hashPassword(input.password);
  }

  account.lastLoginAt = new Date().toISOString();
  await writeAccountsData(data);

  return account;
}

export async function validateProviderLogin(input: {
  email: string;
  provider: Exclude<AccountProvider, "email">;
}) {
  const data = await readAccountsData();
  const account = data.accounts.find(
    (item) =>
      item.email.toLowerCase() === input.email.toLowerCase() &&
      item.provider === input.provider
  );

  if (!account) {
    return null;
  }

  account.lastLoginAt = new Date().toISOString();
  await writeAccountsData(data);

  return account;
}

export async function upsertAccount(input: {
  name: string;
  email: string;
  password?: string;
  provider: AccountProvider;
}) {
  const data = await readAccountsData();
  const now = new Date().toISOString();
  const existing = data.accounts.find(
    (account) => account.email.toLowerCase() === input.email.toLowerCase()
  );

  if (existing) {
    existing.name = input.name || existing.name;
    existing.password = input.password ? hashPassword(input.password) : existing.password;
    existing.provider = input.provider;
    existing.lastLoginAt = now;
    await writeAccountsData(data);
    return existing;
  }

  const account: AccountRecord = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    password: input.password ? hashPassword(input.password) : undefined,
    provider: input.provider,
    createdAt: now,
    lastLoginAt: now,
  };

  data.accounts.push(account);
  await writeAccountsData(data);

  return account;
}

export async function deleteAccount(id: string) {
  const data = await readAccountsData();
  const nextAccounts = data.accounts.filter((account) => account.id !== id);

  if (nextAccounts.length === data.accounts.length) {
    return false;
  }

  data.accounts = nextAccounts;
  await writeAccountsData(data);

  return true;
}
