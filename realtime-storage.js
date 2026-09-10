(() => {
  const SUPABASE_URL = 'https://kwzbqntohggbaimfqiuu.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_5tDKexHtQVeqLYJYbtT3Ug_cn19ysY8';
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  window.storage = {
    async get(key, isShared) {
      if (!isShared) {
        const raw = localStorage.getItem(`octa_local_${key}`);
        return raw == null ? null : { value: raw };
      }
      const { data, error } = await client.from('shared_state').select('value').eq('key', key).maybeSingle();
      if (error) throw error;
      return data ? { value: data.value } : null;
    },
    async set(key, value, isShared) {
      if (!isShared) {
        localStorage.setItem(`octa_local_${key}`, value);
        return { ok: true };
      }
      const { error } = await client.from('shared_state').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
      return { ok: true };
    }
  };

  let refreshTimer = null;
  const refresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
      try {
        if (typeof loadData !== 'function' || typeof renderApp !== 'function') return;
        if (typeof state !== 'undefined') {
          if (state.currentModal || state.activeTab === 'livro' || state.welcomeOverlay) return;
          const input = document.getElementById('chat-text-input');
          if (input && input.value.trim()) return;
        }
        await loadData();
        renderApp();
      } catch (e) {
        console.warn('Realtime refresh:', e);
      }
    }, 120);
  };

  client.channel('octafin-shared-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_state' }, refresh)
    .subscribe();

  window.__octaRealtimeClient = client;
})();