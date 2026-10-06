// Word Quest - native Windows desktop shell.
//
// This is a thin host: it owns the window, the icon and the application menu,
// and renders the existing browser game (word-quest-game/index.html) inside a
// WebView2 control. No game logic lives here.

using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

[assembly: ComVisible(false)]
[assembly: AssemblyTitle("Word Quest")]

namespace WordQuestDesktop
{
    /// <summary>
    /// Owns the on-disk save. The page mirrors its LocalStorage to the host over
    /// the WebView2 message channel (see web-shim/host.js), and the host writes
    /// it here, so progress survives an app update or reinstall.
    /// </summary>
    internal static class SaveBridge
    {
        /// <summary>Writes the save atomically: temp file first, then swap.</summary>
        internal static void Write(string json)
        {
            try
            {
                Directory.CreateDirectory(AppPaths.SaveFolder);
                string path = AppPaths.SaveFile;
                string tmp = path + ".tmp";
                File.WriteAllText(tmp, json ?? "");
                if (File.Exists(path)) File.Delete(path);
                File.Move(tmp, path);
            }
            catch { /* a failed save must never take the app down */ }
        }
    }

    internal static class Program
    {
        private const string AppName = "Word Quest";

        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string root = AppPaths.Root;
            string gameFile = Path.Combine(root, "web", "index.html");

            if (!File.Exists(gameFile))
            {
                MessageBox.Show(
                    "Word Quest could not find its game files.\r\n\r\n" +
                    "Expected:\r\n" + gameFile + "\r\n\r\n" +
                    "Re-run build.ps1 to restore the desktop build.",
                    AppName, MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            Application.Run(new QuestWindow(root, gameFile));
        }
    }

    internal static class AppPaths
    {
        /// <summary>Folder that contains the exe, with a portable fallback next to it.</summary>
        public static string Root
        {
            get
            {
                string exeDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
                string bundled = Path.Combine(exeDir, "web");
                if (Directory.Exists(bundled)) return exeDir;

                // Running from a build output folder: fall back to the repo layout.
                string repo = Path.GetFullPath(Path.Combine(exeDir, "..", ".."));
                if (Directory.Exists(Path.Combine(repo, "word-quest-game")))
                    return repo;
                return exeDir;
            }
        }

        /// <summary>Per-user save location, so progress survives an upgrade or reinstall.</summary>
        public static string SaveFolder
        {
            get
            {
                string dir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "WordQuest");
                Directory.CreateDirectory(dir);
                return dir;
            }
        }

        public static string SaveFile
        {
            get { return Path.Combine(SaveFolder, "wordQuestSave.json"); }
        }
    }

    internal sealed class QuestWindow : Form
    {
        private const string MenuReload = "&Reload";
        private const string MenuDevTools = "Developer &Tools";
        private const string MenuDataFolder = "Open &Save Folder";
        private const string MenuAbout = "&About Word Quest";

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern IntPtr LoadImage(IntPtr hinst, string name, uint type, int cx, int cy, uint flags);

        private const uint LR_LOADFROMFILE = 0x00000010;
        private const uint IMAGE_ICON = 1;

        private readonly WebView2 _web;
        private readonly string _root;

        public QuestWindow(string root, string gameFile)
        {
            _root = root;

            Text = AppName();
            MinimumSize = new Size(900, 640);
            ClientSize = new Size(1280, 840);
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Color.FromArgb(12, 10, 8);
            Icon = LoadAppIcon();

            _web = new WebView2
            {
                Dock = DockStyle.Fill,
                DefaultBackgroundColor = Color.FromArgb(12, 10, 8),
                AllowExternalDrop = false
            };
            Controls.Add(_web);

            BuildMenu();
            Shown += OnShown;

            // The browser engine can crash on shutdown; never let that take the app with it.
            FormClosing += (s, e) => SafeStop();
        }

        private static string AppName() { return "Word Quest"; }

        private static Icon LoadAppIcon()
        {
            string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "WordQuest.ico");
            try
            {
                if (File.Exists(iconPath))
                {
                    IntPtr h = LoadImage(IntPtr.Zero, iconPath, IMAGE_ICON, 0, 0, LR_LOADFROMFILE);
                    if (h != IntPtr.Zero) return Icon.FromHandle(h);
                }
            }
            catch { }
            return SystemIcons.Application;
        }

        private void BuildMenu()
        {
            var menu = new MenuStrip { BackColor = Color.FromArgb(24, 20, 16), ForeColor = Color.Gold };

            var game = new ToolStripMenuItem("&Game");
            game.DropDownItems.Add(MenuReload, null, (s, e) => Reload());
            game.DropDownItems.Add(new ToolStripSeparator());
            game.DropDownItems.Add(MenuAbout, null, (s, e) => ShowAbout());
            game.DropDownItems.Add(new ToolStripSeparator());
            game.DropDownItems.Add("E&xit", null, (s, e) => Close());
            menu.Items.Add(game);

            var view = new ToolStripMenuItem("&View");
            view.DropDownItems.Add("&Full Screen\tF11", null, (s, e) => ToggleFullScreen());
            view.DropDownItems.Add(MenuDevTools, null, (s, e) => OpenDevTools());
            menu.Items.Add(view);

            var help = new ToolStripMenuItem("&Help");
            help.DropDownItems.Add(MenuDataFolder, null, (s, e) => OpenSaveFolder());
            menu.Items.Add(help);

            MainMenuStrip = menu;
            Controls.Add(menu);
            menu.Dock = DockStyle.Top;

            // Keep the web view below the menu bar.
            _web.Dock = DockStyle.Fill;
            Controls.SetChildIndex(_web, 0);
        }

