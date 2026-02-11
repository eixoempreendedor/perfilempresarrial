# perfil.empresarial

> App: Perfil do Dono — Ranking Drag & Drop

App web estático (HTML/CSS/JS) para quiz de perfil com ordenação por arrastar e cálculo DISC + comportamentos.

## Rodar localmente

Como é estático, basta abrir `index.html` no navegador ou servir com um servidor simples:

```bash
python3 -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Configuração

Edite `config.js` para ajustar:

- `SUBMIT_URL`: URL do Google Apps Script (endpoint `doPost`).
- `QUIZ_VERSION`: versão do quiz enviada no payload.
- `SEGMENTS`, `GROUPS` e `MAP` conforme necessidade.

## Melhorias implementadas

## Geração de relatório PDF

O app agora possui um botão **"Gerar relatório em PDF"** na tela de resultado.

Como funciona:

- monta placeholders dinâmicos com os dados do quiz + formulário final;
- gera um template de 12 páginas em A4 no navegador;
- renderiza página por página com `html2canvas` e exporta com `jsPDF`;
- baixa o arquivo automaticamente no dispositivo do usuário.

### Upload opcional para Google Drive

No `config.js`, configure `REPORT_UPLOAD_URL` com a URL do seu endpoint (Apps Script/Webhook/API) e mantenha `REPORT_FOLDER_ID` com a pasta de destino no Drive:

```js
export const REPORT_UPLOAD_URL = "https://...";
export const REPORT_FOLDER_ID = "1_QyLaXtPS6eJuvkfbjYhY5NLy0-p6jnJ";
```

Se configurado, após gerar o PDF o app envia `fileName`, `folderId`, `mimeType`, `contentBase64` e `meta` (nome, empresa, segmento, cidade, data e `folderId`).

> Configuração atual do projeto: `REPORT_UPLOAD_URL = SUBMIT_URL` para facilitar o passo 1 de testes.

- Progresso com estimativa dinâmica de tempo restante.
- Retomada de sessão via `localStorage` para evitar perda de progresso.
- Eventos de funil (início, visualização/conclusão de grupos, resultado, submit).
- Validação por campo no formulário final (email/WhatsApp/segmento/consentimento).
- Honeypot anti-bot (`website`) com bloqueio silencioso.
- Envio com timeout + retry e fallback para payload pendente em `localStorage`.

## Deploy no GitHub Pages

1. Suba os arquivos no repositório (branch `main`).
2. Vá em **Settings → Pages**.
3. Em **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: `main` e pasta `/ (root)`
4. Salve e aguarde a publicação.
5. Acesse a URL gerada do Pages.

## Payload enviado

No envio final, o app faz `fetch POST` para `SUBMIT_URL` com JSON contendo:

- contrato principal:
  - `name`, `email`, `whatsapp`, `company`, `segment`, `consent`
  - `ranking_json`, `disc_pct`, `primary`, `secondary`
  - `behaviors_scores`, `behaviors_top`, `behaviors_bottom`
  - `quiz_version`, `submitted_at`
  - `page_url`, `referrer`, `user_agent`
  - `quiz_events`, `group_timings_ms`
- compatibilidade legada:
  - `nome`, `empresa`, `segmento`, `pct`, `behaviors_json`
  - `behaviorsTop`, `behaviorsBottom`, `pageUrl`, `userAgent`, `quizVersion`

## Geração de PDF dinâmico + Google Drive

### Resposta curta

Você **não precisa** de agente de IA para montar o PDF com variáveis dinâmicas.

- Use IA apenas para **gerar o texto personalizado** de cada placeholder (opcional).
- A montagem do PDF pode ser 100% determinística com template + substituição de chaves.

### Arquitetura recomendada

1. O front-end envia o resultado atual para um endpoint (`/generate-report`).
2. O backend monta um objeto `placeholders` com todas as chaves (`{NOME_PESSOA}`, `{DISC_TIPO}`, etc.).
3. O backend (opcionalmente) chama IA para preencher campos narrativos curtos.
4. O backend renderiza HTML template (12 páginas A4) com as chaves preenchidas.
5. O backend converte para PDF (Puppeteer) com controle de margens, header/footer e page-break.
6. O backend sobe o arquivo no Google Drive e retorna `fileId` + link compartilhável.
7. O link entra no fluxo de WhatsApp.

### Fluxo sem IA (mais estável para começar)

- Mapeamento direto dos dados já existentes (`name`, `company`, `segment`, `disc_pct`, `primary`, `secondary`, `behaviors_top`, `behaviors_bottom`).
- Textos padrão por perfil DISC (biblioteca de frases fixa por tipo primário/secundário).
- Resultado: rápido, previsível e sem custo variável por token.

### Fluxo com IA (para aumentar percepção de personalização)

Use IA somente para os placeholders textuais, com regras rígidas de tamanho:

- `max_chars`: 90 por bullet, 220 no card “Ação prática”, etc.
- `temperature` baixa (0.2–0.4) para consistência.
- saída em JSON validado por schema antes de renderizar.

Exemplo de campos que podem vir da IA:

- `{DISC_RESUMO_1_FRASE}`
- `{TOP_FORCAS_3}`
- `{TOP_ATENCOES_2}`
- `{PLANO_30D_ACAO_PRINCIPAL}`
- `{SCRIPT_ABERTURA}` / `{SCRIPT_FECHAMENTO}`

### Upload no Google Drive

Opções:

- **Google Drive API (service account):** melhor para backend Node/Python, com controle de pasta e permissões.
- **Google Apps Script:** mais simples para MVP; recebe base64/arquivo e salva em pasta específica.

Sugestão prática:

- Pasta por mês + subpasta por segmento (`/Relatorios/2026-02/Clinicas`).
- Nome do arquivo: `Relatorio-{NOME_EMPRESA}-{NOME_PESSOA}-{YYYYMMDD}.pdf`.
- Permissão: `anyoneWithLink` apenas leitura para compartilhar no WhatsApp.

### Ponto crítico do HTML atual do Canva

No exemplo atual, o `downloadPDF()` tira **um canvas gigante da tela inteira** e “fatia” em páginas. Isso pode quebrar cortes de cards entre páginas.

Para qualidade profissional:

- Renderize cada `.page` separadamente (1 canvas por página) e adicione no `jsPDF` página a página; **ou**
- gere no backend com Puppeteer (`page.pdf`) usando CSS `@page` + `page-break-*`.

### Próximo passo sugerido

1. Fechar o template HTML final de 12 páginas com todos os placeholders.
2. Criar endpoint de geração (com ou sem IA).
3. Salvar PDF no Drive e devolver link.
4. Integrar com disparo de WhatsApp.
