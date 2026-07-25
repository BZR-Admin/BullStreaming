// ===============================
// BULL BIRDS
// Version 0.1.0
// ===============================


// Canvas

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// Menu

const menu = document.getElementById("menu");
const startButton = document.getElementById("startButton");


// Variables del juego

let gameRunning = false;

let score = 0;



// ===============================
// BULL BIRD
// ===============================


let bird = {

    x:100,

    y:300,

    width:35,

    height:35,

    gravity:0.5,

    velocity:0,

    jump:-8

};




// ===============================
// OBSTACULOS
// ===============================


let pipes=[];


function createPipe(){

    let gap=170;


    let topHeight =
    Math.floor(Math.random()*250)+50;


    pipes.push({

        x:480,

        width:60,

        top:topHeight,

        bottom:720-topHeight-gap

    });

}




// ===============================
// INICIAR
// ===============================


startButton.onclick=function(){


    menu.style.display="none";

    canvas.style.display="block";


    resetGame();


    gameRunning=true;


    loop();


};




// ===============================
// RESET
// ===============================


function resetGame(){


    bird.y=300;

    bird.velocity=0;


    pipes=[];


    score=0;


}




// ===============================
// CONTROL
// ===============================


document.addEventListener(
"keydown",
function(e){


    if(e.code==="Space"){

        bird.velocity=bird.jump;

    }


});



canvas.addEventListener(
"click",
function(){

    bird.velocity=bird.jump;

});






// ===============================
// DIBUJAR
// ===============================


function drawBird(){


    ctx.fillStyle="#ff0000";


    ctx.fillRect(

        bird.x,

        bird.y,

        bird.width,

        bird.height

    );


}




function drawPipes(){


    ctx.fillStyle="#111";


    pipes.forEach(pipe=>{


        ctx.fillRect(

            pipe.x,

            0,

            pipe.width,

            pipe.top

        );


        ctx.fillRect(

            pipe.x,

            720-pipe.bottom,

            pipe.width,

            pipe.bottom

        );


    });



}




function drawScore(){


    ctx.fillStyle="white";

    ctx.font="30px Arial";


    ctx.fillText(

        "Score: "+score,

        20,

        40

    );


}





// ===============================
// UPDATE
// ===============================


function update(){


    bird.velocity += bird.gravity;


    bird.y += bird.velocity;



    pipes.forEach(pipe=>{


        pipe.x-=3;



        if(pipe.x===100){

            score++;

        }



    });



    if(
        pipes.length===0 ||
        pipes[pipes.length-1].x<250
    ){

        createPipe();

    }



    collision();



}





// ===============================
// COLISIONES
// ===============================


function collision(){



    if(
        bird.y<0 ||
        bird.y+bird.height>720
    ){

        gameOver();

    }



    pipes.forEach(pipe=>{


        if(

            bird.x < pipe.x+pipe.width &&

            bird.x+bird.width > pipe.x &&

            (

                bird.y < pipe.top ||

                bird.y+bird.height > 720-pipe.bottom

            )

        ){

            gameOver();

        }



    });



}




// ===============================
// GAME OVER
// ===============================


function gameOver(){


    gameRunning=false;


    alert(

        "GAME OVER\nPuntaje: "+score

    );


    canvas.style.display="none";

    menu.style.display="block";


}




// ===============================
// LOOP
// ===============================


function loop(){


    if(!gameRunning)return;


    ctx.clearRect(

        0,

        0,

        canvas.width,

        canvas.height

    );



    update();


    drawBird();

    drawPipes();

    drawScore();



    requestAnimationFrame(loop);


}
