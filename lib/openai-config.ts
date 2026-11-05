import OpenAI from "openai";

// Cache settings to avoid repeated Firebase reads
let cachedSettings: import("@/lib/schema").PlatformSettingsDoc | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Get all platform settings from Firebase (cached)
 * Uses dynamic import to avoid issues with Firebase in API routes
 */
async function getSettings(): Promise<import("@/lib/schema").PlatformSettingsDoc | null> {
  // Check cache first
  if (cachedSettings && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    // Dynamic import to handle server-side properly
    const { db } = await import("@/lib/firebase");
    const { doc, getDoc } = await import("firebase/firestore");
    const { COLLECTIONS } = await import("@/lib/schema");
    
    if (db) {
      const docRef = doc(db, COLLECTIONS.PLATFORM_SETTINGS, "global");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        cachedSettings = docSnap.data() as import("@/lib/schema").PlatformSettingsDoc;
        cacheTimestamp = Date.now();
        return cachedSettings;
      }
    }
  } catch {
    // Silently fail - will use env vars as fallback
    console.log("Firebase settings not available, using environment variables");
  }

  return null;
}

/**
 * Get OpenAI API key from environment variable (primary for API routes) or Firebase settings (fallback)
 * In API routes, env vars are more reliable. Firebase settings are for client-side configuration.
 */
export async function getOpenAIApiKey(): Promise<string | null> {
  // Primary for API routes: Environment variable (most reliable in server context)
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  // Fallback: Try Firebase settings
  try {
    const settings = await getSettings();
    if (settings?.llmConfig?.apiKey) {
      return settings.llmConfig.apiKey;
    }
  } catch {
    // Ignore Firebase errors
  }

  return null;
}

/**
 * Get Apollo API key from Firebase settings
 */
export async function getApolloApiKey(): Promise<{ apiKey: string; accountId?: string } | null> {
  const settings = await getSettings();
  
  if (settings?.integrations?.apollo?.apiKey) {
    return {
      apiKey: settings.integrations.apollo.apiKey,
      accountId: settings.integrations.apollo.accountId,
    };
  }

  // Fallback: Environment variable
  if (process.env.APOLLO_API_KEY) {
    return {
      apiKey: process.env.APOLLO_API_KEY,
      accountId: process.env.APOLLO_ACCOUNT_ID,
    };
  }

  return null;
}

/**
 * Get GoHighLevel API key from Firebase settings
 */
export async function getGoHighLevelApiKey(): Promise<{ apiKey: string; locationId?: string; agencyId?: string } | null> {
  const settings = await getSettings();
  
  if (settings?.integrations?.gohighlevel?.apiKey) {
    return {
      apiKey: settings.integrations.gohighlevel.apiKey,
      locationId: settings.integrations.gohighlevel.locationId,
      agencyId: settings.integrations.gohighlevel.agencyId,
    };
  }

  // Fallback: Environment variable
  if (process.env.GOHIGHLEVEL_API_KEY) {
    return {
      apiKey: process.env.GOHIGHLEVEL_API_KEY,
      locationId: process.env.GOHIGHLEVEL_LOCATION_ID,
      agencyId: process.env.GOHIGHLEVEL_AGENCY_ID,
    };
  }

  return null;
}

/**
 * Get Mattermost config from Firebase settings
 */
export async function getMattermostConfig(): Promise<{ apiKey: string; webhookUrl?: string; serverUrl?: string; teamId?: string } | null> {
  const settings = await getSettings();
  
  if (settings?.integrations?.mattermost?.apiKey) {
    return {
      apiKey: settings.integrations.mattermost.apiKey,
      webhookUrl: settings.integrations.mattermost.webhookUrl,
      serverUrl: settings.integrations.mattermost.serverUrl,
      teamId: settings.integrations.mattermost.teamId,
    };
  }

  // Fallback: Environment variables
  if (process.env.MATTERMOST_TOKEN) {
    return {
      apiKey: process.env.MATTERMOST_TOKEN,
      webhookUrl: process.env.MATTERMOST_WEBHOOK_URL,
      serverUrl: process.env.MATTERMOST_SERVER_URL,
      teamId: process.env.MATTERMOST_TEAM_ID,
    };
  }

  return null;
}

/**
 * Get Zoom config from Firebase settings
 */
export async function getZoomConfig(): Promise<{ apiKey: string; apiSecret?: string; accountId?: string } | null> {
  const settings = await getSettings();
  
  if (settings?.integrations?.zoom?.apiKey) {
    return {
      apiKey: settings.integrations.zoom.apiKey,
      apiSecret: settings.integrations.zoom.apiSecret,
      accountId: settings.integrations.zoom.accountId,
    };
  }

  // Fallback: Environment variables
  if (process.env.ZOOM_API_KEY) {
    return {
      apiKey: process.env.ZOOM_API_KEY,
      apiSecret: process.env.ZOOM_API_SECRET,
      accountId: process.env.ZOOM_ACCOUNT_ID,
    };
  }

  return null;
}

/**
 * Get LinkedIn config from Firebase settings
 */
export async function getLinkedInConfig(): Promise<{ accessToken: string; clientId?: string; clientSecret?: string; organizationId?: string } | null> {
  const settings = await getSettings();
  
  if (settings?.integrations?.linkedin?.apiKey) {
    return {
      accessToken: settings.integrations.linkedin.apiKey,
      clientId: settings.integrations.linkedin.clientId,
      clientSecret: settings.integrations.linkedin.clientSecret,
      organizationId: settings.integrations.linkedin.organizationId,
    };
  }

  // Fallback: Environment variables
  if (process.env.LINKEDIN_ACCESS_TOKEN) {
    return {
      accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      organizationId: process.env.LINKEDIN_ORGANIZATION_ID,
    };
  }

  return null;
}

/**
 * Create an OpenAI client with the configured API key
 */
export async function createOpenAIClient(): Promise<OpenAI | null> {
  try {
    const apiKey = await getOpenAIApiKey();
    
    if (!apiKey) {
      console.log("No OpenAI API key found");
      return null;
    }

    return new OpenAI({ apiKey });
  } catch (error) {
    console.error("Error creating OpenAI client:", error);
    return null;
  }
}

/**
 * Clear the cached settings (call this when settings are updated)
 */
export function clearSettingsCache(): void {
  cachedSettings = null;
  cacheTimestamp = 0;
}
