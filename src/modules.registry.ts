export type ModuleKind = 'web' | 'desktop';
export interface ModuleDef {
  id: string;
  name: string;
  type: ModuleKind;
  route?: string | null;
  statusUrl?: string | null;
  accent?: string;
  url?: string | null;
  healthUrl?: string | null;
  color?: string;
  demoUrl?: string | null;
  description?: string;
  renderMode?: 'iframe' | 'tab';
}
export async function loadRegistry(): Promise<ModuleDef[]> {
  try{
    const res = await fetch(`${import.meta.env.BASE_URL}modules.config.json`, { cache:'no-store' });
    if(!res.ok) throw new Error('modules.config.json not found');
    const raw = await res.json();
    const list = Array.isArray(raw) ? raw : (raw?.modules || []);
    return (list || []).map((m: ModuleDef) => ({
      ...m,
      statusUrl: m.statusUrl ?? m.healthUrl ?? null,
      accent: m.accent ?? m.color,
      url: m.url ?? null,
      demoUrl: m.demoUrl ?? null,
      description: m.description ?? '',
      renderMode: m.renderMode ?? 'iframe',
    }));
  }catch(e){
    console.warn('Module registry missing', e);
    return [];
  }
}
