// API Keys Configuration
// For Google Places API, enable "Places API" in your Google Cloud Console
// Use your existing Firebase API key or create a separate one with Places API enabled

export const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? "";

// Groq AI API key (used for post caption/description suggestions)
export const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? "";

// Note: Make sure to enable the following APIs in Google Cloud Console:
// 1. Places API
// 2. Maps JavaScript API (optional, for web)
// 3. Geocoding API (optional, for reverse geocoding)
