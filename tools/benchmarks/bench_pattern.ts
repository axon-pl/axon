// Benchmark: Pattern matching on tagged union types
type Shape =
  | { kind: "circle";   radius: number }
  | { kind: "rect";     width: number; height: number }
  | { kind: "triangle"; base: number;  height: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle":   return Math.PI * s.radius * s.radius;
    case "rect":     return s.width * s.height;
    case "triangle": return 0.5 * s.base * s.height;
  }
}

function describe(s: Shape): string {
  switch (s.kind) {
    case "circle":
      return s.radius > 10 ? "large circle" : "small circle";
    case "rect":
      return `rectangle ${s.width}x${s.height}`;
    case "triangle":
      return "triangle";
  }
}

const shapes: Shape[] = [
  { kind: "circle",   radius: 5 },
  { kind: "circle",   radius: 15 },
  { kind: "rect",     width: 4,  height: 6 },
  { kind: "rect",     width: 10, height: 3 },
  { kind: "triangle", base: 8,   height: 5 },
];

for (const s of shapes) {
  console.log(`${describe(s)} — area: ${area(s)}`);
}
