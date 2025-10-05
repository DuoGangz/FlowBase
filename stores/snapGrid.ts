import { defineStore } from 'pinia'

export type Cell = { col: number; row: number }

export const GRID = {
  colWidth: 540, // +20%
  rowHeight: 360, // +20%
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
  const version = ref(0)
  const dragActive = ref(false)

  // Preview state for iPhone-like live shifting that reverts when moving away
  const previewActive = ref(false)
  const previewActorId = ref<string | null>(null)
  let previewBaseCells: Record<string, Cell> | null = null
  let previewBaseCellToId: Record<string, string> | null = null
  let previewTarget: { col:number; row:number } | null = null
  let previewApproach: 'left'|'right'|'up'|'down' | null = null

  function cloneCellsMap(src: Record<string, Cell>) {
    const out: Record<string, Cell> = {}
    for (const k in src) { const c = src[k]; if (c) out[k] = { ...c } }
    return out
  }
  function cloneMap<T>(src: Record<string, T>) { return { ...src } }

  function updateMaxCols(containerPx?: number) {
    const width = containerPx ?? window.innerWidth
    // Account for the missing trailing gutter when computing columns
    maxCols.value = Math.max(1, Math.floor((width + GRID.gutterX) / GRID.stepX)) || 3
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

  // Attempt to move the occupant of a specific cell in a logical direction
  // based on the user's approach. This does NOT place the requesting id; it
  // only relocates the victim to keep layout intuitive while freely dragging.
  // approach: 'left'|'right'|'up'|'down' indicates where to push the victim.
  function proximityPush(requestorId: string, col: number, row: number, approach: 'left'|'right'|'up'|'down') {
    updateMaxCols()
    const victimId = cellToId.value[key(col, row)]
    if (!victimId || victimId === requestorId) return

    // Helper to try placing victim at a target if free
    const tryPlace = (c: number, r: number) => {
      if (c < 0 || r < 0 || c >= GRID.COLS) return false
      if (isFree(c, r, victimId)) { placeAt(victimId, c, r); return true }
      return false
    }

    // Build preferred targets (row-first where applicable)
    const candidates: Cell[] = []
    if (approach === 'left' || approach === 'right') {
      // Prefer horizontal within the same row
      if (approach === 'right') {
        for (let c = col + 1; c < GRID.COLS; c++) candidates.push({ col: c, row })
        for (let c = col - 1; c >= 0; c--) candidates.push({ col: c, row })
      } else { // 'left'
        for (let c = col - 1; c >= 0; c--) candidates.push({ col: c, row })
        for (let c = col + 1; c < GRID.COLS; c++) candidates.push({ col: c, row })
      }
      // Fallback vertical if no horizontal free cells in row
      candidates.push({ col, row: row + 1 })
      if (row > 0) candidates.push({ col, row: row - 1 })
    } else {
      // Vertical approach: prefer vertical first
      if (approach === 'down') {
        candidates.push({ col, row: row + 1 })
        if (row > 0) candidates.push({ col, row: row - 1 })
      } else { // 'up'
        if (row > 0) candidates.push({ col, row: row - 1 })
        candidates.push({ col, row: row + 1 })
      }
      // Fallback horizontal within row
      for (let c = col + 1; c < GRID.COLS; c++) candidates.push({ col: c, row })
      for (let c = col - 1; c >= 0; c--) candidates.push({ col: c, row })
    }

    // Try candidates
    for (const target of candidates) {
      if (tryPlace(target.col, target.row)) return
    }

    // Ultimate fallback: walk forward to find any free slot (legacy behavior)
    let probe = nextCell({ col, row })
    while (!isFree(probe.col, probe.row, victimId)) {
      probe = nextCell(probe)
      if (probe.row > 1000) return
    }
    placeAt(victimId, probe.col, probe.row)
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

  // ----- Preview mechanics -----
  function startPreview(actorId: string) {
    if (!previewActive.value) {
      previewBaseCells = cloneCellsMap(cells.value)
      previewBaseCellToId = cloneMap(cellToId.value)
      previewActive.value = true
      previewActorId.value = actorId
      previewTarget = null
      previewApproach = null
    } else {
      previewActorId.value = actorId
    }
  }

  function revertPreview() {
    if (!previewActive.value || !previewBaseCells || !previewBaseCellToId) return
    cellToId.value = { ...previewBaseCellToId }
    cells.value = cloneCellsMap(previewBaseCells)
    version.value++
  }

  function endPreview(commit: boolean) {
    if (!previewActive.value) return
    if (!commit) {
      revertPreview()
    } else {
      // keep current arrangement as new base
    }
    previewActive.value = false
    previewActorId.value = null
    previewBaseCells = null
    previewBaseCellToId = null
    previewTarget = null
    previewApproach = null
  }

  function getPreviewMeta() {
    return {
      active: previewActive.value,
      actorId: previewActorId.value,
      target: previewTarget ? { ...previewTarget } : null,
      approach: previewApproach
    }
  }

  function isFreeIn(arrCellToId: Record<string,string>, c:number, r:number, ignoreId?:string) {
    const id = arrCellToId[key(c,r)]
    return !id || id === ignoreId
  }

  function placeAtIn(arrCells: Record<string,Cell>, arrCellToId: Record<string,string>, id:string, c:number, r:number) {
    // remove old
    const existing = arrCells[id]
    if (existing) delete arrCellToId[key(existing.col, existing.row)]
    arrCellToId[key(c,r)] = id
    arrCells[id] = { col:c, row:r }
  }

  function moveVictimWithApproach(arrCells: Record<string,Cell>, arrCellToId: Record<string,string>, victimId:string, from:Cell, approach:'left'|'right'|'up'|'down', depth=0) {
    if (depth > 50) return // safety
    const { col, row } = from
    const tryTargets: Cell[] = []
    if (approach === 'left' || approach === 'right') {
      if (approach === 'right') {
        for (let c = col + 1; c < GRID.COLS; c++) tryTargets.push({ col:c, row })
        for (let c = col - 1; c >= 0; c--) tryTargets.push({ col:c, row })
      } else {
        for (let c = col - 1; c >= 0; c--) tryTargets.push({ col:c, row })
        for (let c = col + 1; c < GRID.COLS; c++) tryTargets.push({ col:c, row })
      }
      tryTargets.push({ col, row: row + 1 })
      if (row > 0) tryTargets.push({ col, row: row - 1 })
    } else {
      if (approach === 'down') {
        tryTargets.push({ col, row: row + 1 })
        if (row > 0) tryTargets.push({ col, row: row - 1 })
      } else {
        if (row > 0) tryTargets.push({ col, row: row - 1 })
        tryTargets.push({ col, row: row + 1 })
      }
      for (let c = col + 1; c < GRID.COLS; c++) tryTargets.push({ col:c, row })
      for (let c = col - 1; c >= 0; c--) tryTargets.push({ col:c, row })
    }
    for (const t of tryTargets) {
      if (t.col < 0 || t.row < 0 || t.col >= GRID.COLS) continue
      const occ = arrCellToId[key(t.col, t.row)]
      if (!occ) { placeAtIn(arrCells, arrCellToId, victimId, t.col, t.row); return }
    }
    // chain: pick the first candidate and move occupant
    for (const t of tryTargets) {
      if (t.col < 0 || t.row < 0 || t.col >= GRID.COLS) continue
      const occ = arrCellToId[key(t.col, t.row)]
      if (occ && occ !== victimId) {
        // move occupant further first
        const occCell = arrCells[occ]
        if (!occCell) continue
        moveVictimWithApproach(arrCells, arrCellToId, occ, occCell, approach, depth+1)
        if (isFreeIn(arrCellToId, t.col, t.row, victimId)) {
          placeAtIn(arrCells, arrCellToId, victimId, t.col, t.row)
          return
        }
      }
    }
    // ultimate fallback: next free via nextCell walk
    let probe = nextCell({ col, row })
    let guard = 0
    while (!isFreeIn(arrCellToId, probe.col, probe.row, victimId)) {
      probe = nextCell(probe)
      guard++
      if (guard > 2000) return
    }
    placeAtIn(arrCells, arrCellToId, victimId, probe.col, probe.row)
  }

  function updatePreview(actorId: string, hoverCol?: number, hoverRow?: number, approach?: 'left'|'right'|'up'|'down') {
    if (!previewActive.value || previewActorId.value !== actorId || !previewBaseCells || !previewBaseCellToId) return
    // Start from base
    const arrCells = cloneCellsMap(previewBaseCells)
    const arrCellToId = cloneMap(previewBaseCellToId)
    // remove actor from arrangement
    if (arrCells[actorId]) {
      const prev = arrCells[actorId]
      delete arrCellToId[key(prev.col, prev.row)]
      delete arrCells[actorId]
    }
    if (hoverCol !== undefined && hoverRow !== undefined) {
      const victim = arrCellToId[key(hoverCol, hoverRow)]
      if (victim && victim !== actorId && approach) {
        // Latch direction per target to prevent thrash near the center
        if (!previewTarget || previewTarget.col !== hoverCol || previewTarget.row !== hoverRow) {
          previewTarget = { col: hoverCol, row: hoverRow }
          previewApproach = approach
        }
        const latchedApproach = previewApproach || approach
        const vCell = arrCells[victim]
        if (vCell) moveVictimWithApproach(arrCells, arrCellToId, victim, vCell, latchedApproach)
      }
    }
    // Apply preview
    cellToId.value = arrCellToId
    cells.value = arrCells
    version.value++
  }

  function commitPreviewPlacement(actorId: string, desired: Cell): Cell {
    // If a preview is active for this actor, keep current arrangement and place actor; else fallback to requestSnap
    if (previewActive.value && previewActorId.value === actorId) {
      updateMaxCols()
      if (isFree(desired.col, desired.row, actorId)) {
        placeAt(actorId, desired.col, desired.row)
      } else {
        // use normal push on current arrangement
        requestSnap(actorId, desired)
      }
      endPreview(true)
      return { ...(cells.value[actorId] as Cell) }
    }
    // no preview; normal
    return requestSnap(actorId, desired)
  }

  function colRowFromPx(x: number, y: number): Cell {
    const col = Math.max(0, Math.round(x / GRID.stepX))
    const row = Math.max(0, Math.round(y / GRID.stepY))
    return { col, row }
  }

  function pxFromColRow(col: number, row: number) {
    return { x: col * GRID.stepX, y: row * GRID.stepY }
  }

  type SizePreset = 'small' | 'medium' | 'large'
  function setSizePreset(preset: SizePreset) {
    if (preset === 'small') {
      GRID.colWidth = 450
      GRID.rowHeight = 300
    } else if (preset === 'medium') {
      GRID.colWidth = 540
      GRID.rowHeight = 360
    } else {
      GRID.colWidth = 660
      GRID.rowHeight = 440
    }
    // trigger consumers to update
    const cloned: Record<string, Cell> = {}
    for (const id in cells.value) {
      const c = cells.value[id]
      if (c) cloned[id] = { ...c }
    }
    cells.value = cloned
    version.value++
  }

  function setDragActive(active: boolean) {
    dragActive.value = !!active
  }

  return {
    cellToId,
    cells,
    maxCols,
    version,
    dragActive,
    updateMaxCols,
    key,
    release,
    isFree,
    placeAt,
    nextCell,
    requestSnap,
    startPreview,
    updatePreview,
    revertPreview,
    endPreview,
    commitPreviewPlacement,
    proximityPush,
    getPreviewMeta,
    colRowFromPx,
    pxFromColRow,
    setSizePreset,
    setDragActive
  }
})
