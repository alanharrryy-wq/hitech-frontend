
import { useEffect, useRef, useState } from 'react'

function getUiSettings(){
  try { return JSON.parse(localStorage.getItem('uiSettings') || '{}') } catch { return {} }
}

export function Starfield(){
  const ref = useRef<HTMLCanvasElement>(null)
  const [cfg, setCfg] = useState<any>(getUiSettings())

  useEffect(()=>{
    const onCfg = ()=> setCfg(getUiSettings())
    window.addEventListener('uiSettingsChanged', onCfg as EventListener)
    window.addEventListener('storage', onCfg as EventListener)
    return ()=> { window.removeEventListener('uiSettingsChanged', onCfg as EventListener); window.removeEventListener('storage', onCfg as EventListener) }
  }, [])

  useEffect(()=>{
    const cvs = ref.current!
    const ctx = cvs.getContext('2d')!
    let raf = 0
    let W = (cvs.width = window.innerWidth)
    let H = (cvs.height = window.innerHeight)
    const DPR = Math.min(2, window.devicePixelRatio || 1)
    cvs.width = W * DPR; cvs.height = H * DPR; ctx.scale(DPR, DPR)

    const density = Number(cfg.starDensity ?? 1)
    const speed = Number(cfg.starSpeed ?? 1)
    const twinkle = Number(cfg.twinkle ?? 1)
    const bright = Number(cfg.starBrightness ?? 0.65)

    const COUNT = Math.max(30, Math.round((W*H) / 25000 * density))
    const stars = new Array(COUNT).fill(0).map(()=> ({
      x: Math.random()*W, y: Math.random()*H, z: 0.2 + Math.random()*0.8, b: 0.2 + Math.random()*0.5, t: Math.random()*Math.PI*2
    }))

    function loop(){
      ctx.clearRect(0,0,W,H)
      ctx.fillStyle = `rgba(3,6,12,${0.5 + (bright-0.65)})`
      ctx.fillRect(0,0,W,H)
      for(const s of stars){
        s.x += 0.02 * (1.2 - s.z) * speed
        if (s.x > W+10) s.x = -10
        s.t += (0.02 + Math.random()*0.01) * twinkle
        const tw = 0.3 + Math.sin(s.t)*0.3
        const a = Math.max(0, Math.min(0.8, s.b + tw*0.4)) * bright
        ctx.beginPath()
        ctx.fillStyle = `rgba(200,255,255,${a})`
        ctx.arc(s.x, s.y, s.z*1.2, 0, Math.PI*2)
        ctx.fill()
        if(Math.random() < 0.002 * twinkle){
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 12*s.z)
          g.addColorStop(0, 'rgba(0,255,255,0.4)')
          g.addColorStop(1, 'rgba(0,255,255,0)')
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(s.x, s.y, 12*s.z, 0, Math.PI*2); ctx.fill()
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const onResize = ()=> { W = window.innerWidth; H = window.innerHeight; cvs.width = W*DPR; cvs.height = H*DPR; ctx.scale(DPR,DPR) }
    window.addEventListener('resize', onResize)
    return ()=> { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [cfg])

  return <canvas ref={ref} style={{position:'fixed', inset:0, zIndex:0, pointerEvents:'none', filter:'brightness(0.65)'}} />
}
