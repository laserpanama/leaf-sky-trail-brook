import { o as __toESM } from "../_runtime.mjs";
import { y as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as placeHold, u as publicMenu } from "./casa-DaqoMEcF.mjs";
import { a as listDrinks, l as sectionLabel, o as money, s as replaceDrinkOverrides, t as DRINK_SECTIONS } from "./drinks-oTv8EpyV.mjs";
import { c as plateLabel, f as replacePlateOverrides, n as PLATE_SECTIONS, s as listPlates } from "./plates-CEvsXDBF.mjs";
import { a as parseISO, f as format, h as enUS, n as startOfToday, t as es } from "../_libs/date-fns.mjs";
import { t as SLOT_TIMES } from "./slots-ttrY6lOx.mjs";
import { t as DayPicker } from "../_libs/react-day-picker.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D7RfJijo.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var WA_NUMBER = "50767555768";
var WA_BASE = "Hola, quiero reservar en La Quinta Pata.";
var copy = {
	es: {
		name: "La Quinta Pata",
		kicker: "Gastrobar · San Francisco, Panamá",
		heroLine: "El quinto elemento de la mesa.",
		heroSub: "Parrilla, picadas y barra. La noche manda.",
		reserve: "Reservar",
		menu: "Ver carta",
		nav: [
			{
				id: "carta",
				label: "Carta"
			},
			{
				id: "barra",
				label: "Barra"
			},
			{
				id: "noches",
				label: "Noches"
			},
			{
				id: "nosotros",
				label: "Nosotros"
			},
			{
				id: "visita",
				label: "Visítanos"
			}
		],
		cartaEyebrow: "Carta viva",
		cartaTitle: "Primero se pica. Después, la parrilla.",
		cartaNote: "Carta viva. Precios en USD, con ITBMS. Sujetos a cambio.",
		bites: "Picadas",
		grill: "Parrilla",
		dishes: [
			{
				kind: "grill",
				name: "Parrillada Argentina para 2",
				desc: "Pollo a la brasa, chorizo parrillero, N.Y. strip y 2 acompañamientos.",
				price: null,
				img: "/media/parrillada.webp"
			},
			{
				kind: "grill",
				name: "Rib Eye a la brasa",
				desc: "Terminado en beef tallow aromatizado.",
				price: null,
				img: "/media/ribeye.webp"
			},
			{
				kind: "bite",
				name: "Pork belly bites picantes",
				desc: "Dados de panza de cerdo confitada y ahumada, salsa BBQ-ajonjolí.",
				price: "$7",
				img: "/media/belly.webp"
			}
		],
		barEyebrow: "Barra",
		barTitle: "Un vaso frío, sin teatro.",
		barLead: "La carta de barra, con ITBMS. Lo que no esté en servicio no aparece. Precios sujetos a cambio.",
		barItems: [
			{
				title: "Cócteles",
				body: "De la casa. Se piden en barra."
			},
			{
				title: "Cerveza",
				body: "Barril y botella."
			},
			{
				title: "Destilados",
				body: "Sin lista de marcas en la web."
			}
		],
		nightsEyebrow: "Noches",
		nightsTitle: "Partido o tarima. A veces los dos.",
		nights: [
			{
				title: "Fútbol en vivo",
				body: "Pantallas. Llega cuando quieras ver el partido."
			},
			{
				title: "Música en vivo",
				body: "Tarima. Cuando hay función, se anuncia en Instagram."
			},
			{
				title: "Walk-in o reserva",
				body: "Se puede llegar sin reserva. Para grupo, mejor avisar."
			}
		],
		reserveEyebrow: "Reservar",
		reserveTitle: "La mesa queda en espera.",
		reserveLead: "Fecha, hora y cuántos son. El botón abre WhatsApp con el mensaje escrito. La casa confirma por ahí.",
		date: "Fecha",
		time: "Hora",
		slotsLead: "Turnos de 30 min, 6:00 p. m.–11:00 p. m. La casa confirma. No es el horario publicado.",
		syncOk: "Turnos ocupados según Google Calendar.",
		syncWait: "Sincronizando con Google Calendar…",
		syncOff: "Calendario no disponible en esta vista. Igual puedes pedir un turno.",
		syncLogin: "Conectar Google Calendar",
		busy: "Ocupado",
		party: "Personas",
		notes: "Notas",
		notesPh: "Ocasión, mesa alta, partido…",
		send: "Enviar por WhatsApp",
		wa: "WhatsApp",
		holdTitle: "WhatsApp abierto.",
		holdBody: "El mensaje lleva fecha, hora, personas y la nota. La casa confirma por ahí. El nombre no se guarda en la página.",
		aboutEyebrow: "Nosotros",
		about: ["La quinta pata es lo que completa la mesa: el trago, el plato de más, la razón para quedarse. En San Francisco, ciudad de Panamá, La Quinta Pata es un gastrobar de parrilla, picadas y barra.", "La noche manda. Brasas, humo, un vaso frío. Pantallas para el partido y tarima cuando hay música en vivo."],
		visitEyebrow: "Visítanos",
		visitTitle: "Av. 5ta Sur, San Francisco.",
		address: "Av. 5ta Sur, San Francisco, Ciudad de Panamá",
		mapNote: "Zona de la avenida. Confirma el local por WhatsApp si vienes de lejos.",
		pay: "Visa · Mastercard · Efectivo · Yappy",
		amenities: "Estacionamiento · Wi-Fi",
		ig: "@laquintapata_pty",
		legal: "© 2026 La Quinta Pata. San Francisco, Ciudad de Panamá.",
		legal2: "Carta viva. Los precios pueden cambiar. Las reservas quedan sujetas a confirmación."
	},
	en: {
		name: "La Quinta Pata",
		kicker: "Gastrobar · San Francisco, Panama",
		heroLine: "The fifth thing on the table.",
		heroSub: "Grill, small plates, and a bar. Night comes first.",
		reserve: "Reserve",
		menu: "See the menu",
		nav: [
			{
				id: "carta",
				label: "Menu"
			},
			{
				id: "barra",
				label: "Bar"
			},
			{
				id: "noches",
				label: "Nights"
			},
			{
				id: "nosotros",
				label: "About"
			},
			{
				id: "visita",
				label: "Visit"
			}
		],
		cartaEyebrow: "Living menu",
		cartaTitle: "Bites first. Then the grill.",
		cartaNote: "Living menu. Prices in USD, ITBMS included. Subject to change.",
		bites: "Bites",
		grill: "Grill",
		dishes: [
			{
				kind: "grill",
				name: "Argentine grill for 2",
				desc: "Charcoal chicken, parrillero chorizo, N.Y. strip, and 2 sides.",
				price: null,
				img: "/media/parrillada.webp"
			},
			{
				kind: "grill",
				name: "Charcoal rib eye",
				desc: "Finished in aromatic beef tallow.",
				price: null,
				img: "/media/ribeye.webp"
			},
			{
				kind: "bite",
				name: "Spicy pork belly bites",
				desc: "Cubes of confit, smoked pork belly with sesame BBQ sauce.",
				price: "$7",
				img: "/media/belly.webp"
			}
		],
		barEyebrow: "Bar",
		barTitle: "A cold glass. No theater.",
		barLead: "The bar card, ITBMS included. Anything off service is hidden. Prices can change.",
		barItems: [
			{
				title: "Cocktails",
				body: "House drinks. Ordered at the bar."
			},
			{
				title: "Beer",
				body: "Draft and bottle."
			},
			{
				title: "Spirits",
				body: "No brand list on the site."
			}
		],
		nightsEyebrow: "Nights",
		nightsTitle: "The match, or the stage. Sometimes both.",
		nights: [
			{
				title: "Live football",
				body: "Screens. Walk in when the match is on."
			},
			{
				title: "Live music",
				body: "A small stage. Shows are posted on Instagram."
			},
			{
				title: "Walk-in or reserve",
				body: "Walk-ins are welcome. For a group, send a note."
			}
		],
		reserveEyebrow: "Reserve",
		reserveTitle: "The table stays on hold.",
		reserveLead: "Date, time, and how many. The button opens WhatsApp with the message written. The house confirms there.",
		date: "Date",
		time: "Time",
		slotsLead: "30-minute turns, 6:00–11:00 p.m. The house confirms. These are not published hours.",
		syncOk: "Busy turns come from Google Calendar.",
		syncWait: "Syncing with Google Calendar…",
		syncOff: "Calendar is not available in this view. You can still request a turn.",
		syncLogin: "Connect Google Calendar",
		busy: "Busy",
		party: "Party",
		notes: "Notes",
		notesPh: "Occasion, high table, the match…",
		send: "Send on WhatsApp",
		wa: "WhatsApp",
		holdTitle: "WhatsApp is open.",
		holdBody: "The message has the date, time, party, and note. The house confirms there. A name is not stored on the page.",
		aboutEyebrow: "About",
		about: ["The fifth leg is what finishes the table: the drink, the extra plate, the reason you stay. In San Francisco, Panama City, La Quinta Pata is a gastrobar of grill, bites, and a bar.", "Night comes first. Embers, smoke, a cold glass. Screens for the match, and a stage when there is live music."],
		visitEyebrow: "Visit",
		visitTitle: "Av. 5ta Sur, San Francisco.",
		address: "Av. 5ta Sur, San Francisco, Panama City",
		mapNote: "The avenue. Confirm the door on WhatsApp if you are coming from far.",
		pay: "Visa · Mastercard · Cash · Yappy",
		amenities: "Parking · Wi-Fi",
		ig: "@laquintapata_pty",
		legal: "© 2026 La Quinta Pata. San Francisco, Panama City.",
		legal2: "Living menu. Prices may change. Reservations are subject to confirmation."
	}
};
var MAP = "https://www.openstreetmap.org/export/embed.html?bbox=-79.508%2C8.987%2C-79.496%2C8.995&layer=mapnik&marker=8.9912661%2C-79.5020383";
function waLink(extra) {
	const text = extra ? `${WA_BASE} ${extra}` : WA_BASE;
	return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}
