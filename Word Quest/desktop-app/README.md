# Word Quest — desktop edition

A native Windows app wrapper for Word Quest. The game itself is unchanged — it is
the same HTML/CSS/JS in `../word-quest-game`, hosted in a real window using the
Microsoft Edge WebView2 runtime.

## Build it

```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

Then run:

```
desktop-app\build\dist\WordQuest.exe
```

That is the whole process. No npm, Node, Visual Studio, or internet connection is
required — `build.ps1` uses `csc.exe`, the C# compiler that ships with Windows as
part of the .NET Framework.

The finished folder is about **10 MB** and is fully self-contained. Copy it
anywhere and double-click the exe.

## What you get

|                 |                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| Real app window | Native WinForms window, resizable, minimises and maximises like any app                                    |
| App icon        | Gold `W` icon, generated at 7 sizes from 16px to 256px so it stays sharp                                   |
| Menu bar        | **Game** (Reload, About, Exit), **View** (Full Screen, Developer Tools), **Help** (Open Save Folder)       |
| Keyboard        | Standard Windows shortcuts, `F11` for full screen, dev tools available from the menu                       |
| Offline         | No network needed at runtime                                                                               |
| Saves on disk   | Progress is written to `%APPDATA%\WordQuest\wordQuestSave.json`, so it survives an app update or reinstall |
| Profiles        | Pick or create a profile per player; every profile is kept inside that one save file                       |

## Where your save lives

```
%APPDATA%\WordQuest\wordQuestSave.json
```

Open it from **Help → Open Save Folder**.

This is deliberately _not_ inside the app folder. If you move or replace the app
folder, your progress stays put. Saves are written atomically (temp file, then
swap), so a crash mid-write cannot corrupt your game.

## How the save bridge works

The game stores progress in `localStorage`, which normally lives in a throwaway
browser profile. Two small pieces move that to a real file:

1. **`web-shim/host.js`** — injected before the game loads. It replaces
   `window.localStorage` with an in-memory version seeded from the on-disk save,
   and posts every change to the app over the WebView2 message channel. If this
   file is absent, the game simply uses normal `localStorage`, which is what
   happens when you play the browser version.
2. **`SaveBridge` in `src/Program.cs`** — receives those messages and writes the
   file.

Writes are coalesced, so a burst of saves costs one disk write.

## Layout

```
desktop-app/
  build.ps1              one-command build
  src/Program.cs         the native shell: window, icon, menu, save bridge
  web-shim/host.js       the save bridge that runs inside the page
  build/                 vendored WebView2 SDK (no download needed to build)
  build/dist/            the finished app you ship  <- generated
  assets/
    WordQuest.ico        the app icon
    make-ico.mjs         regenerates the icon
    preview-ico.mjs      renders icon sizes to PNG so you can eyeball them
  tools/
    winshot.mjs          screenshots the running app window
    play-test.mjs        plays a real puzzle in a browser, to verify the game
    profile-test.mjs     creates a profile and reports the save format
    smoke.mjs            198 game-logic tests (puzzles, scoring, campaign, shop)
    content-check.mjs    19 content tests (every word explained, no clashes)
    a11y-check.mjs       45 accessibility tests (keyboard play, ARIA, settings)
    keyboard-test.mjs    plays a puzzle with the keyboard in a real browser
    a11y-shot.mjs        opens the settings panel with every option on
    dom-stub.mjs         the shared fake DOM the tests run the game in
    optimize-images.mjs  shrinks the game's images
```

## Tests

Both suites run on plain Node — no npm, no test framework to install.

```powershell
node tools\smoke.mjs          # 198 tests: does the game work?
node tools\content-check.mjs  #  19 tests: is the content any good?
node tools\a11y-check.mjs     #  45 tests: is it playable without a mouse?
```

`smoke.mjs` covers puzzle generation, scoring, combos, the 48-level campaign and
star rules, power-ups, permanent upgrades, refunds and the codex. `content-check.mjs`
is the one that keeps the Learn feature honest: every playable word must have a real
definition, no word may appear in two categories, and no word may be a substring of
another (`RAIN` inside `RAINBOW` made a puzzle genuinely ambiguous). `a11y-check.mjs`
drives the keyboard cursor through a whole puzzle, including a diagonal.

If you add a word to a category, `content-check.mjs` will tell you if you forgot its
definition.

`keyboard-test.mjs` runs the same check in a real browser, which is the only way to
be sure focus and the live region behave as expected:

```powershell
node "<path-to>/browser.mjs" http://localhost:8000/index.html --script tools\keyboard-test.mjs
```

## Shrinking the images

The original images were very large — the coin icon alone was 2.19 MB — and they
dominated the size of the whole app. To re-measure or re-apply:

```powershell
node tools\optimize-images.mjs           # report only
node tools\optimize-images.mjs --apply   # rewrite the files
```

This resized images to the size they are actually displayed at, wrote opaque ones as
RGB rather than RGBA, and deleted any image nothing references. It never grows a
file: if re-encoding would be larger, the original is kept. The app went from 9.7 MB
to 3.8 MB.

## The icon

The icon is generated, not hand-drawn in an image editor:

```powershell
node assets\make-ico.mjs assets\WordQuest.ico
```

It draws a rounded dark-gold tile with a stroked `W` and a search-bar underline,
at 16, 24, 32, 48, 64, 128 and 256 px, with supersampled edges so the letter stays
smooth at every size. To check the result:

```powershell
node assets\preview-ico.mjs assets\WordQuest.ico <output-folder>
```

Edit the colours near the top of `make-ico.mjs` (`GOLD`, `BG`, `BG2`) to restyle it.

## Verifying a build

`tools/winshot.mjs` screenshots the running window, which is useful for confirming
a change actually rendered:

```powershell
node tools\winshot.mjs shot.png
```

`tools/play-test.mjs` drives a real puzzle in a browser engine — it starts Quick
Play, scans the rendered grid for hidden words, drags each one, and reports what
the game said:

```powershell
node "<path-to>/browser.mjs" http://localhost:8000/index.html --script tools\play-test.mjs
```

## Requirements

- Windows 10 or 11
- The **Microsoft Edge WebView2 Runtime**, which is preinstalled on Windows 11. If
  the app reports that it cannot start its game view and you are on Windows 10,
  install it from <https://go.microsoft.com/fw.microsoft.com/fwlink/p/?LinkId=2124703>.

## Notes and limits

- This is still a browser game inside a native shell. It is much better as an
  app — window, icon, menu, disk-based saves — but it is not a native rewrite.
- Local profiles (accounts) are included: on first launch you pick or create a profile, each with its
  own progress, optional PIN, rename, avatar and export/import. They live inside the same save file
  below, so **Help → Open Save Folder** and any backup of that file cover every profile at once.
- There is no *online* account system or leaderboard. Signing in from another PC would need a real
  server, which this app deliberately does not have. See the main README.
- The app is unsigned, so Windows SmartScreen may warn on first run. Choose
  **More info → Run anyway**.
- To package a proper installer (Start Menu entry, desktop shortcut, uninstaller)
  you would add something like Inno Setup or WiX on top of this build.
