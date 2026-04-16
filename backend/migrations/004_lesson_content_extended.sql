-- =============================================================
-- 004_lesson_content_extended.sql
-- Populates Markdown content for the remaining 20 lessons.
-- Run after 003_lesson_content.sql.
-- =============================================================

UPDATE public.lessons SET content = v.content
FROM (VALUES

  -- ----------------------------------------------------------------
  -- Tactics / Discovered Attacks
  -- ----------------------------------------------------------------
  (9, $lesson$
## What is a Discovered Attack?

A **discovered attack** happens when you move one piece and, by doing so, reveal an attack from another piece that was behind it. The piece you moved and the piece you revealed can both be attacking different targets at the same time.

Because the opponent must respond to at least one of the two threats, the player delivering the discovered attack often wins material.

---

## How It Works

Imagine a white bishop on b2 and a white rook on b7. The bishop is blocking the rook's line of sight to the black queen on b5. If the bishop moves off the b-file, the rook suddenly attacks the queen. The bishop move was not just a random move: it created a second threat of its own.

The opponent now has two problems:
1. Deal with whatever the bishop is attacking in its new square.
2. Protect the queen from the rook.

Usually only one of those can be solved in a single move.

---

## Why Discovered Attacks Are Powerful

- The moving piece creates a **new** threat.
- The revealed piece creates a **second** threat.
- The opponent can rarely address both at once.
- Discovered attacks can win material, force checkmate, or gain a tempo.

---

## Setting Up Discovered Attacks

To create a discovered attack you need:
1. A **battery**: two pieces lined up on a rank, file, or diagonal, with a third enemy piece at the end of the line.
2. A reason to move the front piece: ideally a capture, a check, or an attack on a second target.

Look at your long-range pieces (rooks, bishops, queens) and ask: what am I pointing at? Is there one of my own pieces in the way that could move with tempo?

---

## Practical Tips

- Always check whether moving a piece reveals an attack from a piece behind it.
- The most dangerous discovered attacks involve a check from the revealed piece, forcing the opponent to deal with the check first.
- Look for opportunities to place your own pieces in a battery formation during the opening and middlegame.
$lesson$),

  -- ----------------------------------------------------------------
  -- Tactics / Deflection
  -- ----------------------------------------------------------------
  (10, $lesson$
## What is Deflection?

**Deflection** (also called **overloading**) is a tactic that forces an enemy piece away from a square or line it needs to defend. Once the defender is removed or distracted, a threat that was previously guarded becomes decisive.

---

## The Core Idea

Every piece on the board has a job. A rook might be defending the back rank. A queen might be covering a mating square. A pawn might be guarding a key piece.

Deflection works by making the defender an offer it cannot refuse: sacrifice material to pull the defender off its post, then exploit the unguarded target.

**Example:** The black queen is guarding both the back rank and a critical pawn. White plays a rook sacrifice, forcing the queen to capture. With the queen deflected, the back rank is undefended and White delivers checkmate.

---

## Overloading

**Overloading** is a related concept. A piece is overloaded when it has too many defensive responsibilities at the same time. By attacking both targets simultaneously, you force the defender to abandon one.

**Example:** A black rook is defending both a knight on d5 and a bishop on f5. White attacks both with threats the rook cannot meet at once. The rook must abandon one piece, and White wins material.

---

## How to Spot Deflection Opportunities

1. Identify pieces your opponent is relying on for defense.
2. Ask: what would happen if that piece were removed or had to move?
3. Find a forcing move (capture, check, or serious threat) that makes the defender leave its post.
4. Confirm the follow-up wins material or delivers checkmate.

---

## Common Deflection Patterns

- **Rook sacrifice on the back rank** to pull the queen away from a mating square.
- **Pawn fork** that forces a defending piece to capture, giving up its defensive role.
- **Queen sacrifice** to deflect the king, allowing a back rank checkmate or promotion.

---

## Key Principle

Deflection and overloading succeed when the opponent has a piece doing two jobs and you attack both jobs at the same time. Always ask: is any piece in the enemy position stretched thin?
$lesson$),

  -- ----------------------------------------------------------------
  -- Tactics / Attraction
  -- ----------------------------------------------------------------
  (11, $lesson$
## What is Attraction?

**Attraction** (sometimes called luring) is the opposite of deflection. Instead of chasing a piece away from where it needs to be, attraction **forces a piece onto a specific square where it can be exploited**.

A sacrifice is typically used to lure the enemy piece onto the target square, where it becomes vulnerable to a fork, pin, skewer, or checkmate.

---

## How It Works

**Example:** The black king is safely tucked away, but a queen sacrifice checks it and forces it onto a square where a knight fork wins the queen back with interest. The king had no choice but to capture the queen. Once on that square, it was forked along with a rook.

The sequence:
1. White sacrifices the queen with a check.
2. Black must capture (the king is attracted to the queen's square).
3. White plays the knight fork, winning the queen back plus material.

---

## Why Attraction Works

Many tactics require a specific piece to be on a specific square. Attraction manufactures that position by force. The opponent's piece may "want" to capture for free material, but by doing so it walks into a trap.

---

## Common Attraction Patterns

- **Sacrifice to attract the king into a fork.** Offer material, force the king to take it, then fork the king and another piece.
- **Sacrifice to attract the king onto a mating square.** Lure the king to a square where it is surrounded by your pieces.
- **Sacrifice to attract a rook onto a file or rank where it is pinned.**

---

## Spotting Attraction

Ask these questions:
1. Is there a square where I want the enemy king or another piece to be?
2. What sacrifice would force that piece onto that square?
3. After the forced capture, what follow-up wins material or gives checkmate?

Attraction often requires a two-move combination: the sacrifice (forcing the move) followed by the exploitation (fork, pin, mate). Both moves must be forced or the tactic does not work.
$lesson$),

  -- ----------------------------------------------------------------
  -- Tactics / Back Rank Mate
  -- ----------------------------------------------------------------
  (12, $lesson$
## What is the Back Rank Mate?

The **back rank mate** (also called the **back rank checkmate**) is one of the most common mating patterns in all of chess. It occurs when a rook or queen delivers checkmate on the opponent's first or last rank, with the enemy king unable to escape because its own pawns block it in.

---

## Why It Happens

After castling, the king often sits behind a wall of three pawns (f, g, and h pawns for kingside castling). This arrangement feels safe because the pawns protect the king from frontal attacks. However, it also seals the king in. If a rook or queen reaches the back rank with no defenders, the king has no escape and is checkmated.

---

## The Mating Pattern

**Example:** White rook on e1 slides to e8. The black king is on g8. The pawns on f7, g7, and h7 block all escape squares. The king cannot move to f8, g7, or h7 without being on an attacked square. Checkmate.

The back rank mate does not require the opponent to make a blunder in the moment. It can be set up over many moves by placing rooks on open files and doubling them on the e or d file, gradually building pressure.

---

## The Luft

The most reliable defense against a back rank mate is to create **luft** (the German word for air). By pushing one of the pawns in front of the king one square, the king gains an escape square if a back rank attack comes.

**When to create luft:** Any time you notice that your rooks are not actively defending the back rank and your king has no escape, spend a move advancing the g-pawn (or h-pawn) one square.

---

## Recognizing Back Rank Threats

Before making any move, ask:
- Is my back rank defended? Are there enough defenders on the first (or eighth) rank?
- Can my opponent slide a rook or queen to my back rank in one move?
- If their piece gets there, can my king escape?

Also ask the same about your opponent: are they vulnerable to a back rank attack? Can you clear defenders off the back rank with an exchange, then deliver the mate?

---

## Practical Tips

- Doubled rooks on an open file pointed at the opponent's back rank are extremely dangerous.
- Exchanging the opponent's back rank defender (often a rook on e8 or d8) before the attack is a common preparatory step.
- If the opponent's queen is their only back rank defender, deflecting it opens the back rank immediately.
$lesson$),

  -- ----------------------------------------------------------------
  -- Tactics / Hanging Pieces
  -- ----------------------------------------------------------------
  (13, $lesson$
## What Are Hanging Pieces?

A piece is **hanging** when it is undefended and can be captured for free. Hanging pieces are one of the most common ways material is lost at all levels of chess, from beginners to club players.

Before making any move, always check whether your pieces are defended. And always check whether your opponent has left any pieces undefended that you can take.

---

## Why Pieces Hang

Pieces become undefended in a few common ways:

1. **Moving a defender.** A piece was guarding another piece. You moved the guarding piece to make an attack, forgetting that the piece it was protecting is now hanging.
2. **Exchanges.** After a series of captures, the recaptured piece is left on the board with no defender.
3. **Distraction.** Your opponent creates a threat elsewhere and you respond to it, accidentally leaving a piece unguarded.
4. **Missing a capture.** You make a move without noticing the opponent can capture one of your pieces for free.

---

## The Principle of Piece Capture

Whenever you see a free piece, take it unless:
- Taking it loses more material in return (a trap).
- Taking it misses something better (checkmate or winning more material).
- The piece is poisoned (your king would be put in danger by capturing it).

These exceptions are the minority. Most of the time, if a piece is hanging, you should take it.

---

## Blunder Check

Before finishing your analysis of any candidate move, run a **blunder check**:
1. After my proposed move, are all my pieces still defended?
2. Does my move create any new undefended pieces?
3. Can my opponent capture anything for free on their next move?

This simple habit prevents the majority of dropped pieces.

---

## Common Situations

- **After an exchange:** When two pieces are traded, count whether the recapture leaves a piece hanging.
- **After a pawn advance:** Advancing a pawn can unblock a line, suddenly attacking a piece that was previously safe.
- **After a knight move:** Knights have an unusual attack pattern. Always check where a moved knight now attacks, and whether any of your pieces are now within its reach.

---

## Key Takeaway

Chess is partly a game of attention. Systematically checking for hanging pieces (yours and your opponent's) after every move is one of the highest-return habits you can build.
$lesson$),

  -- ----------------------------------------------------------------
  -- Tactics / Sacrifices
  -- ----------------------------------------------------------------
  (14, $lesson$
## What is a Sacrifice?

A **sacrifice** is giving up material (a piece or pawn) in exchange for a non-material advantage. That advantage might be a stronger attack, better piece activity, a mating attack, or a forced positional advantage.

Not every sacrifice is a gift. A sound sacrifice wins back the material or more through force. An unsound sacrifice is a blunder dressed up as brilliance. Learning to distinguish the two is one of the marks of a strong player.

---

## Types of Sacrifices

### The Exchange Sacrifice
Giving up a rook for a bishop or knight. The exchange sacrifice is common at higher levels. A rook is normally worth more, but sometimes a minor piece (particularly a knight on a strong outpost) is so dominant that it is worth more than a rook in the specific position.

### The Bishop or Knight Sacrifice
Minor piece sacrifices are often used to rip open the pawn cover in front of the enemy king. The classic example is the bishop sacrifice on h7.

**Example (Greek Gift Sacrifice):** White sacrifices a bishop on h7 (taking the pawn), forcing the king out. After the king moves, White plays Ng5+ followed by Qh5, and a mating attack begins.

### The Queen Sacrifice
The most dramatic sacrifice in chess. Giving up the queen for long-term compensation. A sound queen sacrifice usually leads to a forced checkmate sequence. Beware of giving up the queen without a clear, concrete continuation.

### The Pawn Sacrifice
Pawns are sacrificed constantly for development, initiative, or positional pressure. The **gambit** openings (e.g., the King's Gambit, the Sicilian) are based on pawn sacrifices.

---

## When to Sacrifice

A sacrifice is correct when:
1. You can calculate a forced sequence that wins back the material or delivers checkmate.
2. You gain a positional advantage so large that it outweighs the material cost over the long term.
3. You obtain a permanent initiative that the opponent cannot easily neutralize.

A sacrifice is incorrect (a blunder) when:
1. The opponent can decline it and remain better.
2. The follow-up is unclear and the opponent can consolidate.
3. You are relying on the opponent making a specific mistake.

---

## Calculating Sacrifices

Before playing a sacrifice:
1. Make sure the sacrifice is **forced**: the opponent must accept it or face something worse.
2. Calculate all the opponent's possible responses, not just the most natural one.
3. Verify that after each response, your attack continues successfully.

If you cannot calculate to a clear advantage, wait for a better moment or choose a safer continuation.
$lesson$),

  -- ----------------------------------------------------------------
  -- Tactics / Pawn Promotion
  -- ----------------------------------------------------------------
  (15, $lesson$
## What is Pawn Promotion?

**Pawn promotion** occurs when a pawn reaches the opposite end of the board (rank 8 for White, rank 1 for Black). The pawn must immediately be replaced by a queen, rook, bishop, or knight of the same color.

Promotion to a queen is almost always the strongest choice because the queen is the most powerful piece.

---

## Underpromotion

Choosing to promote to a rook, bishop, or knight instead of a queen is called **underpromotion**. This is rare but sometimes necessary.

**When to underpromote:**
- Promoting to a queen would give immediate stalemate (the opponent's king has no legal moves and would be drawn). Promoting to a rook instead delivers checkmate or wins.
- A knight promotion gives check or fork that wins material immediately.

**Example:** White promotes on a8. Black's king is on b8. Promoting to a queen results in stalemate (queen on a8, king on b8, no legal moves). Promoting to a rook delivers checkmate because the king is still attacked but the stalemate condition is broken.

---

## The Passed Pawn

A **passed pawn** is a pawn with no enemy pawns on its file or adjacent files that can block or capture it. Passed pawns are extremely powerful in the endgame because they constantly threaten to promote.

**Rules of thumb:**
- Pass pawns should be pushed forward as quickly as possible.
- The enemy king must divert to stop a passed pawn, freeing your king to operate elsewhere.
- Two connected passed pawns on the 6th rank are worth more than a rook.

---

## The Queening Race

When both sides have passed pawns racing to promote, the player who promotes first (or with check) usually wins.

**How to win a queening race:**
1. Count the number of moves each pawn needs to promote.
2. Check if either promotion comes with check, which gains a tempo.
3. After both queens appear, assess whether the new queen can immediately win the opponent's queen or deliver checkmate.

---

## Tactics Involving Promotion

- **Promoting with check:** The new queen or rook delivers check on the promotion square, winning a tempo and often the game.
- **Queening threats as distraction:** Threatening to promote can deflect the opponent's pieces, allowing tactics elsewhere on the board.
- **Breakthrough pawn sacrifice:** Sacrificing pawns to create a passed pawn that cannot be stopped. A common endgame technique when both sides have passed pawns.

---

## Key Principle

A pawn one step away from queening is almost as powerful as the piece it will become. Factor the promotion threat into all endgame calculations.
$lesson$),

  -- ----------------------------------------------------------------
  -- Tactics / Discovered Check
  -- ----------------------------------------------------------------
  (16, $lesson$
## What is a Discovered Check?

A **discovered check** is a special case of the discovered attack. When you move a piece and the piece behind it gives check to the enemy king, that is a discovered check.

Discovered checks are especially powerful because:
- The king must respond to the check (it cannot ignore it).
- The moving piece is free to attack or capture anything else on the board.
- The opponent often cannot defend both the check and whatever the moving piece is threatening.

---

## Why Discovered Checks Are So Dangerous

In a normal attack, the opponent can choose to ignore a threat and make a counter-threat. But check cannot be ignored. The opponent must deal with the check immediately, giving you a free move with the piece that delivered the discovered attack.

This means the moving piece can capture a queen, threaten checkmate, or gain material with no risk of being captured in return.

---

## Double Check

A **double check** is the most powerful form of discovered check. It occurs when the moving piece also gives check, meaning the king is in check from two pieces at once.

**Why double check is so powerful:** The only way to escape a double check is to move the king. You cannot block two checks simultaneously, and you cannot capture two pieces in one move. This severely limits the defender's options.

Double checks frequently lead to checkmate because the king has very few safe squares.

---

## Setting Up Discovered Checks

To set up a discovered check, you need:
1. A **long-range piece** (bishop, rook, or queen) pointing at the enemy king.
2. One of your own pieces standing between the long-range piece and the king.
3. A reason to move that front piece, ideally to a square where it creates an additional threat.

Look for positions where you can align a long-range piece with the enemy king, then find a forcing move for the piece in between.

---

## Practical Example

White has a rook on e1 pointing at the black king on e8. A white knight sits on e4. If the knight moves to c5 (attacking the black queen on a6) and simultaneously uncovers the rook's attack on the king, it is a discovered check. Black must move the king, and then White captures the queen.

---

## Tips

- Before capturing a piece with an aligned piece, check if moving another piece off the same line would give a discovered check with better effect.
- Discovered checks are often worth more than the immediate material gain they produce.
- Always scan for discovered check possibilities before playing a straightforward capture.
$lesson$),

  -- ----------------------------------------------------------------
  -- Tactics / Trapped Pieces
  -- ----------------------------------------------------------------
  (17, $lesson$
## What is a Trapped Piece?

A piece is **trapped** when it has no safe squares to move to. It can be attacked and captured with no way to escape or be defended adequately. Trapping an opponent's piece often wins it for free or forces a major concession.

Even powerful pieces like bishops and rooks can become trapped if they venture into enemy territory without a clear escape route.

---

## How Pieces Get Trapped

1. **Advancing too aggressively.** A piece ventures deep into enemy territory to win a pawn and finds itself surrounded with no way back.
2. **Pawn advances cutting off retreat.** Pawns advance to cut off a piece's retreat squares, leaving it stranded.
3. **Lack of coordination.** A piece moves without considering its long-term safety, ending up on a square with no safe neighbors.

---

## Common Trapping Patterns

### Trapping the Bishop
Bishops need open diagonals to function. A bishop can be trapped by pawn advances that close off all its diagonals.

**Classic example:** A bishop ventures to h6 (or a3). A pawn advances to g5, cutting off the bishop's only retreat. The bishop is now trapped on h6 and will be captured.

### Trapping the Knight
Knights on the rim (edge of the board) are generally weaker because they control fewer squares. A knight on h6 attacked by pawns often has no escape.

**"A knight on the rim is dim"** is a common chess saying, reminding players to keep knights toward the center.

### Trapping the Queen
Queens are rarely trapped outright, but they can be chased around the board and forced to waste tempos retreating. A queen that over-extends in the early game is a common beginner mistake.

---

## How to Trap a Piece

1. Identify a piece that has limited mobility (on the edge, blocked by pawns, or far from supporting pieces).
2. Advance pawns to cut off its escape squares one at a time.
3. Attack the trapped piece with a less valuable piece to win the exchange.

---

## Avoiding Traps Yourself

- Always have an exit plan when advancing a piece into enemy territory.
- Count the number of safe squares your piece can retreat to before committing.
- Avoid putting pieces on the rim without a specific tactical reason.
- Watch for pawn advances that could close off retreat routes.
$lesson$),

  -- ----------------------------------------------------------------
  -- Tactics / Double Check
  -- ----------------------------------------------------------------
  (18, $lesson$
## Recap: What is a Double Check?

A **double check** is a special type of discovered check in which both the piece that moves AND the piece it reveals are both giving check to the king simultaneously.

The king is attacked by two pieces at once. This is the most powerful tactical weapon in chess, because the only legal response is to move the king.

---

## Why the King Must Move

In a normal check, the defender has three options:
1. Move the king.
2. Block the check.
3. Capture the checking piece.

In a **double check**, options 2 and 3 are impossible:
- You cannot block two different checks with one piece.
- You cannot capture two pieces in one move.

The king has no choice but to move, which severely limits the defense.

---

## Double Check and Checkmate

Because only a king move resolves a double check, double checks are frequently mating or near-mating. If the king has no safe squares to run to, the double check is checkmate.

**Example (Légal's Mate):**
1. e4 e5, 2. Nf3 Nc6, 3. Bc4 d6, 4. Nc3 Bg4, 5. Nxe5! (sacrificing the queen)... Bxd1?, 6. Bxf7+ Ke7, 7. Nd5# (double check and checkmate).

The knight on d5 and the bishop on f7 both give check. The king has no legal move. Checkmate.

---

## Setting Up a Double Check

You need the same setup as a discovered check, with one additional requirement: the piece you are moving must also give check in its new square.

Requirements:
1. A long-range piece (rook, bishop, or queen) aimed at the enemy king.
2. One of your pieces in between, ready to move.
3. A square the moving piece can jump to that simultaneously gives check AND uncovers the back piece's check.

These positions are rare, but when they appear, they are almost always decisive.

---

## Drilling Double Checks

When solving tactical puzzles, specifically look for:
- Positions where moving a knight gives check AND uncovers a rook or bishop check.
- Positions where moving a bishop reveals a rook attack on the king while the bishop itself gives check on a different diagonal.

The more you practice these patterns, the faster you will spot them in your own games.
$lesson$),

  -- ----------------------------------------------------------------
  -- Tactics / En Passant
  -- ----------------------------------------------------------------
  (19, $lesson$
## What is En Passant?

**En passant** is a special pawn capture in chess. The name comes from French and means "in passing."

It occurs when:
1. A pawn advances **two squares** from its starting position.
2. It lands **beside** an enemy pawn on the 5th rank.
3. The enemy pawn captures it **as if it had only moved one square**, landing on the square the pawn passed through.

**Critically:** En passant can only be played **immediately** on the very next move. If you do not capture en passant right away, the opportunity is gone permanently.

---

## Why En Passant Exists

In the original rules of chess, pawns could only advance one square at a time. The two-square advance was added later to speed up the opening. En passant was introduced as a compensation rule: a pawn should not be able to bypass an enemy pawn that would have captured it under the old rules.

---

## The Mechanics

**Example:**
- White has a pawn on e5. Black plays d7-d5 (advancing two squares).
- Black's pawn on d5 is now beside White's pawn on e5.
- White can capture en passant: exd6 (the white pawn moves to d6, and the black pawn on d5 is removed).

The captured pawn is removed from d5, not d6. This is the key detail that confuses beginners.

---

## Tactical Uses of En Passant

En passant is not just a rule to know. It is an active tactical tool:

- **Breaking a pawn chain.** If the opponent's pawn chain is locked, an en passant capture can shatter its structure.
- **Opening a file.** Capturing en passant opens a file for your rooks or reveals an attack.
- **Avoiding a doubled pawn.** Instead of recapturing toward the center and doubling a pawn, en passant recaptures toward the outside.

---

## Common Mistakes

- **Forgetting it is possible.** En passant is easy to overlook in the heat of a game. Always scan for en passant opportunities after the opponent advances a pawn two squares.
- **Missing that it expires.** You must play en passant immediately or not at all. Many players learn this the hard way.
- **Capturing the wrong pawn.** Remember: the captured pawn is on the 5th rank, not on the 6th rank where your pawn lands.

---

## Key Rule Summary

| Condition | Requirement |
|-----------|------------|
| Which pawns can capture | Pawns on the 5th rank only |
| What triggers it | Opponent advances a pawn two squares beside yours |
| When it can be played | Only on the immediately following move |
| Where the capturing pawn lands | The square the enemy pawn passed through (6th rank) |
| Where the captured pawn goes | Off the board (from the 5th rank) |
$lesson$),

  -- ----------------------------------------------------------------
  -- Endgames / Rook Endgames
  -- ----------------------------------------------------------------
  (6, $lesson$
## Why Rook Endgames Are the Most Common

Rooks are the last pieces to enter active play. They sit on their starting squares while pawns, knights, bishops, and queens are traded off. As the board clears, rooks come into their own. Statistically, rook endgames are the most frequently played endgame type in practical chess.

Mastering basic rook endgame technique is one of the highest-value investments you can make as a player.

---

## Rook vs. Pawn

When a rook faces a passed pawn, the outcome depends on how far the pawn has advanced and whether the defending rook can cut off the attacking king.

**The Lucena Position (winning):** The attacking side has its rook actively placed and its king in front of the pawn. The technique is called "building a bridge": the rook blocks the enemy rook's checks, shielding the king so the pawn can advance and promote.

**The Philidor Position (drawing):** The defending side holds a draw by placing the rook on the 6th rank (cutting off the attacking king) until the pawn advances, then switching to giving checks from behind. The key move order must be precise.

---

## Active vs. Passive Rooks

The single most important principle in rook endgames is: **keep your rook active**.

- A passive rook, pinned to defending a pawn, is weak and loses in the long run.
- An active rook, giving checks from behind or from the side, forces the opponent to deal with checks rather than advancing freely.

**Rook behind the passed pawn** is the strongest placement, whether you are attacking or defending.

---

## The 7th Rank

A rook on the 7th rank (or 2nd rank for Black) is devastating. It attacks all the pawns that have not yet moved off their starting squares and cuts the enemy king off from the action.

**Doubled rooks on the 7th rank** often force checkmate or win multiple pawns.

---

## King Activity

Just as in king and pawn endgames, the king is an important fighting piece in rook endgames. Do not leave your king passive on the back rank.

- Use your king to attack pawns.
- Use your king to support your own pawns.
- Coordinate king and rook to create passed pawns and advance them.

---

## Practical Tips

1. Put your rook behind passed pawns (yours or the opponent's).
2. Keep your rook active. Passive defense usually loses.
3. Cut off the enemy king with your rook to limit its range.
4. Learn the Lucena and Philidor positions. They appear constantly in real games.
5. Activate your king as soon as queens and minor pieces come off the board.
$lesson$),

  -- ----------------------------------------------------------------
  -- Endgames / Bishop Endgames
  -- ----------------------------------------------------------------
  (22, $lesson$
## Bishops in the Endgame

Bishops are long-range pieces that become more powerful as the board opens up. In the endgame, with fewer pawns in the way, bishops can sweep across the board in a single move. However, they have a critical limitation: a bishop is permanently confined to squares of one color.

---

## Same-Color vs. Opposite-Color Bishops

### Same-Color Bishops
When both players have bishops that travel on the same color, the endgame is a **same-color bishop endgame**. The stronger side can use the bishop aggressively. Pawns on the opposite color from the bishop are particularly useful because the enemy bishop cannot attack them.

**Principle:** Place your pawns on squares of the opposite color to your bishop. This gives your bishop maximum open diagonals and prevents your pawns from being attacked by the enemy bishop.

### Opposite-Color Bishops
When one player has a light-squared bishop and the other has a dark-squared bishop, neither can directly challenge the other's pawns. This makes opposite-color bishop endgames famous for being drawn even with a pawn advantage.

**Why they draw:** The attacking bishop cannot chase the defender's pawns, and the defending bishop cannot be captured. Material advantage matters much less.

**Exception:** If the advantage is two or more extra pawns and the attacking king can assist, the win is often achievable despite opposite-colored bishops.

---

## The Wrong-Color Bishop

A **wrong-color bishop** endgame is a specific draw in king, bishop, and rook pawn vs. king endgames. If your bishop does not control the promotion square of your rook pawn, the defending king can reach the corner and the game is drawn by stalemate.

**Example:** White has a bishop on d3 and a pawn on a7. The promotion square is a8. If the bishop cannot reach a8 (because a8 is the wrong color), Black's king runs to a8 and sits there. White cannot force it out without stalemating it.

---

## Good vs. Bad Bishops

A **good bishop** operates on open diagonals with few of its own pawns blocking its movement.

A **bad bishop** is blocked by its own pawns, which sit on the same color as the bishop. It cannot move freely because all the critical squares are occupied by friendly pawns.

**How to improve a bad bishop:**
- Exchange it for the opponent's active bishop or a knight.
- Advance pawns off the bishop's color so the bishop has open diagonals.

---

## Key Principles

- Put your pawns on the opposite color to your bishop.
- In opposite-color bishop endgames, extra pawns often do not win.
- Identify whether your bishop is good or bad and act accordingly.
- Know the wrong-color bishop draw: it appears in practical play more often than expected.
$lesson$),

  -- ----------------------------------------------------------------
  -- Endgames / Knight Endgames
  -- ----------------------------------------------------------------
  (23, $lesson$
## Knights in the Endgame

Knights are short-range pieces. Unlike bishops, they can reach any square on the board given enough time. However, they are slow: a knight can take two or more moves to travel from one side of the board to the other.

In the endgame, this slowness becomes critical. Knights struggle to catch passed pawns and can fall behind in pawn races.

---

## Knight vs. Pawn

When a knight faces a lone passed pawn, whether the knight can stop it depends on the pawn's speed and the knight's distance.

**Key insight:** A knight needs two moves minimum to cover significant ground. A pawn that is far away from the knight and close to promotion will often queen before the knight can intervene.

**Rule of thumb:** If the knight is more than two squares away (in knight moves) from the pawn's queening square, the pawn usually promotes.

---

## Knight vs. Bishop

Knight versus bishop is one of the most studied minor piece endgames. The result depends heavily on the pawn structure.

**Knights are better when:**
- The position is closed (pawns are locked). Knights can jump over the pawns while bishops are blocked.
- Pawns are on both sides of the board. Knights can hop across without penalty.
- The pawns are on both colors. Bishops on both colors are blocked by pawns; knights can reach any square.

**Bishops are better when:**
- The position is open. Bishops control long diagonals instantly.
- All pawns are on one side. The bishop covers the diagonal more efficiently than a knight can maneuver.
- Passed pawns exist that need to be blockaded at long range.

---

## The Knight's Weakness on the Rim

A knight on the edge of the board controls only four squares (instead of the usual eight in the center). A knight in the corner controls only two.

**"A knight on the rim is dim"** is the classic reminder. Keep knights toward the center of the board, where they are most effective.

---

## Knight Endings Are Like Pawn Endings

Because knights cannot move fast enough to stop multiple threats at once, knight endgames tend to be very tactical and concrete, similar to pure pawn endgames. Small differences in pawn structure can be decisive.

**Practical tips:**
- Centralize the knight as quickly as possible.
- Avoid placing the knight on the edge unless there is a specific tactical reason.
- In knight vs. knight endgames, the side with the better-placed knight and more active king usually wins.
- Watch for zugzwang: knight endgames are one of the few endgame types where zugzwang is a common weapon.
$lesson$),

  -- ----------------------------------------------------------------
  -- Endgames / Queen Endgames
  -- ----------------------------------------------------------------
  (24, $lesson$
## Queen Endgames

Queen endgames are the most complex single-piece endgames. Queens are enormously powerful and can cover vast distances in one move. However, this power creates its own complications: queens can be checked repeatedly, and perpetual check is a constant defensive weapon.

---

## Queen vs. Pawn

When a queen faces a lone passed pawn about to promote, the queen almost always wins, with one major exception.

**The exception: rook or bishop pawn on the 7th rank.** If the pawn is a rook pawn (a or h file) or a bishop pawn (b or g file) on the 7th rank (one step from queening), and the defending king is next to its own pawn, the attacker may only be able to draw.

**Why:** The queen can check the enemy king and force it near its own pawn. But with a rook or bishop pawn, the king can shelter beside the pawn in a stalemate corner. Each time the queen checks, the king hides. The attacking king must march closer to break the pattern, but this takes many moves.

**With other pawns (center pawns):** The queen wins easily because the stalemate trick does not apply.

---

## Queen vs. Queen

Queen vs. queen endgames with pawns are notoriously difficult to evaluate and play. Perpetual check is a constant resource for the weaker side.

**Key principles:**
- The side with the more advanced pawn usually has the advantage.
- A passed pawn on the 7th rank combined with a queen is often a decisive threat.
- Perpetual check: any time you are losing in a queen endgame, look for ways to check the enemy king repeatedly with no escape.

---

## Perpetual Check

Perpetual check is when a player gives check over and over again with no way to stop it. If the checked king can never escape the checks, the game is drawn.

**When to look for perpetual check:**
- You are losing material and cannot recover.
- The enemy king is exposed and your queen has active squares.
- The opponent's king is near the edge of the board.

**How to avoid it:** Keep your king safe and centralized. An exposed king in a queen endgame invites perpetual check.

---

## Practical Tips

1. Passed pawns are the key winning resource in queen endgames.
2. Beware of perpetual check: always verify your king is safe before pushing a passed pawn.
3. A queen and advanced pawn vs. lone queen is usually winning, but technique is required.
4. Queen endgames require precise calculation. Candidate moves must be evaluated carefully before committing.
$lesson$),

  -- ----------------------------------------------------------------
  -- Endgames / Zugzwang
  -- ----------------------------------------------------------------
  (25, $lesson$
## What is Zugzwang?

**Zugzwang** is a German word meaning "compulsion to move." In chess, a player is in zugzwang when every possible move worsens their position. They would prefer to pass, but chess does not allow passing. Any move they make loses something.

Zugzwang is most common in endgames, particularly pawn endgames and knight endgames, where each piece has a specific job. Moving a piece off its defensive post lets the opponent break through.

---

## Mutual Zugzwang

In **mutual zugzwang**, whichever side has to move is at a disadvantage. Both players would prefer to pass. The player who must move loses.

**Example:** White king on e5, Black king on e7, White pawn on e6. If it is Black to move, Black must give way (for example, Kd7 or Kf7), allowing White to advance the king and win. If it is White to move, Kf5 or Kd5 allows Black's king to maintain the opposition and hold the draw.

This is why opposition and triangulation (covered in an earlier lesson) matter so much: they are techniques for forcing mutual zugzwang onto your opponent.

---

## Zugzwang in King and Pawn Endgames

King and pawn endgames are full of zugzwang positions. The key concept:

- When both kings are facing each other in opposition, the player who must move is often in zugzwang.
- A single tempo (one extra move) can decide whether a pawn endgame is a win or a draw.

**Practical tip:** If you suspect zugzwang is a factor, count tempos carefully. Ask: if it were my opponent's turn right now, would they lose? If yes, find a way to pass the move to them (triangulation).

---

## Zugzwang in Other Endgames

While most common in pawn and knight endgames, zugzwang can appear in many contexts:

- **Rook endgames:** A rook forced to leave the defense of a pawn or an important rank.
- **Minor piece endgames:** A knight or bishop forced off a key blockading square.
- **King + pawn vs. king:** The defending king forced to step aside, allowing the attacking king to occupy a key square.

---

## Avoiding Zugzwang

When you sense zugzwang coming:
1. Look for active counterplay on another part of the board.
2. Consider piece exchanges that alter the structure and remove the zugzwang threat.
3. Create your own threats to distract the opponent.

When you want to create zugzwang for your opponent:
1. Restrict their pieces to as few squares as possible.
2. Use triangulation to pass the move when needed.
3. Play slowly and precisely: zugzwang rewards patience.

---

## Key Takeaway

Zugzwang is proof that chess is not just about attacking. Sometimes the strongest move is the one that forces your opponent to move.
$lesson$),

  -- ----------------------------------------------------------------
  -- Mates / Mate in 1
  -- ----------------------------------------------------------------
  (26, $lesson$
## What is Mate in 1?

A **mate in 1** puzzle gives you a position where you must find a single move that delivers checkmate immediately. The king is either already in check or can be put in check with no way to escape.

Solving mate in 1 puzzles builds pattern recognition, the ability to see checkmating threats instantly without deep calculation.

---

## How to Approach a Mate in 1

When looking for a mate in 1:

1. **Find the king.** Locate the enemy king and note which squares surround it.
2. **Count the escape squares.** How many squares can the king move to? Which of those are controlled by your pieces?
3. **Look for the mating piece.** Which piece can deliver check to the king, and does that check leave the king with no legal escape?

The king is mated when:
- It is in check.
- Every adjacent square is either occupied by a friendly piece or controlled by an enemy piece.
- It cannot capture the checking piece (because the piece is defended or capturing it still leaves the king in check).

---

## Common Mate in 1 Patterns

### Queen Delivers Back Rank Mate
The queen slides to the back rank. The king is blocked by its own pawns and cannot escape.

### Rook on the Back Rank
A rook delivers checkmate along the opponent's first or last rank. The pawns in front of the king serve as the prison bars.

### Knight Mate in the Corner
A knight delivers check. The king is in the corner and the knight's attack pattern covers every escape square while friendly pieces block the rest.

### Bishop or Queen on a Diagonal
The king is on the edge or has limited escape squares. The bishop or queen delivers a diagonal check with no way out.

---

## Why Mate in 1 Practice Matters

Beginner and intermediate players miss checkmates regularly, not because they do not know the rules, but because they do not scan the board systematically. Solving hundreds of mate in 1 puzzles trains your eye to see mating threats instantly.

**The habit:** Before each move in a real game, ask "can I checkmate my opponent right now?" Do this even when you do not think checkmate is possible. Eventually it becomes automatic.

---

## Tips for Solving

- Start with the king. Every mate in 1 involves the king in some way.
- Think about checks first. A checkmate is a check you cannot escape.
- Look at every piece you have. The mating piece is sometimes unexpected (a pawn, a bishop on a quiet diagonal, an underpromotion).
$lesson$),

  -- ----------------------------------------------------------------
  -- Mates / Mate in 2
  -- ----------------------------------------------------------------
  (27, $lesson$
## What is Mate in 2?

A **mate in 2** puzzle requires you to find a sequence of two moves that guarantees checkmate, regardless of how your opponent responds. Your first move must force the position such that every possible response leads to checkmate on your second move.

---

## The Structure of a Mate in 2

Every mate in 2 has the same structure:

1. **Move 1 (the key move):** A forcing move that puts your opponent in a situation where every legal response leads to checkmate.
2. **Move 2 (the threat):** Checkmate delivered against each of your opponent's possible defenses.

The key move does not need to be a check. Often the strongest key moves are quiet moves (not checks) that set up an unstoppable threat.

---

## Thinking Process

When solving a mate in 2:

1. **Identify checks.** What pieces can give check right now? Does any check lead immediately to mate (this would be a mate in 1)?
2. **Find the threat.** If your opponent passed and did nothing, what would you play on move 2 to checkmate them?
3. **Check every defense.** What are all of your opponent's legal moves? For each defense, does your threat still work, or do you need a different mate on move 2?
4. **Verify.** Confirm that for every legal response your opponent has, you have a mating move.

---

## Common Mate in 2 Themes

### Setting Up a Discovered Check
Move one piece to create a threat. On the next move, if the opponent cannot stop it, you uncover a check that mates.

### The Quiet Key Move
A non-checking move that positions a piece perfectly. Because it does not give check, the opponent must find an active defense, but every defense is inadequate.

### Zugzwang in Two
The key move puts the opponent in a position where every move weakens their king's defenses, and checkmate follows on move 2.

### Removing the Guard
Move 1 captures or deflects the piece defending the mating square. Move 2 delivers checkmate on that now-undefended square.

---

## Why Mate in 2 Is Important

Calculating two-move sequences builds the habit of asking "and then what?" after every move. This is the foundation of tactical calculation in chess. Players who can consistently see two moves ahead avoid hanging pieces, miss fewer threats, and find more decisive combinations.

---

## Practice Tip

After finding what you believe is the solution, test it against all opponent responses. A common mistake is to find a move that works against the most natural defense but misses a quieter defense that escapes mate.
$lesson$),

  -- ----------------------------------------------------------------
  -- Mates / Smothered Mate
  -- ----------------------------------------------------------------
  (28, $lesson$
## What is the Smothered Mate?

**Smothered mate** is a checkmate delivered by a knight in which the mated king is surrounded (smothered) by its own pieces. The king cannot escape because its own army blocks every square, and the knight delivers the final check.

It is one of the most elegant and satisfying patterns in all of chess.

---

## Why the Knight is Unique

Only a knight can deliver a smothered mate. This is because the knight is the only piece that jumps over other pieces. The king's own pawns and pieces block every escape square, but the knight can still reach the king by jumping over them.

No other piece has this property. A rook or bishop would be blocked too.

---

## The Classic Smothered Mate Setup

The most common smothered mate sequence is called the **Philidor Legacy** (after the famous player François-André Philidor):

1. White queen gives check on g8 (forcing the Black rook to capture).
2. White knight gives check on f7 (discovered check), forcing the Black king to h8.
3. White queen gives check again on h6, forcing the Black king back to g8.
4. White knight delivers smothered mate on f7.

At the final position, the Black king on g8 is completely surrounded by its own rook (on g8 after capturing earlier) and its own pieces. The knight on f7 delivers the fatal check.

---

## Recognizing Smothered Mate Positions

Look for these features:
1. The enemy king is in a corner or on the edge with its own pieces blocking its escape.
2. You have a knight that can reach the mating square (the square diagonally adjacent to the king's corner position).
3. You can force the king into the smothered position with a series of checks or forcing moves.

---

## Practical Occurrences

Smothered mate most often arises after a kingside castling when:
- The king is on g8 or h8.
- The pawns on f7, g7, h7 are still intact (or a rook is on g8).
- A knight reaches f6 or f7 with check.

---

## Key Insight

Smothered mate teaches an important lesson: having more pieces does not always mean safety. A cramped, passive position can become a death trap when the king is surrounded by its own army.
$lesson$),

  -- ----------------------------------------------------------------
  -- Mates / Opera Mate
  -- ----------------------------------------------------------------
  (29, $lesson$
## What is the Opera Mate?

The **Opera Mate** is a checkmate pattern in which a rook delivers checkmate on the back rank, supported by a bishop, while the mated king is blocked by one of its own pieces (typically a pawn or another piece on the same rank).

It gets its name from a famous game played in 1858 by Paul Morphy against the Duke of Brunswick and Count Isouard at the Paris Opera house during a performance. Morphy, said to have been annoyed at being pulled away from the opera, dispatched his opponents in a brilliant 17-move game.

---

## The Mating Pattern

**Setup:**
- The enemy king is on the back rank (rank 8 for Black).
- A friendly piece (pawn or other piece) blocks the king from moving backward or sideways.
- A rook attacks the king on the back rank.
- A bishop defends the rook (or the rook is supported some other way), so the king cannot capture it.

**Example:**
- Black king on d8, Black pawn on d7 (blocking d7 escape).
- White rook on d1 delivers check on d8.
- White bishop on g5 (or another square) defends the rook.
- The king cannot capture the rook because it is defended, cannot escape because its own pawn blocks it, and has no other legal moves.

---

## Morphy's Opera Game

The original Opera Game illustrates the pattern beautifully. The key final position:

- White rook on d8 delivers checkmate to the Black king on e8.
- White bishop on b5 defends the rook.
- Black's own rooks (on d8 and elsewhere) and pawns completely smother the king with no escape.

The game is famous not just for the finish but for how Morphy used every move to develop pieces with threats, sacrificed a bishop and a rook to force the opponent's pieces onto passive squares, and then delivered a clean checkmate.

---

## What the Opera Mate Teaches

1. **Development matters.** All of Morphy's pieces were actively placed. His opponents wasted moves on pawn grabs.
2. **King safety.** A king left in the center is vulnerable to exactly these kinds of back rank attacks.
3. **Piece coordination.** The rook and bishop work together: one attacks, the other defends it.

---

## Recognizing the Pattern

Look for the Opera Mate whenever:
- The enemy king is stuck on the back rank in the center.
- One of the opponent's own pieces blocks a key escape square.
- You have a rook that can slide to the back rank.
- A bishop, queen, or another piece can defend that rook once it lands.
$lesson$)

) AS v(id, content)
WHERE public.lessons.id = v.id;
