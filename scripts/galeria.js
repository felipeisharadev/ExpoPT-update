// galeria.js — EXPO PT (somente Data URL)
const URL_APPS = 'https://script.google.com/macros/s/AKfycbwTHYvxUIQOyDcvGJnzmzCNmwATbspPby60wyTGszFWtBnq3vdmyGVRNsCqP-kM--jvwQ/exec';

const elGrade  = document.getElementById('grade_fotos');
const elStatus = document.getElementById('status');
const width = 250;
window.exibirGaleria = function (resposta) {
  if (!resposta || !resposta.ok) {
    elStatus.textContent = 'Não foi possível carregar a galeria.';
    return;
  }

  const itens = Array.isArray(resposta.itens) ? resposta.itens : [];
  elStatus.textContent = itens.length ? `${itens.length} foto(s)` : 'Nenhuma foto publicada ainda.';
  elGrade.innerHTML = '';

  for (const item of itens) {
    const card = document.createElement('article');
    card.className = 'card';

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = item.nome || 'Foto enviada';

    if (item.dataUrl) {
      img.src = item.dataUrl; 
      img.style.width = `${width}px`;// Exibe via Data URL (não depende de cookies/headers)
    } else {
      // Sinaliza claramente que faltou dataUrl (para depurar)
      img.alt = 'Sem dataUrl';
      img.src = '';
      const aviso = document.createElement('div');
      aviso.style.padding = '8px 10px';
      aviso.style.fontSize = '12px';
      aviso.style.color = '#b00020';
      aviso.textContent = 'Erro: item sem dataUrl';
      card.appendChild(aviso);
    }

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = item.nome || 'foto';

    card.appendChild(img);
    card.appendChild(meta);
    elGrade.appendChild(card);
  }
};

// Carrega lista via JSONP
(function carregarGaleriaJSONP() {
  const s = document.createElement('script');
  // não precisa mais de &thumb=1: o backend sempre inclui dataUrl
  s.src = `${URL_APPS}?acao=listar_publico&callback=exibirGaleria`;
  s.onerror = () => { elStatus.textContent = 'Erro ao carregar a lista de fotos.'; };
  document.body.appendChild(s);
})();
