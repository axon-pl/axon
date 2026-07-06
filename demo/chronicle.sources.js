/** @store Kingdom — reactive state boundary (v0.8) */
const Kingdom = (() => {
  let _state = { day: 1, season: "spring", weather: "clear", events: [], running: false, speed: 900 };
  const _subs = [];
  return {
    get day() { return _state.day; },
    get season() { return _state.season; },
    get weather() { return _state.weather; },
    get events() { return _state.events; },
    get running() { return _state.running; },
    get speed() { return _state.speed; },
    set(patch) {
      _state = Object.assign({}, _state, patch);
      for (const __fn of _subs) __fn(_state);
    },
    subscribe(fn) { _subs.push(fn); fn(_state); },
  };
})();

/**
 * @pure — no side effects
 * @param {number} day
 * @returns {string}
 */
const season_for = (day) => {
  let idx = Math.floor(day / 91) % 4;
  if (idx == 0) {
    return "spring";
  } else if (idx == 1) {
    return "summer";
  } else if (idx == 2) {
    return "autumn";
  } else {
    return "winter";
  }
};

/**
 * @pure — no side effects
 * @param {number} day
 * @param {string} season
 * @returns {string}
 */
const weather_for = (day, season) => {
  let seed = (day * 2654435761 + 7) % 100;
  return ((_m) => (_m === "winter") ? seed < 45 ? "snow" : seed < 75 ? "frost" : "blizzard" : (_m === "summer") ? seed < 50 ? "clear" : seed < 80 ? "haze" : "drought" : (_m === "spring") ? seed < 40 ? "rain" : seed < 70 ? "clear" : "fog" : seed < 50 ? "clear" : "cloudy")(season);
};

/**
 * @pure — no side effects
 * @param {number} day
 * @param {string} weather
 * @returns {string}
 */
const event_for = (day, weather) => {
  let seed = (day * 1103515245 + 12345) % 64;
  let base = ((_m) => (_m === 0) ? "A merchant caravan arrived bearing exotic spices from the east" : (_m === 1) ? "The blacksmith forged a blade of legendary steel by moonlight" : (_m === 2) ? "Scouts reported strange lights dancing in the northern woods" : (_m === 3) ? "The harvest exceeded all expectations — granaries overflow" : (_m === 4) ? "A traveling bard performed forgotten tales of the old wars" : (_m === 5) ? "The council ratified sweeping new trade agreements" : (_m === 6) ? "A dragon silhouette crossed the mountain pass at dusk" : (_m === 7) ? "The healers guild opened their doors to the poor and sick" : (_m === 8) ? "A grand feast was held in the great keep" : (_m === 9) ? "The watchtower bell rang out — riders approach the gates" : (_m === 10) ? "A stranger arrived at the inn bearing an unusual map" : (_m === 11) ? "The kingdom's coffers swelled with a fresh tax levy" : (_m === 12) ? "A temple ceremony drew pilgrims from distant lands" : (_m === 13) ? "The royal astronomers charted a new comet in the sky" : (_m === 14) ? "Border skirmishes erupted along the eastern frontier" : (_m === 15) ? "A mysterious plague struck the livestock in the valley" : (_m === 16) ? "The mages guild completed their great tower after ten years" : (_m === 17) ? "Refugees from the southern war sought shelter at the gates" : (_m === 18) ? "The king's champion defeated a challenger in the arena" : (_m === 19) ? "An ancient ruin was uncovered beneath the city streets" : (_m === 20) ? "The river flooded, sweeping away the old mill bridge" : (_m === 21) ? "A new vein of silver was struck deep in the mountain mines" : (_m === 22) ? "The thieves guild was dismantled in a midnight raid" : (_m === 23) ? "A diplomatic envoy arrived bearing gifts from the northern court" : (_m === 24) ? "The royal library received a shipment of forbidden tomes" : (_m === 25) ? "A giant wolf was spotted prowling the outer farms at night" : (_m === 26) ? "The shipwrights launched the kingdom's greatest warship" : (_m === 27) ? "Rebels were routed at the crossroads by the royal guard" : (_m === 28) ? "The old hermit of the forest gave a cryptic prophecy" : (_m === 29) ? "A fire broke out in the merchant quarter before dawn" : (_m === 30) ? "The queen's advisor was found dead under strange circumstances" : (_m === 31) ? "A jousting tournament drew nobles from across the realm" : (_m === 32) ? "The harvest festival filled the streets with song and light" : (_m === 33) ? "An earthquake cracked the citadel's eastern wall" : (_m === 34) ? "The salt trade was monopolized by a powerful merchant guild" : (_m === 35) ? "A pair of white ravens delivered a message from unknown lands" : (_m === 36) ? "The alchemists produced a metal harder than iron" : (_m === 37) ? "Three knights went missing on the road to the eastern chapel" : (_m === 38) ? "The aqueduct burst, flooding the lower district for three days" : (_m === 39) ? "A peace treaty was signed after years of border conflict" : (_m === 40) ? "The master cartographer unveiled a new map of the known world" : (_m === 41) ? "Wolves descended from the highlands and raided the sheepfolds" : (_m === 42) ? "The new bridge over the river was dedicated with celebration" : (_m === 43) ? "A shipment of rare dyes arrived from across the sea" : (_m === 44) ? "The crown prince returned from his grand tour of the realm" : (_m === 45) ? "An arcane storm twisted the weather for seven strange days" : (_m === 46) ? "The miners uncovered a sealed vault deep beneath the old fort" : (_m === 47) ? "A wandering knight pledged their sword to the kingdom's cause" : (_m === 48) ? "The census revealed the kingdom's population had doubled" : (_m === 49) ? "A plague of locusts devoured three fields before being driven off" : (_m === 50) ? "The arena hosted its grandest gladiatorial spectacle in years" : (_m === 51) ? "A child was born under a double rainbow — heralded as blessed" : (_m === 52) ? "The nomads of the plains offered tribute and asked for alliance" : (_m === 53) ? "A mysterious ship docked at port bearing no flag and no crew" : (_m === 54) ? "The court jester was arrested for revealing a royal secret" : (_m === 55) ? "A new road was completed linking the capital to the coast" : (_m === 56) ? "The royal hound returned alone after weeks missing in the wilds" : (_m === 57) ? "Bandits seized the northern pass, demanding toll from travellers" : (_m === 58) ? "The cathedral bells rang without any hand to pull the ropes" : (_m === 59) ? "An ambassador demanded reparations for last season's raid" : (_m === 60) ? "The council voted to expand the city walls to the river" : (_m === 61) ? "The old oracle emerged from solitude and spoke of change" : (_m === 62) ? "Three merchant ships were lost in the straits in one night" : "The kingdom rested in an unusual quiet")(seed);
  return ((_m) => (_m === "snow") ? base + " — braving the heavy snowfall" : (_m === "rain") ? base + " — beneath relentless rain" : (_m === "drought") ? base + " — under the scorching drought" : (_m === "blizzard") ? base + " — through a raging blizzard" : (_m === "frost") ? base + " — as frost crept across the stone" : (_m === "fog") ? base + " — shrouded in thick morning fog" : (_m === "haze") ? base + " — under a hazy, oppressive sky" : base)(weather);
};

