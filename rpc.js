const { openWindows } = require('get-windows');
const RPC = require('discord-rpc');

const clientId = '1375825827119366184';
RPC.register(clientId);
const rpc = new RPC.Client({ transport: 'ipc' });

let lastTitle = null;
let lastType = null;
let isPaused = false;

async function getActiveWindow() {
  const windows = await openWindows();
  return windows[0]; // top-most window
}

function isYouTubeTitle(title = '') {
  return title.toLowerCase().includes('youtube');
}

function parseSpotifyTitleDotFormat(title = '') {
  // Replace ALL broken dot-like characters with a proper middle dot (·)
  // These patterns include mojibake and actual Unicode middle dot variants
  title = title.replace(/\u2022/g, '·')  // Normalize

  const parts = title.split('·').map(p => p.trim());

  if (parts.length === 2 ) {
    return {
      Artist: parts[0],
      Title: parts[1].split('-')[0]
    };
  }

  return null;
}

async function updatePresence() {
  if (isPaused) {
    if (lastType !== 'paused') {
      rpc.clearActivity();
      lastTitle = null;
      lastType = 'paused';
      console.log('[PAUSED] Presence cleared.');
    }
    return;
  }

  const win = await getActiveWindow();
  if (!win) return;

  const title = win.title || '';
  const app = win.owner?.name?.replace('.exe', '') || 'Unknown App';

  console.log(`▶️  Active Window: ${app} - ${title}`);

  // YouTube detection
  if (isYouTubeTitle(title)) {
    if (lastTitle !== title || lastType !== 'youtube') {
      rpc.setActivity({
        details: 'Watching YouTube',
        state: title,
        largeImageKey: 'youtube',
        largeImageText: `YouTube via ${app}`,
        startTimestamp: Date.now(),
        instance: false
      });
      lastTitle = title;
      lastType = 'youtube';
      console.log('📺 YouTube →', title);
    }
    return;
  }

  // Spotify detection (strict: only dot separator with "Spotify" at end)
  const spotifyInfo = parseSpotifyTitleDotFormat(title);
  if (spotifyInfo) {
    const songId = `${spotifyInfo.Artist} — ${spotifyInfo.Title}`;
    if (lastTitle !== songId || lastType !== 'spotify') {
      rpc.setActivity({
        details: spotifyInfo.Artist,
        state: spotifyInfo.Title,
        largeImageKey: 'spotify',
        largeImageText: 'Spotify Web',
        startTimestamp: Date.now(),
        instance: false
      });
      lastTitle = songId;
      lastType = 'spotify';
      console.log('🎵 Spotify Web →', songId);
    }
    return;
  }

  // Clear presence for unknown windows
  if (lastType !== 'other') {
    rpc.clearActivity();
    lastTitle = null;
    lastType = 'other';
    console.log('🧹 Cleared Presence: Unknown tab');
  }
}

function setPaused(state) {
  isPaused = state;
}

rpc.on('ready', () => {
  console.log('✅ Discord RPC Connected!');
  updatePresence();
  setInterval(updatePresence, 5000);
});

rpc.login({ clientId }).catch(console.error);

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  rpc.destroy().then(() => {
    console.log('🔌 RPC connection closed.');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Error closing RPC:', err);
    process.exit(1);
  });
});

module.exports = { updatePresence, setPaused };
