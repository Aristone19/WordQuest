// Lists top-level windows belonging to the Word Quest process, and screenshots it.
// Usage: node winshot.mjs <out.png> [x,y] [x,y ...]   (client-relative clicks)
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const OUT = (process.argv[2] || "shot.png").replace(/\\/g, "\\\\");
const CLICKS = process.argv.slice(3).join("','");
const PS = `
$ErrorActionPreference='SilentlyContinue'
$sig='[DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc f, IntPtr p);
public delegate bool EnumProc(IntPtr h, IntPtr p);
[DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr h);
[DllImport("user32.dll",CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, System.Text.StringBuilder s, int m);
[DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
[DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
[DllImport("user32.dll",CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr h, System.Text.StringBuilder s, int m);
[DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
[DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint f);
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
[DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
[DllImport("user32.dll")] public static extern void mouse_event(uint f, uint x, uint y, uint d, IntPtr e);
public struct RECT { public int L,T,R,B; }'
Add-Type -MemberDefinition $sig -Name E -Namespace L
Add-Type -AssemblyName System.Drawing

$procs = @(Get-Process | Where-Object { $_.ProcessName -like 'WordQuest*' })
if($procs.Count -eq 0){ Write-Output 'NOPROCESS'; exit 0 }
$target = $procs[0].Id
Write-Output ("PID " + $target)

# Collected in a list: Write-Output inside a delegate callback is not captured.
$found = New-Object System.Collections.ArrayList
$cb = [L.E+EnumProc]{
  param($h,$p)
  $wpid = 0
  [void][L.E]::GetWindowThreadProcessId($h, [ref]$wpid)
  if($wpid -eq $target){
    $len = [L.E]::GetWindowTextLength($h)
    $sb = New-Object System.Text.StringBuilder ($len + 2)
    [void][L.E]::GetWindowText($h, $sb, $len + 2)
    $cn = New-Object System.Text.StringBuilder 256
    [void][L.E]::GetClassName($h, $cn, 256)
    [void]$found.Add([pscustomobject]@{
      H=$h; Vis=[L.E]::IsWindowVisible($h); Class=$cn.ToString(); Title=$sb.ToString()
    })
  }
  return $true
}
[void][L.E]::EnumWindows($cb, [IntPtr]::Zero)
Write-Output ("COUNT " + $found.Count)
foreach($w in $found){ Write-Output ("WIN vis=" + $w.Vis + " class=" + $w.Class + " title='" + $w.Title + "'") }

$target_win = $found | Where-Object { $_.Vis -and $_.Title -ne '' } | Select-Object -First 1
if(-not $target_win){ Write-Output 'NOVISIBLEWINDOW'; exit 0 }

[void][L.E]::SetForegroundWindow($target_win.H)
Start-Sleep -Milliseconds 1500
$r = New-Object L.E+RECT
[void][L.E]::GetWindowRect($target_win.H, [ref]$r)
$w2 = $r.R - $r.L; $h2 = $r.B - $r.T
Write-Output ("RECT \${w2}x\${h2}")
if($w2 -le 0 -or $h2 -le 0){ Write-Output 'BADRECT'; exit 0 }

# Optional synthetic clicks, given as client-relative x,y pairs.
function Click([int]$cx, [int]$cy){
  $pt = New-Object L.E+POINT
  $pt.X = $cx; $pt.Y = $cy
  [void][L.E]::ClientToScreen($target_win.H, [ref]$pt)
  [void][L.E]::SetCursorPos($pt.X, $pt.Y)
  Start-Sleep -Milliseconds 250
  [L.E]::mouse_event(0x0002, 0, 0, 0, [IntPtr]::Zero)
  Start-Sleep -Milliseconds 60
  [L.E]::mouse_event(0x0004, 0, 0, 0, [IntPtr]::Zero)
  Start-Sleep -Milliseconds 1000
  Write-Output ("CLICK \${cx},\${cy}")
}
foreach($c in @('${CLICKS}')){ if($c){ $p = $c.Split(','); Click ([int]$p[0]) ([int]$p[1]) } }
$bmp = New-Object System.Drawing.Bitmap $w2, $h2
$g = [System.Drawing.Graphics]::FromImage($bmp)
$dc = $g.GetHdc()
[void][L.E]::PrintWindow($target_win.H, $dc, 2)
$g.ReleaseHdc($dc); $g.Dispose()
$bmp.Save('${OUT}', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output 'SAVED'
`;

const tmp = process.env.TEMP + "\\ws-" + Date.now() + ".ps1";
fs.writeFileSync(tmp, PS, "utf8");
try {
  console.log(execFileSync(
    process.env.WINDIR + "\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", tmp],
    { encoding: "utf8", timeout: 60000 }
  ));
} catch (e) {
  console.log("ERR:", (e.stdout || "") + (e.stderr || ""));
} finally { fs.unlinkSync(tmp); }
