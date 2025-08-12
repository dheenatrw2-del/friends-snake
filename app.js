// Simple Snake game with obstacles, power-ups and speed boosts.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const scoreEl = document.getElementById('score');
const speedEl = document.getElementById('speed');
const powerEl = document.getElementById('power');
const vol = document.getElementById('vol');
const bgm = document.getElementById('bgm');

bgm.volume = parseFloat(vol.value);
vol.addEventListener('input', ()=> bgm.volume = parseFloat(vol.value));

let grid = 20;
let cols = Math.floor(canvas.width / grid);
let rows = Math.floor(canvas.height / grid);

let snake = [{x: Math.floor(cols/2), y: Math.floor(rows/2)}];
let dir = {x:1,y:0};
let food = null;
let obstacles = [];
let powerups = [];
let score = 0;
let speed = 6; // frames per second baseline
let speedMultiplier = 1;
let currentPower = null;
let running = false;
let frameCount = 0;

function placeFood(){
  while(true){
    let f = {x: rand(cols), y: rand(rows)};
    if(!collides(f) && !isOnSnake(f)) { food = f; break; }
  }
}
function rand(n){return Math.floor(Math.random()*n);}
function isOnSnake(pos){
  return snake.some(s=>s.x===pos.x && s.y===pos.y);
}
function collides(pos){
  return obstacles.some(o=>o.x===pos.x && o.y===pos.y);
}

function spawnObstacles(n=6){
  obstacles = [];
  for(let i=0;i<n;i++){
    let o = {x:rand(cols), y:rand(rows)};
    if(!isOnSnake(o)) obstacles.push(o);
  }
}
function spawnPowerup(){
  const types = ['growth','speed','shrink','scoreBoost'];
  while(true){
    let p = {x:rand(cols), y:rand(rows), type: types[rand(types.length)], ttl: 20*10};
    if(!isOnSnake(p) && !collides(p) && !(food && p.x===food.x && p.y===food.y)) { powerups.push(p); break; }
  }
}

function reset(){
  snake = [{x: Math.floor(cols/2), y: Math.floor(rows/2)}];
  dir = {x:1,y:0};
  score = 0;
  speed = 6;
  speedMultiplier = 1;
  currentPower = null;
  obstacles = [];
  powerups = [];
  placeFood();
  spawnObstacles(8);
}

function step(){
  if(!running) return;
  frameCount++;
  const stepsPerMove = Math.max(1, Math.floor(60 / (speed * speedMultiplier)));
  if(frameCount % stepsPerMove !== 0) return;

  let head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
  head.x = (head.x + cols) % cols;
  head.y = (head.y + rows) % rows;

  if(isOnSnake(head)){
    gameOver();
    return;
  }
  if(obstacles.some(o=>o.x===head.x && o.y===head.y)){
    gameOver();
    return;
  }

  snake.unshift(head);

  if(food && head.x===food.x && head.y===food.y){
    score += 10;
    placeFood();
    if(Math.random() < 0.35) spawnPowerup();
  } else {
    snake.pop();
  }

  for(let i=0;i<powerups.length;i++){
    let p = powerups[i];
    if(head.x===p.x && head.y===p.y){
      applyPower(p.type);
      powerups.splice(i,1);
      break;
    }
  }

  for(let p of powerups) p.ttl--;
  powerups = powerups.filter(p=>p.ttl>0);

  if(currentPower && currentPower.timer){ 
    currentPower.timer--; 
    if(currentPower.timer<=0) clearPower(); 
  }

  updateHUD();
}

function applyPower(type){
  currentPower = {type, timer: 30*6};
  if(type==='growth'){ 
    for(let i=0;i<3;i++) snake.push({...snake[snake.length-1]});
  } else if(type==='speed'){
    speedMultiplier = 2.0;
  } else if(type==='shrink'){
    if(snake.length>3) snake.splice(Math.max(1,snake.length-3));
  } else if(type==='scoreBoost'){
    score += 50;
  }
  powerEl.textContent = type;
}

function clearPower(){
  currentPower = null;
  speedMultiplier = 1;
  powerEl.textContent = 'None';
}

function gameOver(){
  running = false;
  bgm.pause();
  alert('Game Over! Score: ' + score);
}

function updateHUD(){
  scoreEl.textContent = score;
  speedEl.textContent = (speed * speedMultiplier).toFixed(1);
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#f7f9fb';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  for(let o of obstacles){
    drawCell(o.x, o.y, '#8b5e3c');
  }
  for(let p of powerups){
    drawCell(p.x, p.y, p.type==='speed' ? '#ffcc00' : (p.type==='growth' ? '#6ab04c' : '#6c5ce7'));
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(p.type[0].toUpperCase(), p.x*grid+6, p.y*grid+14);
  }

  if(food){
    drawCell(food.x, food.y, '#ff6b81');
    ctx.fillStyle = 'white';
    ctx.fillRect(food.x*grid+6, food.y*grid+6, grid-12, grid-12);
  }

  for(let i=0;i<snake.length;i++){
    const s = snake[i];
    drawCell(s.x, s.y, i===0 ? '#1f8ef1' : '#2ecc71');
  }
}

function drawCell(x,y,color){
  ctx.fillStyle = color;
  ctx.fillRect(x*grid+1, y*grid+1, grid-2, grid-2);
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.strokeRect(x*grid+1, y*grid+1, grid-2, grid-2);
}

document.addEventListener('keydown', (e)=>{
  if(e.key==='ArrowUp' || e.key==='w'){ if(dir.y===0){ dir={x:0,y:-1}; } }
  if(e.key==='ArrowDown' || e.key==='s'){ if(dir.y===0){ dir={x:0,y:1}; } }
  if(e.key==='ArrowLeft' || e.key==='a'){ if(dir.x===0){ dir={x:-1,y:0}; } }
  if(e.key==='ArrowRight' || e.key==='d'){ if(dir.x===0){ dir={x:1,y:0}; } }
});

startBtn.addEventListener('click', ()=>{
  if(!running){ running=true; bgm.play(); }
});
pauseBtn.addEventListener('click', ()=>{
  running = !running;
  if(!running) bgm.pause(); else bgm.play();
});

function loop(){
  step();
  draw();
  requestAnimationFrame(loop);
}
reset();
loop();
placeFood();
updateHUD();
setInterval(()=>{ if(Math.random()<0.6) spawnPowerup(); }, 4000);
