const SOURCE = 'https://raw.githubusercontent.com/bieldelax/siestema-de-voto/main/index.html';

module.exports = async function handler(req, res) {
  try {
    const response = await fetch(SOURCE, { cache: 'no-store' });
    if (!response.ok) throw new Error('Falha ao carregar index original');

    let html = await response.text();

    html = html.replaceAll("password: '12345'", "password: '123456'");
    html = html.replace('Senha de acesso (padrão: 12345)', 'Senha de acesso (padrão: 123456)');
    html = html.replace("name: 'Gabriel Sousa'", "name: 'Gabriel Souza'");

    const marker = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>';
    const liveScripts = '\n<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n<script src="/realtime-storage.js"></script>';
    html = html.replace(marker, marker + liveScripts);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send('Erro ao carregar o site: ' + error.message);
  }
};
