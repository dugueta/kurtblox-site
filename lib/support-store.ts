import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type SupportMessage = {
  id: string;
  author: "client" | "admin";
  text: string;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  name: string;
  email: string;
  reason: string;
  status: "open" | "answered" | "closed";
  createdAt: string;
  messages: SupportMessage[];
};

export type SupportStatus = SupportTicket["status"];

export type SupportData = {
  tickets: SupportTicket[];
};

const supportPath = path.join(process.cwd(), "data", "support-tickets.json");

function createEmptyData(): SupportData {
  return { tickets: [] };
}

async function readSupportData(): Promise<SupportData> {
  try {
    return JSON.parse(await readFile(supportPath, "utf8")) as SupportData;
  } catch {
    return createEmptyData();
  }
}

async function writeSupportData(data: SupportData) {
  await mkdir(path.dirname(supportPath), { recursive: true });
  await writeFile(supportPath, JSON.stringify(data, null, 2));
}

export async function getSupportTickets() {
  const data = await readSupportData();

  return data.tickets.toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function getSupportTicket(ticketId: string) {
  const data = await readSupportData();

  return data.tickets.find((item) => item.id === ticketId) ?? null;
}

export async function createSupportTicket(input: {
  name: string;
  email: string;
  reason: string;
  message: string;
}) {
  const data = await readSupportData();
  const now = new Date().toISOString();
  const ticket: SupportTicket = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    reason: input.reason,
    status: "open",
    createdAt: now,
    messages: [
      {
        id: randomUUID(),
        author: "client",
        text: input.message,
        createdAt: now,
      },
    ],
  };

  data.tickets.push(ticket);
  await writeSupportData(data);

  return ticket;
}

export async function addSupportMessage(input: {
  ticketId: string;
  message: string;
  author?: SupportMessage["author"];
}) {
  const data = await readSupportData();
  const ticket = data.tickets.find((item) => item.id === input.ticketId);

  if (!ticket) {
    return null;
  }

  if (ticket.status === "closed" && input.author !== "admin") {
    return ticket;
  }

  ticket.messages.push({
    id: randomUUID(),
    author: input.author ?? "client",
    text: input.message,
    createdAt: new Date().toISOString(),
  });

  if (input.author === "admin") {
    ticket.status = "answered";
  } else if (ticket.status === "answered") {
    ticket.status = "open";
  }

  await writeSupportData(data);

  return ticket;
}

export async function updateSupportStatus(input: {
  ticketId: string;
  status: SupportStatus;
}) {
  const data = await readSupportData();
  const ticket = data.tickets.find((item) => item.id === input.ticketId);

  if (!ticket) {
    return null;
  }

  ticket.status = input.status;
  await writeSupportData(data);

  return ticket;
}
