// Constants
const DEFAULT_SETTINGS = {
    version: '1.0.1',
    pomodoroTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    cyclesPerSession: 4,
    autoTransitions: false,
    repeatSessions: false,
    sessionCount: 1,
    autoCheckTasks: false,
    autoSwitchTasks: false,
    notifyOnTaskComplete: false, // Nova configuração adicionada
    showTaskDescriptions: true   // Nova configuração adicionada
};

const MODE_CONFIGS = {
    pomodoro: { bgColor: '#4CAF50', boxColor: '#388E3C', time: () => settings.pomodoroTime * 60, button: 'pomodoro' },
    'short-break': { bgColor: '#FF9800', boxColor: '#F57C00', time: () => settings.shortBreakTime * 60, button: 'short-break' },
    'long-break': { bgColor: '#4a90e2', boxColor: '#3a72b5', time: () => settings.longBreakTime * 60, button: 'long-break' }
};

const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 };

// Global State
let settings = { ...DEFAULT_SETTINGS };
let currentTime = settings.pomodoroTime * 60;
let initialTime = currentTime;
let isRunning = false;
let timer = null;
let currentMode = 'pomodoro';
let completedCycles = 1;
let currentSession = 1;
let completedTaskCycles = 0;
let tasks = [];
let completedTasks = [];
let activeTaskIndex = null;
let draggedTaskIndex = null;
let historySort = 'date-desc';
let historyFilter = 'all';
let currentTheme = 'light'; // Padrão: tema claro

// DOM Elements
const DOM = {
    timeDisplay: document.getElementById('time'),
    startButton: document.getElementById('start'),
    nextButton: document.getElementById('next'),
    stopButton: document.getElementById('stop'),
    cycleCounter: document.getElementById('cycle-counter'),
    sessionCounter: document.getElementById('session-counter'),
    taskList: document.getElementById('task-list'),
    historyList: document.getElementById('history-list'),
    timerBox: document.getElementById('timer-box'),
    pomodoroSound: document.getElementById('pomodoro-sound'),
    shortBreakSound: document.getElementById('short-break-sound'),
    longBreakSound: document.getElementById('long-break-sound'),
    settingsModal: document.getElementById('settingsModal'),
    taskModal: document.getElementById('taskModal'),
    progressCircle: document.getElementById('progress'),
    notification: document.getElementById('notification'),
    historySortSelect: document.getElementById('history-sort'),
    historyFilterSelect: document.getElementById('history-filter'),
    themeToggle: document.getElementById('theme-toggle'),
    statsContainer: document.getElementById('stats-container')
};

