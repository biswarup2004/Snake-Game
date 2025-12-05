const board = document.querySelector(".board");
const GRID_SIZE = 16;
const cols = GRID_SIZE;
const rows = GRID_SIZE;

const startButton = document.querySelector(".btn-start");
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
});
const modal = document.querySelector(".modal");
const startGameModal = document.querySelector(".start-game");
const gameOverModal = document.querySelector(".game-over");
const restartButton = document.querySelector(".btn-restart");
const highScoreElement = document.querySelector("#high-score");
const scoreElement = document.querySelector("#score");
const timeElement = document.querySelector("#time");
const finalScoreElement = document.querySelector("#final-score");
const newHighScoreElement = document.querySelector("#new-high-score");
const controlButtons = document.querySelectorAll(".control-btn");

let highScore = 0;
let score = 0;
let seconds = 0;
let minutes = 0;
let timeIntervalId = null;
let intervalId = null;

highScoreElement.innerText = highScore;

const blocks = {};
let snake = [];
let direction = "right";
let nextDirection = "right";
let food = null;

for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const block = document.createElement("div");
        block.classList.add("block");
        board.appendChild(block);
        blocks[`${row}-${col}`] = block;
    }
}

function clearBoard() {
    Object.values(blocks).forEach(b => b.classList.remove("fill", "food", "food-eaten"));
}

function updateTime() {
    seconds++;
    if (seconds >= 60) {
        seconds = 0;
        minutes++;
    }
    const m = minutes.toString().padStart(2, "0");
    const s = seconds.toString().padStart(2, "0");
    timeElement.innerText = `${m}:${s}`;
}

function startTimer() {
    if (timeIntervalId) clearInterval(timeIntervalId);
    timeIntervalId = setInterval(updateTime, 1000);
}

function stopTimer() {
    if (timeIntervalId) clearInterval(timeIntervalId);
    timeIntervalId = null;
}

function resetTimer() {
    seconds = 0;
    minutes = 0;
    timeElement.innerText = "00:00";
}

function checkSelfCollision(head) {
    return snake.some(seg => seg.x === head.x && seg.y === head.y);
}

function spawnFood() {
    let validPosition = false;
    while (!validPosition) {
        food = {
            x: Math.floor(Math.random() * rows),
            y: Math.floor(Math.random() * cols)
        };
        validPosition = !snake.some(seg => seg.x === food.x && seg.y === food.y);
    }
}

function initGameState() {
    clearBoard();
    snake = [{ x: 8, y: 8 }];
    direction = "right";
    nextDirection = "right";
    score = 0;
    scoreElement.innerText = score;
    resetTimer();
    spawnFood();
}

function animateScore() {
    scoreElement.classList.add('pulse');
    setTimeout(() => scoreElement.classList.remove('pulse'), 300);
}

function gameOver() {
    clearInterval(intervalId);
    intervalId = null;
    stopTimer();
    finalScoreElement.innerText = score;
    
    let isNewHighScore = false;
    if (score > highScore) {
        highScore = score;
        highScoreElement.innerText = highScore;
        isNewHighScore = true;
        newHighScoreElement.style.display = 'block';
    } else {
        newHighScoreElement.style.display = 'none';
    }
    
    modal.style.display = "flex";
    gameOverModal.style.display = "block";
    startGameModal.style.display = "none";
}

function changeDirection(newDir) {
    if (newDir === "up" && direction !== "down") {
        nextDirection = "up";
    } else if (newDir === "down" && direction !== "up") {
        nextDirection = "down";
    } else if (newDir === "left" && direction !== "right") {
        nextDirection = "left";
    } else if (newDir === "right" && direction !== "left") {
        nextDirection = "right";
    }
}

function render() {
    direction = nextDirection;
    
    if (food) {
        blocks[`${food.x}-${food.y}`].classList.add("food");
    }

    const h = snake[0];
    let head =
        direction === "left" ? { x: h.x, y: h.y - 1 } :
        direction === "right" ? { x: h.x, y: h.y + 1 } :
        direction === "up" ? { x: h.x - 1, y: h.y } :
        { x: h.x + 1, y: h.y };

    if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols || checkSelfCollision(head)) {
        gameOver();
        return;
    }

    if (head.x === food.x && head.y === food.y) {
        const foodBlock = blocks[`${food.x}-${food.y}`];
        foodBlock.classList.add("food-eaten");
        setTimeout(() => {
            foodBlock.classList.remove("food", "food-eaten");
        }, 300);
        
        snake.unshift(head);
        score += 10;
        scoreElement.innerText = score;
        animateScore();
        
        if (score > highScore) {
            highScore = score;
            highScoreElement.innerText = highScore;
            highScoreElement.classList.add('pulse');
            setTimeout(() => highScoreElement.classList.remove('pulse'), 300);
        }
        
        spawnFood();
    } else {
        snake.forEach(seg => blocks[`${seg.x}-${seg.y}`].classList.remove("fill"));
        snake.unshift(head);
        snake.pop();
    }

    snake.forEach(seg => blocks[`${seg.x}-${seg.y}`].classList.add("fill"));
}

addEventListener("keydown", e => {
    if (e.key === "ArrowUp") {
        e.preventDefault();
        changeDirection("up");
    } else if (e.key === "ArrowDown") {
        e.preventDefault();
        changeDirection("down");
    } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        changeDirection("left");
    } else if (e.key === "ArrowRight") {
        e.preventDefault();
        changeDirection("right");
    }
});

controlButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
        const dir = e.target.dataset.direction;
        changeDirection(dir);
    });
});

startButton.addEventListener("click", () => {
    if (intervalId) return;
    initGameState();
    modal.style.display = "none";
    render();
    intervalId = setInterval(render, 300);
    startTimer();
     if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(() => {
            deferredPrompt = null;
        });
    }
});

restartButton.addEventListener("click", () => {
    clearInterval(intervalId);
    intervalId = null;
    stopTimer();
    initGameState();
    modal.style.display = "none";
    gameOverModal.style.display = "none";
    render();
    intervalId = setInterval(render, 300);
    startTimer();
});
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
}