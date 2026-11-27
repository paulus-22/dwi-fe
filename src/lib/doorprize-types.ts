/** Client-safe types for the Doorprize (Wheel of Fortune) feature. */

export type DoorprizeParticipant = {
  /** Stable unique slot key: `<code >:: <normalized member name or empty>`. */
  entryKey: string;
  checkInId: string;
  code: string;
  name: string;
  householdName: string | null;
  category: string | null;
  deviceName: string;
  occurredAt: string;
  selfie: string | null;
};

export type DoorprizeWinner = {
  id: string;
  checkInId: string | null;
  code: string;
  name: string;
  householdName: string | null;
  prize: string | null;
  drawnAt: string;
};

export type DoorprizeState = {
  participants: DoorprizeParticipant[];
  winners: DoorprizeWinner[];
};