const season_icon = (season) => ((_m) => (_m === "spring") ? "🌸" : (_m === "summer") ? "☀️" : (_m === "autumn") ? "🍂" : (_m === "winter") ? "❄️" : "🌍")(season);

const weather_icon = (weather) => ((_m) => (_m === "clear") ? "☀️" : (_m === "rain") ? "🌧" : (_m === "snow") ? "❄️" : (_m === "fog") ? "🌫" : (_m === "frost") ? "🧊" : (_m === "haze") ? "🌫" : (_m === "blizzard") ? "🌨" : (_m === "drought") ? "🌵" : "🌤")(weather);

/**
 * @async
 * @effects timer
 * @returns {*}
 */
const tick = async () => {
  if (!Kingdom.running) {
    return undefined;
  }
  let next_day = Kingdom.day + 1;
  let next_season = season_for(next_day);
  let next_weather = weather_for(next_day, next_season);
  let event = event_for(next_day, next_weather);
  let prev = Kingdom.events;
  let next_events = [event, ...prev].slice(0, 10);
  Kingdom.set({
  day: next_day,
  season: next_season,
  weather: next_weather,
  events: next_events
});
  await synth_delay(Kingdom.speed);
  tick();
  return undefined;
};

/**
 * @returns {*}
 */
const start = () => {
  Kingdom.set({ running: true, events: [] });
  tick();
  return undefined;
};

/**
 * @returns {*}
 */
const pause = () => Kingdom.set({ running: false });

/**
 * @param {number} ms
 * @returns {*}
 */
const set_speed = (ms) => Kingdom.set({ speed: ms });

/**
 * @returns {*}
 */
const render = () => {
  let day = Kingdom.day;
  let season = Kingdom.season;
  let weather = Kingdom.weather;
  let events = Kingdom.events;
  let running = Kingdom.running;
  document.getElementById("chr-header").innerHTML = season_icon(season) + " " + season + " &nbsp;·&nbsp; " + weather_icon(weather) + " " + weather;
  document.getElementById("chr-day").textContent = "Day " + day;
  document.getElementById("chr-log").innerHTML = synth_map(events, e => "<div class=\"chr-entry\">" + e + "</div>").join("");
  document.getElementById("chr-status").textContent = running ? "● RUNNING" : "○ PAUSED";
  return document.getElementById("chr-status").className = "chr-status " + (running ? "running" : "paused");
};

Kingdom.subscribe(() => {
  render();
});

