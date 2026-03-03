export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "admin" | "user";
  created_at: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  host_id: string;
  host_name?: string;
  room_name: string;
  status: "scheduled" | "active" | "ended";
  starts_at?: string;
  ended_at?: string;
  max_participants: number;
  participant_count?: number;
  created_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  role: "host" | "co-host" | "participant";
  joined_at: string;
  left_at?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
}
