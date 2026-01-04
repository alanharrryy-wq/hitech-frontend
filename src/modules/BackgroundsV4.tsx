import { useEffect, useRef } from 'react'
type Cfg = { background:string, speed:number, density:number, hue:number, brightness:number }
function read():Cfg{ try{ const s = JSON.parse(localStorage.getItem('uiSettings')||'{}'); return {
  background: s.background||'starfield', speed:s.speed??1, density:s.density??1, hue:s.hue??190, brightness:s.brightness??0.9
}}catch{return {background:'starfield',speed:1,density:1,hue:190,brightness:0.9}} }

type DrawFn = (ctx:CanvasRenderingContext2D, t:number, W:number,H:number, cfg:Cfg)=>void
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
const rnd=(n=1)=>Math.random()*n
function hsla(h:number, s=80, l=50, a=1){ return `hsla(${h}, ${s}%, ${l}%, ${a})` }

const mkStarfield=():DrawFn=>{ const stars = Array.from({length:500},()=>({x:rnd(1),y:rnd(1),z: rnd(1)})); return (ctx,t,W,H,cfg)=>{
  const spd = 0.05*cfg.speed; ctx.fillStyle = `rgba(5,8,12,${clamp(1.8-cfg.brightness,0.5,1)})`; ctx.fillRect(0,0,W,H)
  for(const s of stars){ s.z -= spd; if(s.z<=0){ s.x=rnd(1); s.y=rnd(1); s.z=1 }
    const sx = (s.x-0.5)/s.z*W*0.5 + W/2, sy = (s.y-0.5)/s.z*H*0.5 + H/2, size=(1.2-s.z)*2
    ctx.fillStyle = hsla(cfg.hue + (s.x*40-20), 90, 70, 0.9); ctx.fillRect(sx,sy,size,size)
    if((t*0.001 + s.x*10)%5<0.02){ ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(sx-1,sy-1,size+2,size+2) }
  } } }

const mkHexPulse=():DrawFn=>{ return (ctx,t,W,H,cfg)=>{
  ctx.fillStyle = `rgba(6,9,14,${clamp(1.8-cfg.brightness,0.5,1)})`; ctx.fillRect(0,0,W,H)
  const s = 22, r = (t*0.001*cfg.speed)%1; ctx.strokeStyle = hsla(cfg.hue,80,60,0.3); ctx.lineWidth=1
  for(let y=-s; y<H+s; y+=s*0.86){ for(let x=-s; x<W+s; x+=s*1.5){
    const xx = x + ((Math.floor(y/s)%2)? s*0.75:0); const pulse = (Math.sin((xx+y)*0.05 + r*6)+1)/2; const L = 40 + pulse*40
    ctx.strokeStyle = hsla(cfg.hue,90,L,0.35); hex(ctx, xx, y, s*(0.8+0.2*pulse))
  } }
  function hex(ctx:CanvasRenderingContext2D, cx:number, cy:number, size:number){
    ctx.beginPath(); for(let i=0;i<6;i++){ const a = Math.PI/3*i; const px = cx + size*Math.cos(a); const py = cy + size*Math.sin(a); i===0? ctx.moveTo(px,py): ctx.lineTo(px,py) }
    ctx.closePath(); ctx.stroke()
  }
} }

const mkLaserRain=():DrawFn=>{ const drops = Array.from({length:220},()=>({x:rnd(1), y:rnd(1), v: .3+.7*Math.random()})); return (ctx,t,W,H,cfg)=>{
  ctx.fillStyle = `rgba(8,10,18,${clamp(1.8-cfg.brightness,0.5,1)})`; ctx.fillRect(0,0,W,H); ctx.strokeStyle = hsla(cfg.hue+40,90,60,0.6)
  for(const d of drops){ d.y += d.v*cfg.speed*0.02; if(d.y>1){ d.y=0; d.x=rnd(1); d.v=.3+.7*Math.random() }
    const x = d.x*W, y = d.y*H; ctx.beginPath(); ctx.moveTo(x,y-30); ctx.lineTo(x,y+10); ctx.stroke()
  }
} }

