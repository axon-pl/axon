/** @param {number} v @returns {boolean} */
const __validate_Gold = (v) => v >= 0;
/** @param {number} v @returns {boolean} */
const __validate_XP = (v) => v >= 0;
/** @param {number} v @returns {boolean} */
const __validate_HP = (v) => (v >= 0) && (v <= 999);
/** @param {number} v @returns {boolean} */
const __validate_StatValue = (v) => (v >= 1) && (v <= 50);
/** @param {number} v @returns {boolean} */
const __validate_Level = (v) => (v >= 1) && (v <= 20);
/** @param {string} v @returns {boolean} */
const __validate_HeroName = (v) => v.length > 0;
/** @param {string} v @returns {boolean} */
const __validate_ClassName = (v) => v.length > 0;
/** @typedef {{
 *   name: string,
 *   heroClass: string,
 *   hp: number,
 *   maxHp: number,
 *   baseStrength: number,
 *   baseDefense: number,
 *   level: number,
 *   xp: number,
 *   alive: boolean,
 *   weapon: *,
 *   armor: *
 * }} Hero
 */
const Hero = (name, heroClass, hp, maxHp, baseStrength, baseDefense, level, xp, alive, weapon, armor) => ({ name, heroClass, hp, maxHp, baseStrength, baseDefense, level, xp, alive, weapon, armor });
/** @typedef {{
 *   id: string,
 *   name: string,
 *   hp: number,
 *   maxHp: number,
 *   attack: number,
 *   defense: number,
 *   weakness: string,
 *   xpReward: number,
 *   goldReward: number,
 *   alive: boolean
 * }} Enemy
 */
const Enemy = (id, name, hp, maxHp, attack, defense, weakness, xpReward, goldReward, alive) => ({ id, name, hp, maxHp, attack, defense, weakness, xpReward, goldReward, alive });
/** @typedef {{
 *   id: string,
 *   name: string,
 *   slot: string,
 *   atkBonus: number,
 *   defBonus: number,
 *   price: number,
 *   forClass: string,
 *   desc: string
 * }} Equipment
 */
const Equipment = (id, name, slot, atkBonus, defBonus, price, forClass, desc) => ({ id, name, slot, atkBonus, defBonus, price, forClass, desc });
/** @typedef {{
 *   id: string,
 *   name: string,
 *   effect: string,
 *   power: number,
 *   price: number,
 *   count: number
 * }} Item
 */
