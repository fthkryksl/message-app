const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export type AuthResponse = {
  token: string;
};

//Zusammensetzung der POST-URL mit Parametern
function buildUrl(params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString();
  return `${BASE_URL}?${query}`;
}

//Registrierung
export async function register(
  userid: string,
  password: string,
  nickname: string,
  fullname: string
): Promise<AuthResponse> {
  const url = buildUrl({ request: "register", userid, password, nickname, fullname });
  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Registration failed (${res.status})`);
  }

  return res.json();
}

//Login
export async function login(
  userid: string,
  password: string
): Promise<AuthResponse> {
  const url = buildUrl({ request: "login", userid, password });
  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Login failed (${res.status})`);
  }

  return res.json();
}

//Logout
export async function logout(token: string): Promise<void> {
  const url = buildUrl({ request: "logout", token });
  await fetch(url);
  clearToken();
}

//Deregistrierung
export async function deregister(token: string): Promise<void> {
  const url = buildUrl({ request: "deregister", token });
  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Deregistration failed (${res.status})`);
  }

  clearToken();
}

//Token helpers
export const saveToken = (token: string) =>
  localStorage.setItem("auth_token", token);

export const getToken = () =>
  localStorage.getItem("auth_token");

export const clearToken = () =>
  localStorage.removeItem("auth_token");