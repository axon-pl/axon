const { Lexer } = require('../dist/lexer.js');
const { Parser } = require('../dist/parser.js');
const { Codegen } = require('../dist/codegen.js');
const stdlib = require('../dist/stdlib.js');
const vm = require('vm');

function test(name, src) {
  const { ast, errors } = new Parser(new Lexer(src).tokenize()).parse();
  if (errors.length) { console.log(`FAIL [${name}] parse: ${errors[0].message}`); return false; }
  const js = new Codegen().generate(ast);
  const ctx = { console: { log: () => {}, error: () => {}, warn: () => {} },
                setTimeout: () => {}, Promise, parseInt, parseFloat, isNaN, ...stdlib };
  vm.createContext(ctx);
  try { vm.runInContext(js, ctx); console.log(`PASS [${name}]`); return true; }
  catch (e) { console.log(`FAIL [${name}] runtime: ${e.message}\n` + js.split('\n').slice(0,15).join('\n')); return false; }
}

const ex = {

fib: `
@memo
fn fib(n: int) -> int {
  if n <= 1 { n } else { fib(n - 1) + fib(n - 2) }
}
for i in 5..=10 {
  let ratio = fib(i + 1) / fib(i)
  console.log(ratio.toFixed(9))
}
console.log(fib(50))`,

types: `
type FuelLevel   = int    where value >= 0 and value <= 100
type TempCelsius = int    where value >= -273 and value <= 500
type MissionName = string where length > 2
fn launch_status(name: MissionName, fuel: FuelLevel, temp: TempCelsius) -> string {
  match fuel {
    | f when f < 20 => name + ": ABORT"
    | f when f < 60 => name + ": HOLD - fuel low"
    | _ => match temp {
        | t when t > 80 => name + ": HOLD - too hot"
        | _             => name + ": GO FOR LAUNCH"
      }
  }
}
let missions = [
  { name: "Artemis VII", fuel: 98, temp: 21 },
  { name: "Helios II",   fuel: 45, temp: 18 },
  { name: "Axon-1",      fuel: 100, temp: 20 },
]
for m in missions { console.log(launch_status(m.name, m.fuel, m.temp)) }`,

match: `
type SpaceEvent =
  | SolarFlare      { intensity: int }
  | AsteroidPass    { distance: float }
  | GeomagneticStorm { kp: int }
  | AllClear
fn alert(event: SpaceEvent) -> string {
  match event {
    | SolarFlare { intensity } when intensity >= 9 => "X-CLASS FLARE"
    | SolarFlare { intensity }                     => "C-class flare (" + intensity + ")"
    | AsteroidPass { distance } when distance < 0.05 => "CLOSE APPROACH " + distance + " AU"
    | AsteroidPass { distance }                       => "Asteroid pass " + distance + " AU"
    | GeomagneticStorm { kp } when kp >= 7 => "SEVERE STORM kp=" + kp
    | GeomagneticStorm { kp }              => "Minor activity kp=" + kp
    | AllClear => "All clear"
  }
}
let events = [SolarFlare(9), AsteroidPass(0.03), GeomagneticStorm(8), AllClear]
for e in events { console.log(alert(e)) }`,

pipeline: `
record Track { title: string, artist: string, plays: int, genre: string }
let tracks = [
  Track("Neon Spiral",   "Synth City",  8_420_000, "synthwave"),
  Track("Binary Sun",    "Axon Sound", 12_750_000, "electronic"),
  Track("Gold Coast",    "The Drift",   3_100_000, "indie"),
  Track("Pulse Wave",    "Synth City",  6_330_000, "synthwave"),
  Track("Hollow Road",   "The Drift",   1_980_000, "indie"),
]
let chart =
  tracks
    |> filter(t => t.plays > 3_000_000)
    |> sort_by_desc(t => t.plays)
    |> map(t => {
      let m = round(t.plays / 100_000) / 10
      pad_start("" + m + "M", 8) + "  " + t.title
    })
let mut rank = 1
for entry in chart { console.log("#" + rank + " " + entry); rank += 1 }`,

errors: `
@throws
fn validate_quantity(qty: int) -> any {
  if qty <= 0 { err("Quantity must be at least 1") }
  if qty > 99 { err("Max 99, got: " + qty) }
  else { ok(qty) }
}
@throws
fn validate_item(name: string) -> any {
  if name.length == 0  { err("Item name cannot be empty") }
  if name == "nothing" { err("You cannot order nothing.") }
  else { ok(name) }
}
@throws
fn place_order(item: string, qty: int) -> any {
  let i = validate_item(item)?
  let q = validate_quantity(qty)?
  ok("Order: " + q + "x " + i)
}
fn try_order(item: string, qty: int) -> string {
  match place_order(item, qty) {
    | Ok { value }    => "OK   " + value
    | Err { message } => "FAIL " + message
  }
}
console.log(try_order("Pizza", 2))
console.log(try_order("nothing", 1))
console.log(try_order("Espresso", 0))`,

loops: `
fn is_prime(n: int) -> bool {
  if n < 2 { return false }
  for i in 2..n { if n % i == 0 { return false } }
  true
}
let mut primes = []
for n in 2..=40 { if is_prime(n) { primes = primes.concat([n]) } }
console.log(primes.join("  "))
let first5 = primes.slice(0, 5)
let mut sum = 0
let mut product = 1
for p in first5 { sum += p; product *= p }
console.log("sum=" + sum + " product=" + product)
for i in 0..primes.length - 1 {
  if primes[i + 1] - primes[i] == 2 { console.log("twin: " + primes[i] + "," + primes[i+1]) }
}`,

enums: `
enum Priority = Low | Medium | High | Critical
enum Status   = Queued | InProgress | Complete | Scrubbed
record Task { task: string, status: Status, priority: Priority }
fn format_task(t: Task) -> string {
  let icon = match t.status {
    | Status.Queued     => "[ ]"
    | Status.InProgress => "[~]"
    | Status.Complete   => "[v]"
    | Status.Scrubbed   => "[x]"
  }
  let urgency = match t.priority {
    | Priority.Critical => "!!! "
    | Priority.High     => "!!  "
    | Priority.Medium   => "!   "
    | Priority.Low      => "    "
  }
  urgency + icon + " " + t.task
}
let manifest = [
  Task("Fuel check",    Status.Complete,    Priority.Critical),
  Task("Nav calibrate", Status.InProgress,  Priority.High),
  Task("Weather check", Status.Queued,      Priority.Medium),
]
for t in manifest { console.log(format_task(t)) }
let done = filter(manifest, t => t.status == Status.Complete)
console.log(done.length + " / " + manifest.length + " complete")`,

compound: `
let mut miles   = 0
let mut fuel    = 100.0
let mut songs   = 0
let mut coffees = 0
let legs = [
  { drive: 42,  fuel_used: 8.0,  jams: 3, coffee: 1 },
  { drive: 87,  fuel_used: 15.5, jams: 5, coffee: 2 },
  { drive: 55,  fuel_used: 10.5, jams: 4, coffee: 1 },
]
for leg in legs {
  miles   += leg.drive
  fuel    -= leg.fuel_used
  songs   += leg.jams
  coffees += leg.coffee
  console.log("+" + leg.drive + " mi  fuel: " + fuel.toFixed(1) + "%")
}
let mut playlist = null
playlist ??= "Road Classics Vol. 3"
console.log("Playing: " + playlist)
let mut status = "Trip"
status += " complete. " + miles + " miles."
console.log(status)`,

stdlib: `
let raw_log = [
  "  2026-07-04 | LAUNCH    | Axon-1 lifts off  ",
  "  2026-07-05 | WARNING   | Solar flare detected  ",
  "  2026-07-06 | TELEMETRY | Orbit complete  ",
  "  2026-07-07 | WARNING   | Micrometeorite alert  ",
]
let entries =
  raw_log
    |> map(line => trim(line))
    |> map(line => {
      let parts = split(line, " | ")
      { date: parts[0], type: trim(parts[1]), msg: trim(parts[2]) }
    })
for e in entries {
  let tag = pad_end("[" + e.type + "]", 13)
  console.log(e.date + "  " + tag + "  " + e.msg)
}
let warnings = filter(entries, e => e.type == "WARNING")
console.log(warnings.length + " warnings")
let days = uniq(map(entries, e => e.date))
console.log(days.length + " days logged")`,

multilambda: `
record Recipe { name: string, ingredients: int, time_mins: int, skill: int }
let cookbook = [
  Recipe("Scrambled Eggs",   3,   8, 1),
  Recipe("Pasta Carbonara",  5,  25, 2),
  Recipe("Chicken Tikka",   14,  60, 3),
  Recipe("Beef Wellington", 12, 180, 5),
  Recipe("Toast",            1,   3, 1),
]
let ranked =
  cookbook
    |> filter(r => {
      let manageable = r.time_mins <= 200
      let not_trivial = r.skill >= 2
      manageable && not_trivial
    })
    |> map(r => {
      let effort = (r.ingredients * 2) + (r.time_mins / 10) + (r.skill * 5)
      let label  = match r.skill {
        | 2 => "easy"
        | 3 => "medium"
        | _ => "chef"
      }
      { name: r.name, effort: effort, label: label }
    })
    |> sort_by(r => r.effort)
for r in ranked {
  console.log(pad_end(r.name, 20) + "[" + r.label + "] effort=" + r.effort)
}`,

};

let ok = 0, fail = 0;
for (const [name, src] of Object.entries(ex)) {
  if (test(name, src)) ok++; else fail++;
}
console.log(`\n${ok} / ${ok+fail} passed`);
if (fail > 0) process.exit(1);
