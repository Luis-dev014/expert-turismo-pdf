# Expert Turismo Pro — CLAUDE.md

Arquivo de contexto para Claude Code. Leia isso antes de qualquer tarefa neste projeto.

---

## O que é este projeto

**Expert Turismo Pro** é um SaaS gerador de propostas de viagem com IA, PDF multi-página e compartilhamento por link.

- **Stack:** React 18 (Hooks, sem build tool), Firebase Auth + Firestore, Google Gemini 2.5 Flash, jsPDF + html2canvas
- **Arquivo principal:** `index.html` na raiz (arquivo único, ~3100 linhas, tudo inline)
- **Deploy:** Vercel — o push no `main` faz deploy automático
- **Repositório:** https://github.com/Luis-dev014/expert-turismo-pdf

---

## Como rodar localmente

```powershell
# Rodar o servidor (sempre a partir da raiz do projeto):
powershell -ExecutionPolicy Bypass -Command "& '.\src\server.ps1' 7000"

# Acessar em:
http://localhost:7000/
```

- O `server.ps1` fica em `src/` mas precisa ser chamado da raiz do projeto
- Se a porta estiver ocupada, use outra: `7000`, `5000`, `4000`
- O `index.html` fica na raiz — o servidor usa `$PSScriptRoot` como base

---

## Git — regra importante para o Vercel não bloquear

```powershell
git config user.email "luis@experttur.com.br"
git config user.name "Luis Expert"
```

Sempre configurar esses dados antes de commitar. O Vercel valida o autor do commit.

---

## Estado atual — o que foi implementado

### ✅ Bloco 1: Correções de PDF (completo)
- `waitForFonts(maxWait=3000)` — polling robusto em vez de setTimeout fixo
- html2canvas com `scale: Math.min(devicePixelRatio, 2)` e `allowTaint: false`
- `validateQuote(quote)` — valida dados antes de gerar PDF, retorna `{valid, critical[], warnings[]}`
- Error handling com página fallback quando html2canvas falha

### ✅ Bloco 2: Quebra Automática de Página (completo)
- `autoPageBreak: true` no `DEFAULT_GALLERY_CONFIG`
- `getImagesPerPage(size, isLandscape)` calcula quantas imagens cabem por página
- Cada serviço com muitas imagens quebra em múltiplas páginas automaticamente

### ✅ Bloco 3: Sistema de Galeria com Presets (completo, validado)
- `DEFAULT_GALLERY_CONFIG` — config padrão por proposta
- `GALLERY_SIZE_PRESETS` com 5 tamanhos:
  - `XS` — Mini, 4 colunas
  - `S` — Pequeno, 3 colunas
  - `M` — Médio, 2 colunas (padrão)
  - `L` — Grande, 1 coluna
  - `XL` — Hero, 1 imagem por página
- `renderSmartGallery(imgs, cfg, isLandscape)` — renderiza galeria no PDF
- `renderDestinationGalleryHTML(quote)` — galeria de destino na capa
- `GalleryPreview` — componente React para preview ao vivo no editor
- `featureFirst: bool` — destaca primeira imagem como principal

---

## Estrutura de arquivos

```
saas-gerador-pdf/
├── index.html          ← ARQUIVO PRINCIPAL (React + toda a lógica)
├── CLAUDE.md           ← Este arquivo
├── README.md           ← Docs gerais do projeto
├── src/
│   ├── server.ps1      ← Servidor local PowerShell
│   ├── index.html      ← Cópia para o servidor servir (manter sincronizada)
│   ├── doc-sync.js     ← Sincroniza Obsidian após commits
│   ├── README.md
│   ├── vercel.json
│   └── api/api/
│       └── gemini.js   ← Proxy Vercel para Gemini API
└── docs/
    ├── CONTEXT.md
    └── logo-expert.svg
```

> **Atenção:** Após editar `index.html` na raiz, copiar para `src/index.html` também:
> ```powershell
> cp index.html src\index.html
> ```

---

## Commits chave

| Commit | O que fez |
|--------|-----------|
| `f39ef0d` | v10 inicial — galeria PDF, preço opcional |
| `936ed50` | Gemini API movida para proxy Vercel |
| `5520917` | Total da proposta manual/automático |
| `310bc07` | Fix total sem valores nos serviços |
| `27a8a51` | **Bloco 1 + Bloco 2** — PDF robusto + quebra automática |
| `6ea66f3` | Trigger redeploy Vercel |
| `40bbff5` | **Bloco 3** — Sistema de galeria XS/S/M/L/XL restaurado e validado |

---

## Features core do sistema

- **CRUD propostas** com auto-save (debounce 2.5s)
- **Firebase Auth** — Google + Email
- **Firestore dual-write** — `users/{uid}/quotes` + `shared/{shareId}` (para links públicos)
- **Hash routing** — `#/p/{shareId}` abre view pública somente-leitura
- **PDF generation** — html2canvas → jsPDF, múltiplas páginas, numeração "1 / 5"
- **IA Roteiro** — Gemini 2.5 Flash gera itinerário baseado em destino e datas
- **Modo Apresentação** — fullscreen (Ctrl+Shift+P)
- **Importar/Duplicar serviços** entre propostas
- **Drag-and-drop** para reordenar serviços
- **Compartilhamento** — link direto + WhatsApp + Email

---

## Próximos passos em aberto

Nenhum bloco pendente no momento. Ideias futuras do roadmap:

- PDF nativo com texto pesquisável (jsPDF.text() em vez de html2canvas → imagem)
- Templates de capa customizáveis com upload de imagem hero
- Modo Cliente com botão "Aceitar proposta" via Cloud Function
- Múltiplas moedas com conversão no mesmo serviço
- Histórico de versões da proposta
- PWA (manifest + service worker)

---

## Segurança — lembrete

A chave `GEMINI_KEY` está proxeada via `src/api/api/gemini.js` (Vercel). Não expor diretamente no HTML público em produção.

Firestore rules necessárias:
```
match /shared/{shareId} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.uid == resource.data.ownerUid;
}
match /users/{uid}/quotes/{id} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

---

**Última atualização:** 2026-05-23 — Todos os 3 blocos implementados e validados.
