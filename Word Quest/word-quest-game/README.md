# Word Quest

A complete playable web-based word-search game prototype built with HTML, CSS, and JavaScript.

## Included features
- **Quest Map campaign:** 6 chapters × 8 hand-named levels (48 levels), with star ratings (clear it / beat the star time / ≤ 1 mistake), sequential unlocking, and a boss level at the end of every chapter
- **Reproducible levels:** every campaign level and Daily Challenge uses a fixed seed, so the same level is the same puzzle for everyone
- **Words Learned codex:** every found word reveals its definition in-game and is saved to a searchable vocabulary list on the profile
- **Profiles (local accounts):** a profile per player on the device, with an optional 4-digit PIN, rename, avatar, export/import and delete. Each profile keeps its own level, coins, stars, campaign progress and codex
- Word-search puzzle generator
- Horizontal, vertical, diagonal, and reverse word placement
- Mouse/pointer drag selection (touch supported)
- Six categories
- Easy / Medium / Hard (Medium and Hard mix in the longer word list)
- Quick Play, Adventure and Time Rush modes
- Scoring and combo system
- Countdown timer
- Quest progress
- Daily Challenge
- Streak tracking
- Achievements
- Coins and rewards
- Boss Puzzle mode
- Random events
- Power-ups:
  - Time Boost — +15 seconds (star times are unaffected)
  - Word Hint — length, direction, first letter and board region of one hidden word
  - Word Finder — lights up a whole hidden word for 2 seconds and names it
  - 2× Points & Coins — doubles this puzzle's points and coins, and pays out only if you clear it
  - Mistake Shield — blocks one wrong guess, protecting your combo
