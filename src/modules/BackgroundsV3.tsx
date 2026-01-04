
import { useEffect, useRef, useState } from 'react'

type Cfg = {
  background: string
  speed: number
  density: number
  intensity: number
  hue: number
  brightness: number
}

function getCfg(): Cfg { try { return JSON.parse(localStorage.getItem('uiSettings') || '{}') } catch { return {} as any } }
function clamp(n:number, a:number, b:number){ return Math.max(a, Math.min(b, n)) }

export function BackgroundV3(){
  const [cfg, setCfg] = useState<Cfg>(getCfg())
  useEffect(()=>{
    const on = ()=> setCfg(getCfg())
    window.addEventListener('uiSettingsChanged', on as EventListener)
    window.addEventListener('storage', on as EventListener)
    return ()=> { window.removeEventListener('uiSettingsChanged', on as EventListener); window.removeEventListener('storage', on as EventListener) }
  }, [])

  const type = (cfg.background || 'starfield') as string
  const map: Record<string, JSX.Element> = {
    starfield: <Starfield cfg={cfg}/>,
    neonGrid: <NeonGrid cfg={cfg}/>,
    neonTunnel: <NeonTunnel cfg={cfg}/>,
    hexPulse: <HexPulse cfg={cfg}/>,
    laserRain: <LaserRain cfg={cfg}/>,
    synthwaveSun: <SynthwaveSun cfg={cfg}/>,
    dataFlow: <DataFlow cfg={cfg}/>,
    holoCircuit: <HoloCircuit cfg={cfg}/>,
    auroraBands: <AuroraBands cfg={cfg}/>,
    particleSwirl: <ParticleSwirl cfg={cfg}/>,
    halloween: <HalloweenClear cfg={cfg}/>,
  }
  return map[type] || map['starfield']
}

function useCanvas(draw:(ctx:CanvasRenderingContext2D,W:number,H:number)=>()=>void, deps:any[]){
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const cvs = ref.current!, ctx = cvs.getContext('2d')!
    let DPR = Math.min(2, window.devicePixelRatio || 1)
    cvs.width = innerWidth*DPR; cvs.height = innerHeight*DPR
    cvs.style.width = innerWidth+'px'; cvs.style.height = innerHeight+'px'
    ctx.scale(DPR, DPR)
    const cleanup = draw(ctx, innerWidth, innerHeight)
    const onR = ()=>{ DPR = Math.min(2, window.devicePixelRatio || 1); cvs.width = innerWidth*DPR; cvs.height = innerHeight*DPR; cvs.style.width = innerWidth+'px'; cvs.style.height = innerHeight+'px'; ctx.setTransform(1,0,0,1,0,0); ctx.scale(DPR,DPR) }
    addEventListener('resize', onR)
    return ()=> { cleanup && cleanup(); removeEventListener('resize', onR) }
  }, deps)
  return ref
}

