// ===================== SISTEMA DE AUTENTICAÇÃO ADMIN =====================
let isAdminAuthenticated = false;

// Configurações de administrador (em produção, use um backend seguro)
const ADMIN_CONFIG = {
    username: 'admin',
    password: 'portfolio2025#VR', // Senha forte
    sessionDuration: 3600000 // 1 hora em millisegundos
};

function initializeAdminSystem() {
    // Verifica se já está logado
    checkAdminSession();
    
    // Adiciona evento de duplo clique para acesso admin
    document.addEventListener('dblclick', function(e) {
        if (e.ctrlKey && e.altKey) {
            showAdminLogin();
        }
    });
    
    // Adiciona atalho de teclado para acesso admin (Ctrl+Alt+A)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.altKey && e.key === 'a') {
            e.preventDefault();
            showAdminLogin();
        }
    });
}

function showAdminLogin() {
    if (isAdminAuthenticated) {
        if (confirm('Você já está logado como admin. Deseja fazer logout?')) {
            adminLogout();
        }
        return;
    }
    
    // Verificar se a conta está bloqueada
    if (checkLockout()) {
        return;
    }
    
    const username = prompt('👤 Username Admin:');
    if (!username) return;
    
    const password = prompt('🔐 Password Admin:');
    if (!password) return;
    
    authenticateAdmin(username, password);
}

function authenticateAdmin(username, password) {
    // Validação de entrada
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        showNotification('❌ Dados inválidos!', 'error');
        return;
    }
    
    // Sanitização básica
    username = username.trim();
    
    // Verificação com delay para prevenir ataques de timing
    setTimeout(() => {
        if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
            isAdminAuthenticated = true;
            
            // Gerar token de sessão único
            const sessionToken = generateSecureToken();
            
            // Salva sessão com timestamp e token
            const sessionData = {
                authenticated: true,
                timestamp: Date.now(),
                token: sessionToken,
                userAgent: navigator.userAgent,
                ip: 'client-side' // Em produção, use backend real
            };
            
            // Criptografar dados da sessão (simulação)
            const encryptedSession = btoa(JSON.stringify(sessionData));
            localStorage.setItem('adminSession', encryptedSession);
            
            showAdminElements();
            showNotification('✅ Login admin realizado com sucesso!', 'success');
            console.log('🔐 Admin authenticated successfully');
            
            // Log de auditoria
            logAdminAction('LOGIN_SUCCESS', { username, timestamp: Date.now() });
        } else {
            showNotification('❌ Credenciais inválidas!', 'error');
            console.warn('🔒 Failed admin authentication attempt');
            
            // Log de tentativa de invasão
            logAdminAction('LOGIN_FAILED', { 
                username, 
                timestamp: Date.now(),
                userAgent: navigator.userAgent 
            });
            
            // Proteção contra força bruta (básica)
            incrementFailedAttempts();
        }
    }, 1000 + Math.random() * 1000); // Delay variável
}

// Função para gerar token seguro
function generateSecureToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Sistema de log de auditoria
function logAdminAction(action, details) {
    const logEntry = {
        action,
        details,
        timestamp: new Date().toISOString(),
        url: window.location.href
    };
    
    // Em produção, enviar para servidor
    const adminLogs = JSON.parse(localStorage.getItem('adminLogs') || '[]');
    adminLogs.push(logEntry);
    
    // Manter apenas os últimos 100 logs
    if (adminLogs.length > 100) {
        adminLogs.splice(0, adminLogs.length - 100);
    }
    
    localStorage.setItem('adminLogs', JSON.stringify(adminLogs));
    console.log(`📝 Admin Log: ${action}`, details);
}

// Proteção contra ataques de força bruta
let failedAttempts = 0;
let lockoutTime = null;

function incrementFailedAttempts() {
    failedAttempts++;
    
    if (failedAttempts >= 3) {
        lockoutTime = Date.now() + (5 * 60 * 1000); // 5 minutos
        showNotification('🔒 Muitas tentativas inválidas. Tente novamente em 5 minutos.', 'error');
        console.warn('🚨 Admin account temporarily locked due to failed attempts');
    }
}

function checkLockout() {
    if (lockoutTime && Date.now() < lockoutTime) {
        const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000 / 60);
        showNotification(`🔒 Conta bloqueada. Tente novamente em ${remainingTime} minuto(s).`, 'error');
        return true;
    }
    
    if (lockoutTime && Date.now() >= lockoutTime) {
        failedAttempts = 0;
        lockoutTime = null;
    }
    
    return false;
}

function checkAdminSession() {
    const encryptedSession = localStorage.getItem('adminSession');
    if (encryptedSession) {
        try {
            // Descriptografar sessão
            const sessionData = JSON.parse(atob(encryptedSession));
            const now = Date.now();
            
            // Validações de segurança
            if (!sessionData.token || !sessionData.authenticated || !sessionData.timestamp) {
                throw new Error('Invalid session structure');
            }
            
            // Verifica se a sessão ainda é válida
            if ((now - sessionData.timestamp) < ADMIN_CONFIG.sessionDuration) {
                // Verificação adicional de integridade
                if (sessionData.userAgent === navigator.userAgent) {
                    isAdminAuthenticated = true;
                    showAdminElements();
                    console.log('🔐 Admin session restored');
                    
                    // Renovar timestamp da sessão
                    sessionData.timestamp = now;
                    const newEncryptedSession = btoa(JSON.stringify(sessionData));
                    localStorage.setItem('adminSession', newEncryptedSession);
                    
                    logAdminAction('SESSION_RESTORED', { timestamp: now });
                } else {
                    throw new Error('Session hijack detected - user agent mismatch');
                }
            } else {
                // Sessão expirada
                adminLogout();
                console.log('⏰ Admin session expired');
                logAdminAction('SESSION_EXPIRED', { timestamp: now });
            }
        } catch (e) {
            localStorage.removeItem('adminSession');
            console.error('❌ Invalid admin session data:', e.message);
            logAdminAction('SESSION_INVALID', { 
                error: e.message, 
                timestamp: now 
            });
        }
    }
}

function adminLogout() {
    isAdminAuthenticated = false;
    localStorage.removeItem('adminSession');
    hideAdminElements();
    showNotification('👋 Logout realizado com sucesso!', 'info');
    
    // Log de auditoria
    logAdminAction('LOGOUT', { timestamp: Date.now() });
    console.log('🔐 Admin logged out');
}

function showAdminElements() {
    // Mostra todos os elementos de administração
    const adminElements = document.querySelectorAll('.btn-admin, .admin-only');
    adminElements.forEach(element => {
        element.style.display = 'block';
    });
    
    // Recarrega o portfólio para mostrar botões de edição
    if (typeof displayProjects === 'function') {
        displayProjects();
    }
    
    // Adiciona indicador de modo admin
    addAdminIndicator();
}

function hideAdminElements() {
    // Esconde todos os elementos de administração
    const adminElements = document.querySelectorAll('.btn-admin, .admin-only');
    adminElements.forEach(element => {
        element.style.display = 'none';
    });
    
    // Recarrega o portfólio para esconder botões de edição
    if (typeof displayProjects === 'function') {
        displayProjects();
    }
    
    // Remove indicador de modo admin
    removeAdminIndicator();
}

function addAdminIndicator() {
    // Remove indicador existente se houver
    removeAdminIndicator();
    
    const indicator = document.createElement('div');
    indicator.id = 'admin-indicator';
    indicator.innerHTML = `
        <div style="
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(238, 90, 36, 0.3);
            cursor: pointer;
            animation: pulse 2s infinite;
        " onclick="adminLogout()">
            🔐 MODO ADMIN
        </div>
    `;
    document.body.appendChild(indicator);
}

