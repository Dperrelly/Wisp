    var kidImg = $('<img id="kid" src="/images/guy.png">')[0];
    var screamImg = $('<img id="scream" src="/images/box.png">')[0];
    var blockImg = $('<img id="block" src="/images/block.png">')[0];
    var backgroundImg = $('<img id="background" src="/images/background.png">')[0];
    var spikeImg = $('<img id="spike" src="/images/spike.png" width="50" height="70">')[0];
    var sprite1Img = $('<img id="sprite1" src="/images/sprite1.png">')[0];
    var sprite2Img = $('<img id="sprite2" src="/images/sprite2.png">')[0];
    var selectedImg = blockImg;
    var selectImg = function(img){
    	selectedImg = img;
    };
    var toggleMute = function(){
        console.log($('.audio').prop('muted'));
        if($('.audio').prop('muted')){
            $('#unmute').hide();
            $('#mute').show();
            $('.audio').prop('muted', false);
        }
        else{
            $('#unmute').show();
            $('#mute').hide();
            $('.audio').prop('muted', true);
        }
    };
window.onload = function() {
	$('#loader').hide();
    $('#unmute').hide();
	$('#respawn').hide();
	$('#wrapper').show();
	$('#jump').prop('volume', 0.015);
    $('#marine').prop('volume', 0.08);
	$('#doublejump').prop('volume', 0.025);
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    //console.log(kidImg);	
    game(ctx, canvas);
};