// Simulação de conquistas
const badges = [
    { id: 1, title: "Primeiro Passo", desc: "Criou sua primeira meta", icon: "🚀" },
    { id: 2, title: "Foco Total", desc: "Completou 100% de uma meta", icon: "🎯" }
];

function checkAchievements() {
    const goals = Database.getAllGoals();
    const awardsList = document.getElementById('awards-list');
    
    if(!awardsList) return;

    awardsList.innerHTML = "";
    
    // Regra simples: se tiver qualquer meta, ganha a primeira medalha
    if(goals.length > 0) {
        renderBadge(badges[0]);
    }
    
    // Se tiver meta 100%
    if(goals.some(g => g.progresso >= 100)) {
        renderBadge(badges[1]);
    }
}

function renderBadge(badge) {
    const div = document.createElement('div');
    div.className = 'goal-card'; // reusando estilo
    div.innerHTML = `<h3>${badge.icon} ${badge.title}</h3><p>${badge.desc}</p>`;
    document.getElementById('awards-list').appendChild(div);
}