function removeAdminIndicator() {
    const indicator = document.getElementById('admin-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function showNotification(message, type = 'info') {
    // Remove notificação existente
    const existingNotification = document.getElementById('admin-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    
    const notification = document.createElement('div');
    notification.id = 'admin-notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 50px;
            right: 10px;
            background: ${colors[type]};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease-out;
        ">
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove após 3 segundos
    setTimeout(() => {
        if (notification) {
            notification.remove();
        }
    }, 3000);
}

// Aguarda o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se retornou do Formspree
    checkFormspreeReturn();
    
    // Inicializa todas as funcionalidades
    initializeAdminSystem();
    initializeNavigation();
    initializeScrollEffects();
    initializePortfolio();
    initializeContactForm();
    initializeAnimations();
    initializeModal();
    initializeCertificates();
    initializeImageValidation();
    initializeFavicon();
    

});

// ===================== VALIDAÇÃO DE IMAGENS =====================
function initializeImageValidation() {
    const heroImg = document.querySelector('.hero-img');
    const heroPlaceholder = document.querySelector('.hero-placeholder');
    
    if (heroImg && heroPlaceholder) {
        // Verifica se a imagem carregou
        heroImg.addEventListener('load', function() {
            console.log('✅ Imagem do hero carregada com sucesso!');
            heroImg.style.display = 'block';
            heroPlaceholder.style.display = 'none';
        });
        
        // Se houve erro no carregamento
        heroImg.addEventListener('error', function() {
            console.log('❌ Erro ao carregar imagem do hero, usando placeholder');
            heroImg.style.display = 'none';
            heroPlaceholder.style.display = 'flex';
        });
        
        // Verifica se a imagem já está em cache
        if (heroImg.complete) {
            if (heroImg.naturalWidth > 0) {
                heroImg.style.display = 'block';
                heroPlaceholder.style.display = 'none';
                console.log('✅ Imagem do hero já estava carregada!');
            } else {
                heroImg.style.display = 'none';
                heroPlaceholder.style.display = 'flex';
                console.log('❌ Imagem do hero não pôde ser carregada');
            }
        }
    }
}

// ===================== NAVEGAÇÃO =====================
function initializeNavigation() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Toggle menu mobile
    mobileMenu.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Fechar menu ao clicar em um link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Scroll suave para seções
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Altura do header
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Highlight do link ativo
    window.addEventListener('scroll', () => {
        const currentSection = getCurrentSection();
        updateActiveNavLink(currentSection);
    });
}

function getCurrentSection() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 100;
    
    for (let section of sections) {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            return section.id;
        }
    }
    return 'home';
}

function updateActiveNavLink(currentSection) {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// ===================== EFEITOS DE SCROLL =====================
function initializeScrollEffects() {
    const header = document.querySelector('.header');
    const backToTopBtn = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        // Efeito do header
        if (scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }
        
        // Botão voltar ao topo
        if (scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    // Funcionalidade do botão voltar ao topo
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===================== PORTFÓLIO =====================
let portfolioProjects = [
    {
        id: 1,
        title: "Minimal API",
        category: "webapp",
        description: "API RESTful desenvolvida com .NET Minimal APIs, implementando operações CRUD completas com arquitetura limpa e documentação Swagger integrada.",
        technologies: [".NET 8", "C#", "Minimal APIs", "Entity Framework", "SQL Server", "Swagger"],
        image: "",
        demoUrl: "",
        githubUrl: "https://github.com/vcr1985/minimalApi"
    },
    {
        id: 2,
        title: "Repositório AI900 & Machine Learning",
        category: "webapp",
        description: "Repositório de estudos e projetos práticos focado em Azure AI Fundamentals (AI-900), Machine Learning e Inteligência Artificial com exemplos e implementações reais.",
        technologies: ["Python", "Azure AI", "Machine Learning", "Data Science", "AI-900", "Jupyter"],
        image: "",
        demoUrl: "",
        githubUrl: "https://github.com/vcr1985/repositorio-aprendizado-ai900de-maquina-ia"
    },
    {
        id: 3,
        title: "Microsserviços E-commerce",
        category: "ecommerce",
        description: "Arquitetura completa de e-commerce baseada em microsserviços, implementando padrões modernos de desenvolvimento distribuído com alta escalabilidade e performance.",
        technologies: [".NET Core", "Docker", "Kubernetes", "RabbitMQ", "Redis", "SQL Server", "API Gateway"],
        image: "",
        demoUrl: "",
        githubUrl: "https://github.com/vcr1985/Microsservico_ecommerce"
    }
];

function initializePortfolio() {
    renderPortfolioItems();
    setupPortfolioFilters();
    
    // Carregar projetos do localStorage se existirem
    const savedProjects = localStorage.getItem('portfolioProjects');
    if (savedProjects) {
        portfolioProjects = JSON.parse(savedProjects);
        renderPortfolioItems();
    }
}

function renderPortfolioItems(filter = 'all') {
    const container = document.getElementById('portfolio-container');
    
    if (!container) return;
    
    const filteredProjects = filter === 'all' 
        ? portfolioProjects 
        : portfolioProjects.filter(project => project.category === filter);
    
    container.innerHTML = '';
    
    filteredProjects.forEach(project => {
        const projectElement = createProjectElement(project);
        container.appendChild(projectElement);
    });
    
    // Animar entrada dos elementos
    container.querySelectorAll('.portfolio-item').forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
        item.classList.add('fade-in-up');
    });
}

function createProjectElement(project) {
    const div = document.createElement('div');
    div.className = 'portfolio-item';
    div.dataset.category = project.category;
    
    div.innerHTML = `
        <div class="portfolio-image">
            ${project.image ? 
                `<img src="${project.image}" alt="${project.title}">` : 
                '<i class="fas fa-image"></i>'
            }
        </div>
        <div class="portfolio-content">
            <h3 class="portfolio-title">${project.title}</h3>
            <span class="portfolio-category">${getCategoryName(project.category)}</span>
            <p class="portfolio-description">${project.description}</p>
            <div class="portfolio-tech">
                ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
            </div>
            <div class="portfolio-links">
                ${project.demoUrl ? 
                    `<a href="${project.demoUrl}" target="_blank" class="portfolio-link">
                        <i class="fas fa-external-link-alt"></i> Demo
                    </a>` : ''
                }
                ${project.githubUrl ? 
                    `<a href="${project.githubUrl}" target="_blank" class="portfolio-link">
                        <i class="fab fa-github"></i> Código
                    </a>` : ''
                }
                ${isAdminAuthenticated ? `
                    <button onclick="editProject(${project.id})" class="portfolio-link admin-only" style="background: none; border: none; cursor: pointer;">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="deleteProject(${project.id})" class="portfolio-link admin-only" style="background: none; border: none; cursor: pointer; color: #ef4444;">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    return div;
}

function getCategoryName(category) {
    const categories = {
        'website': 'Website',
        'webapp': 'Web App',
        'ecommerce': 'E-commerce'
    };
    return categories[category] || category;
}

function setupPortfolioFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover active de todos os botões
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Adicionar active ao botão clicado
            button.classList.add('active');
            
            // Filtrar projetos
            const filter = button.dataset.filter;
            renderPortfolioItems(filter);
        });
    });
}

function addProject(projectData) {
    const newProject = {
        id: Date.now(),
        ...projectData,
        technologies: projectData.technologies.split(',').map(tech => tech.trim())
    };
    
    portfolioProjects.unshift(newProject);
    saveProjects();
    renderPortfolioItems();
    
    showNotification('Projeto adicionado com sucesso!', 'success');
}

