/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;

  // custom flags
  readonly PAGES_DEPLOY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
