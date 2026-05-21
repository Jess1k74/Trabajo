document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    loadTheme();
    loadProfile();
    updateHome();
    document.getElementById('date-now').innerText = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    
    document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
        toggleTheme(e.target.checked);
    });

    document.getElementById('photo-upload').addEventListener('change', handleImageUpload);
}

// --- LOGICA DE IMAGEM ---
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const base64Image = event.target.result;
            localStorage.setItem('userPhoto', base64Image);
            document.getElementById('profile-img-display').style.backgroundImage = `url('${base64Image}')`;
        };
        reader.readAsDataURL(file);
    }
}

// --- PERFIL E TEMA ---
function loadProfile() {
    const name = localStorage.getItem('userName') || "Estudante de Sucesso";
    const photo = localStorage.getItem('userPhoto') || "https://via.placeholder.com/100";
    document.getElementById('display-name').innerText = name;
    document.getElementById('profile-img-display').style.backgroundImage = `url('${photo}')`;
    updateLevel(false);
}

function saveProfile() {
    const name = document.getElementById('edit-name').value;
    if (name) {
        localStorage.setItem('userName', name);
        loadProfile();
        alert("Nome atualizado!");
    }
}

// --- NOVA LOGICA DE NÍVEL (1 PARA 1) E LISTA NO PERFIL ---
function updateLevel(shouldCelebrate) {
    const goals = Database.getAllGoals();
    const completedGoals = goals.filter(g => g.progresso >= 100);
    const completedCount = completedGoals.length;
    
    // Nível = Metas Concluídas + 1
    const newLevel = completedCount + 1;
    const oldLevel = parseInt(localStorage.getItem('userLevel')) || 1;
    
    // Você pode apagar a linha do levelTitle se não for usar mais
document.getElementById('display-level').innerText = `Nível ${newLevel}`;
    
    // Salva o nível
    localStorage.setItem('userLevel', newLevel);

    // Renderiza a lista de concluídas no perfil
    renderCompletedListInProfile(completedGoals);

    // Gatilho de celebração
    if (shouldCelebrate) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        if (newLevel > oldLevel) {
            setTimeout(() => alert(`Parabéns! Você subiu para o Nível ${newLevel}! 🎉`), 500);
        }
    }
}

function renderCompletedListInProfile(completedGoals) {
    const container = document.getElementById('completed-list-items');
    if (!container) return;

    if (completedGoals.length === 0) {
        container.innerHTML = '<p style="font-size: 0.8rem; color: var(--gray);">Nenhuma meta concluída.</p>';
        return;
    }

    container.innerHTML = completedGoals.map(goal => `
        <div class="completed-item-card">
            <div>
                <span>${goal.nome}</span>
                <small>Finalizado em ${goal.dataConclusao || 'Recente'}</small>
            </div>
            <i class="fas fa-check-circle" style="color: var(--primary);"></i>
        </div>
    `).join('');
}

// --- NAVEGAÇÃO E METAS ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(`screen-${screenId}`).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    const navMap = { 'home': 'nav-home', 'nova-meta': 'nav-add', 'conquistas': 'nav-awards', 'perfil': 'nav-profile' };
    document.getElementById(navMap[screenId]).classList.add('active');
    
    if(screenId === 'home') updateHome();
    if(screenId === 'perfil') updateLevel(false);
}

document.getElementById('goal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const prog = parseInt(document.getElementById('goal-progress').value) || 0;
    const newGoal = {
        id: Date.now().toString(),
        nome: document.getElementById('goal-name').value,
        prazo: document.getElementById('goal-deadline').value,
        progresso: prog,
        dataConclusao: prog >= 100 ? new Date().toLocaleDateString('pt-BR') : null
    };
    Database.saveGoal(newGoal);
    updateLevel(prog >= 100);
    e.target.reset();
    showScreen('home');
});

function updateHome() {
    const list = document.getElementById('goals-list');
    const goals = Database.getAllGoals();
    list.innerHTML = goals.length === 0 ? '<p>Nenhuma meta cadastrada.</p>' : '';

    goals.forEach(goal => {
        const card = document.createElement('div');
        card.className = 'goal-card';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${goal.nome}</strong>
                <span>${goal.progresso}%</span>
            </div>
            <div class="progress-bar-bg" onclick="adjustProgress('${goal.id}')">
                <div class="progress-bar-fill" style="width: ${goal.progresso}%"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--gray);">
                <span>Prazo: ${goal.prazo}</span>
                <button onclick="removeGoal('${goal.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;">Excluir</button>
            </div>
        `;
        list.appendChild(card);
    });
    calculateGlobalProgress(goals);
}

function adjustProgress(id) {
    const newProg = prompt("Progresso (0-100):");
    if (newProg !== null) {
        const p = parseInt(newProg);
        Database.updateGoal(id, p);
        updateHome();
        updateLevel(p >= 100); // Gatilho de nível imediato
    }
}

function calculateGlobalProgress(goals) {
    const total = goals.length ? Math.round(goals.reduce((acc, curr) => acc + curr.progresso, 0) / goals.length) : 0;
    document.getElementById('total-progress').innerText = `${total}%`;
}

function removeGoal(id) {
    if(confirm("Excluir meta?")) {
        Database.deleteGoal(id);
        updateHome();
        updateLevel(false);
    }
}

function toggleTheme(isDark) {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('dark-mode-toggle').checked = (savedTheme === 'dark');
}