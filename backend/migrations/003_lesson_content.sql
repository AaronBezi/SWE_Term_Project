-- =============================================================
-- 003_lesson_content.sql
-- Populates real Markdown content for all 6 seed lessons.
-- Run after 001_init_local.sql.
-- =============================================================

-- Use a CTE to resolve lesson IDs by module title + lesson title
-- so this file stays safe to re-run even if serial IDs differ.

WITH lessons AS (
  SELECT l.id, l.title AS lesson_title, m.title AS module_title
  FROM public.lessons l
  JOIN public.modules m ON m.id = l.module_id
)

UPDATE public.lessons SET content = updates.content
FROM (VALUES

  -- ----------------------------------------------------------------
  -- Fundamentals / Pieces and Moves
  -- ----------------------------------------------------------------
  ('Fundamentals', 'Pieces and Moves', $lesson$
## The Chess Board

Chess is played on an 8x8 grid of 64 squares, alternating light and dark. Each player starts with **16 pieces**: one king, one queen, two rooks, two bishops, two knights, and eight pawns.

The board is set up so that each player has a light square in the bottom-right corner. Queens go on their own color: the white queen on a light square, the black queen on a dark square.

---

## How Each Piece Moves

### The King
The king moves **one square in any direction**: horizontally, vertically, or diagonally. The king can never move into a square that is attacked by an enemy piece.

### The Queen
The queen is the most powerful piece. It moves **any number of squares** in any direction: horizontally, vertically, or diagonally. It cannot jump over other pieces.

### The Rook
The rook moves **any number of squares horizontally or vertically**. Rooks are most powerful on open files (columns with no pawns) and on the 7th rank.

### The Bishop
The bishop moves **any number of squares diagonally**. Each player starts with one bishop on a light square and one on a dark square. A bishop can never change the color of its square.

### The Knight
The knight moves in an **L-shape**: two squares in one direction, then one square perpendicular (or vice versa). Knights are the only pieces that can **jump over** other pieces.

### The Pawn
Pawns move **forward one square at a time**. From their starting position, pawns may advance two squares. Pawns **capture diagonally**, one square forward.

---

## Special Moves

### Castling
Castling is the only move where two pieces move at once. The king slides two squares toward a rook, and the rook jumps to the other side of the king.

**Conditions:** Neither the king nor the rook may have moved. No pieces can be between them. The king cannot castle while in check, through check, or into check.

### En Passant
If a pawn advances two squares from its starting position and lands beside an enemy pawn, the enemy pawn may capture it **as if it had only moved one square**. This capture must be made immediately on the very next move.

### Pawn Promotion
When a pawn reaches the last rank (rank 8 for White, rank 1 for Black), it **must** be promoted to a queen, rook, bishop, or knight. Promoting to a queen is almost always the best choice.

---

## Check, Checkmate, and Stalemate

- **Check**: the king is under direct attack. The player in check must resolve it immediately by moving the king, blocking the attack, or capturing the attacker.
- **Checkmate**: the king is in check with no legal escape. The game ends immediately.
- **Stalemate**: the player to move has no legal moves but is **not** in check. The game is a draw.
$lesson$),

  -- ----------------------------------------------------------------
  -- Fundamentals / Basic Checkmates
  -- ----------------------------------------------------------------
  ('Fundamentals', 'Basic Checkmates', $lesson$
## What is Checkmate?

Checkmate ends the game. The king is in check and has no legal move to escape. No matter how many pieces you have, if you cannot defend your king, you lose.

Learning these fundamental mating patterns will help you finish games cleanly and recognize when your own king is in danger.

---

## Queen and King vs. King

This is the most important checkmate to learn. Your queen alone cannot force checkmate, you need your king actively involved.

**The method:**
1. Use your queen to cut off the enemy king, restricting it to a smaller and smaller area of the board.
2. Drive the king to the edge (a rank, h rank, a file, or h file).
3. Bring your king close to assist.
4. Deliver checkmate with the queen while your king controls escape squares.

**Key point:** Avoid stalemate. If the enemy king has no legal moves but is not in check, the game is drawn. Leave the king at least one escape square until you are ready to give checkmate.

---

## Two Rooks (Lawnmower Mate)

Two rooks working together can force checkmate very efficiently.

**The method:**
1. Use one rook to cut off the king on one side of the board.
2. Use the second rook to cut off more rows or columns.
3. Roll the rooks forward, rank by rank, until the king is pushed to the back rank.
4. Deliver checkmate with the rook on the back rank while the other rook keeps the king from escaping upward.

This is called the **lawnmower** because the rooks systematically sweep across the board.

---

## Back Rank Mate

The back rank mate is one of the most common tactical themes in games between beginners and experts alike.

**The setup:** The enemy king is castled behind its own pawns. Those pawns block the king from escaping upward. A rook (or queen) swoops to the back rank and delivers checkmate because the king has nowhere to go.

**How to avoid it:** Create a **luft** (German for air) by advancing one of the pawns in front of your castled king by one square. This gives your king an escape route.

---

## Scholar's Mate

Scholar's Mate is a four-move checkmate targeting the f7 square, which is only defended by the king at the start of the game.

**The sequence:**
1. e4, then e5
2. Bc4 (aiming at f7), then a random Black move
3. Qh5 (threatening Qxf7#), then a random Black move
4. Qxf7 checkmate

**Why it works (and why it often does not):** f7 is weak early on because only the king defends it. However, any experienced player will see this coming and easily defend. Do not rely on Scholar's Mate in serious play.

---

## Key Principles

- **Drive the king to the edge.** Checkmate is almost always delivered on the edge or corner of the board.
- **Use your king.** In the endgame, the king is an active piece. Bring it forward to help deliver checkmate.
- **Avoid stalemate.** Always check that your opponent has at least one legal move before making your mating move.
$lesson$),

  -- ----------------------------------------------------------------
  -- Tactics / Pins and Skewers
  -- ----------------------------------------------------------------
  ('Tactics', 'Pins and Skewers', $lesson$
## What Are Tactical Motifs?

Tactics are short sequences of moves that force a material gain or checkmate. Unlike strategy (which plays out over many moves), tactics are concrete and calculable. Pins and skewers are two of the most common and powerful tactical weapons in chess.

---

## The Pin

A **pin** occurs when an attacking piece targets an enemy piece that cannot (or should not) move because doing so would expose a more valuable piece behind it.

### Absolute Pin
An **absolute pin** means the pinned piece literally cannot move. This happens when the piece behind it is the king. Moving the pinned piece would put the king in check, which is illegal.

**Example:** A bishop on b5 pins a knight on c6 against the Black king on e8. The knight on c6 cannot move at all.

### Relative Pin
A **relative pin** means the pinned piece *could* move legally, but doing so would lose a more valuable piece. The defending player is not forced to keep the pin, but it is usually bad to break it.

**Example:** A rook on e1 pins a knight on e5 against the Black queen on e8. The knight can move, but Black would lose the queen.

### How to Exploit a Pin
- Pile more attackers onto the pinned piece. If it cannot move, attack it repeatedly until the attacker count exceeds the defender count.
- Open the position to activate your attacking pieces.
- Combine the pin with another threat so your opponent cannot address both at once.

---

## The Skewer

A **skewer** is the reverse of a pin. The attacking piece targets a **high-value piece** directly. When that piece moves to safety, a **less valuable piece** behind it is left undefended and captured.

**Example:** A rook on e1 attacks the Black queen on e8. The queen must move. Behind the queen sits a rook on e7. After the queen moves, the rook on e7 is captured for free.

### Key Difference from a Pin
- In a **pin**, the valuable piece is *behind* the pinned piece.
- In a **skewer**, the valuable piece is *in front* and must flee, exposing whatever is behind it.

---

## Which Pieces Create Pins and Skewers?

Only **long-range pieces** (queens, rooks, and bishops) can create pins and skewers, because they require a straight line through two enemy pieces.

- **Bishops** pin or skewer along diagonals.
- **Rooks** pin or skewer along ranks and files.
- **Queens** pin or skewer in all directions.

Knights and kings cannot create pins or skewers.

---

## Practical Tips

1. **Before each move, scan for pins.** Ask: is any of my opponent's pieces lined up with a more valuable piece behind it?
2. **Protect your own pieces from being pinned.** Avoid placing your king or queen directly behind a less valuable piece on an open line.
3. **When your piece is pinned, look for ways to break the pin.** You can block it, capture the pinning piece, or move the piece behind the pin to a different square.
$lesson$),

  -- ----------------------------------------------------------------
  -- Tactics / Forks
  -- ----------------------------------------------------------------
  ('Tactics', 'Forks', $lesson$
## What is a Fork?

A **fork** is a single move that simultaneously attacks two (or more) enemy pieces. The opponent can only respond to one threat at a time, so you are guaranteed to win at least one of the attacked pieces.

Forks are one of the most effective ways to gain material in chess.

---

## The Knight Fork

The knight fork is the most famous type of fork because the knight's unusual movement makes it very hard to see coming.

**Why knights are so effective at forking:**
- Knights jump over pieces, so they cannot be blocked.
- Their L-shaped movement attacks squares that are not on the same rank, file, or diagonal as the knight itself.
- Players often underestimate how far a knight can reach in a single move.

**Classic example:** A knight on c7 attacks the king on e8 and the rook on a8 at the same time. The king must move, and the rook is captured.

**How to set up a knight fork:**
1. Look for a square (the **fork square**) where a knight would simultaneously attack two valuable enemy pieces.
2. Find a way to get your knight to that square, ideally with a forcing move like a check.

---

## The Pawn Fork

Pawns can fork two pieces at once because they capture diagonally.

**Example:** A pawn advances to e5. It now attacks both the knight on d6 and the bishop on f6. Black must move one of them, and the other is captured.

Pawn forks are especially powerful because pawns are the least valuable pieces. Winning a minor piece (knight or bishop) in exchange for no material is a large gain.

---

## The Queen Fork (Double Attack)

The queen can create forks in any direction, making her a devastating double-attack weapon.

**Example:** A queen moves to h5, attacking the king on e8 with check and the rook on f7 at the same time. After the king moves, the rook is taken.

Because the queen is so valuable, queen forks often require a check or another forcing element to prevent the opponent from simply capturing the queen.

---

## The Royal Fork

A **royal fork** (also called a **family fork**) is a knight fork that attacks the king, queen, and sometimes a rook all at once. It is the most devastating version of a fork because it wins at minimum the queen.

---

## Finding Forks in Your Games

Ask yourself these questions before making moves:

1. **Where are my opponent's valuable pieces?** Two valuable pieces on the board at once are a potential fork target.
2. **Is there a square where my knight (or pawn) would attack both at once?** Work backwards from the target square.
3. **Can I force the pieces onto those squares?** Use checks, captures, or threats to steer the opponent's pieces where you want them.
4. **Are any of my pieces being forked?** Keep your king and valuable pieces on squares where an enemy knight cannot reach both simultaneously.

---

## Material Value Reference

Knowing the value of pieces helps you evaluate whether a fork is worth it:

| Piece | Approximate Value |
|-------|------------------|
| Pawn | 1 point |
| Knight | 3 points |
| Bishop | 3 points |
| Rook | 5 points |
| Queen | 9 points |

A fork that wins a rook (5 points) at the cost of a knight (3 points) is a net gain of 2 points. A fork that wins a queen for free is often game-ending.
$lesson$),

  -- ----------------------------------------------------------------
  -- Endgames / King and Pawn
  -- ----------------------------------------------------------------
  ('Endgames', 'King and Pawn', $lesson$
## Why Endgames Matter

Many beginners focus entirely on openings and tactics, but the endgame is where games are actually won or lost. A small advantage in the middlegame often only converts to a win through precise endgame technique. King and pawn endgames are the foundation of all endgame study.

---

## The Goal

In a king and pawn endgame, the side with the extra pawn usually wins by **promoting** that pawn to a queen. The defending side tries to capture the pawn or reach a drawn position.

---

## Key Squares

Every pawn has a set of **key squares**. If the attacking king reaches any key square, the pawn will promote regardless of where the defending king is.

For a pawn on any file except the a and h files:
- The key squares are the three squares two ranks ahead of the pawn.

**Example:** A white pawn on e4. Its key squares are d6, e6, and f6. If the white king reaches any of those squares, the pawn promotes.

For **rook pawns** (a and h files), the rules are different. These endgames are often drawn because the defending king can reach the corner and get stalemated.

---

## The Rule of the Square

The **rule of the square** tells you whether a king can catch a passed pawn without help.

**How it works:**
1. Draw an imaginary square from the pawn to the promotion square.
2. If the defending king can step inside that square on its turn, it will catch the pawn.
3. If the defending king cannot reach the square, the pawn promotes.

This allows you to calculate pawn races quickly without counting moves one at a time.

---

## Opposition

**Opposition** is the most important concept in king and pawn endgames. Two kings are in opposition when they face each other with exactly one square between them.

The player who does **not** have to move while in opposition is said to **have the opposition**. Having the opposition forces the enemy king to give way.

**Example:** White king on e4, Black king on e6. It is Black's turn. Black must move aside because moving to d6, e5, or f6 would bring the kings adjacent (illegal). White's king advances.

---

## Winning with King + Pawn vs. King

The technique depends on whether the pawn is a rook pawn or a center/bishop/knight pawn.

### Center or Knight or Bishop Pawn
1. Place your king **in front of the pawn** (not beside it).
2. Use opposition to push the enemy king backward.
3. Advance the pawn only when it helps your king gain ground.
4. Reach a key square with your king to guarantee promotion.

### Rook Pawn (a or h file)
A rook pawn endgame is often a **draw** even with an extra pawn, because the defending king can reach the corner (a8 or h8) and the attacker cannot force it out without stalemating it.

**Exception:** If the attacking king can cut off the defending king before it reaches the corner, the pawn can sometimes promote.

---

## Practical Tips

- **Activate your king early in the endgame.** The king is a powerful piece once queens are off the board.
- **Centralize before advancing.** A centralized king controls more key squares.
- **Count moves carefully.** Opposition and key squares are precise concepts. One tempo can be the difference between winning and drawing.
$lesson$),

  -- ----------------------------------------------------------------
  -- Endgames / Opposition
  -- ----------------------------------------------------------------
  ('Endgames', 'Opposition', $lesson$
## What is Opposition?

**Opposition** is one of the central ideas in king and pawn endgames. Two kings are in **direct opposition** when they stand on the same rank, file, or diagonal with exactly one square between them, and it is your opponent's turn to move.

The player who does NOT have to move is said to **hold the opposition**. Having the opposition forces the enemy king to step aside, which lets your king advance.

---

## Direct Opposition

The most common form is **direct opposition along a file**.

**Example:**
- White king on e4, Black king on e6.
- One square separates them (e5 is between them).
- If it is Black's turn, Black is in a losing position. The black king must step to d6 or f6, and the white king advances to d5 or f5, gaining ground.

**On a rank:** White king on c5, Black king on e5. Same idea horizontally.

**Key rule:** Whoever must move while the kings face each other loses the opposition.

---

## Distant Opposition

**Distant opposition** occurs when the kings are separated by an odd number of squares (3, 5, or 7) on the same file, rank, or diagonal.

Distant opposition matters because it converts to direct opposition as the kings approach each other. If you hold distant opposition now, you will hold direct opposition later.

**Example:**
- White king on e1, Black king on e7.
- They are separated by 5 squares (e2, e3, e4, e5, e6).
- If it is Black's turn, White holds the distant opposition and will eventually win the close fight.

---

## Diagonal Opposition

Kings can also oppose each other diagonally, separated by one square on a diagonal.

**Example:** White king on c3, Black king on e5. They share a diagonal with d4 between them. This is diagonal direct opposition.

Diagonal opposition is useful for **triangulation**.

---

## Triangulation

**Triangulation** is a technique used when direct opposition is not enough to make progress. The attacking king takes a three-move path (a triangle) to return to the same square, effectively **passing the move** to the opponent.

**When to use it:** When you and your opponent are in identical positions and you need it to be your opponent's turn instead of yours.

**How it works:**
1. Instead of moving directly toward the opposing king, step one square to the side.
2. Step forward.
3. Step back diagonally to your original square.

You have returned to the same position, but now it is your opponent's turn. The opponent, now out of opposition, must give way.

**Important:** Triangulation only works if your king has room to maneuver and the opponent's king does not have the same flexibility (for example, because a pawn or the edge of the board restricts it).

---

## Putting It Together

Opposition and triangulation are tools for converting a king and pawn advantage into a win. The sequence typically looks like this:

1. Use distant opposition to control the approach.
2. Convert to direct opposition to force the enemy king backward.
3. Use triangulation if the enemy king mirrors your moves and you cannot make progress.
4. Reach a key square with your king.
5. Promote the pawn.

---

## Quick Reference

| Situation | How to handle it |
|-----------|-----------------|
| Kings on same file, 1 square apart | Direct opposition: the player to move loses ground |
| Kings on same file, 3 or 5 squares apart | Distant opposition: approach to convert |
| Stuck in a mirror position | Triangulate to pass the move |
| Rook pawn endgame | Beware of stalemate in the corner |
$lesson$)

) AS updates(module_title, lesson_title, content)
JOIN lessons l ON l.lesson_title = updates.lesson_title AND l.module_title = updates.module_title
WHERE public.lessons.id = l.id;
