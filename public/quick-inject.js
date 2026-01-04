// Inject CSS vars early if uiSettings exists
try {
  const s = JSON.parse(localStorage.getItem('uiSettings') || '{}')
  const root = document.documentElement
  if (s.accent) root.style.setProperty('--accent', s.accent)
  if (typeof s.glow === 'number') root.style.setProperty('--glow', s.glow + 'px')
  if (s.colTodo) root.style.setProperty('--col-todo', s.colTodo)
  if (s.colDoing) root.style.setProperty('--col-doing', s.colDoing)
  if (s.colDone) root.style.setProperty('--col-done', s.colDone)
} catch {}
