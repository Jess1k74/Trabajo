document.addEventListener('DOMContentLoaded', () => initApp());

function initApp() {
    loadTheme();
    loadProfile();
    updateHome();
    document.getElementById('date-now').innerText = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    document.getElementById('dark-mode-toggle').addEventListener('change', (e) => toggleTheme(e.target.checked));
    document.getElementById('photo-upload').addEventListener('change', handleImageUpload);
}

// INTERFACE INTELIGENTE
function toggleInputMode() {
    const mode = document.getElementById('goal-mode').value;
    const container = document.getElementById('manual-progress-container');
    const hint = document.getElementById('instruction-hint');
    const labelDesc = document.getElementById('label-desc');
    
    if(mode === 'auto') {
        container.style.display = 'none';
        hint.style.display = 'block';
        labelDesc.innerHTML = 'Lista de Tarefas';
    } else {
        container.style.display = 'block';
        hint.style.display = 'none';
        labelDesc.innerHTML = 'Descrição';
    }
}

// EDIÇÃO
function editGoal(id) {
    const goal = Database.getAllGoals().find(g => g.id === id);
    if (!goal) return;

    document.getElementById('editing-id').value = goal.id;
    document.getElementById('goal-name').value = goal.nome;
    document.getElementById('goal-mode').value = goal.modo;
    document.getElementById('goal-description').value = goal.descricao;
    document.getElementById('goal-deadline').value = goal.prazo;
    document.getElementById('goal-progress').value = goal.progresso;

    document.getElementById('form-title').innerText = "Editar Meta";
    document.getElementById('btn-submit').innerText = "Atualizar Meta";
    document.getElementById('btn-cancel').style.display = "block";

    toggleInputMode();
    showScreen('nova-meta');
}

function resetFormState() {
    document.getElementById('goal-form').reset();
    document.getElementById('editing-id').value = "";
    document.getElementById('form-title').innerText = "Nova Meta";
    document.getElementById('btn-submit').innerText = "Salvar Meta";
    document.getElementById('btn-cancel').style.display = "none";
    toggleInputMode();
    showScreen('home');
}

// RENDERIZAÇÃO
function updateHome() {
    const list = document.getElementById('goals-list');
    const goals = Database.getAllGoals();
    list.innerHTML = goals.length ? '' : '<p>Crie sua primeira meta!</p>';
    
    goals.forEach(g => {
        const div = document.createElement('div');
        div.className = 'goal-card';
        
        let contentHTML = (g.modo === 'auto' && g.tarefas?.length > 0)
            ? `<div class="checklist-container">${g.tarefas.map((t, i) => `
                <label class="task-item ${t.concluida ? 'task-completed' : ''}">
                    <input type="checkbox" ${t.concluida ? 'checked' : ''} onchange="toggleTask('${g.id}', ${i})">
                    ${t.texto}
                </label>`).join('')}</div>`
            : `<p class="goal-description-text">${g.descricao || '<i>Sem descrição.</i>'}</p>`;

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items: center;">
                <strong>${g.nome}</strong>
                <button onclick="editGoal('${g.id}')" style="background:none; border:none; color:var(--primary); cursor:pointer; font-size: 0.8rem;">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
            ${contentHTML}
            <div class="progress-bar-bg ${g.modo}-mode" onclick="${g.modo === 'manual' ? `adjustProgress('${g.id}')` : ''}">
                <div class="progress-bar-fill" style="width:${g.progresso}%"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.7rem; align-items: center;">
                <span><i class="far fa-calendar"></i> ${g.prazo} <b>(${g.modo})</b></span>
                <div style="display:flex; gap:10px">
                    <span style="font-weight:bold">${g.progresso}%</span>
                    <button onclick="removeGoal('${g.id}')" style="color:red; background:none; border:none; cursor:pointer"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        list.appendChild(div);
    });
    
    const total = goals.length ? Math.round(goals.reduce((a, b) => a + b.progresso, 0) / goals.length) : 0;
    document.getElementById('total-progress').innerText = `${total}%`;
}

