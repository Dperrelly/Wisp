function game(ctx, canvas){

	var socket = io(window.location.origin);

	var canvasWidth = 960;
	var canvasHeight = 640;
	var worldWidth = 1500;
	var worldHeight = 640;
	var playerWidth = 22;
	var playerHeight = 30;
	var xSpeed = 0;
	var ySpeed = 0;
	var camera = {x: 0, y: 0};
	var jumping = false;
	var moveSpeed = 5;
	var jumpStrength = 12;
	var gravity = 0.6 ;
	var hasJump = false;
	var hasDoubleJump = false;
	var grounded = false;
	var gravityCounter = 0;
	var falling = false;
	var spawnX = 500;
	var spawnY = 15;
	var others = [];
	var things = [];
	//var facing = 'right';

	function direction(){
		Math.atan2(xSpeed, ySpeed);
	}

	//initialize controls
	var controls = {
		left: false,
		right: false,
		up: false,
		down: false
	};

	var jump = function(){
		if(hasJump){
		 	jumping = true;
		 	ySpeed -= jumpStrength;
		 	hasJump = false;
		}else if(hasDoubleJump && !jumping){
			jumping = true;
			ySpeed = jumpStrength/-1.3;
			hasDoubleJump = false;
		}
		// setTimeout(function(){
		// 	jumping = false;
		// }, 500);
	 };

	 var releaseJump = function(){
	 	if(!falling){
	 		ySpeed /= 2;
	 	}
	 	jumping = false;
	 };

	//prevent arrow key scrolling
	window.addEventListener("keydown", function(e) {
	    // space and arrow keys
	    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
	        e.preventDefault();
	    }
	}, false);

	//determine state of keypresses
	$(document).keydown(function(event){
	
		var keycode = (event.keyCode ? event.keyCode : event.which);
		if(keycode === 37) controls.left = true;
		if(keycode === 38 || keycode === 16) {
			controls.up = true;
			jump();
		}
		if(keycode === 39) controls.right = true;
		if(keycode === 40) controls.down = true;
	});
	$(document).keyup(function(event){
	
		var keycode = (event.keyCode ? event.keyCode : event.which);
		if(keycode === 37) controls.left = false;
		if(keycode === 38 || keycode === 16) {
			controls.up = false;
			releaseJump();
		}
		if(keycode === 39) controls.right = false;
		if(keycode === 40) controls.down = false;	
	});

	 //initialize collision grid
	 var collisionGrid = [];
	 for(var k = 0; k < worldWidth; k++){
	 	var row = [];
	 	for(var j = 0; j < worldHeight; j++){
	 		//give border collision
	 		// if(k === 0 || k === canvasWidth - 1 || j === 0 || j === canvasHeight - 1){
	 		// 	row.push({collision:true, death: false});
	 		// }
	 		row.push({collision: false, death: false});
	 	}
	 	collisionGrid.push(row);
	 }

	 //collision detection
	 var checkCollision = function(x, y, width, height){
	 	x = Math.round(x);
	 	y = Math.round(y);
	 	for(var i = 0; i < width; i++){
	 		for(var j = 0; j < height; j++){ 	
	 			if(!collisionGrid[i + x] || !collisionGrid[i + x][j + y]) {
	 				//console.log('off the grid! : ' + x + ' ' + y + ' ' + i + ' ' + j);
	 				//if (j + y > canvasHeight) grounded = true;
	 				return true;
	 			}
	 			if(collisionGrid[i + x][j + y].collision) {
	 				//console.log('hit a collision! : ' + x + ' ' + y + ' ' + i + ' ' + j);
	 				//if ()
	 				//console.log('failed cuz: ', i + x, j+ y);
	 				return true;
	 			}
	 		}
	 	}
	 	return false;
	 };

	 var setCollision = function(thing){
	 	// roundedX = Math.round(thing.x);
	 	// roundedY = Math.round(thing.y);
	 	for(var i = 0; i < thing.width; i++){
		 	for(var j = 0; j < thing.height; j++){
		 		if(collisionGrid[i + thing.x] && collisionGrid[i + thing.x][j + thing.y]){
		 			collisionGrid[i + thing.x][j + thing.y].collision = true;
		 		}
		 	}
	 	}
	 };

	 var clearCollision = function(x, y, width, height){
	 	for(var i = 0; i < width; i++){
		 	for(var j = 0; j < height; j++){
		 		if(collisionGrid[i + x] && collisionGrid[i + x][j + y]){
		 			collisionGrid[i + x][j + y].collision = false;
		 		}
		 	}
	 	}
	 };

	 var ground = function(x, y, width, height){
	 	y = Math.ceil(y);
	 	while(!checkCollision(x, y + 1, playerWidth, playerHeight)) {
	 		y++;
	 	}
	 	grounded = true;
	 	ySpeed = 0;
	 	return y - 1;
	 };

	 var bonk = function(x, y, width, height){
	 	while(!checkCollision(x, y - 1, playerWidth, playerHeight)) {
	 		y--;
	 	}
	 	ySpeed = 0;
	 	return y;
	 };

	 // var moveX =  function(x, y, width, height){
	 // 	var distance = xSpeed;
		// var backwards = xSpeed > 0 ? -1 : 1;
	 // 	if(checkCollision(x + xSpeed, y, width, height)){	
		//  	while(checkCollision(x + distance + backwards, y, playerWidth, playerHeight)) {
		//  		distance += backwards;
		//  	}
	 // 	}
	 // 	return distance + backwards;
	 // };

	 var hugRight = function(x, y, width, height){
	 	while(!checkCollision(x+1, y, playerWidth, playerHeight)) {
	 		x++;
	 	}
	 	//xSpeed = 0;
	 	return x;
	 };

	 var hugLeft = function(x, y, width, height){
	 	while(!checkCollision(x-1, y, playerWidth, playerHeight)) {
	 		x--;
	 	}
	 	//xSpeed = 0;
	 	return x;
	 };

	 function drawWithCam(thing){
	 	ctx.drawImage(thing.img, thing.x - camera.x, thing.y - camera.y, thing.width, thing.height);
	 }

	 function moveCam(x){
	 	if(x - camera.x > 0.80*canvasWidth) {
	 		if(camera.x + (x - camera.x) - 0.80*canvasWidth <= worldWidth - canvasWidth) 
	 			camera.x += (x - camera.x) - 0.80*canvasWidth;
	 	}
		if(x - camera.x < 0.20*canvasWidth){
			if(camera.x + (x - camera.x) - 0.20*canvasWidth >= 0) 
				camera.x += (x - camera.x) - 0.20*canvasWidth;
		}
		//camera.x = newX - canvasWidth/2;
	 }

	var Thing = function(img, x, y, width, length){
		this.img = img;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = length;
		this.collision = true;
		this.death = false;
	};

	Thing.prototype.render = function(){
		drawWithCam(this);
		//setCollision(this);
	};


	var createThing = function(img, x, y, width, length){
		newThing = new Thing(img, x, y, width, length);
		setCollision(newThing);
		things.push(newThing);
	};

	createThing(blockImg, 655, 420, 50, 40);
	createThing(blockImg, 1300, 520, 50, 40);
	createThing(screamImg, 600, 540, 100, 100);

	canvas.addEventListener('mousedown', function (e) {
		var clickX = e.pageX - this.offsetLeft;
		var clickY = e.pageY - this.offsetTop;
		var width = selectedImg.getAttribute('width');
		var height = selectedImg.getAttribute('height');
        createThing(selectedImg, clickX + camera.x - Math.round(width/2), clickY + camera.y - Math.round(height/2), selectedImg.getAttribute('width'), selectedImg.getAttribute('height'));
        socket.emit('newThing', {img: $('<div>').append($(selectedImg).clone()).html(), x: clickX + camera.x - Math.round(width/2), y: clickY + camera.y - Math.round(height/2), width: selectedImg.getAttribute('width'), height: selectedImg.getAttribute('height')});
    });

	backgroundThing = new Thing(backgroundImg, 0, 0, worldWidth, worldHeight);
	kidThing = new Thing(kidImg, spawnX, spawnY, playerWidth, playerHeight);
	playerThing = new Thing(sprite1Img, spawnX, spawnY, playerWidth, playerHeight);

	 var nextFrame = function(x, y){
	 	var newX = x;
	 	var newY = y;

	 	//gravityCounter++;

	 	//if(gravityCounter >= 10000) gravityCounter = 0;

	 	//take away player collision for collision checks
		//clearCollision(x, y, playerWidth, playerHeight);

	 	//allow player to move left or right
	 	if(controls.right) {
	 		xSpeed += moveSpeed;
	 		playerThing.img = sprite1Img;
	 	}
	 	if(controls.left) {
	 		xSpeed -= moveSpeed;
			playerThing.img = sprite2Img;
	 	}

	 	//if(xSpeed !== 0) newX += moveX(x, y, playerWidth, playerHeight);

	 	newX = x + xSpeed;

	 	if(xSpeed !== 0 && checkCollision(newX, y, playerWidth, playerHeight)) {
	 		if(xSpeed > 0) {
	 			newX = hugRight(x, y, playerWidth, playerHeight);
	 		}
	 		else {
	 			newX = hugLeft(x, y, playerWidth, playerHeight);
	 		}
	 	}

	 	falling = (ySpeed > 0);

		grounded = checkCollision(x, y + 1, playerWidth, playerHeight);
	 	if(falling){	
		 	//check and fix if falling would cause collision
		 	if(checkCollision(newX, y + ySpeed, playerWidth, playerHeight)) {
		 		newY = ground(newX, y, playerWidth, playerHeight);
		 		hasJump = true;
		 		hasDoubleJump = true;
		 		ySpeed = 0;
		 		//console.log('nope');
		 	}
	 		//console.log(ySpeed);
	 	}else{
	 		if(checkCollision(newX, y + ySpeed, playerWidth, playerHeight)) {
	 			newY = bonk(newX, y, playerWidth, playerHeight);
		 		ySpeed = 0;
		 		//console.log('nope');
		 	}
	 	}
	 	if(!grounded) ySpeed += gravity;

	 	newY += ySpeed;

		//sidescrolling
		moveCam(newX);

		//console.log(camera);
		//camera.x = newX - canvasWidth/2;

		playerThing.x = newX;
		playerThing.y = newY;
		//console.log(newY);

	 	ctx.clearRect(0, 0, 960, 640);

	 	drawWithCam(backgroundThing);

	 	things.forEach(function(thing){
	 		thing.render();
	 	});


	 	others.forEach(function(other){
	 		if(other) drawWithCam({img: sprite1Img, x: other.x, y: other.y, width: playerWidth, height: playerHeight});
	 	});

	 	drawWithCam(playerThing);
	 	if(newX !== x || newY !== y) socket.emit('move', {id: socket.id, x: newX, y: newY});
		xSpeed = 0;
	 	setTimeout(nextFrame, 16, newX, newY);
	 };
	 nextFrame(spawnX, spawnY);




	socket.on('connect', function () {
	    console.log('I have made a persistent two-way connection to the server!');
	    console.log(socket.id);

	    socket.on('populate', function(data){
	    	others = JSON.parse(data.others);
	    	for(var i = 0; i< others.length; i++){
        	  if(others[i].id === socket.id) {
           		 others.splice(i, 1);
           		 break;
        	  }
        	}
        	data.things.forEach(function(thing){
        		createThing($(thing.img)[0], thing.x, thing.y, thing.width, thing.height);
        	});
	    });

	    socket.emit('populate');

	    socket.on("newPlayer", function(playerInfo){
	    	others.push({id: playerInfo.id, x: playerInfo.x, y: playerInfo.y});
	    });

	    socket.on('move', function(playerInfo){
	    	for(var i = 0; i < others.length; i++){
	    		if(others[i].id === playerInfo.id) {
			    	others[i].x = playerInfo.x;
			    	others[i].y = playerInfo.y;
			    	break;
	    		}
	    	}
	    });

	    socket.on('newThing', function(thing){
	    	createThing($(thing.img)[0], thing.x, thing.y, thing.width, thing.height);
	    });

	    socket.on('disconnect', function(id){
	    	for(var i = 0; i< others.length; i++){
	    		if(others[i].id === id) {
	    			others.splice(i, 1);
	    			break;
	    		}
	    	}

	    });
	    //send in data
	});
}
