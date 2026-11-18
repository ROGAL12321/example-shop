import { neon } from "@neondatabase/serverless";

export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Brak DATABASE_URL. Skonfiguruj zmienną środowiskową zgodnie z README.");
  }
  return neon(connectionString);
}
