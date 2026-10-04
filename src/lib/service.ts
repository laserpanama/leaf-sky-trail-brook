import { createServerFn } from "@tanstack/react-start";

/** Floor service: waiter orders by table, kitchen/bar tickets, the till. Roles are enforced server-side. */

export type Pay = "yappy" | "tarjeta" | "efectivo";
export type StationStatus = "pendiente" | "listo" | "na";

export type ServiceMenuItem = {
  kind: "plate" | "drink";
  id: string;
  name: string;
  section: string;
  price: number;
  available: boolean;
};

export type StationTicket = {
  id: string;
  table: string;
  waiter: string;
  service: "mesa" | "llevar";
  source: "mesero" | "web";
  note: string;
  status: StationStatus;
  readyAt: string | null;
  createdAt: string;
  lines: { name: string; qty: number; note: string }[];
};

export type TabOrder = {
  id: string;
  source: "mesero" | "web";
  service: "mesa" | "llevar";
  table: string;
  waiter: string;
  note: string;
  pay: Pay;
  kitchen: StationStatus;
  bar: StationStatus;
  accepted: boolean;
  total: number;
  createdAt: string;
  lines: { kind: "plate" | "drink"; name: string; qty: number; price: number; note: string }[];
};

export type Tab = {
  table: string;
  waiters: string[];
  orders: TabOrder[];
  total: number;
  openedAt: string;
  pending: boolean;
};

const UUID = /^[0-9a-f-]{36}$/i;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const station = (v: unknown): "cocina" | "barra" => {
  if (v !== "cocina" && v !== "barra") throw new Error("estacion");
  return v;
};

export const floorMenu = createServerFn({ method: "GET" }).handler(async () => {
  const { serviceMenu } = await import("@/lib/service.server");
  return serviceMenu();
});

export const switchItem = createServerFn({ method: "POST" })
  .validator((input: { kind: "plate" | "drink"; id: string; available: boolean }) => {
    if (input?.kind !== "plate" && input?.kind !== "drink") throw new Error("carta");
    return { kind: input.kind, id: str(input.id, 80), available: input.available === true };
  })
  .handler(async ({ data }) => {
    const { setAvailability } = await import("@/lib/service.server");
    await setAvailability(data.kind, data.id, data.available);
    return { ok: true };
  });

export const sendOrder = createServerFn({ method: "POST" })
  .validator(
    (input: {
      table: string;
      waiter: string;
      service: "mesa" | "llevar";
      note?: string;
      lines: { kind: "plate" | "drink"; id: string; qty: number; note?: string }[];
    }) => {
      if (!input || !Array.isArray(input.lines)) throw new Error("pedido");
      return {
        table: str(input.table, 40),
        waiter: str(input.waiter, 60),
        service: input.service === "llevar" ? ("llevar" as const) : ("mesa" as const),
        note: str(input.note, 300),
        lines: input.lines.slice(0, 60).map((l) => ({
          kind: l?.kind === "drink" ? ("drink" as const) : ("plate" as const),
          id: str(l?.id, 80),
          qty: Number(l?.qty),
          note: str(l?.note, 200),
        })),
      };
    },
  )
  .handler(async ({ data }) => {
    const { takeOrder } = await import("@/lib/service.server");
    return takeOrder(data);
  });

export const tickets = createServerFn({ method: "POST" })
  .validator((input: { station: "cocina" | "barra" }) => ({ station: station(input?.station) }))
  .handler(async ({ data }) => {
    const { stationTickets } = await import("@/lib/service.server");
    return stationTickets(data.station);
  });

export const ticketStatus = createServerFn({ method: "POST" })
  .validator((input: { id: string; station: "cocina" | "barra"; status: "pendiente" | "listo" }) => {
    if (typeof input?.id !== "string" || !UUID.test(input.id)) throw new Error("pedido");
    if (input.status !== "pendiente" && input.status !== "listo") throw new Error("estado");
    return { id: input.id, station: station(input.station), status: input.status };
  })
  .handler(async ({ data }) => {
    const { markStation } = await import("@/lib/service.server");
    await markStation(data.id, data.station, data.status);
    return { ok: true };
  });

export const tabs = createServerFn({ method: "GET" }).handler(async () => {
  const { openTabs } = await import("@/lib/service.server");
  return openTabs();
});

export const charge = createServerFn({ method: "POST" })
  .validator((input: { orderIds: string[]; pay: Pay }) => {
    if (!Array.isArray(input?.orderIds)) throw new Error("cuenta");
    if (input.pay !== "yappy" && input.pay !== "tarjeta" && input.pay !== "efectivo") throw new Error("pago");
    return { orderIds: input.orderIds.slice(0, 60).map((id) => str(id, 40)), pay: input.pay };
  })
  .handler(async ({ data }) => {
    const { chargeTab } = await import("@/lib/service.server");
    return chargeTab(data.orderIds, data.pay);
  });

export const acceptWeb = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => {
    if (typeof input?.id !== "string" || !UUID.test(input.id)) throw new Error("pedido");
    return { id: input.id };
  })
  .handler(async ({ data }) => {
    const { acceptWebOrder } = await import("@/lib/service.server");
    await acceptWebOrder(data.id);
    return { ok: true };
  });

export const voidTicket = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => {
    if (typeof input?.id !== "string" || !UUID.test(input.id)) throw new Error("pedido");
    return { id: input.id };
  })
  .handler(async ({ data }) => {
    const { voidOrder } = await import("@/lib/service.server");
    await voidOrder(data.id);
    return { ok: true };
  });