/* 1) Starfield (pulido) */
function Starfield({cfg}:{cfg:Cfg}){
  const ref = useCanvas((ctx,W,H)=>{
    const density = clamp(cfg.density??1, 0.2, 3)
    const speed = clamp(cfg.speed??1, 0.1, 4)
    const bright = clamp(cfg.brightness??0.8, 0.2, 1.6)
    const count = Math.max(60, Math.round((W*H)/20000 * density))
    const stars = new Array(count).fill(0).map(()=>({ x:Math.random()*W, y:Math.random()*H, r: 0.6+Math.random()*1.4, t: Math.random()*6 }))
    let raf=0
    function loop(){
      ctx.fillStyle = `rgba(3,6,12,${0.55 + (1-bright)*0.25})`; ctx.fillRect(0,0,W,H)
      for(const s of stars){
        s.x += (0.4 + s.r*0.06) * speed; if (s.x>W+10) s.x=-10
        s.t += 0.02*speed
        const tw = 0.2 + Math.sin(s.t)*0.2
        const a = clamp(0.35 + tw, 0, 0.9) * (0.6 + s.r*0.3) * (bright*0.9)
        ctx.beginPath(); ctx.fillStyle = `rgba(200,255,255,${a})`; ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill()
        if (Math.random() < 0.0015*speed){
          const g = ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,12)
          g.addColorStop(0,'rgba(0,255,255,0.4)'); g.addColorStop(1,'rgba(0,255,255,0)')
          ctx.fillStyle=g; ctx.beginPath(); ctx.arc(s.x,s.y,12,0,Math.PI*2); ctx.fill()
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return ()=> cancelAnimationFrame(raf)
  }, [cfg.background, cfg.speed, cfg.density, cfg.brightness])
  return <canvas ref={ref} style={{position:'fixed', inset:0, zIndex:0, pointerEvents:'none'}}/>
}

/* 2) Neon Grid (más vivo) */
function NeonGrid({cfg}:{cfg:Cfg}){
  const ref = useCanvas((ctx,W,H)=>{
    const speed = clamp(cfg.speed??1, 0.2, 3)
    const hue = cfg.hue ?? 190
    let t = 0, raf=0
    function loop(){
      ctx.fillStyle='rgba(6,10,18,0.78)'; ctx.fillRect(0,0,W,H)
      const size = 46
      t += 0.015*speed
      for(let y=H*0.55; y<H; y+=size){
        const o = Math.sin(t+y*0.02)*30
        const alpha = 0.10 + Math.cos(t*0.7+y*0.01)*0.05
        ctx.strokeStyle = `hsla(${hue},100%,60%,${alpha})`; ctx.lineWidth = 1
        ctx.beginPath()
        for(let x=-120; x<W+120; x+=size){
          ctx.moveTo(x+o,y); ctx.lineTo(x+size+o,y)
        }
        ctx.stroke()
      }
      raf=requestAnimationFrame(loop)
    }
    raf=requestAnimationFrame(loop)
    return ()=> cancelAnimationFrame(raf)
  }, [cfg.background, cfg.speed, cfg.hue])
  return <canvas ref={ref} style={{position:'fixed', inset:0, zIndex:0, pointerEvents:'none'}}/>
}

/* 3) Neon Tunnel */
function NeonTunnel({cfg}:{cfg:Cfg}){
  const ref = useCanvas((ctx,W,H)=>{
    const speed=clamp(cfg.speed??1, 0.2, 3), hue=cfg.hue??200
    let t=0, raf=0
    function loop(){
      ctx.fillStyle='rgba(5,8,14,0.86)'; ctx.fillRect(0,0,W,H)
      ctx.save(); ctx.translate(W/2,H/2)
      for(let i=0;i<28;i++){
        const r=(i*26 + (t*120)%26)
        ctx.strokeStyle=`hsla(${hue+i*3},100%,60%,${0.10+i*0.004})`
        ctx.lineWidth=2
        ctx.beginPath()
        for(let a=0;a<Math.PI*2;a+=Math.PI/3){
          const x=Math.cos(a)*r, y=Math.sin(a)*r*0.62
          if(a===0) ctx.moveTo(x,y); else ctx.lineTo(x,y)
        }
        ctx.closePath(); ctx.stroke()
      }
      ctx.restore()
      t+=0.015*speed; raf=requestAnimationFrame(loop)
    }
    raf=requestAnimationFrame(loop); return ()=> cancelAnimationFrame(raf)
  }, [cfg.background, cfg.speed, cfg.hue])
  return <canvas ref={ref} style={{position:'fixed', inset:0, zIndex:0, pointerEvents:'none'}}/>
}

/* 4) Hex Pulse */
function HexPulse({cfg}:{cfg:Cfg}){
  const ref = useCanvas((ctx,W,H)=>{
    const speed=clamp(cfg.speed??1,0.2,3), hue=cfg.hue??185
    let t=0, raf=0
    function loop(){
      ctx.fillStyle='rgba(6,10,18,0.82)'; ctx.fillRect(0,0,W,H)
      const size=30, h=Math.sin(Math.PI/3)*size
      t+=0.02*speed
      for(let y=-h*2; y<H+h*2; y+=h){
        for(let x=-size*2; x<W+size*2; x+=size*3){
          const x0=x+((Math.floor(y/h)%2)*1.5*size)
          const pulse=0.18+Math.sin(t+(x+y)*0.01)*0.18
          ctx.strokeStyle=`hsla(${hue},100%,60%,${0.08+pulse})`
          ctx.lineWidth=1.1
          ctx.beginPath()
          for(let i=0;i<6;i++){
            const a=Math.PI/3*i, px=x0+size*Math.cos(a), py=y+size*Math.sin(a)
            if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py)
          }
          ctx.closePath(); ctx.stroke()
        }
      }
      raf=requestAnimationFrame(loop)
    }
    raf=requestAnimationFrame(loop); return ()=> cancelAnimationFrame(raf)
  }, [cfg.background, cfg.speed, cfg.hue])
  return <canvas ref={ref} style={{position:'fixed', inset:0, zIndex:0, pointerEvents:'none'}}/>
}

/* 5) Laser Rain */
function LaserRain({cfg}:{cfg:Cfg}){
  const ref = useCanvas((ctx,W,H)=>{
    const speed=clamp(cfg.speed??1,0.2,3), hue=cfg.hue??190
    let raf=0
    const N=140, drops=new Array(N).fill(0).map(()=>({x:Math.random()*W, y:Math.random()*H, v:2+Math.random()*7, len: 10+Math.random()*22}))
    function loop(){
      ctx.fillStyle='rgba(4,8,14,0.86)'; ctx.fillRect(0,0,W,H)
      ctx.strokeStyle=`hsla(${hue},100%,60%,0.26)`; ctx.lineWidth=1
      for(const d of drops){
        ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(d.x,d.y+d.len); ctx.stroke()
        d.y += d.v*speed*1.2; if(d.y>H) { d.y=-30; d.x=Math.random()*W }
      }
      raf=requestAnimationFrame(loop)
    }
    raf=requestAnimationFrame(loop); return ()=> cancelAnimationFrame(raf)
  }, [cfg.background, cfg.speed, cfg.hue])
  return <canvas ref={ref} style={{position:'fixed', inset:0, zIndex:0, pointerEvents:'none'}}/>
}

/* 6) Synthwave Sun */
function SynthwaveSun({cfg}:{cfg:Cfg}){
  const ref = useCanvas((ctx,W,H)=>{
    const speed=clamp(cfg.speed??1,0.2,3)
    let t=0, raf=0
    function loop(){
      ctx.fillStyle='rgba(5,8,14,0.92)'; ctx.fillRect(0,0,W,H)
      const cx=W/2, cy=H*0.62, r=120
      const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r*1.4)
      g.addColorStop(0,'rgba(255,180,90,0.35)'); g.addColorStop(1,'rgba(255,0,128,0.06)')
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill()
      ctx.strokeStyle='rgba(255,200,120,0.28)'; ctx.lineWidth=2
      for(let i=0;i<22;i++){ const y=cy-r+i*(r*2/22)+Math.sin(t+i)*2; ctx.beginPath(); ctx.moveTo(cx-r*1.2,y); ctx.lineTo(cx+r*1.2,y); ctx.stroke() }
      t+=0.02*speed; raf=requestAnimationFrame(loop)
    }
    raf=requestAnimationFrame(loop); return ()=> cancelAnimationFrame(raf)
  }, [cfg.background, cfg.speed])
  return <canvas ref={ref} style={{position:'fixed', inset:0, zIndex:0, pointerEvents:'none'}}/>
}