// Utility Functions
function showNotification(message) {
    DOM.notification.textContent = message;
    DOM.notification.style.display = 'block';
    DOM.notification.classList.add('show');
    setTimeout(() => {
        DOM.notification.classList.remove('show');
        setTimeout(() => DOM.notification.style.display = 'none', 500);
    }, 3000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Theme Management
function loadTheme() {
    const savedTheme = localStorage.getItem('pomodoroTheme');
    if (savedTheme) {
        currentTheme = savedTheme;
    }
    applyTheme();
}

function saveTheme() {
    localStorage.setItem('pomodoroTheme', currentTheme);
}

function applyTheme() {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${currentTheme}-theme`);
    DOM.themeToggle.innerHTML = currentTheme === 'light' ? '<i class="fas fa-moon"></i> Tema Escuro' : '<i class="fas fa-sun"></i> Tema Claro';
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveTheme();
}

// Settings Management
function loadSettings() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.version === DEFAULT_SETTINGS.version) {
            settings = { ...parsed };
        } else {
            settings = { ...DEFAULT_SETTINGS };
            saveSettings();
        }
    }
    updateSettingsUI();
    resetTimer();
    updateCounters();
    updateTaskDescriptionsVisibility(); // Adicionado para carregar a configuração de visibilidade
}

function saveSettings() {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
}

function updateSettingsUI() {
    document.getElementById('pomodoro-time').value = settings.pomodoroTime;
    document.getElementById('short-break-time').value = settings.shortBreakTime;
    document.getElementById('long-break-time').value = settings.longBreakTime;
    document.getElementById('cycles-per-session').value = settings.cyclesPerSession;
    document.getElementById('auto-transitions').checked = settings.autoTransitions;
    document.getElementById('repeat-sessions').checked = settings.repeatSessions;
    document.getElementById('session-count').value = settings.sessionCount;
    document.getElementById('auto-check-tasks').checked = settings.autoCheckTasks;
    document.getElementById('auto-switch-tasks').checked = settings.autoSwitchTasks;
    document.getElementById('notify-on-task-complete').checked = settings.notifyOnTaskComplete; // Novo
    document.getElementById('show-task-descriptions').checked = settings.showTaskDescriptions;   // Novo
}

function saveTimerSettings() {
    const newSettings = {
        pomodoroTime: parseInt(document.getElementById('pomodoro-time').value, 10) || 25,
        shortBreakTime: parseInt(document.getElementById('short-break-time').value, 10) || 5,
        longBreakTime: parseInt(document.getElementById('long-break-time').value, 10) || 15,
        cyclesPerSession: parseInt(document.getElementById('cycles-per-session').value, 10) || 4,
        autoTransitions: document.getElementById('auto-transitions').checked,
        repeatSessions: document.getElementById('repeat-sessions').checked,
        sessionCount: parseInt(document.getElementById('session-count').value, 10) || 1,
        autoCheckTasks: document.getElementById('auto-check-tasks').checked,
        autoSwitchTasks: document.getElementById('auto-switch-tasks').checked,
        notifyOnTaskComplete: document.getElementById('notify-on-task-complete').checked, // Novo
        showTaskDescriptions: document.getElementById('show-task-descriptions').checked, // Novo
        version: DEFAULT_SETTINGS.version
    };

    newSettings.pomodoroTime = Math.max(1, newSettings.pomodoroTime);
    newSettings.shortBreakTime = Math.max(1, newSettings.shortBreakTime);
    newSettings.longBreakTime = Math.max(1, newSettings.longBreakTime);
    newSettings.cyclesPerSession = Math.max(1, newSettings.cyclesPerSession);
    newSettings.sessionCount = Math.max(1, newSettings.sessionCount);

    settings = newSettings;
    saveSettings();
    resetTimer();
    resetCycles();
    currentSession = 1;
    updateCounters();
    updateTaskDescriptionsVisibility(); // Adicionado para aplicar a configuração
    bootstrap.Modal.getInstance(DOM.settingsModal).hide();
}

// Função para atualizar a visibilidade das descrições das tarefas
function updateTaskDescriptionsVisibility() {
    if (settings.showTaskDescriptions) {
        document.body.classList.remove('hide-task-descriptions');
    } else {
        document.body.classList.add('hide-task-descriptions');
    }
    renderTasks();
}

// Task Persistence
function saveTasks() {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('pomodoroTasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks).map(task => ({
            name: task.name || 'Tarefa sem nome',
            description: task.description || 'Sem descrição',
            cycles: task.cycles || 1,
            completed: task.completed || false,
            priority: task.priority || 'medium'
        }));
        sortTasksByPriority();
    }
    renderTasks();
}

function saveCompletedTasks() {
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
}

function loadCompletedTasks() {
    const savedCompletedTasks = localStorage.getItem('completedTasks');
    if (savedCompletedTasks) {
        completedTasks = JSON.parse(savedCompletedTasks).map(task => ({
            name: task.name || 'Tarefa sem nome',
            description: task.description || 'Sem descrição',
            cycles: task.cycles || 1,
            priority: task.priority || 'medium',
            completedAt: task.completedAt || new Date().toISOString()
        }));
    }
    renderHistory();
    updateStats();
}

// Timer Logic
function updateTimeDisplay() {
    DOM.timeDisplay.textContent = formatTime(currentTime);
    DOM.timeDisplay.setAttribute('aria-label', `Tempo restante: ${formatTime(currentTime)}`);

    const progress = (initialTime - currentTime) / initialTime;
    const circumference = 2 * Math.PI * 140;
    const offset = circumference * (1 - progress);
    DOM.progressCircle.setAttribute('stroke-dashoffset', offset);
}

function resetTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    isRunning = false;
    DOM.startButton.className = 'pomodoro';
    DOM.startButton.innerHTML = '<i id="start-icon" class="fas fa-play"></i> INICIAR';
    DOM.nextButton.style.display = 'none';
    DOM.stopButton.style.display = 'none';
    currentTime = MODE_CONFIGS[currentMode].time();
    initialTime = currentTime;
    updateTimeDisplay();
    updateTaskButtons();
    renderTasks();
}

function resetCycles() {
    completedCycles = 1;
    completedTaskCycles = 0;
    currentMode = 'pomodoro';
    changeMode('pomodoro');
    updateCounters();
}

function changeMode(mode) {
    currentMode = mode;
    const config = MODE_CONFIGS[mode];
    document.querySelectorAll('#mode-buttons .btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.setAttribute('aria-pressed', 'false');
    });
    document.getElementById(config.button).classList.add('selected');
    document.getElementById(config.button).setAttribute('aria-pressed', 'true');

    DOM.timerBox.classList.add('transition');
    document.body.style.backgroundColor = config.bgColor;
    DOM.timerBox.style.backgroundColor = config.boxColor;
    currentTime = config.time();
    initialTime = currentTime;
    updateTimeDisplay();

    DOM.startButton.className = mode;
    DOM.startButton.innerHTML = `<i id="start-icon" class="fas ${isRunning ? 'fa-pause' : 'fa-play'}"></i> ${isRunning ? 'PAUSAR' : 'INICIAR'}`;

    setTimeout(() => DOM.timerBox.classList.remove('transition'), 1000);
    DOM.progressCircle.classList.remove('pomodoro', 'short-break', 'long-break');
    DOM.progressCircle.classList.add(mode);

    if (mode !== 'pomodoro') {
        showNotification(mode === 'short-break' ? 'Pomodoro concluído! Iniciando Pausa Curta.' : 'Sessão concluída! Iniciando Pausa Longa.');
    }
}

function startTimer() {
    if (isRunning) return; // Evita múltiplos timers
    timer = setInterval(() => {
        currentTime--;
        updateTimeDisplay();
        if (currentTime <= 0) {
            clearInterval(timer);
            timer = null;
            isRunning = false;
            completeCycle();
        }
    }, 1000);
    isRunning = true;
    DOM.startButton.className = currentMode;
    DOM.startButton.innerHTML = '<i id="start-icon" class="fas fa-pause"></i> PAUSAR';
    DOM.nextButton.style.display = 'inline-block';
    DOM.stopButton.style.display = 'inline-block';
    updateTaskButtons();
    renderTasks();
}

function pauseTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    isRunning = false;
    DOM.startButton.className = currentMode;
    DOM.startButton.innerHTML = '<i id="start-icon" class="fas fa-play"></i> INICIAR';
    DOM.nextButton.style.display = 'none';
    DOM.stopButton.style.display = 'none';
    updateTaskButtons();
    renderTasks();
}

function stopTimer() {
    if (confirm('Deseja parar o Pomodoro? Isso resetará o cronômetro.')) {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        isRunning = false; // Garante que o estado seja atualizado
        activeTaskIndex = null;
        completedTaskCycles = 0;
        resetCycles();
        currentSession = 1;
        resetTimer();
        updateCounters();
        showNotification('Cronômetro resetado.');
    }
}

function findNextUncompletedTask(startIndex) {
    sortTasksByPriority();
    for (let i = startIndex; i < tasks.length; i++) {
        if (!tasks[i].completed) return i;
    }
    for (let i = 0; i < startIndex; i++) {
        if (!tasks[i].completed) return i;
    }
    return null;
}

function completeCycle() {
    // Tocar som correspondente ao modo que acabou de terminar
    try {
        if (currentMode === 'pomodoro') {
            DOM.pomodoroSound.play().catch(err => console.error('Erro ao reproduzir som do Pomodoro:', err));
        } else if (currentMode === 'short-break') {
            DOM.shortBreakSound.play().catch(err => console.error('Erro ao reproduzir som da Pausa Curta:', err));
        } else if (currentMode === 'long-break') {
            DOM.longBreakSound.play().catch(err => console.error('Erro ao reproduzir som da Pausa Longa:', err));
        }
    } catch (err) {
        console.error('Erro ao acessar áudio:', err);
    }

    if (currentMode === 'pomodoro') {
        completedCycles++;
        completedTaskCycles++;

        if (activeTaskIndex !== null && tasks[activeTaskIndex]) {
            const task = tasks[activeTaskIndex];
            const taskCompleted = completedTaskCycles >= task.cycles;

            if (settings.autoCheckTasks && taskCompleted) {
                tasks[activeTaskIndex].completed = true;
                addToHistory(tasks[activeTaskIndex]);
            }

            let nextMode;
            if (completedCycles <= settings.cyclesPerSession) {
                nextMode = 'short-break';
            } else {
                nextMode = 'long-break';
                currentSession++;
                completedCycles = 1;
            }

            if (taskCompleted && settings.autoSwitchTasks) {
                const nextTaskIndex = findNextUncompletedTask(activeTaskIndex + 1);
                activeTaskIndex = nextTaskIndex;
                completedTaskCycles = 0;
                if (activeTaskIndex !== null) {
                    settings.cyclesPerSession = tasks[activeTaskIndex].cycles;
                    updateCounters();
                }
            }

            renderTasks();
            renderHistory();
            saveTasks();
            saveCompletedTasks();

            if (nextMode === 'long-break' && settings.repeatSessions && currentSession <= settings.sessionCount) {
                if (settings.autoTransitions) {
                    changeMode(nextMode);
                    startTimer();
                } else {
                    changeMode(nextMode);
                }
            } else if (nextMode === 'long-break') {
                changeMode(nextMode);
                showNotification('Sessão concluída! Descanse durante a Pausa Longa.');
            } else if (settings.autoTransitions) {
                changeMode(nextMode);
                startTimer();
            } else {
                changeMode(nextMode);
            }
        } else {
            if (completedCycles < settings.cyclesPerSession) {
                const nextMode = 'short-break';
                if (settings.autoTransitions) {
                    changeMode(nextMode);
                    startTimer();
                } else {
                    changeMode(nextMode);
                }
            } else {
                const nextMode = 'long-break';
                currentSession++;
                completedCycles = 1;
                activeTaskIndex = null;
                completedTaskCycles = 0;
                if (settings.repeatSessions && currentSession <= settings.sessionCount) {
                    if (settings.autoTransitions) {
                        changeMode(nextMode);
                        startTimer();
                    } else {
                        changeMode(nextMode);
                    }
                } else {
                    changeMode(nextMode);
                    showNotification('Sessão concluída! Descanse durante a Pausa Longa.');
                }
            }
        }
    } else if (currentMode === 'short-break') {
        const nextMode = 'pomodoro';
        if (settings.autoSwitchTasks && activeTaskIndex === null) {
            activeTaskIndex = findNextUncompletedTask(0);
            if (activeTaskIndex !== null) {
                settings.cyclesPerSession = tasks[activeTaskIndex].cycles;
                completedTaskCycles = 0;
                updateCounters();
            }
        }
        renderTasks();
        saveTasks();
        if (settings.autoTransitions) {
            changeMode(nextMode);
            startTimer();
        } else {
            changeMode(nextMode);
            showNotification('Pausa Curta concluída! Inicie o próximo Pomodoro.');
        }
    } else {
        completedTaskCycles = 0;
        const nextMode = 'pomodoro';
        if (settings.autoSwitchTasks) {
            activeTaskIndex = findNextUncompletedTask(0);
            if (activeTaskIndex !== null) {
                settings.cyclesPerSession = tasks[activeTaskIndex].cycles;
                updateCounters();
            }
        }
        renderTasks();
        saveTasks();
        if (settings.repeatSessions && currentSession <= settings.sessionCount) {
            completedCycles = 1;
            if (settings.autoTransitions) {
                changeMode(nextMode);
                startTimer();
            } else {
                changeMode(nextMode);
                showNotification('Pausa Longa concluída! Inicie a próxima sessão.');
            }
        } else {
            isRunning = false;
            DOM.startButton.className = 'pomodoro';
            DOM.startButton.innerHTML = '<i id="start-icon" class="fas fa-play"></i> INICIAR';
            DOM.nextButton.style.display = 'none';
            DOM.stopButton.style.display = 'none';
            currentTime = MODE_CONFIGS['pomodoro'].time();
            initialTime = currentTime;
            currentMode = 'pomodoro';
            changeMode('pomodoro');
            updateTimeDisplay();
            showNotification('Todas as sessões concluídas! Configure uma nova sessão para continuar.');
        }
    }
    updateCounters();
}

function updateCounters() {
    DOM.cycleCounter.textContent = `Ciclo: ${completedCycles} / ${settings.cyclesPerSession}`;
    DOM.sessionCounter.textContent = `Sessão: ${currentSession} / ${settings.sessionCount}`;
}

// Statistics
function updateStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayTasks = completedTasks.filter(task => {
        const completedAt = new Date(task.completedAt);
        return completedAt >= today && completedAt < tomorrow;
    });

    const totalPomodoros = todayTasks.reduce((sum, task) => sum + task.cycles, 0);
    const totalTasks = todayTasks.length;

    const pomodorosByPriority = {
        high: todayTasks.filter(task => task.priority === 'high').reduce((sum, task) => sum + task.cycles, 0),
        medium: todayTasks.filter(task => task.priority === 'medium').reduce((sum, task) => sum + task.cycles, 0),
        low: todayTasks.filter(task => task.priority === 'low').reduce((sum, task) => sum + task.cycles, 0)
    };

    DOM.statsContainer.innerHTML = `
        <h6>Estatísticas de Hoje</h6>
        <p>Total de Pomodoros Completados: ${totalPomodoros}</p>
        <p>Total de Tarefas Concluídas: ${totalTasks}</p>
        <p>Pomodoros por Prioridade:</p>
        <ul>
            <li>Alta: ${pomodorosByPriority.high}</li>
            <li>Média: ${pomodorosByPriority.medium}</li>
            <li>Baixa: ${pomodorosByPriority.low}</li>
        </ul>
    `;
}

// Task Management
function sortTasksByPriority() {
    tasks.sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);
}

function resetTaskModal() {
    document.getElementById('taskModalLabel').textContent = 'Adicionar Tarefa';
    document.getElementById('save-task').textContent = 'Adicionar';
    document.getElementById('task-index').value = '-1';
    document.getElementById('task-name').value = '';
    document.getElementById('task-description').value = '';
    document.getElementById('task-cycles').value = '1';
    document.getElementById('task-priority').value = 'medium';
}

function editTask(index) {
    const task = tasks[index];
    document.getElementById('taskModalLabel').textContent = 'Editar Tarefa';
    document.getElementById('save-task').textContent = 'Salvar';
    document.getElementById('task-index').value = index;
    document.getElementById('task-name').value = task.name;
    document.getElementById('task-description').value = task.description;
    document.getElementById('task-cycles').value = task.cycles;
    document.getElementById('task-priority').value = task.priority;
    new bootstrap.Modal(DOM.taskModal).show();
}

function saveTask() {
    const taskIndex = parseInt(document.getElementById('task-index').value, 10);
    const taskName = document.getElementById('task-name').value.trim();
    const taskDescription = document.getElementById('task-description').value.trim();
    const taskCycles = parseInt(document.getElementById('task-cycles').value, 10) || 1;
    const taskPriority = document.getElementById('task-priority').value;

    if (!taskName) {
        alert('Por favor, insira um nome para a tarefa.');
        return;
    }

    const taskData = {
        name: taskName,
        description: taskDescription || 'Sem descrição',
        cycles: Math.max(1, taskCycles),
        priority: taskPriority,
        completed: taskIndex >= 0 ? tasks[taskIndex].completed : false
    };

    if (taskIndex >= 0) {
        tasks[taskIndex] = taskData;
    } else {
        tasks.push(taskData);
    }

    sortTasksByPriority();
    renderTasks();
    saveTasks();
    resetTaskModal();
    bootstrap.Modal.getInstance(DOM.taskModal).hide();
}

function deleteTask(index) {
    if (activeTaskIndex === index) {
        activeTaskIndex = null;
        completedTaskCycles = 0;
    } else if (activeTaskIndex > index) {
        activeTaskIndex--;
    }
    tasks.splice(index, 1);
    renderTasks();
    saveTasks();
}

function addToHistory(task) {
    const completedTask = {
        name: task.name,
        description: task.description,
        cycles: task.cycles,
        priority: task.priority,
        completedAt: new Date().toISOString()
    };
    completedTasks.push(completedTask);
    if (settings.notifyOnTaskComplete) { // Adicionado: notificação ao completar tarefa
        showNotification(`Tarefa "${task.name}" concluída!`);
    }
    saveCompletedTasks();
    renderHistory();
    updateStats();
}

function toggleTaskCompletion(index) {
    const task = tasks[index];
    tasks[index].completed = !tasks[index].completed;
    if (tasks[index].completed) {
        addToHistory(task);
    }
    if (activeTaskIndex === index && tasks[index].completed) {
        activeTaskIndex = null;
        completedTaskCycles = 0;
    }
    sortTasksByPriority();
    renderTasks();
    renderHistory();
    saveTasks();
}

function startTaskCycles(index) {
    const task = tasks[index];

    if (isRunning && activeTaskIndex !== null && activeTaskIndex !== index) {
        if (!confirm('Outra tarefa está em execução. Deseja interromper a tarefa atual e iniciar esta?')) {
            return;
        }
        pauseTimer();
        completedCycles = 1;
        currentSession = 1;
        completedTaskCycles = 0;
    }

    settings.cyclesPerSession = task.cycles;
    activeTaskIndex = index;
    completedTaskCycles = 0;
    completedCycles = 1;
    currentSession = 1;
    updateCounters();
    resetCycles();
    startTimer();
    showNotification(`Iniciando tarefa: ${task.name}`);
}

function resetHistory() {
    if (confirm('Deseja resetar o histórico? Isso removerá todas as tarefas concluídas do histórico.')) {
        completedTasks = [];
        saveCompletedTasks();
        renderHistory();
        updateStats();
        showNotification('Histórico resetado.');
    }
}

function updateTaskButtons() {
    document.querySelectorAll('#task-list .start-task').forEach((button, idx) => {
        button.classList.toggle('start-task-running', isRunning && idx === activeTaskIndex);
    });
}

function handleDragStart(e, index) {
    draggedTaskIndex = index;
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.target.closest('li').classList.add('drag-over');
}

function handleDragLeave(e) {
    e.target.closest('li').classList.remove('drag-over');
}

function handleDrop(e, dropIndex) {
    e.preventDefault();
    e.target.closest('li').classList.remove('drag-over');

    if (draggedTaskIndex === null || draggedTaskIndex === dropIndex) return;

    const [draggedTask] = tasks.splice(draggedTaskIndex, 1);
    tasks.splice(dropIndex, 0, draggedTask);

    if (activeTaskIndex !== null) {
        if (activeTaskIndex === draggedTaskIndex) {
            activeTaskIndex = dropIndex;
        } else if (draggedTaskIndex < activeTaskIndex && dropIndex >= activeTaskIndex) {
            activeTaskIndex--;
        } else if (draggedTaskIndex > activeTaskIndex && dropIndex <= activeTaskIndex) {
            activeTaskIndex++;
        }
    }

    draggedTaskIndex = null;
    renderTasks();
    saveTasks();
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('#task-list li').forEach(item => item.classList.remove('drag-over'));
}

function renderTasks() {
    DOM.taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        // Adicionado: classe de prioridade para a barra lateral colorida
        li.className = `${task.completed ? 'completed' : ''} ${isRunning && index === activeTaskIndex ? 'task-active' : ''} priority-${task.priority}`;
        li.setAttribute('draggable', 'true');
        li.innerHTML = `
            <div class="task-info">
                <div class="task-details">
                    <div class="task-name">${task.name} (${task.cycles} ciclos)</div>
                    <div class="task-description">${task.description}</div>
                </div>
                <div class="task-actions">
                    <button class="start-task ${isRunning && index === activeTaskIndex ? 'start-task-running' : ''}" onclick="startTaskCycles(${index})" aria-label="Iniciar Pomodoro para a tarefa">
                        Iniciar
                    </button>
                    <button class="edit-task" onclick="editTask(${index})" aria-label="Editar tarefa">
                        Editar
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="toggleTaskCompletion(${index})" aria-label="${task.completed ? 'Desmarcar' : 'Marcar'} tarefa como concluída">
                        <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTask(${index})" aria-label="Excluir tarefa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        li.addEventListener('dragstart', (e) => handleDragStart(e, index));
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('dragleave', handleDragLeave);
        li.addEventListener('drop', (e) => handleDrop(e, index));
        li.addEventListener('dragend', handleDragEnd);
        DOM.taskList.appendChild(li);
    });
}

