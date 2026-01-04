
import { useEffect, useState } from 'react'
import { Theme } from '../theme'

type Num = number
type Cfg = {
  starDensity: Num; starSpeed: Num; twinkle: Num; starBrightness: Num;
  glassAlpha: Num; glow: Num;
  accent: string;
  colTodo: string; colDoing: string; colDone: string;
  background: 'starfield'|'aurora'|'nebula'|'hex'|'circuit';
}

const defaults: Cfg = {
  starDensity: 1, starSpeed: 1, twinkle: 1, starBrightness: 0.65,
  glassAlpha: 0.45, glow: 12,
  accent: '#00ffff',
  colTodo: '#00eaff', colDoing: '#ff64ff', colDone: '#ffb74d',
  background: 'starfield'
}

function load(): Cfg { try { return { ...defaults, ...(JSON.parse(localStorage.getItem('uiSettings')||'{}')) } } catch { return defaults } }
function save(cfg: Cfg){ Theme.saveSettings(cfg) }

export function SettingsPanel(){
  const [cfg, setCfg] = useState<Cfg>(load())
  useEffect(()=>{ save(cfg) }, [])

  function up<K extends keyof Cfg>(k: K, v: any){ const next = { ...cfg, [k]: v } as Cfg; setCfg(next); save(next) }

  const Row = ({label, children}:{label:string, children:any})=> (
    <div style={{display:'grid', gridTemplateColumns:'220px 1fr', alignItems:'center', gap:12}}>
      <div style={{color:'#8fb', fontSize:12}}>{label}</div>
      <div>{children}</div>
    </div>
  )

  return <div className='card glass neon-border-soft' style={{padding:14}}>
    <div style={{color:'#fa5', marginBottom:8}}>Ajustes visuales (en vivo)</div>
    <div style={{display:'grid', gap:10}}>
      <Row label='Fondo animado'>
        <select value={cfg.background} onChange={e=> up('background', e.target.value as any)}>
          <option value='starfield'>Starfield (espacio)</option>
          <option value='aurora'>Aurora</option>
          <option value='nebula'>Nebulosa</option>
          <option value='hex'>Rejilla hex</option>
          <option value='circuit'>Circuito</option>
        </select>
      </Row>
      <Row label='Color de acento (UI)'>
        <input type='color' value={cfg.accent} onChange={e=> up('accent', e.target.value)} />
      </Row>
      <Row label='Color columna TODO'>
        <input type='color' value={cfg.colTodo} onChange={e=> up('colTodo', e.target.value)} />
      </Row>
      <Row label='Color columna DOING'>
        <input type='color' value={cfg.colDoing} onChange={e=> up('colDoing', e.target.value)} />
      </Row>
      <Row label='Color columna DONE'>
        <input type='color' value={cfg.colDone} onChange={e=> up('colDone', e.target.value)} />
      </Row>
      <Row label='Densidad de estrellas'>
        <input type='range' min={0.3} max={2.0} step={0.05} value={cfg.starDensity} onChange={e=> up('starDensity', Number(e.target.value))} />
      </Row>
      <Row label='Velocidad fondo'>
        <input type='range' min={0.2} max={3.0} step={0.05} value={cfg.starSpeed} onChange={e=> up('starSpeed', Number(e.target.value))} />
      </Row>
      <Row label='Destellos'>
        <input type='range' min={0.2} max={3.0} step={0.05} value={cfg.twinkle} onChange={e=> up('twinkle', Number(e.target.value))} />
      </Row>
      <Row label='Brillo base'>
        <input type='range' min={0.3} max={1.5} step={0.05} value={cfg.starBrightness} onChange={e=> up('starBrightness', Number(e.target.value))} />
      </Row>
      <Row label='Opacidad del glass'>
        <input type='range' min={0.1} max={0.9} step={0.02} value={cfg.glassAlpha} onChange={e=> up('glassAlpha', Number(e.target.value))} />
      </Row>
      <Row label='Fuerza del glow (px)'>
        <input type='range' min={4} max={32} step={1} value={cfg.glow} onChange={e=> up('glow', Number(e.target.value))} />
      </Row>
    </div>
    <div style={{fontSize:11, color:'#89a', marginTop:6}}>Se guardan en este navegador. Recarga si algo se ve raro.</div>
  </div>
}
