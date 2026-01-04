
import { useEffect, useState } from 'react'
import { Theme } from '../theme'
import { ThemePresets } from '../modules/ThemePresets'

type Cfg = {
  background: string
  speed: number
  density: number
  intensity: number
  hue: number
  brightness: number
  glassAlpha: number
  glassTopbarAlpha?: number
  glow: number
  accent: string
  colTodo: string; colDoing: string; colDone: string;
}

const defaults: Cfg = {
  background: 'starfield',
  speed: 1, density: 1, intensity: 1, hue: 190, brightness: 0.85,
  glassAlpha: 0.36, glassTopbarAlpha: 0.26,
  glow: 12, accent: '#00ffff',
  colTodo: '#00eaff', colDoing: '#ff64ff', colDone: '#ffb74d',
}

function load(): Cfg { try { return { ...defaults, ...(JSON.parse(localStorage.getItem('uiSettings')||'{}')) } } catch { return defaults } }
function save(cfg: Cfg){ localStorage.setItem('uiSettings', JSON.stringify(cfg)); Theme.setCSSVars(); window.dispatchEvent(new Event('uiSettingsChanged')) }

export function SettingsPanel(){
  const [cfg, setCfg] = useState<Cfg>(load())
  const [preset, setPreset] = useState<string>('')

  useEffect(()=>{ save(cfg) }, [])

  function up<K extends keyof Cfg>(k: K, v: any){ const next = { ...cfg, [k]: v } as Cfg; setCfg(next); save(next) }
  function applyPreset(name: string){
    const p = ThemePresets[name]; if(!p) return
    const next = { ...cfg, ...p }
    setCfg(next); save(next)
  }

  const Row = ({label, children}:{label:string, children:any})=> (
    <div style={{display:'grid', gridTemplateColumns:'220px 1fr', alignItems:'center', gap:12}}>
      <div style={{color:'#8fb', fontSize:12}}>{label}</div>
      <div>{children}</div>
    </div>
  )

  return <div className='card glass neon-border-soft' style={{padding:14}}>
    <div style={{color:'#fa5', marginBottom:8}}>Ajustes visuales (en vivo)</div>
    <div style={{display:'grid', gap:10}}>
      <Row label='Preset de tema'>
        <div style={{display:'flex', gap:8}}>
          <select value={preset} onChange={e=> setPreset(e.target.value)}>
            <option value=''>— Elige —</option>
            <option value='olympus'>Olympus</option>
            <option value='magentaVoid'>Magenta Void</option>
            <option value='emeraldFocus'>Emerald Focus</option>
            <option value='cyanCircuit'>Cyan Circuit</option>
            <option value='halloweenNight'>Halloween Night 🎃</option>
          </select>
          <button onClick={()=> applyPreset(preset)} disabled={!preset}>Aplicar</button>
        </div>
      </Row>

      <Row label='Fondo animado'>
        <select value={cfg.background} onChange={e=> up('background', e.target.value)}>
          <option value='starfield'>Starfield (espacio)</option>
          <option value='neonGrid'>Neon Grid</option>
          <option value='neonTunnel'>Neon Tunnel</option>
          <option value='hexPulse'>Hex Pulse</option>
          <option value='laserRain'>Laser Rain</option>
          <option value='synthwaveSun'>Synthwave Sun</option>
          <option value='dataFlow'>Data Flow</option>
          <option value='holoCircuit'>Holographic Circuit</option>
          <option value='auroraBands'>Aurora Bands</option>
          <option value='particleSwirl'>Particle Swirl</option>
          <option value='halloween'>Halloween Glow 🎃</option>
        </select>
      </Row>

      <Row label='Acento UI'><input type='color' value={cfg.accent} onChange={e=> up('accent', e.target.value)} /></Row>
      <Row label='Hue (matiz del fondo)'><input type='range' min={0} max={360} step={1} value={cfg.hue} onChange={e=> up('hue', Number(e.target.value))} /></Row>
      <Row label='Velocidad (fondo)'><input type='range' min={0.2} max={3.0} step={0.05} value={cfg.speed} onChange={e=> up('speed', Number(e.target.value))} /></Row>
      <Row label='Densidad (partículas/elementos)'><input type='range' min={0.2} max={2.0} step={0.05} value={cfg.density} onChange={e=> up('density', Number(e.target.value))} /></Row>
      <Row label='Brillo (fondo)'><input type='range' min={0.3} max={1.6} step={0.05} value={cfg.brightness} onChange={e=> up('brightness', Number(e.target.value))} /></Row>

      <Row label='Color columna TODO'><input type='color' value={cfg.colTodo} onChange={e=> up('colTodo', e.target.value)} /></Row>
      <Row label='Color columna DOING'><input type='color' value={cfg.colDoing} onChange={e=> up('colDoing', e.target.value)} /></Row>
      <Row label='Color columna DONE'><input type='color' value={cfg.colDone} onChange={e=> up('colDone', e.target.value)} /></Row>

      <Row label='Opacidad glass (paneles)'><input type='range' min={0.10} max={0.90} step={0.02} value={cfg.glassAlpha} onChange={e=> up('glassAlpha', Number(e.target.value))} /></Row>
      <Row label='Opacidad consola/topbar'><input type='range' min={0.10} max={0.90} step={0.02} value={cfg.glassTopbarAlpha ?? 0.26} onChange={e=> up('glassTopbarAlpha', Number(e.target.value))} /></Row>
      <Row label='Fuerza del glow (px)'><input type='range' min={4} max={32} step={1} value={cfg.glow} onChange={e=> up('glow', Number(e.target.value))} /></Row>
    </div>
    <div style={{fontSize:11, color:'#89a', marginTop:6}}>
      Todos los controles afectan a todos los fondos. Los presets te cambian todo en un clic.
    </div>
  </div>
}
