import { a as setCookie$1, i as getCookie } from "./ssr.mjs";
import { t as SLOT_TIMES } from "./slots-ttrY6lOx.mjs";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/casa-ops.server-Cg6JtCqm.js
var _0002_casa_default = "create table if not exists holds (\n  id text primary key,\n  day text not null,\n  slot text not null,\n  party integer not null,\n  status text not null default 'pendiente',\n  created_at timestamptz not null default now()\n);\n\ncreate index if not exists holds_day_idx on holds (day, slot);\n\ncreate table if not exists menu_overrides (\n  kind text not null,\n  item_id text not null,\n  price numeric,\n  available boolean,\n  primary key (kind, item_id)\n);\n\ncreate table if not exists casa_json (\n  key text primary key,\n  doc jsonb not null\n);\n";
/**
* Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
* (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
*
* Applied files are keyed by BASENAME, so the same file applies once no matter
* which directory it is globbed from. That is what makes the auth schema safe to
* copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
* a database that already has `0001_auth.sql` will not re-run it.
*
* Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
* out of scope for both until it is copied up.
*/
/**
* The `_migrations` key for a migration path (or bare filename).
* @param {string} path
* @returns {string}
*/
function migrationName(path) {
	return path.split("/").pop() ?? path;
}
/**
* @param {string} path
* @returns {boolean}
*/
function isMigrationFile(path) {
	return path.endsWith(".sql");
}
/**
* Migrations in `paths` that are not yet in `applied`, in apply order.
* Non-`.sql` entries (a `readdir` also yields `migrations/auth/`) are dropped.
* @param {Iterable<string>} paths
* @param {Iterable<string>} applied
* @returns {Array<{ name: string, path: string }>}
*/
function pendingMigrations(paths, applied) {
	const done = new Set(applied);
	return [...paths].filter(isMigrationFile).map((path) => ({
		name: migrationName(path),
		path
	})).sort((a, b) => a.name.localeCompare(b.name)).filter(({ name }) => !done.has(name));
}
var rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : void 0;
var databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : void 0;
/**
* Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
* sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
* the app has a working database even with nothing configured — the live preview
* included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
*/
var dbSource = databaseUrl ? "neon" : "pglite";
/**
* Init state lives on globalThis as promises: dev HMR creates new instances of
* this module, and two instances racing module-level state would open a second
* pool or run two concurrent PGLite migration passes (whose duplicate
* `_migrations` insert rejects — and would get memoized, poisoning every later
* `getSql()`). A failed init clears its slot so the next call retries.
*/
var globalRef = globalThis;
/**
* Result-type parity: Postgres sends every value as text plus a type OID — the
* JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
* int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
* JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
* production return identical, JSON-safe shapes:
*   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
*                                   `::text` if you ever need huge integers)
*   date                         -> 'YYYY-MM-DD' string
*   interval                     -> Postgres interval text
* numeric already comes back as a string on both (arbitrary precision).
*/
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
var identity = (v) => v;
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0];
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
function createNeonSql() {
	globalRef.__pgSqlPromise__ ??= (async () => {
		const { Pool, types } = await import("../_libs/pg.mjs").then((n) => n.t);
		types.setTypeParser(OID_INT8, Number);
		types.setTypeParser(OID_DATE, identity);
		types.setTypeParser(OID_INTERVAL, identity);
		const pool = new Pool({ connectionString: databaseUrl });
		return toSql(async (text, params) => {
			return (await pool.query(text, params)).rows;
		});
	})().catch((err) => {
		globalRef.__pgSqlPromise__ = void 0;
		throw err;
	});
	return globalRef.__pgSqlPromise__;
}
async function createPgliteSql() {
	globalRef.__pgliteInstance__ ??= (async () => {
		const { PGlite } = await import("../_libs/electric-sql__pglite.mjs").then((n) => n.t);
		const pg = new PGlite({ parsers: {
			[OID_INT8]: Number,
			[OID_DATE]: identity,
			[OID_INTERVAL]: identity
		} });
		await pg.waitReady;
		await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
		return pg;
	})().catch((err) => {
		globalRef.__pgliteInstance__ = void 0;
		throw err;
	});
	const pg = await globalRef.__pgliteInstance__;
	const migrate = async () => {
		const migrations = /* #__PURE__ */ Object.assign({ "/migrations/0002_casa.sql": _0002_casa_default });
		const done = (await pg.query("select name from _migrations")).rows.map((r) => r.name);
		for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) await pg.transaction(async (tx) => {
			await tx.exec(migrations[path]);
			await tx.query("insert into _migrations (name) values ($1)", [name]);
		});
	};
	const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve()).catch(() => void 0).then(migrate);
	globalRef.__pgliteMigrateChain__ = pass;
	await pass;
	return toSql(async (text, params) => {
		return (await pg.query(text, params)).rows;
	});
}
var sqlPromise = null;
async function createSql() {
	if (typeof window !== "undefined") throw new Error("@/lib/db is server-only — call getSql() from a createServerFn handler or a server route loader, never from client code.");
	return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}
