// =====================================
// BULL BIRDS
// Version 0.1.1
// =====================================


// CANVAS

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// MENU

const menu = document.getElementById("menu");
const startButton = document.getElementById("startButton");


// VARIABLES

let gameRunning = false;
let score = 0;



// =====================================
// BULL BIRD TEMPORAL
// =====================================


let bird = {

    x:100,

    y:300,

    width:35,

    height:35,

    gravity:0.45,

    velocity:0,

    jump:-7.5

};




// =====================================
// OBSTACULOS
// =====================================


let pipes=[];



function createPipe(){

    let gap = 170;


    let topHeight =
    Math.floor(Math.random()*250)+50;


    pipes.push({

        x:480,

        width:60,

        top:topHeight,

        bottom:720-topHeight-gap,

        counted:false

    });

}




// =====================================
// INICIAR JUEGO
// =====================================


startButton.onclick=function(){


    menu.style.display="none";

    canvas.style.display="block";


    resetGame();


    gameRunning=true;


    loop();


};




// =====================================
// REINICIAR
// =====================================


function resetGame(){


    bird.y=300;

    bird.velocity=0;


    pipes=[];


    score=0;


}





// =====================================
// CONTROLES
// =====================================


document.addEventListener(
"keydown",
function(e){


    if(e.code==="Space" && gameRunning){

        bird.velocity=bird.jump;

    }


});



canvas.addEventListener(
"click",
function(){


    if(gameRunning){

        bird.velocity=bird.jump;

    }


});




// =====================================
// DIBUJAR BIRD
// =====================================


function drawBird(){


    // cuerpo temporal

    ctx.fillStyle="#e50914";


    ctx.fillRect(

        bird.x,

        bird.y,

        bird.width,

        bird.height

    );


    // ojo

    ctx.fillStyle="white";

    ctx.fillRect(

        bird.x+22,

        bird.y+8,

        7,

        7

    );


}





// =====================================
// DIBUJAR OBSTACULOS
// =====================================


function drawPipes(){



    pipes.forEach(pipe=>{


        // cuerpo negro

        ctx.fillStyle="#141414";


        // superior

        ctx.fillRect(

            pipe.x,

            0,

            pipe.width,

            pipe.top

        );


        // detalle rojo superior

        ctx.fillStyle="#e50914";

        ctx.fillRect(

            pipe.x,

            0,

            pipe.width,

            10

        );



        // inferior

        ctx.fillStyle="#141414";


        ctx.fillRect(

            pipe.x,

            720-pipe.bottom,

            pipe.width,

            pipe.bottom

        );


        // detalle rojo inferior

        ctx.fillStyle="#e50914";


        ctx.fillRect(

            pipe.x,

            710-pipe.bottom,

            pipe.width,

            10

        );



    });


}






// =====================================
// SCORE
// =====================================


function drawScore(){


    ctx.fillStyle="white";

    ctx.font="30px Arial";


    ctx.fillText(

        "Score: "+score,

        20,

        40

    );


}





// =====================================
// ACTUALIZAR JUEGO
// =====================================


function update(){



    // gravedad

    bird.velocity += bird.gravity;


    bird.y += bird.velocity;




    // mover obstáculos

    pipes.forEach(pipe=>{


        pipe.x -= 3;



        // sumar punto

        if(

            pipe.x + pipe.width < bird.x &&

            pipe.counted === false

        ){


            score++;

            pipe.counted=true;


        }


    });





    // crear obstáculos

    if(

        pipes.length===0 ||

        pipes[pipes.length-1].x < 250

    ){

        createPipe();

    }




    collision();


}






// =====================================
// COLISIONES
// =====================================


function collision(){



    // suelo y techo


    if(

        bird.y < 0 ||

        bird.y + bird.height > canvas.height

    ){

        gameOver();

    }






    // obstáculos


    pipes.forEach(pipe=>{



        if(


            bird.x < pipe.x + pipe.width &&


            bird.x + bird.width > pipe.x &&


            (

                bird.y < pipe.top ||

                bird.y + bird.height >

                canvas.height - pipe.bottom

            )


        ){

            gameOver();

        }


    });



}






// =====================================
// GAME OVER
// =====================================


function gameOver(){


    gameRunning=false;


    setTimeout(()=>{


        alert(

            "GAME OVER\nPuntaje: "+score

        );


        canvas.style.display="none";

        menu.style.display="block";


    },100);


}






// =====================================
// LOOP PRINCIPAL
// =====================================


function loop(){


    if(!gameRunning)return;



    // fondo

    ctx.fillStyle="#70c5ce";


    ctx.fillRect(

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
