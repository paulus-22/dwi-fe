/**
 * Guest-facing copy. Event content (names, dates, story) lives in the database
 * with an `...Id` / `...En` field pair; this file covers only the fixed UI
 * chrome that is identical for every wedding.
 */

export const LOCALES = ["id", "en"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "id";

export function isLocale(value: string | undefined): value is AppLocale {
  return value === "id" || value === "en";
}

const id = {
  hero: {
    kicker: "the wedding of",
    salutation: "kepada yth. bapak/ibu/saudara-i",
    guestFallback: "Tamu Undangan",
    open: "buka undangan",
  },
  nav: {
    story: "cerita kami",
    events: "acara",
    rsvp: "rsvp",
    gift: "hadiah",
    dressCode: "dress code",
    wishes: "ucapan",
  },
  couple: {
    kicker: "mempelai",
    title: "Kedua mempelai",
    groom: "Mempelai pria",
    bride: "Mempelai wanita",
  },
  countdown: {
    title: "Menuju hari bahagia",
    days: "hari",
    hours: "jam",
    minutes: "menit",
    seconds: "detik",
    passed: "Terima kasih telah menjadi bagian dari hari kami.",
  },
  story: {
    kicker: "perjalanan kami",
    title: "Cerita kami",
  },
  rundown: {
    title: "Susunan acara",
  },
  events: {
    kicker: "waktu & tempat",
    title: "Hari bahagia kami",
    until: "selesai",
    directions: "lihat lokasi",
    addToCalendar: "simpan ke kalender",
  },
  rsvp: {
    title: "Konfirmasi kehadiran",
    nameLabel: "nama lengkap",
    attendanceLabel: "konfirmasi kehadiran",
    attending: "hadir",
    notAttending: "tidak hadir",
    countLabel: "jumlah tamu",
    countHint: "maksimal {max} orang untuk undangan ini",
    messageLabel: "ucapan (opsional)",
    submit: "kirim konfirmasi",
    submitting: "mengirim...",
    successAttending: "Terima kasih, kehadiranmu sudah kami catat.",
    successDeclined: "Terima kasih sudah memberi kabar.",
    update: "ubah konfirmasi",
    errors: {
      nameRequired: "Nama wajib diisi.",
      attendanceRequired: "Pilih hadir atau tidak hadir.",
      countRange: "Jumlah tamu harus antara 1 dan {max}.",
      generic: "Gagal mengirim. Coba lagi sebentar lagi.",
    },
  },
  gift: {
    kicker: "tanda kasih",
    title: "Hadiah",
    note: "Doa restu Anda adalah hadiah terindah. Namun jika berkenan memberi tanda kasih, berikut informasinya.",
    copy: "salin",
    copied: "tersalin",
    accountHolder: "a.n.",
    addressTitle: "kirim kado",
    copyAddress: "salin alamat",
  },
  dressCode: {
    kicker: "busana",
    title: "Dress code",
    paletteNote: "Warna acuan",
    imageAlt: "Contoh busana sesuai warna acuan",
  },
  wishes: {
    kicker: "untuk kami",
    title: "Ucapan & doa",
    nameLabel: "nama",
    messageLabel: "ucapan",
    submit: "kirim ucapan",
    submitting: "mengirim...",
    empty: "Belum ada ucapan. Jadilah yang pertama.",
    loadMore: "lihat lebih banyak",
    success: "Terima kasih atas doanya.",
    errors: {
      nameRequired: "Nama wajib diisi.",
      messageRequired: "Ucapan wajib diisi.",
      generic: "Gagal mengirim ucapan. Coba lagi.",
      rateLimited: "Terlalu banyak kiriman. Coba lagi sebentar lagi.",
    },
  },
  pass: {
    kicker: "tunjukkan saat tiba",
    title: "Kartu masuk",
    instruction: "tunjukkan qr ini di meja penerima tamu",
    admits: "berlaku untuk {count} orang",
  },
  voucher: {
    kicker: "e-voucher",
    title: "Kartu masuk",
    admitOne: "berlaku untuk 1 orang",
    admits: "berlaku untuk {count} orang",
    instruction: "Tunjukkan QR ini di meja penerima tamu.",
    saveImage: "simpan gambar",
    saving: "menyimpan...",
    openInvitation: "buka undangan",
    issuedTo: "atas nama",
    code: "kode",
    pendingTitle: "Belum ada kartu masuk",
    pendingBody:
      "Kartu masuk terbit setelah Anda mengonfirmasi kehadiran pada undangan.",
    pendingCta: "konfirmasi kehadiran",
    declinedTitle: "Sampai jumpa lain waktu",
    declinedBody:
      "Anda tercatat tidak dapat hadir, jadi kartu masuk tidak diterbitkan. Berubah pikiran? Ubah konfirmasi pada undangan.",
    declinedCta: "ubah konfirmasi",
    unknownTitle: "Kartu masuk tidak ditemukan",
    unknownBody:
      "Tautan ini tidak dikenali. Gunakan tautan pribadi yang kami kirimkan kepada Anda.",
    fromInviteTitle: "Kartu masuk Anda sudah terbit",
    fromInviteBody:
      "Simpan kartu masuk ini dan tunjukkan di meja penerima tamu saat hari H.",
    fromInviteCta: "lihat kartu masuk",
  },
  closing: {
    default:
      "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara-i berkenan hadir dan memberikan doa restu.",
    thanks: "Terima kasih",
    withLove: "Dengan cinta,",
  },
  music: {
    play: "putar musik",
    pause: "hentikan musik",
  },
  localeSwitch: {
    label: "bahasa",
  },
};

type Dictionary = typeof id;

const en: Dictionary = {
  hero: {
    kicker: "the wedding of",
    salutation: "dear mr/mrs/ms",
    guestFallback: "Our Guest",
    open: "open invitation",
  },
  nav: {
    story: "our story",
    events: "events",
    rsvp: "rsvp",
    gift: "gift",
    dressCode: "dress code",
    wishes: "wishes",
  },
  couple: {
    kicker: "the couple",
    title: "Groom and bride",
    groom: "The groom",
    bride: "The bride",
  },
  countdown: {
    title: "Save the date",
    days: "days",
    hours: "hours",
    minutes: "minutes",
    seconds: "seconds",
    passed: "Thank you for being part of our day.",
  },
  story: {
    kicker: "how we got here",
    title: "Our love story",
  },
  rundown: {
    title: "Rundown",
  },
  events: {
    kicker: "when & where",
    title: "Our special day",
    until: "onwards",
    directions: "view location",
    addToCalendar: "add to calendar",
  },
  rsvp: {
    title: "Confirm attendance",
    nameLabel: "full name",
    attendanceLabel: "will you attend?",
    attending: "attending",
    notAttending: "not attending",
    countLabel: "number of guests",
    countHint: "up to {max} people on this invitation",
    messageLabel: "message (optional)",
    submit: "send confirmation",
    submitting: "sending...",
    successAttending: "Thank you, we have you on the list.",
    successDeclined: "Thank you for letting us know.",
    update: "change response",
    errors: {
      nameRequired: "Name is required.",
      attendanceRequired: "Choose attending or not attending.",
      countRange: "Guest count must be between 1 and {max}.",
      generic: "Could not send. Please try again shortly.",
    },
  },
  gift: {
    kicker: "a token of love",
    title: "Wedding gift",
    note: "Your presence and prayers are the greatest gift. Should you wish to send a token of love, here are the details.",
    copy: "copy",
    copied: "copied",
    accountHolder: "a/n",
    addressTitle: "send a gift",
    copyAddress: "copy address",
  },
  dressCode: {
    kicker: "busana",
    title: "Dress code",
    paletteNote: "Reference palette",
    imageAlt: "Outfit reference for the palette",
  },
  wishes: {
    kicker: "for the couple",
    title: "Share your blessing",
    nameLabel: "name",
    messageLabel: "message",
    submit: "send wish",
    submitting: "sending...",
    empty: "No wishes yet. Be the first.",
    loadMore: "load more",
    success: "Thank you for your wishes.",
    errors: {
      nameRequired: "Name is required.",
      messageRequired: "Message is required.",
      generic: "Could not send your wish. Please try again.",
      rateLimited: "Too many messages. Please try again in a moment.",
    },
  },
  pass: {
    kicker: "show this on arrival",
    title: "Entry pass",
    instruction: "show this qr code at the reception desk",
    admits: "admits {count} people",
  },
  voucher: {
    kicker: "e-voucher",
    title: "Entry pass",
    admitOne: "admits 1 guest",
    admits: "admits {count} guests",
    instruction: "Show this QR code at the reception desk.",
    saveImage: "save image",
    saving: "saving...",
    openInvitation: "open invitation",
    issuedTo: "issued to",
    code: "code",
    pendingTitle: "No entry pass yet",
    pendingBody:
      "Your pass is issued once you confirm your attendance on the invitation.",
    pendingCta: "confirm attendance",
    declinedTitle: "We will miss you",
    declinedBody:
      "You are marked as unable to attend, so no pass was issued. Changed your mind? Update your response on the invitation.",
    declinedCta: "change response",
    unknownTitle: "Pass not found",
    unknownBody:
      "This link was not recognised. Please use the personal link we sent you.",
    fromInviteTitle: "Your entry pass is ready",
    fromInviteBody:
      "Save your pass and show it at the reception desk on the day.",
    fromInviteCta: "view entry pass",
  },
  closing: {
    default:
      "It would be an honour and a joy for us if you could attend and give us your blessing.",
    thanks: "Thank you",
    withLove: "With love,",
  },
  music: {
    play: "play music",
    pause: "pause music",
  },
  localeSwitch: {
    label: "language",
  },
};

const dictionaries: Record<AppLocale, Dictionary> = { id, en };

/**
 * Fills `{name}` placeholders. Dictionary entries must stay plain strings —
 * functions cannot be passed from a Server Component into a Client one.
 */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export function getDictionary(locale: AppLocale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
