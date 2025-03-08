// Variáveis globais para controle do cronômetro
let pomodoroTime = 25;         // Tempo de Pomodoro em minutos
let shortBreakTime = 5;        // Tempo de Pausa Curta em minutos
let longBreakTime = 15;        // Tempo de Pausa Longa em minutos
let autoStartBreaks = false;   // Se true, as pausas começam automaticamente
let autoStartPomodoros = false; // Se true, o Pomodoro começa automaticamente após a pausa
let longBreakInterval = 3;     // Quantidade de ciclos de Pomodoro antes da Pausa Longa
let currentTime = pomodoroTime * 60;
let isRunning = false;
let timer;
let currentMode = 'pomodoro';  // Controla o modo atual ('pomodoro', 'short-break', 'long-break')
let completedCycles = 1;       // Número de ciclos completados, começando sempre em 1
let totalCycles = longBreakInterval; // Total de ciclos antes da pausa longa

// Função para salvar as configurações no LocalStorage
function saveSettingsToLocalStorage() {
    const settings = {
        pomodoroTime,
        shortBreakTime,
        longBreakTime,
        autoStartBreaks,
        autoStartPomodoros,
        longBreakInterval
    };
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings)); // Salva como string JSON
}

// Função para carregar as configurações do LocalStorage
function loadSettingsFromLocalStorage() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        pomodoroTime = settings.pomodoroTime;
        shortBreakTime = settings.shortBreakTime;
        longBreakTime = settings.longBreakTime;
        autoStartBreaks = settings.autoStartBreaks;
        autoStartPomodoros = settings.autoStartPomodoros;
        longBreakInterval = settings.longBreakInterval;
        totalCycles = longBreakInterval;  // Atualiza o total de ciclos

        // Atualiza os inputs do modal de configurações com os valores carregados
        document.getElementById('pomodoro-time').value = pomodoroTime;
        document.getElementById('short-break-time').value = shortBreakTime;
        document.getElementById('long-break-time').value = longBreakTime;
        document.getElementById('auto-start-breaks').checked = autoStartBreaks;
        document.getElementById('auto-start-pomodoros').checked = autoStartPomodoros;
        document.getElementById('long-break-interval').value = longBreakInterval;

        // Atualiza o cronômetro e o contador de ciclos
        resetTimer();
        updateCycleCounter();
    }
}

// Função para atualizar o cronômetro com base nas configurações salvas
function updateTimerSettings() {
    pomodoroTime = parseInt(document.getElementById('pomodoro-time').value, 10);
    shortBreakTime = parseInt(document.getElementById('short-break-time').value, 10);
    longBreakTime = parseInt(document.getElementById('long-break-time').value, 10);
    autoStartBreaks = document.getElementById('auto-start-breaks').checked;
    autoStartPomodoros = document.getElementById('auto-start-pomodoros').checked;
    longBreakInterval = parseInt(document.getElementById('long-break-interval').value, 10);
    totalCycles = longBreakInterval;  // Atualiza o total de ciclos quando as configurações são salvas

    // Salva as configurações no LocalStorage
    saveSettingsToLocalStorage();

    // Atualiza o cronômetro com o valor atual do modo
    resetTimer();
    updateCycleCounter(); // Atualiza o contador de ciclos após salvar as configurações
}

// Função para salvar configurações
document.getElementById('save-settings').addEventListener('click', function () {
    resetCycles();
    updateTimerSettings();
    // Fechar modal após salvar
    const modalElement = document.getElementById('settingsModal');
    const modal = bootstrap.Modal.getInstance(modalElement); // Obtém a instância do modal
    modal.hide(); // Fecha o modal após salvar as configurações
});

// Função para resetar o cronômetro
function resetTimer() {
    clearInterval(timer);  
    isRunning = false;

    switch (currentMode) {
        case 'pomodoro':
            currentTime = pomodoroTime * 60;
            break;
        case 'short-break':
            currentTime = shortBreakTime * 60;
            break;
        case 'long-break':
            currentTime = longBreakTime * 60;
            break;
    }
    updateTime();
    document.getElementById('start').textContent = 'INICIAR';
    document.getElementById('next').style.display = 'none';  // Esconder o botão "PRÓXIMO"
}

// Função para resetar os ciclos e colocar o modo no Pomodoro
function resetCycles() {
    completedCycles = 1; // Zera os ciclos completados
    currentMode = 'pomodoro';  // Define o modo como Pomodoro
    changeMode('pomodoro');    // Alterna visualmente para o modo Pomodoro
    updateCycleCounter();      // Atualiza o contador de ciclos
}

// Função para mudar o modo (Pomodoro, Pausa Curta, Pausa Longa)
function changeMode(mode) {
    resetButtons();
    currentMode = mode;

    switch (mode) {
        case 'pomodoro':
            setMode('#4CAF50', '#388E3C', pomodoroTime * 60);
            document.getElementById('pomodoro').classList.add('selected');
            break;
        case 'short-break':
            setMode('#FF9800', '#F57C00', shortBreakTime * 60);
            document.getElementById('short-break').classList.add('selected');
            break;
        case 'long-break':
            setMode('#4a90e2', '#3a72b5', longBreakTime * 60);
            document.getElementById('long-break').classList.add('selected');
            break;
    }
    
}

