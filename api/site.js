const SOURCE = 'https://raw.githubusercontent.com/bieldelax/siestema-de-voto/main/index.html';

const LIVE_BRIDGE = `
<script>
(() => {
  const SUPABASE_URL = 'https://kwzbqntohggbaimfqiuu.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_5tDKexHtQVeqLYJYbtT3Ug_cn19ysY8';
  const REST = SUPABASE_URL + '/rest/v1/shared_state';
  const BASE_HEADERS = {
    apikey: SUPABASE_KEY,
    Authorization: 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json'
  };

  async function sharedGet(key) {
    const url = REST + '?key=eq.' + encodeURIComponent(key) + '&select=value';
    const response = await fetch(url, { headers: BASE_HEADERS, cache: 'no-store' });
    if (!response.ok) throw new Error('Supabase GET ' + response.status);
    const rows = await response.json();
    return rows && rows.length ? { value: rows[0].value } : null;
  }

  async function sharedSet(key, value) {
    const url = REST + '?on_conflict=key';
    const headers = Object.assign({}, BASE_HEADERS, {
      Prefer: 'resolution=merge-duplicates,return=minimal'
    });
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ key, value, updated_at: new Date().toISOString() })
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error('Supabase SET ' + response.status + ' ' + body);
    }
    return { ok: true };
  }

  window.storage = {
    async get(key, isShared) {
      if (!isShared) {
        const raw = localStorage.getItem('octa_local_' + key);
        return raw == null ? null : { value: raw };
      }
      return sharedGet(key);
    },
    async set(key, value, isShared) {
      if (!isShared) {
        localStorage.setItem('octa_local_' + key, value);
        return { ok: true };
      }
      return sharedSet(key, value);
    }
  };

  let lastStamp = '';
  let syncing = false;

  async function pollChanges() {
    if (syncing) return;
    syncing = true;
    try {
      const response = await fetch(REST + '?select=key,updated_at&key=in.(employees,records,settings)&order=updated_at.desc&limit=3', {
        headers: BASE_HEADERS,
        cache: 'no-store'
      });
      if (!response.ok) return;
      const rows = await response.json();
      const stamp = JSON.stringify(rows || []);
      if (!lastStamp) {
        lastStamp = stamp;
        return;
      }
      if (stamp !== lastStamp) {
        lastStamp = stamp;
        if (typeof loadData === 'function' && typeof renderApp === 'function' && typeof state !== 'undefined') {
          const chatInput = document.getElementById('chat-text-input');
          if (!state.currentModal && state.activeTab !== 'livro' && !state.welcomeOverlay && !(chatInput && chatInput.value.trim())) {
            await loadData();
            renderApp();
          }
        }
      }
    } catch (e) {
      console.warn('Octafin live sync:', e);
    } finally {
      syncing = false;
    }
  }

  setInterval(pollChanges, 700);
  setTimeout(pollChanges, 250);
  window.__octafinLiveReady = true;
})();
</script>`;

module.exports = async function handler(req, res) {
  try {
    const response = await fetch(SOURCE, { cache: 'no-store' });
    if (!response.ok) throw new Error('Falha ao carregar index original');

    let html = await response.text();

    html = html.replaceAll("password: '12345'", "password: '123456'");
    html = html.replace('Senha de acesso (padrão: 12345)', 'Senha de acesso (padrão: 123456)');
    html = html.replace("name: 'Gabriel Sousa'", "name: 'Gabriel Souza'");

    const marker = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>';
    html = html.replace(marker, marker + LIVE_BRIDGE);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send('Erro ao carregar o site: ' + error.message);
  }
};
