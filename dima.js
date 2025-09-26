(function() {
    // --- Global state and constants ---
    if (document.getElementById('dima-client-container')) {
        // console.warn('Dima Client is already active or was not properly dismissed.');
        return;
    }

    const DIMA_CLIENT_ID = 'dima-client-container';
    const REQUIRED_KEY = 'g6UujJyXGGuubFESs4YbbKlWTdc3NnKmHEErSqNetFTFY0SZwB';

    // Variables for new Function scope
    let autoclickIntervalId = null;
    let isAutoclicking = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let autoclickerKeydownListener = null;
    let mouseMoveListenerGlobal = null;
    let matrixIntervalId = null;
    let matrixCanvas = null;
    let matrixCtx = null;
    const matrixFontSize = 12;
    let matrixColumns = 0;
    let matrixDrops = [];
    const matrixChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%^&*()+=_[]{}\\|;:?/.,<>-ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽltal';

    const stylesString = `
        :root {
           --dima-bg-dark: #282c34; --dima-bg-light: #3a3f4b; --dima-accent: #61afef;
           --dima-text: #abb2bf; --dima-text-bright: #ffffff; --dima-border: #4f5666;
           --dima-border-rgb: 79, 86, 102; /* For rgba usage */
           --dima-bg-dark-rgb: 40, 44, 52; /* For rgba usage */
           --dima-bg-light-rgb: 58, 63, 75;
           --dima-accent-rgb: 97, 175, 239; /* For #61afef */
           --dima-danger-rgb: 224, 108, 117; /* For #e06c75 */
           --dima-shadow: rgba(0, 0, 0, 0.5); --dima-shadow-light: rgba(var(--dima-accent-rgb), 0.3);
           --dima-success: #98c379; --dima-danger: #e06c75; --dima-rainbow-speed: 4s;
           --dima-animation-duration: 0.3s; --dima-animation-timing: cubic-bezier(0.25, 0.8, 0.25, 1);
           --dima-control-bar-height: 45px;
        }
        #${DIMA_CLIENT_ID} {
            position: fixed; top: 50px; left: 50px;
            min-height: var(--dima-control-bar-height); width: 520px;
            background-color: var(--dima-bg-dark); border: 1px solid var(--dima-border);
            border-radius: 16px; box-shadow: 0 15px 35px var(--dima-shadow);
            color: var(--dima-text); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            z-index: 9999999 !important; overflow: hidden; display: flex; flex-direction: column;
            opacity: 0; transform: scale(0.9) translateY(20px);
            transition: opacity var(--dima-animation-duration) var(--dima-animation-timing),
                        transform var(--dima-animation-duration) var(--dima-animation-timing),
                        width var(--dima-animation-duration) var(--dima-animation-timing),
                        min-height var(--dima-animation-duration) var(--dima-animation-timing);
            user-select: none;
        }
        #${DIMA_CLIENT_ID}.dima-minimized { width: 220px; min-height: var(--dima-control-bar-height); border-radius: 10px; }
        #${DIMA_CLIENT_ID}.dima-minimized #dima-main-interface { display: none; }
        #${DIMA_CLIENT_ID}.dima-minimized #dima-control-bar { border-bottom: none; }
        #${DIMA_CLIENT_ID}.dima-visible { opacity: 1; transform: scale(1) translateY(0); }
        #${DIMA_CLIENT_ID}.dima-rainbow-active { animation: dima-rainbow-border var(--dima-rainbow-speed) linear infinite; }
        @keyframes dima-rainbow-border {
            0%, 100% { border-color: hsl(0, 80%, 65%); box-shadow: 0 0 15px hsla(0, 80%, 65%, 0.5); } 17% { border-color: hsl(60, 80%, 65%); box-shadow: 0 0 15px hsla(60, 80%, 65%, 0.5); }
            33% { border-color: hsl(120, 80%, 65%); box-shadow: 0 0 15px hsla(120, 80%, 65%, 0.5); } 50% { border-color: hsl(180, 80%, 65%); box-shadow: 0 0 15px hsla(180, 80%, 65%, 0.5); }
            67% { border-color: hsl(240, 80%, 65%); box-shadow: 0 0 15px hsla(240, 80%, 65%, 0.5); } 83% { border-color: hsl(300, 80%, 65%); box-shadow: 0 0 15px hsla(300, 80%, 65%, 0.5); }
        }

        /* --- Key Screen Enhanced Styles --- */
        #dima-key-screen {
            padding: 40px; display: flex; flex-direction: column; align-items: center;
            text-align: center; transition: opacity 0.2s ease-out, transform 0.2s ease-out;
            width: 100%; box-sizing: border-box; background-color: var(--dima-bg-dark);
            gap: 25px; /* For spacing between elements */
        }
        #dima-key-screen.dima-hidden { opacity: 0; transform: scale(0.9); pointer-events: none; position: absolute; }
        #dima-key-title {
            font-size: 2em; font-weight: 600; color: var(--dima-text-bright);
            letter-spacing: 0.5px; margin-bottom: 0; /* Gap handles spacing */
        }
        #dima-key-instruction {
            font-size: 1em; margin-bottom: 0; color: var(--dima-text);
            max-width: 400px; line-height: 1.6;
        }
        #dima-key-display-container {
            display: flex; align-items: center; justify-content: space-between;
            background-color: rgba(var(--dima-bg-light-rgb), 0.7);
            border: 1px solid rgba(var(--dima-border-rgb), 0.5);
            border-radius: 10px; padding: 12px 18px;
            width: 100%; box-sizing: border-box;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
        }
        #dima-displayed-key {
            font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
            font-size: 1em; color: var(--dima-accent); word-break: break-all;
            flex-grow: 1; text-align: left; padding-right: 15px; user-select: text;
        }
        #dima-copy-key-button {
            background: transparent; border: none; color: var(--dima-text-bright);
            cursor: pointer; padding: 5px; font-size: 1.5em; line-height: 1;
            transition: color 0.2s, transform 0.2s;
        }
        #dima-copy-key-button:hover { color: var(--dima-accent); transform: scale(1.1); }
        #dima-key-input {
            width: 100%; padding: 15px;
            background-color: var(--dima-bg-light);
            border: 1px solid var(--dima-border); border-radius: 10px;
            color: var(--dima-text-bright); font-size: 1.1em; text-align: center;
            outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease;
            box-sizing: border-box; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        }
        #dima-key-input:focus {
            border-color: var(--dima-accent);
            box-shadow: 0 0 0 3px var(--dima-shadow-light), inset 0 1px 3px rgba(0,0,0,0.1);
        }
        #dima-key-input.dima-shake {
            animation: dima-shake 0.5s var(--dima-animation-timing);
            border-color: var(--dima-danger) !important;
        }
        #dima-key-button { /* Verify Access Button */
            width: 100%; padding: 15px 25px;
            background-color: var(--dima-accent); border: none; border-radius: 10px;
            color: var(--dima-bg-dark); font-weight: 700; font-size: 1.1em;
            cursor: pointer; transition: background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
            letter-spacing: 0.5px; box-sizing: border-box;
            box-shadow: 0 4px 10px rgba(var(--dima-accent-rgb), 0.25);
        }
        #dima-key-button:hover {
            background-color: hsl(207, 90%, 70%); /* Lighter accent */
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(var(--dima-accent-rgb), 0.35);
        }
        #dima-key-button:active {
            transform: translateY(0px) scale(0.98);
            box-shadow: 0 2px 5px rgba(var(--dima-accent-rgb), 0.2);
        }
        #dima-key-error {
            color: var(--dima-danger); font-size: 0.9em; margin-top: 0;
            min-height: 1.2em; visibility: hidden; opacity: 0;
            transition: opacity 0.2s ease, visibility 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
            padding: 10px 15px; border-radius: 8px; width: 100%; box-sizing: border-box;
            text-align: center;
        }
        #dima-key-error.dima-visible {
            visibility: visible; opacity: 1;
            background-color: rgba(var(--dima-danger-rgb), 0.1);
            border: 1px solid rgba(var(--dima-danger-rgb), 0.3);
        }
        @keyframes dima-shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); } 20%, 40%, 60%, 80% { transform: translateX(8px); } }
        /* --- End Key Screen Styles --- */
        
        #dima-control-bar { display: flex; align-items: center; justify-content: space-between; padding: 0 5px 0 15px; height: var(--dima-control-bar-height); background-color: var(--dima-bg-light); border-bottom: 1px solid var(--dima-border); cursor: move; }
        #dima-control-bar-title { font-size: 1.1em; font-weight: 600; color: var(--dima-text-bright); margin-right: auto; /* Pushes controls to the right */ }
        .dima-window-controls { display: flex; align-items: center; }
        .dima-window-controls button {
            background: none; border: none; color: var(--dima-text);
            font-family: 'Segoe UI Symbol', 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif; /* Better font stack for symbols */
            cursor: pointer;
            padding: 0; width: 40px; /* Uniform width */ height: var(--dima-control-bar-height); /* Match bar height */
            display: flex; align-items: center; justify-content: center;
            transition: color 0.2s ease, background-color 0.2s ease;
            line-height: 1;
        }
        .dima-window-controls button:hover { color: var(--dima-text-bright); background-color: rgba(var(--dima-border-rgb), 0.2); }
        .dima-window-controls button:active { background-color: rgba(var(--dima-border-rgb), 0.1); }
        #dima-settings-btn { font-size: 1.2em; }
        #dima-minimize-btn { font-size: 1.4em; font-weight: bold; } /* Adjusted for visual weight */
        #dima-close-btn { font-size: 1.1em; font-weight: bold; }  /* Adjusted for visual weight */
        #dima-close-btn:hover { color: var(--dima-text-bright); background-color: var(--dima-danger) !important; }

        #dima-main-interface { display: none; flex-direction: row; flex-grow: 1; opacity: 0; animation: dima-fadeInAndScaleMain var(--dima-animation-duration) var(--dima-animation-timing) forwards; animation-delay: 0.1s; min-height: 400px; position: relative;
            background-size: 300% 300%; /* Larger size for slower, more subtle movement */
            background-image: linear-gradient(135deg, 
                var(--dima-bg-dark) 0%, 
                var(--dima-accent) 25%, 
                var(--dima-bg-light) 50%, 
                var(--dima-accent) 75%, 
                var(--dima-bg-dark) 100%);
            animation: dima-liquid-background 20s ease-in-out infinite alternate, dima-fadeInAndScaleMain var(--dima-animation-duration) var(--dima-animation-timing) forwards 0.1s; /* Combined animations */
        }
        #dima-main-interface.dima-visible { display: flex; }
        @keyframes dima-liquid-background {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
        }
        @keyframes dima-fadeInAndScaleMain { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        #dima-sidebar { width: 160px; background-color: rgba(var(--dima-bg-dark-rgb), 0.6); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); padding: 15px 0; display: flex; flex-direction: column; border-right: 1px solid rgba(var(--dima-border-rgb), 0.4); flex-shrink: 0; z-index: 1; }
        .dima-nav-header { padding: 0 20px 15px 20px; font-size: 1.1em; font-weight: 600; color: var(--dima-text-bright); border-bottom: 1px solid rgba(var(--dima-border-rgb), 0.4); margin-bottom: 10px; }
        .dima-nav-item { display: flex; align-items: center; padding: 12px 20px; cursor: pointer; color: var(--dima-text); font-size: 0.95em; transition: background-color 0.2s ease, color 0.2s ease; position: relative; border-radius: 0 4px 4px 0; margin-right: -1px; }
        .dima-nav-item svg { margin-right: 10px; fill: currentColor; min-width:18px; }
        .dima-nav-item:hover { background-color: rgba(var(--dima-border-rgb),0.3); color: var(--dima-text-bright); }
        .dima-nav-item.active { color: var(--dima-accent); font-weight: 600; background-color: rgba(var(--dima-accent-rgb),0.15); }
        .dima-nav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 4px; height: 70%; background-color: var(--dima-accent); border-top-right-radius: 4px; border-bottom-right-radius: 4px; }
        #dima-content-area { flex-grow: 1; padding: 20px; display: flex; flex-direction: column; overflow-y: auto; max-height: 350px; scrollbar-width: thin; scrollbar-color: var(--dima-accent) var(--dima-bg-dark); background-color: rgba(var(--dima-bg-light-rgb), 0.5); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); z-index: 1;}
        #dima-content-area::-webkit-scrollbar { width: 8px; }
        #dima-content-area::-webkit-scrollbar-track { background: var(--dima-bg-dark); border-radius: 4px; }
        #dima-content-area::-webkit-scrollbar-thumb { background-color: var(--dima-bg-light); border-radius: 4px; border: 1px solid var(--dima-bg-dark); }
        #dima-content-area::-webkit-scrollbar-thumb:hover { background-color: var(--dima-accent); }
        .dima-content-section { display: none; animation: dima-contentFadeIn 0.4s var(--dima-animation-timing) forwards; }
        .dima-content-section.active { display: block; }
        @keyframes dima-contentFadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .dima-card { background-color: rgba(var(--dima-bg-dark-rgb), 0.7); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); border: 1px solid rgba(var(--dima-border-rgb), 0.3); }
        .dima-card-title { font-size: 1.1em; color: var(--dima-text-bright); margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(var(--dima-border-rgb),0.3); font-weight: 500; }
        #dima-proxy-section { display: flex; align-items: center; gap: 10px; }
        #dima-proxy-input { flex-grow: 1; padding: 10px; background-color: var(--dima-bg-dark); border: 1px solid var(--dima-border); border-radius: 8px; color: var(--dima-text-bright); font-size: 0.9em; outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        #dima-proxy-input:focus { border-color: var(--dima-accent); box-shadow: 0 0 0 3px var(--dima-shadow-light); }
        #dima-proxy-button, .dima-action-button { padding: 10px 18px; background-color: var(--dima-accent); border: none; border-radius: 8px; color: var(--dima-bg-dark); font-weight: 600; cursor: pointer; transition: background-color 0.2s ease, transform 0.15s ease; text-align:center; }
        #dima-proxy-button:hover, .dima-action-button:hover { background-color: hsl(207, 80%, 70%); transform: translateY(-2px) scale(1.02); }
        #dima-proxy-button:active, .dima-action-button:active { transform: translateY(0px) scale(0.98); }
        .dima-toggle-container { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(var(--dima-border-rgb),0.2); }
        .dima-card .dima-toggle-container:last-of-type { border-bottom: none; padding-bottom: 0; }
        .dima-card .dima-toggle-container:first-of-type { padding-top: 0; }
        .dima-toggle-label { font-size: 0.95em; display: flex; align-items: center; }
        .dima-toggle-label .dima-beta-tag, .dima-toggle-label .dima-new-tag { font-size: 0.7em; color: white; padding: 3px 6px; border-radius: 5px; margin-left: 8px; font-weight: bold; }
        .dima-toggle-label .dima-beta-tag { background-color: var(--dima-danger); }
        .dima-toggle-label .dima-new-tag { background-color: var(--dima-success); }
        .dima-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .dima-switch input { opacity: 0; width: 0; height: 0; }
        .dima-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--dima-bg-dark); transition: .3s var(--dima-animation-timing); border-radius: 24px; border: 1px solid rgba(var(--dima-border-rgb), 0.5); }
        .dima-slider:before { position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: var(--dima-text); transition: .3s var(--dima-animation-timing); border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
        input:checked + .dima-slider { background-color: var(--dima-accent); border-color: transparent;}
        input:checked + .dima-slider:before { transform: translateX(20px); background-color: white; }
        .dima-slider-container label { display: block; margin-bottom: 10px; font-size: 0.95em; }
        input[type='range'].dima-color-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 8px; background: linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red); border-radius: 5px; outline: none; cursor: pointer; border: 1px solid var(--dima-border); }
        input[type='range'].dima-color-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; background: var(--dima-accent); border-radius: 50%; border: 3px solid var(--dima-bg-dark); cursor: pointer; transition: background-color 0.2s ease, transform 0.2s ease; }
        input[type='range'].dima-color-slider::-moz-range-thumb { width: 18px; height: 18px; background: var(--dima-accent); border-radius: 50%; border: 3px solid var(--dima-bg-dark); cursor: pointer; transition: background-color 0.2s ease; }
        input[type='range'].dima-color-slider:hover::-webkit-slider-thumb { background-color: hsl(207, 80%, 70%); transform: scale(1.1); }
        input[type='range'].dima-color-slider:hover::-moz-range-thumb { background-color: hsl(207, 80%, 70%); }
        #dima-matrix-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999998; pointer-events: none; display: none; }
        #dima-script-input { width: 100%; height: 200px; background-color: var(--dima-bg-dark); color: var(--dima-text-bright); border: 1px solid var(--dima-border); border-radius: 8px; padding: 10px; margin-bottom: 10px; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; font-size: 0.9em; resize: vertical; box-sizing: border-box; }
        #dima-script-input:focus { border-color: var(--dima-accent); box-shadow: 0 0 0 3px var(--dima-shadow-light); }
        .dima-script-buttons-row { display: flex; gap: 10px; margin-bottom: 10px; }
        .dima-script-buttons-row:last-child { margin-bottom: 0; }
        .dima-script-buttons-row button { flex-grow: 1; padding: 10px 15px; border: none; border-radius: 8px; color: var(--dima-bg-dark); font-weight: 600; cursor: pointer; transition: background-color 0.2s ease, transform 0.15s ease; }
        .dima-script-buttons-row button:hover { transform: translateY(-2px) scale(1.02); }
        .dima-script-buttons-row button:active { transform: translateY(0px) scale(0.98); }
        #dima-script-execute-button { background-color: var(--dima-accent); }
        #dima-script-execute-button:hover { background-color: hsl(207, 80%, 70%); }
        #dima-script-execute-backup-button { background-color: var(--dima-bg-light); color: var(--dima-text-bright); border: 1px solid var(--dima-border); }
        #dima-script-execute-backup-button:hover { background-color: var(--dima-border); }
        #dima-script-save-button, #dima-script-load-button-styled { background-color: var(--dima-bg-light); color: var(--dima-text-bright); border: 1px solid var(--dima-border); }
        #dima-script-save-button:hover, #dima-script-load-button-styled:hover { background-color: var(--dima-border); }
        #dima-script-file-input { display: none; }
        .dima-about-info { text-align: center; padding: 10px 0; }
        .dima-about-info p { margin: 5px 0; font-size: 0.95em; }
        .dima-about-info .version { font-size: 0.9em; color: var(--dima-text); }
        .dima-about-info .credits { font-weight: 500; color: var(--dima-text-bright); }
        .dima-dark-mode-filter { filter: invert(1) hue-rotate(180deg); background-color: #1a1a1a; }
        .dima-dark-mode-filter img, .dima-dark-mode-filter video, .dima-dark-mode-filter iframe { filter: invert(1) hue-rotate(180deg); }
    `;

    const keyScreenHTMLString = `
        <div id="dima-key-screen">
            <div id="dima-key-title">Dima Client Access</div>
            <div id="dima-key-instruction">Please verify your access by pasting the provided key below.</div>
            <div id="dima-key-display-container">
                <code id="dima-displayed-key">${REQUIRED_KEY}</code>
                <button id="dima-copy-key-button" title="Copy Key"></button> <!-- Using a clipboard icon -->
            </div>
            <input type="password" id="dima-key-input" placeholder="Enter Key Here">
            <button id="dima-key-button">Verify & Enter</button>
            <div id="dima-key-error"></div>
        </div>
    `;

    const mainMenuHTMLString = `
        <div id="dima-control-bar">
            <span id="dima-control-bar-title">Dima Client</span>
            <div class="dima-window-controls">
                <button id="dima-settings-btn" title="Settings">⚙</button>
                <button id="dima-minimize-btn" title="Minimize">−</button>
                <button id="dima-close-btn" title="Close">✕</button>
            </div>
        </div>
        <div id="dima-main-interface">
            <div id="dima-sidebar">
                <div class="dima-nav-header">Navigation</div>
                <div class="dima-nav-item" data-section="proxy"> 
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24 5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8v-2z"/></svg>
                    Proxy
                </div>
                <div class="dima-nav-item" data-section="mods">
                     <svg viewBox="0 0 24 24" width="18" height="18"><path d="M3.783 14.394A3.001 3.001 0 016 12.001c0-1.102.602-2.055 1.481-2.555L6 6.001H3v2h1.51C3.568 8.878 3 10.366 3 12.001c0 1.02.312 1.948.844 2.723L3 16.001v2h3.007l-.224-.607zM21 6.001h-3l-1.488 3.445A2.99 2.99 0 0118 12.001a2.99 2.99 0 01-1.488 2.555L18 18.001h3v-2h-1.51a3.007 3.007 0 00.942-1.278c.14-.38.22-.791.22-1.223a3.001 3.001 0 00-1.068-2.127.436.436 0 00.068-.272c0-.414-.166-.798-.437-1.082A2.985 2.985 0 0019.51 8.001H21v-2zm-9 2a4 4 0 100 8 4 4 0 000-8zm0 6a2 2 0 110-4 2 2 0 010 4z"/></svg>
                    Mods
                </div>
                <div class="dima-nav-item" data-section="fun">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5s.67 1.5 1.5 1.5zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
                    Fun
                </div>
                <div class="dima-nav-item" data-section="script">
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"></path></svg>
                    Script
                </div>
            </div>
            <div id="dima-content-area">
                <div id="dima-content-section-proxy" class="dima-content-section">
                    <div class="dima-card"><div class="dima-card-title">Proxy Connection</div><div id="dima-proxy-section"><input type="text" id="dima-proxy-input" placeholder="Enter URL (e.g., google.com)"><button id="dima-proxy-button">Go</button></div></div>
                    <div class="dima-card"><div class="dima-card-title">Utilities</div>
                        <div class="dima-toggle-container"><span class="dima-toggle-label">VPN V1.6</span><label class="dima-switch"><input type="checkbox" id="dima-toggle-vpn"><span class="dima-slider"></span></label></div>
                        <div class="dima-toggle-container"><span class="dima-toggle-label">Anti Light Speed V2 <span class="dima-new-tag">NEW</span></span><label class="dima-switch"><input type="checkbox" id="dima-toggle-als"><span class="dima-slider"></span></label></div>
                        <div class="dima-toggle-container"><span class="dima-toggle-label">Anti Admin V1.4</span><label class="dima-switch"><input type="checkbox" id="dima-toggle-aa"><span class="dima-slider"></span></label></div>
                        <div class="dima-toggle-container"><span class="dima-toggle-label">Virtual Clone <span class="dima-beta-tag">BETA</span></span><label class="dima-switch"><input type="checkbox" id="dima-toggle-vc"><span class="dima-slider"></span></label></div>
                    </div>
                </div>
                <div id="dima-content-section-mods" class="dima-content-section">
                    <div class="dima-card"><div class="dima-card-title">Page Tools</div>
                        <div class="dima-toggle-container"><span class="dima-toggle-label">Dark Website</span><label class="dima-switch"><input type="checkbox" id="dima-toggle-dark"><span class="dima-slider"></span></label></div>
                        <div class="dima-toggle-container"><span class="dima-toggle-label">Light Website</span><label class="dima-switch"><input type="checkbox" id="dima-toggle-light"><span class="dima-slider"></span></label></div>
                        <div class="dima-toggle-container"><span class="dima-toggle-label">Inspect Page</span><label class="dima-switch"><input type="checkbox" id="dima-toggle-inspect"><span class="dima-slider"></span></label></div>
                    </div>
                     <div class="dima-card"><div class="dima-card-title">Page Actions</div>
                        <div class="dima-toggle-container"><span class="dima-toggle-label">Hard Reset Page</span><label class="dima-switch"><input type="checkbox" id="dima-toggle-hardreset"><span class="dima-slider"></span></label></div>
                        <div class="dima-toggle-container"><span class="dima-toggle-label">Destroy Page</span><label class="dima-switch"><input type="checkbox" id="dima-toggle-destroypage"><span class="dima-slider"></span></label></div>
                    </div>
                </div>
                <div id="dima-content-section-fun" class="dima-content-section">
                     <div class="dima-card"><div class="dima-card-title">Fun</div>
                        <div class="dima-toggle-container"><span class="dima-toggle-label">Matrix Effect</span><label class="dima-switch"><input type="checkbox" id="dima-toggle-matrix"><span class="dima-slider"></span></label></div>
                        <div class="dima-toggle-container"><span class="dima-toggle-label">Autoclicker (Stop: \`)</span><label class="dima-switch"><input type="checkbox" id="dima-toggle-autoclick"><span class="dima-slider"></span></label></div>
                        <div class="dima-toggle-container"><span class="dima-toggle-label">Page Spammer (100 Tabs, Once)</span><label class="dima-switch"><input type="checkbox" id="dima-toggle-pagespam"><span class="dima-slider"></span></label></div>
                    </div>
                </div>
                <div id="dima-content-section-script" class="dima-content-section">
                     <div class="dima-card">
                        <div class="dima-card-title">Script Executor</div>
                        <textarea id="dima-script-input" placeholder="Enter JavaScript code here..."></textarea>
                        <div class="dima-script-buttons-row">
                            <button id="dima-script-execute-button">Execute</button>
                            <button id="dima-script-execute-backup-button">Backup Execute</button>
                        </div>
                        <div class="dima-script-buttons-row">
                             <button id="dima-script-save-button">Save Script</button>
                             <button id="dima-script-load-button-styled">Load Script</button>
                             <input type="file" id="dima-script-file-input" accept=".js,.txt">
                        </div>
                    </div>
                </div>
                <div id="dima-content-section-settings" class="dima-content-section">
                    <div class="dima-card">
                        <div class="dima-card-title">About</div>
                        <div class="dima-about-info">
                            <p class="credits" style="font-size: 1.2em; color: var(--dima-accent);">Dima Client</p>
                            <p class="version">Version: V15.1</p> <!-- Increment version -->
                            <p>Developed by <span style="color: var(--dima-text-bright); font-weight:bold;">Kona</span> and <span style="color: var(--dima-text-bright); font-weight:bold;">Bozzz</span></p>
                        </div>
                    </div>
                    <div class="dima-card">
                        <div class="dima-card-title">Menu Appearance</div>
                        <div class="dima-toggle-container"><span class="dima-toggle-label">Rainbow Menu Border</span><label class="dima-switch"><input type="checkbox" id="dima-toggle-rainbow"><span class="dima-slider"></span></label></div>
                        <div class="dima-slider-container"><label for="dima-color-slider">Custom Menu Accent</label><input type="range" id="dima-color-slider" class="dima-color-slider" min="0" max="360" value="207"></div>
                    </div>
                     <div class="dima-card">
                        <div class="dima-card-title">Client Options</div>
                        <div class="dima-toggle-container"><span class="dima-toggle-label">Reset Menu</span><label class="dima-switch"><input type="checkbox" id="dima-toggle-resetmenu"><span class="dima-slider"></span></label></div>
                        <div class="dima-toggle-container"><span class="dima-toggle-label">Client Fix</span><label class="dima-switch"><input type="checkbox" id="dima-toggle-clientfix"><span class="dima-slider"></span></label></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const scriptParts = [
        `const DIMA_CLIENT_ID = '${DIMA_CLIENT_ID}';`,
        `const REQUIRED_KEY = '${REQUIRED_KEY}';`,
        "let autoclickIntervalId = null; let isAutoclicking = false; let lastMouseX = 0; let lastMouseY = 0;",
        "let autoclickerKeydownListener = null; let mouseMoveListenerGlobal = null;",
        "let matrixIntervalId = null; let matrixCanvas = null; let matrixCtx = null;",
        `const matrixFontSize = ${matrixFontSize}; let matrixColumns = 0; let matrixDrops = [];`,
        `const matrixChars = '${matrixChars.replace(/'/g, "\\'")}';`,
        `const stylesString = ${JSON.stringify(stylesString)};`,
        `const keyScreenHTMLString = ${JSON.stringify(keyScreenHTMLString)};`,
        `const mainMenuHTMLString = ${JSON.stringify(mainMenuHTMLString)};`,
        "const styleSheetElement = document.createElement('style'); styleSheetElement.textContent = stylesString; document.head.appendChild(styleSheetElement);",
        "const clientContainer = document.createElement('div'); clientContainer.id = DIMA_CLIENT_ID;",
        "function parseHTML(htmlString) { const template = document.createElement('template'); template.innerHTML = htmlString.trim(); return template.content.cloneNode(true); }",
        "clientContainer.appendChild(parseHTML(keyScreenHTMLString)); document.body.appendChild(clientContainer);",
        "setTimeout(() => { if (clientContainer) clientContainer.classList.add('dima-visible'); }, 10);",

        "const keyInputElement = document.getElementById('dima-key-input');",
        "const keyButtonElement = document.getElementById('dima-key-button');",
        "const keyErrorElement = document.getElementById('dima-key-error');",
        "const keyScreenElement = document.getElementById('dima-key-screen');",
        "const displayedKeyElement = document.getElementById('dima-displayed-key');",
        "const copyKeyButtonElement = document.getElementById('dima-copy-key-button');",
        "if (copyKeyButtonElement && displayedKeyElement) { copyKeyButtonElement.onclick = () => { try { navigator.clipboard.writeText(displayedKeyElement.textContent).then(() => { copyKeyButtonElement.textContent = '✓'; setTimeout(() => { copyKeyButtonElement.innerHTML = ''; }, 1500); }).catch(err => console.error('DimaClient: Failed to copy key: ', err)); } catch (e) { console.error('DimaClient: Clipboard API not available or failed.', e); } }; }",
        "const handleUnlockAttempt = () => { if (keyInputElement.value === REQUIRED_KEY) { keyErrorElement.classList.remove('dima-visible'); keyScreenElement.classList.add('dima-hidden'); setTimeout(() => { if (keyScreenElement && keyScreenElement.parentNode) keyScreenElement.remove(); clientContainer.appendChild(parseHTML(mainMenuHTMLString)); const mainInterface = document.getElementById('dima-main-interface'); if (!mainInterface) { console.error('DimaClient CRITICAL: #dima-main-interface NOT FOUND in DOM after append. HTML structure likely broken or parseHTML failed.'); if(typeof alert === 'function') alert('DimaClient Error: Failed to load main interface. Check console for details.'); return; } mainInterface.classList.add('dima-visible'); try { initializeMainMenu(); } catch (e) { console.error('DimaClient Error during initializeMainMenu:', e); if(typeof alert === 'function') alert('DimaClient Warning: Main interface loaded but initialization failed. Some features might not work. Error: ' + e.message); } }, 250); } else { keyInputElement.classList.add('dima-shake'); keyErrorElement.textContent = 'Incorrect Key. Access Denied.'; keyErrorElement.classList.add('dima-visible'); keyInputElement.value = ''; setTimeout(() => { keyInputElement.classList.remove('dima-shake'); }, 500); } };",
        "keyButtonElement.onclick = handleUnlockAttempt;",
        "keyInputElement.onkeypress = function(e) { if (e.key === 'Enter') { handleUnlockAttempt(); } else { keyErrorElement.classList.remove('dima-visible'); } };",

        "function drawMatrix() { if (!matrixCtx || !matrixCanvas) return; matrixCtx.fillStyle = 'rgba(0,0,0,0.05)'; matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height); matrixCtx.fillStyle = '#0F0'; matrixCtx.font = matrixFontSize + 'px monospace'; for (let i = 0; i < matrixDrops.length; i++) { const text = matrixChars[Math.floor(Math.random() * matrixChars.length)]; matrixCtx.fillText(text, i * matrixFontSize, matrixDrops[i] * matrixFontSize); if (matrixDrops[i] * matrixFontSize > matrixCanvas.height && Math.random() > 0.975) matrixDrops[i] = 0; matrixDrops[i]++; } }",
        "function initializeMainMenu() {",
        "const closeButton = document.getElementById('dima-close-btn');",
        "const minimizeButton = document.getElementById('dima-minimize-btn');",
        "const settingsButtonIcon = document.getElementById('dima-settings-btn');",
        "const controlBar = document.getElementById('dima-control-bar');",
        "const navItems = clientContainer.querySelectorAll('.dima-nav-item');",
        "const contentSections = clientContainer.querySelectorAll('.dima-content-section');",
        "const proxyInputElement = document.getElementById('dima-proxy-input');",
        "const proxyButtonElement = document.getElementById('dima-proxy-button');",
        "const colorSlider = document.getElementById('dima-color-slider');",
        "const toggleDark = document.getElementById('dima-toggle-dark');",
        "const toggleLight = document.getElementById('dima-toggle-light');",
        "const toggleRainbow = document.getElementById('dima-toggle-rainbow');",
        "const toggleInspect = document.getElementById('dima-toggle-inspect');",
        "const toggleVpn = document.getElementById('dima-toggle-vpn');",
        "const toggleAls = document.getElementById('dima-toggle-als');",
        "const toggleAa = document.getElementById('dima-toggle-aa');",
        "const toggleVc = document.getElementById('dima-toggle-vc');",
        "const toggleMatrix = document.getElementById('dima-toggle-matrix');",
        "const toggleAutoclick = document.getElementById('dima-toggle-autoclick');",
        "const togglePageSpam = document.getElementById('dima-toggle-pagespam');",
        "const toggleHardReset = document.getElementById('dima-toggle-hardreset');",
        "const toggleDestroyPage = document.getElementById('dima-toggle-destroypage');",
        "const toggleResetMenu = document.getElementById('dima-toggle-resetmenu');",
        "const toggleClientFix = document.getElementById('dima-toggle-clientfix');",
        "const scriptInput = document.getElementById('dima-script-input');",
        "const scriptExecuteButton = document.getElementById('dima-script-execute-button');",
        "const scriptExecuteBackupButton = document.getElementById('dima-script-execute-backup-button');",
        "const scriptSaveButton = document.getElementById('dima-script-save-button');",
        "const scriptLoadButtonStyled = document.getElementById('dima-script-load-button-styled');",
        "const scriptFileInput = document.getElementById('dima-script-file-input');",

        "let originalContentEditable = document.body.isContentEditable; let isMinimized = false;",
        "mouseMoveListenerGlobal = (e) => { lastMouseX = e.clientX; lastMouseY = e.clientY; };",
        "document.addEventListener('mousemove', mouseMoveListenerGlobal);",
        "const performClose = () => { if (isAutoclicking) { isAutoclicking = false; clearInterval(autoclickIntervalId); if (autoclickerKeydownListener) document.removeEventListener('keydown', autoclickerKeydownListener); autoclickerKeydownListener = null; if(toggleAutoclick) toggleAutoclick.checked = false;} if(mouseMoveListenerGlobal) document.removeEventListener('mousemove', mouseMoveListenerGlobal); mouseMoveListenerGlobal = null; if (matrixCanvas) matrixCanvas.remove(); if (matrixIntervalId) clearInterval(matrixIntervalId); matrixIntervalId = null; clientContainer.style.opacity = '0'; clientContainer.style.transform = 'scale(0.9) translateY(20px)'; setTimeout(() => { if (clientContainer && clientContainer.parentNode) clientContainer.remove(); if (styleSheetElement && styleSheetElement.parentNode) styleSheetElement.remove(); document.documentElement.classList.remove('dima-dark-mode-filter'); if (document.body.hasAttribute('data-dima-contenteditable-original')) { document.body.contentEditable = document.body.getAttribute('data-dima-contenteditable-original'); document.body.removeAttribute('data-dima-contenteditable-original'); } else { document.body.contentEditable = originalContentEditable; } document.body.style.cursor = ''; }, 300); };",
        "if (closeButton) closeButton.onclick = performClose;",
        "if (toggleResetMenu) { toggleResetMenu.onchange = function() { if (this.checked) { performClose(); /* It will uncheck itself on close logic if needed or stay checked */ } }; }",
        "if (minimizeButton) minimizeButton.onclick = function() { isMinimized = !isMinimized; clientContainer.classList.toggle('dima-minimized', isMinimized); this.innerHTML = isMinimized ? '➕' : '−'; this.title = isMinimized ? 'Restore' : 'Minimize'; };",
        "const activateTab = (sectionName) => { if (!contentSections || contentSections.length === 0) { console.warn('DimaClient: No content sections found to activate.'); return; } contentSections.forEach(section => section.classList.remove('active')); const targetContentSection = document.getElementById(`dima-content-section-${sectionName}`); if (targetContentSection) { targetContentSection.style.animation = 'none'; requestAnimationFrame(() => { targetContentSection.style.animation = ''; targetContentSection.classList.add('active'); }); } else { console.warn(`DimaClient: Target content section '${sectionName}' not found.`); } if (!navItems || navItems.length === 0) { console.warn('DimaClient: No nav items found to update.'); } else { navItems.forEach(nav => nav.classList.remove('active')); if (sectionName !== 'settings') { const targetNavItem = clientContainer.querySelector(`.dima-nav-item[data-section='${sectionName}']`); if (targetNavItem) targetNavItem.classList.add('active'); else console.warn(\`DimaClient: Target nav item for section '${sectionName}' not found.\`); } } if (isMinimized && sectionName !== '') { if (minimizeButton && minimizeButton.textContent === '➕') minimizeButton.click(); } };",
        "if (settingsButtonIcon) { settingsButtonIcon.onclick = function() { activateTab('settings'); }; }",
        "if (navItems && navItems.length > 0) { navItems.forEach(item => { item.onclick = function() { if (this.classList.contains('active')) return; activateTab(this.dataset.section); }; }); } else { console.warn('DimaClient: No navigation items found to attach click handlers.'); }",
        "if (proxyButtonElement && proxyInputElement) proxyButtonElement.onclick = function() { let url = proxyInputElement.value.trim(); if (!url) { if(typeof alert === 'function') alert('Please enter a URL.'); return; } if (!url.startsWith('http://') && !url.startsWith('https://')) { url = 'https://' + url; } const proxyServiceBase = 'https://proxyium.com/process?url='; try { window.location.href = proxyServiceBase + encodeURIComponent(url); } catch (e) { if(typeof alert === 'function') alert('Could not create proxy URL.'); console.error('Proxy URL error:', e); } };",
        // MODIFIED setupPlaceholderToggle calls:
        "const setupPlaceholderToggle = (checkbox, name, autoUncheck = true) => { if (!checkbox) { console.warn(`DimaClient: Toggle '${name}' DOM element not found.`); return; } checkbox.onchange = function() { if (this.checked) { console.log(`DimaClient: ${name} toggled ON.`); if (autoUncheck && name !== 'Client Fix') { setTimeout(() => { if (this) this.checked = false; console.log(\`DimaClient: ${name} auto-unchecked.\`); }, 100); } } else { console.log(`DimaClient: ${name} toggled OFF.`); } }; };",
        "setupPlaceholderToggle(toggleVpn, 'VPN V1.6', false);", // autoUncheck set to false
        "setupPlaceholderToggle(toggleAls, 'Anti Light Speed V2', false);", // autoUncheck set to false
        "setupPlaceholderToggle(toggleAa, 'Anti Admin V1.4', false);", // autoUncheck set to false
        "setupPlaceholderToggle(toggleVc, 'Virtual Clone', false);", // autoUncheck set to false
        "setupPlaceholderToggle(toggleClientFix, 'Client Fix', false);", // Already false, kept for consistency

        "if (toggleDark) toggleDark.onchange = function() { if (this.checked) { document.documentElement.classList.add('dima-dark-mode-filter'); if (toggleLight && toggleLight.checked) toggleLight.checked = false; } else { if (!toggleLight || !toggleLight.checked) document.documentElement.classList.remove('dima-dark-mode-filter'); } };",
        "if (toggleLight) toggleLight.onchange = function() { if (this.checked) { document.documentElement.classList.remove('dima-dark-mode-filter'); if (toggleDark && toggleDark.checked) toggleDark.checked = false; } };",
        "if (toggleRainbow) toggleRainbow.onchange = function() { clientContainer.classList.toggle('dima-rainbow-active', this.checked); if (!this.checked) { clientContainer.style.borderColor = ''; clientContainer.style.boxShadow = ''; } };",
        "if (toggleInspect) toggleInspect.onchange = function() { if (this.checked) { if (!document.body.hasAttribute('data-dima-contenteditable-original')) { document.body.setAttribute('data-dima-contenteditable-original', document.body.isContentEditable.toString()); } document.body.contentEditable = 'true'; document.body.style.cursor = 'text'; } else { if (document.body.hasAttribute('data-dima-contenteditable-original')) { document.body.contentEditable = document.body.getAttribute('data-dima-contenteditable-original'); } else { document.body.contentEditable = originalContentEditable; } document.body.style.cursor = 'default'; } };",
        "if (colorSlider) { const updateAccentColor = (hue) => { const newAccentColor = `hsl(${hue}, 80%, 65%)`; clientContainer.style.setProperty('--dima-accent', newAccentColor); colorSlider.style.setProperty('--dima-accent', newAccentColor); /* Update RGB var too */ const tempColor = newAccentColor.startsWith('#') ? newAccentColor : getComputedStyle(document.documentElement).getPropertyValue('--dima-accent').trim(); const match = tempColor.match(/^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i) || tempColor.match(/^hsl\\(\\s*(\\d+)\\s*,\\s*(\\d+)%\\s*,\\s*(\\d+)%\\s*\\)$/i); if(match && match.length >= 4 && !tempColor.startsWith('#')) { const r = parseInt( (255 * (parseFloat(match[3])/100) * (1 - (parseFloat(match[2])/100) * Math.abs(2 * 0.5 -1 )) + (parseFloat(match[2])/100) * (parseFloat(match[3])/100) * Math.abs(2 * 0.5 -1 )) ); /* This is complex, better to just get computed style */ const finalComputedColor = getComputedStyle(clientContainer).getPropertyValue('--dima-accent').trim(); const rgbMatch = finalComputedColor.match(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/); if(rgbMatch) clientContainer.style.setProperty('--dima-accent-rgb', `${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}`); } else if (match && match.length >=4 && tempColor.startsWith('#')) { clientContainer.style.setProperty('--dima-accent-rgb', `${parseInt(match[1], 16)}, ${parseInt(match[2], 16)}, ${parseInt(match[3], 16)}`); } }; colorSlider.oninput = function() { updateAccentColor(this.value); }; updateAccentColor(colorSlider.value); }",
        "if (toggleMatrix) toggleMatrix.onchange = function() { if (this.checked) { if (!matrixCanvas) { matrixCanvas = document.createElement('canvas'); matrixCanvas.id = 'dima-matrix-canvas'; document.body.appendChild(matrixCanvas); matrixCtx = matrixCanvas.getContext('2d'); matrixCanvas.height = window.innerHeight; matrixCanvas.width = window.innerWidth; matrixColumns = Math.floor(matrixCanvas.width / matrixFontSize); matrixDrops = []; for (let x = 0; x < matrixColumns; x++) matrixDrops[x] = 1; } matrixCanvas.style.display = 'block'; if (matrixIntervalId) clearInterval(matrixIntervalId); matrixIntervalId = setInterval(drawMatrix, 50); } else { if (matrixIntervalId) clearInterval(matrixIntervalId); matrixIntervalId = null; if (matrixCanvas) matrixCanvas.style.display = 'none'; } };",
        "if (toggleAutoclick) toggleAutoclick.onchange = function() { if (this.checked) { isAutoclicking = true; autoclickerKeydownListener = (e) => { if (e.key === '`' && isAutoclicking) { toggleAutoclick.checked = false; toggleAutoclick.dispatchEvent(new Event('change')); } }; document.addEventListener('keydown', autoclickerKeydownListener); if (autoclickIntervalId) clearInterval(autoclickIntervalId); autoclickIntervalId = setInterval(() => { if (!isAutoclicking) return; const el = document.elementFromPoint(lastMouseX, lastMouseY); if (el && typeof el.click === 'function' && clientContainer && el !== clientContainer && !clientContainer.contains(el)) { el.click(); } }, 100); } else { isAutoclicking = false; if(autoclickIntervalId) clearInterval(autoclickIntervalId); autoclickIntervalId = null; if (autoclickerKeydownListener) { document.removeEventListener('keydown', autoclickerKeydownListener); autoclickerKeydownListener = null; } } };",
        "if (togglePageSpam) togglePageSpam.onchange = function() { if (this.checked) { for (let i = 0; i < 100; i++) { window.open('about:blank', '_blank'); } this.checked = false; } };",
        "if (toggleHardReset) toggleHardReset.onchange = function() { if (this.checked) { location.reload(); /* Page will reload, state of checkbox doesn't matter after this */ } };",
        "if (toggleDestroyPage) toggleDestroyPage.onchange = function() { if (this.checked) { try { window.close(); } catch(e) { console.warn('DimaClient: window.close() failed. This usually happens if the window was not opened by a script.'); } this.checked = false; } };", // Auto uncheck destroy page as it might fail
        "const executeUserScript = (isBackup = false) => { const scriptToRun = scriptInput.value; if (scriptToRun) { try { (0, eval)(scriptToRun); console.log(`DimaClient: Executed script from input${isBackup ? ' (using backup method)' : ''}.`); } catch (err) { console.error(`DimaClient: Error executing script from input${isBackup ? ' (using backup method)' : ''}:`, err); if(typeof alert === 'function') alert('Error in your script:\\nName: ' + err.name + '\\nMessage: ' + err.message); } } else { if(typeof alert === 'function') alert('Script input is empty.'); }};",
        "if (scriptExecuteButton) scriptExecuteButton.onclick = () => executeUserScript(false);",
        "if (scriptExecuteBackupButton) scriptExecuteBackupButton.onclick = () => executeUserScript(true);",
        "if (scriptSaveButton && scriptInput) { scriptSaveButton.onclick = function() { const scriptContent = scriptInput.value; const blob = new Blob([scriptContent], { type: 'text/javascript;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'dima_script.js'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }; }",
        "if (scriptLoadButtonStyled && scriptFileInput && scriptInput) { scriptLoadButtonStyled.onclick = function() { scriptFileInput.click(); }; scriptFileInput.onchange = function(event) { const file = event.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = function(e) { scriptInput.value = e.target.result; }; reader.onerror = function() { if(typeof alert === 'function') alert('Error reading file.');}; reader.readAsText(file); event.target.value = null; } }; }",
        "let isDragging = false; let offsetX, offsetY;",
        "if (controlBar) controlBar.onmousedown = function(e) { if (e.target.closest('.dima-window-controls button')) return; isDragging = true; offsetX = e.clientX - clientContainer.offsetLeft; offsetY = e.clientY - clientContainer.offsetTop; clientContainer.style.transition = 'opacity var(--dima-animation-duration) var(--dima-animation-timing), transform var(--dima-animation-duration) var(--dima-animation-timing)'; controlBar.style.cursor = 'grabbing'; e.preventDefault(); };",
        "document.onmousemove = function(e) { if (!isDragging || !clientContainer) return; let newX = e.clientX - offsetX; let newY = e.clientY - offsetY; const currentClientHeight = isMinimized ? parseFloat(getComputedStyle(clientContainer).getPropertyValue('--dima-control-bar-height')) : clientContainer.offsetHeight; const currentClientWidth = isMinimized ? 220 : clientContainer.offsetWidth; const maxX = window.innerWidth - currentClientWidth; const maxY = window.innerHeight - currentClientHeight; newX = Math.max(0, Math.min(newX, maxX)); newY = Math.max(0, Math.min(newY, maxY)); clientContainer.style.left = newX + 'px'; clientContainer.style.top = newY + 'px'; };",
        "document.onmouseup = function() { if (isDragging) { isDragging = false; if(clientContainer) clientContainer.style.transition = `opacity var(--dima-animation-duration) var(--dima-animation-timing), transform var(--dima-animation-duration) var(--dima-animation-timing), width var(--dima-animation-duration) var(--dima-animation-timing), min-height var(--dima-animation-duration) var(--dima-animation-timing)`; if (controlBar) controlBar.style.cursor = 'move'; } };",
        "activateTab('proxy');",
        "}", // End of initializeMainMenu
    ];
    try {
        if (document.getElementById(DIMA_CLIENT_ID) && document.getElementById(DIMA_CLIENT_ID).querySelector('#dima-key-screen')) {
             console.warn("Dima Client key screen already present. Aborting duplicate injection attempt.");
             return;
        }
        new Function(scriptParts.join('\n'))();
    } catch (e) {
        console.error('DimaClient Outer Exec Error:', e);
        let stackTrace = e.stack ? e.stack.split('\n').slice(0,5).join('\n') : 'No stack available.';
        if(typeof alert === 'function') alert('DimaClient Outer Exec Error:\nName: ' + e.name + '\nMessage: ' + e.message + '\nStack: ' + stackTrace);
    }
})();
