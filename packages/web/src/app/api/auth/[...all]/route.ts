import { createAuth } from "@privyloop/core/auth";

// Validate required environment variables
const requiredEnvVars = ['BETTER_AUTH_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Validate OAuth provider configurations (both ID and SECRET required for each)
const oauthProviders = [
  { name: 'GitHub', id: 'GITHUB_CLIENT_ID', secret: 'GITHUB_CLIENT_SECRET' },
  { name: 'Google', id: 'GOOGLE_CLIENT_ID', secret: 'GOOGLE_CLIENT_SECRET' },
  { name: 'Microsoft', id: 'MICROSOFT_CLIENT_ID', secret: 'MICROSOFT_CLIENT_SECRET' },
];

for (const provider of oauthProviders) {
  const hasId = !!process.env[provider.id];
  const hasSecret = !!process.env[provider.secret];
  
  if (hasId && !hasSecret) {
    throw new Error(`${provider.name} OAuth: ${provider.id} provided but ${provider.secret} is missing`);
  }
  if (!hasId && hasSecret) {
    throw new Error(`${provider.name} OAuth: ${provider.secret} provided but ${provider.id} is missing`);
  }
}

// Create auth instance with environment variables from web package
const auth = createAuth({
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  OAUTH_REDIRECT_BASE_URL: process.env.OAUTH_REDIRECT_BASE_URL,
});

export const POST = auth.handler;
export const GET = auth.handler;