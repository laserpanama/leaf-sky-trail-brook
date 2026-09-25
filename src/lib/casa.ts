import { createServerFn } from "@tanstack/react-start";

export const publicMenu = createServerFn({ method: "GET" }).handler(async () => {
  const { readMenu } = await import("@/lib/casa-ops.server");
  return readMenu();
});

export const saveMenu = createServerFn({ method: "POST" })
  .validator((input: { kind: "plate" | "drink"; id: string; price: number | null; available: boolean }) => {
    if (!input || (input.kind !== "plate" && input.kind !== "drink") || !input.id) throw new Error("carta");
    return input;
  })
  .handler(async ({ data }) => {
    const { writeMenu } = await import("@/lib/casa-ops.server");
    await writeMenu(data.kind, data.id, data.price, data.available);
    return { ok: true };
  });

export type HoldRequest = {
  date: string;
  time: string;
  party: number;
  name: string;
  phone: string;
  notes?: string;
  website?: string;
};

export const placeHold = createServerFn({ method: "POST" })
  .validator((input: HoldRequest) => {
    if (!input || typeof input !== "object" || typeof input.party !== "number") throw new Error("mesa");
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
    return {
      date: str(input.date, 10),
      time: str(input.time, 5),
      party: input.party,
      name: str(input.name, 120),
      phone: str(input.phone, 40),
      notes: str(input.notes, 600),
      website: str(input.website, 200),
    };
  })
  .handler(async ({ data }) => {
    const { placeHold: save } = await import("@/lib/casa-ops.server");
    return save(data);
  });

export const placeOrder = createServerFn({ method: "POST" })
  .validator(
    (input: {
      service: "mesa" | "llevar";
      pay: "yappy" | "tarjeta" | "efectivo";
      lines: { kind: "plate" | "drink"; id: string; qty: number }[];
    }) => {
      if (!input || (input.service !== "mesa" && input.service !== "llevar") || !Array.isArray(input.lines)) {
        throw new Error("pedido");
      }
      if (input.pay !== "yappy" && input.pay !== "tarjeta" && input.pay !== "efectivo") throw new Error("pago");
      return input;
    },
  )
  .handler(async ({ data }) => {
    const { placeOrder: save } = await import("@/lib/casa-ops.server");
    return save(data);
  });

export const listOrders = createServerFn({ method: "GET" }).handler(async () => {
  const { listOrders: load } = await import("@/lib/casa-ops.server");
  return load();
});

export const markOrder = createServerFn({ method: "POST" })
  .validator((input: { id: string; status: "pendiente" | "listo" | "no" }) => {
    if (!input?.id || !["pendiente", "listo", "no"].includes(input.status)) throw new Error("estado");
    return input;
  })
  .handler(async ({ data }) => {
    const { markOrder: save } = await import("@/lib/casa-ops.server");
    await save(data.id, data.status);
    return { ok: true };
  });

export const markPay = createServerFn({ method: "POST" })
  .validator((input: { id: string; payStatus: "pendiente" | "cobrado" }) => {
    if (!input?.id || (input.payStatus !== "pendiente" && input.payStatus !== "cobrado")) throw new Error("pago");
    return input;
  })
  .handler(async ({ data }) => {
    const { markPay: save } = await import("@/lib/casa-ops.server");
    await save(data.id, data.payStatus);
    return { ok: true };
  });

export const listRequests = createServerFn({ method: "GET" }).handler(async () => {
  const { listHolds } = await import("@/lib/casa-ops.server");
  return listHolds();
});

export const markRequest = createServerFn({ method: "POST" })
  .validator((input: { id: string; status: "pendiente" | "confirmada" | "no" }) => {
    if (typeof input?.id !== "string" || !/^[0-9a-f-]{36}$/.test(input.id)) throw new Error("estado");
    if (!["pendiente", "confirmada", "no"].includes(input.status)) throw new Error("estado");
    return input;
  })
  .handler(async ({ data }) => {
    const { markHold } = await import("@/lib/casa-ops.server");
    await markHold(data.id, data.status);
    return { ok: true };
  });

export const houseStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { houseOpen, houseConfigured } = await import("@/lib/casa-ops.server");
  return { open: houseOpen(), configured: houseConfigured() };
});

export const houseLeave = createServerFn({ method: "POST" }).handler(async () => {
  const { leaveHouse } = await import("@/lib/casa-ops.server");
  leaveHouse();
  return { open: false };
});

export const houseEnter = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => {
    if (!input || typeof input.password !== "string") throw new Error("llave");
    return { password: input.password.slice(0, 200) };
  })
  .handler(async ({ data }) => {
    const { enterHouse } = await import("@/lib/casa-ops.server");
    return enterHouse(data.password);
  });

export const supplyDesk = createServerFn({ method: "POST" })
  .validator((input: { book: "cocina" | "barra" }) => {
    if (input?.book !== "cocina" && input?.book !== "barra") throw new Error("libro");
    return input;
  })
  .handler(async ({ data }) => {
    const { supplyDesk: load } = await import("@/lib/casa-ops.server");
    return load(data.book);
  });

export const patchSupply = createServerFn({ method: "POST" })
  .validator(
    (input: {
      book: "cocina" | "barra";
      kind: "buy" | "yield" | "prepQty" | "prepEach" | "reset";
      id?: string;
      index?: number;
      value?: number;
    }) => {
      if (input?.book !== "cocina" && input?.book !== "barra") throw new Error("libro");
      return input;
    },
  )
  .handler(async ({ data }) => {
    const { patchSupply: save } = await import("@/lib/casa-ops.server");
    return save(data);
  });

export const menuCosts = createServerFn({ method: "GET" }).handler(async () => {
  const { menuCosts: load } = await import("@/lib/casa-ops.server");
  return load();
});

export const houseOps = createServerFn({ method: "GET" }).handler(async () => {
  const { readOps } = await import("@/lib/casa-ops.server");
  return readOps();
});

export const saveOps = createServerFn({ method: "POST" })
  .validator((input: { key: "labor" | "pour" | "kitchen"; doc: unknown }) => {
    if (input?.key !== "labor" && input?.key !== "pour" && input?.key !== "kitchen") throw new Error("ops");
    if (!input.doc || typeof input.doc !== "object") throw new Error("ops");
    return input;
  })
  .handler(async ({ data }) => {
    const { writeOps } = await import("@/lib/casa-ops.server");
    await writeOps(data.key, data.doc);
    return { ok: true };
  });
