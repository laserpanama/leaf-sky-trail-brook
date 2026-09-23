import { o as __toESM } from "../_runtime.mjs";
import { _ as Link, y as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as listRequests, c as patchSupply, d as supplyDesk, i as houseStatus, n as houseEnter, o as markRequest, r as houseOps, s as menuCosts, u as publicMenu } from "./casa-DaqoMEcF.mjs";
import { a as listDrinks, c as resetDrinks, l as sectionLabel, n as drinkItbms, o as money, r as drinkStatus, s as replaceDrinkOverrides, t as DRINK_SECTIONS, u as setDrink } from "./drinks-oTv8EpyV.mjs";
import { a as foodStatus, c as plateLabel, d as replaceKitchenWeeks, f as replacePlateOverrides, g as targetMenu, h as setPlateUnits, i as foodPct, l as plateUnits, m as setPlate, n as PLATE_SECTIONS, o as kitchenWeeks, p as resetPlates, r as foodNet, s as listPlates, t as FOOD_TARGET } from "./plates-CEvsXDBF.mjs";
import { I as addDays, a as parseISO, f as format, t as es } from "../_libs/date-fns.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-Bn4V9GyF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TARGET = {
	casa: .2,
	clasico: .2,
	cerveza: .3,
	vino: .3,
	destilados: .18,
	cero: .15,
	cafe: .15
};
function netOf(price, section = "casa", id) {
	return price / (1 + drinkItbms(section, id));
}
function pourPct(cost, price, section = "casa", id) {
	const net = netOf(price, section, id);
	return net > 0 ? cost / net : 0;
}
function panamaMonday(from = /* @__PURE__ */ new Date()) {
	const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/Panama",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(from).split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	const dow = date.getUTCDay();
	date.setUTCDate(date.getUTCDate() + (dow === 0 ? -6 : 1 - dow));
	return date.toISOString().slice(0, 10);
}
function shiftWeek(monday, weeks) {
	return addDays(parseISO(monday), weeks * 7).toISOString().slice(0, 10);
}
function weekLabel(monday) {
	const start = parseISO(monday);
	const end = addDays(start, 6);
	return `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM yyyy", { locale: es })}`;
}
var book$1 = {};
function readBook() {
	return book$1;
}
function replacePour(next) {
	book$1 = next && typeof next === "object" ? { ...next } : {};
	if (typeof window !== "undefined") window.dispatchEvent(new Event("lqp-pour"));
}
function unitsFor(week) {
	return readBook()[week] ?? {};
}
function setUnits(week, id, units) {
	const next = readBook();
	const row = { ...next[week] ?? {} };
	if (units > 0) row[id] = Math.round(units);
	else delete row[id];
	if (Object.keys(row).length === 0) delete next[week];
	else next[week] = row;
	book$1 = next;
	if (typeof window === "undefined") return;
	import("./casa-DaqoMEcF.mjs").then((n) => n.t).then(({ saveOps }) => saveOps({ data: {
		key: "pour",
		doc: book$1
	} }).catch(() => void 0));
}
function savedWeeks() {
	return Object.keys(readBook()).sort();
}
function weekLines(units, drinks = listDrinks()) {
	return drinks.map((drink) => {
		const count = units[drink.id] ?? 0;
		const net = count * netOf(drink.price, drink.section, drink.id);
		const cost = count * drink.cost;
		return {
			drink,
			units: count,
			net,
			cost,
			margin: net - cost,
			pct: pourPct(drink.cost, drink.price, drink.section, drink.id)
		};
	}).filter((line) => line.units > 0);
}
function sumLines(lines) {
	const net = lines.reduce((sum, line) => sum + line.net, 0);
	const cost = lines.reduce((sum, line) => sum + line.cost, 0);
	return {
		net,
		cost,
		margin: net - cost,
		pct: net > 0 ? cost / net : 0,
		units: lines.reduce((s, l) => s + l.units, 0)
	};
}
function sectionRollup(lines) {
	const groups = /* @__PURE__ */ new Map();
	for (const line of lines) {
		const list = groups.get(line.drink.section) ?? [];
		list.push(line);
		groups.set(line.drink.section, list);
	}
	return [...groups.entries()].map(([section, group]) => ({
		section,
		...sumLines(group),
		target: TARGET[section]
	}));
}
function topCocktails(lines) {
	return lines.filter((line) => line.drink.section === "casa" || line.drink.section === "clasico").sort((a, b) => b.units - a.units || b.margin - a.margin);
}
function pct$1(value) {
	return `${(value * 100).toFixed(1)}%`;
}
function Costeo({ drinks }) {
	const [week, setWeek] = (0, import_react.useState)(() => panamaMonday());
	const [units, setLocal] = (0, import_react.useState)(() => unitsFor(panamaMonday()));
	const [section, setSection] = (0, import_react.useState)("cocteles");
	(0, import_react.useEffect)(() => {
		function sync() {
			setLocal(unitsFor(week));
		}
		window.addEventListener("lqp-pour", sync);
		return () => window.removeEventListener("lqp-pour", sync);
	}, [week]);
	function openWeek(next) {
		setWeek(next);
		setLocal(unitsFor(next));
	}
	function edit(id, raw) {
		const value = raw === "" ? 0 : Number(raw);
		if (Number.isNaN(value) || value < 0) return;
		setUnits(week, id, value);
		setLocal(unitsFor(week));
	}
	const lines = (0, import_react.useMemo)(() => weekLines(units, drinks), [units, drinks]);
	const total = sumLines(lines);
	const sections = sectionRollup(lines);
	const cocktails = topCocktails(lines);
	const leader = cocktails[0];
	const richest = [...cocktails].sort((a, b) => b.margin - a.margin)[0];
	const over = cocktails.filter((line) => line.pct > .2);
	const history = savedWeeks().slice(-8);
	const shown = drinks.filter((drink) => section === "cocteles" ? drink.section === "casa" || drink.section === "clasico" : drink.section === section);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-8 font-display text-5xl",
			children: "Costo semanal"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 max-w-lg text-sm text-muted",
			children: "Anota los tragos vendidos. El costo % es el de la receta sobre el precio sin ITBMS, con el 10% del costeo. No sale de una caja registradora."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 flex items-center justify-between gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 border border-line px-4",
					onClick: () => openWeek(shiftWeek(week, -1)),
					children: "Semana anterior"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center font-display text-2xl",
					children: weekLabel(week)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 border border-line px-4",
					onClick: () => openWeek(shiftWeek(week, 1)),
					children: "Siguiente"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
					label: "Tragos",
					value: String(total.units)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
					label: "Venta neta",
					value: money(round2$1(total.net))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
					label: "Costo",
					value: money(round2$1(total.cost))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
					label: "Costo %",
					value: total.units ? pct$1(total.pct) : "—"
				})
			]
		}),
		sections.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-6 divide-y divide-line border-y border-line",
			children: sections.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-baseline justify-between gap-4 py-3 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: sectionLabel[row.section].es }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: row.pct > row.target + .03 ? "text-brass" : "text-muted",
					children: [
						pct$1(row.pct),
						" · objetivo ",
						pct$1(row.target)
					]
				})]
			}, row.section))
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-12 font-display text-3xl italic",
			children: "Cócteles que más salen"
		}),
		leader ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 max-w-lg text-sm text-muted",
			children: [
				"El más pedido fue ",
				leader.drink.es,
				": ",
				leader.units,
				" ",
				leader.units === 1 ? "trago" : "tragos",
				", margen ",
				money(round2$1(leader.margin)),
				", costo ",
				pct$1(leader.pct),
				".",
				richest && richest.drink.id !== leader.drink.id ? ` El margen más alto en dólares fue ${richest.drink.es} (${money(round2$1(richest.margin))}).` : "",
				over.length ? ` Por encima del 20%: ${over.map((line) => line.drink.es).join(", ")}.` : " Ningún cóctel de esta semana pasa el 20%."
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-muted",
			children: "Todavía no hay cócteles anotados en esta semana."
		}),
		cocktails.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "mt-4 divide-y divide-line border-y border-line",
			children: cocktails.slice(0, 8).map((line, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-baseline justify-between gap-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-display text-2xl",
					children: [
						index + 1,
						". ",
						line.drink.es
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-sm text-muted",
					children: [
						line.units,
						" · ",
						money(round2$1(line.margin)),
						" · ",
						pct$1(line.pct)
					]
				})]
			}, line.drink.id))
		}) : null,
		history.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-3xl italic",
				children: "Semanas"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 divide-y divide-line border-y border-line",
				children: history.map((key) => {
					const roll = sumLines(weekLines(unitsFor(key), drinks));
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex min-h-11 w-full items-center justify-between",
						onClick: () => openWeek(key),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: weekLabel(key) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-brass",
							children: pct$1(roll.pct)
						})]
					}) }, key);
				})
			})]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-12 font-display text-3xl italic",
			children: "Conteo"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setSection("cocteles"),
				className: section === "cocteles" ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted",
				children: "Cócteles"
			}), DRINK_SECTIONS.map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setSection(key),
				className: section === key ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted",
				children: sectionLabel[key].es
			}, key))]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 divide-y divide-line border-y border-line",
			children: shown.map((drink) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "grid grid-cols-[1fr_auto] items-center gap-3 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl",
					children: drink.es
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						money(drink.price),
						" · costo ",
						pct$1(pourPct(drink.cost, drink.price))
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					inputMode: "numeric",
					min: 0,
					type: "number",
					value: units[drink.id] ?? "",
					placeholder: "0",
					"aria-label": `Vendidos, ${drink.es}`,
					onChange: (e) => edit(drink.id, e.target.value),
					className: "min-h-11 w-20 border border-line bg-bg px-2 text-fg"
				})]
			}, drink.id))
		})
	] });
}
function Stat$1({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border border-line px-3 py-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs tracking-[0.18em] text-muted uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 font-display text-3xl",
			children: value
		})]
	});
}
function round2$1(value) {
	return Math.round(value * 100) / 100;
}
var book = {
	wage: 0,
	minutes: {}
};
function read() {
	return book;
}
function write(next) {
	book = next;
	if (typeof window === "undefined") return;
	window.dispatchEvent(new Event("lqp-labor"));
	import("./casa-DaqoMEcF.mjs").then((n) => n.t).then(({ saveOps }) => saveOps({ data: {
		key: "labor",
		doc: book
	} }).catch(() => void 0));
}
function replaceLabor(next) {
	book = {
		wage: next && typeof next.wage === "number" && next.wage > 0 ? next.wage : 0,
		minutes: next?.minutes && typeof next.minutes === "object" ? { ...next.minutes } : {}
	};
	if (typeof window !== "undefined") window.dispatchEvent(new Event("lqp-labor"));
}
function kitchenWage() {
	return read().wage;
}
function plateMinutes(id) {
	const minutes = read().minutes[id];
	return typeof minutes === "number" && minutes > 0 ? minutes : 0;
}
function setKitchenWage(wage) {
	const book = read();
	book.wage = wage > 0 ? wage : 0;
	write(book);
}
function setPlateMinutes(id, minutes) {
	const book = read();
	if (minutes > 0) book.minutes[id] = Math.round(minutes);
	else delete book.minutes[id];
	write(book);
}
/** Direct kitchen time only. The food sheet does not include this. */
function laborCost(minutes, wage) {
	if (minutes <= 0 || wage <= 0) return 0;
	return minutes / 60 * wage;
}
function pct(value) {
	return `${(value * 100).toFixed(1)}%`;
}
function round2(value) {
	return Math.round(value * 100) / 100;
}
function linesFor(weekUnits, plates) {
	return plates.map((plate) => {
		const units = weekUnits[plate.id] ?? 0;
		const net = units * foodNet(plate.price);
		const cost = units * plate.cost;
		return {
			plate,
			units,
			net,
			cost,
			margin: net - cost,
			pct: foodPct(plate.cost, plate.price)
		};
	}).filter((line) => line.units > 0);
}
function roll(lines) {
	const net = lines.reduce((sum, line) => sum + line.net, 0);
	const cost = lines.reduce((sum, line) => sum + line.cost, 0);
	return {
		net,
		cost,
		units: lines.reduce((sum, line) => sum + line.units, 0),
		pct: net > 0 ? cost / net : 0
	};
}
function KitchenWeek({ plates }) {
	const [week, setWeek] = (0, import_react.useState)(() => panamaMonday());
	const [units, setLocal] = (0, import_react.useState)(() => plateUnits(panamaMonday()));
	const [section, setSection] = (0, import_react.useState)("todas");
	(0, import_react.useEffect)(() => {
		function sync() {
			setLocal(plateUnits(week));
		}
		window.addEventListener("lqp-kitchen", sync);
		return () => window.removeEventListener("lqp-kitchen", sync);
	}, [week]);
	function openWeek(next) {
		setWeek(next);
		setLocal(plateUnits(next));
	}
	function edit(id, raw) {
		const value = raw === "" ? 0 : Number(raw);
		if (Number.isNaN(value) || value < 0) return;
		setPlateUnits(week, id, value);
		setLocal(plateUnits(week));
	}
	const lines = (0, import_react.useMemo)(() => linesFor(units, plates), [units, plates]);
	const total = roll(lines);
	const labor = lines.reduce((sum, line) => sum + line.units * laborCost(plateMinutes(line.plate.id), kitchenWage()), 0);
	const bySection = PLATE_SECTIONS.map((key) => ({
		section: key,
		...roll(lines.filter((line) => line.plate.section === key)),
		target: FOOD_TARGET[key]
	})).filter((row) => row.units > 0);
	const ranked = [...lines].sort((a, b) => b.units - a.units || b.margin - a.margin);
	const leader = ranked[0];
	const richest = [...ranked].sort((a, b) => b.margin - a.margin)[0];
	const over = ranked.filter((line) => line.pct > FOOD_TARGET[line.plate.section] + .03);
	const history = kitchenWeeks().slice(-8);
	const shown = plates.filter((plate) => section === "todas" || plate.section === section);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-8 font-display text-5xl",
			children: "Costo de cocina"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 max-w-lg text-sm text-muted",
			children: "Anota los platos de la semana. El costo % es solo alimento, sin mano de obra ni gas, sobre el precio sin ITBMS. El costeo usa 7%. Confirme la tasa."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 flex items-center justify-between gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 border border-line px-4",
					onClick: () => openWeek(shiftWeek(week, -1)),
					children: "Semana anterior"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center font-display text-2xl",
					children: weekLabel(week)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 border border-line px-4",
					onClick: () => openWeek(shiftWeek(week, 1)),
					children: "Siguiente"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Platos",
					value: String(total.units)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Venta neta",
					value: money(round2(total.net))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Costo",
					value: money(round2(total.cost))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Costo %",
					value: total.units ? pct(total.pct) : "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					label: "Mano de obra",
					value: labor > 0 ? money(round2(labor)) : "—"
				})
			]
		}),
		bySection.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-6 divide-y divide-line border-y border-line",
			children: bySection.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-baseline justify-between gap-4 py-3 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: plateLabel[row.section].es }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: row.pct > row.target + .03 ? "text-brass" : "text-muted",
					children: [
						pct(row.pct),
						" · objetivo ",
						pct(row.target)
					]
				})]
			}, row.section))
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-12 font-display text-3xl italic",
			children: "Lo que más sale"
		}),
		leader ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 max-w-lg text-sm text-muted",
			children: [
				"El más pedido fue ",
				leader.plate.es,
				": ",
				leader.units,
				" ",
				leader.units === 1 ? "plato" : "platos",
				", margen ",
				money(round2(leader.margin)),
				", costo ",
				pct(leader.pct),
				".",
				richest && richest.plate.id !== leader.plate.id ? ` El margen más alto en dólares fue ${richest.plate.es} (${money(round2(richest.margin))}).` : "",
				over.length ? ` Por encima del objetivo: ${over.map((line) => line.plate.es).join(", ")}.` : " Ningún plato de esta semana pasa su objetivo por más de 3 puntos."
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-muted",
			children: "Todavía no hay platos anotados en esta semana."
		}),
		ranked.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "mt-4 divide-y divide-line border-y border-line",
			children: ranked.slice(0, 8).map((line, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-baseline justify-between gap-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-display text-2xl",
					children: [
						index + 1,
						". ",
						line.plate.es
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-sm text-muted",
					children: [
						line.units,
						" · ",
						money(round2(line.margin)),
						" · ",
						pct(line.pct)
					]
				})]
			}, line.plate.id))
		}) : null,
		history.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-8 divide-y divide-line border-y border-line",
			children: history.map((key) => {
				const summary = roll(linesFor(plateUnits(key), plates));
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "flex min-h-11 w-full items-center justify-between",
					onClick: () => openWeek(key),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: weekLabel(key) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-brass",
						children: pct(summary.pct)
					})]
				}) }, key);
			})
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-12 font-display text-3xl italic",
			children: "Conteo"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setSection("todas"),
				className: section === "todas" ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted",
				children: "Toda la carta"
			}), PLATE_SECTIONS.map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setSection(key),
				className: section === key ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted",
				children: plateLabel[key].es
			}, key))]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 divide-y divide-line border-y border-line",
			children: shown.map((plate) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "grid grid-cols-[1fr_auto] items-center gap-3 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl",
					children: plate.es
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						money(plate.price),
						" · costo ",
						pct(foodPct(plate.cost, plate.price))
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					inputMode: "numeric",
					min: 0,
					type: "number",
					value: units[plate.id] ?? "",
					placeholder: "0",
					"aria-label": `Vendidos, ${plate.es}`,
					onChange: (e) => edit(plate.id, e.target.value),
					className: "min-h-11 w-20 border border-line bg-bg px-2 text-fg"
				})]
			}, plate.id))
		})
	] });
}
function PlateDesk({ plates, onChange }) {
	const [section, setSection] = (0, import_react.useState)("entradas");
	const [wage, setWage] = (0, import_react.useState)(() => kitchenWage());
	const [minutes, setMinutes] = (0, import_react.useState)({});
	const shown = plates.filter((plate) => section === "todas" || plate.section === section);
	(0, import_react.useEffect)(() => {
		function sync() {
			const next = {};
			for (const plate of plates) {
				const value = plateMinutes(plate.id);
				if (value) next[plate.id] = value;
			}
			setMinutes(next);
			setWage(kitchenWage());
		}
		sync();
		window.addEventListener("lqp-labor", sync);
		return () => window.removeEventListener("lqp-labor", sync);
	}, [plates]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-8 font-display text-5xl",
			children: "Cocina"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 max-w-lg text-sm text-muted",
			children: "El costeo de alimentos no trae mano de obra. La mano de obra de un plato es minutos ÷ 60 × el pago por hora. No se publica."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "mt-6 flex items-center gap-3 text-sm text-muted",
			children: ["Pago por hora", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "number",
				min: 0,
				step: "0.25",
				value: wage || "",
				placeholder: "0",
				"aria-label": "Pago por hora de cocina",
				onChange: (e) => {
					const value = e.target.value === "" ? 0 : Number(e.target.value);
					if (Number.isNaN(value) || value < 0) return;
					setKitchenWage(value);
					setWage(value);
				},
				className: "min-h-11 w-28 border border-line bg-bg px-2 text-fg"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 flex flex-wrap gap-2",
			children: [PLATE_SECTIONS.map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setSection(key),
				className: section === key ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted",
				children: plateLabel[key].es
			}, key)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => {
					resetPlates();
					onChange();
				},
				className: "min-h-11 border border-line px-3 text-sm text-muted",
				children: "Restaurar precios"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-8 divide-y divide-line border-y border-line",
			children: shown.map((plate) => {
				const ratio = foodPct(plate.cost, plate.price);
				const status = foodStatus(ratio, FOOD_TARGET[plate.section]);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl",
							children: plate.es
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								"Alimento ",
								money(round2(plate.cost)),
								" · ",
								pct(ratio),
								" · ",
								status,
								" · objetivo ",
								money(targetMenu(plate.cost, FOOD_TARGET[plate.section])),
								wage > 0 && minutes[plate.id] ? ` · mano de obra ${money(round2(laborCost(minutes[plate.id], wage)))}` : ""
							]
						}),
						plate.id === "aranitas" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-brass",
							children: "El costeo pide confirmar la receta."
						}) : null
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm text-muted",
								children: ["Min", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									min: 0,
									step: "1",
									value: minutes[plate.id] ?? "",
									placeholder: "0",
									"aria-label": `Minutos, ${plate.es}`,
									onChange: (e) => {
										const value = e.target.value === "" ? 0 : Number(e.target.value);
										if (Number.isNaN(value) || value < 0) return;
										setPlateMinutes(plate.id, value);
										setMinutes((current) => {
											const next = { ...current };
											if (value > 0) next[plate.id] = Math.round(value);
											else delete next[plate.id];
											return next;
										});
									},
									className: "ml-2 min-h-11 w-20 border border-line bg-bg px-2 text-fg"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm text-muted",
								children: ["$", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									min: 0,
									step: "0.5",
									value: plate.price,
									onChange: (e) => {
										const price = Number(e.target.value);
										if (Number.isNaN(price)) return;
										setPlate(plate.id, { price });
										onChange();
									},
									className: "ml-2 min-h-11 w-24 border border-line bg-bg px-2 text-fg"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setPlate(plate.id, { available: !plate.available });
									onChange();
								},
								className: plate.available ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted",
								children: plate.available ? "En servicio" : "Fuera"
							})
						]
					})]
				}, plate.id);
			})
		})
	] });
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border border-line px-3 py-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs tracking-[0.18em] text-muted uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 font-display text-3xl",
			children: value
		})]
	});
}
function cents(value) {
	if (value >= 1) return money(Math.round(value * 100) / 100);
	return `$${value.toFixed(3)}`;
}
function Insumos({ onChange }) {
	const [book, setBook] = (0, import_react.useState)("cocina");
	const [query, setQuery] = (0, import_react.useState)("");
	const [rows, setRows] = (0, import_react.useState)([]);
	const [preps, setPreps] = (0, import_react.useState)([]);
	const [category, setCategory] = (0, import_react.useState)("todas");
	async function load(next = book) {
		const data = await supplyDesk({ data: { book: next } });
		setRows(data.supplies);
		setPreps(data.preps);
		onChange();
	}
	(0, import_react.useEffect)(() => {
		load(book).catch(() => void 0);
	}, [book]);
	const categories = (0, import_react.useMemo)(() => [...new Set(rows.map((supply) => supply.category))], [rows]);
	const shown = rows.filter((supply) => {
		const hay = supply.name.toLowerCase();
		if (query && !hay.includes(query.toLowerCase())) return false;
		if (category !== "todas" && supply.category !== category) return false;
		return true;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-8 font-display text-5xl",
			children: "Insumos"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 max-w-xl text-sm text-muted",
			children: "El número azul del costeo: lo que paga por la presentación, y el rendimiento después de limpiar. Al cambiarlo, el costo del plato o del trago se recalcula. No se publica."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex flex-wrap gap-2",
			children: [["cocina", "barra"].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => {
					setBook(id);
					setCategory("todas");
					setQuery("");
				},
				className: book === id ? "min-h-11 bg-brass px-4 text-ink" : "min-h-11 border border-line px-4 text-muted",
				children: id === "cocina" ? "Cocina" : "Barra"
			}, id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => {
					patchSupply({ data: {
						book,
						kind: "reset"
					} }).then(() => load());
				},
				className: "min-h-11 border border-line px-4 text-sm text-muted",
				children: "Volver al archivo"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "mt-6 grid gap-2 text-sm text-muted",
			children: ["Buscar", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: query,
				onChange: (e) => setQuery(e.target.value),
				className: "min-h-11 border border-line bg-bg px-3 text-fg"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setCategory("todas"),
				className: category === "todas" ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted",
				children: "Todo"
			}), categories.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setCategory(name),
				className: category === name ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted",
				children: name
			}, name))]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-6 divide-y divide-line border-y border-line",
			children: shown.map((supply) => {
				const used = supply.used;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "grid gap-3 py-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-2xl",
								children: supply.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: used ? `${used} recetas` : "lote"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [supply.pack, supply.each != null ? ` · ${cents(supply.each)} por ${supply.unit}` : ""]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm text-muted",
								children: ["Costo de compra", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									min: 0,
									step: "0.01",
									value: supply.buy ?? "",
									"aria-label": `Costo de compra, ${supply.name}`,
									onChange: (e) => {
										const buy = Number(e.target.value);
										if (Number.isNaN(buy) || buy < 0) return;
										patchSupply({ data: {
											book,
											kind: "buy",
											id: supply.id,
											value: buy
										} }).then(() => load());
									},
									className: "mt-1 block min-h-11 w-28 border border-line bg-bg px-2 text-fg"
								})]
							}), book === "cocina" && supply.yield != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "text-sm text-muted",
								children: ["Rendimiento %", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									min: 1,
									max: 100,
									step: "1",
									value: Math.round(supply.yield * 100),
									"aria-label": `Rendimiento, ${supply.name}`,
									onChange: (e) => {
										const pct = Number(e.target.value);
										if (Number.isNaN(pct) || pct <= 0) return;
										patchSupply({ data: {
											book,
											kind: "yield",
											id: supply.id,
											value: pct / 100
										} }).then(() => load());
									},
									className: "mt-1 block min-h-11 w-24 border border-line bg-bg px-2 text-fg"
								})]
							}) : null]
						})
					]
				}, supply.id);
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
			className: "mt-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
					className: "cursor-pointer font-display text-3xl italic",
					children: "Preparaciones y lotes"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-xl text-sm text-muted",
					children: "Lo que no se compra ya medido: guacamole, chimichurri, jarabes. El costo por unidad es el del archivo. Si cambia una cantidad, pese la tanda."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-6 divide-y divide-line border-y border-line",
					children: preps.map((prep) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "py-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-2xl",
								children: prep.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [
									"Rinde ",
									prep.yield,
									" ",
									book === "cocina" || book === "barra" ? "oz" : ""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 grid gap-2",
								children: prep.lines.map((line, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "grid grid-cols-[1fr_5rem_6rem] items-center gap-2 text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: line.name }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "number",
											min: 0,
											step: "0.1",
											value: line.qty,
											"aria-label": `Cantidad, ${prep.name}, ${line.name}`,
											onChange: (e) => {
												const qty = Number(e.target.value);
												if (Number.isNaN(qty) || qty < 0) return;
												patchSupply({ data: {
													book,
													kind: "prepQty",
													id: prep.id,
													index: line.index,
													value: qty
												} }).then(() => load());
											},
											className: "min-h-11 border border-line bg-bg px-2 text-fg"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "number",
											min: 0,
											step: "0.01",
											value: line.each,
											"aria-label": `Costo, ${prep.name}, ${line.name}`,
											onChange: (e) => {
												const each = Number(e.target.value);
												if (Number.isNaN(each) || each < 0) return;
												patchSupply({ data: {
													book,
													kind: "prepEach",
													id: prep.id,
													index: line.index,
													value: each
												} }).then(() => load());
											},
											className: "min-h-11 border border-line bg-bg px-2 text-fg"
										})
									]
								}, `${prep.id}-${line.index}`))
							})
						]
					}, prep.id))
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-10 flex flex-col gap-2 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				className: "text-brass",
				href: "/casa/costeo-cocina.xlsx",
				children: "Descargar costeo de cocina"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				className: "text-brass",
				href: "/casa/costeo-barra.xlsx",
				children: "Descargar costeo de barra"
			})]
		})
	] });
}
var labels = {
	pendiente: "Pendiente",
	confirmada: "Confirmada",
	no: "No"
};
function Admin() {
	const [tab, setTab] = (0, import_react.useState)("reservas");
	const [open, setOpen] = (0, import_react.useState)(null);
	const [key, setKey] = (0, import_react.useState)("");
	const [denied, setDenied] = (0, import_react.useState)(false);
	const [holds, setHolds] = (0, import_react.useState)([]);
	const [filter, setFilter] = (0, import_react.useState)("pendiente");
	const [drinks, setDrinksState] = (0, import_react.useState)([]);
	const [plates, setPlates] = (0, import_react.useState)([]);
	const [section, setSection] = (0, import_react.useState)("casa");
	const [book, setBook] = (0, import_react.useState)("cocina");
	async function loadCasa() {
		const menu = await publicMenu();
		replacePlateOverrides(menu.plates);
		replaceDrinkOverrides(menu.drinks);
		let nextPlates = listPlates();
		let nextDrinks = listDrinks();
		try {
			const costs = await menuCosts();
			nextPlates = nextPlates.map((plate) => costs.plates[plate.id] != null ? {
				...plate,
				cost: costs.plates[plate.id]
			} : plate);
			nextDrinks = nextDrinks.map((drink) => {
				const cost = costs.drinks[drink.id];
				if (cost == null) return drink;
				return {
					...drink,
					cost,
					status: drinkStatus(drink.section, cost, drink.price, drink.id)
				};
			});
		} catch {}
		try {
			const ops = await houseOps();
			replaceLabor(ops.labor);
			replacePour(ops.pour);
			replaceKitchenWeeks(ops.kitchen);
		} catch {}
		setPlates(nextPlates);
		setDrinksState(nextDrinks);
		try {
			setHolds(await listRequests());
		} catch {
			setHolds([]);
		}
	}
	(0, import_react.useEffect)(() => {
		houseStatus().then((status) => {
			setOpen(status.open);
			if (status.open) return loadCasa();
		}).catch(() => setOpen(false));
	}, []);
	const shown = holds.filter((hold) => filter === "todas" || hold.status === filter);
	const shownDrinks = drinks.filter((drink) => section === "todas" || drink.section === section);
	function mark(id, status) {
		markRequest({ data: {
			id,
			status
		} }).then(() => loadCasa());
	}
	function refreshDrinks() {
		setDrinksState((current) => {
			const costs = new Map(current.map((drink) => [drink.id, drink.cost]));
			return listDrinks().map((drink) => {
				const cost = costs.get(drink.id);
				if (cost == null || cost <= 0) return drink;
				return {
					...drink,
					cost,
					status: drinkStatus(drink.section, cost, drink.price, drink.id)
				};
			});
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-bg px-5 py-10 text-fg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-5xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-[0.28em] text-brass uppercase",
					children: "Casa"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-xl text-sm text-muted",
					children: "Reservas, precios y costos de la casa. La carta pública no muestra lo que cuesta."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 flex flex-wrap gap-2",
					children: [
						["reservas", "Reservas"],
						["cocina", "Platos"],
						["barra", "Tragos"],
						["insumos", "Insumos"],
						["costo", "Semana"]
					].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setTab(id),
						className: tab === id ? "min-h-11 bg-brass px-4 text-ink" : "min-h-11 border border-line px-4 text-muted",
						children: label
					}, id))
				}),
				open === false ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-10 grid max-w-sm gap-4",
					onSubmit: (e) => {
						e.preventDefault();
						houseEnter({ data: { password: key } }).then((result) => {
							setDenied(!result.open);
							setOpen(result.open);
							if (result.open) loadCasa();
						});
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-5xl",
							children: "Casa"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "La llave no es una cuenta de cliente. Quien no la tiene, no ve costos ni reservas."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "grid gap-2 text-sm text-muted",
							children: ["Llave", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "password",
								value: key,
								onChange: (e) => setKey(e.target.value),
								className: "min-h-11 border border-line bg-bg px-3 text-fg"
							})]
						}),
						denied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-brass",
							children: "Esa llave no abre."
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							className: "min-h-11 bg-brass text-ink",
							children: "Entrar"
						})
					]
				}) : open === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-10 text-sm text-muted",
					children: "Abriendo la casa…"
				}) : tab === "reservas" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-8 font-display text-5xl",
						children: "Reservas"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-lg text-sm text-muted",
						children: "Solicitudes de fecha, hora y personas. El nombre y la nota van solo por WhatsApp."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8 flex flex-wrap gap-2",
						children: [
							"pendiente",
							"confirmada",
							"no",
							"todas"
						].map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setFilter(key),
							className: filter === key ? "min-h-11 bg-brass px-4 text-ink" : "min-h-11 border border-line px-4 text-muted",
							children: key === "todas" ? "Todas" : labels[key]
						}, key))
					}),
					shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-12 font-display text-3xl text-muted",
						children: "Nada en esta lista."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-8 divide-y divide-line border-y border-line",
						children: shown.map((hold) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:items-start",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-display text-3xl",
									children: [
										hold.date,
										" · ",
										hold.time
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-sm text-muted",
									children: [
										hold.party,
										" ",
										Number(hold.party) === 1 ? "persona" : "personas",
										" · ",
										labels[hold.status]
									]
								}),
								hold.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 max-w-md text-fg",
									children: hold.notes
								}) : null
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-2",
								children: [
									"pendiente",
									"confirmada",
									"no"
								].map((status) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => mark(hold.id, status),
									className: hold.status === status ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted",
									children: labels[status]
								}, status))
							})]
						}, hold.id))
					})
				] }) : tab === "insumos" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Insumos, { onChange: () => void loadCasa() }) : tab === "cocina" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlateDesk, {
					plates,
					onChange: () => setPlates((current) => {
						const costs = new Map(current.map((plate) => [plate.id, plate.cost]));
						return listPlates().map((plate) => ({
							...plate,
							cost: costs.get(plate.id) ?? plate.cost
						}));
					})
				}) : tab === "barra" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-8 font-display text-5xl",
						children: "Barra"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-lg text-sm text-muted",
						children: "Precio y si está en servicio. El costo no sale en la carta. Un cambio de precio sí."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 flex flex-wrap gap-2",
						children: [DRINK_SECTIONS.map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setSection(key),
							className: section === key ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted",
							children: sectionLabel[key].es
						}, key)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								resetDrinks();
								refreshDrinks();
							},
							className: "min-h-11 border border-line px-3 text-sm text-muted",
							children: "Restaurar precios"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-8 divide-y divide-line border-y border-line",
						children: shownDrinks.map((drink) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-2xl",
								children: drink.es
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [
									"Costo ",
									money(drink.cost),
									" · ",
									drink.status
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-sm text-muted",
									children: ["$", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "number",
										min: 0,
										step: "0.5",
										value: drink.price,
										onChange: (e) => {
											const price = Number(e.target.value);
											if (Number.isNaN(price)) return;
											setDrink(drink.id, { price });
											refreshDrinks();
										},
										className: "ml-2 min-h-11 w-24 border border-line bg-bg px-2 text-fg"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setDrink(drink.id, { available: !drink.available });
										refreshDrinks();
									},
									className: drink.available ? "min-h-11 bg-brass px-3 text-sm text-ink" : "min-h-11 border border-line px-3 text-sm text-muted",
									children: drink.available ? "En servicio" : "Fuera"
								})]
							})]
						}, drink.id))
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setBook("cocina"),
						className: book === "cocina" ? "min-h-11 bg-brass px-4 text-ink" : "min-h-11 border border-line px-4 text-muted",
						children: "Cocina"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setBook("barra"),
						className: book === "barra" ? "min-h-11 bg-brass px-4 text-ink" : "min-h-11 border border-line px-4 text-muted",
						children: "Barra"
					})]
				}), book === "cocina" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KitchenWeek, { plates }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Costeo, { drinks })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "mt-10 inline-flex min-h-11 items-center text-brass",
					children: "Volver a la casa"
				})
			]
		})
	});
}
//#endregion
export { Admin as component };
