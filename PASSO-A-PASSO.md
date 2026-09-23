# Luz no Campus: versão colaborativa (passo a passo)

Esta pasta contém a versão do Luz no Campus que funciona fora do Claude. Nela, **qualquer pessoa com o link pode ver o mapa**. Para **marcar pontos**, a pessoa entra com a conta Google e **pede acesso**, e só consegue marcar depois que você aprovar.

Como funciona:

- **Site:** GitHub Pages (gratuito) hospeda os arquivos desta pasta.
- **Banco de dados e login:** Firebase, do Google (plano gratuito "Spark"), guarda as marcações e faz o login com Google.
- **Sem configurar nada**, o app abre em **modo demonstração**: funciona, mas as marcações ficam só no aparelho. Serve para testar.

Tempo estimado: 30 a 45 minutos, uma única vez. Você precisa de uma conta Google, que pode ser a da UFSCar ou a pessoal. Para um projeto institucional, uma conta dedicada ao projeto facilita passar a administração para outra pessoa no futuro.

---

## Parte 1. Criar o projeto no Firebase

1. Acesse **console.firebase.google.com** e entre com sua conta Google.
2. Clique em **Criar um projeto** (ou "Adicionar projeto"), dê o nome `luz-no-campus` e avance. O Google Analytics pode ser **desativado**.
3. **Ativar o login com Google:**
   - No menu lateral, abra **Criação > Authentication** e clique em **Vamos começar**.
   - Na aba **Método de login**, escolha **Google**, clique em **Ativar**, informe o e-mail de suporte e clique em **Salvar**.
4. **Criar o banco de dados:**
   - No menu lateral, abra **Criação > Firestore Database** e clique em **Criar banco de dados**.
   - Localização: **southamerica-east1 (São Paulo)**. Essa escolha não pode ser alterada depois.
   - Modo: **produção**. Clique em **Criar**.
5. **Aplicar as regras de segurança:**
   - Ainda no Firestore, abra a aba **Regras**.
   - Apague o conteúdo e cole todo o conteúdo do arquivo **firestore.rules** desta pasta.
   - Clique em **Publicar**.
6. **Registrar o app da Web e copiar a configuração:**
   - Clique na engrenagem ao lado de "Visão geral do projeto" e depois em **Configurações do projeto**.
   - Em "Seus apps", clique no ícone **</>** (Web), dê o apelido `luz-no-campus` e clique em **Registrar app**. **Não** marque o Firebase Hosting.
   - Aparece um bloco `const firebaseConfig = { ... }`. Copie os valores (`apiKey`, `authDomain`, `projectId` etc.) para o arquivo **firebase-config.js** desta pasta, no lugar de cada `"COLE_AQUI"`.

Essas chaves **não são senhas**: elas identificam o projeto e podem ficar públicas. Quem protege os dados são as regras do passo 5.

## Parte 2. Publicar o site no GitHub Pages

1. Crie uma conta em **github.com**, se ainda não tiver.
2. Clique em **New repository** (botão "+" no canto superior direito).
   - Repository name: `luz-no-campus`
   - Marque **Public**. O GitHub Pages gratuito exige repositório público. Isso só expõe o código, não os dados.
   - Clique em **Create repository**.
3. Na página do repositório, clique em **uploading an existing file**.
4. Selecione **todos os arquivos desta pasta** (Ctrl+A) e arraste para a área de envio. Clique em **Commit changes**.
   - Não há subpastas: todos os arquivos ficam na raiz do repositório, junto do `index.html`.
5. Vá em **Settings > Pages**. Em "Build and deployment", escolha **Deploy from a branch**, branch **main**, pasta **/(root)**, e clique em **Save**.
6. Depois de um a dois minutos, o endereço aparece no topo dessa página, no formato:
   `https://diegobfusp.github.io/luz-no-campus/`

## Parte 3. Autorizar o endereço do site no login