- Permanent coin upgrades (Extra Time, Coin Charm, Scholar's Instinct, Steady Hand)
- Powers are also earned in the campaign: 3-star clears grant a Word Finder, chapter bosses grant a Time Boost and a Mistake Shield
- LocalStorage save system
- Profile / player progression
- Responsive dark-gold UI
- Simple synthesized sound effects
- Accessibility:
  - Fully playable with the keyboard alone, including diagonals
  - Reduce motion, high contrast, larger text, colour-blind friendly mode
  - Screen reader announcements for every found word, mistake and cursor move
  - Visible focus rings and a focusable puzzle grid

## Power-ups and coins
| Shop item | Price | Effect |
| --- | --- | --- |
| Word Hint | 20 | Length, direction, first letter and region of one hidden word — it never gives the answer |
| Mistake Shield | 30 | Blocks the next wrong guess |
| Time Boost | 35 | +15 seconds (star times are unaffected) |
| Word Finder | 60 | Lights up a whole hidden word for 2 seconds and names it |
| 2× Points & Coins | 120 | Doubles this puzzle's points and coins. A bet: it only pays out on a clear |

Permanent upgrades never expire and are the long-term use for your coins:

| Upgrade | Max level | Effect per level |
| --- | --- | --- |
| Extra Time | 3 | +5 seconds on every puzzle |
| Coin Charm | 3 | +10% coins from every cleared puzzle |
| Scholar's Instinct | 2 | One free Word Hint at the start of each puzzle |
| Steady Hand | 3 | Wrong guesses cost 5 fewer points |

Coins come from cleared puzzles, star bonuses, quests and random events. The shop is reachable from
both the home screen and inside a puzzle, and quitting a run refunds any activated power that never
triggered.

## Campaign rules
| Star | Requirement |
| --- | --- |
| ⭐ | Clear the level |
| ⭐⭐ | Clear it within the level's star time (shown on the Quest Map) |
| ⭐⭐⭐ | Finish with 1 mistake or fewer |

Earning a new star pays bonus coins, and clearing a level unlocks the next one. Difficulty ramps
inside each chapter: levels 1–3 are Easy, 4–6 are Medium, 7–8 are Hard, and the 8th is a boss.

## Profiles (local accounts)

Word Quest asks **who is playing** before the game starts. Each profile is a separate save: its own
level, coins, stars, campaign progress, word codex and upgrades.

| Action | Where | Notes |
| --- | --- | --- |
| Create a profile | Profile screen at startup | Name (2–16 characters), avatar, optional 4-digit PIN |
| Sign in | Click a profile card | Asks for the PIN only if one is set |
| Switch / sign out | 🐯 button in the top bar, or Profile → Switch profile | |
| Rename / avatar / add or remove a PIN | Profile screen card actions | |
| Delete | Profile screen card action | Asks for confirmation first |
| Back up or move a profile | Export / Import on the Profile screen | A profile is one small JSON file |

There is **no e-mail, password or server**. A PIN is hashed with SHA-256 and a random salt before being
stored, so it is never kept in plain text — but it guards against a sibling, not against an attacker.
Play is gated behind a profile, because without one there is nowhere to save.

A save made before profiles existed is not lost: on first run it is upgraded into a profile called
"Player 1", keeping its coins, level, stars and codex.

## Accessibility

Word Quest is playable with a keyboard alone, and reads out what a sighted player
would otherwise only see as colour and motion.

### Playing with the keyboard

| Key | Does |
| --- | --- |
| `Tab` | Move focus onto the puzzle board |
| Arrow keys | Move the cursor. Holding one walks its line. |
| `Space` or `Enter` | Anchor the first letter, then submit the word |
| A perpendicular arrow mid-word | Turn the selection into a diagonal |
| `Home` / `End` | Jump to the start or end of the row |
| `Page Up` / `Page Down` | Jump to the start or end of the column |
| `Escape` | Cancel the current word, with no penalty |

The cursor is drawn as a gold ring, so it is always obvious which letter is
selected — including for players who cannot rely on the highlight colour.

### Settings

Open the ⚙ button in the top bar, or press it in the header.

| Setting | Effect |
| --- | --- |
| Reduce motion | Turns off screen shake, pulses and sliding animations. Switched on automatically if the operating system asks for it. |
| High contrast | Brighter text, lighter panels and thicker borders on the dark background |
| Larger text | Increases all text by about 18% |
| Show keyboard hints | The instruction strip above the board |
| Colour-blind friendly | Moves gold and green to blue and orange, and adds a ✓ to found words so colour is never the only signal |

Settings are stored per profile, like everything else.

### Screen readers

A polite live region reads out the current selection, the letter under the cursor,
and every word found together with its definition. Wrong guesses go to a separate
assertive region, because a lost combo is the one thing worth interrupting for.

## How to run

1. Open the folder in Visual Studio or VS Code.
2. Open `index.html` in a browser.
3. For best results, use a local web server (for example Live Server in VS Code / Visual Studio static web server).

## Desktop app (Windows)

Word Quest also builds as a native Windows app with a real window, an app icon, a
menu bar, and saves that live on disk instead of in a throwaway browser profile.

```
cd desktop-app
powershell -ExecutionPolicy Bypass -File .\build.ps1
desktop-app\build\dist\WordQuest.exe
```

No npm, Node, Visual Studio or internet connection is required — the build uses
the C# compiler that ships with Windows. See `desktop-app/README.md` for details.

Progress is stored in `%APPDATA%\WordQuest\wordQuestSave.json`, so it survives
updating or moving the app folder. The browser version and the desktop app save to
different places, so progress does not carry across between them.

## Notes
This is a browser-only implementation and uses LocalStorage instead of a server database. Profiles are
local to the device: there are no online accounts and nothing is uploaded anywhere.

If your instructor later requires server-backed accounts, admin tools or a database, the project can be
upgraded with ASP.NET, PHP/MySQL, Node.js or another backend. It was built with that swap in mind —
`accountStoreLoad()` and `accountStoreWrite()` are the only two functions that touch storage, and the
profile screen already handles create, sign in, PIN, switch, rename, delete, export and import.

## Suggested next improvements
- Replace synthesized sounds with custom audio assets.
- Add original art/backgrounds.
- Add *online* accounts (sign in from any device) and a leaderboard. Local profiles
  already work offline; syncing them between machines needs a server and database.
- Add more puzzle categories and curated word definitions.
