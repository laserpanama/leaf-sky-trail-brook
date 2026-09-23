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

export const placeHold = createServerFn({ method: "POST" })
  .validator((input: { date: string; time: string; party: number }) => {
    if (!input || typeof input.party !== "number") throw new Error("mesa");
    return input;
  })
  .handler(async ({ data }) => {
    const { placeHold: save } = await import("@/lib/casa-ops.server");
    return save(data);
  });

export const listRequests = createServerFn({ method: "GET" }).handler(async () => {
  const { listHolds } = await import("@/lib/casa-ops.server");
  return listHolds();
});

export const markRequest = createServerFn({ method: "POST" })
  .validator((input: { id: string; status: "pendiente" | "confirmada" | "no" }) => {
    if (!input?.id || !["pendiente", "confirmada", "no"].includes(input.status)) throw new Error("estado");
    return input;
  })
  .handler(async ({ data }) => {
    const { markHold } = await import("@/lib/casa-ops.server");
    await markHold(data.id, data.status);
    return { ok: true };
  });

export const houseStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { houseOpen } = await import("@/lib/casa-ops.server");
  return { open: houseOpen() };
});

export const houseEnter = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => {
    if (!input || typeof input.password !== "string") throw new Error("llave");
    return { password: input.password };
  })
  .handler(async ({ data }) => {
    const { enterHouse } = await import("@/lib/casa-ops.server");
    return { open: enterHouse(data.password) };
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