/* 7) Data Flow */
function DataFlow({cfg}:{cfg:Cfg}){
  const ref = useCanvas((ctx,W,H)=>{
    const speed=clamp(cfg.speed??1,0.2,3), hue=cfg.hue??175
    let t=0, raf=0
    const lines=new Array(48).fill(0).map(()=>({ y:Math.random()*H, a:0.2+Math.random()*0.7, w:120+Math.random()*420 }))
    function loop(){
      ctx.fillStyle='rgba(5,8,12,0.92)'; ctx.fillRect(0,0,W,H)
      for(const L of lines){
        const x=(t*220+L.y)%(W+L.w)-L.w
        const g=ctx.createLinearGradient(x,L.y,x+L.w,L.y)
        g.addColorStop(0,`hsla(${hue},100%,60%,0)`)
        g.addColorStop(0.2,`hsla(${hue},100%,60%,${0.25*L.a})`)
        g.addColorStop(0.8,`hsla(${hue+30},100%,60%,${0.25*L.a})`)
        g.addColorStop(1,`hsla(${hue},100%,60%,0)`)
        ctx.fillStyle=g; ctx.fillRect(x,L.y-1,L.w,2)
      }
      t+=0.01*speed; raf=requestAnimationFrame(loop)
    }
    raf=requestAnimationFrame(loop); return ()=> cancelAnimationFrame(raf)
  }, [cfg.background, cfg.speed, cfg.hue])
  return <canvas ref={ref} style={{position:'fixed', inset:0, zIndex:0, pointerEvents:'none'}}/>
}