function editProject(projectId) {
    // Verificação de segurança - apenas admin pode editar
    if (!isAdminAuthenticated) {
        showNotification('❌ Acesso negado! Apenas administradores podem editar projetos.', 'error');
        console.warn('🚨 Unauthorized edit attempt blocked');
        logAdminAction('UNAUTHORIZED_EDIT_ATTEMPT', { 
            projectId, 
            timestamp: Date.now(),
            userAgent: navigator.userAgent 
        });
        return;
    }
    
    // Validação do ID do projeto
    if (!projectId || typeof projectId !== 'number') {
        showNotification('❌ ID de projeto inválido!', 'error');
        return;
    }
    
    const project = portfolioProjects.find(p => p.id === projectId);
    if (!project) {
        showNotification('❌ Projeto não encontrado!', 'error');
        return;
    }
    
    // Log da ação de edição
    logAdminAction('PROJECT_EDIT_STARTED', { 
        projectId, 
        projectTitle: project.title,
        timestamp: Date.now() 
    });
    
    // Preencher o modal com os dados do projeto
    document.getElementById('project-title').value = project.title;
    document.getElementById('project-category').value = project.category;
    document.getElementById('project-description').value = project.description;
    document.getElementById('project-technologies').value = project.technologies.join(', ');
    document.getElementById('project-image').value = project.image || '';
    document.getElementById('project-demo').value = project.demoUrl || '';
    document.getElementById('project-github').value = project.githubUrl || '';
    
    // Mostrar o modal
    document.getElementById('project-modal').style.display = 'block';
    
    // Alterar o comportamento do formulário para edição
    const form = document.getElementById('project-form');
    form.dataset.editId = projectId;
    form.querySelector('button[type="submit"]').textContent = 'Atualizar Projeto';
}

function deleteProject(projectId) {
    // Verificação de segurança - apenas admin pode excluir
    if (!isAdminAuthenticated) {
        showNotification('❌ Acesso negado! Apenas administradores podem excluir projetos.', 'error');
        console.warn('🚨 Unauthorized delete attempt blocked');
        logAdminAction('UNAUTHORIZED_DELETE_ATTEMPT', { 
            projectId, 
            timestamp: Date.now(),
            userAgent: navigator.userAgent 
        });
        return;
    }
    
    // Validação do ID do projeto
    if (!projectId || typeof projectId !== 'number') {
        showNotification('❌ ID de projeto inválido!', 'error');
        return;
    }
    
    const project = portfolioProjects.find(p => p.id === projectId);
    if (!project) {
        showNotification('❌ Projeto não encontrado!', 'error');
        return;
    }
    
    // Confirmação dupla para exclusão
    const confirmDelete = confirm(`Tem certeza que deseja excluir o projeto "${project.title}"?`);
    if (!confirmDelete) return;
    
    const finalConfirm = confirm('⚠️ ATENÇÃO: Esta ação não pode ser desfeita! Confirma a exclusão?');
    if (finalConfirm) {
        // Log antes da exclusão
        logAdminAction('PROJECT_DELETED', { 
            projectId, 
            projectTitle: project.title,
            timestamp: Date.now() 
        });
        
        portfolioProjects = portfolioProjects.filter(p => p.id !== projectId);
        saveProjects();
        renderPortfolioItems();
        showNotification('Projeto excluído com sucesso!', 'success');
    }
}

function saveProjects() {
    localStorage.setItem('portfolioProjects', JSON.stringify(portfolioProjects));
}

// ===================== FORMULÁRIO DE CONTATO =====================
function initializeContactForm() {
    const form = document.getElementById('contact-form');
    
    if (!form) return;
    
    form.addEventListener('submit', handleContactSubmit);
    
    // Validação em tempo real
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

function handleContactSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Validar todos os campos
    if (!validateForm(form)) {
        showNotification('Por favor, corrija os erros no formulário.', 'error');
        return;
    }
    
    // Mostrar loading
    showLoading(form);
    
    // Enviar para Formspree
    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    }).then(response => {
        hideLoading(form);
        
        if (response.ok) {
            showNotification('✅ Mensagem enviada com sucesso! Entrarei em contato em breve.', 'success');
            form.reset();
            
            // Salvar lead no localStorage para backup
            const data = Object.fromEntries(formData);
            saveLead(data);
            
            // Trigger security alert para demonstrar funcionamento
            console.log('📧 Email enviado via Formspree para: ramosvando@gmail.com');
        } else {
            response.json().then(data => {
                if (Object.hasOwn(data, 'errors')) {
                    showNotification('❌ Erro nos dados: ' + data.errors.map(error => error.message).join(', '), 'error');
                } else {
                    showNotification('❌ Erro ao enviar mensagem. Tente novamente.', 'error');
                }
            });
        }
    }).catch(error => {
        hideLoading(form);
        console.error('Erro no envio:', error);
        showNotification('❌ Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    });
}

function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    // Remover erros anteriores
    clearFieldError(e);
    
    if (field.required && !value) {
        showFieldError(field, 'Este campo é obrigatório');
        return false;
    }
    
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(field, 'Email inválido');
            return false;
        }
    }
    
    if (field.type === 'tel' && value) {
        const phoneRegex = /^[\d\s\(\)\-\+]+$/;
        if (!phoneRegex.test(value)) {
            showFieldError(field, 'Telefone inválido');
            return false;
        }
    }
    
    return true;
}

function showFieldError(field, message) {
    field.style.borderColor = '#ef4444';
    
    let errorElement = field.parentNode.querySelector('.field-error');
    if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.className = 'field-error';
        errorElement.style.color = '#ef4444';
        errorElement.style.fontSize = '0.875rem';
        errorElement.style.marginTop = '0.25rem';
        errorElement.style.display = 'block';
        field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
}

function clearFieldError(e) {
    const field = e.target;
    field.style.borderColor = '';
    
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

function showLoading(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
}

function hideLoading(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Mensagem';
}

function saveLead(data) {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    leads.unshift({
        ...data,
        timestamp: new Date().toISOString(),
        id: Date.now()
    });
    localStorage.setItem('leads', JSON.stringify(leads));
}

// Verificar se retornou do Formspree
function checkFormspreeReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('sent') === 'true') {
        // Remover o parâmetro da URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Mostrar notificação de sucesso
        setTimeout(() => {
            showNotification('✅ Mensagem enviada com sucesso! Entrarei em contato em breve.', 'success');
        }, 500);
    }
}

// ===================== MODAL =====================
function initializeModal() {
    const modal = document.getElementById('project-modal');
    const addBtn = document.getElementById('add-project-btn');
    const closeBtn = modal.querySelector('.close');
    const form = document.getElementById('project-form');
    
    if (!modal || !addBtn || !closeBtn || !form) return;
    
    // Abrir modal
    addBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        form.reset();
        delete form.dataset.editId;
        form.querySelector('button[type="submit"]').textContent = 'Adicionar Projeto';
    });
    
    // Fechar modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Fechar modal clicando fora
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Submissão do formulário de projeto
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const projectData = Object.fromEntries(formData);
        
        if (form.dataset.editId) {
            // Editar projeto existente
            const projectId = parseInt(form.dataset.editId);
            const projectIndex = portfolioProjects.findIndex(p => p.id === projectId);
            
            if (projectIndex !== -1) {
                portfolioProjects[projectIndex] = {
                    ...portfolioProjects[projectIndex],
                    ...projectData,
                    technologies: projectData.technologies.split(',').map(tech => tech.trim())
                };
                
                saveProjects();
                renderPortfolioItems();
                showNotification('Projeto atualizado com sucesso!', 'success');
            }
        } else {
            // Adicionar novo projeto
            addProject(projectData);
        }
        
        modal.style.display = 'none';
    });
}

// ===================== ANIMAÇÕES =====================
function initializeAnimations() {
    // Inicializar AOS (Animate On Scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            offset: 100,
            once: true,
            easing: 'ease-out-cubic'
        });
    }
    
    // Contador animado para estatísticas
    animateCounters();
    
    // Typewriter effect para o título principal (opcional)
    initTypewriter();
}

function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const animateCounter = (counter) => {
        const target = parseInt(counter.textContent);
        const increment = target / 50;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            counter.textContent = Math.floor(current);
            
            if (current >= target) {
                counter.textContent = target + (counter.textContent.includes('+') ? '+' : '');
                clearInterval(timer);
            }
        }, 50);
    };
    
    // Observer para iniciar animação quando entrar na tela
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    });
    
    counters.forEach(counter => {
        observer.observe(counter);
    });
}

