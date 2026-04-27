const DEFAULT_SEED_DATE = "2026-04-26";
const seedDatePattern = /^\d{4}-\d{2}-\d{2}$/;

type SeedDateEnv = {
  SEED_DATE?: string;
  [key: string]: string | undefined;
};

export function getSeedDate(env: SeedDateEnv = process.env): string {
  if (!env.SEED_DATE) {
    return DEFAULT_SEED_DATE;
  }

  if (!seedDatePattern.test(env.SEED_DATE)) {
    throw new Error("SEED_DATE must use YYYY-MM-DD format.");
  }

  return env.SEED_DATE;
}
