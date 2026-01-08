export type ModuleKind = 'web' | 'desktop';

export interface ModuleDef {
  id: string;
  name: string;
  type: ModuleKind;

  // routing
  route?: string | null;

  // endpoints
  url?: string | null;
  demoUrl?: string | null;
  healthUrl?: string | null;
  statusUrl?: string | null;

  // UI / metadata
  description?: string;
  color?: string;
  accent?: string;
  renderMode?: 'iframe' | 'tab';
}

/**
 * Loads modules from public/modules.config.json (GitHub Project Pages safe).
 * - Uses BASE_URL so it works under /hitech-frontend/
 * - Accepts either { modules: [...] } or a raw array [...]
 * - Normalizes optional fields
 */
export async function loadRegistry(options?: { strict?: boolean }): Promise<ModuleDef[]> {
  try {
    const url = `${import.meta.env.BASE_URL}modules.config.json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('modules.config.json not found');

    const raw = await res.json();
    const list: ModuleDef[] = Array.isArray(raw) ? raw : (raw?.modules || []);

    return (list || []).map((m) => ({
      ...m,
      statusUrl: m.statusUrl ?? m.healthUrl ?? null,
      accent: m.accent ?? m.color ?? m.accent,
      url: m.url ?? null,
      demoUrl: m.demoUrl ?? null,
      description: m.description ?? '',
      renderMode: m.renderMode ?? 'iframe',
      route: m.route ?? null,
    }));
  } catch (e) {
    console.warn('Module registry missing', e);
    if (options?.strict) throw e;
    return [];
  }
}
