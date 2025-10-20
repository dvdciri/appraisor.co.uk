declare namespace NodeJS {
  interface ProcessEnv {
    OPENAI_API_KEY: string;
    TODOIST_API_KEY: string;
    DATABASE_URL: string;
    STREET_API_KEY: string;
    MAPS_API_KEY: string;
  }
}
