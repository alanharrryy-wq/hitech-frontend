
import React, { useEffect, useState } from 'react'
import '../styles.css'
import { BackgroundV4 } from '../modules/BackgroundsV4'
import { SettingsPanel } from '../modules/SettingsV4'
import { TasksDemo } from '../modules/Tasks'
import { Theme } from '../theme'
import { CommandPalette } from '../commands/CommandPalette'
import { useHotkeys } from '../hooks/useHotkeys'

function applyMode(mode: string){
  document.body.dataset.mode = mode
  const s = (():any=>{ try { return JSON.parse(localStorage.getItem('uiSettings')||'{}') } catch { return {} } })()
  const acc = s.accent || '#00ffff'
  if (mode==='night') document.documentElement.style.setProperty('--accent', '#7fbcff')
  else if (mode==='panic') document.documentElement.style.setProperty('--accent', '#ff4d4d')
  else if (mode==='focus') document.documentElement.style.setProperty('--accent', '#61ffa8')
  else document.documentElement.style.setProperty('--accent', acc)
  if (s.glassAlpha) document.documentElement.style.setProperty('--glass-alpha', String(s.glassAlpha))
  if (s.glassTopbarAlpha) document.documentElement.style.setProperty('--glass-topbar-alpha', String(s.glassTopbarAlpha))
}

export function App(){
  const [showCmd, setShowCmd] = useState(false)
  const [mode, setMode] = useState(localStorage.getItem('uiMode') || 'default')

  useEffect(()=>{ Theme.setCSSVars(); applyMode(mode) },[])
  useEffect(()=>{
    const onMode = ()=> { const m = localStorage.getItem('uiMode') || 'default'; setMode(m); applyMode(m); Theme.setCSSVars() }
    window.addEventListener('uiModeChanged', onMode as EventListener)
    window.addEventListener('uiSettingsChanged', onMode as EventListener)
    return ()=> { window.removeEventListener('uiModeChanged', onMode as EventListener); window.removeEventListener('uiSettingsChanged', onMode as EventListener) }
  }, [])

  useHotkeys({
    'mod+k': ()=> setShowCmd(v=> !v),
    'g': ()=> document.getElementById('sec-board')?.scrollIntoView({behavior:'smooth'}),
  })

  return <>
    <BackgroundV4 />
    <div className="topbar glass neon-border" style={{display:'flex', justifyContent:'space-between'}}>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <div style={{width:10, height:10, borderRadius:99, background:'var(--accent)'}} />
        <div style={{fontWeight:700, letterSpacing:'.06em'}}>ARES PANEL — Neon Mode</div>
      </div>
      <div style={{opacity:.8}}>
        <span style={{opacity:.8, fontSize:12}}>Mode: {mode}</span>
      </div>
    </div>
    <div style={{position:'relative', zIndex:2, maxWidth:1200, margin:'0 auto', padding:'96px 24px 24px'}} id="sec-board">
      <div className="card glass neon-border-soft" style={{marginBottom:16}}>
        <SettingsPanel />
      </div>
      <TasksDemo />
    </div>
    {showCmd && <CommandPalette onClose={()=> setShowCmd(false)} />}
  </>
}
