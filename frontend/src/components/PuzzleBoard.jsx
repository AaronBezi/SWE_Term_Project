/**
 * PuzzleBoard.jsx
 *
 * Displays a puzzle selector (numbered boxes) followed by an interactive
 * chess board for the selected puzzle.
 *
 * UX:
 *  - Numbered boxes are shown immediately; the board is hidden until one is clicked.
 *  - Any box can be clicked at any time to switch puzzles freely.
 *  - Solved puzzles show a green checkmark on their box.
 *  - The active puzzle's box is highlighted in violet.
 *
 * Props:
 *   lessonId  (number)  — the current lesson's ID
 */

import { useState, useEffect, useRef } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import API from '../config'

// localStorage helpers — persist which puzzle indices have been solved per lesson.
const storageKey = (lessonId) => `caissa_puzzle_progress_${lessonId}`

function loadSolvedIndices(lessonId) {
  try {
    const raw = localStorage.getItem(storageKey(lessonId))
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveSolvedIndices(lessonId, solvedSet) {
  try {
    localStorage.setItem(storageKey(lessonId), JSON.stringify([...solvedSet]))
  } catch {
    // storage unavailable — fail silently
  }
}

// Convert a UCI string ("e2e4" or "e7e8q") to the object chess.js expects.
function uciToMove(uci) {
  return {
    from: uci.slice(0, 2),
    to:   uci.slice(2, 4),
    ...(uci.length > 4 ? { promotion: uci[4] } : {}),
  }
}

// The player is the opposite of whoever moves first in the FEN.
function playerColorFromFen(fen) {
  const turn = fen.split(' ')[1]   // 'w' or 'b'
  return turn === 'w' ? 'black' : 'white'
}

export default function PuzzleBoard({ lessonId }) {
  // ----------------------------------------------------------------
  // Puzzle list
  // ----------------------------------------------------------------
  const [puzzles, setPuzzles]         = useState([])
  const [fetchStatus, setFetchStatus] = useState('loading')

  // ----------------------------------------------------------------
  // Which puzzle is open (null = none, board hidden)
  // ----------------------------------------------------------------
  const [selectedIndex, setSelectedIndex] = useState(null)

  // ----------------------------------------------------------------
  // Per-puzzle board state
  // chess is stored in React state so react-chessboard sees changes.
  // Every state update creates a new Chess instance so React detects
  // the reference change and passes the new FEN through to the board.
  // ----------------------------------------------------------------
  const [chess, setChess]               = useState(null)
  const [playerColor, setPlayerColor]   = useState('white')
  const [solutionMoves, setSolutionMoves] = useState([])
  const [moveIndex, setMoveIndex]       = useState(1)

  // 'opponent_move' | 'player_turn' | 'wrong' | 'puzzle_solved'
  const [boardStatus, setBoardStatus]   = useState('opponent_move')

  // Track solved puzzles — initialise from localStorage so progress survives navigation.
  const [solvedSet, setSolvedSet] = useState(() => loadSolvedIndices(lessonId))

  const [premove, setPremove] = useState(null)
  const premoveRef = useRef(null)   // always mirrors premove state; readable inside timeouts

  const timerRef = useRef(null)

  function queuePremove(pm) {
    premoveRef.current = pm
    setPremove(pm)
  }

  // Persist solved indices whenever the set changes.
  useEffect(() => {
    saveSolvedIndices(lessonId, solvedSet)
  }, [lessonId, solvedSet])

  // ----------------------------------------------------------------
  // Fetch puzzles
  // ----------------------------------------------------------------
  useEffect(() => {
    setFetchStatus('loading')
    fetch(`${API}/puzzles/lesson/${lessonId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPuzzles(data)
          setFetchStatus('ready')
        } else {
          setFetchStatus('empty')
        }
      })
      .catch(() => setFetchStatus('empty'))
  }, [lessonId])

  // ----------------------------------------------------------------
  // Load a puzzle whenever the selected index changes
  // ----------------------------------------------------------------
  useEffect(() => {
    if (selectedIndex === null || puzzles.length === 0) return

    clearTimeout(timerRef.current)

    const puzzle = puzzles[selectedIndex]
    const moves  = puzzle.moves.trim().split(' ')
    const pColor = playerColorFromFen(puzzle.fen)

    // Create fresh Chess instance at the puzzle starting position.
    const initialChess = new Chess()
    initialChess.load(puzzle.fen)

    setSolutionMoves(moves)
    setPlayerColor(pColor)
    setMoveIndex(1)
    setBoardStatus('opponent_move')
    queuePremove(null)
    setChess(initialChess)

    // Play the opponent's first move after a short pause so the
    // player can see the starting position first.
    timerRef.current = setTimeout(() => {
      setChess(prev => {
        if (!prev) return prev
        const next = new Chess()
        next.load(prev.fen())
        try {
          next.move(uciToMove(moves[0]))
        } catch (err) {
          console.error('Opponent first move failed:', err)
          return prev   // keep original position on failure
        }
        return next
      })
      setBoardStatus('player_turn')
    }, 700)

    return () => clearTimeout(timerRef.current)
  }, [selectedIndex, puzzles])

  // ----------------------------------------------------------------
  // Player drops a piece on the board
  // ----------------------------------------------------------------
  function onDrop(sourceSquare, targetSquare) {
    if (!chess) return false

    // Queue a premove while the opponent is moving
    if (boardStatus === 'opponent_move') {
      const piece = chess.get(sourceSquare)
      // Only queue if the piece belongs to the player
      const playerTurn = playerColor === 'white' ? 'w' : 'b'
      if (!piece || piece.color !== playerTurn) return false
      queuePremove({ from: sourceSquare, to: targetSquare })
      return true
    }

    if (boardStatus !== 'player_turn') return false

    // Only allow the player's own pieces to move
    const currentTurn = chess.turn()
    const playerTurn  = playerColor === 'white' ? 'w' : 'b'
    if (currentTurn !== playerTurn) return false

    const expectedUci = solutionMoves[moveIndex]
    const playerUci   = sourceSquare + targetSquare

    // Validate the move is legal
    const testChess = new Chess()
    testChess.load(chess.fen())
    let move
    try {
      move = testChess.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
    } catch {
      return false
    }
    if (!move) return false

    // Check against the solution (first 4 chars covers normal moves)
    if (playerUci !== expectedUci.slice(0, 4)) {
      setBoardStatus('wrong')
      setTimeout(() => setBoardStatus('player_turn'), 1000)
      return false
    }

    // Correct move — commit it
    setChess(testChess)

    const nextOpponentIndex = moveIndex + 1

    if (nextOpponentIndex >= solutionMoves.length) {
      setBoardStatus('puzzle_solved')
      setSolvedSet(prev => new Set(prev).add(selectedIndex))
      return true
    }

    // Opponent responds
    setBoardStatus('opponent_move')
    timerRef.current = setTimeout(() => {
      // Read the latest premove from the ref (may have been queued during the delay)
      const queuedPremove = premoveRef.current
      queuePremove(null)   // clear highlight immediately

      setChess(prev => {
        if (!prev) return prev
        const next = new Chess()
        next.load(prev.fen())
        try {
          next.move(uciToMove(solutionMoves[nextOpponentIndex]))
        } catch (err) {
          console.error('Opponent response failed:', err)
          return prev
        }
        return next
      })

      const nextPlayerIndex = nextOpponentIndex + 1
      if (nextPlayerIndex >= solutionMoves.length) {
        setBoardStatus('puzzle_solved')
        setSolvedSet(prev => new Set(prev).add(selectedIndex))
        return
      }

      // Try to fire the premove
      if (queuedPremove) {
        const expectedUci = solutionMoves[nextPlayerIndex]
        const premoveUci  = queuedPremove.from + queuedPremove.to
        if (premoveUci === expectedUci.slice(0, 4)) {
          // Premove is correct — execute it
          setChess(prev => {
            if (!prev) return prev
            const next = new Chess()
            next.load(prev.fen())
            try {
              next.move({ from: queuedPremove.from, to: queuedPremove.to, promotion: 'q' })
            } catch (err) {
              console.error('Premove failed:', err)
              setMoveIndex(nextPlayerIndex)
              setBoardStatus('player_turn')
              return prev
            }
            return next
          })

          const afterPremoveOpponentIndex = nextPlayerIndex + 1
          if (afterPremoveOpponentIndex >= solutionMoves.length) {
            setBoardStatus('puzzle_solved')
            setSolvedSet(prev => new Set(prev).add(selectedIndex))
          } else {
            // Opponent's next response after the premove
            setBoardStatus('opponent_move')
            timerRef.current = setTimeout(() => {
              const queuedPremove2 = premoveRef.current
              queuePremove(null)
              setChess(prev => {
                if (!prev) return prev
                const next = new Chess()
                next.load(prev.fen())
                try {
                  next.move(uciToMove(solutionMoves[afterPremoveOpponentIndex]))
                } catch (err) {
                  console.error('Opponent post-premove response failed:', err)
                  return prev
                }
                return next
              })
              const afterPremovePlayerIndex = afterPremoveOpponentIndex + 1
              if (afterPremovePlayerIndex >= solutionMoves.length) {
                setBoardStatus('puzzle_solved')
                setSolvedSet(prev => new Set(prev).add(selectedIndex))
              } else {
                setMoveIndex(afterPremovePlayerIndex)
                setBoardStatus('player_turn')
              }
            }, 600)
          }
          return
        }
        // Premove was wrong — already cleared above, fall through to player_turn
      }

      setMoveIndex(nextPlayerIndex)
      setBoardStatus('player_turn')
    }, 600)

    return true
  }

  // ----------------------------------------------------------------
  // Early returns
  // ----------------------------------------------------------------
  if (fetchStatus === 'loading') {
    return (
      <div className="mt-10 text-center text-gray-400 text-sm">
        Loading puzzles...
      </div>
    )
  }

  if (fetchStatus === 'empty') return null

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  const allSolved = solvedSet.size === puzzles.length
  const isLocked  = false   // dragging always allowed (premoves queue during opponent_move)

  const premoveSquareStyles = premove
    ? {
        [premove.from]: { backgroundColor: 'rgba(255, 170, 0, 0.45)' },
        [premove.to]:   { backgroundColor: 'rgba(255, 170, 0, 0.45)' },
      }
    : {}

  return (
    <div className="mt-10">
      {/* Section header */}
      <h2 className="text-lg font-bold text-gray-800 mb-4">Practice Puzzles</h2>

      {/* Numbered selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {puzzles.map((_, i) => {
          const isSolved   = solvedSet.has(i)
          const isSelected = selectedIndex === i

          let boxClass = 'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold cursor-pointer select-none transition-all border-2 '

          if (isSelected) {
            boxClass += isSolved
              ? 'bg-green-500 border-green-600 text-white shadow-md scale-105'
              : 'bg-violet-500 border-violet-600 text-white shadow-md scale-105'
          } else if (isSolved) {
            boxClass += 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
          } else {
            boxClass += 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-600'
          }

          return (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={boxClass}
              title={`Puzzle ${i + 1}`}
            >
              {isSolved ? '✓' : i + 1}
            </button>
          )
        })}
      </div>

      {/* All solved banner */}
      {allSolved && (
        <div className="mb-6 bg-violet-50 border border-violet-200 rounded-2xl p-6 text-center">
          <p className="text-violet-700 font-bold text-base mb-1">All puzzles complete!</p>
          <p className="text-violet-500 text-sm">You solved every puzzle in this lesson.</p>
        </div>
      )}

      {/* Board — only visible when a puzzle is selected */}
      {selectedIndex !== null && chess && (
        <div>
          {/* Puzzle metadata */}
          <div className="flex gap-3 mb-4 flex-wrap">
            {puzzles[selectedIndex].skill_level && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-violet-100 text-violet-700 capitalize">
                {puzzles[selectedIndex].skill_level}
              </span>
            )}
            {puzzles[selectedIndex].rating && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                Rating: {puzzles[selectedIndex].rating}
              </span>
            )}
          </div>

          {/* Board — key forces a fresh mount for each puzzle.
              In react-chessboard v5 ALL config goes inside the options prop. */}
          <div
            className="rounded-xl overflow-hidden shadow-sm border border-gray-200"
            style={{ maxWidth: 480, margin: '0 auto' }}
          >
            <Chessboard
              key={selectedIndex}
              options={{
                position: chess.fen(),
                boardOrientation: playerColor,
                allowDragging: boardStatus !== 'puzzle_solved',
                showAnimations: true,
                animationDurationInMs: 220,
                darkSquareStyle: { backgroundColor: '#7c6fcd' },
                lightSquareStyle: { backgroundColor: '#f0ecff' },
                squareStyles: premoveSquareStyles,
                onPieceDrop: ({ sourceSquare, targetSquare }) =>
                  onDrop(sourceSquare, targetSquare),
              }}
            />
          </div>

          {/* Feedback */}
          <div className="mt-3 min-h-[24px] text-center text-sm font-semibold">
            {boardStatus === 'wrong' && (
              <span className="text-red-600">Incorrect — try again.</span>
            )}
            {boardStatus === 'opponent_move' && premove && (
              <span className="text-amber-500">Premove queued.</span>
            )}
            {boardStatus === 'opponent_move' && !premove && moveIndex > 1 && (
              <span className="text-violet-500">Correct!</span>
            )}
            {boardStatus === 'player_turn' && (
              <span className="text-gray-400">
                {playerColor === 'white' ? 'Play White.' : 'Play Black.'}
              </span>
            )}
            {boardStatus === 'puzzle_solved' && (
              <span className="text-green-600">Puzzle solved!</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
