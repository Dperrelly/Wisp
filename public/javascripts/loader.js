    var kidImg = $('<img id="kid" src="/images/guy.png">')[0];
    var jess2Img = $('<img id="jess2" src="/images/jess2.png">')[0];
    var jessImg = $('<img id="jess" src="/images/jess.png">')[0];
    var screamImg = $('<img id="scream" src="/images/box.png">')[0];
    var blockImg = $('<img id="block" src="/images/block.png">')[0];
    var backgroundImg = $('<img id="background" src="/images/background.png">')[0];
    var sprite1Img = $('<img id="sprite1" src="/images/sprite1.png">')[0];
    var sprite2Img = $('<img id="sprite2" src="/images/sprite2.png">')[0];
    var selectedImg = blockImg;
    var selectImg = function(img){
    	selectedImg = img;
    	//console.log(img);
    };
window.onload = function() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    //console.log(kidImg);	
    game(ctx, canvas);
};