// SALVAR / ATUALIZAR
document.getElementById('goal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const editingId = document.getElementById('editing-id').value;
    const modo = document.getElementById('goal-mode').value;
    const desc = document.getElementById('goal-description').value;
    
    let tarefas = [];
    let progresso = parseInt(document.getElementById('goal-progress').value) || 0;

    if(modo === 'auto') {
        tarefas = desc.split('\n')
            .filter(linha => linha.trim().startsWith('-'))
            .map(linha => ({ texto: linha.replace('-', '').trim(), concluida: false }));
        
        if(tarefas.length > 0) {
            const concluidas = tarefas.filter(t => t.concluida).length;
            progresso = Math.round((concluidas / tarefas.length) * 100);
        } else { progresso = 0; }
    }

    const goalData = {
        id: editingId || Date.now().toString(),
        nome: document.getElementById('goal-name').value,
        descricao: desc,
        modo: modo,
        tarefas: tarefas,
        prazo: document.getElementById('goal-deadline').value,
        progresso: progresso,
        dataConclusao: progresso >= 100 ? new Date().toLocaleDateString('pt-BR') : null
    };

    let allGoals = Database.getAllGoals();
    if(editingId) {
        const index = allGoals.findIndex(g => g.id === editingId);
        allGoals[index] = goalData;
        localStorage.setItem("@meuapp_metas", JSON.stringify(allGoals));
    } else {
        Database.saveGoal(goalData);
    }

    resetFormState();
});

function toggleTask(goalId, taskIndex) {
    const goals = Database.getAllGoals();
    const goal = goals.find(g => g.id === goalId);
    goal.tarefas[taskIndex].concluida = !goal.tarefas[taskIndex].concluida;
    const concluidas = goal.tarefas.filter(t => t.concluida).length;
    const novoProgresso = Math.round((concluidas / goal.tarefas.length) * 100);
    Database.updateGoal(goalId, novoProgresso, goal.tarefas);
    if(novoProgresso >= 100) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    updateHome();
}

function adjustProgress(id) {
    const p = prompt("Novo progresso (0-100):");
    if (p !== null && !isNaN(p)) { 
        Database.updateGoal(id, Math.min(100, Math.max(0, parseInt(p)))); 
        updateHome(); 
        if(parseInt(p) >= 100) confetti({ particleCount: 100 });
    }
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(`screen-${id}`).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navMap = { 'home': 'nav-home', 'nova-meta': 'nav-add', 'conquistas': 'nav-awards', 'perfil': 'nav-profile' };
    document.getElementById(navMap[id]).classList.add('active');
    if(id === 'home') updateHome();
    if(id === 'conquistas') renderAchievements();
}

function loadProfile() {
    document.getElementById('display-name').innerText = localStorage.getItem('userName') || "Usuário Focus";
    const photo = localStorage.getItem('userPhoto') || 'https://via.placeholder.com/100';
    document.getElementById('profile-img-display').style.backgroundImage = `url('${photo}')`;
}

function saveProfile() {
    const name = document.getElementById('edit-name').value;
    if (name) { localStorage.setItem('userName', name); loadProfile(); alert("Perfil atualizado!"); }
}

function removeGoal(id) { if(confirm("Deseja excluir esta meta?")) { Database.deleteGoal(id); updateHome(); } }
function toggleTheme(dark) { document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light'); localStorage.setItem('theme', dark ? 'dark' : 'light'); }
function loadTheme() { const t = localStorage.getItem('theme') || 'light'; document.documentElement.setAttribute('data-theme', t); document.getElementById('dark-mode-toggle').checked = (t === 'dark'); }

function renderAchievements() {
    const list = document.getElementById('awards-list');
    const completed = Database.getAllGoals().filter(g => g.progresso >= 100);
    list.innerHTML = completed.length ? completed.map(g => `
        <div class="award-card">
            <strong>🏆 ${g.nome}</strong>
            <p style="font-size:0.8rem; margin:5px 0">${g.modo === 'auto' ? 'Meta Checklist' : 'Meta Manual'}</p>
            <small>Concluída em: ${g.dataConclusao}</small>
        </div>`).join('') : '<p>Conclua uma meta para ganhar troféus!</p>';
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            localStorage.setItem('userPhoto', event.target.result);
            document.getElementById('profile-img-display').style.backgroundImage = `url('${event.target.result}')`;
        };
        reader.readAsDataURL(file);
    }
}
