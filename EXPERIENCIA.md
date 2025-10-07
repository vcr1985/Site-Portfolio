# 💼 Seção de Experiência Profissional

## 📋 Visão Geral

A seção de experiência profissional foi adicionada ao portfólio para destacar a trajetória de trabalho e contribuições profissionais do desenvolvedor.

## 🎨 Design e Layout

### Timeline Visual
- **Timeline central**: Linha vertical conectando todas as experiências
- **Indicadores circulares**: Marcadores para cada experiência na timeline
- **Layout responsivo**: Adapta-se automaticamente para dispositivos móveis

### Cartões de Experiência
Cada experiência é apresentada em um cartão que inclui:

- **Data**: Ano e período de trabalho
- **Logo da empresa**: Ícone representativo da organização
- **Título do cargo**: Nome da posição ocupada
- **Nome da empresa**: Organização ou instituição
- **Tipo de trabalho**: Temporário, remoto, presencial, etc.
- **Localização**: Cidade e país
- **Descrição**: Resumo das atividades e contribuições
- **Tags de habilidades**: Competências utilizadas no cargo

## 📊 Experiência Atual

### Fundação Gol de Letra (Jul - Dez 2024)
- **Cargo**: Digitador Voluntário
- **Tipo**: Temporário · Remoto
- **Local**: São Paulo, Brasil
- **Descrição**: Trabalho voluntário contribuindo para digitização e organização de documentos para projetos sociais
- **Habilidades**: Trabalho Voluntário, Digitalização, Organização de Dados, Responsabilidade Social, Trabalho Remoto

## 🛠️ Como Adicionar Novas Experiências

### 1. Estrutura HTML

Adicione uma nova experiência seguindo o padrão:

```html
<div class="experience-item" data-aos="fade-up" data-aos-delay="200">
    <div class="experience-date">
        <span class="experience-year">2024</span>
        <span class="experience-period">Jan - Mar</span>
    </div>
    <div class="experience-details">
        <div class="experience-company">
            <div class="company-logo">
                <i class="fas fa-building"></i>
            </div>
            <div class="company-info">
                <h3>Título do Cargo</h3>
                <h4>Nome da Empresa</h4>
                <span class="experience-type">Tipo · Modalidade</span>
                <span class="experience-location">Cidade, País</span>
            </div>
        </div>
        <div class="experience-description">
            <p>
                Descrição das atividades realizadas e contribuições...
            </p>
            <div class="experience-skills">
                <span class="skill-tag">Habilidade 1</span>
                <span class="skill-tag">Habilidade 2</span>
                <span class="skill-tag">Habilidade 3</span>
            </div>
        </div>
    </div>
</div>
```

### 2. Ícones Recomendados

Para o logo da empresa, use ícones Font Awesome apropriados:

- **ONG/Trabalho Social**: `fas fa-heart`, `fas fa-hands-helping`
- **Empresa de Tecnologia**: `fas fa-laptop-code`, `fas fa-microchip`
- **Consultoria**: `fas fa-user-tie`, `fas fa-briefcase`
- **Startup**: `fas fa-rocket`, `fas fa-lightbulb`
- **Freelance**: `fas fa-user`, `fas fa-freelance`
- **Genérico**: `fas fa-building`, `fas fa-industry`

### 3. Tipos de Trabalho Sugeridos

- **CLT · Presencial**
- **CLT · Remoto**
- **CLT · Híbrido**
- **Freelance · Remoto**
- **Estágio · Presencial**
- **Temporário · Remoto**
- **Projeto · Remoto**
- **Consultoria · Presencial**

## 🎨 Customização Visual

### Cores das Tags de Habilidades

As tags de habilidades usam a cor primária do site. Para personalizar:

```css
.skill-tag {
    background: var(--primary-color);
    color: var(--text-white);
}

.skill-tag:hover {
    background: var(--primary-dark);
}
```

### Animações

As experiências aparecem com animação ao fazer scroll:
- **Delay**: 100ms entre cada item
- **Efeito**: Fade-up (aparece de baixo para cima)
- **Duração**: Controlada pela biblioteca AOS

## 📱 Responsividade

### Desktop (> 768px)
- Timeline centralizada
- Experiências alternadas (esquerda/direita)
- Data à esquerda, conteúdo à direita

### Mobile (≤ 768px)
- Timeline à esquerda (30px)
- Todas as experiências alinhadas à direita
- Layout vertical empilhado
- Data acima do conteúdo

## 🔧 Manutenção

### Ordem das Experiências
- Mais recentes no topo
- Ordem cronológica decrescente
- Incluir datas precisas (mês/ano)

### Conteúdo Recomendado
- **Descrição**: 2-3 linhas resumindo as principais atividades
- **Habilidades**: 3-6 tags com competências relevantes
- **Linguagem**: Profissional, mas acessível
- **Foco**: Resultados e contribuições, não apenas responsabilidades

## ✅ Checklist de Implementação

- [x] Estrutura HTML criada
- [x] Estilos CSS implementados
- [x] Responsividade configurada
- [x] Animações aplicadas
- [x] Menu de navegação atualizado
- [x] Experiência da Fundação Gol de Letra adicionada
- [x] Documentação criada

## 🚀 Próximos Passos

1. Adicionar mais experiências conforme necessário
2. Implementar sistema de gerenciamento dinâmico (similar ao portfólio)
3. Adicionar filtros por tipo de trabalho ou período
4. Integrar com LinkedIn API para sincronização automática