/* 8) Holographic Circuit (SVG) */
function HoloCircuit({cfg}:{cfg:Cfg}){
  const hue=cfg.hue??190, speed=clamp(cfg.speed??1,0.2,3), dash=120/speed
  return (
    <svg style={{position:'fixed', inset:0, zIndex:0, pointerEvents:'none', opacity:0.42, filter:'brightness(0.95)'}}>
      <defs>
        <linearGradient id="cg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsl(${hue},100%,60%)`} stopOpacity="0.28" />
          <stop offset="100%" stopColor={`hsl(${hue+40},100%,60%)`} stopOpacity="0.20" />
        </linearGradient>
      </defs>
      {[...Array(46)].map((_,i)=>{
        const y=(i*2.2+12)+'%', width=(i%3?1:2), dur=9+(i%5)
        return <line key={i} x1="0%" y1={y} x2="100%" y2={y} stroke="url(#cg2)" strokeWidth={width}>
          <animate attributeName="stroke-dasharray" values={`0,${dash}; ${dash},0; 0,${dash}`} dur={`${dur/speed}s`} repeatCount="indefinite" />
        </line>
      })}
    </svg>
  )
}

/* 9) Aurora Bands */
function AuroraBands({cfg}:{cfg:Cfg}){
  const ref = useCanvas((ctx,W,H)=>{
    const speed=clamp(cfg.speed??1,0.2,3), hue=cfg.hue??200
    let t=0, raf=0
    function band(off:number, amp:number, alpha:number){
      ctx.beginPath(); ctx.moveTo(0,H*0.6+Math.sin(t*0.7+off)*amp)
      for(let x=0;x<=W;x+=10){ const y=H*0.6+Math.sin((x*0.004)+(t*0.6+off))*amp; ctx.lineTo(x,y) }
      ctx.strokeStyle=`hsla(${hue+off*30},100%,70%,${alpha})`; ctx.lineWidth=40-off*8; ctx.stroke()
    }
    function loop(){
      ctx.fillStyle='rgba(5,10,20,0.76)'; ctx.fillRect(0,0,W,H)
      ctx.globalCompositeOperation='lighter'
      band(0,60,0.10); band(1,42,0.12); band(2,24,0.14)
      ctx.globalCompositeOperation='source-over'
      t+=0.02*speed; raf=requestAnimationFrame(loop)
    }
    raf=requestAnimationFrame(loop); return ()=> cancelAnimationFrame(raf)
  }, [cfg.background, cfg.speed, cfg.hue])
  return <canvas ref={ref} style={{position:'fixed', inset:0, zIndex:0, pointerEvents:'none'}}/>
}

/* 10) Particle Swirl */
function ParticleSwirl({cfg}:{cfg:Cfg}){
  const ref = useCanvas((ctx,W,H)=>{
    const speed=clamp(cfg.speed??1,0.2,3), hue=cfg.hue??180, density=clamp(cfg.density??1,0.2,2)
    const count = Math.round(180*density)
    const pts = new Array(count).fill(0).map((_,i)=>({ a: Math.random()*Math.PI*2, r: 10+i*1.8 }))
    let raf=0
    function loop(){
      ctx.fillStyle='rgba(4,8,14,0.88)'; ctx.fillRect(0,0,W,H)
      ctx.save(); ctx.translate(W/2,H/2)
      for(const p of pts){
        p.a += 0.012*speed
        const x=Math.cos(p.a)*p.r, y=Math.sin(p.a*1.15)*p.r*0.6
        ctx.fillStyle=`hsla(${hue+(p.r%80)},100%,60%,0.22)`; ctx.fillRect(x,y,2,2)
      }
      ctx.restore()
      raf=requestAnimationFrame(loop)
    }
    raf=requestAnimationFrame(loop); return ()=> cancelAnimationFrame(raf)
  }, [cfg.background, cfg.speed, cfg.density, cfg.hue])
  return <canvas ref={ref} style={{position:'fixed', inset:0, zIndex:0, pointerEvents:'none'}}/>
}

