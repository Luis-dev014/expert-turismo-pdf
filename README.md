# Expert Turismo Pro

Gerador de propostas de viagem com IA Gemini, Firebase e PDF multi-página.

## Como rodar localmente

```powershell
# Na pasta do projeto:
powershell -ExecutionPolicy Bypass -File .\server.ps1
```

Acesse: <http://localhost:8765/>

Para usar outra porta: `.\server.ps1 9000`

## O que mudou nesta versão

### Features novas
- **Hash routing funcional** — o link `#/p/{shareId}` agora abre uma view pública somente-leitura (lê da coleção `shared` do Firestore, sem auth)
- **Modo apresentação** — Ctrl+Shift+P ou botão "🎬 Apresentar" (fullscreen do preview pra mostrar pro cliente ao vivo)
- **IA Dia-a-Dia** — gera roteiro completo do destino baseado nas datas e nos serviços já cadastrados (não repete)
- **Importar serviços** — copia serviços de outras propostas (útil pra ter um "catálogo" de serviços reusáveis)
- **Duplicar serviço** — botão 📋 em cada card
- **Atalhos de teclado**: `Ctrl+S` (salvar), `Ctrl+N` (nova proposta), `Esc` (fechar modal), `Ctrl+Shift+P` (apresentação)
- **Auto-save** com indicador visual no header
- **Compartilhamento expandido**: além de copiar link, agora gera link direto pra WhatsApp e Email com mensagem pré-formatada

### Polish
- Responsividade até 600px (mobile)
- Animações suaves nos botões/cards
- Indicador de drag-and-drop
- Banner de aviso de segurança (dismissível) sobre a chave Gemini exposta
- Numeração de página nos PDFs de serviços ("1 / 5")
- Hover states refinados

### Bugfixes
- Capitalização e mojibake nos emojis do código original
- `imageUrl` legado migra pra `images[]` automaticamente
- Share view agora persiste no Firestore ANTES de mostrar o link (evita link quebrado)

## ⚠️ Segurança — leia antes de divulgar

### Chave Gemini exposta
A linha `const GEMINI_KEY = '...'` está visível no HTML público. Qualquer pessoa que abrir o link pode usar (e te cobrar). **Antes de divulgar publicamente**, faça uma das opções:

**Opção A — Cloudflare Worker (mais simples, gratuito):**
1. Crie um Worker em <https://workers.cloudflare.com/>
2. Cole:
   ```js
   export default {
     async fetch(req, env) {
       const url = new URL(req.url);
       const r = await fetch(`https://generativelanguage.googleapis.com${url.pathname}?key=${env.GEMINI_KEY}`, {
         method: req.method, headers: { 'Content-Type': 'application/json' }, body: req.body
       });
       return new Response(r.body, { status: r.status, headers: { 'Access-Control-Allow-Origin': '*' } });
     }
   }
   ```
3. Adicione `GEMINI_KEY` como variável de ambiente do Worker
4. No `index.html`, troque a URL da Gemini pelo seu Worker: `https://SEU-WORKER.workers.dev/v1beta/models/gemini-2.5-flash:generateContent`
5. Remova a const `GEMINI_KEY` do HTML

**Opção B — Firebase Cloud Function:**
- Use `onRequest` e leia a chave de `functions.config().gemini.key`

### Regras do Firestore
A coleção `shared` precisa de read público pra o link funcionar:
```
match /shared/{shareId} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.uid == resource.data.ownerUid;
}
match /users/{uid}/quotes/{id} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

## Como publicar online (URL pública)

### Firebase Hosting (recomendado, já está usando Firebase)
```powershell
# Instale Node.js primeiro: https://nodejs.org/
npm install -g firebase-tools
firebase login
firebase init hosting   # selecione o projeto, public dir = .
firebase deploy --only hosting
```

### Netlify Drop (zero config)
1. Vá em <https://app.netlify.com/drop>
2. Arraste a pasta `expert-turismo-pro/` na página
3. Pronto, URL pública gerada

## Próximos passos sugeridos (não implementados nesta rodada)

- **PDF nativo (texto pesquisável)**: hoje o PDF é gerado via html2canvas → vira imagem (grande, não pesquisável). Reescrever usando jsPDF.text() seria 50% menor e o cliente poderia copiar texto.
- **Templates de capa customizáveis** com upload de imagem hero
- **Modo Cliente** com botão "Aceitar proposta" que atualiza status no Firestore via Cloud Function
- **Múltiplas moedas no mesmo serviço** (mostrar conversão)
- **Histórico de versões** da proposta
- **PWA**: meta tags `manifest` + service worker pra funcionar offline e instalar como app
