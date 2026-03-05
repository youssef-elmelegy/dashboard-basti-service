/**
 * Debug utilities for troubleshooting authentication and API issues
 */

export const debugAuth = () => {
  console.log("=== AUTH DEBUG ===");

  // Check localStorage
  const authStoreRaw = localStorage.getItem("auth-store");
  console.log(
    "auth-store in localStorage:",
    authStoreRaw ? "✅ Found" : "❌ Not found",
  );

  if (authStoreRaw) {
    try {
      const parsed = JSON.parse(authStoreRaw);
      console.log("Parsed auth-store:", parsed);

      const state = parsed.state || parsed;
      console.log(
        "Access Token:",
        state.accessToken
          ? `✅ Found (${state.accessToken.substring(0, 20)}...)`
          : "❌ Not found",
      );
      console.log(
        "Is Authenticated:",
        state.isAuthenticated ? "✅ Yes" : "❌ No",
      );
      console.log(
        "Admin:",
        state.admin
          ? `✅ ${state.admin.email} (${state.admin.role})`
          : "❌ Not found",
      );
    } catch (e) {
      console.error("Failed to parse auth-store:", e);
    }
  }

  // Check direct key
  const directToken = localStorage.getItem("accessToken");
  console.log(
    "Direct accessToken key:",
    directToken ? "✅ Found" : "❌ Not found",
  );

  console.log("================");
};

export const debugRequest = (method: string, url: string) => {
  console.log(`=== ${method} ${url} ===`);
  const authStoreRaw = localStorage.getItem("auth-store");
  if (authStoreRaw) {
    try {
      const parsed = JSON.parse(authStoreRaw);
      const state = parsed.state || parsed;
      const token = state.accessToken;
      if (token) {
        console.log(`Authorization: Bearer ${token.substring(0, 20)}...`);

        // Try to decode JWT to see what's inside
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const decoded = JSON.parse(atob(parts[1]));
            console.log("JWT Payload:", decoded);
          }
        } catch (e) {
          console.error("Failed to decode JWT:", e);
        }
      }
    } catch (e) {
      console.error("Failed to check token:", e);
    }
  }
  console.log("================");
};