/* 11) Halloween Clear (jack-o-lantern obvio) */
function HalloweenClear({cfg}:{cfg:Cfg}){
  const ref = useCanvas((ctx,W,H)=>{
    const speed=clamp(cfg.speed??1,0.2,3)
    let t=0, raf=0
    function loop(){
      ctx.fillStyle='rgba(8,6,10,0.95)'; ctx.fillRect(0,0,W,H)
      const cx=W*0.5, cy=H*0.62
      // Outer glow
      const g = ctx.createRadialGradient(cx,cy,0,cx,cy,220)
      g.addColorStop(0,'rgba(255,140,0,0.30)'); g.addColorStop(1,'rgba(255,60,0,0.05)')
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,160,0,Math.PI*2); ctx.fill()

      // Pumpkin body (clear silhouette)
      ctx.fillStyle='rgba(255,120,0,0.18)'
      ctx.beginPath()
      ctx.ellipse(cx, cy, 170, 130, 0, 0, Math.PI*2); ctx.fill()
      // Stem
      ctx.fillStyle='rgba(90,50,10,0.6)'; ctx.fillRect(cx-10, cy-160, 20, 40)

      // Eyes (triangles) + nose
      const blink = 0.85 + Math.sin(t*3)*0.15
      ctx.fillStyle=`rgba(255,180,80,${0.8*blink})`
      // left eye
      ctx.beginPath(); ctx.moveTo(cx-70,cy-40); ctx.lineTo(cx-20,cy-15); ctx.lineTo(cx-70,cy+10); ctx.closePath(); ctx.fill()
      // right eye
      ctx.beginPath(); ctx.moveTo(cx+70,cy-40); ctx.lineTo(cx+20,cy-15); ctx.lineTo(cx+70,cy+10); ctx.closePath(); ctx.fill()
      // nose
      ctx.beginPath(); ctx.moveTo(cx,cy-5); ctx.lineTo(cx-12,cy+20); ctx.lineTo(cx+12,cy+20); ctx.closePath(); ctx.fill()

      // Mouth (zig-zag teeth)
      ctx.strokeStyle='rgba(255,150,60,0.85)'; ctx.lineWidth=3
      ctx.beginPath(); ctx.moveTo(cx-90,cy+40)
      for(let i=0;i<=9;i++){ const x=cx-90+i*20, y = cy+40 + (i%2?12:-12); ctx.lineTo(x,y) }
      ctx.stroke()

      // subtle bats
      for(let i=0;i<10;i++){
        const bx = (i*150 + t*200)%(W+120)-60
        const by = H*0.22 + Math.sin(t*2+i)*26
        ctx.fillStyle='rgba(20,20,20,0.9)'
        ctx.beginPath()
        ctx.moveTo(bx,by); ctx.quadraticCurveTo(bx-14,by-10,bx-28,by)
        ctx.quadraticCurveTo(bx-14,by+10,bx,by)
        ctx.quadraticCurveTo(bx+14,by-10,bx+28,by)
        ctx.quadraticCurveTo(bx+14,by+10,bx,by)
        ctx.fill()
      }

      t+=0.01*speed; raf=requestAnimationFrame(loop)
    }
    raf=requestAnimationFrame(loop); return ()=> cancelAnimationFrame(raf)
  }, [cfg.background, cfg.speed])
  return <canvas ref={ref} style={{position:'fixed', inset:0, zIndex:0, pointerEvents:'none'}}/>
}
