import type { PublicEvent, ResolvedGuest, VoucherState } from "./event";
import { isThemeKey } from "./themes";

/**
 * Preview mode.
 *
 * The public pages serve a single hard-coded event instead of calling dwi-be,
 * so the invitation can be deployed with no backend at all for a client to look
 * at. Set API_URL and the very same pages go back to the API.
 *
 * `PREVIEW_MODE=1` forces it on. That override exists because Next always loads
 * `.env*`, so locally API_URL is present even when you unset it in the shell —
 * without this flag preview mode is untestable on a dev machine.
 *
 * `PREVIEW_THEME=<key>` picks which theme the demo renders, so one deployment
 * can show a client every design without a database behind it.
 */
export function isPreviewMode(): boolean {
  if (process.env.PREVIEW_MODE === "1") return true;
  return !process.env.API_URL;
}

export const PREVIEW_SLUG = "alex-ajeng";
/** The code baked into preview links so the personalised parts render. */
export const PREVIEW_TOKEN = "AJ27-FAM-0001-2";

const id = (suffix: string) => `preview-${suffix}`;

/** Wedding date, kept comfortably in the future so the countdown always runs. */
const HEADLINE = new Date("2027-05-15T03:00:00Z"); // 10.00 WIB

export const previewEvent: PublicEvent = {
  kind: "WEDDING",
  slug: PREVIEW_SLUG,

  brideShortName: "Ajeng",
  brideFullName: "Ajeng Prameswari",
  brideParents: "Putri pertama dari Bapak Suryanto & Ibu Maryani",
  brideInstagram: "@ajengprameswari",
  groomShortName: "Alex",
  groomFullName: "Alexander Nugroho",
  groomParents: "Putra kedua dari Bapak Hendarto & Ibu Lestari",
  groomInstagram: "@alexnugroho",

  headlineDate: HEADLINE,
  timezone: "Asia/Jakarta",
  defaultLocale: "ID",
  bilingual: true,
  hashtag: "#AlexMeetsAjeng",
  theme: isThemeKey(process.env.PREVIEW_THEME) ? process.env.PREVIEW_THEME : "sage-peach",

  themeTokens: null,

  quoteTextId:
    "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu merasa tenteram di sampingnya.",
  quoteTextEn:
    "And among His signs is that He created for you mates from among yourselves, so that you may find tranquillity in them.",
  quoteAuthor: "QS. Ar-Rum: 21",

  storyIntroId:
    "Berawal dari pertemuan yang tidak direncanakan, kami menemukan bahwa perjalanan ini terasa lebih ringan bila ditempuh berdua.",
  storyIntroEn:
    "It began with a meeting neither of us planned, and we found the road lighter when walked together.",

  closingNoteId:
    "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara-i berkenan hadir dan memberikan doa restu.",
  closingNoteEn:
    "It would be an honour and a joy for us if you could attend and give us your blessing.",

  dressCodeNoteId:
    "Mohon kenakan busana bernuansa earth tone atau peach. Hindari warna putih dan hitam pekat.",
  dressCodeNoteEn:
    "Please wear earth-tone or peach attire. Kindly avoid white and solid black.",
  dressCodeColors: ["#E9AF8A", "#EDCBB2", "#8FA072", "#56584B", "#F5F0E8"],

  musicUrl: null,

  // The demo ships without photography: the only images on hand belong to a
  // real couple, and a shared preview is the wrong place for them.
  coverPhotoUrl: null,
  coverBackgroundUrl: null,
  closingPhotoUrl: null,
  dressCodeImageUrl: null,
  giftImageUrl: null,
  giftAddress: null,
  interludePhotos: [],
  galleryPhotos: [],

  ceremonies: [
    {
      id: id("ceremony-akad"),
      nameId: "Akad nikah",
      nameEn: "Wedding ceremony",
      startsAt: new Date("2027-05-15T03:00:00Z"),
      endsAt: new Date("2027-05-15T05:00:00Z"),
      venueName: "Masjid Agung Sunda Kelapa",
      venueAddress: "Jl. Taman Sunda Kelapa No. 16, Menteng, Jakarta Pusat",
      mapsUrl: "https://maps.google.com/?q=Masjid+Agung+Sunda+Kelapa",
      mapsEmbedUrl: null,
      sortOrder: 0,
    },
    {
      id: id("ceremony-resepsi"),
      nameId: "Resepsi",
      nameEn: "Reception",
      startsAt: new Date("2027-05-15T12:00:00Z"),
      endsAt: null,
      venueName: "Balai Kartini",
      venueAddress: "Jl. Gatot Subroto Kav. 37, Jakarta Selatan",
      mapsUrl: "https://maps.google.com/?q=Balai+Kartini+Jakarta",
      mapsEmbedUrl: null,
      sortOrder: 1,
    },
  ],

  milestones: [
    {
      id: id("m1"),
      periodLabel: "Maret 2018",
      titleId: "Pertama bertemu",
      titleEn: "First meeting",
      bodyId: "Satu acara kantor, dua orang yang sama-sama datang terlambat.",
      bodyEn: "One office event, two people who both turned up late.",
      photoUrl: null,
      sortOrder: 0,
    },
    {
      id: id("m2"),
      periodLabel: "September 2021",
      titleId: "Memulai bersama",
      titleEn: "Starting together",
      bodyId: "Kami sepakat bahwa perjalanan ini lebih baik ditempuh berdua.",
      bodyEn: "We agreed this road is better travelled by two.",
      photoUrl: null,
      sortOrder: 1,
    },
    {
      id: id("m3"),
      periodLabel: "November 2026",
      titleId: "Lamaran",
      titleEn: "The proposal",
      bodyId: "Di hadapan keluarga, dengan restu yang kami syukuri sampai hari ini.",
      bodyEn: "In front of family, with a blessing we are still grateful for.",
      photoUrl: null,
      sortOrder: 2,
    },
  ],

  rundown: [
    { id: id("r0"), timeLabel: "19.00", titleId: "Tamu tiba", titleEn: "Guest arrival", sortOrder: 0 },
    { id: id("r1"), timeLabel: "19.30", titleId: "Kedua mempelai memasuki ruangan", titleEn: "Grand entrance of the couple", sortOrder: 1 },
    { id: id("r2"), timeLabel: "19.45", titleId: "Sambutan keluarga", titleEn: "Family remarks", sortOrder: 2 },
    { id: id("r3"), timeLabel: "20.00", titleId: "Makan malam", titleEn: "Dinner is served", sortOrder: 3 },
    { id: id("r4"), timeLabel: "20.45", titleId: "Potong kue", titleEn: "Cake cutting", sortOrder: 4 },
    { id: id("r5"), timeLabel: "21.15", titleId: "Sesi foto bersama", titleEn: "Photo session", sortOrder: 5 },
    { id: id("r6"), timeLabel: "22.00", titleId: "Penutup", titleEn: "Closing & farewell", sortOrder: 6 },
  ],

  giftAccounts: [
    {
      id: id("g0"),
      kind: "BANK",
      institution: "Bank Mandiri",
      accountNumber: "1230009876543",
      accountHolder: "Ajeng Prameswari",
      qrImageUrl: null,
      sortOrder: 0,
    },
    {
      id: id("g1"),
      kind: "EWALLET",
      institution: "GoPay",
      accountNumber: "081298765432",
      accountHolder: "Alexander Nugroho",
      qrImageUrl: null,
      sortOrder: 1,
    },
  ],
};