        private async void OnShown(object sender, EventArgs e)
        {
            try
            {
                // The WebView2 profile is kept out of the app folder on purpose, so
                // the shipped folder stays clean and a rebuild is never blocked.
                string userData = Path.Combine(Path.GetTempPath(), "WordQuestWebView");
                Directory.CreateDirectory(userData);

                CoreWebView2Environment env = await CoreWebView2Environment.CreateAsync(
                    userDataFolder: userData);

                await _web.EnsureCoreWebView2Async(env);
                var settings = _web.CoreWebView2.Settings;
                settings.AreDefaultContextMenusEnabled = true;
                settings.IsStatusBarEnabled = false;
                settings.AreDevToolsEnabled = true;
                settings.IsZoomControlEnabled = true;

                // Block navigation away from the local game and popups.
                _web.CoreWebView2.NavigationStarting += (s, args) =>
                {
                    if (!IsLocalGame(args.Uri)) args.Cancel = true;
                };
                _web.CoreWebView2.NewWindowRequested += (s, args) => args.Handled = true;

                // The saved game is injected up front as WQ_INITIAL_SAVE, and later
                // writes arrive from host.js over the WebView2 message channel.
                string shim = Path.Combine(_root, "web", "host.js");
                string initialSave = ReadSave();

                await _web.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(InitialSaveScript(initialSave));
                await _web.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(File.ReadAllText(shim));

                _web.CoreWebView2.WebMessageReceived += OnWebMessage;

                _web.CoreWebView2.Navigate("file:///" + Normalize(Path.Combine(_root, "web", "index.html")));
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Word Quest could not start its game view.\r\n\r\n" + ex.Message +
                    "\r\n\r\nIf this persists, install the Microsoft Edge WebView2 Runtime from go.microsoft.com.",
                    "Word Quest", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        /// <summary>Wraps the on-disk save as a page script that publishes it.</summary>
        private static string InitialSaveScript(string json)
        {
            string literal = json == null
                ? "null"
                : "'" + json.Replace("\\", "\\\\").Replace("'", "\\'")
                          .Replace("\r", "\\r").Replace("\n", "\\n") + "'";
            return "try{Object.defineProperty(window,'WQ_INITIAL_SAVE',{value:" + literal +
                   ",writable:false,configurable:false});}catch(e){};";
        }

        /// <summary>Reads the on-disk save, or null when the player is new.</summary>
        private static string ReadSave()
        {
            try
            {
                string path = AppPaths.SaveFile;
                return File.Exists(path) ? File.ReadAllText(path) : null;
            }
            catch { return null; }
        }

        /// <summary>Handles a save pushed from the page.</summary>
        private void OnWebMessage(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                string json = e.WebMessageAsJson ?? "";
                if (json.IndexOf("save", StringComparison.Ordinal) < 0) return;
                SaveBridge.Write(ExtractValue(json));
            }
            catch { /* a bad message must never take the app down */ }
        }

        /// <summary>Pulls the "value" string out of a small known message shape.</summary>
        private static string ExtractValue(string json)
        {
            int at = json.IndexOf("\"value\":", StringComparison.Ordinal);
            if (at < 0) return null;

            // Step past the colon and any spaces, then expect the opening quote.
            int i = at + 8;
            while (i < json.Length && json[i] == ' ') i++;
            if (i >= json.Length || json[i] != '"') return null;
            i++;

            var sb = new StringBuilder();
            for (; i < json.Length && json[i] != '"'; i++)
            {
                if (json[i] == '\\' && i + 1 < json.Length)
                {
                    char n = json[++i];
                    switch (n)
                    {
                        case 'n': sb.Append('\n'); break;
                        case 'r': sb.Append('\r'); break;
                        case 't': sb.Append('\t'); break;
                        case 'b': sb.Append('\b'); break;
                        case 'f': sb.Append('\f'); break;
                        case 'u':
                            sb.Append((char)Convert.ToInt32(json.Substring(i + 1, 4), 16));
                            i += 4;
                            break;                        default: sb.Append(n); break;
                    }
                }
                else sb.Append(json[i]);
            }
            return sb.ToString();
        }

        private bool IsLocalGame(string uri)
        {
            if (string.IsNullOrEmpty(uri)) return true;
            return uri.StartsWith("file://", StringComparison.OrdinalIgnoreCase);
        }

        private static string Normalize(string path)
        {
            return path.Replace('\\', '/').Replace(" ", "%20");
        }

        private void Reload()
        {
            if (_web.CoreWebView2 != null) _web.CoreWebView2.Reload();
        }

        private void OpenDevTools()
        {
            if (_web.CoreWebView2 != null) _web.CoreWebView2.OpenDevToolsWindow();
        }

        private void ToggleFullScreen()
        {
            if (FormBorderStyle == FormBorderStyle.None)
            {
                FormBorderStyle = FormBorderStyle.Sizable;
                WindowState = FormWindowState.Normal;
                MainMenuStrip.Visible = true;
            }
            else
            {
                FormBorderStyle = FormBorderStyle.None;
                WindowState = FormWindowState.Maximized;
                MainMenuStrip.Visible = false;
            }
        }

        private void OpenSaveFolder()
        {
            try { Process.Start("explorer.exe", "\"" + AppPaths.SaveFolder + "\""); }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Word Quest", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private void ShowAbout()
        {
            MessageBox.Show(
                "Word Quest\r\n\r\n" +
                "A word-search adventure: 48 campaign levels, 6 categories, words learned as you play.\r\n\r\n" +
                "Version 1.0.0\r\nBuilt as a native Windows app with WebView2.",
                "About Word Quest", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void SafeStop()
        {
            try { if (_web.CoreWebView2 != null) _web.CoreWebView2.Stop(); }
            catch { }
        }
    }
}
