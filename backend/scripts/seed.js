/**
 * seed.js
 *
 * Populates the database with modules, lessons, and puzzles from the
 * filtered Lichess puzzle CSV produced by filter_puzzles.js.
 *
 * Usage:
 *   node backend/scripts/seed.js
 *
 * Requires DATABASE_URL in .env (or environment).
 * Safe to re-run — puzzles use ON CONFLICT DO NOTHING on lichess_id.
 * Modules and lessons use ON CONFLICT DO UPDATE so titles/descriptions
 * stay current if the script is re-run after changes.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');
const pool     = require('../db');

const CSV_FILE = path.resolve(__dirname, '../../lichess_data/puzzles_filtered.csv');

// -------------------------------------------------------------
// Module + lesson structure (order_index = position in sequence)
// -------------------------------------------------------------

const MODULES = [
  { title: 'Tactics',  description: 'Common tactical patterns',       order_index: 2 },
  { title: 'Endgames', description: 'Endgame techniques',             order_index: 3 },
  { title: 'Mates',    description: 'Checkmate patterns and motifs',  order_index: 4 },
];

// Each lesson knows its module title and its position within that module.
const LESSONS = [
  // Tactics
  { module: 'Tactics',  order_index: 1,  title: 'Pins and Skewers'  },
  { module: 'Tactics',  order_index: 2,  title: 'Forks'             },
  { module: 'Tactics',  order_index: 3,  title: 'Discovered Attacks' },
  { module: 'Tactics',  order_index: 4,  title: 'Deflection'        },
  { module: 'Tactics',  order_index: 5,  title: 'Attraction'        },
  { module: 'Tactics',  order_index: 6,  title: 'Back Rank Mate'    },
  { module: 'Tactics',  order_index: 7,  title: 'Hanging Pieces'    },
  { module: 'Tactics',  order_index: 8,  title: 'Sacrifices'        },
  { module: 'Tactics',  order_index: 9,  title: 'Pawn Promotion'    },
  { module: 'Tactics',  order_index: 10, title: 'Discovered Check'  },
  { module: 'Tactics',  order_index: 11, title: 'Trapped Pieces'    },
  { module: 'Tactics',  order_index: 12, title: 'Double Check'      },
  { module: 'Tactics',  order_index: 13, title: 'En Passant'        },
  // Endgames
  { module: 'Endgames', order_index: 1,  title: 'King and Pawn'     },
  { module: 'Endgames', order_index: 2,  title: 'Rook Endgames'     },
  { module: 'Endgames', order_index: 3,  title: 'Bishop Endgames'   },
  { module: 'Endgames', order_index: 4,  title: 'Knight Endgames'   },
  { module: 'Endgames', order_index: 5,  title: 'Queen Endgames'    },
  { module: 'Endgames', order_index: 6,  title: 'Zugzwang'          },
  // Mates
  { module: 'Mates',    order_index: 1,  title: 'Mate in 1'         },
  { module: 'Mates',    order_index: 2,  title: 'Mate in 2'         },
  { module: 'Mates',    order_index: 3,  title: 'Smothered Mate'    },
  { module: 'Mates',    order_index: 4,  title: 'Opera Mate'        },
];

// Maps Lichess theme tags → lesson title (first match wins)
const THEME_TO_LESSON = [
  { themes: ['pin', 'skewer'],           lesson: 'Pins and Skewers'   },
  { themes: ['fork'],                    lesson: 'Forks'              },
  { themes: ['discoveredAttack'],        lesson: 'Discovered Attacks' },
  { themes: ['deflection'],              lesson: 'Deflection'         },
  { themes: ['attraction'],              lesson: 'Attraction'         },
  { themes: ['backRankMate'],            lesson: 'Back Rank Mate'     },
  { themes: ['hangingPiece'],            lesson: 'Hanging Pieces'     },
  { themes: ['sacrifice'],               lesson: 'Sacrifices'         },
  { themes: ['promotion'],               lesson: 'Pawn Promotion'     },
  { themes: ['discoveredCheck'],         lesson: 'Discovered Check'   },
  { themes: ['trappedPiece'],            lesson: 'Trapped Pieces'     },
  { themes: ['doubleCheck'],             lesson: 'Double Check'       },
  { themes: ['enPassant'],               lesson: 'En Passant'         },
  { themes: ['kpk', 'pawnEndgame'],      lesson: 'King and Pawn'      },
  { themes: ['rookEndgame'],             lesson: 'Rook Endgames'      },
  { themes: ['bishopEndgame'],           lesson: 'Bishop Endgames'    },
  { themes: ['knightEndgame'],           lesson: 'Knight Endgames'    },
  { themes: ['queenEndgame'],            lesson: 'Queen Endgames'     },
  { themes: ['zugzwang'],                lesson: 'Zugzwang'           },
  { themes: ['mateIn1'],                 lesson: 'Mate in 1'          },
  { themes: ['mateIn2'],                 lesson: 'Mate in 2'          },
  { themes: ['smotheredMate'],           lesson: 'Smothered Mate'     },
  { themes: ['operaMate'],               lesson: 'Opera Mate'         },
];

function matchLesson(puzzleThemes) {
  for (const entry of THEME_TO_LESSON) {
    if (entry.themes.some(t => puzzleThemes.includes(t))) return entry.lesson;
  }
  return null;
}

function skillLevel(rating) {
  if (rating <= 1200) return 'beginner';
  if (rating <= 1800) return 'intermediate';
  return 'advanced';
}

// -------------------------------------------------------------
// Database helpers
// -------------------------------------------------------------

async function upsertModules(client) {
  for (const mod of MODULES) {
    await client.query(
      `INSERT INTO public.modules (title, description, order_index)
       VALUES ($1, $2, $3)
       ON CONFLICT (order_index) DO UPDATE
         SET title       = EXCLUDED.title,
             description = EXCLUDED.description`,
      [mod.title, mod.description, mod.order_index]
    );
  }
  // Return title → id map
  const { rows } = await client.query(`SELECT id, title FROM public.modules`);
  return Object.fromEntries(rows.map(r => [r.title, r.id]));
}

async function upsertLessons(client, moduleIdMap) {
  for (const lesson of LESSONS) {
    const moduleId = moduleIdMap[lesson.module];
    await client.query(
      `INSERT INTO public.lessons (module_id, title, order_index)
       VALUES ($1, $2, $3)
       ON CONFLICT (module_id, order_index) DO UPDATE
         SET title = EXCLUDED.title`,
      [moduleId, lesson.title, lesson.order_index]
    );
  }
  // Return lesson title → id map
  const { rows } = await client.query(`SELECT id, title FROM public.lessons`);
  return Object.fromEntries(rows.map(r => [r.title, r.id]));
}

async function insertPuzzles(client, lessonIdMap) {
  const rl = readline.createInterface({
    input: fs.createReadStream(CSV_FILE),
    crlfDelay: Infinity,
  });

  const BATCH = 200;
  let header  = true;
  let batch   = { lessonIds: [], lichessIds: [], fens: [], moves: [], ratings: [], skills: [], themes: [] };
  let total   = 0;
  let skipped = 0;

  const flush = async () => {
    if (batch.lichessIds.length === 0) return;
    await client.query(
      `INSERT INTO public.puzzles (lesson_id, lichess_id, fen, moves, rating, skill_level, themes)
       SELECT * FROM unnest(
         $1::int[], $2::text[], $3::text[], $4::text[], $5::int[], $6::text[], $7::text[]
       ) AS t(lesson_id, lichess_id, fen, moves, rating, skill_level, themes)
       ON CONFLICT (lichess_id) DO NOTHING`,
      [batch.lessonIds, batch.lichessIds, batch.fens, batch.moves, batch.ratings, batch.skills, batch.themes]
    );
    total += batch.lichessIds.length;
    batch = { lessonIds: [], lichessIds: [], fens: [], moves: [], ratings: [], skills: [], themes: [] };
  };

  for await (const line of rl) {
    if (header) { header = false; continue; }

    const parts  = line.split(',');
    const themes = (parts[7] ?? '').split(' ').map(t => t.trim()).filter(Boolean);
    const lesson = matchLesson(themes);

    if (!lesson || !lessonIdMap[lesson]) { skipped++; continue; }

    batch.lessonIds.push(lessonIdMap[lesson]);
    batch.lichessIds.push(parts[0]);
    batch.fens.push(parts[1]);
    batch.moves.push(parts[2]);
    batch.ratings.push(parseInt(parts[3], 10));
    batch.skills.push(skillLevel(parseInt(parts[3], 10)));
    batch.themes.push(parts[7] ?? '');

    if (batch.lichessIds.length >= BATCH) await flush();
  }

  await flush();
  return { total, skipped };
}

// -------------------------------------------------------------
// Main
// -------------------------------------------------------------

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Upserting modules...');
    const moduleIdMap = await upsertModules(client);
    console.log(`  Modules: ${Object.keys(moduleIdMap).join(', ')}`);

    console.log('Upserting lessons...');
    const lessonIdMap = await upsertLessons(client, moduleIdMap);
    console.log(`  Lessons: ${LESSONS.length} upserted`);

    console.log('Inserting puzzles...');
    const { total, skipped } = await insertPuzzles(client, lessonIdMap);

    await client.query('COMMIT');

    console.log(`\nDone.`);
    console.log(`  Puzzles inserted: ${total}`);
    if (skipped > 0) console.log(`  Puzzles skipped (no matching lesson): ${skipped}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    pool.end();
  }
}

run().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