// Função para aplicar as cores e estilos ao modo atual
function setMode(bgColor, boxColor, time) {
    const timerBox = document.getElementById('timer-box');
    timerBox.classList.add('transition'); // Adiciona transição

    document.body.style.backgroundColor = bgColor;
    timerBox.style.backgroundColor = boxColor;
    currentTime = time;
    updateTime();

    setTimeout(() => {
        timerBox.classList.remove('transition'); // Remove a transição após 1 segundo
    }, 1000);
}

// Função para resetar os botões de modo
function resetButtons() {
    document.querySelectorAll('#mode-buttons .btn').forEach(button => {
        button.classList.remove('selected');
    });
}

// Função para atualizar o tempo no display
function updateTime() {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    document.getElementById('time').textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Função para iniciar o cronômetro
function startTimer() {
    timer = setInterval(() => {
        currentTime--;
        updateTime();
        if (currentTime <= 0) {
            clearInterval(timer);
            isRunning = false;
            handleCycleCompletion();  // Função para o fim de ciclo
        }
    }, 1000);
    isRunning = true;
    document.getElementById('start').textContent = 'PAUSAR';
    document.getElementById('next').style.display = 'inline-block';  // Exibe o botão "PRÓXIMO"
    document.getElementById('stop').style.display = 'inline-block';  // Exibe o botão "PARAR"
}

// Função para parar e resetar o Pomodoro ao estado inicial
document.getElementById('stop').addEventListener('click', function () {
    const confirmStop = confirm("Você realmente deseja parar o Pomodoro? Isso resetará o cronômetro.");
    
    if (confirmStop) {
        clearInterval(timer);  // Para o cronômetro
        resetCycles();         // Reseta os ciclos para o estado inicial
        resetTimer();          // Reseta o cronômetro para o modo Pomodoro inicial
        document.getElementById('next').style.display = 'none';  // Esconde o botão "PRÓXIMO"
        document.getElementById('stop').style.display = 'none';  // Esconde o botão "PARAR"
    }
});

// Função para iniciar e pausar o cronômetro
document.getElementById('start').addEventListener('click', function () {
    if (!isRunning) {  // Se o cronômetro não está rodando, inicia
        startTimer();
    } else {  // Se o cronômetro está rodando, pausa
        clearInterval(timer);
        isRunning = false;
        document.getElementById('start').textContent = 'INICIAR';
        document.getElementById('next').style.display = 'none';  // Esconde o botão "PRÓXIMO"
        document.getElementById('stop').style.display = 'none';  // Esconde o botão "PARAR"
    }
});

// Função para pular para a próxima etapa (Pomodoro ou pausa)
document.getElementById('next').addEventListener('click', function () {
    clearInterval(timer);  // Limpa o intervalo atual
    isRunning = false;     // Marca o cronômetro como não rodando
    handleCycleCompletion();  // Passa para a próxima etapa
    //document.getElementById('next').style.display = 'none';  // Esconde o botão "PRÓXIMO"
});

function handleCycleCompletion() {
    const alarmSound = document.getElementById('alarm-sound');
    alarmSound.play();  // Reproduz o som ao final do ciclo

    if (currentMode === 'pomodoro') {
        if (completedCycles < totalCycles) {
            if (autoStartBreaks) {
                changeMode('short-break');
                startTimer();
            } else {
                alert('Pomodoro completo! Inicie a pausa curta.');

            }
        } else {
            if (autoStartPomodoros) {
                changeMode('long-break');
                startTimer();
            } else {
                alert('Ciclos completos! Inicie a pausa longa.');

            }
        }
    } else if (currentMode === 'short-break') {
        completedCycles++;
        updateCycleCounter();
        if (autoStartPomodoros) {
            changeMode('pomodoro');
            startTimer();
        }
    } else if (currentMode === 'long-break') {
        completedCycles = 1;
        updateCycleCounter();
        if (autoStartPomodoros) {
            changeMode('pomodoro');
            startTimer();
        }
    }
}


// Função para atualizar o contador de ciclos
function updateCycleCounter() {
    const cycleCounter = document.getElementById('cycle-counter');
    cycleCounter.textContent = `Ciclo: ${completedCycles} / ${totalCycles}`;
}

document.addEventListener('keydown', function(event) {
    // Verifica se a tecla pressionada é a barra de espaço
    if (event.code === 'Space') {
        if (!isRunning) {  // Se o cronômetro não está rodando, inicia
            startTimer();
        } else {  // Se o cronômetro está rodando, pausa
            clearInterval(timer);
            isRunning = false;
            document.getElementById('start').textContent = 'INICIAR';
            document.getElementById('next').style.display = 'none';  // Esconde o botão "PRÓXIMO"
            document.getElementById('stop').style.display = 'none';  // Esconde o botão "PARAR"
        }
    }
});

// Inicializa as configurações e o modo Pomodoro quando a página carregar
window.onload = function() {
    loadSettingsFromLocalStorage();
    changeMode('pomodoro');
    updateCycleCounter();
};
