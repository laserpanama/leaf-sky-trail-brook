import type { Drink, DrinkSection } from "@/lib/drinks";
import type { Plate, PlateSection } from "@/lib/plates";
import type { Book } from "@/lib/books/engine";

/**
 * Everything that changes from one restaurant to the next. A new client is one
 * folder: `src/venues/<slug>/index.ts` (this shape) plus `src/venues/<slug>/public`
 * (photos, favicon, og image). Build with `VENUE=<slug>`; the default is
 * `laquintapata`, so the existing deploy keeps working unchanged.
 */

type CopyString =
  | "name" | "kicker" | "heroLine" | "heroSub" | "reserve" | "menu"
  | "cartaEyebrow" | "cartaTitle" | "cartaNote" | "bites" | "grill"
  | "barEyebrow" | "barTitle" | "barLead" | "nightsEyebrow" | "nightsTitle"
  | "reserveEyebrow" | "reserveTitle" | "reserveLead" | "date" | "time" | "slotsLead"
  | "syncOk" | "syncWait" | "syncOff" | "syncLogin" | "busy" | "party" | "guestName"
  | "guestPhone" | "phonePh" | "sending" | "saveError" | "saveWait" | "saveBad"
  | "notes" | "notesPh" | "send" | "cart" | "cartTitle" | "cartEmpty" | "cartAdd"
  | "cartMesa" | "cartGo" | "cartNote" | "cartNotePh" | "cartSend" | "cartTax"
  | "cartTotal" | "cartSent" | "cartSentBody" | "cartGone" | "cartLead" | "payHow"
  | "payYappy" | "payCard" | "payCash" | "yappyLead" | "yappyCopy" | "yappyCopied"
  | "yappyPhone" | "yappyPhonePh" | "yappyPhoneHint" | "yappyPhoneBad" | "cardLead"
  | "cashLead" | "payNeed" | "sentYappy" | "sentCard" | "sentCash" | "wa"
  | "holdTitle" | "holdBody" | "aboutEyebrow" | "visitEyebrow" | "visitTitle"
  | "address" | "mapNote" | "pay" | "amenities" | "ig" | "legal" | "legal2";

export type Copy = { [K in CopyString]: string } & {
  nav: { id: string; label: string }[];
  dishes: { kind: "grill" | "bite"; name: string; desc: string; price: string | null; img: string }[];
  barItems: { title: string; body: string }[];
  nights: { title: string; body: string }[];
  about: string[];
};

type Bi = { es: string; en: string };

export type Venue = {
  slug: string;
  name: string;
  meta: {
    title: string;
    description: string;
    /** Public origin, no trailing slash. Used in review links. */
    siteUrl: string;
  };
  /** Colors map 1:1 to the Tailwind tokens in styles.css. */
  theme: {
    bg: string;
    surface: string;
    fg: string;
    muted: string;
    /** Accent: buttons, prices, eyebrows (token name `brass`). */
    accent: string;
    /** Text drawn on top of the accent. */
    ink: string;
    line: string;
    /** Display headings: a serif reads well italic, a condensed sans does not. */
    displayStyle: "italic" | "normal";
    /** Extra CSS for the display face (letter-spacing, case). Optional. */
    displayCss?: string;
  };
  fonts: { href: string; display: string; sans: string };
  contact: {
    /** wa.me digits, country code first. */
    whatsapp: string;
    whatsappDisplay: string;
    /** Yappy digits; null hides Yappy at checkout. */
    yappy: string | null;
    /** Instagram handle without @. */
    instagram: string;
    address: string;
    streetAddress: string;
    locality: string;
    /** One line for the footer. */
    footer: string;
    map: { embed: string; title: string };
  };
  jsonld: { type: string; cuisine: string; payment: string; telephone: string };
  media: {
    hero: { src: string; alt: string };
    bar: { src: string; alt: string };
    nights: { src: string; alt: string };
    stage: { src: string; alt: string };
  };
  messages: {
    /** First line of the WhatsApp reservation message. */
    reserve: string;
    /** First line of the WhatsApp order message. */
    order: Bi;
    /** Post-visit feedback ask; `{name}` and `{link}` are filled in. */
    feedback: string;
    feedbackTitle: string;
  };
  copy: { es: Copy; en: Copy };
  menu: {
    drinkSections: DrinkSection[];
    drinkLabels?: Partial<Record<DrinkSection, Bi>>;
    drinks: Omit<Drink, "available">[];
    plateSections: PlateSection[];
    plateLabels?: Partial<Record<PlateSection, Bi>>;
    plates: Omit<Plate, "available">[];
  };
  booking: {
    /** Bookable start times, Panama time, 30-minute turns. */
    slots: string[];
    /** 0 = Sunday … 6 = Saturday. */
    closedWeekdays: number[];
    coversPerSlot: number;
    autoConfirmMaxParty: number;
    maxParty: number;
    bookAheadDays: number;
    minLeadMinutes: number;
  };
  /** What the reservation agent may say. Only true facts. */
  agent: { kind: string; payments: string; amenities: string; facts: string[] };
  /** Costing books for the admin. Empty books are fine for a demo. */
  books: { cocina: Book; barra: Book };
};

export const emptyBook: Book = { supplies: [], preps: [], specs: [], sides: [] };
