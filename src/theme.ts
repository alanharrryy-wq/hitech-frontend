type UiSettings = {
  accent?: string
  glassAlpha?: number
  glassTopbarAlpha?: number
  colTodo?: string
  colDoing?: string
  colDone?: string
  glow?: number
}
function read(): UiSettings { try { return JSON.parse(localStorage.getItem('uiSettings') || '{}') } catch { return {} } }
export const Theme = {
  setCSSVars(){
    const s = read(); const root = document.documentElement
    if (s.accent) root.style.setProperty('--accent', s.accent)
    if (typeof s.glassAlpha === 'number') root.style.setProperty('--glass-alpha', String(s.glassAlpha))
    if (typeof s.glassTopbarAlpha === 'number') root.style.setProperty('--glass-topbar-alpha', String(s.glassTopbarAlpha))
    if (s.colTodo) root.style.setProperty('--col-todo', s.colTodo)
    if (s.colDoing) root.style.setProperty('--col-doing', s.colDoing)
    if (s.colDone) root.style.setProperty('--col-done', s.colDone)
    if (typeof s.glow === 'number') root.style.setProperty('--glow', String(s.glow))
  }
}
