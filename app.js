// -------------------------------------------------------------
// ESTADO DO CRONÔMETRO
// -------------------------------------------------------------
let startTime = 0;
let elapsedTime = 0;
let animationFrameId = null;
let isRunning = false;

// Controle de Laps
let laps = [];
let lastLapTime = 0;

// -------------------------------------------------------------
// ELEMENTOS DO DOM
// -------------------------------------------------------------
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const millisecondsEl = document.getElementById('milliseconds');

const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnReset = document.getElementById('btn-reset');
const btnLap = document.getElementById('btn-lap');

const lapsContainer = document.getElementById('laps-container');
const lapsList = document.getElementById('laps-list');
const progressCircle = document.getElementById('progress-circle');
const stopwatchCard = document.querySelector('.stopwatch-card');

// Circunferência do círculo SVG: 2 * PI * r (r = 100) => ~628.318
const CIRCUMFERENCE = 2 * Math.PI * 100;
progressCircle.style.strokeDasharray = `${CIRCUMFERENCE}`;
progressCircle.style.strokeDashoffset = `${CIRCUMFERENCE}`;

// -------------------------------------------------------------
// EVENT LISTENERS
// -------------------------------------------------------------
btnStart.addEventListener('click', start);
btnStop.addEventListener('click', stop);
btnReset.addEventListener('click', reset);
btnLap.addEventListener('click', recordLap);

// Atalhos de teclado
document.addEventListener('keydown', (e) => {
    // Evita disparar atalhos se o foco estiver em algum botão (para não clicar duas vezes com espaço)
    if (e.target.tagName === 'BUTTON') {
        e.target.blur();
    }

    const key = e.key.toLowerCase();
    
    if (e.code === 'Space' || key === ' ') {
        e.preventDefault(); // Impede rolagem da página com espaço
        if (isRunning) {
            stop();
        } else {
            start();
        }
    } else if (key === 'r') {
        if (!isRunning && elapsedTime > 0) {
            reset();
        }
    } else if (key === 'l') {
        if (isRunning) {
            recordLap();
        }
    }
});

// -------------------------------------------------------------
// FUNÇÕES DE CONTROLE
// -------------------------------------------------------------

function start() {
    if (isRunning) return;
    
    isRunning = true;
    startTime = Date.now() - elapsedTime;
    
    // Atualiza estados visuais dos botões e card
    btnStart.style.display = 'none';
    btnStop.style.display = 'flex';
    btnReset.disabled = true;
    btnLap.disabled = false;
    
    stopwatchCard.classList.add('running');
    stopwatchCard.classList.remove('paused');
    
    // Inicia o loop de animação de alta precisão
    animationFrameId = requestAnimationFrame(updateTimer);
}

function stop() {
    if (!isRunning) return;
    
    isRunning = false;
    cancelAnimationFrame(animationFrameId);
    
    // Atualiza estados visuais
    btnStop.style.display = 'none';
    btnStart.style.display = 'flex';
    btnStart.querySelector('span').textContent = 'Retomar';
    btnReset.disabled = false;
    btnLap.disabled = true;
    
    stopwatchCard.classList.add('paused');
    stopwatchCard.classList.remove('running');
}

function reset() {
    if (isRunning) return;
    
    elapsedTime = 0;
    lastLapTime = 0;
    laps = [];
    
    // Reset display
    hoursEl.textContent = '00';
    minutesEl.textContent = '00';
    secondsEl.textContent = '00';
    millisecondsEl.textContent = '00';
    
    // Reset progress ring
    progressCircle.style.strokeDashoffset = `${CIRCUMFERENCE}`;
    
    // Reset laps container
    lapsList.innerHTML = '';
    lapsContainer.style.display = 'none';
    
    // Reset botões
    btnStart.querySelector('span').textContent = 'Iniciar';
    btnReset.disabled = true;
    btnLap.disabled = true;
    
    // Reset classes css
    stopwatchCard.classList.remove('running', 'paused');
}

