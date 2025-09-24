import { defineStore } from 'pinia'

export type Cell = { col: number; row: number }

export const GRID = {
  colWidth: 300,
  rowHeight: 200,
  gutterX: 16,
  gutterY: 16,
  COLS: 3,
  ROWS: 3,
  get stepX() { return this.colWidth + this.gutterX },
  get stepY() { return this.rowHeight + this.gutterY }
}

export const useSnapGridStore = defineStore('snapGrid', () => {
  const cellToId = ref({} as Record<string, string>)
  const cells = ref({} as Record<string, Cell>)
  const maxCols = ref(3)

  function updateMaxCols(containerPx?: number) {
    const width = containerPx ?? window.innerWidth
    maxCols.value = Math.max(1, Math.floor(width / GRID.stepX)) || 3
  }

  function key(col: number, row: number) { return `${col},${row}` }

  function release(id: string) {
    const cell = cells.value[id]
    if (!cell) return
    delete cells.value[id]
    delete cellToId.value[key(cell.col, cell.row)]
  }

  function isFree(col: number, row: number, ignoreId?: string) {
    const k = key(col, row)
    const id = cellToId.value[k]
    return !id || id === ignoreId
  }

  function placeAt(id: string, col: number, row: number) {
    release(id)
    const k = key(col, row)
    cellToId.value[k] = id
    cells.value[id] = { col, row }
  }

  function nextCell(from: Cell): Cell {
    let { col, row } = from
    col++
    if (col >= GRID.COLS) { col = 0; row++ }
    return { col, row }
  }

  // Push algorithm: put id into desired cell, recursively move occupants forward
  function requestSnap(id: string, desired: Cell): Cell {
    console.log(`[SNAP] ${id} requesting cell (${desired.col}, ${desired.row})`)
    updateMaxCols()
    
    // If the desired cell is free, just place the module there
    if (isFree(desired.col, desired.row, id)) {
      console.log(`[SNAP] Cell (${desired.col}, ${desired.row}) is free, placing ${id}`)
      placeAt(id, desired.col, desired.row)
      return { ...(cells.value[id] as Cell) }
    }
    
    // Cell is occupied, need to push the occupant
    const victimId = cellToId.value[key(desired.col, desired.row)]
    console.log(`[SNAP] Cell (${desired.col}, ${desired.row}) occupied by: ${victimId}`)
    
    if (!victimId) {
      console.log(`[SNAP] No victim found, placing ${id}`)
      placeAt(id, desired.col, desired.row)
      return { ...(cells.value[id] as Cell) }
    }
    
    // Find next available cell for the victim
    let probe = nextCell(desired)
    while (!isFree(probe.col, probe.row, victimId)) {
      probe = nextCell(probe)
      if (probe.row > 1000) {
        console.log(`[SNAP] No space found for ${victimId}, keeping original position`)
        return { ...(cells.value[id] as Cell) }
      }
    }
    
    console.log(`[SNAP] Moving ${victimId} from (${desired.col}, ${desired.row}) to (${probe.col}, ${probe.row})`)
    
    // Move the victim first
    placeAt(victimId, probe.col, probe.row)
    
    // Then place the requesting module
    console.log(`[SNAP] Placing ${id} at (${desired.col}, ${desired.row})`)
    placeAt(id, desired.col, desired.row)
    
    const result = { ...(cells.value[id] as Cell) }
    console.log(`[SNAP] Final result for ${id}:`, result)
    return result
  }

  function colRowFromPx(x: number, y: number): Cell {
    const col = Math.max(0, Math.round(x / GRID.stepX))
    const row = Math.max(0, Math.round(y / GRID.stepY))
    return { col, row }
  }

  function pxFromColRow(col: number, row: number) {
    return { x: col * GRID.stepX, y: row * GRID.stepY }
  }

  return {
    cellToId,
    cells,
    maxCols,
    updateMaxCols,
    key,
    release,
    isFree,
    placeAt,
    nextCell,
    requestSnap,
    colRowFromPx,
    pxFromColRow
  }
})


