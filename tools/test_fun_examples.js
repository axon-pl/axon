const { Lexer } = require('../dist/lexer.js');
const { Parser } = require('../dist/parser.js');
const { Codegen } = require('../dist/codegen.js');
const { SYNTH_STDLIB } = require('../dist/stdlib.js');
const vm = require('vm');

function test(name, src) {
  const { ast, errors } = new Parser(new Lexer(src).tokenize()).parse();
  if (errors.length) {
    console.log(`FAIL [${name}] parse: ${errors[0].message}`);
    return false;
  }
  const js = new Codegen().generate(ast);
  const ctx = { console: { log: (...a) => {}, error: () => {}, warn: () => {} } };
  vm.createContext(ctx);
  vm.runInContext(SYNTH_STDLIB, ctx);
  try {
    vm.runInContext('{\n' + js + '\n}', ctx);
    console.log(`PASS [${name}]`);
    return true;
  } catch (e) {
    console.log(`FAIL [${name}] runtime: ${e.message}`);
    console.log('  JS:\n' + js.split('\n').slice(0,20).join('\n'));
    return false;
  }
}

const examples = {

hello: `console.log("Hello, World!")
console.log("...")
console.log("Actually hold on.")
console.log("Is it a good world? The evidence is mixed.")
console.log("The compiler has no opinion on the matter.")
console.log("It just runs the code and minds its business.")
console.log("")
console.log("Hello anyway. You ve earned it.")`,

vibes: `enum Vibe = Immaculate | Questionable | Concerning | CallALawyer
fn check_vibe(situation: string) -> Vibe {
  match situation {
    | "free pizza in the break room"  => Vibe.Immaculate
    | "reply-all email chain"         => Vibe.Concerning
    | "surprise all-hands at 4pm"     => Vibe.CallALawyer
    | _                               => Vibe.Questionable
  }
}
let situations = [
  "free pizza in the break room",
  "reply-all email chain",
  "surprise all-hands at 4pm",
  "monday",
]
for s in situations {
  let v     = check_vibe(s)
  let label = match v {
    | Vibe.Immaculate   => "Immaculate"
    | Vibe.Questionable => "Questionable"
    | Vibe.Concerning   => "Concerning"
    | Vibe.CallALawyer  => "Call A Lawyer"
  }
  console.log(pad_end(s, 36) + label)
}`,

password: `fn rate_password(pw: string) -> string {
  if pw.length < 6    { return "Nice try. That is just a word." }
  if pw == "password" { return "Sir. Ma am. Please." }
  if pw == "123456"   { return "Is that the combination to your luggage?" }
  if pw.length < 10   { return "A hacker s warm-up exercise." }
  if pw.length < 16   { return "Acceptable. Barely." }
  "Fort Knox energy. Respect."
}
let attempts = ["abc", "password", "123456", "letmein7", "correcthorse", "correcthorsebatterystaple"]
for p in attempts {
  console.log(pad_end(p, 32) + rate_password(p))
}`,

horoscope: `fn daily_reading(sign: string) -> string {
  match sign {
    | "aries"   => "Bold decision incoming. It will be wrong, but boldly so."
    | "libra"   => "Forty-five minutes choosing a restaurant. Wrong one."
    | "scorpio" => "Someone is thinking about you. Not in a great way."
    | _         => "The cosmos respectfully decline to comment."
  }
}
let signs = ["aries", "libra", "scorpio", "capricorn"]
for s in signs {
  console.log(to_upper(s) + ": " + daily_reading(s))
}`,

coffee: `record Order {
  customer: string
  drink:    string
  size:     string
  price:    float
}
let orders = [
  Order("Alice",   "Oat Latte",   "large",  5.50),
  Order("Bob",     "Cold Brew",   "medium", 5.00),
  Order("Eve",     "Decaf",       "large",  4.50),
]
let receipts =
  orders
    |> filter(o => o.drink != "Decaf")
    |> map(o => {
      let upcharge = match o.size {
        | "large"  => 0.75
        | "medium" => 0.25
        | _        => 0.0
      }
      let total = o.price + upcharge + 0.50
      { name: o.customer, drink: o.drink, total: total }
    })
    |> sort_by(r => r.total)
for r in receipts {
  console.log(r.name + " " + r.drink + " $" + r.total)
}
let grand = sum_by(receipts, r => r.total)
console.log("Total: $" + grand)`,

rpg: `record Fighter {
  name: string
  hp:   int
  atk:  int
}
let hero   = Fighter("Bravington the Adequate", 30, 8)
let goblin = Fighter("Slightly Irritated Goblin", 25, 6)
let mut hero_hp   = hero.hp
let mut goblin_hp = goblin.hp
let mut turn      = 1
while goblin_hp > 0 and hero_hp > 0 {
  goblin_hp -= hero.atk
  if goblin_hp <= 0 { break }
  hero_hp -= goblin.atk
  turn += 1
}
if hero_hp > 0 {
  console.log("Victory! " + hero.name + " wins with " + hero_hp + " HP remaining.")
} else {
  console.log(hero.name + " has been defeated.")
}`,

fizzbuzz: `for i in 1..=20 {
  let output = match i {
    | _ when i % 15 == 0 => "SynergyBuzz (trademark)"
    | _ when i % 3 == 0  => "Synergy"
    | _ when i % 5 == 0  => "Buzz (trademark)"
    | _                   => "" + i
  }
  console.log(output)
}`,

grab_bag: `record Box<T> {
  label:    string
  contents: T
}
fn peek<T>(b: Box<T>) -> string {
  "[ " + b.label + " ] contains: " + b.contents
}
fn rewrap<A, B>(b: Box<A>, newContents: B) -> Box<B> {
  Box(b.label, newContents)
}
let sock_box   = Box("Lost and Found", "one mystery sock")
let answer_box = Box("The Oracle", 42)
console.log(peek(sock_box))
console.log(peek(answer_box))
let upgraded = rewrap(sock_box, "closure issues and a granola bar")
console.log(peek(upgraded))
console.log(peek(sock_box))`,

roast: `let name      = "  Reginald Pumpernickel III  "
let bio       = "thought leader, synergy architect, certified disruptor"
let buzzwords = "leverage,circle-back,bandwidth,pivot,learnings"
console.log("Subject: " + trim(name))
console.log(to_upper(trim(name)))
console.log(to_lower(trim(name)))
console.log("starts_with Reg: " + starts_with(trim(name), "Reg"))
console.log("ends_with III: " + ends_with(trim(name), "III"))
console.log("contains thought leader: " + contains(bio, "thought leader"))
let words = split(buzzwords, ",")
for w in words {
  console.log(to_upper(replace_all(w, "-", " ")))
}
console.log(pad_start("2.1", 5) + " / 10")`,

stonks: `let portfolio = [
  { ticker: "SYNTH",  shares: 1_000,   buy: 9.99,    now: 42.00   },
  { ticker: "MOON",  shares: 50_000,  buy: 0.005,   now: 0.003   },
  { ticker: "YOLO",  shares: 250,     buy: 150.00,  now: 999.99  },
  { ticker: "HODL",  shares: 100_000, buy: 0.0001,  now: 0.0001  },
]
let mut total_gain = 0.0
for s in portfolio {
  let gain  = s.shares * (s.now - s.buy)
  let pct   = round((gain / (s.shares * s.buy)) * 1000) / 10
  let arrow = if gain >= 0 { "UP  " } else { "DOWN" }
  total_gain += gain
  console.log(pad_end(s.ticker, 6) + arrow + "  " + pct + "%   gain: $" + round(gain))
}
console.log("Net: $" + round(total_gain))
console.log("After fees: $" + round(total_gain * 0.65))
console.log("After taxes: $" + clamp(round(total_gain * 0.40), 0, 999_999))`,

sheep: `record Sheep {
  name:      string
  isPremium: bool
}
let flock = [
  Sheep("Wooliam",       false),
  Sheep("Baa-rack",      false),
  Sheep("Fleecy Mac",    true),
  Sheep("Sir Jumpsalot", false),
  Sheep("Premium Gary",  true),
  Sheep("Regular Dave",  false),
]
let mut counted = 0
let mut idx     = 0
while idx < flock.length {
  let sheep = flock[idx]
  idx += 1
  if sheep.isPremium {
    console.log("PREMIUM: " + sheep.name)
    continue
  }
  counted += 1
  console.log(counted + ". " + sheep.name + " jumps.")
  if counted >= 3 { break }
}
console.log("Asleep after " + counted + " sheep.")`,

};

let ok = 0, fail = 0;
for (const [name, src] of Object.entries(examples)) {
  if (test(name, src)) ok++; else fail++;
}
console.log(`\n${ok} / ${ok + fail} passed`);
if (fail > 0) process.exit(1);
