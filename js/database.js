const DB_KEY = "@meuapp_metas";

const Database = {
    saveGoal(goal) {
        const goals = this.getAllGoals();
        goals.push(goal);
        localStorage.setItem(DB_KEY, JSON.stringify(goals));
    },

    getAllGoals() {
        const data = localStorage.getItem(DB_KEY);
        return data ? JSON.parse(data) : [];
    },

    updateGoal(id, progress) {
        let goals = this.getAllGoals();
        goals = goals.map(g => {
            if(g.id === id) {
                g.progresso = progress;
                // Ajuste: Salva data se for 100% e não tiver data ainda
                if (progress >= 100 && !g.dataConclusao) {
                    g.dataConclusao = new Date().toLocaleDateString('pt-BR');
                } else if (progress < 100) {
                    g.dataConclusao = null; 
                }
            }
            return g;
        });
        localStorage.setItem(DB_KEY, JSON.stringify(goals));
    },

    deleteGoal(id) {
        let goals = this.getAllGoals();
        goals = goals.filter(g => g.id !== id);
        localStorage.setItem(DB_KEY, JSON.stringify(goals));
    }
};