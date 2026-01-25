export const env = {
  // API Configuration
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",

  // Feature flags
  DEBUG_MODE: import.meta.env.DEV,
};
