
type T = { id: string; title: string; progress: number; state: 'todo'|'doing'|'done' }
const demo: T[] = [
  { id:'t1', title:'Wire Kanban & Commands', progress: 20, state:'todo' },
  { id:'t2', title:'Agents panel neon', progress: 55, state:'doing' },
  { id:'t3', title:'Audit log & export', progress: 100, state:'done' },
  { id:'t4', title:'Background selector', progress: 85, state:'doing' },
  { id:'t5', title:'Per-column glow', progress: 45, state:'todo' },
]

function gradient(c:string){
  // create two tones for the same color (a little lighter and darker)
  return { a: c, b: c }
}

export function TasksDemo(){
  const cols: T['state'][] = ['todo','doing','done']
  const by = (s: T['state']) => demo.filter(t=> t.state===s)

  const colColor = (s: T['state']) => getComputedStyle(document.documentElement)
    .getPropertyValue(s==='todo' ? '--col-todo' : s==='doing' ? '--col-doing' : '--col-done').trim() || '#0ff'

  return <div className="grid">
    {cols.map(s=>{
      const color = colColor(s)
      const {a,b} = gradient(color)
      const title = s==='todo' ? 'TODO' : s==='doing' ? 'DOING' : 'DONE'
      return <div className="column" key={s}>
        <div className="col-title">{title}</div>
        <div className="card glass neon-border-soft" style={{ ['--accent' as any]: color }}>
          <div className="column">
            {by(s).map(t => (
              <div className="task" key={t.id}>
                <div className="task-title">{t.title}</div>
                <div className="task-meta"><span className="badge">{t.progress}%</span></div>
                <div className="progress-outer">
                  <div className="progress-inner" style={{width: `${t.progress}%`, ['--barA' as any]: a, ['--barB' as any]: b }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    })}
  </div>
}