/**
* Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
* otherwise the local PGLite fallback. Memoized — safe to call per request.
*
* Schema comes from `migrations/*.sql`, auto-applied before the first query on
* both backends — define tables there, never inline in server functions.
*/
function getSql() {
	sqlPromise ??= createSql().catch((err) => {
		sqlPromise = null;
		throw err;
	});
	return sqlPromise;
}
/**
* Finish DB bootstrap before the server handles traffic.
*
* - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
*   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
* - **Neon**: no-op (pool is created lazily on first query).
*
* Vite `configureServer` awaits this at dev startup; production imports of this
* module kick it off immediately (see bottom of file).
*/
function ensureDbReady() {
	if (dbSource !== "pglite") return Promise.resolve();
	return getSql().then(() => void 0);
}
var globalBoot = globalThis;
if (typeof window === "undefined" && dbSource === "pglite") globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
	globalBoot.__pgBootstrapPromise__ = void 0;
	console.error("[db] PGLite bootstrap failed:", err);
});
var COOKIE = "lqp_casa";
var PASS = "brasas5768";
function seal(value) {
	return createHash("sha256").update(`lqp-casa:${value}`).digest("hex");
}
function safeEqual(a, b) {
	const left = Buffer.from(a);
	const right = Buffer.from(b);
	if (left.length !== right.length) return false;
	return timingSafeEqual(left, right);
}
function houseOpen() {
	const cookie = getCookie(COOKIE);
	return Boolean(cookie && safeEqual(cookie, seal(PASS)));
}
function enterHouse(password) {
	if (!safeEqual(seal(password), seal(PASS))) return false;
	setCookie$1(COOKIE, seal(PASS), {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: 2592e3
	});
	return true;
}
function assertHouse() {
	if (!houseOpen()) throw new Error("cerrado");
}
function num(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
}
async function readMenu() {
	const rows = await (await getSql())`
    select kind, item_id, price, available from menu_overrides
  `;
	const plates = {};
	const drinks = {};
	for (const row of rows) {
		const patch = {};
		const price = num(row.price);
		if (price !== void 0) patch.price = price;
		if (row.available === false) patch.available = false;
		if (row.kind === "plate") plates[row.item_id] = patch;
		if (row.kind === "drink") drinks[row.item_id] = patch;
	}
	return {
		plates,
		drinks
	};
}
async function writeMenu(kind, id, price, available) {
	assertHouse();
	const sql = await getSql();
	if (price == null && available) {
		await sql`delete from menu_overrides where kind = ${kind} and item_id = ${id}`;
		return;
	}
	await sql`
    insert into menu_overrides (kind, item_id, price, available)
    values (${kind}, ${id}, ${price}, ${available})
    on conflict (kind, item_id) do update set price = excluded.price, available = excluded.available
  `;
}
async function placeHold(input) {
	if (!SLOT_TIMES.includes(input.time)) throw new Error("hora");
	if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("fecha");
	const party = Math.round(input.party);
	if (party < 1 || party > 20) throw new Error("personas");
	const id = randomUUID();
	await (await getSql())`
    insert into holds (id, day, slot, party, status)
    values (${id}, ${input.date}, ${input.time}, ${party}, 'pendiente')
  `;
	return { id };
}
async function listHolds() {
	assertHouse();
	return (await (await getSql())`
    select id, day, slot, party, status from holds order by day, slot, created_at
  `).map((row) => ({
		id: row.id,
		date: String(row.day).slice(0, 10),
		time: row.slot,
		party: Number(row.party),
		status: row.status === "confirmada" || row.status === "no" ? row.status : "pendiente",
		notes: ""
	}));
}
async function markHold(id, status) {
	assertHouse();
	await (await getSql())`update holds set status = ${status} where id = ${id}`;
}
async function loadStore() {
	const doc = (await (await getSql())`select doc from casa_json where key = 'supplies'`)[0]?.doc;
	if (!doc) return null;
	if (typeof doc === "string") return JSON.parse(doc);
	return doc;
}
async function saveStore(store) {
	const sql = await getSql();
	const doc = JSON.stringify(store);
	await sql.query(`insert into casa_json (key, doc) values ($1, $2::jsonb)
     on conflict (key) do update set doc = excluded.doc`, ["supplies", doc]);
}
async function desk(store, book) {
	const { runWithStore, listSupplies, listPreps, usesOf } = await import("./engine-D8l-tHdj.mjs");
	return runWithStore(store, () => {
		return {
			supplies: listSupplies(book).filter((supply) => supply.kind === "buy").map((supply) => {
				const units = supply.units || 1;
				const yieldPct = supply.yield == null || supply.yield === 0 ? 1 : supply.yield;
				return {
					id: supply.id,
					name: supply.name,
					category: supply.category,
					pack: supply.pack,
					unit: supply.unit,
					buy: supply.buy,
					yield: supply.yield,
					each: supply.buy == null ? null : supply.buy / (units * yieldPct),
					used: usesOf(book, supply.name).length
				};
			}),
			preps: listPreps(book).map((prep) => ({
				id: prep.id,
				name: prep.name,
				yield: prep.yield,
				lines: prep.lines.map((line, index) => ({
					index,
					name: line.name,
					qty: line.qty,
					each: line.each
				}))
			}))
		};
	}).result;
}
async function supplyDesk(book) {
	assertHouse();
	return desk(await loadStore(), book);
}
async function patchSupply(input) {
	assertHouse();
	const engine = await import("./engine-D8l-tHdj.mjs");
	if (input.kind === "reset") {
		await saveStore(engine.runWithStore(null, () => void 0).store);
		return desk(null, input.book);
	}
	const { store } = engine.runWithStore(await loadStore(), () => {
		if (input.kind === "buy" && input.id != null && input.value != null) engine.setSupplyBuy(input.book, input.id, input.value);
		if (input.kind === "yield" && input.id != null && input.value != null) engine.setSupplyYield(input.book, input.id, input.value);
		if (input.kind === "prepQty" && input.id != null && input.index != null && input.value != null) engine.setPrepQty(input.book, input.id, input.index, input.value);
		if (input.kind === "prepEach" && input.id != null && input.index != null && input.value != null) engine.setPrepEach(input.book, input.id, input.index, input.value);
	});
	await saveStore(store);
	return desk(store, input.book);
}
async function menuCosts() {
	assertHouse();
	const { foodCost, barCost } = await import("./engine-D8l-tHdj.mjs");
	const { listPlates } = await import("./plates-CEvsXDBF.mjs").then((n) => n.u);
	const { listDrinks, DRINK_TARGET } = await import("./drinks-oTv8EpyV.mjs").then((n) => n.i);
	const plates = {};
	for (const plate of listPlates()) {
		const cost = foodCost(plate.es);
		if (cost != null) plates[plate.id] = cost;
	}
	const drinks = {};
	for (const drink of listDrinks()) {
		const cost = barCost(drink.es);
		if (cost != null) drinks[drink.id] = cost;
	}
	return {
		plates,
		drinks,
		targets: DRINK_TARGET
	};
}
function finite(value) {
	const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
	return Number.isFinite(n) ? n : null;
}
function weekBook(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return {};
	const out = {};
	for (const [week, row] of Object.entries(value)) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(week) || !row || typeof row !== "object" || Array.isArray(row)) continue;
		const counts = {};
		for (const [id, raw] of Object.entries(row)) {
			if (!/^[a-z0-9-]{1,48}$/.test(id)) continue;
			const n = finite(raw);
			if (n == null || n <= 0 || n >= 1e5) continue;
			counts[id] = Math.round(n);
		}
		if (Object.keys(counts).length) out[week] = counts;
	}
	return out;
}
function laborDoc(value) {
	const src = value && typeof value === "object" && !Array.isArray(value) ? value : {};
	const wage = finite(src.wage);
	const minutes = {};
	const raw = src.minutes;
	if (raw && typeof raw === "object" && !Array.isArray(raw)) for (const [id, n] of Object.entries(raw)) {
		if (!/^[a-z0-9-]{1,48}$/.test(id)) continue;
		const minutesValue = finite(n);
		if (minutesValue == null || minutesValue <= 0 || minutesValue > 1440) continue;
		minutes[id] = Math.round(minutesValue);
	}
	return {
		wage: wage != null && wage > 0 && wage < 1e4 ? wage : 0,
		minutes
	};
}
async function readJson(key) {
	const doc = (await (await getSql())`select doc from casa_json where key = ${key}`)[0]?.doc;
	if (!doc) return null;
	if (typeof doc === "string") try {
		return JSON.parse(doc);
	} catch {
		return null;
	}
	return doc;
}
async function writeJson(key, doc) {
	await (await getSql()).query(`insert into casa_json (key, doc) values ($1, $2::jsonb)
     on conflict (key) do update set doc = excluded.doc`, [key, JSON.stringify(doc)]);
}
async function readOps() {
	assertHouse();
	const [labor, pour, kitchen] = await Promise.all([
		readJson("labor"),
		readJson("pour"),
		readJson("kitchen")
	]);
	return {
		labor: laborDoc(labor),
		pour: weekBook(pour),
		kitchen: weekBook(kitchen)
	};
}
async function writeOps(key, doc) {
	assertHouse();
	const clean = key === "labor" ? laborDoc(doc) : weekBook(doc);
	await writeJson(key, clean);
	return clean;
}
//#endregion
export { enterHouse, houseOpen, listHolds, markHold, menuCosts, patchSupply, placeHold, readMenu, readOps, supplyDesk, writeMenu, writeOps };
