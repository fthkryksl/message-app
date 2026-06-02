import { clearAuth } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export type AuthResponse = {
  token: string;
  hash: string;
};

export type ChatMessage = {
  id: number;
  userid: string;
  time: string;
  chatid: number;
  text?: string;
  photoid?: string;
  position?: string;
  important: boolean;
  usernick: string;
  userhash: string;
  username?: string;
  userfullname?: string;
};

export type ChatRoom = {
  chatid: number;
  chatname: string;
  visibility: "public" | "private";
  role: "owner" | "member" | "invited" | "admin" | "none";
  joined: boolean;
};

export type UserProfile = {
  hash: string;
  nickname: string;
  fullname?: string;
};

export type Invite = {
  chatid: number;
  chatname: string;
};

// Zusammensetzung der URL mit Parametern (GET-Requests)
function buildUrl(params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString();
  return `${BASE_URL}?${query}`;
}

// ── Authentication Endpoints ─────────────────────────────────

// Registrierung
export async function register(
  userid: string,
  password: string,
  nickname: string,
  fullname: string
): Promise<AuthResponse> {
  const url = buildUrl({ request: "register", userid, password, nickname, fullname });
  const res = await fetch(url);

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === "error" || !data.token) {
    throw new Error(data.message ?? `Registration failed (${res.status})`);
  }

  return { token: data.token, hash: data.hash };
}

// Login
export async function login(
  userid: string,
  password: string
): Promise<AuthResponse> {
  const url = buildUrl({ request: "login", userid, password });
  const res = await fetch(url);

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === "error" || !data.token) {
    throw new Error(data.message ?? `Login failed. Check username/password.`);
  }

  return { token: data.token, hash: data.hash };
}

// Logout
export async function logout(token: string): Promise<void> {
  const url = buildUrl({ request: "logout", token });
  try {
    await fetch(url);
  } finally {
    clearAuth();
  }
}

// Deregistrierung
export async function deregister(token: string): Promise<void> {
  const url = buildUrl({ request: "deregister", token });
  const res = await fetch(url);

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === "error") {
    throw new Error(data.message ?? `Deregistration failed (${res.status})`);
  }

  clearAuth();
}

// ── Messaging Endpoints ──────────────────────────────────────

// Get Messages
export async function getMessages(
  token: string,
  chatid?: number,
  fromid?: number
): Promise<ChatMessage[]> {
  const params: Record<string, string> = { request: "getmessages", token };
  if (chatid !== undefined) params.chatid = String(chatid);
  if (fromid !== undefined) params.fromid = String(fromid);

  const url = buildUrl(params);
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Failed to fetch messages (${res.status})`);
  }

  const data = await res.json();
  return data.messages ?? [];
}

// Post Message
export async function postMessage(
  token: string,
  params: {
    text?: string;
    photo?: string;
    position?: string;
    chatid?: number;
    important?: boolean;
  }
): Promise<void> {
  const res = await fetch(BASE_URL || "", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      request: "postmessage",
      token,
      ...params,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === "error") {
    throw new Error(data.message ?? `Failed to post message (${res.status})`);
  }
}

// ── Chat / Group Endpoints ───────────────────────────────────

// Get Chats
export async function getChats(token: string): Promise<ChatRoom[]> {
  const url = buildUrl({ request: "getchats", token });
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Failed to fetch chats (${res.status})`);
  }

  const data = await res.json();
  return data.chats ?? [];
}

// Create Chat
export async function createChat(
  token: string,
  chatname: string,
  ispublic: boolean = false
): Promise<number> {
  const url = buildUrl({ request: "createchat", token, chatname, ispublic: String(ispublic) });
  const res = await fetch(url);

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === "error" || data.chatid === undefined) {
    throw new Error(data.message ?? `Failed to create chat (${res.status})`);
  }

  return Number(data.chatid);
}

// Delete Chat
export async function deleteChat(token: string, chatid: number): Promise<void> {
  const url = buildUrl({ request: "deletechat", token, chatid: String(chatid) });
  const res = await fetch(url);

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === "error") {
    throw new Error(data.message ?? `Failed to delete chat (${res.status})`);
  }
}

// Join Chat (Join public or accept invitation)
export async function joinChat(token: string, chatid: number): Promise<void> {
  const url = buildUrl({ request: "joinchat", token, chatid: String(chatid) });
  const res = await fetch(url);

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === "error") {
    throw new Error(data.message ?? `Failed to join chat (${res.status})`);
  }
}

// Leave Chat (Leave group)
export async function leaveChat(token: string, chatid: number): Promise<void> {
  const url = buildUrl({ request: "leavechat", token, chatid: String(chatid) });
  const res = await fetch(url);

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === "error") {
    throw new Error(data.message ?? `Failed to leave chat (${res.status})`);
  }
}

// ── Profile / Search Endpoints ───────────────────────────────

// Get Profiles
export async function getProfiles(token: string): Promise<UserProfile[]> {
  const url = buildUrl({ request: "getprofiles", token });
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Failed to fetch profiles (${res.status})`);
  }

  const data = await res.json();
  return data.profiles ?? [];
}

// Get Invites
export async function getInvites(token: string): Promise<Invite[]> {
  const url = buildUrl({ request: "getinvites", token });
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Failed to fetch invites (${res.status})`);
  }

  const data = await res.json();
  return data.invites ?? [];
}

// Invite User
export async function inviteUser(
  token: string,
  chatid: number,
  invitedhash: string
): Promise<void> {
  const url = buildUrl({ request: "invite", token, chatid: String(chatid), invitedhash });
  const res = await fetch(url);

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === "error") {
    throw new Error(data.message ?? `Failed to invite user (${res.status})`);
  }
}
