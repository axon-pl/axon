/**
 * @param {number} n
 * @returns {string}
 */
const label = (n) => ((_m) => (_m === 0) ? "zero" : "other")(n);

console.log(label(0));
