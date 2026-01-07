# HITECH Patches (Primigenios)

Esta carpeta es el "origen primigenio" de parches.

- Cada archivo *.json puede ser:
  - un patch { id, description, enabled, files: [...] }
  - o un manifest { version, patches: [...] }

El motor (patcher.mjs v2) puede:
- leer patches.json (manifest base)
- leer primigenios aqui (Patches/)
- aplicar acciones:
  - writeFromTemplate
  - replaceExact
  - replaceRegex
  - repairWithGlossary

Glosario:
- scripts/hitech-templates/glossary.json
- Agrega reglas nuevas y corre repair para arreglar archivos existentes.
