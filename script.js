
utils.setup()
utils.setStyles()
utils.setGlobals()

window.addEventListener("gamepadconnected", (event) => {
    console.log("Gamepad connected!", event.gamepad.id)
    gamepads[event.gamepad.id] = {id: event.gamepad.id, buttons: {}, lbuttons: {}, axes: []}
})

window.addEventListener("gamepaddisconnected", (event) => {
    console.log("Gamepad disconnected :(", event.gamepad.id)
    delete gamepads[event.gamepad.id]
})

var players = {}
var gamepads = {}
var camera = {x: 0, y: 0, zoom: 1}

function toScreen(x, y) {
    return [x+canvas.width/2, y+canvas.height/2]
}

function getButtons(lbuttons) {
    return {
        a: lbuttons[0].pressed, b: lbuttons[1].pressed, x: lbuttons[2].pressed, y: lbuttons[3].pressed,
        lb: lbuttons[4].pressed, rb: lbuttons[5].pressed, lt: lbuttons[6].pressed, rt: lbuttons[7].pressed,
        back: lbuttons[8].pressed, start: lbuttons[9].pressed, lsb: lbuttons[10].pressed, rsb: lbuttons[11].pressed,
        dpt: lbuttons[12].pressed, dpb: lbuttons[13].pressed, dpl: lbuttons[14].pressed, dpr: lbuttons[15].pressed,
        guide: lbuttons[16].pressed
    }
}

function update(timestamp) {
    requestAnimationFrame(update)

    utils.getDelta(timestamp)
    ui.resizeCanvas()
    ui.getSu()
    input.setGlobals()

    ui.rect(canvas.width/2, canvas.height/2, canvas.width, canvas.height, [0, 0, 0, 1])

    var gamepads2 = navigator.getGamepads()
    for (let i = 0; i < gamepads2.length; i++) {
        var gamepad = gamepads2[i]

        if (gamepad) {
            gamepads[gamepad.id].axes = [...gamepad.axes]
            for (let i in gamepads[gamepad.id].axes) {
                if (Math.abs(gamepads[gamepad.id].axes[i]) < 0.1) {
                    gamepads[gamepad.id].axes[i] = 0
                }
            }
            let last = {...gamepads[gamepad.id].buttons}
            gamepads[gamepad.id].buttons = getButtons(gamepad.buttons)
            gamepads[gamepad.id].lbuttons = {}
            if (last) {
                for (let button in gamepads[gamepad.id].buttons) {
                    gamepads[gamepad.id].lbuttons[button] = gamepads[gamepad.id].buttons[button] && !last[button]
                }
            }
            // console.log(gamepads[gamepad.id].buttons)
        }
    }

    for (let gamepad in gamepads) {
        if (!(gamepad in players)) {
            players[gamepad] = {x: 0, y: 0, vx: 0, vy: 0, angle: Math.PI, trail: []}
        }
    }

    let playeri = 0
    for (let player in players) {
        if (!(player in gamepads)) {
            delete players[player]
        } else {
            let buttons = gamepads[player].buttons
            let axes = gamepads[player].axes

            let speed = 0.1
            if (buttons.lt) {
                speed *= 3
            }
            players[player].angle -= axes[0]/25
            if (buttons.a) {
                players[player].vx += Math.sin(players[player].angle) * speed
                players[player].vy += Math.cos(players[player].angle) * speed
            }
            if (buttons.b) {
                players[player].vx -= Math.sin(players[player].angle) * speed
                players[player].vy -= Math.cos(players[player].angle) * speed
            }

            players[player].vx = lerp(players[player].vx, 0, 0.05)
            players[player].vy = lerp(players[player].vy, 0, 0.05)

            players[player].x += players[player].vx
            players[player].y += players[player].vy

            if (gamepads[player].lbuttons.start) {
                players[player].x = 0
                players[player].y = 0
            }

            players[player].trail.push([players[player].x, players[player].y, buttons.lt])
            while (players[player].trail.length > 50) {
                players[player].trail.splice(0, 1)
            }

            let c = hslToRgb(playeri/4 * 360, 100, 50)

            ctx.lineWidth = 5*su
            ctx.lineJoin = "round"
            ctx.beginPath()
            ctx.moveTo(...toScreen(players[player].trail[0][0], players[player].trail[0][1]))
            let i = 0
            for (let point of players[player].trail) {
                if (point[2]) {
                    ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${i/players[player].trail.length})`
                    ctx.lineTo(...toScreen(point[0], point[1]))
                    ctx.stroke()

                    ctx.beginPath()
                    ctx.moveTo(...toScreen(point[0], point[1]))
                    i++
                }
            }

            let sc = toScreen(players[player].x, players[player].y)

            ctx.beginPath()
            players[player].angle -= Math.PI/2
            let s = 1
            ctx.moveTo(...toScreen(players[player].x+rotv2({x: -7.5*su*s, y: -10*su*s}, players[player].angle).x, players[player].y+rotv2({x: -7.5*su*s, y: -10*su*s}, players[player].angle).y))
            ctx.lineTo(...toScreen(players[player].x+rotv2({x: 0*su, y: -7.5*su*s}, players[player].angle).x, players[player].y+rotv2({x: 0*su, y: -7.5*su*s}, players[player].angle).y))
            ctx.lineTo(...toScreen(players[player].x+rotv2({x: 7.5*su*s, y: -10*su*s}, players[player].angle).x, players[player].y+rotv2({x: 7.5*su*s, y: -10*su*s}, players[player].angle).y))
            ctx.lineTo(...toScreen(players[player].x+rotv2({x: 0*su, y: 10*su*s}, players[player].angle).x, players[player].y+rotv2({x: 0*su, y: 10*su*s}, players[player].angle).y))
            ctx.lineTo(...toScreen(players[player].x+rotv2({x: -7.5*su*s, y: -10*su*s}, players[player].angle).x, players[player].y+rotv2({x: -7.5*su*s, y: -10*su*s}, players[player].angle).y))
            players[player].angle += Math.PI/2
            ctx.fillStyle = `rgb(${c.r}, ${c.g}, ${c.b})`
            ctx.fill()
            // ui.circle(...toScreen(players[player].x, players[player].y), 10*su, [c.r, c.g, c.b, 1])

            playeri++
        }
    }

    ui.text(10*su, 20*su, 40*su, "Controllers Connected:", gamepads2.length)

    input.updateInput()
}

function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
  
    let r, g, b;
  
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
    
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
    
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
  
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
    };
}

requestAnimationFrame(update)