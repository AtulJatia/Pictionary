const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
})

const getWord = () => {
    const wordsList = fs.readFileSync("words.txt", 'utf8').split("\n");
    const randomNumber = Math.floor(Math.random() * 150);
    return wordsList[randomNumber];
}

let sockets = [];
let players = [];
let currentPlayer = -1;
let currentWord;
let currentSocketId;
let timeLeft;
let correctGuessedCount;
let intervalVar;
let guessedArray = [];
let gameOnGoing = false;
let activity = [];

const initialiseRound = () => {
    console.log("Initialise Round");
    if (players.length < 2) {
        return "Waiting for more people";
    }
    currentPlayer += 1;
    if (currentPlayer >= players.length) {
        currentPlayer = 0;
    }
    guessedArray = [];
    currentWord = getWord();
    timeLeft = 85;
    correctGuessedCount = 0;
    gameOnGoing = true;
    startRound();
}

const startRound = () => {
    console.log("Start Round");
    activity.unshift("Round started");
    currentSocketId = players[currentPlayer].id;
    activity.unshift(`${players[currentPlayer].name} is drawing!`);

    io.emit('activity_server', activity.slice(0, 6));

    // Find the socket connection for the required player
    for (let i = 0; i < sockets.length; i++) {
        if (sockets[i].id == currentSocketId) {
            sockets[i].emit('gamestart_server', currentWord);
        } else {
            sockets[i].emit('gamestart_server_guess', "All the Best");
        }
    }

    intervalVar = setInterval(() => {
        console.log("One second passed");
        timeLeft -= 1;
        if (timeLeft == 0) {
            stopGame();
            return;
        }
        io.emit("timeleft_server", timeLeft);
    }, 1000);
}

const stopGame = () => {
    console.log("Stop the game");
    clearInterval(intervalVar);
    gameOnGoing = false;
    activity.unshift("Round over");
    io.emit("activity_server", activity.slice(0, 6));
    // Send all the new scores of players
    io.emit("players_list", players);
    io.emit("clearcanvas");
    if (players.length > 1) {
        io.emit("nextround_server");
        initialiseRound();
    } else {
        io.emit("gameover_server");
        currentPlayer = -1;
    }
}

const playerGuess = (id, guess) => {
    let localSocket;
    let playerName;

    for (let i = 0; i < sockets.length; i++) {

        if (sockets[i].id == id) {
            localSocket = sockets[i];
        }
        if (players[i].id == id) {
            playerName = players[i].name;
        }
    }

    if (id == currentSocketId) {
        localSocket.emit("guess_result", "You cannot guess");
        return;
    }

    if (guessedArray.includes(id)) {
        localSocket.emit("guess_result", "Already guessed");
        return;
    }
    if (guess.toLowerCase() == currentWord.toLowerCase()) {
        for (let i = 0; i < players.length; i++) {
            if (players[i].id == id) {
                players[i].score += 1;
                playerName = players[i].name;
                guessedArray.push(players[i].id);
                localSocket.emit("guess_result", "Correct");
                break;
            }
        }
        activity.unshift(`${playerName} guessed the answer correct!`);
        io.emit("activity_server", activity.slice(0, 6));
        correctGuessedCount += 1;
    } else {
        localSocket.emit("guess_result", "Wrong");
        activity.unshift(`${playerName} guessed the answer wrong :/`);
        io.emit("activity_server", activity.slice(0, 6));
    }
    if (correctGuessedCount == players.length - 1) {
        stopGame();
    }
}

io.on('connection', (socket) => {
    sockets.push(socket);
    console.log(socket.id);
    console.log("Connection formed");

    players.push({
        id: socket.id,
        name: "Player" + (players.length + 1),
        score: 0
    });

    activity.unshift(`New player connected!!`);
    io.emit("activity_server", activity.slice(0, 6));

    io.emit("players_list", players);

    if (players.length > 1 && !gameOnGoing) {
        initialiseRound();
    }

    socket.on('changename', (name) => {
        for (let i = 0; i < players.length; i++) {
            if (players[i].id == socket.id) {
                players[i].name = name;
                break;
            }
        }
        io.emit("players_list", players);
    });

    socket.on('disconnect', () => {

        if (socket.id == currentSocketId) {
            activity.unshift("Person drawing left the game");
            io.emit("activity_server", activity.slice(0, 6));
        }

        let playerName;

        for (let i = 0; i < players.length; i++) {
            if (players[i].id == socket.id) {
                playerName = players[i].name;
            }
        }
        activity.unshift(`${playerName} disconnected`);
        io.emit("activity_server", activity.slice(0, 6));

        sockets = sockets.filter(el => {
            return el.id != socket.id;
        })

        players = players.filter(el => {
            return el.id != socket.id;
        })

        if (players.length < 2) {
            stopGame();
        }
        io.emit("players_list", players);

        if (socket.id == currentSocketId) {
            activity.unshift("Person drawing left the game");
            io.emit("activity_server", activity.slice(0, 6));
            stopGame();
        }


        console.log(`User disconnected: ${socket.id}`);
    });

    // socket.on('message1', (data) => {
    //     console.log(data);
    //     io.emit('message2', {
    //         arrayName: [1, 2, 3, 4, 5, 6]
    //     });
    // });

    socket.on('redraw', (data) => {
        console.log(data);
        socket.broadcast.emit("draw", data);
    });

    socket.on('guess', (data) => {
        console.log("Guess function called: ", data);
        playerGuess(socket.id, data);
    });

    socket.on('getword', () => {
        socket.emit("currentword_server", currentWord);
    })

})

http.listen(PORT, () => {
    console.log(`Listening at port ${PORT}`);
});