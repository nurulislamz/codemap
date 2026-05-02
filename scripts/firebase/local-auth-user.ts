import { existsSync, readFileSync } from "node:fs";

const defaultEmail = "local-owner@codemap.dev";
const defaultPassword = "local-owner-password";
const initialEnvKeys = new Set(Object.keys(process.env));

type AuthResponse = {
  localId?: string;
  email?: string;
  idToken?: string;
  refreshToken?: string;
  error?: {
    message?: string;
  };
};

async function main() {
  loadEnvFile(".env.local", { overrideLoadedValues: false });
  loadEnvFile(".env.development.local", { overrideLoadedValues: true });

  const email = process.env.LOCAL_DEV_AUTH_EMAIL || defaultEmail;
  const password = process.env.LOCAL_DEV_AUTH_PASSWORD || defaultPassword;
  const authHost = normalizeAuthHost(
    process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099",
  );
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo";
  const baseUrl = `http://${authHost}/identitytoolkit.googleapis.com/v1`;

  const result = await createOrSignInLocalUser({ baseUrl, apiKey, email, password });

  console.log(`Firebase auth emulator user ready`);
  console.log(`email: ${result.email ?? email}`);
  console.log(`uid: ${result.localId}`);
  console.log(`idToken: ${result.idToken}`);
}

async function createOrSignInLocalUser(input: {
  baseUrl: string;
  apiKey: string;
  email: string;
  password: string;
}) {
  const signUp = await postAuth(`${input.baseUrl}/accounts:signUp?key=${input.apiKey}`, {
    email: input.email,
    password: input.password,
    returnSecureToken: true,
  });

  if (!signUp.error) {
    return signUp;
  }

  if (signUp.error.message !== "EMAIL_EXISTS") {
    throw new Error(`Could not create local auth user: ${signUp.error.message ?? "unknown error"}`);
  }

  const signIn = await postAuth(
    `${input.baseUrl}/accounts:signInWithPassword?key=${input.apiKey}`,
    {
      email: input.email,
      password: input.password,
      returnSecureToken: true,
    },
  );

  if (signIn.error) {
    throw new Error(`Could not sign in local auth user: ${signIn.error.message ?? "unknown error"}`);
  }

  return signIn;
}

async function postAuth(url: string, body: object): Promise<AuthResponse> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(
      `Could not reach Firebase auth emulator. Start it with \`corepack pnpm firebase:emulators\`. ${
        error instanceof Error ? error.message : ""
      }`,
    );
  }

  return response.json() as Promise<AuthResponse>;
}

function normalizeAuthHost(host: string) {
  return host.replace(/^https?:\/\//, "");
}

function loadEnvFile(path: string, options: { overrideLoadedValues: boolean }) {
  if (!existsSync(path)) {
    return;
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = normalizeEnvValue(trimmed.slice(separatorIndex + 1).trim());

    if (!key || initialEnvKeys.has(key)) {
      continue;
    }

    if (options.overrideLoadedValues || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function normalizeEnvValue(value: string) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