const mkDataFlow=():DrawFn=>{ const lines = Array.from({length:60},()=>({y:rnd(1), w: 50+Math.random()*200, s: .4+Math.random()*1.2 })); return (ctx,t,W,H,cfg)=>{
  ctx.fillStyle = `rgba(6,8,12,${clamp(1.8-cfg.brightness,0.5,1)})`; ctx.fillRect(0,0,W,H); ctx.strokeStyle = hsla(cfg.hue,85,65,0.5); ctx.lineWidth=2
  for(const l of lines){ const x = ( (t*0.05*l.s*cfg.speed) % (W+l.w) ) - l.w; ctx.beginPath(); ctx.moveTo(x, l.y*H); ctx.lineTo(x+l.w, l.y*H); ctx.stroke() }
} }

const mkHoloCircuit=():DrawFn=>{ const n = Array.from({length:90},()=>({x:rnd(1), y:rnd(1)})); const e = Array.from({length:120},()=>({a: Math.floor(rnd(n.length)), b: Math.floor(rnd(n.length))}));
  return (ctx,t,W,H,cfg)=>{
    ctx.fillStyle = `rgba(4,6,10,${clamp(1.8-cfg.brightness,0.5,1)})`; ctx.fillRect(0,0,W,H); ctx.strokeStyle = hsla(cfg.hue,90,60,0.25); ctx.lineWidth=1
    for(const k of e){ const a = n[k.a], b = n[k.b]; ctx.beginPath(); ctx.moveTo(a.x*W, a.y*H); ctx.lineTo(b.x*W, b.y*H); ctx.stroke() }
    for(const p of n){ const pulse = (Math.sin((t*0.003 + p.x*7 + p.y*11))*0.5+0.5)
      ctx.fillStyle = hsla(cfg.hue+30,90,60+pulse*25, 0.8); ctx.beginPath(); ctx.arc(p.x*W, p.y*H, 1.2+pulse*1.6, 0, Math.PI*2); ctx.fill()
    }
  }
}

const mkNeonRings=():DrawFn=>{ return (ctx,t,W,H,cfg)=>{
  ctx.fillStyle = `rgba(3,5,9,${clamp(1.8-cfg.brightness,0.5,1)})`; ctx.fillRect(0,0,W,H); const cx=W/2, cy=H/2, R=Math.min(W,H)/2.2
  for(let i=0;i<8;i++){ const r = R*(i+1)/8; const L = 40 + ((Math.sin(t*0.002 + i)+1)/2)*35; ctx.strokeStyle = hsla(cfg.hue + i*12, 90, L, 0.6); ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke() }
} }

const mkGridWave=():DrawFn=>{ return (ctx,t,W,H,cfg)=>{
  ctx.fillStyle = `rgba(5,7,12,${clamp(1.8-cfg.brightness,0.5,1)})`; ctx.fillRect(0,0,W,H); const s = 26; ctx.strokeStyle = hsla(cfg.hue, 80, 55, 0.35); ctx.lineWidth=1
  for(let y=0;y<H;y+=s){ ctx.beginPath(); for(let x=0;x<W;x+=s){ const yy = y + Math.sin((x+t*0.002*cfg.speed))*6; x===0? ctx.moveTo(x,yy): ctx.lineTo(x,yy) } ctx.stroke() }
} }

const mkVaporLines=():DrawFn=>{ return (ctx,t,W,H,cfg)=>{
  ctx.fillStyle = `rgba(4,6,10,${clamp(1.8-cfg.brightness,0.5,1)})`; ctx.fillRect(0,0,W,H)
  for(let i=0;i<18;i++){ const y = ((i*60 + (t*0.04*cfg.speed)) % (H+120)) - 60; const l = 50 + (i%3)*60
    ctx.strokeStyle = hsla(cfg.hue + i*5, 90, 65, 0.45); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-l, y); ctx.lineTo(W+l, y); ctx.stroke()
  }
} }

const mkHoloOrbs=():DrawFn=>{ const orbs = Array.from({length:18},()=>({r: Math.random(), a:Math.random()*Math.PI*2, d: 40+Math.random()*160 })); return (ctx,t,W,H,cfg)=>{
  ctx.fillStyle = `rgba(3,5,9,${clamp(1.8-cfg.brightness,0.5,1)})`; ctx.fillRect(0,0,W,H); const cx=W/2, cy=H/2
  for(let i=0;i<orbs.length;i++){ const o = orbs[i]; const a = o.a + t*0.0004*(i%2?1:-1)*cfg.speed; const x = cx + Math.cos(a)*o.d, y = cy + Math.sin(a)*o.d*0.6
    const L = 50 + (Math.sin(a*2)+1)*20; ctx.fillStyle = hsla(cfg.hue + i*10, 90, L, 0.35); ctx.beginPath(); ctx.arc(x,y, 10+(i%5), 0, Math.PI*2); ctx.fill()
  }
} }