1. No Firebase, abra **Authentication > Configurações > Domínios autorizados**.
2. Clique em **Adicionar domínio** e informe `diegobfusp.github.io` (sem `https://` e sem o `/luz-no-campus`).

Sem esse passo, o botão "Entrar com Google" dá erro de domínio não autorizado.

## Parte 4. Tornar-se administrador

Administradores **aprovam os pedidos de acesso**, podem **excluir qualquer ponto** e **importar backups**. Os demais colaboradores só excluem os pontos que eles mesmos marcaram.

1. Abra o site e clique em **Entrar**, com a sua conta Google.
2. No Firebase, abra **Authentication > Users** e copie o **UID do usuário** da sua conta (a coluna "UID do usuário", um código longo).
3. Abra **Firestore Database > Dados** e clique em **Iniciar coleção**:
   - ID da coleção: `admins`
   - ID do documento: cole o **UID** copiado
   - Adicione um campo `nome` (tipo string) com o seu nome. Clique em **Salvar**.
4. Recarregue o site. O círculo com a sua inicial ganha borda amarela, o Resumo passa a mostrar **Importar backup**, e o menu da sua conta ganha o botão **Pedidos de acesso**.

Repita o passo 3 para cada pessoa que você quiser como administradora.

## Parte 5. Trazer as marcações da versão do Claude (se houver)

1. Na versão do Claude, abra **Resumo > Baixar mapa (GeoJSON)**.
2. No site novo, entre como administrador e use **Resumo > Importar backup (GeoJSON)**.
3. Pontos já existentes (mesmo ID) são ignorados, então importar duas vezes não duplica nada.

## Parte 6. Convidar e aprovar colaboradores

**Para compartilhar, basta enviar o link do site.** Quem recebe:

- **Só quer ver** (por exemplo, a gestão): abre o link e vê o mapa e o Resumo. Não precisa de conta.
- **Quer ajudar a marcar:**
  1. Abre o link, toca em **Entrar** e entra com a conta Google.
  2. Aparece a tela **Pedir acesso para marcar**. A pessoa pode escrever o vínculo com a UFSCar (opcional) e toca em **Pedir acesso**.
  3. Até você aprovar, ela vê o mapa mas não consegue marcar nem alterar nada.

**Para aprovar:**

1. Abra o site com a sua conta de administrador. Quando houver pedidos, aparece uma **bolinha vermelha com o número** sobre o círculo da sua conta.
2. Toque no círculo e depois em **Pedidos de acesso**.
3. Para cada pedido aparecem nome, e-mail, a mensagem e a data. Toque em **Aprovar** ou **Recusar**.
4. A pessoa é liberada na hora, sem precisar recarregar a página, e recebe o aviso "Seu acesso foi aprovado".

Na mesma tela você vê os aprovados e pode **Remover acesso** de alguém a qualquer momento. Os pontos que a pessoa já marcou continuam no mapa.

O app **não envia e-mail** avisando de novos pedidos. Você só vê a bolinha quando abre o site. Uma sugestão é pedir aos colaboradores que avisem você pelo WhatsApp ou por e-mail depois de pedir acesso.

Mensagem sugerida para o convite:

> Estamos mapeando a iluminação noturna do campus. Abra o link, entre com sua conta Google e toque em "Pedir acesso". Depois que eu aprovar, é só marcar os postes que você encontrar, de preferência à noite. O botão "?" explica os critérios. Antes de marcar, confira se o poste já não está no mapa.

**Aceitar pedidos somente de e-mails da UFSCar (opcional):** no arquivo `firestore.rules`, siga o comentário da função `emailAllowed()` e publique as regras de novo. Assim, só contas `@ufscar.br` e `@estudante.ufscar.br` conseguem sequer enviar o pedido.

---

## O que muda em relação à versão do Claude

