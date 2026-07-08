// Phase 10 — fixed-point proof: bootstrap v2 → v3 must be byte-identical.
// Proves the self-host loop has reached a stable fixed point.
// Run: npm run test:fixed-point

const fs   = require('fs')
const path = require('path')
const { ROOT, loadBundle, buildBootstrapBundle, validateJs } = require('./bootstrap_common')
const { runBundleParityTests, runAstConstructorTests } = require('./parity_common')

const BOOTSTRAP  = path.join(ROOT, 'dist', 'compiler.bootstrap.js')
const BOOTSTRAP2 = path.join(ROOT, 'dist', 'compiler.bootstrap2.js')
const BOOTSTRAP3 = path.join(ROOT, 'dist', 'compiler.bootstrap3.js')

function assertByteIdentical(leftPath, rightPath, label) {
  const left = fs.readFileSync(leftPath, 'utf8')
  const right = fs.readFileSync(rightPath, 'utf8')
  if (left === right) {
    console.log(`ok  ${label}: byte-identical (${left.length} bytes)`)
    return false
  }
  console.error(`FAIL ${label}: not byte-identical (${left.length}B vs ${right.length}B)`)
  let i = 0
  while (i < left.length && i < right.length && left[i] === right[i]) i++
  console.error(`  first diff at byte ${i}`)
  if (i < left.length && i < right.length) {
    console.error(`  left:  ${JSON.stringify(left.slice(i, i + 60))}`)
    console.error(`  right: ${JSON.stringify(right.slice(i, i + 60))}`)
  }
  return true
}

function testHello(bundle, label) {
  const hello = 'export fn hello() -> string { "hi" }'
  try {
    const result = bundle.compile(hello)
    const err = validateJs(result.js || '')
    if (err) {
      console.error(`FAIL ${label} hello.syn: ${err}`)
      return true
    }
    const fn = new Function(result.js + '\nreturn hello();')
    if (fn() !== 'hi') {
      console.error(`FAIL ${label} hello.syn: wrong result`)
      return true
    }
    console.log(`ok  ${label} hello.syn`)
    return false
  } catch (e) {
    console.error(`FAIL ${label} hello.syn:`, e.message)
    return true
  }
}

function main() {
  if (!fs.existsSync(BOOTSTRAP)) {
    console.error('missing dist/compiler.bootstrap.js — run npm run build:toolchain')
    process.exit(1)
  }

  let failed = false

  console.log('── fixed-point: bootstrap chain v1 → v2 → v3 ──')
  try {
    const v2 = buildBootstrapBundle(BOOTSTRAP, BOOTSTRAP2)
    console.log(`✓ v2: ${v2.lines} lines, ${v2.bytes} bytes`)
    const v3 = buildBootstrapBundle(BOOTSTRAP2, BOOTSTRAP3)
    console.log(`✓ v3: ${v3.lines} lines, ${v3.bytes} bytes`)
  } catch (e) {
    console.error('FAIL building bootstrap chain:', e.message)
    process.exit(1)
  }

  failed = assertByteIdentical(BOOTSTRAP, BOOTSTRAP2, 'v1 vs v2') || failed
  failed = assertByteIdentical(BOOTSTRAP2, BOOTSTRAP3, 'v2 vs v3 (fixed point)') || failed

  if (failed) {
    console.error('\nfixed-point: chain diverged — loop has NOT stabilized')
    process.exit(1)
  }

  console.log('\nok  fixed point reached: further self-compilation changes nothing')

  console.log('\n── bootstrap v3 parity (runtime: bootstrap3 only) ──')
  let bundle3
  try {
    bundle3 = loadBundle(BOOTSTRAP3)
  } catch (e) {
    console.error('FAIL loading bootstrap3:', e.message)
    process.exit(1)
  }

  failed = runBundleParityTests(bundle3, 'bootstrap3') || failed
  failed = runAstConstructorTests(bundle3, 'bootstrap3', BOOTSTRAP3) || failed
  failed = testHello(bundle3, 'bootstrap3') || failed

  if (failed) {
    console.error('\nfixed-point: parity FAILED on bootstrap3')
    process.exit(1)
  }
  console.log('\nfixed-point: all checks passed ✓')
}

main()
