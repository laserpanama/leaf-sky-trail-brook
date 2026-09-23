import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/casa-DEnZqH7N.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var publicMenu_createServerFn_handler = createServerRpc({
	id: "6a7fc508d0fc9afd1a2be5b9ce63501ae5b92335f3502e215e008ee6b2c4091d",
	name: "publicMenu",
	filename: "src/lib/casa.ts"
}, (opts) => publicMenu.__executeServer(opts));
var publicMenu = createServerFn({ method: "GET" }).handler(publicMenu_createServerFn_handler, async () => {
	const { readMenu } = await import("./casa-ops.server-Cg6JtCqm.mjs");
	return readMenu();
});
var saveMenu_createServerFn_handler = createServerRpc({
	id: "4c3f76764dda9f17ea40117067a6cc295293628fe19d38920fe1057b12683d6b",
	name: "saveMenu",
	filename: "src/lib/casa.ts"
}, (opts) => saveMenu.__executeServer(opts));
var saveMenu = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || input.kind !== "plate" && input.kind !== "drink" || !input.id) throw new Error("carta");
	return input;
}).handler(saveMenu_createServerFn_handler, async ({ data }) => {
	const { writeMenu } = await import("./casa-ops.server-Cg6JtCqm.mjs");
	await writeMenu(data.kind, data.id, data.price, data.available);
	return { ok: true };
});
var placeHold_createServerFn_handler = createServerRpc({
	id: "518c2966b3efb25d0c16fd5d7b6f1706064cb9b6aabeff3343bf4c4a4e2e6591",
	name: "placeHold",
	filename: "src/lib/casa.ts"
}, (opts) => placeHold.__executeServer(opts));
var placeHold = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || typeof input.party !== "number") throw new Error("mesa");
	return input;
}).handler(placeHold_createServerFn_handler, async ({ data }) => {
	const { placeHold: save } = await import("./casa-ops.server-Cg6JtCqm.mjs");
	return save(data);
});
var listRequests_createServerFn_handler = createServerRpc({
	id: "9fe71aa58e3242ed3e33b93a5159721ac111055140ca6fd61ffdff960b0a580a",
	name: "listRequests",
	filename: "src/lib/casa.ts"
}, (opts) => listRequests.__executeServer(opts));
var listRequests = createServerFn({ method: "GET" }).handler(listRequests_createServerFn_handler, async () => {
	const { listHolds } = await import("./casa-ops.server-Cg6JtCqm.mjs");
	return listHolds();
});
var markRequest_createServerFn_handler = createServerRpc({
	id: "b9f835ea99f5dc69131a35878e2cf404a24db5a6a2858199f5c59fdd254887d8",
	name: "markRequest",
	filename: "src/lib/casa.ts"
}, (opts) => markRequest.__executeServer(opts));
var markRequest = createServerFn({ method: "POST" }).validator((input) => {
	if (!input?.id || ![
		"pendiente",
		"confirmada",
		"no"
	].includes(input.status)) throw new Error("estado");
	return input;
}).handler(markRequest_createServerFn_handler, async ({ data }) => {
	const { markHold } = await import("./casa-ops.server-Cg6JtCqm.mjs");
	await markHold(data.id, data.status);
	return { ok: true };
});
var houseStatus_createServerFn_handler = createServerRpc({
	id: "4a23c5f1caefa1147b926d35786f5a3968afbdd28f84b592c3b02afaf2be7b8b",
	name: "houseStatus",
	filename: "src/lib/casa.ts"
}, (opts) => houseStatus.__executeServer(opts));
var houseStatus = createServerFn({ method: "GET" }).handler(houseStatus_createServerFn_handler, async () => {
	const { houseOpen } = await import("./casa-ops.server-Cg6JtCqm.mjs");
	return { open: houseOpen() };
});
var houseEnter_createServerFn_handler = createServerRpc({
	id: "448c027f15655601790178cfcf5678c5082e3841bfba3764157fbe85acfc6594",
	name: "houseEnter",
	filename: "src/lib/casa.ts"
}, (opts) => houseEnter.__executeServer(opts));
var houseEnter = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || typeof input.password !== "string") throw new Error("llave");
	return { password: input.password };
}).handler(houseEnter_createServerFn_handler, async ({ data }) => {
	const { enterHouse } = await import("./casa-ops.server-Cg6JtCqm.mjs");
	return { open: enterHouse(data.password) };
});
var supplyDesk_createServerFn_handler = createServerRpc({
	id: "289831be00b7a5a949187fdaadc3f8cb871825508ee113b48431197ed1a46a4a",
	name: "supplyDesk",
	filename: "src/lib/casa.ts"
}, (opts) => supplyDesk.__executeServer(opts));
var supplyDesk = createServerFn({ method: "POST" }).validator((input) => {
	if (input?.book !== "cocina" && input?.book !== "barra") throw new Error("libro");
	return input;
}).handler(supplyDesk_createServerFn_handler, async ({ data }) => {
	const { supplyDesk: load } = await import("./casa-ops.server-Cg6JtCqm.mjs");
	return load(data.book);
});
var patchSupply_createServerFn_handler = createServerRpc({
	id: "42e06abc3964f56fd1f1f06f4afbe5263622fc23456d6221691d296f4dd7249f",
	name: "patchSupply",
	filename: "src/lib/casa.ts"
}, (opts) => patchSupply.__executeServer(opts));
var patchSupply = createServerFn({ method: "POST" }).validator((input) => {
	if (input?.book !== "cocina" && input?.book !== "barra") throw new Error("libro");
	return input;
}).handler(patchSupply_createServerFn_handler, async ({ data }) => {
	const { patchSupply: save } = await import("./casa-ops.server-Cg6JtCqm.mjs");
	return save(data);
});
var menuCosts_createServerFn_handler = createServerRpc({
	id: "def585b200aec7e74d79a0550f1942a358d7240dd662e580627991d8f6719e06",
	name: "menuCosts",
	filename: "src/lib/casa.ts"
}, (opts) => menuCosts.__executeServer(opts));
var menuCosts = createServerFn({ method: "GET" }).handler(menuCosts_createServerFn_handler, async () => {
	const { menuCosts: load } = await import("./casa-ops.server-Cg6JtCqm.mjs");
	return load();
});
var houseOps_createServerFn_handler = createServerRpc({
	id: "7672b7440824036ed27508ecb93372898340f78c68159561c9e1cb4f16aa2e5e",
	name: "houseOps",
	filename: "src/lib/casa.ts"
}, (opts) => houseOps.__executeServer(opts));
var houseOps = createServerFn({ method: "GET" }).handler(houseOps_createServerFn_handler, async () => {
	const { readOps } = await import("./casa-ops.server-Cg6JtCqm.mjs");
	return readOps();
});
var saveOps_createServerFn_handler = createServerRpc({
	id: "e0e6ed0514057a9ad42a030de92b55659ff2faee8d3e4d32318310118baf0456",
	name: "saveOps",
	filename: "src/lib/casa.ts"
}, (opts) => saveOps.__executeServer(opts));
var saveOps = createServerFn({ method: "POST" }).validator((input) => {
	if (input?.key !== "labor" && input?.key !== "pour" && input?.key !== "kitchen") throw new Error("ops");
	if (!input.doc || typeof input.doc !== "object") throw new Error("ops");
	return input;
}).handler(saveOps_createServerFn_handler, async ({ data }) => {
	const { writeOps } = await import("./casa-ops.server-Cg6JtCqm.mjs");
	await writeOps(data.key, data.doc);
	return { ok: true };
});
//#endregion
export { houseEnter_createServerFn_handler, houseOps_createServerFn_handler, houseStatus_createServerFn_handler, listRequests_createServerFn_handler, markRequest_createServerFn_handler, menuCosts_createServerFn_handler, patchSupply_createServerFn_handler, placeHold_createServerFn_handler, publicMenu_createServerFn_handler, saveMenu_createServerFn_handler, saveOps_createServerFn_handler, supplyDesk_createServerFn_handler };
