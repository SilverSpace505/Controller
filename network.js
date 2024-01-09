
var ws
var connected

var data = {players: {}}
var playerData = {}
var id = 0

function sendMsg(sendData, bypass=false) {
	if (ws.readyState == WebSocket.OPEN && (connected || bypass)) {
		ws.send(JSON.stringify(sendData))
	}
}

var wConnect = false

function connectToServer() {
    console.log("Connecting")
    if (ws) {
        if (ws.readyState == WebSocket.OPEN) {
			ws.close()
		}
    }
    connected = false
    id = 0
    ws = new WebSocket("wss://server.silverspace.online:443")

    ws.addEventListener("open", (event) => {
        sendMsg({connect: "controller"}, true)
    })

    ws.addEventListener("message", (event) => {
        let msg = JSON.parse(event.data)
        if ("connected" in msg) {
            console.log("Connected!")
            connected = true
            id = msg.connected
        }
        if ("ping" in msg && !document.hidden) {
            sendMsg({ping: true})
        }
        if ("data" in msg) {
            playerData = msg.data
        }
        if ("bullet" in msg) {
            bullets.push(msg.bullet)
        }
        if ("explosion" in msg) {
            createExplosion(...msg.explosion)
            for (let i = 0; i < bullets.length; i++) {
                let bullet = bullets[i]
                if (bullet.nid != id) {
                    if (Math.sqrt((bullet.x-msg.explosion[0])**2 + (bullet.y-msg.explosion[1])**2) < 20*su) {
                        bullets.splice(i, 1)
                        i--
                    }
                }
            }
        }
        if ("hit" in msg) {
            players[msg.hit].x = Math.random()*500 - 250
            players[msg.hit].y = Math.random()*500 - 250
        }
    })

    ws.addEventListener("close", (event) => {
        console.log("Disconnected")
        wConnect = true
    })
}

connectToServer()

setInterval(() => {
    sendMsg({data: data})
}, 1000/10)