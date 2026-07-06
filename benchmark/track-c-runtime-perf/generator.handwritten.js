'use strict'

// Hand-written idiomatic JavaScript port of examples/dungeon/generator.axn.
// Same algorithm, same LCG, same iteration order — for an identical
// (rows, cols, level, seed) it must produce byte-identical output to the
// Axon-generated code. Style differences vs the Axon output: plain function
// declarations, inline flat-array indexing instead of gget/gset helper calls,
// and no stdlib prelude / constraint machinery.

function lcg(s) {
  return ((s % 2147483648) * 1664525 + 1013904223) % 2147483648
}

function cellHash(seed, r, c) {
  const h1 = lcg(seed + r * 48271 + c * 16807)
  const h2 = lcg(h1 + c * 48271 + r * 16807)
  return lcg(h2) / 2147483648
}

function pickRoom(rows, cols, s) {
  const s1 = lcg(s)
  const maxh = Math.max(2, Math.floor(rows / 3))
  const maxw = Math.max(3, Math.floor(cols / 4))
  const h = 2 + (s1 % maxh)
  const s2 = lcg(s1)
  const w = 3 + (s2 % maxw)
  const s3 = lcg(s2)
  const r1 = 1 + (s3 % Math.max(1, rows - h - 2))
  const s4 = lcg(s3)
  const c1 = 1 + (s4 % Math.max(1, cols - w - 2))
  return { r1, c1, r2: r1 + h, c2: c1 + w }
}

const roomCr = (room) => room.r1 + Math.floor((room.r2 - room.r1) / 2)
const roomCc = (room) => room.c1 + Math.floor((room.c2 - room.c1) / 2)

