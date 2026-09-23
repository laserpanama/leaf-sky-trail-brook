import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/casa-DaqoMEcF.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var casa_exports = /* @__PURE__ */ __exportAll({
	houseEnter: () => houseEnter,
	houseOps: () => houseOps,
	houseStatus: () => houseStatus,
	listRequests: () => listRequests,
	markRequest: () => markRequest,
	menuCosts: () => menuCosts,
	patchSupply: () => patchSupply,
	placeHold: () => placeHold,
	publicMenu: () => publicMenu,
	saveMenu: () => saveMenu,
	saveOps: () => saveOps,
	supplyDesk: () => supplyDesk
});
var publicMenu = createServerFn({ method: "GET" }).handler(createSsrRpc("6a7fc508d0fc9afd1a2be5b9ce63501ae5b92335f3502e215e008ee6b2c4091d"));
var saveMenu = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || input.kind !== "plate" && input.kind !== "drink" || !input.id) throw new Error("carta");
	return input;
}).handler(createSsrRpc("4c3f76764dda9f17ea40117067a6cc295293628fe19d38920fe1057b12683d6b"));
var placeHold = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || typeof input.party !== "number") throw new Error("mesa");
	return input;
}).handler(createSsrRpc("518c2966b3efb25d0c16fd5d7b6f1706064cb9b6aabeff3343bf4c4a4e2e6591"));
var listRequests = createServerFn({ method: "GET" }).handler(createSsrRpc("9fe71aa58e3242ed3e33b93a5159721ac111055140ca6fd61ffdff960b0a580a"));
var markRequest = createServerFn({ method: "POST" }).validator((input) => {
	if (!input?.id || ![
		"pendiente",
		"confirmada",
		"no"
	].includes(input.status)) throw new Error("estado");
	return input;
}).handler(createSsrRpc("b9f835ea99f5dc69131a35878e2cf404a24db5a6a2858199f5c59fdd254887d8"));
var houseStatus = createServerFn({ method: "GET" }).handler(createSsrRpc("4a23c5f1caefa1147b926d35786f5a3968afbdd28f84b592c3b02afaf2be7b8b"));
var houseEnter = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || typeof input.password !== "string") throw new Error("llave");
	return { password: input.password };
}).handler(createSsrRpc("448c027f15655601790178cfcf5678c5082e3841bfba3764157fbe85acfc6594"));
var supplyDesk = createServerFn({ method: "POST" }).validator((input) => {
	if (input?.book !== "cocina" && input?.book !== "barra") throw new Error("libro");
	return input;
}).handler(createSsrRpc("289831be00b7a5a949187fdaadc3f8cb871825508ee113b48431197ed1a46a4a"));
var patchSupply = createServerFn({ method: "POST" }).validator((input) => {
	if (input?.book !== "cocina" && input?.book !== "barra") throw new Error("libro");
	return input;
}).handler(createSsrRpc("42e06abc3964f56fd1f1f06f4afbe5263622fc23456d6221691d296f4dd7249f"));
var menuCosts = createServerFn({ method: "GET" }).handler(createSsrRpc("def585b200aec7e74d79a0550f1942a358d7240dd662e580627991d8f6719e06"));
var houseOps = createServerFn({ method: "GET" }).handler(createSsrRpc("7672b7440824036ed27508ecb93372898340f78c68159561c9e1cb4f16aa2e5e"));
var saveOps = createServerFn({ method: "POST" }).validator((input) => {
	if (input?.key !== "labor" && input?.key !== "pour" && input?.key !== "kitchen") throw new Error("ops");
	if (!input.doc || typeof input.doc !== "object") throw new Error("ops");
	return input;
}).handler(createSsrRpc("e0e6ed0514057a9ad42a030de92b55659ff2faee8d3e4d32318310118baf0456"));
//#endregion
export { listRequests as a, patchSupply as c, supplyDesk as d, houseStatus as i, placeHold as l, houseEnter as n, markRequest as o, houseOps as r, menuCosts as s, casa_exports as t, publicMenu as u };
