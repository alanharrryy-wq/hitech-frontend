import fs from "node:fs";
import path from "node:path";

function sameText(a, b) {
  if (a == null || b == null) return false;
  // strip BOM
  if (a.length > 0 && a.charCodeAt(0) === 0xFEFF) a = a.slice(1);
  if (b.length > 0 && b.charCodeAt(0) === 0xFEFF) b = b.slice(1);
  // normalize newlines
  a = a.replace(/\r\n/g, "\n");
  b = b.replace(/\r\n/g, "\n");
  return a === b;
}
import childProcess from "node:child_process";

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    String(d.getFullYear()) +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "_" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

function readTextUtf8(p) {
  return fs.readFileSync(p, "utf8");
}

function readJson(p) {
  return JSON.parse(readTextUtf8(p));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function normForCompare(p) {
  return String(p || "").replace(/\//g, "\\").toLowerCase();
}

function isSamePath(a, b) {
  const na = normForCompare(path.resolve(String(a || "")));
  const nb = normForCompare(path.resolve(String(b || "")));
  return na === nb;
}

function fileSizeSafe(absPath) {
  try {
    const st = fs.statSync(absPath);
    return typeof st.size === "number" ? st.size : 0;
  } catch {
    return 0;
  }
}

function writeFileWithBackupAtomic(absPath, content, stamp) {
  const txt = String(content || "");

  // Guard anti-suicidio: jamás escribas vacío por accidente
  if (txt.length === 0) {
    throw new Error("Refuse-to-write: contenido vacío para " + absPath);
  }

  ensureDir(path.dirname(absPath));

  if (fs.existsSync(absPath)) {
    const bak = absPath + ".bak_" + stamp;
    fs.copyFileSync(absPath, bak);
  }

  // Escritura “más segura”: tmp -> swap
  const tmp = absPath + ".__tmp__" + stamp;
  fs.writeFileSync(tmp, txt, "utf8");

  // Swap con fallback (Windows a veces no deja rename sobre existente)
  try {
    if (fs.existsSync(absPath)) {
      try { fs.unlinkSync(absPath); } catch {}
    }
    fs.renameSync(tmp, absPath);
  } catch {
    fs.copyFileSync(tmp, absPath);
    try { fs.unlinkSync(tmp); } catch {}
  }

  const sz = fileSizeSafe(absPath);
  if (sz === 0) {
    throw new Error("Write-failed: quedó en 0 bytes " + absPath);
  }
}

function execGitRoot(cwd) {
  try {
    const out = childProcess.execSync("git rev-parse --show-toplevel", {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    });
    const s = String(out || "").trim();
    return s ? s : null;
  } catch {
    return null;
  }
}

function findGitRootFallback(startDir) {
  let cur = path.resolve(startDir);
  for (;;) {
    const gitDir = path.join(cur, ".git");
    if (fs.existsSync(gitDir)) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}

function resolveRepoRoot() {
  const cwd = process.cwd();
  const git = execGitRoot(cwd);
  if (git) return git;
  const fb = findGitRootFallback(cwd);
  if (fb) return fb;
  return cwd;
}

function parseArgs(argv) {
  const args = {
    patch: [],
    patchDir: null,
    dryRun: false,
    onlyPatch: false,
    noPrimigenios: false,
    repair: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];

    if (a === "--patch" && i + 1 < argv.length) {
      args.patch.push(argv[i + 1]);
      i++;
      continue;
    }

    if (a === "--patch-dir" && i + 1 < argv.length) {
      args.patchDir = argv[i + 1];
      i++;
      continue;
    }

    if (a === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (a === "--only-patch") {
      args.onlyPatch = true;
      continue;
    }

    if (a === "--no-primigenios") {
      args.noPrimigenios = true;
      continue;
    }

    if (a === "--repair" && i + 1 < argv.length) {
      args.repair.push(argv[i + 1]);
      i++;
      continue;
    }
  }

  return args;
}

function normalizeManifest(m) {
  if (!m || typeof m !== "object") return { version: 1, patches: [] };
  if (Array.isArray(m)) return { version: 1, patches: m };
  const version = typeof m.version === "number" ? m.version : 1;
  const patches = Array.isArray(m.patches) ? m.patches : [];
  return { version, patches };
}

function safeResolveWithin(baseAbs, relLike) {
  const abs = path.resolve(baseAbs, String(relLike || ""));
  const base = path.resolve(baseAbs);

  const a = normForCompare(abs);
  const b = normForCompare(base);

  if (a === b) return abs;
  if (a.startsWith(b + "\\")) return abs;

  throw new Error("Path fuera del scope permitido: " + String(relLike || ""));
}

function listJsonFiles(absDir) {
  if (!fs.existsSync(absDir)) return [];
  const items = fs.readdirSync(absDir, { withFileTypes: true });
  const files = [];
  for (const it of items) {
    if (!it.isFile()) continue;
    const name = it.name || "";
    if (name.toLowerCase().endsWith(".json")) files.push(path.join(absDir, name));
  }
  files.sort((a, b) => a.localeCompare(b));
  return files;
}

function loadPatchesFromPrimigenioFile(absPath) {
  const obj = readJson(absPath);

  if (obj && typeof obj === "object" && Array.isArray(obj.patches)) {
    const nm = normalizeManifest(obj);
    return nm.patches;
  }

  if (obj && typeof obj === "object" && typeof obj.id === "string") {
    return [obj];
  }

  throw new Error("Primigenio JSON invalido: " + absPath);
}

function resolveTemplateAbs(tplRootAbs, templatesRootAbs, templateRel) {
  const raw = String(templateRel || "");
  const n = raw.replace(/\\/g, "/");
  const lower = n.toLowerCase();

  // Back-compat: "templates/..." es relativo a tplRoot
  if (lower.startsWith("templates/")) {
    return safeResolveWithin(tplRootAbs, n);
  }

  // Nuevo default: relativo a templates root
  return safeResolveWithin(templatesRootAbs, n);
}

function loadGlossary(glossaryAbs) {
  if (!fs.existsSync(glossaryAbs)) {
    return { version: 1, rules: [] };
  }
  try {
    const obj = readJson(glossaryAbs);
    if (!obj || typeof obj !== "object") return { version: 1, rules: [] };
    const rules = Array.isArray(obj.rules) ? obj.rules : [];
    const version = typeof obj.version === "number" ? obj.version : 1;
    return { version, rules };
  } catch (e) {
    console.error("ERROR: glossary.json invalido: " + glossaryAbs);
    console.error("Detalle: " + String(e && e.message ? e.message : e));
    return { version: 1, rules: [] };
  }
}

function extLower(relPath) {
  const e = path.extname(String(relPath || "")).toLowerCase();
  return e || "";
}

function ruleApplies(rule, relPath) {
  if (!rule || typeof rule !== "object") return false;
  if (rule.enabled === false) return false;

  const ap = rule.appliesTo && typeof rule.appliesTo === "object" ? rule.appliesTo : null;
  if (!ap) return true;

  const exts = Array.isArray(ap.extensions) ? ap.extensions : null;
  if (exts && exts.length) {
    const e = extLower(relPath);
    const ok = exts.map((x) => String(x || "").toLowerCase()).includes(e);
    if (!ok) return false;
  }

  const includes = Array.isArray(ap.pathIncludes) ? ap.pathIncludes : null;
  if (includes && includes.length) {
    const rp = String(relPath || "").replace(/\\/g, "/").toLowerCase();
    const hit = includes.some((s) => rp.includes(String(s || "").toLowerCase()));
    if (!hit) return false;
  }

  return true;
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let count = 0;
  let idx = 0;
  for (;;) {
    idx = haystack.indexOf(needle, idx);
    if (idx === -1) break;
    count++;
    idx += needle.length;
  }
  return count;
}

function replaceExactAll(text, find, replace, firstOnly) {
  const found = countOccurrences(text, find);
  if (found === 0) return { next: text, found, replaced: 0 };

  if (firstOnly) {
    const next = text.replace(find, replace);
    return { next, found, replaced: 1 };
  }

  const next = text.split(find).join(replace);
  return { next, found, replaced: found };
}

function replaceRegexAll(text, pattern, flags, replace) {
  const f = String(flags || "");
  const useFlags = f.includes("g") ? f : "g" + f;
  const re = new RegExp(String(pattern || ""), useFlags);

  let replaced = 0;
  const next = text.replace(re, () => {
    replaced++;
    return replace;
  });

  return { next, replaced };
}

function applyGlossaryToText(relPath, text, glossary) {
  const rules = glossary && Array.isArray(glossary.rules) ? glossary.rules : [];
  let cur = text;
  const applied = [];

  for (const r of rules) {
    if (!ruleApplies(r, relPath)) continue;

    const type = String(r.type || "");
    if (type === "replaceExact") {
      const find = String(r.find || "");
      const rep = String(r.replace || "");
      const firstOnly = r.firstOnly === true;
      const expect = typeof r.expect === "number" ? r.expect : null;

      if (!find) continue;

      const res = replaceExactAll(cur, find, rep, firstOnly);
      if (res.found === 0) continue;

      if (expect !== null && res.found !== expect) {
        console.error(
          "ERROR: GLOSSARY rule " +
            String(r.id || "(sin id)") +
            " esperaba " +
            String(expect) +
            " match(es), pero encontro " +
            String(res.found) +
            " en " +
            String(relPath)
        );
        continue;
      }

      cur = res.next;
      applied.push(String(r.id || "rule"));
      continue;
    }

    if (type === "replaceRegex") {
      const pattern = String(r.pattern || "");
      const rep = String(r.replace || "");
      const flags = String(r.flags || "g");
      const expect = typeof r.expect === "number" ? r.expect : null;

      if (!pattern) continue;

      let res;
      try {
        res = replaceRegexAll(cur, pattern, flags, rep);
      } catch (e) {
        console.error(
          "ERROR: GLOSSARY regex invalido en rule " +
            String(r.id || "(sin id)") +
            " Detalle: " +
            String(e && e.message ? e.message : e)
        );
        continue;
      }

      if (res.replaced === 0) continue;

      if (expect !== null && res.replaced !== expect) {
        console.error(
          "ERROR: GLOSSARY rule " +
            String(r.id || "(sin id)") +
            " esperaba " +
            String(expect) +
            " reemplazo(s), pero hizo " +
            String(res.replaced) +
            " en " +
            String(relPath)
        );
        continue;
      }

      cur = res.next;
      applied.push(String(r.id || "rule"));
      continue;
    }
  }

  return { text: cur, applied };
}

function scheduleDeferredSelfSwap(targetAbs, nextAbs, stamp) {
  // Proceso aparte que espera a que este patcher muera y luego hace el swap.
  // Usamos -e para no depender de archivos extra.
  const js =
    "const fs=require('fs');" +
    "const path=require('path');" +
    "function sleep(ms){return new Promise(r=>setTimeout(r,ms));}" +
    "function alive(pid){try{process.kill(pid,0);return true}catch{return false}}" +
    "function size(p){try{return fs.statSync(p).size}catch{return 0}}" +
    "async function main(){" +
    "const argv=process.argv;" +
    "let tail=[];" +
    "const i=argv.indexOf('--');" +
    "tail=(i>=0)?argv.slice(i+1):argv.slice(2);" +
    "const target=tail[0]; const next=tail[1]; const ppid=parseInt(tail[2]||'0',10); const stamp=tail[3]||'';" +
    "if(!target||!next||!ppid){process.exit(2)}" +
    "while(alive(ppid)){await sleep(150)}" +
    "for(let k=0;k<30;k++){" +
    "try{" +
    "if(!fs.existsSync(next)){await sleep(200);continue}" +
    "const txt=fs.readFileSync(next,'utf8'); if(!txt||txt.length===0){throw new Error('next vacío')}" +
    "if(fs.existsSync(target)){try{fs.copyFileSync(target,target+'.bak_'+stamp)}catch{}}" +
    "const tmp=target+'.__swap__'+stamp;" +
    "fs.writeFileSync(tmp,txt,'utf8');" +
    "try{ if(fs.existsSync(target)){try{fs.unlinkSync(target)}catch{}} fs.renameSync(tmp,target) }" +
    "catch{ fs.copyFileSync(tmp,target); try{fs.unlinkSync(tmp)}catch{}}" +
    "try{fs.unlinkSync(next)}catch{}" +
    "if(size(target)>0){process.exit(0)}" +
    "}catch(e){}" +
    "await sleep(250)" +
    "}" +
    "process.exit(1)" +
    "}" +
    "main();";

  try {
    const child = childProcess.spawn(
      process.execPath,
      ["-e", js, "--", targetAbs, nextAbs, String(process.pid), stamp],
      { detached: true, stdio: "ignore" }
    );
    child.unref();
    console.log("SELF-UPDATE: queued swap for patcher.mjs");
    return true;
  } catch (e) {
    console.error("ERROR: No pude agendar self-update swap.");
    console.error("Detalle: " + String(e && e.message ? e.message : e));
    return false;
  }
}

function logErr(s){ try{ console.error(String(s)); } catch { } }
function logOk(s){ try{ console.log(String(s)); } catch { } }
function logPatch(s){ try{ console.log(String(s)); } catch { } }

function applyWriteFromTemplate(repoRootAbs, tplRootAbs, templatesRootAbs, glossary, f, stamp, dryRun, selfAbs, deferred) { // idempotent-marker
  try {
    // f normalmente tiene: rel (target), tpl (template), o algo equivalente
    const relTarget =
      (f && (f.target || f.relTarget || f.rel || f.path || f.file)) ? String(f.target || f.relTarget || f.rel || f.path || f.file) : "";

    const relTemplate =
      (f && (f.tpl || f.template || f.relTemplate || f.from)) ? String(f.tpl || f.template || f.relTemplate || f.from) : "";

    if (!relTarget) {
      logErr("ERROR: writeFromTemplate sin relTarget (f inválido)");
      return { status: "error", touched: false };
    }

    // si no viene template, asumimos mismo nombre relativo
    const tplRel0 = relTemplate || relTarget;
let tplRel = String(tplRel0 || "");
// Si ya viene con "templates/..." NO lo dupliques
tplRel = tplRel.replace(/^[\\\/]?templates[\\\/]+/i, "");const absTarget = path.resolve(String(repoRootAbs), relTarget);
    const absTpl    = path.resolve(String(templatesRootAbs), tplRel);

    if (!fs.existsSync(absTpl)) {
      logErr("ERROR: writeFromTemplate no existe template: " + absTpl);
      return { status: "error", touched: false };
    }
    if (fs.statSync(absTpl).isDirectory()) {
      logErr("ERROR: writeFromTemplate template es directorio: " + absTpl);
      return { status: "error", touched: false };
    }

    const src = fs.readFileSync(absTpl, "utf8");

    let cur = "";
    if (fs.existsSync(absTarget) && fs.statSync(absTarget).isFile()) {
      cur = fs.readFileSync(absTarget, "utf8");
    }

    if (sameText(cur, src)) {
      logOk("OK: " + relTarget + " (no changes)");
      return { status: "ok", touched: false };
    }

    ensureDir(path.dirname(absTarget));
    fs.writeFileSync(absTarget, src, "utf8");
    logPatch("PATCHED: " + relTarget + "  <=  " + tplRel);
    return { status: "ok", touched: true };
  } catch (e) {
    logErr("ERROR: Excepcion aplicando writeFromTemplate en " + (f && (f.target || f.rel || f.path || f.file) ? String(f.target || f.rel || f.path || f.file) : "(unknown)"));
    logErr("Detalle: " + (e && e.message ? e.message : String(e)));
    return { status: "error", touched: false };
  }
}

function applyReplaceExact(repoRootAbs, glossary, entry, stamp, dryRun) {
  const rel = String(entry.path || "");
  const absTarget = safeResolveWithin(repoRootAbs, rel);

  if (!fs.existsSync(absTarget)) {
    console.error("ERROR: Target no existe para replaceExact: " + rel);
    return { status: "error", touched: false };
  }

  const find = String(entry.find || "");
  const rep = String(entry.replace || "");
  const firstOnly = entry.firstOnly === true;
  const expect = typeof entry.expect === "number" ? entry.expect : null;

  if (!find) {
    console.error("ERROR: replaceExact requiere 'find' (en " + rel + ")");
    return { status: "error", touched: false };
  }

  const cur = readTextUtf8(absTarget);
  const found = countOccurrences(cur, find);

  if (found === 0) {
    console.log("OK: " + rel + " (sin cambios, no match)");
    return { status: "ok", touched: false };
  }

  if (expect !== null && found !== expect) {
    console.error(
      "ERROR: " +
        rel +
        " replaceExact esperaba " +
        String(expect) +
        " match(es), pero encontro " +
        String(found) +
        ". NO se aplico nada."
    );
    return { status: "error", touched: false };
  }

  const res = replaceExactAll(cur, find, rep, firstOnly);

  let out = res.next;
  const g = entry.applyGlossary === true ? applyGlossaryToText(rel, out, glossary) : { text: out, applied: [] };
  out = g.text;

  if (dryRun) {
    console.log("PATCHED(dry-run): " + rel + " (replaceExact found=" + String(found) + ")");
    if (g.applied.length) console.log("REPAIRED(dry-run): " + rel + " (glossary: " + g.applied.join(", ") + ")");
    return { status: "patched", touched: true };
  }

  writeFileWithBackupAtomic(absTarget, out, stamp);
  console.log("PATCHED: " + rel + " (replaceExact found=" + String(found) + ")");
  if (g.applied.length) console.log("REPAIRED: " + rel + " (glossary: " + g.applied.join(", ") + ")");
  return { status: "patched", touched: true };
}

function applyReplaceRegex(repoRootAbs, glossary, entry, stamp, dryRun) {
  const rel = String(entry.path || "");
  const absTarget = safeResolveWithin(repoRootAbs, rel);

  if (!fs.existsSync(absTarget)) {
    console.error("ERROR: Target no existe para replaceRegex: " + rel);
    return { status: "error", touched: false };
  }

  const pattern = String(entry.pattern || "");
  const flags = String(entry.flags || "g");
  const rep = String(entry.replace || "");
  const expect = typeof entry.expect === "number" ? entry.expect : null;

  if (!pattern) {
    console.error("ERROR: replaceRegex requiere 'pattern' (en " + rel + ")");
    return { status: "error", touched: false };
  }

  const cur = readTextUtf8(absTarget);

  let res;
  try {
    res = replaceRegexAll(cur, pattern, flags, rep);
  } catch (e) {
    console.error("ERROR: regex invalido en " + rel + " Detalle: " + String(e && e.message ? e.message : e));
    return { status: "error", touched: false };
  }

  if (res.replaced === 0) {
    console.log("OK: " + rel + " (sin cambios, no match)");
    return { status: "ok", touched: false };
  }

  if (expect !== null && res.replaced !== expect) {
    console.error(
      "ERROR: " +
        rel +
        " replaceRegex esperaba " +
        String(expect) +
        " reemplazo(s), pero hizo " +
        String(res.replaced) +
        ". NO se aplico nada."
    );
    return { status: "error", touched: false };
  }

  let out = res.next;
  const g = entry.applyGlossary === true ? applyGlossaryToText(rel, out, glossary) : { text: out, applied: [] };
  out = g.text;

  if (dryRun) {
    console.log("PATCHED(dry-run): " + rel + " (replaceRegex replaced=" + String(res.replaced) + ")");
    if (g.applied.length) console.log("REPAIRED(dry-run): " + rel + " (glossary: " + g.applied.join(", ") + ")");
    return { status: "patched", touched: true };
  }

  writeFileWithBackupAtomic(absTarget, out, stamp);
  console.log("PATCHED: " + rel + " (replaceRegex replaced=" + String(res.replaced) + ")");
  if (g.applied.length) console.log("REPAIRED: " + rel + " (glossary: " + g.applied.join(", ") + ")");
  return { status: "patched", touched: true };
}

function applyRepairWithGlossary(repoRootAbs, glossary, entry, stamp, dryRun) {
  const rel = String(entry.path || "");
  const absTarget = safeResolveWithin(repoRootAbs, rel);

  if (!fs.existsSync(absTarget)) {
    console.error("ERROR: Target no existe para repairWithGlossary: " + rel);
    return { status: "error", touched: false };
  }

  const cur = readTextUtf8(absTarget);
  const g = applyGlossaryToText(rel, cur, glossary);

  if (g.applied.length === 0) {
    console.log("OK: " + rel + " (sin cambios)");
    return { status: "ok", touched: false };
  }

  if (dryRun) {
    console.log("PATCHED(dry-run): " + rel + " (repairWithGlossary: " + g.applied.join(", ") + ")");
    return { status: "patched", touched: true };
  }

  writeFileWithBackupAtomic(absTarget, g.text, stamp);
  console.log("PATCHED: " + rel + " (repairWithGlossary: " + g.applied.join(", ") + ")");
  return { status: "patched", touched: true };
}

function applyPatches(repoRootAbs, tplRootAbs, templatesRootAbs, glossary, patches, stamp, dryRun, selfAbs, deferred) {
  let patchedFiles = 0;
  let hadError = false;
  const touched = [];

  for (const p of patches) {
    if (!p || typeof p !== "object") continue;
    if (p.enabled === false) continue;

    const files = Array.isArray(p.files) ? p.files : [];
    for (const f of files) {
      if (!f || typeof f !== "object") continue;

      const rel = String(f.path || "");
      if (!rel) {
        console.error("ERROR: file entry sin 'path'");
        hadError = true;
        continue;
      }

      const action = String(f.action || "");

      try {
        if (action === "writeFromTemplate") {
          const r = applyWriteFromTemplate(repoRootAbs, tplRootAbs, templatesRootAbs, glossary, f, stamp, dryRun, selfAbs, deferred);
          if (r.status === "error") hadError = true;
          if (r.touched) {
            patchedFiles++;
            touched.push(rel);
          }
          continue;
        }

        if (action === "replaceExact") {
          const r = applyReplaceExact(repoRootAbs, glossary, f, stamp, dryRun);
          if (r.status === "error") hadError = true;
          if (r.touched) {
            patchedFiles++;
            touched.push(rel);
          }
          continue;
        }

        if (action === "replaceRegex") {
          const r = applyReplaceRegex(repoRootAbs, glossary, f, stamp, dryRun);
          if (r.status === "error") hadError = true;
          if (r.touched) {
            patchedFiles++;
            touched.push(rel);
          }
          continue;
        }

        if (action === "repairWithGlossary") {
          const r = applyRepairWithGlossary(repoRootAbs, glossary, f, stamp, dryRun);
          if (r.status === "error") hadError = true;
          if (r.touched) {
            patchedFiles++;
            touched.push(rel);
          }
          continue;
        }

        console.error("ERROR: Accion desconocida: " + action + " (en " + rel + ")");
        hadError = true;
      } catch (e) {
        console.error("ERROR: Excepcion aplicando " + action + " en " + rel);
        console.error("Detalle: " + String(e && e.message ? e.message : e));
        hadError = true;
      }
    }
  }

  return { patchedFiles, touched, hadError };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const repoRoot = resolveRepoRoot();
  const tplRoot = path.join(repoRoot, "scripts", "hitech-templates");
  const templatesRoot = path.join(tplRoot, "templates");
  const manifestPath = path.join(tplRoot, "patches.json");
  const glossaryPath = path.join(tplRoot, "glossary.json");

  const stamp = nowStamp();

  // Self path absoluto (para detectar intentos de sobrescritura del ejecutable)
  const selfAbs = process.argv && process.argv[1] ? path.resolve(process.argv[1]) : null;
  const deferred = [];

  console.log("\nHITECH patcher ✅  stamp=" + stamp);
  console.log("RepoRoot: " + repoRoot);
  console.log("TplRoot:  " + tplRoot);
  console.log("Templates:" + templatesRoot);
  console.log("Manifest: " + manifestPath);
  console.log("Glossary: " + glossaryPath);
  if (selfAbs) console.log("SelfAbs:  " + selfAbs);
  console.log("");

  if (!fs.existsSync(tplRoot)) {
    console.error("ERROR: No existe scripts/hitech-templates en repoRoot.");
    process.exitCode = 1;
    return;
  }

  if (!fs.existsSync(manifestPath) && !args.onlyPatch) {
    console.error("ERROR: No existe patches.json en: " + manifestPath);
    process.exitCode = 1;
    return;
  }

  const glossary = loadGlossary(glossaryPath);

  let patches = [];

  if (!args.onlyPatch) {
    const baseManifest = normalizeManifest(readJson(manifestPath));
    patches = patches.concat(baseManifest.patches);
  }

  // --patch (uno o varios)
  if (args.patch.length) {
    for (const p of args.patch) {
      const abs = path.isAbsolute(p) ? p : path.join(repoRoot, p);
      if (!fs.existsSync(abs)) {
        console.error("ERROR: --patch no existe: " + abs);
        process.exitCode = 1;
        return;
      }
      try {
        const more = loadPatchesFromPrimigenioFile(abs);
        patches = patches.concat(more);
        console.log("PRIMIGENIO: cargado --patch " + abs);
      } catch (e) {
        console.error("ERROR: No pude cargar --patch " + abs);
        console.error("Detalle: " + String(e && e.message ? e.message : e));
        process.exitCode = 1;
        return;
      }
    }
    console.log("");
  } else if (!args.noPrimigenios) {
    const defaultDir = path.join(tplRoot, "Patches");
    const useDir = args.patchDir
      ? (path.isAbsolute(args.patchDir) ? args.patchDir : path.join(repoRoot, args.patchDir))
      : defaultDir;

    const primFiles = listJsonFiles(useDir);
    if (primFiles.length) {
      console.log("PRIMIGENIOS: cargando desde " + useDir);
      for (const f of primFiles) {
        try {
          const more = loadPatchesFromPrimigenioFile(f);
          patches = patches.concat(more);
          console.log(" - OK: " + f);
        } catch (e) {
          console.error(" - ERROR: " + f + "  " + String(e && e.message ? e.message : e));
        }
      }
      console.log("");
    }
  }

  // --repair <file> (repetible)
  if (args.repair.length) {
    const repairPatch = {
      id: "__cli_repair__",
      description: "CLI repair with glossary",
      enabled: true,
      files: args.repair.map((r) => ({ path: r, action: "repairWithGlossary" })),
    };
    patches.push(repairPatch);
  }

  const result = applyPatches(repoRoot, tplRoot, templatesRoot, glossary, patches, stamp, args.dryRun, selfAbs, deferred);

  console.log("\nResumen: " + String(result.patchedFiles) + " archivo(s) parchados.");
  const uniq = Array.from(new Set(result.touched));
  if (uniq.length) {
    console.log("Tocados:");
    for (const t of uniq) console.log(" - " + t);
  } else {
    console.log("OK (sin cambios).");
  }

  // Self-update deferred: swap después de que este proceso termine
  if (!args.dryRun && deferred.length) {
    for (const d of deferred) {
      scheduleDeferredSelfSwap(d.targetAbs, d.nextAbs, stamp);
    }
  }

  if (result.hadError) {
    process.exitCode = 1;
  }
}

main();






