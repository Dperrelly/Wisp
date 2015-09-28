var kidImg = $('<img id="kid" src="/images/guy.png">')[0];
var screamImg = $('<img id="scream" src="/images/box.png">')[0];
var blockImg = $('<img id="block" src="/images/block.png">')[0];
var backgroundImg = $('<img id="background" src="/images/background.png">')[0];
var spikeImg = $('<img id="spike" src="/images/spike.png" width="50" height="70">')[0];
var sprite1Img = $('<img id="sprite1" src="/images/sprite1.png">')[0];
var sprite2Img = $('<img id="sprite2" src="/images/sprite2.png">')[0];
var selectedImg = $('#lilblock')[0] ;
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
var spinner = new Spinner().spin();
$('.loader').append(spinner.el);
var ai = new Worker('/javascripts/AI.js');

// window.app = angular.module('GameModule', []);

// app.factory('LevelFactory', function($http){
//     return{
//         getAll: function(){
//             return $http.get('/level').then(function(res){
//                 return res.data;
//             });
//         },

//         save: function(level){
//             return $http.post('/level', level).then(function(res){
//                 return res.data;
//             });
//         }
//     };
// });

// app.controller('LevelController', function($scope, LevelFactory){
//     $scope.save = function()
// });

window.onload = function() {
    $('#unmute').hide();
    $('#respawn').hide();
    $('#jump').prop('volume', 0.1);
    $('#doublejump').prop('volume', 0.15);
    $('#marine').prop('volume', 0.08);
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    game(ctx, canvas);
};