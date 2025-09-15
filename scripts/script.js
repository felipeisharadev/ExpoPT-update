// script.js
// Este arquivo deixa o HTML mais simples: o JavaScript faz o "trabalho pesado".
// Estratégia: ler o arquivo do <input type="file">, converter para Base64 (DataURL)
// e criar dinamicamente um campo oculto "arquivo64" para enviar ao Apps Script.
// O <form> envia para o <iframe name="janela_envio">, sem recarregar a página.
// O Apps Script responde com um postMessage, que capturamos abaixo.

document.addEventListener('DOMContentLoaded', () => {
  // Configurações (devem bater com o backend)
  const TAMANHO_MAX_MB = 10;
  const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

  // Referências aos elementos do HTML
  const formularioEnvio = document.getElementById('formulario_envio');
  const campoArquivo = document.getElementById('arquivo');           // input de arquivo (sem name!)
  const campoConsentimento = document.getElementById('consentimento'); // checkbox com name="consentimento"
  const botaoEnviar = document.getElementById('botao_enviar');
  const paragrafoMensagem = document.getElementById('mensagem');

  /**
   * Cria ou atualiza um <input type="hidden" name="<nome>"> dentro do formulário.
   * Usamos isso para inserir "arquivo64" com o conteúdo Base64 da imagem.
   */
  function criarOuAtualizarOculto(nome, valor) {
    let inputOculto = formularioEnvio.querySelector(`input[type="hidden"][name="${nome}"]`);
    if (!inputOculto) {
      inputOculto = document.createElement('input');
      inputOculto.type = 'hidden';
      inputOculto.name = nome;
      formularioEnvio.appendChild(inputOculto);
    }
    inputOculto.value = valor;
    return inputOculto;
  }

  /**
   * Intercepta o envio do formulário:
   * - valida tipo/tamanho da imagem
   * - lê como DataURL (Base64)
   * - cria o hidden "arquivo64"
   * - envia o form para o iframe "janela_envio"
   */
  formularioEnvio.addEventListener('submit', (evento) => {
    evento.preventDefault(); // impede envio imediato para prepararmos o Base64
    paragrafoMensagem.textContent = '';
    paragrafoMensagem.className = 'mensagem';

    const arquivo = campoArquivo.files[0];
    if (!arquivo) {
      paragrafoMensagem.textContent = 'Selecione um arquivo.';
      paragrafoMensagem.classList.add('erro');
      return;
    }
    if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
      paragrafoMensagem.textContent = 'Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.';
      paragrafoMensagem.classList.add('erro');
      return;
    }
    if (arquivo.size > TAMANHO_MAX_MB * 1024 * 1024) {
      paragrafoMensagem.textContent = `Arquivo excede ${TAMANHO_MAX_MB} MB.`;
      paragrafoMensagem.classList.add('erro');
      return;
    }
    if (!campoConsentimento.checked) {
      paragrafoMensagem.textContent = 'Marque o consentimento para continuar.';
      paragrafoMensagem.classList.add('erro');
      return;
    }

    botaoEnviar.disabled = true;
    paragrafoMensagem.textContent = 'Preparando arquivo...';

    // Converte a imagem para DataURL Base64 (ex.: "data:image/jpeg;base64,AAAA...")
    const leitor = new FileReader();
    leitor.onload = () => {
      const dataURL = leitor.result;

      // Cria/atualiza o campo oculto que o backend espera
      criarOuAtualizarOculto('arquivo64', dataURL);

      paragrafoMensagem.textContent = 'Enviando...';
      // Envia o form (a resposta voltará no iframe "janela_envio")
      formularioEnvio.submit();
    };
    leitor.onerror = () => {
      botaoEnviar.disabled = false;
      paragrafoMensagem.textContent = 'Falha ao ler o arquivo.';
      paragrafoMensagem.classList.add('erro');
    };
    leitor.readAsDataURL(arquivo);
  });

  /**
   * Recebe a resposta do Apps Script (enviada via postMessage no HTML de reply)
   * e atualiza a interface sem recarregar a página.
   */
  window.addEventListener('message', (evento) => {
    const dados = evento.data || {};
    botaoEnviar.disabled = false;

    if (dados.ok) {
      paragrafoMensagem.textContent = 'Foto enviada! Ela está na fila de moderação.';
      paragrafoMensagem.className = 'mensagem ok';
      // Limpa o formulário e remove o hidden "arquivo64" (higiene)
      formularioEnvio.reset();
      const oculto = formularioEnvio.querySelector('input[type="hidden"][name="arquivo64"]');
      if (oculto) oculto.remove();
    } else {
      paragrafoMensagem.textContent = 'Erro: ' + (dados.error || 'Falha ao enviar.');
      paragrafoMensagem.className = 'mensagem erro';
    }
  });
});
