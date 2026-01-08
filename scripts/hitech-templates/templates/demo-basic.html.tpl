<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>HITECH Demo</title>
    <style>
      body{font-family:system-ui,Segoe UI,Roboto,Arial; padding:24px; background:#0b1020; color:#eaf2ff}
      .card{max-width:900px; margin:0 auto; padding:24px; border-radius:18px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.10)}
      code{background:rgba(0,0,0,.35); padding:2px 6px; border-radius:8px}
      .pill{display:inline-block; padding:8px 12px; border-radius:999px; background:rgba(2,167,202,.2); border:1px solid rgba(2,167,202,.35)}
    </style>
  </head>
  <body>
    <div class="card">
      <div class="pill">Template render ✅</div>
      <h1>HITECH demo generado</h1>
      <p>Archivo: <code>{{FILE}}</code></p>
      <p>Stamp: <code>{{STAMP}}</code></p>
      <p>Nota: este archivo lo genera el patcher desde <code>templates/</code>, así evitamos que PowerShell “se coma” backticks.</p>
    </div>
  </body>
</html>