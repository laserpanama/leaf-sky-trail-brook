import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/plates-CEvsXDBF.js
var plates_exports = /* @__PURE__ */ __exportAll({
	FOOD_ITBMS: () => FOOD_ITBMS,
	FOOD_TARGET: () => FOOD_TARGET,
	PLATE_SECTIONS: () => PLATE_SECTIONS,
	foodNet: () => foodNet,
	foodPct: () => foodPct,
	foodStatus: () => foodStatus,
	kitchenWeeks: () => kitchenWeeks,
	listPlates: () => listPlates,
	plateLabel: () => plateLabel,
	plateUnits: () => plateUnits,
	replaceKitchenWeeks: () => replaceKitchenWeeks,
	replacePlateOverrides: () => replacePlateOverrides,
	resetPlates: () => resetPlates,
	setPlate: () => setPlate,
	setPlateUnits: () => setPlateUnits,
	targetMenu: () => targetMenu
});
var PLATE_SECTIONS = [
	"entradas",
	"mains",
	"kids",
	"sides"
];
var plateLabel = {
	entradas: {
		es: "Entradas",
		en: "Starters"
	},
	mains: {
		es: "Carnes, aves y pescados",
		en: "Mains"
	},
	kids: {
		es: "Menú kids",
		en: "Kids"
	},
	sides: {
		es: "Acompañamientos",
		en: "Sides"
	}
};
var FOOD_TARGET = {
	entradas: .28,
	mains: .35,
	kids: .35,
	sides: .25
};
var CATALOG = [
	{
		id: "chicharrones",
		es: "Chicharroncitos del burro",
		en: "Pork cracklings",
		section: "entradas",
		price: 13,
		cost: 0,
		portionEs: "0.6 lb de panza cruda y 3 oz de guacamole.",
		portionEn: "0.6 lb raw pork belly and 3 oz guacamole.",
		img: "/media/belly.webp"
	},
	{
		id: "sliders",
		es: "Mini sliders Angus (3 unid)",
		en: "Angus sliders (3)",
		section: "entradas",
		price: 10,
		cost: 0,
		portionEs: "Tres de 2.7 oz de carne.",
		portionEn: "Three, 2.7 oz of beef each.",
		img: "/media/sliders.webp"
	},
	{
		id: "nachos-carne",
		es: "Nachos de carne",
		en: "Beef nachos",
		section: "entradas",
		price: 15,
		cost: 0,
		portionEs: "Ocho tortillas, 5 oz de carne, queso, pico y guacamole.",
		portionEn: "Eight tortillas, 5 oz beef, cheese, pico and guacamole.",
		img: "/media/nachos-carne.webp"
	},
	{
		id: "nachos-pollo",
		es: "Nachos de pollo",
		en: "Chicken nachos",
		section: "entradas",
		price: 15,
		cost: 0,
		portionEs: "Ocho tortillas, 5 oz de pollo, queso, pico y guacamole.",
		portionEn: "Eight tortillas, 5 oz chicken, cheese, pico and guacamole.",
		img: "/media/nachos-pollo.webp"
	},
	{
		id: "salchichas",
		es: "Salchichas estilo alemán (2 unid)",
		en: "German sausages (2)",
		section: "entradas",
		price: 9.5,
		cost: 0,
		portionEs: "Dos salchichas y 2 oz de chucrut.",
		portionEn: "Two sausages and 2 oz sauerkraut.",
		img: "/media/salchichas.webp"
	},
	{
		id: "aranitas",
		es: "Arañitas",
		en: "Plantain arañitas",
		section: "entradas",
		price: 10,
		cost: 0,
		portionEs: "Dos plátanos rallados.",
		portionEn: "Two grated plantains.",
		img: "/media/aranitas.webp"
	},
	{
		id: "poppers",
		es: "Jalapeño poppers",
		en: "Jalapeño poppers",
		section: "entradas",
		price: 7,
		cost: 0,
		portionEs: "Seis unidades.",
		portionEn: "Six pieces.",
		img: "/media/poppers.webp"
	},
	{
		id: "empanadas",
		es: "Empanada de maíz (4 unid)",
		en: "Corn empanadas (4)",
		section: "entradas",
		price: 7,
		cost: 0,
		portionEs: "Cuatro, con 1.5 oz de carne mechada cada una.",
		portionEn: "Four, 1.5 oz shredded beef each.",
		img: "/media/empanadas.webp"
	},
	{
		id: "hummus",
		es: "Hummus",
		en: "Hummus",
		section: "entradas",
		price: 8,
		cost: 0,
		portionEs: "6 oz de hummus y dos tortillas.",
		portionEn: "6 oz hummus and two tortillas.",
		img: "/media/hummus.webp"
	},
	{
		id: "wings",
		es: "Buffalo wings (8 unid)",
		en: "Buffalo wings (8)",
		section: "entradas",
		price: 8.5,
		cost: 0,
		portionEs: "Ocho alitas, cerca de 1.25 lb en crudo.",
		portionEn: "Eight wings, about 1.25 lb raw.",
		img: "/media/wings.webp"
	},
	{
		id: "ceviche",
		es: "Ceviche de langostino",
		en: "Prawn ceviche",
		section: "entradas",
		price: 9.5,
		cost: 0,
		portionEs: "Cerca de 3 oz de langostino limpio.",
		portionEn: "About 3 oz cleaned prawn.",
		img: "/media/ceviche.webp"
	},
	{
		id: "almejas",
		es: "Almejas borrachas",
		en: "Drunken clams",
		section: "entradas",
		price: 12.5,
		cost: 0,
		portionEs: "Una libra de almejas y 4 oz de salsa.",
		portionEn: "1 lb clams and 4 oz sauce.",
		img: "/media/almejas.webp"
	},
	{
		id: "boneless",
		es: "Boneless de pollo",
		en: "Boneless wings",
		section: "entradas",
		price: 10.5,
		cost: 0,
		portionEs: "8 oz de pechuga.",
		portionEn: "8 oz breast.",
		img: "/media/boneless.webp"
	},
	{
		id: "pollo",
		es: "Pollo al carbón",
		en: "Charcoal chicken",
		section: "mains",
		price: 13,
		cost: 0,
		portionEs: "Medio pollo, cerca de 1.6 lb, y un acompañamiento.",
		portionEn: "Half chicken, about 1.6 lb, and one side.",
		img: "/media/pollo.webp"
	},
	{
		id: "burger",
		es: "Hamburguesa New York Dely",
		en: "New York Dely burger",
		section: "mains",
		price: 14,
		cost: 0,
		portionEs: "8 oz Angus y un acompañamiento.",
		portionEn: "8 oz Angus and one side.",
		img: "/media/burger.webp"
	},
	{
		id: "picada",
		es: "Picada Argentina (2–3 personas)",
		en: "Argentine grill platter (2–3)",
		section: "mains",
		price: 35,
		cost: 0,
		portionEs: "12 oz de rib eye, 2 chorizos, 1 lb de pollo y un acompañamiento.",
		portionEn: "12 oz rib eye, 2 chorizos, 1 lb chicken and one side.",
		img: "/media/parrillada.webp"
	},
	{
		id: "ribeye",
		es: "Rib-eye al carbón",
		en: "Charcoal rib eye",
		section: "mains",
		price: 25,
		cost: 0,
		portionEs: "12 oz y un acompañamiento.",
		portionEn: "12 oz and one side.",
		img: "/media/ribeye.webp"
	},
	{
		id: "entrana",
		es: "Entraña al carbón",
		en: "Charcoal skirt steak",
		section: "mains",
		price: 28,
		cost: 0,
		portionEs: "10 oz y un acompañamiento.",
		portionEn: "10 oz and one side.",
		img: "/media/entrana.webp"
	},
	{
		id: "salmon",
		es: "Salmón a la parrilla",
		en: "Grilled salmon",
		section: "mains",
		price: 17,
		cost: 0,
		portionEs: "8 oz y un acompañamiento.",
		portionEn: "8 oz and one side.",
		img: "/media/salmon.webp"
	},
	{
		id: "kids-burger",
		es: "Mini hamburguesa Quinta Pata",
		en: "Kids burger",
		section: "kids",
		price: 6,
		cost: 0,
		portionEs: "4 oz de carne y un acompañamiento.",
		portionEn: "4 oz beef and one side.",
		img: "/media/kids-burger.webp"
	},
	{
		id: "kids-boneless",
		es: "Boneless de pollo, kids",
		en: "Kids boneless",
		section: "kids",
		price: 6,
		cost: 0,
		portionEs: "5 oz de pechuga y un acompañamiento.",
		portionEn: "5 oz breast and one side.",
		img: "/media/kids-boneless.webp"
	},
	{
		id: "kids-pasta",
		es: "Pasta marinera o al olio",
		en: "Kids pasta",
		section: "kids",
		price: 6,
		cost: 0,
		portionEs: "3 oz de pasta seca.",
		portionEn: "3 oz dry pasta.",
		img: "/media/kids-pasta.webp"
	},
	{
		id: "papas",
		es: "Papitas fritas",
		en: "French fries",
		section: "sides",
		price: 3.5,
		cost: 0,
		portionEs: "6 oz.",
		portionEn: "6 oz.",
		img: "/media/papas.webp"
	},
	{
		id: "patacon",
		es: "Patacón pisao",
		en: "Patacones",
		section: "sides",
		price: 3.5,
		cost: 0,
		portionEs: "Plátano y medio, cerca de seis patacones.",
		portionEn: "One and a half plantains, about six pieces.",
		img: "/media/patacon.webp"
	},
	{
		id: "yuca",
		es: "Yuca frita",
		en: "Fried cassava",
		section: "sides",
		price: 3.5,
		cost: 0,
		portionEs: "6 oz servidos.",
		portionEn: "6 oz served.",
		img: "/media/yuca.webp"
	},
	{
		id: "vegetales",
		es: "Vegetales salteados",
		en: "Sautéed vegetables",
		section: "sides",
		price: 4.5,
		cost: 0,
		portionEs: "6 oz.",
		portionEn: "6 oz.",
		img: "/media/vegetales.webp"
	},
	{
		id: "totopos",
		es: "Totopos",
		en: "Tortilla chips",
		section: "sides",
		price: 3.5,
		cost: 0,
		portionEs: "Cinco tortillas.",
		portionEn: "Five tortillas.",
		img: "/media/totopos.webp"
	}
];
var memory = {};
function readOverrides() {
	return memory;
}
function replacePlateOverrides(next) {
	memory = next ?? {};
	if (typeof window !== "undefined") window.dispatchEvent(new Event("lqp-plates"));
}
function listPlates() {
	const overrides = readOverrides();
	return CATALOG.map((plate) => {
		const patch = overrides[plate.id];
		return {
			...plate,
			price: typeof patch?.price === "number" && patch.price >= 0 ? patch.price : plate.price,
			available: patch?.available !== false
		};
	});
}
function writeOverrides(overrides) {
	memory = overrides;
	if (typeof window !== "undefined") window.dispatchEvent(new Event("lqp-plates"));
}
function setPlate(id, patch) {
	const overrides = readOverrides();
	const base = CATALOG.find((plate) => plate.id === id);
	const next = {
		...overrides[id],
		...patch
	};
	if (base && next.price === base.price) delete next.price;
	if (next.available !== false) delete next.available;
	if (next.price === void 0 && next.available === void 0) delete overrides[id];
	else overrides[id] = next;
	writeOverrides(overrides);
	if (typeof window === "undefined") return;
	import("./casa-DaqoMEcF.mjs").then((n) => n.t).then(({ saveMenu }) => saveMenu({ data: {
		kind: "plate",
		id,
		price: next.price ?? null,
		available: next.available !== false
	} }));
}
function resetPlates() {
	memory = {};
	if (typeof window !== "undefined") window.dispatchEvent(new Event("lqp-plates"));
}
function foodNet(price) {
	return price / 1.07;
}
function foodPct(cost, price) {
	const net = foodNet(price);
	return net > 0 ? cost / net : 0;
}
function foodStatus(pct, target) {
	if (pct > target + .03) return "Reajustar";
	if (pct < target - .08) return "Margen alto";
	return "OK";
}
function targetMenu(cost, target) {
	const raw = cost / target * 1.07;
	return Math.ceil(raw * 2 - 1e-9) / 2;
}
var weeks = {};
function readBook() {
	return weeks;
}
function replaceKitchenWeeks(next) {
	weeks = next && typeof next === "object" ? { ...next } : {};
	if (typeof window !== "undefined") window.dispatchEvent(new Event("lqp-kitchen"));
}
function plateUnits(week) {
	return readBook()[week] ?? {};
}
function setPlateUnits(week, id, units) {
	const next = readBook();
	const row = { ...next[week] ?? {} };
	if (units > 0) row[id] = Math.round(units);
	else delete row[id];
	if (Object.keys(row).length === 0) delete next[week];
	else next[week] = row;
	weeks = next;
	if (typeof window === "undefined") return;
	import("./casa-DaqoMEcF.mjs").then((n) => n.t).then(({ saveOps }) => saveOps({ data: {
		key: "kitchen",
		doc: weeks
	} }).catch(() => void 0));
}
function kitchenWeeks() {
	return Object.keys(readBook()).sort();
}
//#endregion
export { foodStatus as a, plateLabel as c, replaceKitchenWeeks as d, replacePlateOverrides as f, targetMenu as g, setPlateUnits as h, foodPct as i, plateUnits as l, setPlate as m, PLATE_SECTIONS as n, kitchenWeeks as o, resetPlates as p, foodNet as r, listPlates as s, FOOD_TARGET as t, plates_exports as u };
