# 🧠 Patcher Engine – Manual Oficial (SOP + Debugger)

Este documento es **la verdad oficial** del sistema scripts/hitech-templates.

Si sigues esto, **no rompes el repo**, no repites errores pasados y no entras en loops infernales.

---

## 1️⃣ Qué es el Patcher Engine (sin humo)

El **Patcher Engine** es un **instalador idempotente** para el repo.

- No es copy/paste
- No es magia
- No es generación caótica

Es un motor que aplica cambios **desde templates**, usando **patches JSON**, sin reescribir si no hay cambios reales.

---

## 2️⃣ Estructura oficial

scripts/hitech-templates/
- patcher.mjs
- patches.json
- glossary.json
- templates/
- Patches/
- ONE_SHOT.ps1
- oneshot.mjs

---

## 3️⃣ Flujo de ejecución

Comando típico:

node scripts/hitech-templates/patcher.mjs --doctor --verbose

Salida sana:
- OK (no changes)
- PATCHED: archivo <= template

---

## 4️⃣ Idempotencia (regla sagrada)

Si el archivo destino es idéntico al template:
- NO se reescribe
- NO hay cambios fantasma

Normaliza:
- BOM
- CRLF vs LF

---

## 5️⃣ Contrato applyWriteFromTemplate (engine-v2)

Firma oficial:

applyWriteFromTemplate(
  repoRootAbs,
  tplRootAbs,
  templatesRootAbs,
  glossary,
  f,
  stamp,
  dryRun,
  selfAbs,
  deferred
)

🚨 Nunca cambies esta firma sin revisar el engine.

---

## 6️⃣ Reglas de oro

- Nunca parches el patcher desde el patcher
- Nunca versionar .engine-*.flag ni *.bak_*
- Templates siempre relativos a templates/
- Patches atómicos y con propósito

---

## 🧨 Debugger’s Guide

Errores comunes:
- logErr is not defined → faltan helpers
- EISDIR → template apunta a carpeta
- templates/templates → doble prefijo
- REPO_ROOT undefined → uso de globals
- self-patching → patch mal diseñado

---

## Naming de patches

YYYYMMDD_HHMMSS-ruta-motivo.json

---

📌 Este documento manda.
Si algo contradice esto, **esto gana**.
