export type LayoutMode = "grid" | "grouped" | "side-by-side";

export interface MeetingState {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  layout: LayoutMode;
  showParticipants: boolean;
  showInfo: boolean;
  showSettings: boolean;
  showInvite: boolean;
  showDesign: boolean;
  showShareDialog: boolean;
  activeSpeaker: string | null;
  participantCount: number;
}
