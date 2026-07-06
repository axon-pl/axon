// Builds a single self-contained rpg.standalone.html with all JS inlined.
const fs   = require('fs')
const path = require('path')
const root = path.resolve(__dirname, '..')

const js  = fs.readFileSync(path.join(root, 'demo', 'rpg.synth.js'), 'utf8')
const axn = fs.readFileSync(path.join(root, 'examples', 'rpg.syn'), 'utf8')
const src = fs.readFileSync(path.join(root, 'demo', 'rpg.html'),    'utf8')

const lineCount = s => s.replace(/\n$/, '').split('\n').length
const axnLines = lineCount(axn)
const jsLines  = lineCount(js)
const pageSub  = `${axnLines} lines Synth · ${jsLines} lines JS · 50-battle marathon · pure game logic`

const inlineScript = `<script>
${js}

    render_game('game');
  </script>`

let standalone = src
  // Inject live line counts into page chrome
  .replace(
    /(<div class="page-sub" id="page-sub">)[\s\S]*?(<\/div>)/,
    `$1${pageSub}$2`
  )
  // Remove source viewer section
  .replace(/\s*<div class="source-section">[\s\S]*?<\/div>\s*(?=\s*<footer)/g, '\n  ')
  // Remove source-related CSS
  .replace(/\/\* ── Source viewer[\s\S]*?(?=\/\* ── Footer)/g, '')
  // Remove external scripts and the page's inline bootstrap; replace with inlined game
  .replace(
    /\s*<script src="rpg\.synth\.js"><\/script>\s*<script src="rpg\.sources\.js"><\/script>\s*<script>[\s\S]*?<\/script>\s*/,
    `\n\n  ${inlineScript}\n\n`
  )

fs.writeFileSync(path.join(root, 'demo', 'rpg.standalone.html'), standalone, 'utf8')

// Verify the inlined script parses
const scriptMatch = standalone.match(/<script>([\s\S]*)<\/script>/)
if (!scriptMatch) {
  console.error('✗ No inline script found in standalone output')
  process.exit(1)
}
try {
  new Function(scriptMatch[1])
} catch (err) {
  console.error('✗ Standalone script has a syntax error:', err.message)
  process.exit(1)
}

const size = (fs.statSync(path.join(root, 'demo', 'rpg.standalone.html')).size / 1024).toFixed(1)
console.log(`✓ Wrote demo/rpg.standalone.html  (${size} KB, fully self-contained)`)
console.log(`  Chrome: ${pageSub}`)
