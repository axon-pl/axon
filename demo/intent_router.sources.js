const RouteCopy = (intent, label, reply) => ({ intent, label, reply });

let ROUTE_COPY = [{intent: "exit", label: "Exit", reply: "Goodbye — session closed."}, {intent: "greet", label: "Greeting", reply: "Hey! What can I help you with today?"}, {intent: "help", label: "Help / Docs", reply: "Opening the docs — try the Quick Start section."}, {intent: "billing", label: "Billing / Refund", reply: "Routing you to billing support for refunds and charges."}, {intent: "bug", label: "Bug Report", reply: "Thanks for the report — filing a bug ticket."}, {intent: "pricing", label: "Pricing", reply: "Here are the current plans and upgrade options."}];

const find_copy = (intent) => $find(ROUTE_COPY, (r) => r.intent == intent);

/**
 * @param {string} msg
 * @returns {string}
 */
const route_intent = (msg) => ((_m) => {
  if (_m === "quit") return "exit";
  if (_m === "exit") return "exit";
  if (_m === "bye") return "exit";
  const __li = $likely_best(_m, ["greeting hello hi hey", "help how do I docs documentation", "refund billing charge money back payment", "bug crash error broken not working", "pricing cost plan subscribe upgrade"], 0.28);
  if (__li === 0) return "greet";
  if (__li === 1) return "help";
  if (__li === 2) return "billing";
  if (__li === 3) return "bug";
  if (__li === 4) return "pricing";
  return "unknown";
})(msg);

/**
 * @param {string} intent
 * @returns {string}
 */
const route_label = (intent) => {
  let hit = find_copy(intent);
  return hit ? hit.label : "Unknown";
};

/**
 * @param {string} intent
 * @returns {string}
 */
const route_reply = (intent) => {
  let hit = find_copy(intent);
  return hit ? hit.reply : "I am not sure — try rephrasing, or say help.";
};

/**
 * @param {string} msg
 * @returns {__object__}
 */
const handle_message = (msg) => {
  let intent = route_intent(msg);
  return {intent, label: route_label(intent), reply: route_reply(intent)};
};