function recordLap() {
    if (!isRunning) return;
    
    const currentTotalTime = elapsedTime;
    const lapDuration = currentTotalTime - lastLapTime;
    
    const lapNumber = laps.length + 1;
    const lapObject = {
        number: lapNumber,
        duration: lapDuration,
        total: currentTotalTime
    };
    
    laps.push(lapObject);
    lastLapTime = currentTotalTime;
    
    // Exibe o painel de voltas caso esteja oculto
    if (lapsContainer.style.display === 'none') {
        lapsContainer.style.display = 'block';
    }
    
    // Renderiza a nova volta
    renderLaps();
    
    // Rola para a volta mais recente
    const wrapper = document.querySelector('.laps-list-wrapper');
    wrapper.scrollTop = 0; // Mostra o topo se adicionarmos novas voltas no início
}

// -------------------------------------------------------------
// ATUALIZAÇÃO DA UI & RENDERIZAÇÃO
// -------------------------------------------------------------

function updateTimer() {
    elapsedTime = Date.now() - startTime;
    
    // Formata e exibe o tempo
    const time = formatTime(elapsedTime);
    hoursEl.textContent = time.hours;
    minutesEl.textContent = time.minutes;
    secondsEl.textContent = time.seconds;
    millisecondsEl.textContent = time.milliseconds;
    
    // Atualiza o progresso visual do anel (representando segundos e milissegundos)
    // Um ciclo completo a cada 60 segundos
    const secondsCycle = (elapsedTime % 60000) / 60000;
    const offset = CIRCUMFERENCE - (secondsCycle * CIRCUMFERENCE);
    progressCircle.style.strokeDashoffset = offset;
    
    if (isRunning) {
        animationFrameId = requestAnimationFrame(updateTimer);
    }
}

function formatTime(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let totalMinutes = Math.floor(totalSeconds / 60);
    let totalHours = Math.floor(totalMinutes / 60);
    
    let displayMs = Math.floor((ms % 1000) / 10); // Mostra centésimos de segundo (00 a 99)
    let displaySecs = totalSeconds % 60;
    let displayMins = totalMinutes % 60;
    let displayHrs = totalHours;
    
    return {
        hours: displayHrs.toString().padStart(2, '0'),
        minutes: displayMins.toString().padStart(2, '0'),
        seconds: displaySecs.toString().padStart(2, '0'),
        milliseconds: displayMs.toString().padStart(2, '0')
    };
}

function renderLaps() {
    lapsList.innerHTML = '';
    
    // Determinar a volta mais rápida e mais lenta (apenas se houver mais de 1 volta)
    let fastestLapId = -1;
    let slowestLapId = -1;
    
    if (laps.length > 1) {
        let minDuration = Infinity;
        let maxDuration = -Infinity;
        
        laps.forEach(lap => {
            if (lap.duration < minDuration) {
                minDuration = lap.duration;
                fastestLapId = lap.number;
            }
            if (lap.duration > maxDuration) {
                maxDuration = lap.duration;
                slowestLapId = lap.number;
            }
        });
    }
    
    // Renderiza da volta mais recente para a mais antiga (ordem decrescente)
    [...laps].reverse().forEach(lap => {
        const li = document.createElement('li');
        li.className = 'lap-item';
        
        if (lap.number === fastestLapId) {
            li.classList.add('fastest');
        } else if (lap.number === slowestLapId) {
            li.classList.add('slowest');
        }
        
        const formattedDuration = formatTimeString(lap.duration);
        const formattedTotal = formatTimeString(lap.total);
        
        li.innerHTML = `
            <span class="lap-number">Volta ${lap.number}</span>
            <span class="lap-time">${formattedDuration}</span>
            <span class="lap-total">${formattedTotal}</span>
        `;
        
        lapsList.appendChild(li);
    });
}

function formatTimeString(ms) {
    const formatted = formatTime(ms);
    // Retorna HH:MM:SS.ms ou MM:SS.ms dependendo de ter horas ou não para ficar mais enxuto
    if (parseInt(formatted.hours) > 0) {
        return `${formatted.hours}:${formatted.minutes}:${formatted.seconds}.${formatted.milliseconds}`;
    }
    return `${formatted.minutes}:${formatted.seconds}.${formatted.milliseconds}`;
}
