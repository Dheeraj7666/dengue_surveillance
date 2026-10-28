const TOKEN_KEY = 'denguecare.admin.token';
const USER_KEY = 'denguecare.admin.user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getAdminUser = () => localStorage.getItem(USER_KEY) || '';

export const isAuthenticated = () => Boolean(getToken());

export const setSession = (token: string, username: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, username);
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
