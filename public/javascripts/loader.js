    var kidImg = $('<img id="kid" src="/images/guy.png">')[0];
    var jess2Img = $('<img id="jess2" src="/images/jess2.png">')[0];
    var jessImg = $('<img id="jess" src="/images/jess.png">')[0];
    var screamImg = $('<img id="scream" src="/images/scream.png">')[0];
    var backgroundImg = $('<img id="background" src="/images/background.png">')[0];
window.onload = function() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    //console.log(kidImg);	
    game(ctx, 0, canvas);
};