const Item = (id, name, effect, power, price, count) => ({ id, name, effect, power, price, count });
const hp_bar = (hp, maxHp) => {
  let filled = maxHp > 0 ? $max(Math, 0, Math.round(hp / maxHp * 10)) : 0;
  let bar = $map($range(0, 10), i => i < filled ? "#" : ".");
  return bar.join("");
};
const xp_bar = (xp, xpNext) => {
  let filled = xpNext > 0 ? $max(Math, 0, Math.round(xp / xpNext * 8)) : 8;
  let bar = $map($range(0, 8), i => i < filled ? "*" : ".");
  return bar.join("");
};
const xp_to_next = (() => {
  const __cache = new Map();
  return (level) => {
    const __key = JSON.stringify([level]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return ((_m) => (_m === 1) ? 150 : (_m === 2) ? 340 : (_m === 3) ? 600 : (_m === 4) ? 950 : (_m === 5) ? 1400 : (_m === 6) ? 2000 : (_m === 7) ? 2750 : (_m === 8) ? 3700 : (_m === 9) ? 4900 : (_m === 10) ? 6400 : (_m === 11) ? 8200 : (_m === 12) ? 10500 : (_m === 13) ? 13200 : (_m === 14) ? 16500 : 99999)(level);
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();
const weapon_atk = (w) => w ? w.atkBonus : 0;
const armor_def = (a) => a ? a.defBonus : 0;
const effective_str = (() => {
  const __cache = new Map();
  return (hero) => {
    const __key = JSON.stringify([hero]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return hero.baseStrength + weapon_atk(hero.weapon);
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();
const effective_def = (() => {
  const __cache = new Map();
  return (hero) => {
    const __key = JSON.stringify([hero]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return hero.baseDefense + armor_def(hero.armor);
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();
const format_hero_line = (hero) => {
  let bar = hp_bar(hero.hp, hero.maxHp);
  let title = level_title(hero.heroClass, hero.level);
  let sym = class_symbol(hero.heroClass);
  return `${sym} ${hero.name} Lv.${hero.level} ${title}  [${bar}] ${hero.hp}/${hero.maxHp} HP`;
};
const format_xp_line = (hero) => {
  let bar = xp_bar(hero.xp, xp_to_next(hero.level));
  let next = xp_to_next(hero.level);
  return `   XP [${bar}] ${hero.xp}/${next}`;
};
const format_equip_line = (hero) => {
  let wName = hero.weapon?.name ?? "bare hands";
  let aName = hero.armor?.name ?? "no armor";
  return `   ${wName} / ${aName}`;
};
const fmt_attack = (attacker, means, outcome, defender, dmg) => outcome === "misses" ? `${attacker} misses ${defender} with ${means}!` : `${attacker} ${outcome} ${defender} with ${means} for ${dmg}!`;
const fmt_dmg_detail = (atk, bonus, mitigation, source, isCrit, finalDmg) => {
  let powerPart = bonus > 0 ? `ATK ${atk} + elem ${bonus}` : `ATK ${atk}`;
  let armorPart = mitigation > 0 ? `, ${source} -${mitigation}` : ", no armor reduction";
  let critPart = isCrit ? ", critical x2" : "";
  return `  [${powerPart}${armorPart}${critPart} → ${finalDmg} dmg]`;
};
const fmt_death = (name) => `  ${name} has fallen.`;
const fmt_level_up = (name, lv) => `** ${name} reached level ${lv}! **`;
const fmt_heal = (name, item, hp) => `  ${name} drinks ${item}, restoring ${hp} HP.`;
const fmt_revive = (name, item) => `  ${name} is revived by ${item}!`;
const mage_spell = (weaponId) => ((_m) => (_m === "app_staff") ? "Spark Bolt" : (_m === "arcane_staff") ? "Arcane Lance" : (_m === "arcane_tome") ? "Rune Barrage" : (_m === "soul_staff") ? "Soulfire" : "Magic Missile")(weaponId);
const attack_means = (hero) => ((_m) => (_m === "mage") ? hero.weapon?.id ? mage_spell(hero.weapon.id) : "Magic Missile" : hero.weapon?.name ?? "bare hands")(hero.heroClass);
const level_title = (heroClass, level) => ((_m) => (_m === "mage") ? ((_m) => (_m < 3) ? "Apprentice" : (_m < 6) ? "Adept" : (_m < 9) ? "Evoker" : (_m < 12) ? "Archmage" : "Archon")(level) : (_m === "knight") ? ((_m) => (_m < 3) ? "Squire" : (_m < 6) ? "Knight" : (_m < 9) ? "Champion" : (_m < 12) ? "Paladin" : "Paragon")(level) : (_m === "ranger") ? ((_m) => (_m < 3) ? "Scout" : (_m < 6) ? "Tracker" : (_m < 9) ? "Hunter" : (_m < 12) ? "Warden" : "Pathfinder")(level) : ((_m) => (_m < 3) ? "Novice" : (_m < 6) ? "Adept" : (_m < 9) ? "Veteran" : (_m < 12) ? "Hero" : "Legend")(level))(heroClass);
const class_symbol = (heroClass) => ((_m) => (_m === "mage") ? "[M]" : (_m === "knight") ? "[K]" : (_m === "ranger") ? "[R]" : "[?]")(heroClass);
const combat_outcome_label = (roll) => ((_m) => (_m >= 20) ? "PERFECT STRIKE on" : (_m >= 18) ? "CRITICAL HIT on" : (_m >= 8) ? "hits" : (_m >= 3) ? "grazes" : "misses")(roll);
const hp_status_label = (hp, maxHp) => {
  let pct = maxHp > 0 ? hp * 100 / maxHp : 0;
  return ((_m) => ((n) => (n <= 0) ? "DEAD" : ((n) => (n <= 20) ? "CRITICAL" : ((n) => (n <= 45) ? "Wounded" : ((n) => (n <= 70) ? "Hurt" : "Healthy")(_m))(_m))(_m))(_m))(pct);
};
__synth_tests.push({ desc: "level_title: mage lv1 = Apprentice", fn: () => level_title("mage", 1) === "Apprentice" });
__synth_tests.push({ desc: "level_title: mage lv10 = Archmage", fn: () => level_title("mage", 10) === "Archmage" });
__synth_tests.push({ desc: "level_title: knight lv7 = Champion", fn: () => level_title("knight", 7) === "Champion" });
__synth_tests.push({ desc: "level_title: ranger lv15 = Pathfinder", fn: () => level_title("ranger", 15) === "Pathfinder" });
__synth_tests.push({ desc: "class_symbol: mage = [M]", fn: () => class_symbol("mage") === "[M]" });
__synth_tests.push({ desc: "class_symbol: ranger = [R]", fn: () => class_symbol("ranger") === "[R]" });
__synth_tests.push({ desc: "combat_outcome: roll 20 = PERFECT", fn: () => combat_outcome_label(20).includes("PERFECT") });
__synth_tests.push({ desc: "combat_outcome: roll 5 = grazes", fn: () => combat_outcome_label(5) === "grazes" });
__synth_tests.push({ desc: "combat_outcome: roll 1 = misses", fn: () => combat_outcome_label(1) === "misses" });
__synth_tests.push({ desc: "hp_status_label: 0 = DEAD", fn: () => hp_status_label(0, 100) === "DEAD" });
__synth_tests.push({ desc: "hp_status_label: 15 = CRITICAL", fn: () => hp_status_label(15, 100) === "CRITICAL" });
__synth_tests.push({ desc: "hp_status_label: 80 = Healthy", fn: () => hp_status_label(80, 100) === "Healthy" });
__synth_tests.push({ desc: "element_bonus: mage vs arcane = 9", fn: () => element_bonus("mage", "arcane") === 9 });
__synth_tests.push({ desc: "element_bonus: knight vs light = 4", fn: () => element_bonus("knight", "light") === 4 });
__synth_tests.push({ desc: "element_bonus: no match = 0", fn: () => element_bonus("mage", "fire") === 7 });
const element_bonus = (heroClass, weakness) => ((_m) => (_m === "mage") ? ((_m) => (_m === "arcane") ? 9 : (_m === "fire") ? 7 : (_m === "light") ? 8 : 0)(weakness) : (_m === "ranger") ? ((_m) => (_m === "nature") ? 7 : (_m === "cold") ? 5 : (_m === "thunder") ? 8 : 0)(weakness) : (_m === "knight") ? ((_m) => (_m === "physical") ? 6 : (_m === "light") ? 4 : 0)(weakness) : 0)(heroClass);
const can_class_equip = (heroClass, forClass) => ((_m) => (_m === "all") ? true : (_m === "mage") ? heroClass === "mage" : (_m === "knight") ? heroClass === "knight" : (_m === "ranger") ? heroClass === "ranger" : false)(forClass);
const weakness_label = (weakness) => ((_m) => (_m === "arcane") ? "Weak to ARCANE   [mage +9]" : (_m === "fire") ? "Weak to FIRE     [mage +7, ranger +0]" : (_m === "light") ? "Weak to LIGHT    [mage +8, knight +4]" : (_m === "thunder") ? "Weak to THUNDER  [ranger +8]" : (_m === "nature") ? "Weak to NATURE   [ranger +7]" : (_m === "cold") ? "Weak to COLD     [ranger +5]" : (_m === "physical") ? "Weak to PHYSICAL [knight +6]" : "No known weakness")(weakness);
const item_label = (effect, power) => ((_m) => (_m === "heal") ? `Restore ${power} HP (one hero)` : (_m === "healAll") ? `Restore ${power} HP (all heroes)` : (_m === "revive") ? "Revive fallen hero" : (_m === "damage") ? `Deal ${power} damage` : "—")(effect);
const damage_breakdown = (atk, def, bonus, roll) => {
  let mitigation = Math.floor(def / 2);
  let power = atk + bonus;
  let afterArmor = $max(Math, 1, power - mitigation);
  let isCrit = roll >= 18;
  let mult = isCrit ? 2 : 1;
  let finalDmg = $max(Math, 1, afterArmor * mult);
  return { atk, bonus, power, mitigation, afterArmor, isCrit, finalDmg };
};
const compute_damage = (() => {
  const __cache = new Map();
  return (atk, def, bonus, roll) => {
    const __key = JSON.stringify([atk, def, bonus, roll]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return damage_breakdown(atk, def, bonus, roll).finalDmg;
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();
const armor_source = (defender) => defender.armor ? defender.armor.name : "defense";
const battle_gold = (baseReward) => Math.floor(baseReward * 5 / 4);
const apply_damage = (entity, dmg) => {
  let newHp = $max(Math, 0, entity.hp - dmg);
  return { ...entity, hp: newHp, alive: newHp > 0 };
};
const apply_heal = (hero, amount) => {
  let newHp = $min(Math, hero.maxHp, hero.hp + amount);
  return { ...hero, hp: newHp };
};
const apply_revive = (hero, hp) => {
  let revHp = $min(Math, hero.maxHp, hp);
  return { ...hero, hp: revHp, alive: true };
};
const apply_level_up = (hero) => {
  let newLevel = hero.level + 1;
  let hpGain = 12;
  let newMax = hero.maxHp + hpGain;
  return {
  ...hero,
  level: newLevel,
  xp: hero.xp - xp_to_next(hero.level),
  maxHp: newMax,
  hp: $min(Math, hero.hp + hpGain, newMax),
  baseStrength: hero.baseStrength + 1,
  baseDefense: hero.baseDefense + 1
};
};
const maybe_level_up = (hero) => hero.xp >= xp_to_next(hero.level) && hero.level < 20 ? apply_level_up(hero) : hero;
const award_xp = (hero, xpGained) => hero.alive ? maybe_level_up({ ...hero, xp: hero.xp + xpGained }) : hero;
const alive_heroes = (party) => $filter(party, __x => __x.alive);
const party_hp = (party) => $sum($map($filter(party, __x => __x.alive), __x => __x.hp));
const any_alive = (party) => $any(party, __x => __x.alive);
const hero_names = (party) => $map($filter(party, __x => __x.alive), __x => __x.name);
const rest_party = (party) => $map(party, h => h.alive ? { ...h, hp: $min(Math, h.maxHp, h.hp + 50) } : h);
const create_hero = (name, heroClass, hp, strength, defense, level) => {
  if (!__validate_HeroName(name)) throw new Error(`SynthConstraintError: name violates HeroName constraint (got ${JSON.stringify(name)})`);
  if (!__validate_ClassName(heroClass)) throw new Error(`SynthConstraintError: heroClass violates ClassName constraint (got ${JSON.stringify(heroClass)})`);
  if (!__validate_HP(hp)) throw new Error(`SynthConstraintError: hp violates HP constraint (got ${JSON.stringify(hp)})`);
  if (!__validate_StatValue(strength)) throw new Error(`SynthConstraintError: strength violates StatValue constraint (got ${JSON.stringify(strength)})`);
  if (!__validate_StatValue(defense)) throw new Error(`SynthConstraintError: defense violates StatValue constraint (got ${JSON.stringify(defense)})`);
  if (!__validate_Level(level)) throw new Error(`SynthConstraintError: level violates Level constraint (got ${JSON.stringify(level)})`);
  return ({
  name,
  heroClass,
  hp,
  maxHp: hp,
  baseStrength: strength,
  baseDefense: defense,
  level,
  xp: 0,
  alive: true,
  weapon: null,
  armor: null
});
};
const all_enemies = (() => {
  const __cache = new Map();
  return () => {
    const __key = JSON.stringify([]);
    if (__cache.has(__key)) return __cache.get(__key);
    const __result = (() => {
      return [{
  id: "goblin",
  name: "Goblin Scout",
  hp: 40,
  maxHp: 40,
  attack: 6,
  defense: 2,
  weakness: "fire",
  xpReward: 22,
  goldReward: 10,
  alive: true
}, {
  id: "bandit",
  name: "Forest Bandit",
  hp: 54,
  maxHp: 54,
  attack: 8,
  defense: 3,
  weakness: "thunder",
  xpReward: 34,
  goldReward: 14,
  alive: true
}, {
  id: "spider",
  name: "Giant Spider",
  hp: 64,
  maxHp: 64,
  attack: 9,
  defense: 4,
  weakness: "fire",
  xpReward: 47,
  goldReward: 18,
  alive: true
}, {
  id: "wolf",
  name: "Dire Wolf",
  hp: 74,
  maxHp: 74,
  attack: 11,
  defense: 4,
  weakness: "thunder",
  xpReward: 62,
  goldReward: 22,
  alive: true
}, {
  id: "bog_witch",
  name: "Bog Witch",
  hp: 80,
  maxHp: 80,
  attack: 14,
  defense: 5,
  weakness: "light",
  xpReward: 78,
  goldReward: 26,
  alive: true
}, {
  id: "swamp_troll",
  name: "Swamp Troll",
  hp: 90,
  maxHp: 90,
  attack: 11,
  defense: 7,
  weakness: "fire",
  xpReward: 96,
  goldReward: 30,
  alive: true
}, {
  id: "lizard",
  name: "Stone Lizard",
  hp: 102,
  maxHp: 102,
  attack: 12,
  defense: 9,
  weakness: "thunder",
  xpReward: 115,
  goldReward: 34,
  alive: true
}, {
  id: "orc",
  name: "Orc Raider",
  hp: 112,
  maxHp: 112,
  attack: 15,
  defense: 8,
  weakness: "light",
  xpReward: 136,
  goldReward: 38,
  alive: true
}, {
  id: "troll_brute",
  name: "Troll Brute",
  hp: 128,
  maxHp: 128,
  attack: 13,
  defense: 11,
  weakness: "fire",
  xpReward: 158,
  goldReward: 43,
  alive: true
}, {
  id: "warlord",
  name: "Forest Warlord",
  hp: 240,
  maxHp: 240,
  attack: 19,
  defense: 12,
  weakness: "light",
  xpReward: 380,
  goldReward: 90,
  alive: true
}, {
  id: "skeleton",
  name: "Skeleton Warrior",
  hp: 122,
  maxHp: 122,
  attack: 16,
  defense: 8,
  weakness: "light",
  xpReward: 182,
  goldReward: 48,
  alive: true
}, {
  id: "archer",
  name: "Undead Archer",
  hp: 132,
  maxHp: 132,
  attack: 20,
  defense: 7,
  weakness: "light",
  xpReward: 204,
  goldReward: 52,
  alive: true
}, {
  id: "cursed_kn",
  name: "Cursed Knight",
  hp: 148,
  maxHp: 148,
  attack: 18,
  defense: 13,
  weakness: "light",
  xpReward: 228,
  goldReward: 57,
  alive: true
}, {
  id: "shadow",
  name: "Shadow Wraith",
  hp: 138,
  maxHp: 138,
  attack: 23,
  defense: 9,
  weakness: "light",
  xpReward: 254,
  goldReward: 62,
  alive: true
}, {
  id: "bone_golem",
  name: "Bone Golem",
  hp: 170,
  maxHp: 170,
  attack: 17,
  defense: 17,
  weakness: "thunder",
  xpReward: 282,
  goldReward: 68,
  alive: true
}, {
  id: "wight",
  name: "Wight Sorcerer",
  hp: 155,
  maxHp: 155,
  attack: 26,
  defense: 10,
  weakness: "light",
  xpReward: 312,
  goldReward: 74,
  alive: true
}, {
  id: "vampire",
  name: "Vampire Spawn",
  hp: 165,
  maxHp: 165,
  attack: 29,
  defense: 11,
  weakness: "light",
  xpReward: 344,
  goldReward: 80,
  alive: true
}, {
  id: "wraith_kn",
  name: "Wraith Knight",
  hp: 185,
  maxHp: 185,
  attack: 26,
  defense: 15,
  weakness: "light",
  xpReward: 378,
  goldReward: 87,
  alive: true
}, {
  id: "guardian",
  name: "Tomb Guardian",
  hp: 205,
  maxHp: 205,
  attack: 24,
  defense: 19,
  weakness: "thunder",
  xpReward: 414,
  goldReward: 95,
  alive: true
}, {
  id: "crypt_lord",
  name: "Crypt Lord",
  hp: 380,
  maxHp: 380,
  attack: 33,
  defense: 17,
  weakness: "light",
  xpReward: 820,
  goldReward: 155,
  alive: true
}, {
  id: "cave_troll",
  name: "Cave Troll",
  hp: 215,
  maxHp: 215,
  attack: 27,
  defense: 17,
  weakness: "fire",
  xpReward: 450,
  goldReward: 100,
  alive: true
}, {
  id: "rock_elem",
  name: "Rock Elemental",
  hp: 235,
  maxHp: 235,
  attack: 25,
  defense: 22,
  weakness: "thunder",
  xpReward: 490,
  goldReward: 106,
  alive: true
}, {
  id: "deep_gnome",
  name: "Deep Gnome",
  hp: 200,
  maxHp: 200,
  attack: 33,
  defense: 14,
  weakness: "light",
  xpReward: 532,
  goldReward: 112,
  alive: true
}, {
  id: "magma_crab",
  name: "Magma Crab",
  hp: 252,
  maxHp: 252,
  attack: 29,
  defense: 24,
  weakness: "thunder",
  xpReward: 576,
  goldReward: 118,
  alive: true
}, {
  id: "lava_wurm",
  name: "Lava Wurm",
  hp: 268,
  maxHp: 268,
  attack: 34,
  defense: 19,
  weakness: "thunder",
  xpReward: 622,
  goldReward: 125,
  alive: true
}, {
  id: "crystal",
  name: "Crystal Golem",
  hp: 295,
  maxHp: 295,
  attack: 30,
  defense: 28,
  weakness: "thunder",
  xpReward: 670,
  goldReward: 133,
  alive: true
}, {
  id: "abyssal",
  name: "Abyssal Crawler",
  hp: 275,
  maxHp: 275,
  attack: 37,
  defense: 21,
  weakness: "fire",
  xpReward: 720,
  goldReward: 141,
  alive: true
}, {
  id: "iron_hound",
  name: "Iron Hound",
  hp: 290,
  maxHp: 290,
  attack: 39,
  defense: 23,
  weakness: "thunder",
  xpReward: 772,
  goldReward: 150,
  alive: true
}, {
  id: "earth_titan",
  name: "Earth Titan",
  hp: 328,
  maxHp: 328,
  attack: 35,
  defense: 29,
  weakness: "thunder",
  xpReward: 826,
  goldReward: 160,
  alive: true
}, {
  id: "stone_col",
  name: "Stone Colossus",
  hp: 580,
  maxHp: 580,
  attack: 46,
  defense: 31,
  weakness: "thunder",
  xpReward: 1300,
  goldReward: 240,
  alive: true
}, {
  id: "hellhound",
  name: "Hellhound",
  hp: 338,
  maxHp: 338,
  attack: 41,
  defense: 25,
  weakness: "light",
  xpReward: 880,
  goldReward: 162,
  alive: true
}, {
  id: "fire_imp",
  name: "Fire Imp",
  hp: 305,
  maxHp: 305,
  attack: 47,
  defense: 21,
  weakness: "thunder",
  xpReward: 936,
  goldReward: 170,
  alive: true
}, {
  id: "lava_golem",
  name: "Lava Golem",
  hp: 370,
  maxHp: 370,
  attack: 43,
  defense: 32,
  weakness: "thunder",
  xpReward: 994,
  goldReward: 178,
  alive: true
}, {
  id: "demon",
  name: "Demon Soldier",
  hp: 352,
  maxHp: 352,
  attack: 49,
  defense: 27,
  weakness: "light",
  xpReward: 1054,
  goldReward: 187,
  alive: true
}, {
  id: "chaos_witch",
  name: "Chaos Witch",
  hp: 322,
  maxHp: 322,
  attack: 56,
  defense: 23,
  weakness: "light",
  xpReward: 1116,
  goldReward: 196,
  alive: true
}, {
  id: "inf_drake",
  name: "Infernal Drake",
  hp: 398,
  maxHp: 398,
  attack: 51,
  defense: 33,
  weakness: "thunder",
  xpReward: 1180,
  goldReward: 207,
  alive: true
}, {
  id: "nightmare",
  name: "Nightmare Beast",
  hp: 382,
  maxHp: 382,
  attack: 58,
  defense: 29,
  weakness: "light",
  xpReward: 1246,
  goldReward: 218,
  alive: true
}, {
  id: "void_stalker",
  name: "Void Stalker",
  hp: 410,
  maxHp: 410,
  attack: 61,
  defense: 31,
  weakness: "light",
  xpReward: 1314,
  goldReward: 230,
  alive: true
}, {
  id: "soul_dev",
  name: "Soul Devourer",
  hp: 440,
  maxHp: 440,
  attack: 59,
  defense: 36,
  weakness: "light",
  xpReward: 1384,
  goldReward: 242,
  alive: true
}, {
  id: "archdemon",
  name: "Archdemon",
  hp: 780,
  maxHp: 780,
  attack: 72,
  defense: 39,
  weakness: "light",
  xpReward: 2100,
  goldReward: 380,
  alive: true
}, {
  id: "lich_guard",
  name: "Lich Guard",
  hp: 452,
  maxHp: 452,
  attack: 63,
  defense: 37,
  weakness: "light",
  xpReward: 1456,
  goldReward: 255,
  alive: true
}, {
  id: "death_kn",
  name: "Death Knight",
  hp: 495,
  maxHp: 495,
  attack: 67,
  defense: 40,
  weakness: "light",
  xpReward: 1530,
  goldReward: 270,
  alive: true
}, {
  id: "bone_dragon",
  name: "Bone Dragon",
  hp: 535,
  maxHp: 535,
  attack: 65,
  defense: 44,
  weakness: "fire",
  xpReward: 1606,
  goldReward: 286,
  alive: true
}, {
  id: "soul_reaper",
  name: "Soul Reaper",
  hp: 508,
  maxHp: 508,
  attack: 73,
  defense: 38,
  weakness: "light",
  xpReward: 1684,
  goldReward: 302,
  alive: true
}, {
  id: "void_lev",
  name: "Void Leviathan",
  hp: 575,
  maxHp: 575,
  attack: 71,
  defense: 46,
  weakness: "thunder",
  xpReward: 1764,
  goldReward: 320,
  alive: true
}, {
  id: "shadow_col",
  name: "Shadow Colossus",
  hp: 615,
  maxHp: 615,
  attack: 77,
  defense: 42,
  weakness: "light",
  xpReward: 1846,
  goldReward: 338,
  alive: true
}, {
  id: "dark_pal",
  name: "Dark Paladin",
  hp: 588,
  maxHp: 588,
  attack: 83,
  defense: 48,
  weakness: "light",
  xpReward: 1930,
  goldReward: 357,
  alive: true
}, {
  id: "undead_drag",
  name: "Undead Dragon",
  hp: 675,
  maxHp: 675,
  attack: 81,
  defense: 50,
  weakness: "fire",
  xpReward: 2016,
  goldReward: 378,
  alive: true
}, {
  id: "lich_aspect",
  name: "Lich Aspect",
  hp: 720,
  maxHp: 720,
  attack: 89,
  defense: 47,
  weakness: "light",
  xpReward: 2104,
  goldReward: 400,
  alive: true
}, {
  id: "ancient_lich",
  name: "Ancient Lich",
  hp: 1200,
  maxHp: 1200,
  attack: 100,
  defense: 55,
  weakness: "light",
  xpReward: 6000,
  goldReward: 1200,
  alive: true
}];
    })();
    __cache.set(__key, __result);
    return __result;
  };
})();
const make_enemy = (stageNum) => all_enemies()[stageNum];
const enemy_art = (id) => ((_m) => (_m === "warlord") ? ["   /[=]\\   ", "  (>.<)    ", "  /| |\\   ", "  |___|   ", "  // \\\\   "] : (_m === "crypt_lord") ? ["  .oOo.  ", " (X   X) ", "  [|o|]  ", "   |||   ", "   |||   "] : (_m === "stone_col") ? ["  #####  ", "  #O O#  ", "  #-_-#  ", "  #####  ", "  # # #  "] : (_m === "archdemon") ? ["  /\\**/\\  ", " (>|  |<)", "  |||||  ", "  \\|  |/ ", "   ||||  "] : (_m === "ancient_lich") ? ["    _____   ", "   (X   X)  ", "   |  v  |  ", "    \\___/   ", "   /|   |\\ "] : (_m === "goblin") ? ["    (^_^)   ", "   \\|___|/  ", "    |   |   ", "   / \\ / \\  "] : (_m === "wolf") ? ["   ,v.v,   ", "  (> . <)  ", "   )   (   ", "   mm mm   "] : (_m === "bog_witch") ? ["   /^.^\\   ", "  ( -.- )  ", "   |\\|/|   ", "   |   |   "] : (_m === "orc") ? ["  {O   O}  ", "  | \\^/ |  ", "   \\   /   ", "   |___|   "] : (_m === "troll_brute") ? ["  {O     O}", "  |   !   |", "   \\  W  / ", "   |     | "] : (_m === "skeleton") ? ["   _+_   ", "  (x.x)  ", "  /| |\\  ", "   | |   "] : (_m === "shadow") ? ["  ~   ~  ", " (~.~)   ", "  |||||  ", "   | |   "] : (_m === "vampire") ? ["  ,*-*,  ", "  (>.>)  ", "  /|O|\\  ", "   | |   "] : (_m === "guardian") ? ["  [|||]  ", "  (X.X)  ", "  /|+|\\  ", "  |___|  "] : (_m === "cave_troll") ? ["  ,--,   ", " (0  0)  ", " /|##|\\  ", " [_____] "] : (_m === "rock_elem") ? ["  ###    ", " (#.#)   ", " |###|   ", " [___]   "] : (_m === "magma_crab") ? ["  /VVV\\  ", " (o. .o) ", " |=====| ", " //   \\\\ "] : (_m === "lava_wurm") ? ["   ~^^^~ ", "  (O.O)  ", "  ))|(( ", "  \\/|\\/  "] : (_m === "earth_titan") ? ["  ######  ", "  #O  O#  ", "  # -- #  ", "  ######  ", "  ##  ##  "] : (_m === "hellhound") ? ["   .v.v.  ", "  (>..<)  ", "  ))   (( ", "  mm  mm  "] : (_m === "inf_drake") ? ["   /^-^\\   ", "  / 0.0 \\  ", " < >   < > ", "  \\_____/  ", "  //   \\\\ "] : (_m === "chaos_witch") ? ["  ,*^*,  ", "  (*.*) ", "  /|+|\\  ", "  |   |  "] : (_m === "nightmare") ? ["  /\\  /\\  ", " ( 0  0)  ", "  \\====/ ", "   ||||  "] : (_m === "void_stalker") ? ["  ... ..  ", "  .X..X.  ", "  ......  ", "  . .. .  "] : (_m === "lich_guard") ? ["  [=|=]  ", "  (X X)  ", "  /|#|\\  ", "  |___|  "] : (_m === "death_kn") ? ["  [|||]  ", "  (=X=)  ", "  /|+|\\  ", "  [___]  "] : (_m === "bone_dragon") ? ["  /^___^\\  ", " ( X . X ) ", "  |     |  ", "  \\/   \\/  ", "  //   \\\\ "] : (_m === "dark_pal") ? ["  [###]  ", "  (X.X)  ", "  |[*]|  ", "  [___]  "] : (_m === "undead_drag") ? ["  /^===^\\  ", " ( X . X ) ", "  |=====|  ", "  \\/   \\/  ", "  //   \\\\ "] : (_m === "lich_aspect") ? ["    __---__ ", "   (X     X)", "   |  -=-  |", "    \\-----/ ", "   /|     |\\ "] : ["  ~^^^~  ", "  (o.o)  ", "   )|(   ", "  [___]  "])(id);
const hero_art = (name) => ((_m) => (_m === "Aria") ? ["   ,*,   ", "  (o.o)  ", "  /|~|\\  ", "  // \\\\ "] : (_m === "Theron") ? ["  [| |]  ", "  (=.=)  ", "  |[#]|  ", "  [___]  "] : (_m === "Lyra") ? ["   /^\\   ", "  (-_-)  ", "   >|<   ", "  / | \\  "] : ["  [???]  "])(name);
const hero_art_mini = (name) => ((_m) => (_m === "Aria") ? "(o.o)" : (_m === "Theron") ? "(=.=)" : (_m === "Lyra") ? "(-_-)" : "(?.?)")(name);
const equip_icon = (id) => ((_m) => (_m === "iron_sword") ? "[/] " : (_m === "app_staff") ? "[i] " : (_m === "shortbow") ? "[)] " : (_m === "steel_sword") ? "[S] " : (_m === "arcane_staff") ? "[|] " : (_m === "longbow") ? "[D] " : (_m === "silver_blade") ? "[*] " : (_m === "arcane_tome") ? "[T] " : (_m === "hunter_bow") ? "[>] " : (_m === "dragon_sword") ? "[X] " : (_m === "soul_staff") ? "[S] " : (_m === "storm_bow") ? "[Z] " : (_m === "chainmail") ? "[#] " : (_m === "silk_robe") ? "[~] " : (_m === "ranger_vest") ? "[^] " : (_m === "battle_plate") ? "[=] " : (_m === "void_robe") ? "[V] " : (_m === "elven_cloak") ? "[>] " : (_m === "dragon_scale") ? "[X] " : (_m === "archmage_robe") ? "[M] " : (_m === "shadow_cloak") ? "[s] " : (_m === "minor_pot") ? "(o) " : (_m === "major_pot") ? "(.) " : (_m === "mega_pot") ? "(O) " : (_m === "tonic") ? "[t] " : (_m === "elixir") ? "[E] " : (_m === "phoenix") ? "<+> " : (_m === "phoenix_fth") ? "<*> " : (_m === "fire_scroll") ? "[F] " : (_m === "thunder_orb") ? "[Z] " : (_m === "inferno") ? "[B] " : "[ ] ")(id);
const format_equip_with_icons = (hero) => {
  let wIcon = hero.weapon?.id ? equip_icon(hero.weapon.id) : "--- ";
  let aIcon = hero.armor?.id ? equip_icon(hero.armor.id) : "--- ";
  let wName = hero.weapon?.name ?? "bare hands";
  let aName = hero.armor?.name ?? "no armor";
  return `${wIcon}${wName}  ·  ${aIcon}${aName}`;
};
const stage_name = (stageNum) => {
  let chapter = stageNum < 10 ? "Ch.I  The Wilds" : stageNum < 20 ? "Ch.II  The Ruins" : stageNum < 30 ? "Ch.III The Deep" : stageNum < 40 ? "Ch.IV  The Abyss" : "Ch.V   The Sanctum";
  let bossTag = stageNum === 9 || stageNum === 19 || stageNum === 29 || stageNum === 39 || stageNum === 49 ? "  [BOSS]" : "";
  let displayNum = stageNum + 1;
  return `${chapter} — Stage ${displayNum}/50${bossTag}`;
};
const shop_weapons = () => [{
  id: "iron_sword",
  name: "Iron Sword",
  slot: "weapon",
  atkBonus: 5,
  defBonus: 0,
  price: 80,
  forClass: "knight",
  desc: "ATK +5"
}, {
  id: "app_staff",
  name: "Apprentice Staff",
  slot: "weapon",
  atkBonus: 5,
  defBonus: 0,
  price: 75,
  forClass: "mage",
  desc: "ATK +5"
}, {
  id: "shortbow",
  name: "Shortbow",
  slot: "weapon",
  atkBonus: 5,
  defBonus: 0,
  price: 78,
  forClass: "ranger",
  desc: "ATK +5"
}, {
  id: "steel_sword",
  name: "Steel Sword",
  slot: "weapon",
  atkBonus: 10,
  defBonus: 0,
  price: 175,
  forClass: "knight",
  desc: "ATK +10"
}, {
  id: "arcane_staff",
  name: "Arcane Staff",
  slot: "weapon",
  atkBonus: 10,
  defBonus: 0,
  price: 168,
  forClass: "mage",
  desc: "ATK +10"
}, {
  id: "longbow",
  name: "Longbow",
  slot: "weapon",
  atkBonus: 10,
  defBonus: 0,
  price: 170,
  forClass: "ranger",
  desc: "ATK +10"
}, {
  id: "silver_blade",
  name: "Silver Blade",
  slot: "weapon",
  atkBonus: 18,
  defBonus: 0,
  price: 320,
  forClass: "knight",
  desc: "ATK +18"
}, {
  id: "arcane_tome",
  name: "Arcane Tome",
  slot: "weapon",
  atkBonus: 18,
  defBonus: 0,
  price: 305,
  forClass: "mage",
  desc: "ATK +18"
}, {
  id: "hunter_bow",
  name: "Hunter Bow",
  slot: "weapon",
  atkBonus: 17,
  defBonus: 0,
  price: 310,
  forClass: "ranger",
  desc: "ATK +17"
}, {
  id: "dragon_sword",
  name: "Dragonbone Sword",
  slot: "weapon",
  atkBonus: 30,
  defBonus: 0,
  price: 500,
  forClass: "knight",
  desc: "ATK +30"
}, {
  id: "soul_staff",
  name: "Soul Staff",
  slot: "weapon",
  atkBonus: 30,
  defBonus: 0,
  price: 485,
  forClass: "mage",
  desc: "ATK +30"
}, {
  id: "storm_bow",
  name: "Stormbow",
  slot: "weapon",
  atkBonus: 28,
  defBonus: 0,
  price: 490,
  forClass: "ranger",
  desc: "ATK +28"
}];
const shop_armors = () => [{
  id: "chainmail",
  name: "Chain Mail",
  slot: "armor",
  atkBonus: 0,
  defBonus: 9,
  price: 160,
  forClass: "knight",
  desc: "DEF +9"
}, {
  id: "silk_robe",
  name: "Silk Robe",
  slot: "armor",
  atkBonus: 0,
  defBonus: 8,
  price: 145,
  forClass: "mage",
  desc: "DEF +8"
}, {
  id: "ranger_vest",
  name: "Ranger Vest",
  slot: "armor",
  atkBonus: 0,
  defBonus: 8,
  price: 150,
  forClass: "ranger",
  desc: "DEF +8"
}, {
  id: "battle_plate",
  name: "Battle Plate",
  slot: "armor",
  atkBonus: 0,
  defBonus: 17,
  price: 340,
  forClass: "knight",
  desc: "DEF +17"
}, {
  id: "void_robe",
  name: "Void Robe",
  slot: "armor",
  atkBonus: 0,
  defBonus: 15,
  price: 295,
  forClass: "mage",
  desc: "DEF +15"
}, {
  id: "elven_cloak",
  name: "Elven Cloak",
  slot: "armor",
  atkBonus: 0,
  defBonus: 15,
  price: 305,
  forClass: "ranger",
  desc: "DEF +15"
}, {
  id: "dragon_scale",
  name: "Dragon Scale",
  slot: "armor",
  atkBonus: 0,
  defBonus: 28,
  price: 580,
  forClass: "knight",
  desc: "DEF +28"
}, {
  id: "archmage_robe",
  name: "Archmage Robe",
  slot: "armor",
  atkBonus: 0,
  defBonus: 24,
  price: 510,
  forClass: "mage",
  desc: "DEF +24"
}, {
  id: "shadow_cloak",
  name: "Shadow Cloak",
  slot: "armor",
  atkBonus: 0,
  defBonus: 25,
  price: 525,
  forClass: "ranger",
  desc: "DEF +25"
}];
const shop_potions = () => [{
  id: "minor_pot",
  name: "Minor Potion",
  desc: "Restore 80 HP  (1 hero)",
  effect: "heal",
  power: 80,
  price: 20,
  count: 1
}, {
  id: "major_pot",
  name: "Major Potion",
  desc: "Restore 180 HP (1 hero)",
  effect: "heal",
  power: 180,
  price: 48,
  count: 1
}, {
  id: "mega_pot",
  name: "Mega Potion",
  desc: "Restore 400 HP (1 hero)",
  effect: "heal",
  power: 400,
  price: 105,
  count: 1
}, {
  id: "tonic",
  name: "Party Tonic",
  desc: "Restore 80 HP  (all heroes)",
  effect: "healAll",
  power: 80,
  price: 65,
  count: 1
}, {
  id: "elixir",
  name: "Elixir",
  desc: "Restore 220 HP (all heroes)",
  effect: "healAll",
  power: 220,
  price: 155,
  count: 1
}];
const shop_battle_items = () => [{
  id: "phoenix",
  name: "Phoenix Dust",
  desc: "Revive fallen hero (60 HP)",
  effect: "revive",
  power: 60,
  price: 85,
  count: 1
}, {
  id: "phoenix_fth",
  name: "Phoenix Feather",
  desc: "Revive fallen hero (full)",
  effect: "revive",
  power: 9999,
  price: 220,
  count: 1
}, {
  id: "fire_scroll",
  name: "Fire Scroll",
  desc: "Deal 200 fire damage",
  effect: "damage",
  power: 200,
  price: 72,
  count: 1
}, {
  id: "thunder_orb",
  name: "Thunder Orb",
  desc: "Deal 400 thunder damage",
  effect: "damage",
  power: 400,
  price: 155,
  count: 1
}, {
  id: "inferno",
  name: "Inferno Bomb",
  desc: "Deal 800 inferno damage",
  effect: "damage",
  power: 800,
  price: 310,
  count: 1
}];
const shop_consumables = () => shop_potions().concat(shop_battle_items());
const starting_potions = () => [{
  id: "minor_pot",
  name: "Minor Potion",
  desc: "Restore 80 HP  (1 hero)",
  effect: "heal",
  power: 80,
  price: 20,
  count: 3
}, {
  id: "major_pot",
  name: "Major Potion",
  desc: "Restore 180 HP (1 hero)",
  effect: "heal",
  power: 180,
  price: 48,
  count: 1
}];
const el = (tag, attrs, ...children) => {
  let e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") {
      return e.className = v;
    } else if (k === "id") {
      return e.id = v;
    } else if (k === "disabled") {
      return e.disabled = v;
    } else if (k === "type") {
      return e.type = v;
    } else {
      return e.setAttribute(k, String(v));
    }
});
  $flat(children).forEach((child) => {
    if (typeof child === "string") {
      return e.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      return e.appendChild(child);
    }
});
  return e;
};
const render_game = (rootId) => {
  let state = {
  scene: "intro",
  introSlide: 0,
  party: [create_hero("Aria", "mage", 60, 11, 5, 1), create_hero("Theron", "knight", 80, 7, 11, 1), create_hero("Lyra", "ranger", 70, 9, 7, 1)],
  gold: 50,
  inventory: starting_potions(),
  stash: [],
  purchased: [],
  pickingFor: null,
  itemTarget: null,
  stageNum: 0,
  enemy: null,
  battleLog: [],
  battleWon: false
};
  let root = document.getElementById(rootId);
  let render = () => {
    root.innerHTML = "";
    if (state.scene === "intro") {
      render_intro();
    }
    if (state.scene === "title") {
      render_title();
    }
    if (state.scene === "town") {
      render_town();
    }
    if (state.scene === "shop") {
      render_shop();
    }
    if (state.scene === "equip") {
      render_equip();
    }
    if (state.scene === "battle") {
      render_battle();
    }
    if (state.scene === "gameover") {
      render_gameover();
    }
    if (state.scene === "victory") {
      return render_victory();
    }
};
  let go_town = () => {
    let rested = rest_party(state.party);
    state = {
  ...state,
  scene: "town",
  battleLog: [],
  battleWon: false,
  party: rested,
  pickingFor: null,
  itemTarget: null
};
    return render();
};
  let go_battle = () => {
    let e = make_enemy(state.stageNum);
    let log = [`** ${e.name} appears! **`, weakness_label(e.weakness), ""];
    state = {
  ...state,
  scene: "battle",
  enemy: e,
  battleLog: log,
  battleWon: false,
  pickingFor: null,
  itemTarget: null
};
    return render();
};
  let go = (scene) => {
    state = { ...state, scene: scene, pickingFor: null, itemTarget: null };
    return render();
};
  let do_round = () => {
    let alive = alive_heroes(state.party);
    let enemy = state.enemy;
    let log = state.battleLog.slice();
    if (alive.length > 0 && enemy.alive) {
      alive.forEach((hero) => {
        if (enemy.alive) {
          let roll = Math.floor(Math.random() * 20) + 1;
          let bonus = element_bonus(hero.heroClass, enemy.weakness);
          let outcome = combat_outcome_label(roll);
          let means = attack_means(hero);
          let missed = outcome === "misses";
          const { atk, bonus: hitBonus, mitigation, isCrit, finalDmg } = damage_breakdown(effective_str(hero), enemy.defense, bonus, roll);
          let dmg = missed ? 0 : finalDmg;
          enemy = missed ? enemy : apply_damage(enemy, dmg);
          log.push(fmt_attack(hero.name, means, outcome, enemy.name, dmg));
          missed ? 0 : log.push(fmt_dmg_detail(atk, hitBonus, mitigation, "defense", isCrit, finalDmg));
        }
});
      state = { ...state, enemy: enemy };
      if (!enemy.alive) {
        let xpGain = enemy.xpReward;
        let goldGain = battle_gold(enemy.goldReward);
        log.push("");
        log.push(`** ${enemy.name} defeated! **`);
        log.push(`Gained ${xpGain} XP and ${goldGain} gold.`);
        let oldParty = state.party;
        let newParty = $map(state.party, h => award_xp(h, xpGain));
        newParty.forEach((h) => {
          let old = oldParty.find(p => p.name === h.name);
          if (old && h.level > old.level) {
            log.push(fmt_level_up(h.name, h.level));
          }
});
        let newStage = state.stageNum + 1;
        state = {
  ...state,
  party: newParty,
  gold: state.gold + goldGain,
  stageNum: newStage,
  battleWon: true,
  battleLog: log
};
        return render();
      } else {
        let ti = Math.floor(Math.random() * alive.length);
        let target = alive[ti];
        const { atk: eAtk, bonus: eBonus, mitigation: eMit, isCrit: eCrit, finalDmg: eDmg } = damage_breakdown(enemy.attack, effective_def(target), 0, 10);
        let eArmor = armor_source(target);
        let targetDies = target.hp - eDmg <= 0;
        let newParty = $map(state.party, h => h.name === target.name ? apply_damage(h, eDmg) : h);
        log.push(fmt_attack(enemy.name, "claws", "strikes back at", target.name, eDmg));
        log.push(fmt_dmg_detail(eAtk, eBonus, eMit, eArmor, eCrit, eDmg));
        targetDies ? log.push(fmt_death(target.name)) : 0;
        state = { ...state, party: newParty, battleLog: log };
        if (!any_alive(state.party)) {
          log.push("");
          log.push("** Your entire party has fallen... **");
          state = { ...state, battleLog: log };
          return render();
        } else {
          state = { ...state, battleLog: log };
          return render();
        }
      }
    }
};
  let item_needs_target = item => item.effect === "heal" || item.effect === "revive";
  let can_target_with = (item, hero) => {
    return item.effect === "heal" ? hero.alive && hero.hp < hero.maxHp : item.effect === "revive" ? !hero.alive : false;
};
  let item_targets = item => $filter(state.party, h => can_target_with(item, h));
  let can_use_item = (item) => {
    return item.effect === "damage" ? state.scene === "battle" && state.enemy && state.enemy.alive : item.effect === "healAll" ? alive_heroes(state.party).length > 0 : item_targets(item).length > 0;
};
  let begin_use_item = (item) => {
    if (can_use_item(item)) {
      if (item_needs_target(item)) {
        state = { ...state, itemTarget: item };
        return render();
      } else {
        return use_item(item, null);
      }
    }
};
  let cancel_item_target = () => {
    state = { ...state, itemTarget: null };
    return render();
};
  let use_item = (item, hero) => {
    let validTarget = item_needs_target(item) ? hero !== null && hero !== undefined && can_target_with(item, hero) : true;
    if (can_use_item(item) && validTarget) {
      let inBattle = state.scene === "battle";
      let log = inBattle ? state.battleLog.slice() : [];
      let newInv = $filter($map(state.inventory, i => i.id === item.id ? { ...i, count: i.count - 1 } : i), i => i.count > 0);
      if (item.effect === "heal") {
        let newParty = $map(state.party, h => h.name === hero.name ? apply_heal(h, item.power) : h);
        log.push(fmt_heal(hero.name, item.name, item.power));
        state = {
  ...state,
  party: newParty,
  inventory: newInv,
  battleLog: log,
  itemTarget: null
};
        return render();
      } else if (item.effect === "healAll") {
        let newParty = $map(state.party, h => h.alive ? apply_heal(h, item.power) : h);
        log.push(`  ${item.name} — all heroes restored ${item.power} HP.`);
        state = {
  ...state,
  party: newParty,
  inventory: newInv,
  battleLog: log,
  itemTarget: null
};
        return render();
      } else if (item.effect === "revive") {
        let newParty = $map(state.party, h => h.name === hero.name ? apply_revive(h, item.power) : h);
        log.push(fmt_revive(hero.name, item.name));
        state = {
  ...state,
  party: newParty,
  inventory: newInv,
  battleLog: log,
  itemTarget: null
};
        return render();
      } else if (item.effect === "damage") {
        let newHp = $max(Math, 0, state.enemy.hp - item.power);
        let newEnemy = { ...state.enemy, hp: newHp, alive: newHp > 0 };
        log.push(`  ${item.name} — ${item.power} damage to ${state.enemy.name}!`);
        if (!newEnemy.alive) {
          log.push(`** ${state.enemy.name} defeated! **`);
          let xpGain = state.enemy.xpReward;
          let goldGain = battle_gold(state.enemy.goldReward);
          log.push(`Gained ${xpGain} XP and ${goldGain} gold.`);
          let oldParty = state.party;
          let newParty = $map(state.party, h => award_xp(h, xpGain));
          newParty.forEach((h) => {
            let old = oldParty.find(p => p.name === h.name);
            if (old && h.level > old.level) {
              log.push(fmt_level_up(h.name, h.level));
            }
});
          let newStage = state.stageNum + 1;
          state = {
  ...state,
  enemy: newEnemy,
  party: newParty,
  gold: state.gold + goldGain,
  stageNum: newStage,
  battleWon: true,
  inventory: newInv,
  battleLog: log,
  itemTarget: null
};
          return render();
        } else {
          state = {
  ...state,
  enemy: newEnemy,
  inventory: newInv,
  battleLog: log,
  itemTarget: null
};
          return render();
        }
      }
    }
};
  let render_item_target_picker = () => {
    let item = state.itemTarget;
    let panel = el("div", { class: "item-target-panel" });
    panel.appendChild(el("div", { class: "picker-label" }, `Use ${item.name} on whom?`));
    let targets = item_targets(item);
    targets.forEach((hero) => {
      let face = hero_art_mini(hero.name);
      let status = hero.alive ? `${hero.hp}/${hero.maxHp} HP` : "fallen";
      let tBtn = el("button", { class: "btn-target-hero" }, el("span", { class: "hero-face" }, face), el("span", { class: "target-name" }, hero.name), el("span", { class: "target-status dim" }, status));
      tBtn.addEventListener("click", () => {
        return use_item(item, hero);
});
      panel.appendChild(tBtn);
});
    let cancelBtn = el("button", { class: "btn-secondary" }, "CANCEL");
    cancelBtn.addEventListener("click", cancel_item_target);
    panel.appendChild(el("div", { class: "btn-row" }, cancelBtn));
    return panel;
};
  let equip_item = (hero, newEquip) => {
    let slot = newEquip.slot;
    let oldEquip = slot === "weapon" ? hero.weapon : hero.armor;
    let idx = state.stash.findIndex(e => e.id === newEquip.id);
    let trimmed = $filter(state.stash, (e, i) => i !== idx);
    let newStash = oldEquip ? trimmed.concat([oldEquip]) : trimmed;
    let newParty = $map(state.party, (h) => {
      if (h.name === hero.name) {
        let patched = slot === "weapon" ? { ...h, weapon: newEquip } : { ...h, armor: newEquip };
        return patched;
      } else {
        return h;
      }
});
    state = { ...state, party: newParty, stash: newStash, pickingFor: null };
    return render();
};
  let unequip_item = (hero, slot) => {
    let equip = slot === "weapon" ? hero.weapon : hero.armor;
    if (equip) {
      let patched = slot === "weapon" ? { ...hero, weapon: null } : { ...hero, armor: null };
      let newParty = $map(state.party, h => h.name === hero.name ? patched : h);
      state = { ...state, party: newParty, stash: state.stash.concat([equip]) };
      return render();
    }
};
  let render_equip = () => {
    let stashCount = state.stash.length;
    let stashWord = stashCount === 1 ? "item" : "items";
    let header = el("div", { class: "scene-header" }, el("span", { class: "scene-title" }, "EQUIPMENT"), el("span", { class: "gold-display" }, `Stash: ${stashCount} ${stashWord}`));
    root.appendChild(header);
    let heroGrid = el("div", { class: "equip-hero-grid" });
    state.party.forEach((hero) => {
      let artLines = hero_art(hero.name);
      let artPre = document.createElement("pre");
      artPre.className = hero.alive ? "hero-portrait" : "hero-portrait portrait-dead";
      artPre.textContent = artLines.join(`
`);
      let wIcon = hero.weapon?.id ? equip_icon(hero.weapon.id) : "   ";
      let wName = hero.weapon?.name ?? "(none)";
      let wDesc = hero.weapon?.desc ?? "";
      let wChgBtn = el("button", { class: "btn-slot" }, "CHANGE");
      let wRemBtn = el("button", { class: "btn-unequip", disabled: !hero.weapon }, "REMOVE");
      wChgBtn.addEventListener("click", () => {
        state = { ...state, pickingFor: { heroName: hero.name, slot: "weapon" } };
        return render();
});
      if (hero.weapon) {
        wRemBtn.addEventListener("click", () => {
          return unequip_item(hero, "weapon");
});
      }
      let wSlot = el("div", { class: "equip-slot" }, el("div", { class: "slot-label" }, "WEAPON"), el("div", { class: "slot-item" }, el("span", { class: "item-icon" }, wIcon), el("span", {}, wName), el("span", { class: "slot-desc" }, wDesc)), el("div", { class: "slot-btns" }, wChgBtn, wRemBtn));
      let aIcon = hero.armor?.id ? equip_icon(hero.armor.id) : "   ";
      let aName = hero.armor?.name ?? "(none)";
      let aDesc = hero.armor?.desc ?? "";
      let aChgBtn = el("button", { class: "btn-slot" }, "CHANGE");
      let aRemBtn = el("button", { class: "btn-unequip", disabled: !hero.armor }, "REMOVE");
      aChgBtn.addEventListener("click", () => {
        state = { ...state, pickingFor: { heroName: hero.name, slot: "armor" } };
        return render();
});
      if (hero.armor) {
        aRemBtn.addEventListener("click", () => {
          return unequip_item(hero, "armor");
});
      }
      let aSlot = el("div", { class: "equip-slot" }, el("div", { class: "slot-label" }, "ARMOR"), el("div", { class: "slot-item" }, el("span", { class: "item-icon" }, aIcon), el("span", {}, aName), el("span", { class: "slot-desc" }, aDesc)), el("div", { class: "slot-btns" }, aChgBtn, aRemBtn));
      let atkTotal = effective_str(hero);
      let defTotal = effective_def(hero);
      let statsStr = `ATK ${atkTotal}  DEF ${defTotal}`;
      let card = el("div", { class: "equip-hero-card" }, artPre, el("div", { class: "portrait-name" }, hero.name), el("div", { class: "portrait-class" }, class_symbol(hero.heroClass)), el("div", { class: "equip-hero-stats dim" }, statsStr), wSlot, aSlot);
      heroGrid.appendChild(card);
});
    root.appendChild(heroGrid);
    let dialog = document.getElementById("picker-dialog");
    let dialogInner = document.getElementById("picker-panel-inner");
    let backdrop = document.getElementById("picker-backdrop");
    let closePicker = () => {
      state = { ...state, pickingFor: null };
      dialog.classList.add("hidden");
      dialogInner.innerHTML = "";
      return render();
};
    if (state.pickingFor) {
      let pf = state.pickingFor;
      let hero = state.party.find(h => h.name === pf.heroName);
      let compat = $filter(state.stash, e => e.slot === pf.slot && can_class_equip(hero.heroClass, e.forClass));
      dialogInner.innerHTML = "";
      let dialogHeader = el("div", { class: "picker-dialog-header" }, el("div", { class: "picker-label" }, `Choose ${pf.slot} for ${pf.heroName}`), el("button", { class: "picker-close" }, "✕"));
      dialogHeader.querySelector(".picker-close").addEventListener("click", closePicker);
      backdrop.addEventListener("click", closePicker);
      dialogInner.appendChild(dialogHeader);
      if (compat.length === 0) {
        dialogInner.appendChild(el("div", { class: "dim" }, `No compatible ${pf.slot}s in stash. Visit the merchant.`));
      } else {
        compat.forEach((equip) => {
          let icon = equip_icon(equip.id);
          let pickBtn = el("button", { class: "btn-pick" }, el("span", { class: "item-icon" }, icon), el("span", {}, equip.name), el("span", { class: "pick-stat" }, equip.desc));
          pickBtn.addEventListener("click", () => {
            return equip_item(hero, equip);
});
          dialogInner.appendChild(pickBtn);
});
      }
      dialog.classList.remove("hidden");
    } else {
      dialog.classList.add("hidden");
      let stashPanel = el("div", { class: "stash-panel" });
      stashPanel.appendChild(el("div", { class: "panel-label" }, "STASH — UNEQUIPPED GEAR"));
      if (state.stash.length === 0) {
        stashPanel.appendChild(el("div", { class: "dim" }, "Stash is empty. Buy gear from the merchant then equip it here."));
      } else {
        state.stash.forEach((equip) => {
          let icon = equip_icon(equip.id);
          let who = equip.forClass === "all" ? "any class" : equip.forClass;
          stashPanel.appendChild(el("div", { class: "stash-item" }, el("span", { class: "item-icon" }, icon), el("span", { class: "item-name" }, equip.name), el("span", { class: "item-stats" }, equip.desc), el("span", { class: "item-for" }, who)));
});
      }
      root.appendChild(stashPanel);
    }
    let backBtn = el("button", { class: "btn-secondary" }, "BACK TO INN");
    backBtn.addEventListener("click", () => {
      return go("town");
});
    root.appendChild(el("div", { class: "btn-row" }, backBtn));
};
  let render_intro = () => {
    let slide = state.introSlide;
    let s0 = {
  title: "A LAND IN PERIL",
  text: `In the realm of ALDENMOOR, a great evil has awakened.

Crops wilt.  Rivers run backwards.
A cow in the village of Fenwick produced no milk for a week.
The cow was later found to be fine.  She was just having a moment.

The ANCIENT LICH, known as MALVRAK THE UNDYING,
has sealed himself inside a dungeon and dispatched
an army of monsters to terrorize the land.

Eyewitnesses describe the monsters as:
  - quite unpleasant
  - surprisingly chatty before attacking
  - smelled strongly of brimstone

Something must be done.
Tavern prices alone have risen 40% since the siege began.`
};
    let s1 = {
  title: "THE CALL TO ARMS",
  text: `A notice was posted on the town board at first light.

   +------------------------------------------+
   |                                          |
   |  HEROES WANTED — URGENT                  |
   |                                          |
   |  Must be willing to enter a dungeon.     |
   |  Dungeon is large.  Monsters numerous.   |
   |  Ancient Lich described as immortal.     |
   |                                          |
   |  Compensation: gold, glory, and our      |
   |  sincere and heartfelt gratitude.        |
   |  (Mostly gratitude.  Some gold.)         |
   |                                          |
   +------------------------------------------+

By midday, three heroes had replied.

The town council described this as  acceptable
and  considerably better than the zero we expected.`
};
    let s2 = {
  title: "YOUR BRAVE PARTY",
  text: `ARIA  — Mage.  Studied at the Academy for nine years.
         Specializes in arcane destruction.
         Once accidentally turned a cow into a hat.
         Has not yet lived this down.  The cow was fine.

THERON — Knight.  Valiant.  Honorable.  Extremely tall.
         Carries a shield, a sword, and the party frying pan.
         Considers the frying pan a secondary weapon.
         (Statistically, he has been right about this.)

LYRA  — Ranger.  Can speak to animals.
         The animals mostly complain about the weather.
         She passes along the parts that seem tactically useful.
         They have been mostly wrong.

Together they have 50 gold and immense self-belief.
The lich has centuries of evil, an army, and a dungeon.
50 battles. 5 chapters. 4 tiers of gear. 1 ancient evil.

We are rooting for the party.
Statistically, it could go either way.`
};
    let slides = [s0, s1, s2];
    let current = slides[slide];
    let isLast = slide >= slides.length - 1;
    let slideNum = slide + 1;
    let total = slides.length;
    root.appendChild(el("div", { class: "intro-eyebrow" }, "~ THE CHRONICLES OF ALDENMOOR ~"));
    let titleEl = el("div", { class: "intro-slide-title" }, current.title);
    root.appendChild(titleEl);
    let textBox = el("div", { class: "intro-text-box" });
    $split(current.text, `
`).forEach((line) => {
      let cls = line === "" ? "intro-spacer" : "intro-line";
      textBox.appendChild(el("div", { class: cls }, line));
});
    root.appendChild(textBox);
    root.appendChild(el("div", { class: "intro-pager dim" }, `— ${slideNum} of ${total} —`));
    let btnLabel = isLast ? "BEGIN ADVENTURE" : "NEXT  >";
    let btnCls = isLast ? "btn-primary" : "btn-intro-next";
    let advBtn = el("button", { class: btnCls }, btnLabel);
    advBtn.addEventListener("click", () => {
      if (isLast) {
        return go("title");
      } else {
        state = { ...state, introSlide: state.introSlide + 1 };
        return render();
      }
});
    let skipBtn = el("button", { class: "btn-intro-skip" }, "skip intro");
    skipBtn.addEventListener("click", () => {
      return go("title");
});
    root.appendChild(el("div", { class: "intro-btn-row" }, advBtn, skipBtn));
};
  let render_title = () => {
    let logo = `+=========================================+
|                                         |
|    A  X  O  N      R  P  G              |
|                                         |
|  An AI-native language demo             |
|  50 battles. 5 chapters. 1 Ancient Lich.|
|  Buy gear. Level up. Survive.           |
|                                         |
+=========================================+`;
    let pre = document.createElement("pre");
    pre.className = "ascii-logo";
    pre.textContent = logo;
    root.appendChild(pre);
    let rosterRow = el("div", { class: "portrait-row" });
    state.party.forEach((hero) => {
      let artLines = hero_art(hero.name);
      let artPre = document.createElement("pre");
      artPre.className = "hero-portrait";
      artPre.textContent = artLines.join(`
`);
      let card = el("div", { class: "portrait-card" }, artPre, el("div", { class: "portrait-name" }, hero.name), el("div", { class: "portrait-class" }, class_symbol(hero.heroClass)), el("div", { class: "portrait-class" }, `${hero.heroClass}  Lv.${hero.level}`));
      rosterRow.appendChild(card);
});
    root.appendChild(rosterRow);
    let info = el("div", { class: "title-info" }, el("div", { class: "dim" }, "Three heroes  ·  50 battles  ·  5 chapters  ·  4 tiers of gear"), el("div", { class: "dim" }, "All game logic written in Synth v0.4, transpiled to JavaScript."));
    root.appendChild(info);
    let startBtn = el("button", { class: "btn-primary" }, "BEGIN ADVENTURE");
    startBtn.addEventListener("click", () => {
      return go("town");
});
    root.appendChild(el("div", { class: "btn-row" }, startBtn));
};
  let render_town = () => {
    let stageName = stage_name(state.stageNum);
    let stagesLeft = 50 - state.stageNum;
    let header = el("div", { class: "scene-header" }, el("span", { class: "scene-title" }, "THE INN"), el("span", { class: "gold-display" }, `Gold: ${state.gold}`));
    root.appendChild(header);
    let stageInfo = state.stageNum < 50 ? `Next: ${stageName}` : "All fifty stages complete!";
    root.appendChild(el("div", { class: "stage-info" }, stageInfo));
    let portraitRow = el("div", { class: "portrait-row" });
    state.party.forEach((hero) => {
      let artLines = hero_art(hero.name);
      let artPre = document.createElement("pre");
      artPre.className = hero.alive ? "hero-portrait" : "hero-portrait portrait-dead";
      artPre.textContent = artLines.join(`
`);
      let hpStr = `${hero.hp}/${hero.maxHp} HP`;
      let cardCls = hero.alive ? "portrait-card" : "portrait-card portrait-dead";
      let card = el("div", { class: cardCls }, artPre, el("div", { class: "portrait-name" }, hero.name), el("div", { class: "portrait-class" }, class_symbol(hero.heroClass)), el("div", { class: "portrait-hp" }, hpStr));
      portraitRow.appendChild(card);
});
    root.appendChild(portraitRow);
    let partyPanel = el("div", { class: "party-panel" });
    state.party.forEach((hero) => {
      let rowClass = hero.alive ? "hero-row" : "hero-row hero-dead";
      let equipStr = format_equip_with_icons(hero);
      let row = el("div", { class: rowClass }, el("div", {}, format_hero_line(hero)), el("div", { class: "dim" }, format_xp_line(hero)), el("div", { class: "equip-line" }, equipStr));
      partyPanel.appendChild(row);
});
    let totalHp = party_hp(state.party);
    let aliveCount = alive_heroes(state.party).length;
    partyPanel.appendChild(el("div", { class: "party-summary" }, `Party: ${aliveCount}/3 alive · ${totalHp} HP total`));
    root.appendChild(partyPanel);
    let invPanel = el("div", { class: "inv-panel" });
    invPanel.appendChild(el("div", { class: "panel-label" }, "ITEMS"));
    if (state.inventory.length === 0) {
      invPanel.appendChild(el("div", { class: "dim" }, "No potions or items. Visit the merchant."));
    } else {
      state.inventory.forEach((item) => {
        let icon = equip_icon(item.id);
        let canUse = can_use_item(item);
        let useBtn = el("button", { class: "btn-use-item", disabled: !canUse }, "USE");
        useBtn.addEventListener("click", () => {
          return begin_use_item(item);
});
        let row = el("div", { class: "inv-item-row" }, el("span", { class: "item-icon" }, icon), el("span", { class: "inv-item-name" }, `${item.name} x${item.count}`), el("span", { class: "inv-item-desc dim" }, item.desc), useBtn);
        invPanel.appendChild(row);
});
    }
    root.appendChild(invPanel);
    if (state.itemTarget) {
      root.appendChild(render_item_target_picker());
    }
    if (state.stash.length > 0) {
      let stashSummary = el("div", { class: "inv-panel" });
      stashSummary.appendChild(el("div", { class: "panel-label" }, "GEAR STASH"));
      state.stash.forEach((equip) => {
        let icon = equip_icon(equip.id);
        stashSummary.appendChild(el("div", { class: "inv-item stash-inv-item" }, `${icon}${equip.name}  ${equip.desc}`));
});
      stashSummary.appendChild(el("div", { class: "dim stash-hint" }, "Use EQUIPMENT to assign gear to heroes."));
      root.appendChild(stashSummary);
    }
    let btnRow = el("div", { class: "btn-row" });
    let shopBtn = el("button", { class: "btn-secondary" }, "SHOP");
    let equipBtn = el("button", { class: "btn-secondary" }, "EQUIPMENT");
    shopBtn.addEventListener("click", () => {
      return go("shop");
});
    equipBtn.addEventListener("click", () => {
      return go("equip");
});
    btnRow.appendChild(shopBtn);
    btnRow.appendChild(equipBtn);
    if (state.stageNum < 50) {
      let ventureBtn = el("button", { class: "btn-primary" }, "VENTURE FORTH");
      ventureBtn.addEventListener("click", go_battle);
      btnRow.appendChild(ventureBtn);
    }
    root.appendChild(btnRow);
    let restNote = el("div", { class: "rest-note dim" }, "(Heroes recovered 25 HP resting here.)");
    root.appendChild(restNote);
};
  let render_shop = () => {
    let leave_shop = () => {
      return go("town");
};
    let leaveTop = el("button", { class: "btn-secondary" }, "LEAVE SHOP");
    leaveTop.addEventListener("click", leave_shop);
    let header = el("div", { class: "scene-header shop-header" }, el("span", { class: "scene-title" }, "MERCHANT"), el("div", { class: "header-actions" }, el("span", { class: "gold-display" }, `Gold: ${state.gold}`), leaveTop));
    root.appendChild(header);
    let buy_equip = (equip) => {
      let alreadySold = state.purchased.find(id => id === equip.id) !== undefined;
      if (!alreadySold && state.gold >= equip.price) {
        state = {
  ...state,
  gold: state.gold - equip.price,
  stash: state.stash.concat([equip]),
  purchased: state.purchased.concat([equip.id])
};
        return render();
      }
};
    let buy_item = (item) => {
      if (state.gold >= item.price) {
        let existing = state.inventory.find(i => i.id === item.id);
        let newInv = existing ? $map(state.inventory, i => i.id === item.id ? { ...i, count: i.count + 1 } : i) : state.inventory.concat([{ ...item, count: 1 }]);
        state = { ...state, gold: state.gold - item.price, inventory: newInv };
        return render();
      }
};
    let render_equip_section = (label, items) => {
      let section = el("div", { class: "shop-section" });
      section.appendChild(el("div", { class: "shop-label" }, label));
      items.forEach((equip) => {
        let sold = state.purchased.find(id => id === equip.id) !== undefined;
        let canBuy = !sold && state.gold >= equip.price;
        let forWhom = equip.forClass === "all" ? "any class" : equip.forClass;
        let btnLabel = sold ? "SOLD" : `BUY ${equip.price}g`;
        let btnCls = sold ? "btn-buy btn-sold" : "btn-buy";
        let buyBtn = el("button", { class: btnCls, disabled: !canBuy }, btnLabel);
        if (!sold) {
          buyBtn.addEventListener("click", () => {
            return buy_equip(equip);
});
        }
        let icon = equip_icon(equip.id);
        let rowCls = sold ? "shop-row shop-row-sold" : "shop-row";
        let row = el("div", { class: rowCls }, el("span", { class: "item-icon" }, icon), el("span", { class: "item-name" }, equip.name), el("span", { class: "item-stats" }, equip.desc), el("span", { class: "item-for" }, forWhom), buyBtn);
        section.appendChild(row);
});
      return section;
};
    let render_item_section = (label, items) => {
      let section = el("div", { class: "shop-section" });
      section.appendChild(el("div", { class: "shop-label" }, label));
      items.forEach((item) => {
        let canBuy = state.gold >= item.price;
        let buyBtn = el("button", { class: "btn-buy", disabled: !canBuy }, `BUY ${item.price}g`);
        buyBtn.addEventListener("click", () => {
          return buy_item(item);
});
        let icon = equip_icon(item.id);
        let row = el("div", { class: "shop-row" }, el("span", { class: "item-icon" }, icon), el("span", { class: "item-name" }, item.name), el("span", { class: "item-stats" }, item.desc), buyBtn);
        section.appendChild(row);
});
      return section;
};
    root.appendChild(render_item_section("POTIONS", shop_potions()));
    root.appendChild(render_item_section("BATTLE ITEMS", shop_battle_items()));
    root.appendChild(render_equip_section("WEAPONS", shop_weapons()));
    root.appendChild(render_equip_section("ARMOR", shop_armors()));
    let leaveBot = el("button", { class: "btn-secondary" }, "LEAVE SHOP");
    leaveBot.addEventListener("click", leave_shop);
    root.appendChild(el("div", { class: "btn-row" }, leaveBot));
};
  let render_battle = () => {
    let enemy = state.enemy;
    let alive = any_alive(state.party);
    let over = !enemy.alive || !alive;
    let artLines = enemy_art(enemy.id);
    let artPre = document.createElement("pre");
    artPre.className = "enemy-art";
    artPre.textContent = artLines.join(`
`);
    let eBar = hp_bar(enemy.hp, enemy.maxHp);
    let eInfo = el("div", { class: "enemy-info" }, el("div", { class: "enemy-name" }, enemy.name), el("div", { class: "enemy-hp" }, `[${eBar}] ${enemy.hp}/${enemy.maxHp} HP`), el("div", { class: "enemy-hint" }, weakness_label(enemy.weakness)));
    let enemyPanel = el("div", { class: "enemy-panel" }, artPre, eInfo);
    root.appendChild(enemyPanel);
    let partyPanel = el("div", { class: "party-panel" });
    state.party.forEach((hero) => {
      let face = hero_art_mini(hero.name);
      let rc = hero.alive ? "hero-row hero-row-battle" : "hero-row hero-row-battle hero-dead";
      let row = el("div", { class: rc }, el("span", { class: "hero-face" }, face), el("span", {}, format_hero_line(hero)));
      partyPanel.appendChild(row);
});
    root.appendChild(partyPanel);
    let logEl = el("div", { class: "combat-log" });
    state.battleLog.forEach((msg) => {
      logEl.appendChild(el("div", { class: "log-line" }, msg));
});
    root.appendChild(logEl);
    logEl.scrollTop = logEl.scrollHeight;
    if (state.itemTarget) {
      root.appendChild(render_item_target_picker());
    } else {
      let btnRow = el("div", { class: "btn-row" });
      if (!over) {
        let attackBtn = el("button", { class: "btn-attack" }, "ATTACK");
        attackBtn.addEventListener("click", do_round);
        btnRow.appendChild(attackBtn);
        state.inventory.forEach((item) => {
          let canUse = can_use_item(item);
          let iBtn = el("button", { class: "btn-item", disabled: !canUse }, `USE ${item.name}`);
          iBtn.addEventListener("click", () => {
            return begin_use_item(item);
});
          btnRow.appendChild(iBtn);
});
      } else if (!alive) {
        let gameOverBtn = el("button", { class: "btn-danger" }, "GAME OVER");
        gameOverBtn.addEventListener("click", () => {
          return go("gameover");
});
        btnRow.appendChild(gameOverBtn);
      } else {
        let contScene = state.stageNum >= 50 ? "victory" : "town";
        let contLabel = state.stageNum >= 50 ? "CLAIM VICTORY" : "RETURN TO INN";
        let contBtn = el("button", { class: "btn-primary" }, contLabel);
        contBtn.addEventListener("click", () => {
          if (contScene === "victory") {
            return go("victory");
          } else {
            return go_town();
          }
});
        btnRow.appendChild(contBtn);
      }
      root.appendChild(btnRow);
    }
};
  let render_gameover = () => {
    let skull = `     _____     
    /     \    
   | () () |   
    \  ^  /    
     |||||     
     |||||     `;
    let pre = document.createElement("pre");
    pre.className = "ascii-logo death";
    pre.textContent = skull;
    root.appendChild(pre);
    root.appendChild(el("div", { class: "scene-msg death" }, "ALL HEROES HAVE FALLEN"));
    root.appendChild(el("div", { class: "dim" }, "The dungeon claims another adventure."));
    let restartBtn = el("button", { class: "btn-danger" }, "TRY AGAIN");
    restartBtn.addEventListener("click", () => {
      state = {
  scene: "title",
  party: [create_hero("Aria", "mage", 60, 11, 5, 1), create_hero("Theron", "knight", 80, 7, 11, 1), create_hero("Lyra", "ranger", 70, 9, 7, 1)],
  gold: 50,
  inventory: starting_potions(),
  stash: [],
  purchased: [],
  pickingFor: null,
  itemTarget: null,
  stageNum: 0,
  enemy: null,
  battleLog: [],
  battleWon: false
};
      return render();
});
    root.appendChild(el("div", { class: "btn-row" }, restartBtn));
};
  let render_victory = () => {
    let banner = `+========================================+
|                                        |
|   V  I  C  T  O  R  Y  !               |
|                                        |
|   The Ancient Lich has been slain.     |
|   The dungeon is free.                 |
|                                        |
+========================================+`;
    let pre = document.createElement("pre");
    pre.className = "ascii-logo victory";
    pre.textContent = banner;
    root.appendChild(pre);
    let statsPanel = el("div", { class: "party-panel" });
    statsPanel.appendChild(el("div", { class: "panel-label" }, "SURVIVORS"));
    state.party.forEach((hero) => {
      if (hero.alive) {
        let rc = "hero-row";
        statsPanel.appendChild(el("div", { class: rc }, format_hero_line(hero)));
      }
});
    statsPanel.appendChild(el("div", { class: "gold-display" }, `Final Gold: ${state.gold}`));
    root.appendChild(statsPanel);
    let againBtn = el("button", { class: "btn-primary" }, "PLAY AGAIN");
    againBtn.addEventListener("click", () => {
      state = {
  scene: "title",
  party: [create_hero("Aria", "mage", 60, 11, 5, 1), create_hero("Theron", "knight", 80, 7, 11, 1), create_hero("Lyra", "ranger", 70, 9, 7, 1)],
  gold: 50,
  inventory: starting_potions(),
  stash: [],
  purchased: [],
  pickingFor: null,
  itemTarget: null,
  stageNum: 0,
  enemy: null,
  battleLog: [],
  battleWon: false
};
      return render();
});
    root.appendChild(el("div", { class: "btn-row" }, againBtn));
};
  return render();
};
