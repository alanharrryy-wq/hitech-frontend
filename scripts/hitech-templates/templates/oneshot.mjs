import fs from "node:fs";
import path from "node:path";
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

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readTextUtf8(p) {
  return fs.readFileSync(p, "utf8");
}

function writeTextUtf8(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, "utf8");
}

function writeJsonUtf8(p, obj) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
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

function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\\/g, "/")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function parseArgs(argv) {
  const args = {
    target: null,
    mode: "write",
    desc: "One-shot patch",
    id: null,
    patchDir: null,
    contentFile: null,
    specFile: null,
    apply: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];

    if (a === "--target" && i + 1 < argv.length) {
      args.target = argv[i + 1];
      i++;
      continue;
    }

    if (a === "--mode" && i + 1 < argv.length) {
      args.mode = argv[i + 1];
      i++;
      continue;
    }

    if (a === "--desc" && i + 1 < argv.length) {
      args.desc = argv[i + 1];
      i++;
      continue;
    }

    if (a === "--id" && i + 1 < argv.length) {
      args.id = argv[i + 1];
      i++;
      continue;
    }

    if (a === "--patch-dir" && i + 1 < argv.length) {
      args.patchDir = argv[i + 1];
      i++;
      continue;
    }

    if (a === "--content-file" && i + 1 < argv.length) {
      args.contentFile = argv[i + 1];
      i++;
      continue;
    }

    if (a === "--spec-file" && i + 1 < argv.length) {
      args.specFile = argv[i + 1];
      i++;
      continue;
    }

    if (a === "--apply") {
      args.apply = true;
      continue;
    }

    if (a === "--dry-run") {
      args.dryRun = true;
      continue;
    }
  }

  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.target) {
    console.error("ERROR: oneshot requiere --target <ruta/relativa>");
    process.exit(1);
  }

  const repoRoot = resolveRepoRoot();
  const htRoot = path.join(repoRoot, "scripts", "hitech-templates");
  const templatesRoot = path.join(htRoot, "templates");
  const patcherAbs = path.join(htRoot, "patcher.mjs");

  if (!fs.existsSync(patcherAbs)) {
    console.error("ERROR: No existe patcher.mjs en: " + patcherAbs);
    process.exit(1);
  }

  const targetRel = String(args.target).replace(/\\/g, "/").replace(/^\.\//, "");
  const stamp = nowStamp();
  const id = args.id ? String(args.id) : "patch-" + stamp + "-" + slugify(targetRel);
  const patchDirAbs = args.patchDir
    ? (path.isAbsolute(args.patchDir) ? args.patchDir : path.join(repoRoot, args.patchDir))
    : path.join(htRoot, "Patches");

  ensureDir(templatesRoot);
  ensureDir(patchDirAbs);

  const patchFileAbs = path.join(patchDirAbs, stamp + "-" + slugify(targetRel) + ".json");

  let patchObj;

  if (args.mode === "write" || args.mode === "writeFromTemplate") {
    if (!args.contentFile) {
      console.error("ERROR: mode=write requiere --content-file <archivo>");
      process.exit(1);
    }

    const contentAbs = path.isAbsolute(args.contentFile) ? args.contentFile : path.join(repoRoot, args.contentFile);
    if (!fs.existsSync(contentAbs)) {
      console.error("ERROR: content-file no existe: " + contentAbs);
      process.exit(1);
    }

    const content = readTextUtf8(contentAbs);

    const tplAbs = path.join(templatesRoot, targetRel.replace(/\//g, path.sep));
    writeTextUtf8(tplAbs, content);

    patchObj = {
      id,
      description: args.desc,
      enabled: true,
      files: [
        {
          path: targetRel,
          action: "writeFromTemplate",
          template: targetRel
        }
      ]
    };
  } else if (args.mode === "replaceExact") {
    if (!args.specFile) {
      console.error("ERROR: mode=replaceExact requiere --spec-file <json>");
      process.exit(1);
    }

    const specAbs = path.isAbsolute(args.specFile) ? args.specFile : path.join(repoRoot, args.specFile);
    if (!fs.existsSync(specAbs)) {
      console.error("ERROR: spec-file no existe: " + specAbs);
      process.exit(1);
    }

    let spec;
    try {
      spec = JSON.parse(readTextUtf8(specAbs));
    } catch (e) {
      console.error("ERROR: spec-file JSON invalido: " + specAbs);
      console.error("Detalle: " + String(e && e.message ? e.message : e));
      process.exit(1);
    }

    patchObj = {
      id,
      description: args.desc,
      enabled: true,
      files: [
        {
          path: targetRel,
          action: "replaceExact",
          find: String(spec.find || ""),
          replace: String(spec.replace || ""),
          expect: typeof spec.expect === "number" ? spec.expect : undefined,
          firstOnly: spec.firstOnly === true,
          applyGlossary: spec.applyGlossary === true
        }
      ]
    };
  } else if (args.mode === "repair") {
    patchObj = {
      id,
      description: args.desc,
      enabled: true,
      files: [
        {
          path: targetRel,
          action: "repairWithGlossary"
        }
      ]
    };
  } else {
    console.error("ERROR: mode desconocido: " + String(args.mode));
    process.exit(1);
  }

  writeJsonUtf8(patchFileAbs, patchObj);

  console.log("ONESHOT_PATCH: " + patchFileAbs);

  if (args.apply) {
    const patcherArgs = [
      patcherAbs,
      "--only-patch",
      "--patch",
      patchFileAbs
    ];

    if (args.dryRun) patcherArgs.push("--dry-run");

    const r = childProcess.spawnSync("node", patcherArgs, {
      cwd: repoRoot,
      stdio: "inherit"
    });

    if (typeof r.status === "number" && r.status !== 0) {
      process.exit(r.status);
    }
  }
}

main();