function initTypewriter() {
    const titleElement = document.querySelector('.hero-title');
    if (!titleElement) return;
    
    const originalText = titleElement.innerHTML;
    const highlightText = titleElement.querySelector('.highlight');
    
    if (!highlightText) return;
    
    // Implementar efeito typewriter se desejado
    // (código opcional para efeito de digitação)
}

// ===================== NOTIFICAÇÕES =====================
function showNotification(message, type = 'info') {
    // Remover notificação anterior se existir
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Estilos da notificação
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: getNotificationColor(type),
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '9999',
        transform: 'translateX(400px)',
        transition: 'transform 0.3s ease',
        maxWidth: '400px'
    });
    
    notification.querySelector('.notification-content').style.display = 'flex';
    notification.querySelector('.notification-content').style.alignItems = 'center';
    notification.querySelector('.notification-content').style.gap = '0.5rem';
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'white';
    closeBtn.style.fontSize = '1.25rem';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.marginLeft = '1rem';
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Fechar ao clicar no X
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
}

function removeNotification(notification) {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 300);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || icons.info;
}

function getNotificationColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    return colors[type] || colors.info;
}

// ===================== UTILITÁRIOS =====================
// Debounce function para otimizar eventos
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function para scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Função para detectar dispositivo móvel
function isMobile() {
    return window.innerWidth <= 768;
}

// Função para formatar telefone brasileiro
function formatPhoneBR(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
}

// Adicionar event listeners para formatação automática de telefone
document.addEventListener('DOMContentLoaded', () => {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    
    phoneInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = formatPhoneBR(e.target.value);
        });
    });
});

// ===================== CERTIFICADOS =====================
let certificates = [];

function initializeCertificates() {
    // Carregar certificados do localStorage se existirem
    const savedCertificates = localStorage.getItem('certificates');
    if (savedCertificates) {
        certificates = JSON.parse(savedCertificates);
        renderCertificates();
    }
    
    // Configurar modal de certificados
    setupCertificateModal();
}

function setupCertificateModal() {
    const addBtn = document.getElementById('add-cert-btn');
    const modal = document.getElementById('certificate-modal');
    const closeBtn = modal?.querySelector('.close');
    const form = document.getElementById('certificate-form');
    
    if (!addBtn || !modal || !closeBtn || !form) return;
    
    // Abrir modal
    addBtn.addEventListener('click', () => {
        modal.style.display = 'block';
        form.reset();
    });
    
    // Fechar modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Fechar modal clicando fora
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Submissão do formulário
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const certData = Object.fromEntries(formData);
        
        addCertificate(certData);
        modal.style.display = 'none';
    });
}

function addCertificate(certData) {
    const newCert = {
        id: Date.now(),
        title: certData['cert-title'],
        category: certData['cert-category'],
        institution: certData['cert-institution'],
        year: certData['cert-year'],
        hours: certData['cert-hours'],
        icon: certData['cert-icon'] || getDefaultIcon(certData['cert-category']),
        url: certData['cert-url']
    };
    
    certificates.push(newCert);
    saveCertificates();
    renderCertificates();
    
    showNotification('Certificado adicionado com sucesso!', 'success');
}

function getDefaultIcon(category) {
    const icons = {
        'bootcamp': 'fas fa-rocket',
        'certification': 'fas fa-certificate',
        'course': 'fas fa-graduation-cap'
    };
    return icons[category] || 'fas fa-certificate';
}

function renderCertificates() {
    const categories = {
        'bootcamp': document.querySelector('.cert-category:nth-child(1) .certifications-grid'),
        'certification': document.querySelector('.cert-category:nth-child(2) .certifications-grid'),
        'course': document.querySelector('.cert-category:nth-child(3) .certifications-grid')
    };
    
    // Limpar certificados dinâmicos existentes
    Object.values(categories).forEach(container => {
        if (container) {
            const dynamicCerts = container.querySelectorAll('.cert-item[data-dynamic="true"]');
            dynamicCerts.forEach(cert => cert.remove());
        }
    });
    
    // Adicionar novos certificados
    certificates.forEach(cert => {
        const container = categories[cert.category];
        if (container) {
            const certElement = createCertificateElement(cert);
            container.appendChild(certElement);
        }
    });
}

function createCertificateElement(cert) {
    const div = document.createElement('div');
    div.className = `cert-item ${cert.category}`;
    div.setAttribute('data-dynamic', 'true');
    
    const iconHtml = cert.icon.startsWith('fa') 
        ? `<i class="${cert.icon}"></i>`
        : `<img src="${cert.icon}" alt="Badge" class="cert-logo">`;
    
    div.innerHTML = `
        <div class="cert-badge">
            ${iconHtml}
        </div>
        <div class="cert-info">
            <h5>${cert.title}</h5>
            <p>${cert.institution} • ${cert.year}</p>
            ${cert.hours ? `<span class="cert-hours">${cert.hours}</span>` : ''}
            ${cert.url ? `<a href="${cert.url}" target="_blank" class="cert-link">Ver Certificado</a>` : ''}
            <div class="cert-actions">
                <button onclick="deleteCertificate(${cert.id})" class="btn-small btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    return div;
}

function deleteCertificate(certId) {
    if (confirm('Tem certeza que deseja excluir este certificado?')) {
        certificates = certificates.filter(cert => cert.id !== certId);
        saveCertificates();
        renderCertificates();
        showNotification('Certificado excluído com sucesso!', 'success');
    }
}

function saveCertificates() {
    localStorage.setItem('certificates', JSON.stringify(certificates));
}

// ===================== FAVICON FORÇADO =====================
function initializeFavicon() {
    // Remove favicons existentes
    const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
    existingFavicons.forEach(favicon => favicon.remove());
    
    // Cria favicon SVG
    const faviconSVG = `data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3e%3crect width='32' height='32' fill='%233A7BD5'/%3e%3ctext x='16' y='22' text-anchor='middle' fill='white' font-family='Arial,sans-serif' font-size='14' font-weight='bold'%3eVR%3c/text%3e%3c/svg%3e`;
    
    // Adiciona novo favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = faviconSVG;
    document.head.appendChild(link);
    
    // Adiciona favicon alternativo
    const linkAlt = document.createElement('link');
    linkAlt.rel = 'shortcut icon';
    linkAlt.href = faviconSVG;
    document.head.appendChild(linkAlt);
    
    console.log('🎯 Favicon "VR" forçado via JavaScript');
    
    // Força atualização do título para triggerar refresh do favicon
    const originalTitle = document.title;
    document.title = originalTitle + ' ';
    setTimeout(() => {
        document.title = originalTitle;
    }, 100);
}

// ===================== LINKEDIN IMPORT FUNCTIONS =====================
function openLinkedInModal() {
    const modal = document.getElementById('linkedin-modal');
    if (modal) {
        modal.style.display = 'block';
        console.log('📘 Modal do LinkedIn aberto');
    }
}

function closeLinkedInModal() {
    const modal = document.getElementById('linkedin-modal');
    if (modal) {
        modal.style.display = 'none';
        // Limpar formulário
        document.getElementById('linkedin-course-form').reset();
        document.getElementById('bulk-courses').value = '';
    }
}

function addLinkedInCourse() {
    const courseName = document.getElementById('linkedin-course-name').value.trim();
    const institution = document.getElementById('linkedin-institution').value.trim();
    const date = document.getElementById('linkedin-date').value.trim() || '2024';
    const hours = document.getElementById('linkedin-hours').value.trim();
    const url = document.getElementById('linkedin-url').value.trim();

    if (!courseName || !institution) {
        alert('⚠️ Nome do curso e instituição são obrigatórios!');
        return;
    }

    // Criar certificado no formato padrão
    const certificate = {
        id: Date.now(),
        name: courseName,
        institution: institution,
        date: date,
        hours: hours || '',
        type: 'course',
        icon: 'fas fa-graduation-cap',
        url: url || ''
    };

    // Adicionar aos certificados salvos
    const savedCerts = JSON.parse(localStorage.getItem('certificates') || '[]');
    savedCerts.push(certificate);
    localStorage.setItem('certificates', JSON.stringify(savedCerts));

    // Recarregar certificações na página
    loadCertificates();
    
    // Limpar formulário
    document.getElementById('linkedin-course-form').reset();
    
    showNotification(`✅ Curso "${courseName}" adicionado com sucesso!`, 'success');
    console.log('📘 Curso do LinkedIn adicionado:', certificate);
}

function processBulkImport() {
    const bulkText = document.getElementById('bulk-courses').value.trim();
    if (!bulkText) {
        alert('⚠️ Cole a lista de cursos no campo de texto!');
        return;
    }

    const lines = bulkText.split('\n').filter(line => line.trim());
    let addedCount = 0;

    lines.forEach(line => {
        const parts = line.split('|').map(part => part.trim());
        if (parts.length >= 2) {
            const [courseName, institution, date] = parts;
            
            const certificate = {
                id: Date.now() + addedCount,
                name: courseName,
                institution: institution || 'LinkedIn Learning',
                date: date || '2024',
                hours: '',
                type: 'course',
                icon: 'fab fa-linkedin',
                url: ''
            };

            const savedCerts = JSON.parse(localStorage.getItem('certificates') || '[]');
            savedCerts.push(certificate);
            localStorage.setItem('certificates', JSON.stringify(savedCerts));
            addedCount++;
        }
    });

    if (addedCount > 0) {
        loadCertificates();
        document.getElementById('bulk-courses').value = '';
        showNotification(`✅ ${addedCount} curso(s) importado(s) com sucesso!`, 'success');
        console.log(`📘 ${addedCount} cursos importados do LinkedIn`);
    } else {
        alert('⚠️ Nenhum curso válido encontrado. Use o formato: Nome | Instituição | Data');
    }
}

// Adicionar event listener para o botão do LinkedIn
document.addEventListener('DOMContentLoaded', function() {
    const linkedinBtn = document.getElementById('import-linkedin-btn');
    if (linkedinBtn) {
        linkedinBtn.addEventListener('click', openLinkedInModal);
        console.log('📘 Botão do LinkedIn configurado');
    }
});

// ===================== VISUALIZAÇÃO DE CERTIFICADOS =====================
function viewCertificate(imageUrl) {
    // Criar modal para visualizar certificado
    const modal = document.createElement('div');
    modal.className = 'cert-modal';
    modal.innerHTML = `
        <div class="cert-modal-content">
            <span class="cert-modal-close" onclick="closeCertModal()">&times;</span>
            <div class="cert-modal-header">
                <h3><i class="fas fa-certificate"></i> Certificado DIO</h3>
                <div class="cert-modal-badges">
                    <span class="cert-badge-small verified">
                        <i class="fas fa-check-circle"></i> Verificado
                    </span>
                    <span class="cert-badge-small dio-brand">
                        <i class="fas fa-code"></i> Digital Innovation One
                    </span>
                </div>
            </div>
            <div class="cert-modal-image">
                <img src="${imageUrl}" alt="Certificado DIO" id="cert-modal-img" 
                     oncontextmenu="return false;" 
                     ondragstart="return false;" 
                     onselectstart="return false;">
            </div>
            <div class="cert-modal-footer">
                <p><i class="fas fa-info-circle"></i> Este certificado é verificável através da plataforma oficial da DIO</p>
                <div class="cert-modal-actions">
                    ${isAdminAuthenticated ? `
                        <button onclick="downloadCertificate('${imageUrl}')" class="btn-cert-download">
                            <i class="fas fa-download"></i> Baixar Certificado
                        </button>
                    ` : `
                        <button onclick="showCertificateProtectionMessage()" class="btn-cert-protected">
                            <i class="fas fa-shield-alt"></i> Certificado Protegido
                        </button>
                    `}
                    <button onclick="closeCertModal()" class="btn-cert-close">
                        <i class="fas fa-times"></i> Fechar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animação de entrada
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Fechar com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCertModal();
        }
    });
}

