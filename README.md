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
  - redundância de DISC em chaves planas: `pct_D`, `pct_I`, `pct_S`, `pct_C`
  - `behaviors_scores`, `behaviors_top`, `behaviors_bottom`
  - `quiz_version`, `submitted_at`
  - `page_url`, `referrer`, `user_agent`
  - `quiz_events`, `group_timings_ms`
- compatibilidade legada:
  - `nome`, `empresa`, `segmento`, `pct`, `behaviors_json`
  - `behaviorsTop`, `behaviorsBottom`, `pageUrl`, `userAgent`, `quizVersion`