function renderHistory() {
    // Filtrar tarefas com base no filtro de prioridade
    let filteredTasks = completedTasks;
    if (historyFilter !== 'all') {
        filteredTasks = completedTasks.filter(task => task.priority === historyFilter);
    }

    // Ordenar tarefas com base na opção selecionada
    let sortedTasks = [...filteredTasks];
    if (historySort === 'date-desc') {
        sortedTasks.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    } else if (historySort === 'date-asc') {
        sortedTasks.sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
    } else if (historySort === 'priority-desc') {
        sortedTasks.sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]);
    } else if (historySort === 'priority-asc') {
        sortedTasks.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    }

    // Renderizar as tarefas filtradas e ordenadas
    DOM.historyList.innerHTML = '';
    sortedTasks.forEach(task => {
        const li = document.createElement('li');
        // Adicionado: classe de prioridade para a barra lateral no histórico
        li.className = `priority-${task.priority}`;
        const completedDate = new Date(task.completedAt);
        const formattedDate = `${completedDate.toLocaleDateString('pt-BR')} ${completedDate.toLocaleTimeString('pt-BR')}`;
        li.innerHTML = `
            <div class="history-details">
                <div class="history-name">${task.name} (${task.cycles} ciclos)</div>
                <div class="history-description">${task.description}</div>
                <div class="history-timestamp">Concluída em: ${formattedDate}</div>
            </div>
        `;
        DOM.historyList.appendChild(li);
    });
}

// Event Listeners
DOM.startButton.addEventListener('click', () => {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});

DOM.stopButton.addEventListener('click', stopTimer);

DOM.nextButton.addEventListener('click', () => {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    isRunning = false;
    completeCycle();
});

document.getElementById('save-settings').addEventListener('click', saveTimerSettings);
document.getElementById('save-task').addEventListener('click', saveTask);

DOM.taskModal.addEventListener('hidden.bs.modal', resetTaskModal);

DOM.historySortSelect.addEventListener('change', () => {
    historySort = DOM.historySortSelect.value;
    renderHistory();
});

DOM.historyFilterSelect.addEventListener('change', () => {
    historyFilter = DOM.historyFilterSelect.value;
    renderHistory();
});

DOM.themeToggle.addEventListener('click', toggleTheme);

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !event.target.matches('input, textarea')) {
        event.preventDefault();
        DOM.startButton.click();
    }
});

// Initialization
window.onload = () => {
    loadSettings();
    loadTasks();
    loadCompletedTasks();
    loadTheme();
    changeMode('pomodoro');
    updateCounters();
    updateStats();
};