function closeCertModal() {
    const modal = document.querySelector('.cert-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function downloadCertificate(imageUrl) {
    // Verificação de segurança - apenas admin pode baixar certificados
    if (!isAdminAuthenticated) {
        triggerSecurityAlert('Tentativa de download não autorizada!');
        console.warn('🚨 Unauthorized certificate download attempt blocked');
        logAdminAction('UNAUTHORIZED_DOWNLOAD_ATTEMPT', { 
            imageUrl, 
            timestamp: Date.now(),
            userAgent: navigator.userAgent 
        });
        
        // Mostrar mensagem educativa
        showCertificateProtectionMessage();
        return;
    }
    
    // Log da ação de download autorizada
    logAdminAction('CERTIFICATE_DOWNLOADED', { 
        imageUrl, 
        timestamp: Date.now() 
    });
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'certificado-dio-vando-ramos.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('✅ Certificado baixado com sucesso!', 'success');
}

function showCertificateProtectionMessage() {
    const modal = document.createElement('div');
    modal.className = 'protection-modal';
    modal.innerHTML = `
        <div class="protection-modal-content">
            <div class="protection-icon">
                <i class="fas fa-shield-alt"></i>
            </div>
            <h3>🔒 Certificados Protegidos</h3>
            <p>
                Os certificados neste portfólio são propriedade intelectual protegida e 
                estão disponíveis apenas para <strong>visualização</strong>.
            </p>
            <p>
                <i class="fas fa-info-circle"></i> 
                Para verificar a autenticidade, acesse diretamente a 
                <a href="https://web.dio.me" target="_blank">plataforma oficial da DIO</a>.
            </p>
            <div class="protection-actions">
                <button onclick="closeProtectionModal()" class="btn-protection-ok">
                    <i class="fas fa-check"></i> Entendido
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animação de entrada
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Auto-fechar após 5 segundos
    setTimeout(() => {
        closeProtectionModal();
    }, 5000);
}

function closeProtectionModal() {
    const modal = document.querySelector('.protection-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// ===================== SISTEMA HÍBRIDO DE CERTIFICADOS =====================
let certificatesLoaded = false;
let currentFilter = 'all';

// Base de dados dos certificados adicionais
const additionalCertificatesData = {
    bootcamps: [
        {
            title: "Bootcamp Machine Learning",
            institution: "Digital Innovation One (DIO)",
            year: "2024",
            hours: "80+ horas",
            category: "bootcamp",
            icon: "fas fa-brain",
            skills: ["Python", "Scikit-learn", "TensorFlow"],
            badge: "dio"
        },
        {
            title: "Bootcamp Full Stack Developer",
            institution: "Digital Innovation One (DIO)",
            year: "2024",
            hours: "150+ horas",
            category: "bootcamp",
            icon: "fas fa-layers",
            skills: ["React", "Node.js", "MongoDB"],
            badge: "dio"
        },
        {
            title: "Bootcamp DevOps Professional",
            institution: "Digital Innovation One (DIO)",
            year: "2024",
            hours: "90+ horas",
            category: "bootcamp",
            icon: "fas fa-infinity",
            skills: ["Docker", "Kubernetes", "Jenkins"],
            badge: "dio"
        }
    ],
    certifications: [
        {
            title: "Azure Developer Associate (AZ-204)",
            institution: "Microsoft",
            year: "Em andamento",
            category: "certification",
            icon: "fab fa-microsoft",
            skills: ["Azure", "C#", "REST APIs"],
            badge: "microsoft"
        },
        {
            title: "AWS Cloud Practitioner",
            institution: "Amazon Web Services",
            year: "Planejado",
            category: "certification",
            icon: "fab fa-aws",
            skills: ["AWS", "Cloud Computing", "S3"],
            badge: "aws"
        }
    ],
    courses: [
        {
            title: "Docker & Kubernetes",
            institution: "Digital Innovation One",
            year: "2024",
            hours: "45 horas",
            category: "course",
            icon: "fas fa-cube",
            skills: ["Docker", "Kubernetes", "DevOps"],
            badge: "dio"
        },
        {
            title: "Segurança em APIs",
            institution: "Digital Innovation One",
            year: "2024",
            hours: "30 horas",
            category: "course",
            icon: "fas fa-shield-alt",
            skills: ["API Security", "OAuth", "JWT"],
            badge: "dio"
        },
        {
            title: "Fundamentos de Banco de Dados",
            institution: "Digital Innovation One",
            year: "2024",
            hours: "40 horas",
            category: "course",
            icon: "fas fa-database",
            skills: ["SQL", "MySQL", "PostgreSQL"],
            badge: "dio"
        },
        {
            title: "JavaScript Moderno",
            institution: "Digital Innovation One",
            year: "2024",
            hours: "60 horas",
            category: "course",
            icon: "fab fa-js-square",
            skills: ["ES6+", "React", "Node.js"],
            badge: "dio"
        },
        {
            title: "Python para Data Science",
            institution: "Digital Innovation One",
            year: "2024",
            hours: "55 horas",
            category: "course",
            icon: "fab fa-python",
            skills: ["Python", "Pandas", "NumPy"],
            badge: "dio"
        },
        {
            title: "Git e GitHub",
            institution: "Digital Innovation One",
            year: "2024",
            hours: "25 horas",
            category: "course",
            icon: "fab fa-git-alt",
            skills: ["Git", "GitHub", "Version Control"],
            badge: "dio"
        },
        {
            title: "Linux Essentials",
            institution: "Digital Innovation One",
            year: "2024",
            hours: "35 horas",
            category: "course",
            icon: "fab fa-linux",
            skills: ["Linux", "Terminal", "Shell Script"],
            badge: "dio"
        }
    ]
};

// Função para carregar todos os certificados
function loadAllCertificates() {
    if (certificatesLoaded) return;
    
    const loadingBtn = document.getElementById('loadMoreCerts');
    const additionalContainer = document.getElementById('additionalCerts');
    const skeleton = document.getElementById('loadingSkeleton');
    
    // Mostrar loading
    loadingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando certificados...';
    loadingBtn.disabled = true;
    additionalContainer.style.display = 'block';
    skeleton.style.display = 'flex';
    
    // Simular loading (para melhor UX)
    setTimeout(() => {
        renderAllCertificates();
        skeleton.style.display = 'none';
        loadingBtn.style.display = 'none';
        certificatesLoaded = true;
        updateCertificateCounts();
        
        // Animação suave
        const newItems = additionalContainer.querySelectorAll('.cert-item');
        newItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 1500);
}

// Função para renderizar todos os certificados adicionais
function renderAllCertificates() {
    const container = document.getElementById('additionalCerts');
    let html = '';
    
    // Bootcamps adicionais
    html += `
        <div class="cert-category" data-aos="fade-up">
            <h4><i class="fas fa-rocket"></i> Bootcamps Adicionais</h4>
            <div class="certifications-grid">
    `;
    
    additionalCertificatesData.bootcamps.forEach(cert => {
        html += generateCertificateHTML(cert);
    });
    
    html += `</div></div>`;
    
    // Certificações adicionais
    html += `
        <div class="cert-category" data-aos="fade-up" data-aos-delay="200">
            <h4><i class="fas fa-certificate"></i> Certificações Técnicas</h4>
            <div class="certifications-grid">
    `;
    
    additionalCertificatesData.certifications.forEach(cert => {
        html += generateCertificateHTML(cert);
    });
    
    html += `</div></div>`;
    
    // Cursos adicionais
    html += `
        <div class="cert-category" data-aos="fade-up" data-aos-delay="400">
            <h4><i class="fas fa-graduation-cap"></i> Cursos Complementares</h4>
            <div class="certifications-grid">
    `;
    
    additionalCertificatesData.courses.forEach(cert => {
        html += generateCertificateHTML(cert);
    });
    
    html += `</div></div>`;
    
    container.innerHTML = html;
    
    // Re-inicializar AOS para novas animações
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

// Função para gerar HTML de um certificado
function generateCertificateHTML(cert) {
    const skillTags = cert.skills ? cert.skills.map(skill => 
        `<span class="skill-tag">${skill}</span>`
    ).join('') : '';
    
    const hours = cert.hours ? `<span class="cert-hours">${cert.hours}</span>` : '';
    
    return `
        <div class="cert-item ${cert.category}" data-category="${cert.category}" style="opacity: 0; transform: translateY(20px); transition: all 0.5s ease;">
            <div class="cert-badge ${cert.badge}">
                <i class="${cert.icon}"></i>
            </div>
            <div class="cert-info">
                <h5>${cert.title}</h5>
                <p>${cert.institution} • ${cert.year}</p>
                ${hours}
                ${skillTags ? `<div class="cert-skills">${skillTags}</div>` : ''}
            </div>
        </div>
    `;
}

// Função para filtrar certificados por categoria
function filterCertificates(category) {
    currentFilter = category;
    
    // Atualizar botões ativos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    // Filtrar certificados visíveis
    const allCertItems = document.querySelectorAll('.cert-item');
    
    allCertItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'scale(1)';
            }, 50);
        } else {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.8)';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300);
        }
    });
}

// Função para contar certificados por categoria
function updateCertificateCounts() {
    const counts = {
        all: 0,
        bootcamp: 0,
        certification: 0,
        course: 0
    };
    
    // Contar certificados principais
    document.querySelectorAll('#main-certs .cert-item').forEach(item => {
        counts.all++;
        counts[item.dataset.category]++;
    });
    
    // Contar certificados adicionais se carregados
    if (certificatesLoaded) {
        document.querySelectorAll('#additionalCerts .cert-item').forEach(item => {
            counts.all++;
            counts[item.dataset.category]++;
        });
    } else {
        // Contar da base de dados
        counts.all += additionalCertificatesData.bootcamps.length + 
                     additionalCertificatesData.certifications.length + 
                     additionalCertificatesData.courses.length;
        counts.bootcamp += additionalCertificatesData.bootcamps.length;
        counts.certification += additionalCertificatesData.certifications.length;
        counts.course += additionalCertificatesData.courses.length;
    }
    
    // Atualizar contadores na UI
    Object.keys(counts).forEach(category => {
        const countElement = document.getElementById(`count-${category}`);
        if (countElement) {
            countElement.textContent = counts[category];
        }
    });
}

// ===================== LAZY LOADING E PERFORMANCE =====================

// Intersection Observer para lazy loading
let imageObserver;
let certificateObserver;

function initializeLazyLoading() {
    // Observer para imagens
    imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                    
                    // Adicionar animação de fade-in
                    img.style.opacity = '0';
                    img.onload = () => {
                        img.style.transition = 'opacity 0.5s ease';
                        img.style.opacity = '1';
                    };
                }
            }
        });
    }, {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
    });
    
    // Observer para certificados (animação na entrada)
    certificateObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                certificateObserver.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '20px',
        threshold: 0.15
    });
    
    // Aplicar observers às imagens existentes
    applyLazyLoadingToImages();
}

function applyLazyLoadingToImages() {
    // Lazy loading para imagens de certificados
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        if (img.src && !img.dataset.observed) {
            // Para imagens já carregadas, aplicar intersection observer para animação
            img.dataset.observed = 'true';
            const parent = img.closest('.cert-item, .cert-card-visual');
            if (parent) {
                certificateObserver.observe(parent);
            }
        }
    });
    
    // Para novas imagens que serão carregadas dinamicamente
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Função para otimizar performance do carregamento
function optimizePerformance() {
    // Preload de recursos críticos
    preloadCriticalResources();
    
    // Defer de recursos não críticos
    deferNonCriticalResources();
    
    // Compression de dados
    compressStorageData();
}

function preloadCriticalResources() {
    // Preload das imagens principais de certificados
    const criticalImages = [
        'https://assets.dio.me/4hKpXBQzPSNkWjhv-aLrgYk9JHN49iNpp6lYtWmBn-Q/f:webp/h:320/q:70/w:450/L2NlcnRpZmljYXRlcy9jb3Zlci8wQkEwM0xMWC5qcGc'
    ];
    
    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
}

function deferNonCriticalResources() {
    // Defer do carregamento de certificados adicionais
    setTimeout(() => {
        if (!certificatesLoaded) {
            // Pre-processar dados dos certificados para carregamento mais rápido
            preprocessCertificateData();
        }
    }, 2000);
}

function preprocessCertificateData() {
    // Criar um cache dos dados processados
    const processedData = {
        totalCertificates: getTotalCertificateCount(),
        categories: getCategoryCounts(),
        timestamp: Date.now()
    };
    
    try {
        localStorage.setItem('cert_cache', JSON.stringify(processedData));
    } catch (e) {
        console.warn('LocalStorage não disponível para cache');
    }
}

function getTotalCertificateCount() {
    return additionalCertificatesData.bootcamps.length + 
           additionalCertificatesData.certifications.length + 
           additionalCertificatesData.courses.length + 3; // 3 principais
}

function getCategoryCounts() {
    return {
        all: getTotalCertificateCount(),
        bootcamp: additionalCertificatesData.bootcamps.length + 1,
        certification: additionalCertificatesData.certifications.length + 1,
        course: additionalCertificatesData.courses.length + 1
    };
}

function compressStorageData() {
    // Limpar dados antigos do localStorage
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('cert_') || key.startsWith('old_')) {
                const data = JSON.parse(localStorage.getItem(key));
                if (data.timestamp && Date.now() - data.timestamp > 86400000) { // 24 horas
                    localStorage.removeItem(key);
                }
            }
        });
    } catch (e) {
        console.warn('Erro ao limpar cache:', e);
    }
}

// Debounce para filtros
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedFilter = debounce(filterCertificates, 150);

// Inicializar sistema híbrido quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar lazy loading
    if ('IntersectionObserver' in window) {
        initializeLazyLoading();
    }
    
    // Otimizar performance
    optimizePerformance();
    
    // Adicionar eventos aos filtros (com debounce)
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            debouncedFilter(this.dataset.category);
        });
    });
    
    // Atualizar contadores iniciais
    setTimeout(() => {
        updateCertificateCounts();
        applyLazyLoadingToImages();
    }, 100);
    
    // Preload hover states para melhor UX
    setTimeout(preloadHoverStates, 1000);
    

    
    // Inicializar proteções de imagem
    initImageProtections();
    
    // Inicializar monitoramento avançado de segurança
    initAdvancedSecurityMonitoring();
});

function preloadHoverStates() {
    // Pre-criar elementos hover para transições mais suaves
    const style = document.createElement('style');
    style.innerHTML = `
        .cert-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: transparent;
            transition: all 0.3s ease;
            z-index: -1;
        }
    `;
    document.head.appendChild(style);
}

// ===================== EXPORTAR FUNÇÕES GLOBAIS =====================
// Tornar algumas funções disponíveis globalmente para uso inline no HTML
window.editProject = editProject;
window.deleteProject = deleteProject;
window.addProject = addProject;
window.deleteCertificate = deleteCertificate;
window.closeLinkedInModal = closeLinkedInModal;
window.addLinkedInCourse = addLinkedInCourse;
window.processBulkImport = processBulkImport;
window.viewCertificate = viewCertificate;
window.closeCertModal = closeCertModal;
window.downloadCertificate = downloadCertificate;
window.loadAllCertificates = loadAllCertificates;
window.filterCertificates = filterCertificates;

// ===================== SISTEMA DE ALERTA SONORO =====================
/**
 * Gera um som de alerta para tentativas de pirataria (versão aprimorada)
 */
function playSecurityAlert() {
    console.log('🔊 Tentando reproduzir alerta de segurança...');
    
    // Método 0: Som básico com interação do usuário
    tryBasicAlert();
    
    // Método 1: Web Audio API (mais moderno e confiável)
    if (tryWebAudioAlert()) return;
    
    // Método 2: Audio HTML5 com data URI
    if (tryHtmlAudioAlert()) return;
    
    // Método 3: Speech Synthesis
    if (trySpeechAlert()) return;
    
    // Método 4: Notification API (como último recurso)
    tryNotificationAlert();
}

/**
 * Método 0: Som básico que força interação
 */
function tryBasicAlert() {
    try {
        // Usar console.log com caractere de beep ASCII
        console.log('🚨\x07 ALERTA DE SEGURANÇA! \x07🚨');
        
        // Tentar o clássico window.alert com som
        if (confirm('🚨 ALERTA DE SEGURANÇA!\n\nTentativa de pirataria detectada!\n\nClique OK para continuar.')) {
            console.log('Usuário confirmou o alerta');
        }
        
        return true;
    } catch (error) {
        console.warn('❌ Som básico falhou:', error);
        return false;
    }
}

/**
 * Método 1: Web Audio API aprimorado
 */
function tryWebAudioAlert() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return false;
        
        // Usar contexto global para evitar problemas
        if (!window.securityAudioContext) {
            window.securityAudioContext = new AudioContext();
        }
        
        const audioContext = window.securityAudioContext;
        
        // Garantir que o contexto esteja ativo
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('AudioContext resumido');
            });
        }
        
        // Função melhorada para criar beep
        const createBeep = (frequency, duration, delay = 0, volume = 0.7) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    try {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                        oscillator.type = 'sawtooth'; // Som mais forte
                        
                        // Envelope mais agressivo
                        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.005);
                        gainNode.gain.linearRampToValueAtTime(volume * 0.7, audioContext.currentTime + duration * 0.5);
                        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
                        
                        oscillator.start(audioContext.currentTime);
                        oscillator.stop(audioContext.currentTime + duration);
                        
                        oscillator.onended = resolve;
                        
                    } catch (error) {
                        console.warn('Erro ao criar beep:', error);
                        resolve();
                    }
                }, delay);
            });
        };
        
        // Sequência mais agressiva de alertas
        createBeep(1200, 0.2, 0, 0.8)     // Bip muito agudo
            .then(() => createBeep(600, 0.2, 50, 0.8))  // Bip grave
            .then(() => createBeep(1000, 0.3, 50, 0.9)) // Bip médio longo
            .then(() => createBeep(1400, 0.15, 100, 0.8)); // Bip final agudo
        
        console.log('✅ Web Audio API funcionando');
        return true;
        
    } catch (error) {
        console.warn('❌ Web Audio API falhou:', error);
        return false;
    }
}

/**
 * Método 2: HTML5 Audio com data URI
 */
function tryHtmlAudioAlert() {
    try {
        // Som de bip codificado em base64 (wav muito pequeno)
        const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N+QQAoUXrTp66hVFApGn+DyvmAXBTy7///DciQgFluxUQK///DKSDBKxvjdjE0CJUfL7+KSXBC//////wAAAAECAmpCLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N+QQAoUXrTp66hVFApGn+DyvmAXBTy7///DcjkgBF+6UUGTz/DBhCotWNX6yG7LJj/7///////8AAExCQBoRiYHQ2ydKl1v9z8zhI9plq54tVI2v+z8QAIBARHFMAHB2MDIaD9hCnwgBagtj+7////////YAAEFBQEJEISA=';
        
        const audio = new Audio(audioData);
        audio.volume = 0.7;
        audio.play().then(() => {
            console.log('✅ HTML5 Audio funcionando');
        }).catch(e => {
            console.warn('❌ HTML5 Audio falhou:', e);
            return false;
        });
        
        return true;
        
    } catch (error) {
        console.warn('❌ HTML5 Audio falhou:', error);
        return false;
    }
}

/**
 * Método 3: Speech Synthesis aprimorado
 */
function trySpeechAlert() {
    try {
        if (!window.speechSynthesis) return false;
        
        // Cancelar qualquer fala anterior
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance('ALERTA! ALERTA! ALERTA!');
        utterance.volume = 0.8;
        utterance.rate = 1.5;
        utterance.pitch = 1.8;
        utterance.lang = 'pt-BR';
        
        window.speechSynthesis.speak(utterance);
        
        console.log('✅ Speech Synthesis funcionando');
        return true;
        
    } catch (error) {
        console.warn('❌ Speech Synthesis falhou:', error);
        return false;
    }
}

/**
 * Método 4: Notification API como último recurso
 */
function tryNotificationAlert() {
    try {
        if (!('Notification' in window)) return false;
        
        if (Notification.permission === 'granted') {
            new Notification('🚨 ALERTA DE SEGURANÇA! �', {
                body: 'Tentativa de pirataria detectada!',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🚨</text></svg>',
                requireInteraction: true
            });
            console.log('✅ Notification API funcionando');
            return true;
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    tryNotificationAlert();
                }
            });
        }
        
        return false;
        
    } catch (error) {
        console.warn('❌ Notification API falhou:', error);
        return false;
    }
}

/**
 * Toca alerta sonoro e mostra notificação visual
 */
function triggerSecurityAlert(message) {
    console.log('🚨 ALERTA ACIONADO:', message);
    
    // Tocar som de alerta
    playSecurityAlert();
    
    // Mostrar notificação visual mais destacada
    showNotification(`🚨 ${message}`, 'error');
    
    // Log de segurança detalhado
    console.warn(`🚨 TENTATIVA DE PIRATARIA DETECTADA: ${message}`);
    console.trace('Stack trace da violação de segurança');
    
    // Adicionar efeito visual de alerta mais intenso
    document.body.style.animation = 'securityAlert 0.5s ease-in-out';
    
    // Vibração se disponível (móveis)
    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
    setTimeout(() => {
        document.body.style.animation = '';
    }, 500);
}

/**
 * Função de teste do sistema de alerta (para debug)
 */
function testSecurityAlert() {
    console.log('🧪 TESTE DO SISTEMA DE ALERTA INICIADO');
    
    // Testar todos os métodos
    console.log('Testando Web Audio API...');
    tryWebAudioAlert();
    
    setTimeout(() => {
        console.log('Testando HTML5 Audio...');
        tryHtmlAudioAlert();
    }, 1000);
    
    setTimeout(() => {
        console.log('Testando Speech Synthesis...');
        trySpeechAlert();
    }, 2000);
    
    setTimeout(() => {
        console.log('Testando Notification API...');
        tryNotificationAlert();
    }, 3000);
    
    // Teste completo
    setTimeout(() => {
        console.log('Teste completo do sistema:');
        triggerSecurityAlert('Teste do sistema de segurança');
    }, 4000);
}




/**
 * Inicializa proteções para imagens de certificados DIO
 */
function initImageProtections() {
    // Proteger todas as imagens de certificados
    document.querySelectorAll('.cert-image img, .cert-modal-image img').forEach(img => {
        // Context menu (clique direito)
        img.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            triggerSecurityAlert('Tentativa de salvar imagem de certificado bloqueada!');
        });
        
        // Drag and drop
        img.addEventListener('dragstart', function(e) {
            e.preventDefault();
            triggerSecurityAlert('Tentativa de arrastar certificado bloqueada!');
        });
        
        // Seleção de texto/imagem
        img.addEventListener('selectstart', function(e) {
            e.preventDefault();
            triggerSecurityAlert('Tentativa de selecionar conteúdo protegido bloqueada!');
        });
        
        // Double click (às vezes abre em nova aba)
        img.addEventListener('dblclick', function(e) {
            e.preventDefault();
            triggerSecurityAlert('Ação não permitida em conteúdo protegido!');
        });
    });
    
    // Proteger containers de certificados também
    document.querySelectorAll('.cert-card-visual, .cert-image').forEach(container => {
        container.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            triggerSecurityAlert('Conteúdo protegido - acesso negado!');
        });
        
        container.addEventListener('dragstart', function(e) {
            e.preventDefault();
            triggerSecurityAlert('Operação não permitida em conteúdo protegido!');
        });
    });
    
    console.log('🛡️ Proteções de imagem de certificados inicializadas');
}

/**
 * Monitora tentativas avançadas de pirataria
 */
function initAdvancedSecurityMonitoring() {
    // Detectar abertura de DevTools
    let devtools = { open: false, orientation: null };
    
    setInterval(() => {
        if (window.outerHeight - window.innerHeight > 200 || 
            window.outerWidth - window.innerWidth > 200) {
            if (!devtools.open) {
                devtools.open = true;
                const pdfModal = document.getElementById('pdfModal');
                const certModal = document.getElementById('certModal');
                
                if ((pdfModal && pdfModal.classList.contains('active')) || 
                    (certModal && certModal.classList.contains('active'))) {
                    triggerSecurityAlert('DevTools detectadas - fechando conteúdo protegido!');
                    if (pdfModal) closePDFModal();
                    if (certModal) closeCertModal();
                }
            }
        } else {
            devtools.open = false;
        }
    }, 500);
    
    // Detectar tentativas de cópia via clipboard
    document.addEventListener('copy', function(e) {
        const pdfModal = document.getElementById('pdfModal');
        const certModal = document.getElementById('certModal');
        
        if ((pdfModal && pdfModal.classList.contains('active')) || 
            (certModal && certModal.classList.contains('active'))) {
            e.preventDefault();
            e.clipboardData.setData('text/plain', '🔒 Conteúdo protegido - cópia não autorizada');
            triggerSecurityAlert('Tentativa de cópia de conteúdo protegido bloqueada!');
        }
    });
    
    // Detectar tentativas de seleção de texto em certificados
    document.addEventListener('selectstart', function(e) {
        if (e.target.closest('.cert-modal-image, .cert-image, .pdf-embed')) {
            e.preventDefault();
            triggerSecurityAlert('Seleção de conteúdo protegido não permitida!');
        }
    });
    
    // Monitorar mudanças de foco (possível screenshot)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            const pdfModal = document.getElementById('pdfModal');
            const certModal = document.getElementById('certModal');
            
            if ((pdfModal && pdfModal.classList.contains('active')) || 
                (certModal && certModal.classList.contains('active'))) {
                // Log de possível tentativa de screenshot
                console.warn('🚨 Possível tentativa de screenshot detectada');
            }
        }
    });
    
    // Detectar Print Screen
    document.addEventListener('keydown', function(e) {
        if (e.key === 'PrintScreen') {
            const pdfModal = document.getElementById('pdfModal');
            const certModal = document.getElementById('certModal');
            
            if ((pdfModal && pdfModal.classList.contains('active')) || 
                (certModal && certModal.classList.contains('active'))) {
                triggerSecurityAlert('Tentativa de captura de tela detectada!');
                // Temporariamente ocultar conteúdo
                if (pdfModal) pdfModal.style.opacity = '0';
                if (certModal) certModal.style.opacity = '0';
                
                setTimeout(() => {
                    if (pdfModal) pdfModal.style.opacity = '1';
                    if (certModal) certModal.style.opacity = '1';
                }, 300);
            }
        }
    });
    
    console.log('🔐 Monitoramento avançado de segurança ativado');
}

// ===================== EXPORTAR FUNÇÕES GLOBAIS =====================
// Tornar algumas funções disponíveis globalmente para uso inline no HTML
window.editProject = editProject;
window.deleteProject = deleteProject;
window.addProject = addProject;
window.deleteCertificate = deleteCertificate;
window.closeLinkedInModal = closeLinkedInModal;
window.addLinkedInCourse = addLinkedInCourse;
window.processBulkImport = processBulkImport;
window.viewCertificate = viewCertificate;
window.closeCertModal = closeCertModal;
window.downloadCertificate = downloadCertificate;
window.loadAllCertificates = loadAllCertificates;
window.filterCertificates = filterCertificates;

// Exportar funções PDF
window.viewPDFCertificate = viewPDFCertificate;
window.closePDFModal = closePDFModal;
window.downloadPDFCertificate = downloadPDFCertificate;

// Exportar funções de teste (para debug)
window.testSecurityAlert = testSecurityAlert;
window.playSecurityAlert = playSecurityAlert;
window.triggerSecurityAlert = triggerSecurityAlert;

// Console log para indicar que o script foi carregado
console.log('🚀 Script principal carregado com sucesso!');