function Site() {
	const [lang, setLang] = (0, import_react.useState)("es");
	const t = copy[lang];
	const [held, setHeld] = (0, import_react.useState)(false);
	const [form, setForm] = (0, import_react.useState)({
		date: "",
		time: "",
		party: "2",
		notes: ""
	});
	(0, import_react.useEffect)(() => {
		const saved = window.localStorage.getItem("lqp-lang");
		if (saved === "en" || saved === "es") setLang(saved);
	}, []);
	function choose(code) {
		setLang(code);
		document.documentElement.lang = code;
		window.localStorage.setItem("lqp-lang", code);
	}
	const [drinks, setDrinks] = (0, import_react.useState)(() => listDrinks());
	const [plates, setPlates] = (0, import_react.useState)(() => listPlates());
	(0, import_react.useEffect)(() => {
		let alive = true;
		publicMenu().then((menu) => {
			if (!alive) return;
			replacePlateOverrides(menu.plates);
			replaceDrinkOverrides(menu.drinks);
			setDrinks(listDrinks());
			setPlates(listPlates());
		}).catch(() => void 0);
		return () => {
			alive = false;
		};
	}, []);
	const message = (0, import_react.useMemo)(() => {
		return [
			form.date && `${lang === "es" ? "Fecha" : "Date"}: ${form.date}`,
			form.time && `${lang === "es" ? "Hora" : "Time"}: ${form.time}`,
			form.party && `${lang === "es" ? "Personas" : "Party"}: ${form.party}`,
			form.notes && form.notes.trim()
		].filter(Boolean).join(". ");
	}, [form, lang]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", {
				type: "application/ld+json",
				dangerouslySetInnerHTML: { __html: JSON.stringify({
					"@context": "https://schema.org",
					"@type": "Restaurant",
					name: "La Quinta Pata",
					servesCuisine: "Gastrobar",
					address: {
						"@type": "PostalAddress",
						streetAddress: "Av. 5ta Sur",
						addressLocality: "San Francisco",
						addressRegion: "Panamá",
						addressCountry: "PA"
					},
					telephone: "+50767555768",
					sameAs: "https://www.instagram.com/laquintapata_pty/",
					currenciesAccepted: "USD",
					paymentAccepted: "Cash, Visa, Mastercard, Yappy"
				}) }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-40 border-b border-line/80 bg-bg/80 backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-20 max-w-6xl items-center gap-8 px-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#inicio",
							className: "font-display text-base tracking-[0.14em] text-fg uppercase sm:text-xl sm:tracking-[0.22em]",
							children: "La Quinta Pata"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "hidden flex-1 items-center gap-6 md:flex",
							children: t.nav.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: `#${item.id}`,
								className: "text-sm text-muted hover:text-fg",
								children: item.label
							}, item.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ml-auto flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex border border-line text-xs tracking-widest",
								children: ["es", "en"].map((code) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => choose(code),
									className: lang === code ? "min-h-11 bg-brass px-3 text-ink" : "min-h-11 px-3 text-muted",
									"aria-pressed": lang === code,
									children: code.toUpperCase()
								}, code))
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "#reservar",
								className: "hidden min-h-11 items-center bg-brass px-4 text-sm text-ink md:inline-flex",
								children: t.reserve
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "pb-24 md:pb-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						id: "inicio",
						className: "relative min-h-screen overflow-hidden",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: "/media/hero.webp",
								alt: "Brasa en la parrilla de La Quinta Pata",
								width: 1400,
								height: 933,
								fetchPriority: "high",
								decoding: "async",
								className: "hero-still absolute inset-0 h-full w-full object-cover"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "vignette absolute inset-0" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "grain absolute inset-0" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative mx-auto flex min-h-screen max-w-6xl flex-col justify-end px-5 pt-32 pb-36 md:pb-24",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-bg via-bg/80 to-transparent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs tracking-[0.32em] text-brass uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:tracking-[0.42em]",
											children: t.kicker
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
											className: "mt-6 max-w-5xl font-display text-7xl leading-[0.88] font-medium text-fg italic drop-shadow-[0_2px_16px_rgba(0,0,0,0.75)] md:text-8xl",
											children: t.heroLine
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-8 max-w-sm text-lg text-fg/90",
											children: t.heroSub
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-10 flex flex-wrap gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
												href: "#reservar",
												className: "inline-flex min-h-11 items-center bg-brass px-5 text-ink",
												children: t.reserve
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
												href: "#carta",
												className: "inline-flex min-h-11 items-center border border-fg/40 px-5 text-fg",
												children: t.menu
											})]
										})
									]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						id: "carta",
						className: "scroll-mt-20 py-24",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto max-w-6xl px-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs tracking-[0.42em] text-brass uppercase",
									children: t.cartaEyebrow
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-4 max-w-3xl font-display text-6xl leading-[0.92] italic md:text-7xl",
									children: t.cartaTitle
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-6 max-w-md text-sm text-muted",
									children: t.cartaNote
								})
							]
						}), PLATE_SECTIONS.map((section) => {
							const items = plates.filter((plate) => plate.section === section && plate.available && plate.img);
							if (!items.length) return null;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mx-auto mt-20 max-w-6xl px-5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-display text-4xl italic md:text-5xl",
									children: plateLabel[section][lang]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-6 grid gap-4 md:grid-cols-2",
									children: items.map((plate, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlateStill, {
										plate,
										lang,
										lead: index === 0
									}, plate.id))
								})]
							}, section);
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						id: "barra",
						className: "scroll-mt-20 border-y border-line bg-surface",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto grid max-w-6xl items-stretch md:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("figure", {
								className: "frame min-h-96",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: "/media/bar.webp",
									alt: "La barra, de noche",
									width: 1100,
									height: 733,
									loading: "lazy",
									decoding: "async",
									className: "h-full w-full object-cover"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col justify-center px-5 py-20 md:px-14",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs tracking-[0.42em] text-brass uppercase",
										children: t.barEyebrow
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "mt-4 font-display text-6xl leading-[0.92] italic",
										children: t.barTitle
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-5 text-muted",
										children: t.barLead
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto max-w-6xl px-5 pb-16",
							children: DRINK_SECTIONS.map((section) => {
								const items = drinks.filter((drink) => drink.section === section && drink.available);
								if (!items.length) return null;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-10",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-display text-3xl italic",
										children: sectionLabel[section][lang]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "mt-6 columns-1 gap-x-16 md:columns-2",
										children: items.map((drink) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-baseline gap-3 py-2.5 break-inside-avoid",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-display text-2xl",
													children: lang === "es" ? drink.es : drink.en
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "leader mb-1 min-w-6 flex-1" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-brass",
													children: money(drink.price)
												})
											]
										}, drink.id))
									})]
								}, section);
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						id: "noches",
						className: "relative scroll-mt-20 min-h-[88vh]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: "/media/match.webp",
								alt: "El salón con el partido en las pantallas",
								width: 1100,
								height: 733,
								loading: "lazy",
								decoding: "async",
								className: "absolute inset-0 h-full w-full object-cover"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "vignette absolute inset-0" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "grain absolute inset-0" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-5 py-20",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs tracking-[0.42em] text-brass uppercase",
										children: t.nightsEyebrow
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "mt-4 max-w-xl font-display text-6xl leading-[0.92] italic",
										children: t.nightsTitle
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-10 grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-end",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("figure", {
											className: "frame hidden md:block",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: "/media/stage.webp",
												alt: "Tarima para música en vivo",
												width: 1100,
												height: 400,
												loading: "lazy",
												decoding: "async",
												className: "h-56 w-full object-cover"
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
											className: "grid gap-6",
											children: t.nights.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-display text-3xl",
												children: n.title
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 max-w-md text-sm text-fg/80",
												children: n.body
											})] }, n.title))
										})]
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "reservar",
						className: "scroll-mt-20 border-y border-line bg-surface",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs tracking-[0.28em] text-brass uppercase",
									children: t.reserveEyebrow
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-3 font-display text-5xl leading-tight italic",
									children: t.reserveTitle
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-5 text-muted",
									children: t.reserveLead
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: waLink(message),
									target: "_blank",
									rel: "noreferrer",
									className: "mt-8 inline-flex min-h-11 items-center bg-brass px-5 text-ink",
									children: [t.wa, " · 6755-5768"]
								})
							] }), held ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border border-line bg-bg p-8",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-display text-4xl leading-tight",
										children: t.holdTitle
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-4 text-muted",
										children: t.holdBody
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: waLink(message),
										target: "_blank",
										rel: "noreferrer",
										className: "mt-8 inline-flex min-h-11 items-center border border-brass px-5 text-brass",
										children: t.wa
									})
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "grid gap-4",
								onSubmit: (e) => {
									e.preventDefault();
									if (!form.date || !form.time) return;
									const party = Number(form.party);
									placeHold({ data: {
										date: form.date,
										time: form.time,
										party
									} }).catch(() => void 0);
									window.open(waLink(message), "_blank", "noopener,noreferrer");
									setHeld(true);
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "grid gap-2 text-sm text-muted",
										children: [t.date, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReserveCalendar, {
											lang,
											value: form.date,
											onChange: (date) => setForm({
												...form,
												date,
												time: ""
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlotPicker, {
											lang,
											date: form.date,
											time: form.time,
											label: t.time,
											onChange: (time) => setForm({
												...form,
												time
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "grid gap-2 text-sm text-muted",
											children: [t.party, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												required: true,
												min: 1,
												max: 20,
												type: "number",
												value: form.party,
												onChange: (e) => setForm({
													...form,
													party: e.target.value
												}),
												className: "min-h-11 border border-line bg-bg px-3 text-fg"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "grid gap-2 text-sm text-muted",
										children: [t.notes, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
											rows: 3,
											value: form.notes,
											placeholder: t.notesPh,
											onChange: (e) => setForm({
												...form,
												notes: e.target.value
											}),
											className: "border border-line bg-bg px-3 py-3 text-fg"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										className: "min-h-11 bg-brass text-ink",
										children: t.send
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						id: "nosotros",
						className: "mx-auto max-w-3xl scroll-mt-20 px-5 py-28",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-[0.42em] text-brass uppercase",
							children: t.aboutEyebrow
						}), t.about.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-8 font-display text-4xl leading-snug text-fg italic",
							children: p
						}, p))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "visita",
						className: "scroll-mt-20 border-t border-line",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto grid max-w-6xl gap-8 px-5 py-20 md:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs tracking-[0.28em] text-brass uppercase",
									children: t.visitEyebrow
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-3 font-display text-5xl leading-tight",
									children: t.visitTitle
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-5 text-fg",
									children: t.address
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-muted",
									children: t.mapNote
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-6 text-sm",
									children: t.pay
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: t.amenities
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									className: "mt-6 inline-flex text-brass",
									href: "https://www.instagram.com/laquintapata_pty/",
									target: "_blank",
									rel: "noreferrer",
									children: t.ig
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
								title: "Av. 5ta Sur, San Francisco, Panamá",
								src: MAP,
								className: "h-80 w-full border border-line grayscale"
							})]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "border-t border-line px-5 py-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl flex-col gap-3 text-sm text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-fg",
							children: "Av. 5ta Sur, San Francisco · 6755-5768 · @laquintapata_pty · Yappy"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t.legal }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t.legal2 })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-line bg-bg md:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "#reservar",
					className: "flex min-h-14 items-center justify-center text-fg",
					children: t.reserve
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: waLink(message),
					target: "_blank",
					rel: "noreferrer",
					className: "flex min-h-14 items-center justify-center bg-brass text-ink",
					children: "WhatsApp"
				})]
			})
		]
	});
}
function PlateStill({ plate, lang, lead }) {
	const name = lang === "es" ? plate.es : plate.en;
	const portion = lang === "es" ? plate.portionEs : plate.portionEn;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		className: lead ? "md:col-span-2" : "",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
			className: `frame relative ${lead ? "h-[70vh] min-h-96" : "h-80"}`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: plate.img ?? "",
					alt: name,
					width: lead ? 1400 : 900,
					height: lead ? 900 : 640,
					loading: lead ? "eager" : "lazy",
					decoding: "async",
					className: "h-full w-full object-cover"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "still-fade absolute inset-0" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
					className: "absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-5 py-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						className: `font-display leading-none italic ${lead ? "text-5xl md:text-6xl" : "text-3xl"}`,
						children: name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-md text-sm text-fg/75",
						children: portion
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 font-display text-2xl text-brass",
						children: money(plate.price)
					})]
				})
			]
		})
	});
}
function SlotPicker({ lang, date, time, label, onChange }) {
	const t = copy[lang];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
		className: "grid gap-2 border-0 p-0 text-sm text-muted",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: label }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t.slotsLead }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-2 sm:grid-cols-5",
				children: SLOT_TIMES.map((slot) => {
					const on = time === slot;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: !date,
						"aria-pressed": on,
						onClick: () => onChange(slot),
						className: on ? "min-h-11 bg-brass text-ink disabled:opacity-40" : "min-h-11 border border-line text-fg disabled:text-line",
						children: slot
					}, slot);
				})
			})
		]
	});
}
function ReserveCalendar({ lang, value, onChange }) {
	const locale = lang === "es" ? es : enUS;
	const selected = value ? parseISO(value) : void 0;
	const label = selected ? format(selected, "d MMMM yyyy", { locale }) : lang === "es" ? "Elige un día" : "Pick a day";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "lqp-cal border border-line bg-bg p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-2 pb-2 font-display text-2xl text-fg",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayPicker, {
			mode: "single",
			required: true,
			locale,
			weekStartsOn: 1,
			selected,
			onSelect: (day) => {
				if (day) onChange(format(day, "yyyy-MM-dd"));
			},
			disabled: { before: startOfToday() },
			defaultMonth: selected ?? startOfToday()
		})]
	});
}
var SplitComponent = Site;
//#endregion
export { SplitComponent as component };
