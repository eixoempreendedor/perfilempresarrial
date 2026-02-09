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

- `ranking_json`
- `disc_pct`
- `primary`
- `secondary`
- `behaviors_top`
- `behaviors_bottom`
- dados do lead (`name`, `email`, `whatsapp`, `company`, `segment`)
- `quiz_version`
- `submitted_at`