/** The single demo guest. Confirmed attending, so the voucher renders. */
export const previewGuest: ResolvedGuest = {
  id: id("guest"),
  householdName: "Keluarga Bapak Wibowo",
  token: PREVIEW_TOKEN,
  plusGuestAllowance: 3,
  rsvp: { attending: true, guestCount: 2, respondentName: "Keluarga Bapak Wibowo", message: null },
};

/**
 * Demo voucher. The real payload is signed by dwi-be; there is no secret here,
 * so this one is a placeholder in the same shape and will not verify in the
 * scanner — fine for a look-only preview.
 */
export const previewVoucher: VoucherState = {
  status: "issued",
  guest: {
    id: previewGuest.id,
    householdName: previewGuest.householdName,
    token: previewGuest.token,
    plusGuestAllowance: previewGuest.plusGuestAllowance,
    displayName: previewGuest.householdName,
  },
  admits: 2,
  qrPayload: "DWI1.AJ27.FAM.0001.2.000000000000",
};

export const previewWishes = [
  {
    id: id("w0"),
    name: "Rani & Dimas",
    message:
      "Selamat menempuh hidup baru, Alex & Ajeng! Semoga sakinah, mawaddah, warahmah.",
    createdAt: new Date("2027-04-02T10:00:00Z"),
  },
  {
    id: id("w1"),
    name: "Keluarga Besar Hartono",
    message:
      "Bahagia selalu untuk kalian berdua. Sampai jumpa di hari bahagia kalian!",
    createdAt: new Date("2027-04-01T09:30:00Z"),
  },
  {
    id: id("w2"),
    name: "Tim Kantor",
    message:
      "Akhirnya! Selamat ya Alex. Ajeng, titip Alex baik-baik. Sukses selalu untuk kalian.",
    createdAt: new Date("2027-03-30T14:15:00Z"),
  },
];
