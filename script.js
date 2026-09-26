
const tungDiv = document.getElementById("click_div");

var shakeProgress = 0;
var fallen = false;

const { Engine, Bodies, Body, Composite } = Matter;

const engine = Engine.create();
engine.gravity.y = 1.5;

let tungBody;

const wallSize = 450;

function createWalls() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    return [
        Bodies.rectangle(w / 2, h + wallSize / 2, w, wallSize, { isStatic: true }), // Floor
        Bodies.rectangle(w / 2, -wallSize / 2, w, wallSize, { isStatic: true }),    // Ceiling
        Bodies.rectangle(-wallSize / 2, h / 2, wallSize, h, { isStatic: true }),   // Left
        Bodies.rectangle(w + wallSize / 2, h / 2, wallSize, h, { isStatic: true }) // Right
    ];
}

let walls = createWalls();
Composite.add(engine.world, walls);


function startPhysics() {
    fallen = true;

    const rect = tungDiv.getBoundingClientRect();

    tungDiv.style.translate = "none";

    tungBody = Bodies.rectangle(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        rect.width,
        rect.height,
        {
            restitution: 1.0,
            friction: 0.0,
            frictionAir: 0.01
        }
    );

    Composite.add(engine.world, tungBody);

    let lastTime = 0;

    function update(time) {
        if (!lastTime) lastTime = time;

        Engine.update(engine, Math.min(time - lastTime, 33));
        lastTime = time;

        tungDiv.style.left = (tungBody.position.x - rect.width / 2) + "px";
        tungDiv.style.top = (tungBody.position.y - rect.height / 2) + "px";

        tungDiv.style.transform = `rotate(${tungBody.angle}rad)`;

        requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}


tungDiv.addEventListener("click", () => {
    if (fallen || shakeProgress >= 10) return;

    shakeProgress += 1;

    tungDiv.classList.remove("shake");
    void tungDiv.offsetWidth;
    tungDiv.classList.add("shake");

    tungDiv.addEventListener("animationend", () => {
        tungDiv.classList.remove("shake");

        if (shakeProgress >= 10 && !fallen) {
            console.log("sahur");
            startPhysics();
        }
    }, { once: true });
});


let dragging = false;
let offsetX = 0;
let offsetY = 0;

let lastX = 0;
let lastY = 0;
let lastTime = 0;

let velocityX = 0;
let velocityY = 0;

tungDiv.addEventListener("pointerdown", (e) => {
    if (!fallen) return;

    dragging = true;

    tungDiv.setPointerCapture(e.pointerId);

    offsetX = e.clientX - tungBody.position.x;
    offsetY = e.clientY - tungBody.position.y;

    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = e.timeStamp;

    velocityX = 0;
    velocityY = 0;

    Body.setStatic(tungBody, true);
});

tungDiv.addEventListener("pointermove", (e) => {
    if (!dragging) return;

    const dt = e.timeStamp - lastTime;

    if (dt > 0) {
        velocityX = (e.clientX - lastX) / dt * 16.67;
        velocityY = (e.clientY - lastY) / dt * 16.67;
    }

    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = e.timeStamp;

    Body.setPosition(tungBody, {
        x: e.clientX - offsetX,
        y: e.clientY - offsetY
    });
});

function release(e) {
    if (!dragging) return;

    dragging = false;

    if (e.timeStamp - lastTime > 80) {
        velocityX = 0;
        velocityY = 0;
    }

    Body.setStatic(tungBody, false);

    Body.setVelocity(tungBody, {
        x: Math.max(-25, Math.min(25, velocityX)),
        y: Math.max(-25, Math.min(25, velocityY))
    });

    Body.setAngularVelocity(tungBody, {x: velocityX * 1.5, y: velocityY * 1.5});

    tungDiv.releasePointerCapture(e.pointerId);
}

tungDiv.addEventListener("pointerup", release);
tungDiv.addEventListener("pointercancel", release);


function release() {
    if (!dragging) {
        return;
    }

    dragging = false;

    Body.setStatic(tungBody, false);
    Body.setVelocity(tungBody, { x: velocityX * 0.2, y: velocityY * 0.2});
}

tungDiv.addEventListener("pointerup", release);
tungDiv.addEventListener("pointercancel", release);


window.addEventListener("resize", () => {
    Composite.remove(engine.world, walls);

    walls = createWalls();

    Composite.add(engine.world, walls);
});