const mkHalloween=():DrawFn=>{ const sprites = Array.from({length:24},()=>({x:Math.random(),y:Math.random(), vx:(Math.random()-.5)*0.06, vy:(Math.random()-.5)*0.04, t:Math.random()*6})); return (ctx,t,W,H,cfg)=>{
  ctx.fillStyle = `rgba(8,6,10,${clamp(1.8-cfg.brightness,0.5,1)})`; ctx.fillRect(0,0,W,H)
  for(const s of sprites){ s.x += s.vx*cfg.speed*0.3; s.y += s.vy*cfg.speed*0.3; if(s.x<0||s.x>1) s.vx*=-1; if(s.y<0||s.y>1) s.vy*=-1
    const x = s.x*W, y=s.y*H; const blink = (Math.sin(t*0.005 + s.t)+1)/2; drawPumpkin(ctx, x, y, 16+blink*4)
    if((s.t%2)<1) drawSkull(ctx, x+20, y-10, 10+blink*3)
  }
  function drawPumpkin(ctx:CanvasRenderingContext2D, x:number,y:number,r:number){
    ctx.fillStyle = 'rgba(255,140,0,0.80)'; ctx.beginPath(); ctx.ellipse(x,y,r*1.1,r,0,0,Math.PI*2); ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(x,y,r*1.1,r,0,0,Math.PI*2); ctx.stroke()
    ctx.fillStyle = 'rgba(20,20,20,0.9)'; ctx.beginPath(); ctx.moveTo(x-6,y-2); ctx.lineTo(x-2,y-2); ctx.lineTo(x-4,y+2); ctx.closePath(); ctx.fill()
    ctx.beginPath(); ctx.moveTo(x+6,y-2); ctx.lineTo(x+2,y-2); ctx.lineTo(x+4,y+2); ctx.closePath(); ctx.fill()
    ctx.fillStyle = 'rgba(250,220,150,0.9)'; ctx.fillRect(x-2,y-9,4,6)
    ctx.strokeStyle = 'rgba(255,230,120,0.6)'; ctx.beginPath(); ctx.arc(x,y+5, r*0.5, Math.PI*0.1, Math.PI-0.1); ctx.stroke()
  }
  function drawSkull(ctx:CanvasRenderingContext2D, x:number,y:number,r:number){
    ctx.fillStyle = 'rgba(230,230,255,0.85)'; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill()
    ctx.fillStyle = 'rgba(20,20,40,0.9)'; ctx.beginPath(); ctx.arc(x-3,y-1,2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x+3,y-1,2,0,Math.PI*2); ctx.fill()
    ctx.fillRect(x-2,y+2,4,4)
  }
} }

const drawers:Record<string, DrawFn> = {
  starfield: mkStarfield(),
  hexPulse: mkHexPulse(),
  laserRain: mkLaserRain(),
  dataFlow: mkDataFlow(),
  holoCircuit: mkHoloCircuit(),
  neonRings: mkNeonRings(),
  gridWave: mkGridWave(),
  vaporLines: mkVaporLines(),
  holoOrbs: mkHoloOrbs(),
  halloween: mkHalloween(),
}

export function BackgroundV4(){
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const cv = ref.current!, ctx = cv.getContext('2d')!
    let raf=0
    const on = ()=>{
      const cfg = read()
      const W = cv.width = window.innerWidth
      const H = cv.height = window.innerHeight
      const draw = drawers[cfg.background] || drawers.starfield
      const tick=(t:number)=>{ draw(ctx,t,W,H,cfg); raf=requestAnimationFrame(tick) }
      cancelAnimationFrame(raf); raf=requestAnimationFrame(tick)
    }
    on(); window.addEventListener('resize', on)
    const cb=()=> on(); window.addEventListener('uiSettingsChanged', cb as any)
    return ()=>{ window.removeEventListener('resize', on); window.removeEventListener('uiSettingsChanged', cb as any); cancelAnimationFrame(raf) }
  },[])
  return <canvas ref={ref} style={{position:'fixed', inset:0, zIndex:0, pointerEvents:'none'}}/>
}
