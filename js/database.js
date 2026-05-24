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

    updateGoal(id, progress, tasks = null) {
        let goals = this.getAllGoals();
        goals = goals.map(g => {
            if(g.id === id) {
                g.progresso = progress;
                if(tasks) g.tarefas = tasks;
                g.dataConclusao = progress >= 100 ? new Date().toLocaleDateString('pt-BR') : null;
            }
            return g;
        });
        localStorage.setItem(DB_KEY, JSON.stringify(goals));
    },

    deleteGoal(id) {
        let goals = this.getAllGoals().filter(g => g.id !== id);
        localStorage.setItem(DB_KEY, JSON.stringify(goals));
    }
};
