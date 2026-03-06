/**
 * filter_puzzles.js
 *
 * Reads the full Lichess puzzle CSV and outputs a smaller filtered CSV
 * containing only puzzles relevant to Caissa's lesson themes.
 *
 * Usage:
 *   node backend/scripts/filter_puzzles.js
 *
 * Input:  lichess_data/lichess_db_puzzle.csv
 * Output: lichess_data/puzzles_filtered.csv
 *
 * Theme → Lesson mapping:
 *   pin, skewer          → "Pins and Skewers"
 *   fork                 → "Forks"
 *   kpk, pawnEndgame     → "King and Pawn"
 *
 * Each bucket collects ~33 puzzles per skill tier (100 total):
 *   beginner:     rating ≤ 1200
 *   intermediate: rating 1201–1800
 *   advanced:     rating > 1800
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const INPUT_FILE  = path.resolve(__dirname, '../../lichess_data/lichess_db_puzzle.csv');
const OUTPUT_FILE = path.resolve(__dirname, '../../lichess_data/puzzles_filtered.csv');
const LIMIT_PER_TIER = 33; // ~100 per bucket across 3 tiers

const TIERS = {
  beginner:     { min: 0,    max: 1200     },
  intermediate: { min: 1201, max: 1800     },
  advanced:     { min: 1801, max: Infinity },
};

const emptyTiers = () => ({ beginner: [], intermediate: [], advanced: [] });

// Each bucket maps to a lesson title and collects rows split by tier.
const buckets = {
  // Tactics
  pins_skewers:      { lessonTitle: 'Pins and Skewers',   themes: ['pin', 'skewer'],       tiers: emptyTiers() },
  forks:             { lessonTitle: 'Forks',               themes: ['fork'],                tiers: emptyTiers() },
  discovered_attack: { lessonTitle: 'Discovered Attacks',  themes: ['discoveredAttack'],    tiers: emptyTiers() },
  deflection:        { lessonTitle: 'Deflection',          themes: ['deflection'],          tiers: emptyTiers() },
  attraction:        { lessonTitle: 'Attraction',          themes: ['attraction'],          tiers: emptyTiers() },
  back_rank_mate:    { lessonTitle: 'Back Rank Mate',      themes: ['backRankMate'],        tiers: emptyTiers() },
  hanging_piece:     { lessonTitle: 'Hanging Pieces',      themes: ['hangingPiece'],        tiers: emptyTiers() },
  sacrifice:         { lessonTitle: 'Sacrifices',          themes: ['sacrifice'],           tiers: emptyTiers() },
  promotion:         { lessonTitle: 'Pawn Promotion',      themes: ['promotion'],           tiers: emptyTiers() },
  discovered_check:  { lessonTitle: 'Discovered Check',    themes: ['discoveredCheck'],     tiers: emptyTiers() },
  trapped_piece:     { lessonTitle: 'Trapped Pieces',      themes: ['trappedPiece'],        tiers: emptyTiers() },
  double_check:      { lessonTitle: 'Double Check',        themes: ['doubleCheck'],         tiers: emptyTiers() },
  en_passant:        { lessonTitle: 'En Passant',          themes: ['enPassant'],           tiers: emptyTiers() },
  // Endgames
  king_pawn:         { lessonTitle: 'King and Pawn',       themes: ['kpk', 'pawnEndgame'],  tiers: emptyTiers() },
  rook_endgame:      { lessonTitle: 'Rook Endgames',       themes: ['rookEndgame'],         tiers: emptyTiers() },
  bishop_endgame:    { lessonTitle: 'Bishop Endgames',     themes: ['bishopEndgame'],       tiers: emptyTiers() },
  knight_endgame:    { lessonTitle: 'Knight Endgames',     themes: ['knightEndgame'],       tiers: emptyTiers() },
  queen_endgame:     { lessonTitle: 'Queen Endgames',      themes: ['queenEndgame'],        tiers: emptyTiers() },
  zugzwang:          { lessonTitle: 'Zugzwang',            themes: ['zugzwang'],            tiers: emptyTiers() },
  // Mates
  mate_in_1:         { lessonTitle: 'Mate in 1',           themes: ['mateIn1'],             tiers: emptyTiers() },
  mate_in_2:         { lessonTitle: 'Mate in 2',           themes: ['mateIn2'],             tiers: emptyTiers() },
  smothered_mate:    { lessonTitle: 'Smothered Mate',      themes: ['smotheredMate'],       tiers: emptyTiers() },
  opera_mate:        { lessonTitle: 'Opera Mate',          themes: ['operaMate'],           tiers: emptyTiers() },
};

// Returns the first bucket key whose themes overlap with the puzzle's themes,
// or null if no match.
function matchBucket(puzzleThemes) {
  for (const [key, bucket] of Object.entries(buckets)) {
    if (bucket.themes.some(t => puzzleThemes.includes(t))) {
      return key;
    }
  }
  return null;
}

// Returns the tier name for a given numeric rating.
function matchTier(rating) {
  for (const [name, range] of Object.entries(TIERS)) {
    if (rating >= range.min && rating <= range.max) return name;
  }
  return null;
}

function isBucketFull(bucket) {
  return Object.values(bucket.tiers).every(rows => rows.length >= LIMIT_PER_TIER);
}

// Parse a single CSV line, handling the case where fields may be empty.
// The Lichess CSV is simple — no quoted commas — so split is sufficient.
function parseLine(line) {
  const parts = line.split(',');
  return {
    PuzzleId:      parts[0],
    FEN:           parts[1],
    Moves:         parts[2],
    Rating:        parts[3],
    RatingDev:     parts[4],
    Popularity:    parts[5],
    NbPlays:       parts[6],
    Themes:        parts[7] ?? '',
    GameUrl:       parts[8],
    OpeningTags:   parts[9] ?? '',
  };
}

async function run() {
  const input  = fs.createReadStream(INPUT_FILE);
  const rl     = readline.createInterface({ input, crlfDelay: Infinity });

  let headerLine = null;
  let linesRead  = 0;
  let allFull    = false;

  console.log('Reading puzzle data...');

  for await (const line of rl) {
    if (!headerLine) {
      headerLine = line; // first line is the CSV header — save it, skip processing
      continue;
    }

    if (allFull) break; // all buckets are at capacity — stop early

    linesRead++;
    const row    = parseLine(line);
    const themes = row.Themes.split(' ').map(t => t.trim()).filter(Boolean);
    const key    = matchBucket(themes);

    if (key) {
      const rating = parseInt(row.Rating, 10);
      const tier   = matchTier(rating);
      if (tier && buckets[key].tiers[tier].length < LIMIT_PER_TIER) {
        buckets[key].tiers[tier].push(row);
      }
    }

    // Check if every bucket has all tiers at capacity
    allFull = Object.values(buckets).every(isBucketFull);

    // Progress indicator every 500k lines
    if (linesRead % 500000 === 0) {
      const counts = Object.entries(buckets)
        .map(([k, b]) => `${k}: ${Object.values(b.tiers).reduce((s, r) => s + r.length, 0)}`)
        .join(', ');
      console.log(`  Scanned ${linesRead.toLocaleString()} rows — ${counts}`);
    }
  }

  // Write output CSV
  const outLines = [headerLine]; // keep the original header

  for (const bucket of Object.values(buckets)) {
    for (const rows of Object.values(bucket.tiers)) {
      for (const row of rows) {
        outLines.push(
          [row.PuzzleId, row.FEN, row.Moves, row.Rating, row.RatingDev,
           row.Popularity, row.NbPlays, row.Themes, row.GameUrl, row.OpeningTags].join(',')
        );
      }
    }
  }

  fs.writeFileSync(OUTPUT_FILE, outLines.join('\n'), 'utf8');

  // Summary
  console.log('\nDone. Results:');
  for (const [key, bucket] of Object.entries(buckets)) {
    const total = Object.values(bucket.tiers).reduce((s, r) => s + r.length, 0);
    const tierCounts = Object.entries(bucket.tiers)
      .map(([t, r]) => `${t}: ${r.length}`)
      .join(', ');
    console.log(`  ${bucket.lessonTitle.padEnd(20)} (${key}): ${total} puzzles  [${tierCounts}]`);
  }
  console.log(`\nOutput written to: ${OUTPUT_FILE}`);
  console.log(`Total puzzles: ${outLines.length - 1}`);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