function generate(rows, cols, level, seed) {
  // Flat mutable grid of tile tags, indexed data[r * cols + c].
  const data = new Array(rows * cols).fill('Wall')

  const rooms = []
  const n = 4 + (lcg(seed) % 4)

  // Step 1: carve rooms
  for (let i = 0; i < n; i++) {
    const room = pickRoom(rows, cols, lcg(seed + i * 997 + level * 113))
    rooms.push(room)
    for (let r = room.r1; r <= room.r2; r++) {
      for (let c = room.c1; c <= room.c2; c++) {
        data[r * cols + c] = 'Floor'
      }
    }
  }

  // Step 2: connect consecutive rooms with L-corridors (horizontal then vertical)
  for (let i = 0; i < n - 1; i++) {
    const r1 = roomCr(rooms[i])
    const c1 = roomCc(rooms[i])
    const r2 = roomCr(rooms[i + 1])
    const c2 = roomCc(rooms[i + 1])
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
      if (data[r1 * cols + c] === 'Wall') data[r1 * cols + c] = 'Floor'
    }
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
      if (data[r * cols + c2] === 'Wall') data[r * cols + c2] = 'Floor'
    }
  }

  // Step 3: place doors at corridor-room junctions
  for (const room of rooms) {
    const dr = room.r2 - room.r1 + 1
    const dc = room.c2 - room.c1 + 1

    // Right edge
    let ri = -1
    for (let i = 0; i < dr; i++) {
      if (ri < 0 && data[(room.r1 + i) * cols + room.c2 + 1] === 'Floor') ri = i
    }
    if (ri >= 0) {
      const r = room.r1 + ri
      const c = room.c2 + 1
      if (data[(r - 1) * cols + c] === 'Wall' && data[(r + 1) * cols + c] === 'Wall') {
        data[r * cols + c] = 'Door'
      }
    }

    // Left edge
    let li = -1
    for (let i = 0; i < dr; i++) {
      if (li < 0 && data[(room.r1 + i) * cols + room.c1 - 1] === 'Floor') li = i
    }
    if (li >= 0) {
      const r = room.r1 + li
      const c = room.c1 - 1
      if (data[(r - 1) * cols + c] === 'Wall' && data[(r + 1) * cols + c] === 'Wall') {
        data[r * cols + c] = 'Door'
      }
    }

    // Bottom edge
    let bi = -1
    for (let j = 0; j < dc; j++) {
      if (bi < 0 && data[(room.r2 + 1) * cols + room.c1 + j] === 'Floor') bi = j
    }
    if (bi >= 0) {
      const r = room.r2 + 1
      const c = room.c1 + bi
      if (data[r * cols + c - 1] === 'Wall' && data[r * cols + c + 1] === 'Wall') {
        data[r * cols + c] = 'Door'
      }
    }

    // Top edge
    let ti = -1
    for (let j = 0; j < dc; j++) {
      if (ti < 0 && data[(room.r1 - 1) * cols + room.c1 + j] === 'Floor') ti = j
    }
    if (ti >= 0) {
      const r = room.r1 - 1
      const c = room.c1 + ti
      if (data[r * cols + c - 1] === 'Wall' && data[r * cols + c + 1] === 'Wall') {
        data[r * cols + c] = 'Door'
      }
    }
  }

  // Step 4: scatter specials (Stairs in the last room)
  for (let si = 0; si < rooms.length; si++) {
    const room = rooms[si]
    const roomSeed = lcg(seed + si * 1009)
    if (si === n - 1) {
      data[roomCr(room) * cols + roomCc(room)] = 'Stairs'
    }
    const cp = 0.025
    const wp = 0.015 + Math.min(level * 0.002, 0.02)
    for (let r = room.r1; r <= room.r2; r++) {
      for (let c = room.c1; c <= room.c2; c++) {
        const rng = cellHash(roomSeed, r, c)
        if (data[r * cols + c] === 'Floor') {
          if (rng < cp) data[r * cols + c] = 'Chest'
          if (rng >= cp && rng < cp + wp) data[r * cols + c] = 'Water'
        }
      }
    }
  }

  // Step 5a: cap water at 1 per room / 3 total
  const keptWater = []
  for (const room of rooms) {
    let found = 0
    for (let r = room.r1; r <= room.r2; r++) {
      for (let c = room.c1; c <= room.c2; c++) {
        if (data[r * cols + c] === 'Water') {
          if (found === 0) {
            keptWater.push({ r, c })
            found = 1
          } else {
            data[r * cols + c] = 'Floor'
          }
        }
      }
    }
  }
  for (let idx = 0; idx < keptWater.length; idx++) {
    if (idx >= 3) data[keptWater[idx].r * cols + keptWater[idx].c] = 'Floor'
  }

  // Step 5b: clamp chest count to [2, 5]
  const chestPositions = []
  for (const room of rooms) {
    for (let r = room.r1; r <= room.r2; r++) {
      for (let c = room.c1; c <= room.c2; c++) {
        if (data[r * cols + c] === 'Chest') chestPositions.push({ r, c })
      }
    }
  }
  for (let idx = 0; idx < chestPositions.length; idx++) {
    if (idx >= 5) data[chestPositions[idx].r * cols + chestPositions[idx].c] = 'Floor'
  }
  let chestCount = Math.min(chestPositions.length, 5)
  for (let ri = 0; ri < rooms.length; ri++) {
    if (chestCount < 2 && ri < rooms.length - 1) {
      const r = roomCr(rooms[ri])
      const c = roomCc(rooms[ri])
      if (data[r * cols + c] === 'Floor') {
        data[r * cols + c] = 'Chest'
        chestCount++
      }
    }
  }

  // Step 6: torches at open floor diagonals of every door
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (data[r * cols + c] === 'Door') {
        if (r > 0 && c > 0 && data[(r - 1) * cols + c - 1] === 'Floor') data[(r - 1) * cols + c - 1] = 'Torch'
        if (r > 0 && c < cols - 1 && data[(r - 1) * cols + c + 1] === 'Floor') data[(r - 1) * cols + c + 1] = 'Torch'
        if (r < rows - 1 && c > 0 && data[(r + 1) * cols + c - 1] === 'Floor') data[(r + 1) * cols + c - 1] = 'Torch'
        if (r < rows - 1 && c < cols - 1 && data[(r + 1) * cols + c + 1] === 'Floor') data[(r + 1) * cols + c + 1] = 'Torch'
      }
    }
  }

  // Step 7: flat grid -> row-of-objects, serialized like the Axon version
  const grid = []
  for (let r = 0; r < rows; r++) {
    const row = []
    for (let c = 0; c < cols; c++) {
      const tag = data[r * cols + c]
      const passable = tag !== 'Wall' && tag !== 'Chest' && tag !== 'Water'
      row.push({ tag, passable })
    }
    grid.push(row)
  }

  return { grid: JSON.stringify(grid), rows, cols, level }
}

module.exports = { generate, lcg, cellHash }
