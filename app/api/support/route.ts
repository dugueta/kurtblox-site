import { NextRequest, NextResponse } from "next/server";

import {
  addSupportMessage,
  createSupportTicket,
  getSupportTicket,
  getSupportTickets,
  updateSupportStatus,
  type SupportStatus,
} from "@/lib/support-store";
import { requireAdmin } from "@/lib/admin-auth";

const supportStatuses = ["open", "answered", "closed"];

export async function GET(request: NextRequest) {
  const ticketId = request.nextUrl.searchParams.get("ticketId");

  if (ticketId) {
    const ticket = await getSupportTicket(ticketId);

    if (!ticket) {
      return NextResponse.json({ error: "Ticket nao encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  }

  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    tickets: await getSupportTickets(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    ticketId?: string;
    name?: string;
    email?: string;
    reason?: string;
    message?: string;
    author?: "client" | "admin";
  } | null;

  if (!body?.message?.trim()) {
    return NextResponse.json({ error: "Mensagem obrigatoria." }, { status: 400 });
  }

  if (body.ticketId) {
    if (body.author === "admin") {
      const unauthorized = await requireAdmin();
      if (unauthorized) return unauthorized;
    }

    const ticket = await addSupportMessage({
      ticketId: body.ticketId,
      message: body.message.trim(),
      author: body.author === "admin" ? "admin" : "client",
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket nao encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  }

  if (!body.name?.trim() || !body.email?.trim() || !body.reason?.trim()) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
  }

  const ticket = await createSupportTicket({
    name: body.name.trim(),
    email: body.email.trim(),
    reason: body.reason.trim(),
    message: body.message.trim(),
  });

  return NextResponse.json({ ticket }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null) as {
    ticketId?: string;
    status?: SupportStatus;
  } | null;

  if (!body?.ticketId || !body.status || !supportStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Status invalido." }, { status: 400 });
  }

  const ticket = await updateSupportStatus({
    ticketId: body.ticketId,
    status: body.status,
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}
