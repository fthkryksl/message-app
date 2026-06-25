//Token helpers
export const saveToken = (token: string) =>
  localStorage.setItem("auth_token", token);

export const getToken = () => localStorage.getItem("auth_token");

export const saveUserHash = (hash: string) =>
  localStorage.setItem("user_hash", hash);

export const getUserHash = () => localStorage.getItem("user_hash");

export const clearAuth = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user_hash");
};
