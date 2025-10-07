# 🚀 GUIA PASSO A PASSO - GITHUB PAGES

## 📋 Pré-requisitos
- [ ] Conta no GitHub (gratuita)
- [ ] Arquivos do site prontos
- [ ] Navegador web

---

## 🔧 PASSO 1: Criar Conta GitHub (se não tiver)

1. Acesse: https://github.com
2. Clique em **"Sign up"**
3. Escolha um username (ex: `vandoramos`, `vando-dev`, etc.)
4. Use seu email: `ramosvando@gmail.com`
5. Crie uma senha forte
6. Verifique o email

---

## 📁 PASSO 2: Criar Novo Repositório

1. **Faça login no GitHub**
2. **Clique no botão verde "New"** (ou ícone + no canto superior direito)
3. **Configure o repositório:**
   - **Repository name**: `portfolio-profissional` ou `vando-portfolio`
   - **Description**: `Meu site portfólio profissional - Desenvolvedor Web especialista em IA`
   - **✅ Marcar "Public"** (obrigatório para GitHub Pages gratuito)
   - **✅ Marcar "Add a README file"**
   - **Deixar desmarcado** .gitignore e license por enquanto
4. **Clique "Create repository"**

---

## 📤 PASSO 3: Upload dos Arquivos

### Método 1: Interface Web (Mais Fácil)

1. **No seu repositório criado**, clique em **"uploading an existing file"**
2. **Arraste TODOS estes arquivos** da pasta `g:\Site-Profissional\`:

```
ARQUIVOS OBRIGATÓRIOS:
✅ index.html
✅ config.json
✅ assets/ (pasta inteira)
   ├── css/style.css
   ├── js/script.js
   └── images/
       ├── IMG-Perfil.jpg
       └── logotipo.jpg

ARQUIVOS OPCIONAIS (documentação):
📄 README.md
📄 DEPLOY-READY.md
📄 EXPERIENCIA.md
📄 IMPLEMENTACOES.md
📄 GUIA-LINKEDIN.md
📄 .gitignore
```

3. **⚠️ NÃO SUBIR** estes arquivos:
   - `diagnostico-*.html`
   - `teste-*.html` 
   - `gerar-*.html`
   - `preview-*.html`
   - `validacao-*.html`
   - `favicon_io.zip`
   - `favicon_io/` (pasta)

4. **Escreva commit message**: `🚀 Deploy inicial do portfolio profissional`
5. **Clique "Commit changes"**

### Método 2: Git Command Line (Avançado)

Se preferir usar comandos Git:

```bash
# Navegar para pasta do projeto
cd "g:\Site-Profissional"

# Inicializar git
git init

# Adicionar origin
git remote add origin https://github.com/SEU-USERNAME/portfolio-profissional.git

# Adicionar arquivos
git add index.html config.json assets/

# Commit
git commit -m "🚀 Deploy inicial do portfolio profissional"

# Enviar para GitHub
git push -u origin main
```

---

## ⚙️ PASSO 4: Configurar GitHub Pages

1. **No seu repositório**, clique na aba **"Settings"** (última aba do menu)
2. **Rolle para baixo** até encontrar **"Pages"** no menu lateral esquerdo
3. **Em "Source"**, selecione:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (ou `master`)
   - **Folder**: `/ (root)`
4. **Clique "Save"**
5. **Aguarde alguns minutos** (pode demorar 5-10 minutos)

---

## 🌐 PASSO 5: Acessar Seu Site

Após 5-10 minutos, seu site estará disponível em:

```
https://SEU-USERNAME.github.io/portfolio-profissional/
```

**Exemplo**: 
- Se seu username for `vandoramos` 
- URL será: `https://vandoramos.github.io/portfolio-profissional/`

---

## 🔧 PASSO 6: Configurações Pós-Deploy

### Domínio Personalizado (Opcional)

1. **Compre um domínio** (ex: `vandoramos.com`)
2. **No GitHub Pages Settings**, adicione o domínio em "Custom domain"
3. **Configure DNS** no seu provedor de domínio:
   ```
   Type: CNAME
   Name: www
   Value: SEU-USERNAME.github.io
   ```

### Atualizar Meta Tags

Edite o `index.html` e atualize a URL:

```html
<meta property="og:url" content="https://SEU-USERNAME.github.io/portfolio-profissional/">
<link rel="canonical" href="https://SEU-USERNAME.github.io/portfolio-profissional/">
```

---

## 📊 VERIFICAÇÕES FINAIS

### ✅ Checklist Pós-Deploy:

- [ ] Site carrega corretamente
- [ ] Todas as imagens aparecem
- [ ] Menu de navegação funciona
- [ ] Formulário de contato funciona
- [ ] Links das redes sociais funcionam
- [ ] Site é responsivo no mobile
- [ ] Favicon "VR" aparece
- [ ] Sem erros no console do navegador

### 🔍 Como Verificar:

1. **Abra o site** na URL do GitHub Pages
2. **Teste no mobile** (F12 > modo responsivo)
3. **Abra Console** (F12) - não deve ter erros vermelhos
4. **Teste formulário** - deve validar campos
5. **Clique em todos os links** do menu

---

## 🆘 RESOLUÇÃO DE PROBLEMAS

### Problema: Site não carrega
- **Aguarde 10-15 minutos** após configurar
- **Verifique se index.html** está na raiz do repositório
- **Certifique-se** que repositório é público

### Problema: Imagens não aparecem  
- **Verifique** se pasta `assets/images/` foi enviada
- **Paths** devem usar `./assets/images/nome.jpg`
- **Não usar** caminhos absolutos como `C:\` ou `g:\`

### Problema: CSS/JS não funciona
- **Verifique** se pasta `assets/` completa foi enviada
- **Paths** devem ser relativos: `./assets/css/style.css`
- **Limpe cache** do navegador (Ctrl+F5)

### Problema: Favicon não aparece
- **Normal** - pode demorar algumas horas
- **Teste** em aba anônima/privada
- **Favicon SVG** já está implementado corretamente

---

## 🎯 RESULTADO FINAL

Após seguir todos os passos, você terá:

✅ **Site profissional online 24/7**
✅ **URL compartilhável** 
✅ **SSL/HTTPS automático**
✅ **Hospedagem gratuita para sempre**
✅ **Atualizações fáceis** (só fazer novo commit)

---

## 📞 SUPORTE

Se tiver dúvidas:

1. **Verifique** se seguiu todos os passos
2. **Aguarde** 10-15 minutos após configurar
3. **Teste** em navegador anônimo
4. **Verifique console** F12 para erros

---

## 🚀 PRÓXIMOS PASSOS

Após site online:

1. **Compartilhe** a URL nas suas redes sociais
2. **Adicione** no LinkedIn como seu site
3. **Use** em currículos e apresentações
4. **Atualize** regularmente com novos projetos

**🎉 Seu site estará profissionalmente hospedado!**