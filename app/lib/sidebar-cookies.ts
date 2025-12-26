/**
 * Cookie utility for sidebar state management
 */

export const SIDEBAR_COOKIE_NAME = "sidebar_state";

export function getSidebarState(): boolean {
  const cookies = document.cookie.split(";");
  const sidebarCookie = cookies.find((c) =>
    c.trim().startsWith(SIDEBAR_COOKIE_NAME)
  );

  if (sidebarCookie) {
    const value = sidebarCookie.split("=")[1];
    return value === "true";
  }

  return true; // Default to open
}

export function setSidebarState(isOpen: boolean): void {
  const date = new Date();
  date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${isOpen};${expires};path=/`;
}
