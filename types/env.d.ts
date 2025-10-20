declare namespace NodeJS {
  interface ProcessEnv {
    OPENAI_API_KEY: string;
    DATABASE_URL: string;
    STREET_API_KEY: string;
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string;
  }
}
