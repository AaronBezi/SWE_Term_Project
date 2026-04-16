/**
 * seed_puzzles.js
 *
 * Reads puzzles_filtered.csv (Lichess puzzle export), maps each puzzle to a
 * lesson based on its theme tags, and inserts up to MAX_PER_LESSON puzzles
 * per lesson into the local database.
 *
 * Usage:
 *   node scripts/seed_puzzles.js
 *
 * Safe to re-run: uses ON CONFLICT (lichess_id) DO NOTHING.
 */

require('dotenv').config()
const fs   = require('fs')
const path = require('path')
const db   = require('../db')

// ------------------------------------------------------------
// Config
// ------------------------------------------------------------
const CSV_PATH       = path.join(__dirname, '../../lichess_data/puzzles_filtered.csv')
const MAX_PER_LESSON = 10   // max puzzles inserted per lesson

// Rating thresholds for skill levels
const INTERMEDIATE_MIN = 1300
const ADVANCED_MIN     = 1800

// Maps each Lichess theme tag to a lesson title.
// The first matching theme in this list wins.
const THEME_TO_LESSON = [
  // Mates (check these first — many mate puzzles also carry generic tags)
  ['mateIn1',        'Mate in 1'],
  ['oneMove',        'Mate in 1'],
  ['mateIn2',        'Mate in 2'],
  ['smotheredMate',  'Smothered Mate'],
  ['operaMate',      'Opera Mate'],

  // Tactics
  ['pin',            'Pins and Skewers'],
  ['skewer',         'Pins and Skewers'],
  ['fork',           'Forks'],
  ['discoveredAttack', 'Discovered Attacks'],
  ['deflection',     'Deflection'],
  ['attraction',     'Attraction'],
  ['backRankMate',   'Back Rank Mate'],
  ['hangingPiece',   'Hanging Pieces'],
  ['sacrifice',      'Sacrifices'],
  ['promotion',      'Pawn Promotion'],
  ['advancedPawn',   'Pawn Promotion'],
  ['discoveredCheck','Discovered Check'],
  ['doubleCheck',    'Double Check'],
  ['trappedPiece',   'Trapped Pieces'],
  ['enPassant',      'En Passant'],

  // Endgames
  ['pawnEndgame',    'King and Pawn'],
  ['rookEndgame',    'Rook Endgames'],
  ['bishopEndgame',  'Bishop Endgames'],
  ['knightEndgame',  'Knight Endgames'],
  ['queenEndgame',   'Queen Endgames'],
  ['zugzwang',       'Zugzwang'],
]

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function skillLevel(rating) {
  if (rating >= ADVANCED_MIN)     return 'advanced'
  if (rating >= INTERMEDIATE_MIN) return 'intermediate'
  return 'beginner'
}

// Minimal CSV parser — handles the Lichess export format.
// Columns: PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
function parseCSV(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n')
  const rows  = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    if (cols.length < 8) continue
    rows.push({
      lichessId : cols[0].trim(),
      fen       : cols[1].trim(),
      moves     : cols[2].trim(),
      rating    : parseInt(cols[3], 10),
      themes    : cols[7].trim(),
    })
  }
  return rows
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------

async function main() {
  // 1. Load all lessons from the DB (title → id)
  const { rows: lessonRows } = await db.query(
    `SELECT l.id, l.title FROM lessons l JOIN modules m ON m.id = l.module_id`
  )
  const lessonByTitle = {}
  for (const row of lessonRows) {
    lessonByTitle[row.title] = row.id
  }

  // 2. Build a resolved theme-to-lesson-id map
  const themeToLessonId = {}
  for (const [theme, lessonTitle] of THEME_TO_LESSON) {
    const id = lessonByTitle[lessonTitle]
    if (id === undefined) {
      console.warn(`  WARNING: lesson "${lessonTitle}" not found in DB — skipping theme "${theme}"`)
      continue
    }
    themeToLessonId[theme] = id
  }

  // 3. Parse the CSV
  console.log(`Reading ${CSV_PATH} ...`)
  const puzzles = parseCSV(CSV_PATH)
  console.log(`Parsed ${puzzles.length} puzzles from CSV.`)

  // 4. Group puzzles by lesson + skill level, capping at MAX_PER_LESSON total
  //    per lesson. Prioritise an even spread: beginner / intermediate / advanced.
  const buckets = {}   // lessonId → { beginner: [], intermediate: [], advanced: [] }
  for (const p of puzzles) {
    if (isNaN(p.rating)) continue

    let lessonId = null
    for (const [theme] of THEME_TO_LESSON) {
      if (p.themes.split(' ').includes(theme) && themeToLessonId[theme] !== undefined) {
        lessonId = themeToLessonId[theme]
        break
      }
    }
    if (lessonId === null) continue

    const skill = skillLevel(p.rating)
    if (!buckets[lessonId]) buckets[lessonId] = { beginner: [], intermediate: [], advanced: [] }
    buckets[lessonId][skill].push(p)
  }

  // Pick up to MAX_PER_LESSON per lesson, trying to take an equal share from
  // each skill tier first, then filling remaining slots from whatever is left.
  const toInsert = []
  for (const [lessonId, tiers] of Object.entries(buckets)) {
    const perTier  = Math.floor(MAX_PER_LESSON / 3)
    const selected = [
      ...tiers.beginner.slice(0, perTier),
      ...tiers.intermediate.slice(0, perTier),
      ...tiers.advanced.slice(0, perTier),
    ]
    // Fill remaining slots if a tier was short
    let remaining = MAX_PER_LESSON - selected.length
    if (remaining > 0) {
      const leftovers = [
        ...tiers.beginner.slice(perTier),
        ...tiers.intermediate.slice(perTier),
        ...tiers.advanced.slice(perTier),
      ]
      selected.push(...leftovers.slice(0, remaining))
    }
    for (const p of selected) {
      toInsert.push({ lessonId: Number(lessonId), puzzle: p })
    }
  }

  console.log(`Inserting up to ${toInsert.length} puzzles (${MAX_PER_LESSON} per lesson) ...`)

  // 5. Insert in batches
  let inserted = 0
  let skipped  = 0
  for (const { lessonId, puzzle } of toInsert) {
    const skill = skillLevel(puzzle.rating)
    try {
      const result = await db.query(
        `INSERT INTO puzzles (lesson_id, lichess_id, fen, moves, rating, skill_level, themes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (lichess_id) DO NOTHING`,
        [lessonId, puzzle.lichessId, puzzle.fen, puzzle.moves, puzzle.rating, skill, puzzle.themes]
      )
      if (result.rowCount === 1) inserted++
      else                        skipped++
    } catch (err) {
      console.error(`  Error inserting ${puzzle.lichessId}:`, err.message)
    }
  }

  console.log(`Done. Inserted: ${inserted}  Already existed (skipped): ${skipped}`)

  // 6. Summary by lesson
  const { rows: summary } = await db.query(
    `SELECT m.title AS module, l.title AS lesson, COUNT(*) AS puzzles
     FROM puzzles p
     JOIN lessons l ON l.id = p.lesson_id
     JOIN modules m ON m.id = l.module_id
     GROUP BY m.title, l.title, m.order_index, l.order_index
     ORDER BY m.order_index, l.order_index`
  )
  console.log('\nPuzzles per lesson:')
  for (const row of summary) {
    console.log(`  ${row.module.padEnd(14)} | ${row.lesson.padEnd(20)} | ${row.puzzles}`)
  }

  await db.end()
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
