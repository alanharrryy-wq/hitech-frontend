$root=(git rev-parse --show-toplevel).Trim()
& pwsh -File (Join-Path $root "scripts/hitech-templates/ONE_SHOT.ps1") `
  -Target "scripts/hitech-templates/templates/patcher.mjs" `
  -Mode writeFromClipboard `
  -Description "patcher.mjs: fix idempotent applyWriteFromTemplate + tplRel normalize + log shims + sameText" `
  -NoOpen

