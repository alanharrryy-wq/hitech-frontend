
import { useEffect, useMemo, useRef, useState } from 'react'

function setMode(mode: 'focus'|'panic'|'night'|'default'){
  localStorage.setItem('uiMode', mode)
  const event = new Event('uiModeChanged')
  window.dispatchEvent(event)
}

export function CommandPalette({onClose}:{onClose:()=>void}){
  const [q, setQ] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(()=>{ ref.current?.focus() },[])

  const actions = [
    { id:'modeFocus', label:'Mode: Focus', hint:'Visual', run:()=> setMode('focus') },
    { id:'modePanic', label:'Mode: Panic', hint:'Visual', run:()=> setMode('panic') },
    { id:'modeNight', label:'Mode: Night', hint:'Visual', run:()=> setMode('night') },
    { id:'modeDefault', label:'Mode: Default', hint:'Visual', run:()=> setMode('default') },
    { id:'gotoBoard', label:'Go to: Board', hint:'UI', run:()=> document.getElementById('sec-board')?.scrollIntoView({behavior:'smooth'}) },
  ]
  const filtered = actions.filter(a => (a.label + ' ' + (a.hint||'')).toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <div style={{position:'fixed', inset:0, zIndex:9999, display:'grid', placeItems:'start center', paddingTop:120, background:'rgba(0,0,0,.35)'}} onClick={onClose}>
      <div className="glass neon-border" style={{width:640, maxWidth:'95vw'}} onClick={e=> e.stopPropagation()}>
        <div style={{padding:10, borderBottom:'1px solid rgba(255,255,255,.06)'}}>
          <input ref={ref} value={q} onChange={e=> setQ(e.target.value)} placeholder="Type a command…" style={{width:'100%', background:'transparent', color:'white', border:'none', outline:'none', fontSize:16}}/>
        </div>
        <div style={{maxHeight:360, overflow:'auto'}}>
          {filtered.map((a)=>(
            <div key={a.id} onClick={()=> { a.run(); onClose() }}
                 style={{padding:'10px 12px', display:'flex', justifyContent:'space-between', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,.04)'}}>
              <div>{a.label}</div>
              <div style={{opacity:.6, fontSize:12}}>{a.hint}</div>
            </div>
          ))}
          {filtered.length===0 && <div style={{padding:12, opacity:.6}}>No results</div>}
        </div>
        <div style={{padding:8, opacity:.6, fontSize:12}}>Tips: ⌘K abre/cierra · Escribe para filtrar</div>
      </div>
    </div>
  )
}
