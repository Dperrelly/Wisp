function game(ctx, canvas){

	var socket = io(window.location.origin);

	var canvasWidth = 960;
	var canvasHeight = 640;
	var worldWidth = 1500;
	var worldHeight = 640;
	var playerWidth = 22;
	var playerHeight = 30;
	var hitWidth = 20;
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
	var spawnX = 70;
	var spawnY = 384;
	var others = [];
	var things = [];
	var spikes = [];
	var sprite = 1;
	var spriteMap = {
		1: sprite1Img,
		2: sprite2Img
	};
	//var facing = 'right';

	function direction(){
		Math.atan2(xSpeed, ySpeed);
	}

	//initialize controls
	var controls = {
		left: false,
		right: false,
		up: false,
		down: false,
		d:false
	};

	var jump = function(){
		if(hasJump){
			$("#jump").prop("currentTime", 0);
			$("#jump").trigger('play');
		 	jumping = true;
		 	ySpeed -= jumpStrength;
		 	hasJump = false;
		}else if(hasDoubleJump && !jumping){
			$("#doublejump").prop("currentTime", 0);
			$("#doublejump").trigger('play');
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
		if(keycode === 68) controls.d = true;
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
		if(keycode === 68) controls.d = false;	
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

	 var resetCollision = function(){
	 	for(var k = 0; k < worldWidth; k++){
		 	for(var j = 0; j < worldHeight; j++){
		 		collisionGrid[k][j] = {collision: false, death: false};
		 	}
	 	}
	 	things.forEach(function(thing){
	 		setCollision(thing);
	 	});
	 	spikes.forEach(function(spike){
		 	var slope = 2 * spike.height / spike.width;
		 	for(var i = 0; i < spike.width; i++){
			 	for(var j = spike.height - 1; j >= 0; j--){
			 		if(collisionGrid[i + spike.x] && collisionGrid[i + spike.x][j + spike.y] &&
			 		spike.height - j <= slope * i && 
			 		j >= slope*(i - spike.width/2)
			 		){
			 			collisionGrid[i + spike.x][j + spike.y].death = true;
			 		}
			 	}
		 	}
	 	});
	 };

	 var ground = function(x, y, width, height){
	 	y = Math.ceil(y);
	 	while(!checkCollision(x, y + 1, playerWidth, playerHeight)) {
	 		y++;
	 	}
	 	hasJump = true;
		hasDoubleJump = true;
	 	grounded = true;
	 	ySpeed = 0;
	 	return y - 1;
	 };

	 var bonk = function(x, y, width, height){
	 	if(ySpeed < 0){
		 	while(!checkCollision(x, y - 1, playerWidth, playerHeight)) {
		 		y--;
		 	}
		 	ySpeed = 0;
		 }
	 	return y;
	 };


	 var createSpike = function(img, x, y){
	 	var width = img.getAttribute('width');
	 	var height = img.getAttribute('height');
	 	var slope = 2 * height / width;
	 	for(var i = 0; i < width; i++){
		 	for(var j = height - 1; j >= 0; j--){
		 		if(collisionGrid[i + x] && collisionGrid[i + x][j + y] &&
		 		height - j <= slope * i && 
		 		j >= slope*(i - width/2)
		 		){
		 			collisionGrid[i + x][j + y].death = true;
		 		}
		 	}
	 	}
	 	spikes.push({img: img, x: x, y: y, width: width, height: height});
	 };



	 var checkDeath = function(x, y){
	 	x = Math.round(x);
	 	y = Math.round(y);
	 	for(var i = 0; i < playerWidth; i++){
	 		for(var j = 0; j < playerHeight; j++){
	 			if(collisionGrid[i + x] && collisionGrid[i + x][j + y] && collisionGrid[i + x][j + y].death) {
	 				return true;
	 			}
	 		}
	 	}
	 	return false;
	 };

	 var die = function(){
	 	playerThing.x = 1;
		playerThing.y = 1;
		camera.x = 0;
		camera.y = 0;
		$("#marine").trigger('play');
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


	createSpike(spikeImg, 810, 570);
	createSpike(spikeImg, 860, 570);
	createSpike(spikeImg, 910, 570);
	createSpike(spikeImg, 960, 570);
	createThing(blockImg, 655, 420, 50, 40);
	createThing(blockImg, 58, 498, 50, 40);
	createThing(screamImg, 600, 540, 100, 100);

	var deleteStuff = function(clickX, clickY){
		for(var i = things.length - 1; i >=0; i--) {
			if(clickX > things[i].x && clickX < things[i].x + Number(things[i].width) &&
			clickY > things[i].y && clickY < things[i].y + Number(things[i].height)){
				things.splice(i, 1);
			}
		}
		spikes = spikes.filter(function(spike){
			if(clickX > spike.x && clickX < spike.x + Number(spike.width) &&
			clickY > spike.y && clickY < spike.y + Number(spike.height)){
				return false;
			}
			return true;
		});
		resetCollision();
	};

	canvas.addEventListener('mousedown', function (e) {
		var clickX = e.pageX - this.offsetLeft;
		var clickY = e.pageY - this.offsetTop;
		console.log(clickX, clickY);
		if(!controls.d){
			var width = selectedImg.getAttribute('width');
			var height = selectedImg.getAttribute('height');
			if(selectedImg.getAttribute('class') === 'spike') {
				socket.emit('newSpike', {img: $(selectedImg).prop('outerHTML'), x: clickX + camera.x - Math.round(width/2), y: clickY + camera.y - Math.round(height/2), width: selectedImg.getAttribute('width'), height: selectedImg.getAttribute('height')});
				createSpike(selectedImg, clickX + camera.x - Math.round(width/2), clickY + camera.y - Math.round(height/2));
			}
			else {
		        createThing(selectedImg, clickX + camera.x - Math.round(width/2), clickY + camera.y - Math.round(height/2), selectedImg.getAttribute('width'), selectedImg.getAttribute('height'));
		        socket.emit('newThing', {img: $(selectedImg).prop('outerHTML'), x: clickX + camera.x - Math.round(width/2), y: clickY + camera.y - Math.round(height/2), width: selectedImg.getAttribute('width'), height: selectedImg.getAttribute('height')});	
			}
		}else{
			socket.emit('delete', {clickX: clickX, clickY: clickY});
			deleteStuff(clickX, clickY);
		}
    });

	backgroundThing = new Thing(backgroundImg, 0, 0, worldWidth, worldHeight);
	kidThing = new Thing(kidImg, spawnX, spawnY, playerWidth, playerHeight);
	playerThing = new Thing(sprite1Img, spawnX, spawnY, playerWidth, playerHeight);

	 var nextFrame = function(x, y){
	 	var newX = playerThing.x;
	 	var newY = playerThing.y;

	 	//gravityCounter++;

	 	//if(gravityCounter >= 10000) gravityCounter = 0;

	 	//take away player collision for collision checks
		//clearCollision(x, y, playerWidth, playerHeight);

	 	//allow player to move left or right
	 	if(controls.right) {
	 		xSpeed += moveSpeed;
	 		playerThing.img = sprite1Img;
	 		sprite = 1;
	 	}
	 	if(controls.left) {
	 		xSpeed -= moveSpeed;
			playerThing.img = sprite2Img;
			sprite = 2;
	 	}

	 	//if(xSpeed !== 0) newX += moveX(x, y, playerWidth, playerHeight);

	 	newX = playerThing.x + xSpeed;

	 	if(xSpeed !== 0 && checkCollision(newX, playerThing.y, playerWidth, playerHeight)) {
	 		if(xSpeed > 0) {
	 			newX = hugRight(playerThing.x, playerThing.y, playerWidth, playerHeight);
	 		}
	 		else {
	 			newX = hugLeft(playerThing.x, playerThing.y, playerWidth, playerHeight);
	 		}
	 	}

	 	falling = (ySpeed > 0);

		grounded = checkCollision(playerThing.x, playerThing.y + 1, playerWidth, playerHeight);
	 	if(falling){	
		 	//check and fix if falling would cause collision
		 	if(checkCollision(newX, playerThing.y + ySpeed, playerWidth, playerHeight)) {
		 		newY = ground(newX, playerThing.y, playerWidth, playerHeight);
		 		//console.log('nope');
		 	}
	 		//console.log(ySpeed);
	 	}else{
	 		if(checkCollision(newX, playerThing.y + ySpeed, playerWidth, playerHeight)) {
	 			newY = bonk(newX, playerThing.y, playerWidth, playerHeight);
		 		//console.log('nope');
		 	}
	 	}
	 	if(!grounded) {
	 		ySpeed += gravity;
	 		hasJump = false;
	 	}

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

	 	spikes.forEach(function(spike){
	 		drawWithCam(spike);
	 	});


	 	others.forEach(function(other){
	 		//console.log(spriteMap[other.sprite]);
	 		if(other) drawWithCam({img: spriteMap[other.sprite], x: other.x, y: other.y, width: playerWidth, height: playerHeight});
	 	});

	 	drawWithCam(playerThing);
	 	if(newX !== x || newY !== y) socket.emit('move', {sprite: sprite,id: socket.id, x: newX, y: newY});
		xSpeed = 0;
		if(checkDeath(newX, newY)){
			die();
		}
	 	setTimeout(nextFrame, 16);
	 };
	 nextFrame();




	socket.on('connect', function () {
	    console.log('I have made a persistent two-way connection to the server!');
	    console.log(socket.id);

	    socket.on('populate', function(data){
	    	others = JSON.parse(data.players);
	    	for(var i = 0; i< others.length; i++){
        	  if(others[i].id === socket.id) {
           		 others.splice(i, 1);
           		 break;
        	  }
        	}
        	data.things.forEach(function(thing){
        		createThing($(thing.img)[0], thing.x, thing.y, thing.width, thing.height);
        	});
        	data.spikes.forEach(function(spike){
        		createSpike($(spike.img)[0], spike.x, spike.y);
        	});
	    });

	    socket.emit('populate');

	    socket.on("newPlayer", function(playerInfo){
	    	others.push({sprite: playerInfo.sprite, id: playerInfo.id, x: playerInfo.x, y: playerInfo.y});
	    });

	    socket.on('move', function(playerInfo){
	    	for(var i = 0; i < others.length; i++){
	    		if(others[i].id === playerInfo.id) {
	    			others[i].sprite = playerInfo.sprite;
			    	others[i].x = playerInfo.x;
			    	others[i].y = playerInfo.y;
			    	break;
	    		}
	    	}
	    });

	    socket.on('delete', function(click){
	    	deleteStuff(click.clickX, click.clickY);
	    });

	    socket.on('newThing', function(thing){
	    	createThing($(thing.img)[0], thing.x, thing.y, thing.width, thing.height);
	    });

	    socket.on('newSpike', function(spike){
	    	createSpike($(spike.img)[0], spike.x, spike.y);
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
