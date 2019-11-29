socket.emit('message1', [1, 2, 3, 4, 5]);

socket.on('message2', (data) => {
    console.log(data);
});

socket.on('draw', (data) => {
    clickX = data.clickX;
    clickY = data.clickY;
    dragging = data.dragging;
    colors = data.colors;
    sizes = data.sizes;
    redrawAsReceiver();
})

// Send the guess to the server using sockets

$("#submit-button").on('click', () => {
    const guess = $("#answer").val();
    console.log("Guess function called: ", guess);
    socket.emit("guess", guess);
});

// The user who has to draw gets the word
let currentWord;
socket.on("gamestart_server", (data) => {
    currentWord = data;
    console.log("Current Word", currentWord);
    $("#current-word-draw").html(currentWord);
    allowedToDraw = true;
    $("#canvas").css({
        cursor: "pointer"
    });
})

socket.on("gamestart_server_guess", (data) => {
    console.log("Guess");
    $("#current-word-draw").html("");
    allowedToDraw = false;
    $("#canvas").css({
        cursor: "not-allowed"
    });
})

socket.on("timeleft_server", (data) => {
    console.log("Time left is ", data);
    $("#time-left").html("Time left : " + data + " seconds");
})

socket.on("players_list", (players) => {
    console.log("Players are: ");
    console.log(players);
    let playersList = $("#players-list");
    playersList.html(`<tr>
        <td>S.No</td>
        <td>Name</td>
        <td>Score</td>
    </tr>`);
    players.forEach((el, i) => {
        playersList.append(`
        <tr>
        <td>${(i + 1)}</td>
        <td>${el.name}</td>
        <td>${el.score}</td>
        </tr>
        `);
    })
})

// Change your name

$("#change-name").click((e) => {
    const name = $("#name").val();
    console.log("Change name function called");
    console.log(`Name is ${name}`);
    if (name == "") {
        swal({
            title: "Enter a Valid Name",
            icon: "error",
            button: "Okay",
        });

    }
    else {
        socket.emit("changename", name);
    }
})

socket.on("clearcanvas", () => {
    clearCanvas();
});

socket.on("guess_result", (data) => {
    if (data.toLowerCase() == "correct") {
        swal({
            title: "Correct",
            icon: "success",
            button: "Okay",
        });
    } else if (data.toLowerCase() == "wrong") {
        swal({
            title: "Wrong",
            icon: "error",
            button: "Okay",
        });
    }
    else {
        swal({
            title: "Already guessed",
            icon: "info",
            button: "Okay",
        });

    }
});

socket.on("gameover_server", () => {
    swal({
        title: "Game Over",
        icon: "info",
        button: "Okay",
    });
    $("#current-word-draw").html("");
    $("#time-left").html("Time left : 0 seconds. Game Over!");
});

socket.on("nextround_server", () => {
    $("#current-word-draw").html("");
    $("#time-left").html("Time left : 0 seconds. Game Over!");
})