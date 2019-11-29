let context = document.getElementById("canvas").getContext("2d");
let colorPicker = $("#color-picker");

const canvasLeftOffset = $("#canvas")[0].offsetLeft;
const canvasTopOffset = $("#canvas")[0].offsetTop;

let allowedToDraw = false;


let clickX = [];
let clickY = [];
let dragging = [];
let colors = [];
let sizes = [];
let paint = false;
let tool = "pencil";


$("#pencil-icon").addClass("active");

$("#pencil-icon").click(function () {
    console.log(`Pencil icon clicked`);
    $("#eraser-icon").removeClass("active");
    $(this).addClass("active");
    tool = "pencil";
});

$("#eraser-icon").click(function () {
    console.log(`Eraser icon clicked`);
    $("#pencil-icon").removeClass("active");
    $(this).addClass("active");
    tool = "eraser";
});


function redraw() {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);


    for (let i = 0; i < clickX.length; i++) {

        context.strokeStyle = colors[i];
        context.lineJoin = "round";
        context.lineWidth = sizes[i];
        context.beginPath();

        if (dragging[i] && i) {
            context.moveTo(clickX[i - 1], clickY[i - 1]);
        } else {
            context.moveTo(clickX[i] - 1, clickY[i]);
        }

        context.lineTo(clickX[i], clickY[i]);
        context.closePath();
        context.stroke();

    }

    socket.emit("redraw", {
        clickX,
        clickY,
        dragging,
        colors,
        sizes
    });

}

function redrawAsReceiver() {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);


    for (let i = 0; i < clickX.length; i++) {

        context.strokeStyle = colors[i];
        context.lineJoin = "round";
        context.lineWidth = sizes[i];
        context.beginPath();

        if (dragging[i] && i) {
            context.moveTo(clickX[i - 1], clickY[i - 1]);
        } else {
            context.moveTo(clickX[i] - 1, clickY[i]);
        }

        context.lineTo(clickX[i], clickY[i]);
        context.closePath();
        context.stroke();

    }
}

function addClick(x, y, draggingValue) {

    if (allowedToDraw) {
        console.log("Allowed to Draw");

        if (tool == "eraser") {

            let brushSize = $("input[name=brush-size]").val();
            let sizeSelected = brushSize ? parseInt(brushSize) : 5;
            colors.push("#ffffff");
            sizes.push(sizeSelected);
            clickX.push(x);
            clickY.push(y);
            dragging.push(draggingValue);

        }
        else {

            let colorSelected = colorPicker.val();
            let brushSize = $("input[name=brush-size]").val();
            let sizeSelected = brushSize ? parseInt(brushSize) : 5;
            colors.push(colorSelected);
            sizes.push(sizeSelected);
            clickX.push(x);
            clickY.push(y);
            dragging.push(draggingValue);

        }
    } else {
        swal({
            title: "Not allowed to Draw",
            icon: "info",
            button: "Okay"
        });

    }

}


$("#canvas").on('mousedown', function (e) {
    paint = true;
    addClick(e.pageX - canvasLeftOffset, e.pageY - canvasTopOffset);
    redraw();
});

$("#canvas").on('touchstart', function (e) {
    // alert("touch move");

    paint = true;

    addClick(e.pageX - canvasLeftOffset, e.pageY - canvasTopOffset);
    redraw();
});

$("#canvas").on('mousemove', function (e) {
    if (paint) {
        addClick(e.pageX - canvasLeftOffset, e.pageY - canvasTopOffset, true);
        redraw();
    }
});

$("#canvas").on('touchmove', function (e) {
    alert("touch move");
    if (paint) {
        addClick(e.pageX - canvasLeftOffset, e.pageY - canvasTopOffset, true);
        redraw();
    }
});

$("#canvas").on('mouseup', function (e) {
    paint = false;
});

$("#canvas").on('mouseleave', function (e) {
    paint = false;
});

const clearCanvas = () => {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    clickX = [];
    clickY = [];
    dragging = [];
    colors = [];
    sizes = [];

    socket.emit("redraw", {
        clickX,
        clickY,
        dragging,
        colors,
        sizes
    });
}

$("#clear-btn").click(function (e) {
    if (allowedToDraw) {
        clearCanvas();
    }
});