- **Login com Google:** todo ponto registra quem marcou e quem alterou por último. O Resumo mostra a lista de colaboradores.
- **GPS:** o botão **◎** mostra onde você está. Com um marcador selecionado, aparece **Marcar onde estou (±X m)**.
- **Camadas de mapa:** o botão de camadas alterna entre **Noturno** (o nosso), **Ruas (OpenStreetMap)** e **Satélite**.
- **Aviso de duplicata:** marcar a menos de 4 m de um ponto existente pede confirmação ("Ver o existente" ou "Marcar mesmo assim").
- **Guia "Como marcar"** (botão **?**) com critérios comuns para todos.
- **Aprovação de colaboradores:** quem entra precisa pedir acesso, e só marca depois que um administrador aprovar.
- **Permissões:** qualquer colaborador aprovado atualiza a condição de um poste, mas só quem marcou ou um administrador pode excluí-lo.
- **Offline:** o Firebase guarda as alterações no aparelho e envia quando o sinal volta. O indicador no topo mostra "offline · N a enviar".
- **Link público só de leitura:** qualquer pessoa vê o mapa e o Resumo sem login. Isso serve para apresentar à gestão.
- **Exportação:** CSV e GeoJSON baixam direto, agora com as colunas "marcado_por" e "alterado_por".

## Custos e limites

- **Firebase (plano Spark, gratuito):** tem cotas diárias de leitura e escrita. Cada vez que alguém abre o mapa, o app lê todos os pontos. Com poucos milhares de pontos e dezenas de visitas por dia, isso pode chegar perto do limite gratuito. Se passar, o banco para de responder até o dia seguinte, sem cobrança. Se o projeto crescer, dá para mudar para o plano **Blaze** (pago por uso, com alerta de orçamento). No volume deste projeto, o custo tende a ser de centavos por mês. Confira os valores atuais na página de preços do Firebase.
- **GitHub Pages:** gratuito para repositório público.
- **Mapas de fundo:** as camadas "Ruas" e "Satélite" usam serviços gratuitos (OpenStreetMap e Esri) com limite de uso razoável. Para uso intenso, prefira a camada "Noturno", que não depende deles.

## Como atualizar o site depois

1. Edite os arquivos (ou peça ao Claude, no projeto "Mapa - UFSCar").
2. No GitHub, abra o repositório e use **Add file > Upload files**, arrastando os arquivos alterados. Eles substituem os antigos.
3. Em um a dois minutos o site é atualizado. Se o celular mostrar a versão antiga, recarregue a página.

As marcações ficam no Firebase e **não são afetadas** por atualizações do site.

## Arquivos desta pasta

| Arquivo | Para que serve |
|---|---|
| `index.html` | estrutura e visual da página |
| `app.js` | lógica do aplicativo (mapa, marcadores, resumo, GPS, exportação) |
| `backend.js` | conexão com o Firebase (login e banco) e modo demonstração |
| `firebase-config.js` | **onde você cola a configuração do seu projeto Firebase** |
| `firestore.rules` | regras de segurança do banco (colar no Console do Firebase) |
| `campus.json` | mapa-base do campus (gerado a partir do OpenStreetMap) |
| `leaflet.js`, `leaflet.css` | Leaflet 1.9.4, a biblioteca de mapas (licença em `LEAFLET-LICENSE.txt`) |

## Se algo der errado

| Sintoma | Causa provável |
|---|---|
| Faixa amarela "Modo demonstração" | `firebase-config.js` ainda tem `COLE_AQUI` ou não foi enviado ao GitHub |
| Erro ao entrar com Google (domínio não autorizado) | Falta a Parte 3 |
| "Sem permissão para salvar" | Pessoa ainda não aprovada, ou regras não publicadas (Parte 1, passo 5) |
| Colaborador não consegue enviar o pedido | A restrição a e-mails UFSCar está ativa e a conta não é da UFSCar, ou as regras não foram publicadas |
| Não aparece o botão "Pedidos de acesso" | Sua conta ainda não está na coleção `admins` (Parte 4) |
| "Falha ao carregar os dados" | Banco não criado, ou cota diária do plano gratuito esgotada |
| Página em branco | O `index.html` não está na raiz do repositório, ou faltou enviar `leaflet.js` e `leaflet.css` |
