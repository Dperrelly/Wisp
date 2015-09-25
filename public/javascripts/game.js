function game(ctx, canvas){

	var socket = io(window.location.origin),
	canvasWidth = 960,
	canvasHeight = 640,
	worldWidth = 1500,
	worldHeight = 640,
	playerWidth = 22,
	playerHeight = 30,
	xSpeed = 0,
	ySpeed = 0,
	camera = {x: 0, y: 0},
	jumping = false,
	moveSpeed = 5,
	jumpStrength = 12,
	gravity = 0.6,
	hasJump = false,
	hasDoubleJump = false,
	grounded = false,
	falling = false,
	rising = false,
	spawnX = 70,
	spawnY = 384,
	friendSpawn = {x: 1, y: worldHeight - playerHeight},
	others = [],
	things = [],
	spikes = [],
	AIs = [],
	dead = false,
	movingLeft = false,
	movingRight = false,
	sprite = 1,
	playing = true,
	spriteMap = {
		1: sprite1Img,
		2: sprite2Img,
		kidImg: $('<img id="kid" src="/images/guy.png">')[0],
    	screamImg: $('<img id="scream" src="/images/box.png">')[0],
    	blockImg: $('<img id="block" src="/images/block.png">')[0],
    	backgroundImg: $('<img id="background" src="/images/background.png">')[0],
    	spikeImg: $('<img id="spike" src="/images/spike.png" width="50" height="70">')[0],
   		sprite1Img: $('<img id="sprite1" src="/images/sprite1.png">')[0],
   		sprite2Img: $('<img id="sprite2" src="/images/sprite2.png">')[0],
	};

	//initialize controls
	var controls = {
		left: false,
		right: false,
		up: false,
		down: false,
		d:false
	};

	var jump = function(){
		if(hasJump && !falling){
			$("#jump").prop("currentTime", 0);
			$("#jump").trigger('play');
		 	jumping = true;
		 	ySpeed = -jumpStrength;
		 	hasJump = false;
		}else if(hasDoubleJump && !jumping){
			$("#doublejump").prop("currentTime", 0);
			$("#doublejump").trigger('play');
			jumping = true;
			ySpeed = jumpStrength/-1.3;
			hasDoubleJump = false;
		}
	 };

	 var releaseJump = function(){
	 	if(!falling){
	 		ySpeed /= 2;
	 	}
	 	jumping = false;
	 };

	//prevent arrow key scrolling
	window.addEventListener("keydown", function(e) {
	    // shift and arrow keys
	    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
	        e.preventDefault();
	    }
	}, false);

	//determine state of keypresses
	$(document).keydown(function(event){
	
		var keycode = (event.keyCode ? event.keyCode : event.which);
		if(keycode === 37) {
			controls.left = true;
			if(!movingLeft){
				movingLeft = true;
				xSpeed -= moveSpeed;
				player.img = sprite2Img;
				sprite = 2;
			}
		}
		if(keycode === 38 || keycode === 16 || keycode === 32) {
			controls.up = true;
			jump();
		}
		if(keycode === 39) {
			controls.right = true;
			if(!movingRight) {
				movingRight = true;
				xSpeed += moveSpeed;
		 		player.img = sprite1Img;
		 		sprite = 1;
		 	}
		}
		if(keycode === 40) controls.down = true;
		if(keycode === 68) controls.d = true;
	});
	$(document).keyup(function(event){
	
		var keycode = (event.keyCode ? event.keyCode : event.which);
		if(keycode === 37) {
			controls.left = false;
			if(movingLeft) {
				movingLeft = false;
				xSpeed += moveSpeed;
			}
		}
		if(keycode === 38 || keycode === 16 || keycode === 32) {
			controls.up = false;
			releaseJump();
		}
		if(keycode === 39) {
			controls.right = false;
			if(movingRight) {
				movingRight = false;
				xSpeed -= moveSpeed;
			}
		}
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
	 				return true;
	 			}
	 			if(collisionGrid[i + x][j + y].collision) {
	 				//console.log('hit a collision! : ' + x + ' ' + y + ' ' + i + ' ' + j);
	 				return true;
	 			}
	 		}
	 	}
	 	return false;
	 };

	 var setCollision = function(thing){
	 	roundedX = Math.round(thing.x);
	 	roundedY = Math.round(thing.y);
	 	for(var i = 0; i < thing.width; i++){
		 	for(var j = 0; j < thing.height; j++){
		 		if(collisionGrid[i + roundedX] && collisionGrid[i + roundedX][j + roundedY]){
		 			collisionGrid[i + roundedX][j + roundedY].collision = true;
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

	 var countdown = function(time){
	 	$('#respawn').show();
	 	$('#respawn-time').html(time);
	 	if(time === 0) $('#respawn').hide();
	 	else setTimeout(countdown, 1000, time-1);
	 };

	 var die = function(){
	 	dead = true;
	 	player.x = -500;
		player.y = -1000;
		countdown(5);
		setTimeout(function(){
			player.x = spawnX;
			player.y = spawnY;
		}, 5000);
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

	 var ground = function(x, y, width, height){
	 	y = Math.floor(y);
	 	while(!checkCollision(x, y + 1, playerWidth, playerHeight)) {
	 		y++;
	 	}
	 	if(checkCollision(x, y, playerWidth, playerHeight)){
	 		while(checkCollision(x, y, playerWidth, playerHeight)) {
		 		y--;
		 	}
	 	}
	 	hasJump = true;
		hasDoubleJump = true;
	 	grounded = true;
	 	ySpeed = 0;
	 	return y;
	 };

	 var drawCollisionGrid = function(){
	 	for(var k = 0; k < worldWidth; k++){
		 	for(var j = 0; j < worldHeight; j++){
		 		//give border collision
		 		// if(k === 0 || k === canvasWidth - 1 || j === 0 || j === canvasHeight - 1){
		 		// 	row.push({collision:true, death: false});
		 		// }
		 		if(collisionGrid[k][j].death){
		 			ctx.fillStyle = "#000000";
		 		}
		 		else if(collisionGrid[k][j].collision) {
		 			ctx.fillStyle = "#FF0000";
		 		}
		 		else ctx.fillStyle = "#FFFFFF";
				ctx.fillRect(k - camera.x, j - camera.y, 1, 1);
		 	}
	 }
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

	 var hugRight = function(x, y, width, height){
	 	while(!checkCollision(x+1, y, playerWidth, playerHeight)) {
	 		x++;
	 	}
	 	return x;
	 };

	 var hugLeft = function(x, y, width, height){
	 	while(!checkCollision(x-1, y, playerWidth, playerHeight)) {
	 		x--;
	 	}
	 	return x;
	 };

	 function drawWithCam(thing){
	 	var img = typeof thing.img === 'string' ? spriteMap[thing.img] : thing.img;
	 	ctx.drawImage(img, thing.x - camera.x, thing.y - camera.y, thing.width, thing.height);
	 }

	 function moveCam(x, y){
	 	if(x - camera.x > 0.80*canvasWidth) {
	 		if(camera.x + (x - camera.x) - 0.80*canvasWidth <= worldWidth - canvasWidth) 
	 			camera.x += (x - camera.x) - 0.80*canvasWidth;
	 	}
		if(x - camera.x < 0.20*canvasWidth){
			if(camera.x + (x - camera.x) - 0.20*canvasWidth >= 0) 
				camera.x += (x - camera.x) - 0.20*canvasWidth;
		}
	 }

	var Thing = function(img, x, y, width, length){
		this.img = img;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = length;
	};

	Thing.prototype.render = function(){
		drawWithCam(this);
	};


	var createThing = function(img, x, y, width, length){
		newThing = new Thing(img, x, y, Number(width), Number(length));
		setCollision(newThing);
		things.push(newThing);
	};


	// createSpike(spikeImg, 810, 570);
	// createSpike(spikeImg, 860, 570);
	// createSpike(spikeImg, 910, 570);
	// createSpike(spikeImg, 960, 570);
	// createThing('screamImg', 600, 540, 100, 100);
	// createThing('blockImg', 58, 498, 50, 40);
	// createThing('blockImg', 455, worldHeight - 493, 50, 40);
	// createThing('blockImg', 655, 420, 50, 40);


	var deleteStuff = function(clickX, clickY){

		AIs.forEach(function(ai){
			ai.postMessage({
				deleteThing: {
					x: clickX,
					y: clickY,
				}
			});
		});

		for(var i = things.length - 1; i >=0; i--) {
			if(clickX > things[i].x && clickX < things[i].x + Number(things[i].width) &&
			clickY > things[i].y && clickY < things[i].y + Number(things[i].height)){
				things.splice(i, 1);
			}
		}
		for(i = spikes.length - 1; i >=0; i--) {
			if(clickX > spikes[i].x && clickX < spikes[i].x + Number(spikes[i].width) &&
			clickY > spikes[i].y && clickY < spikes[i].y + Number(spikes[i].height)){
				spikes.splice(i, 1);
			}
		}
		resetCollision();
	};

	canvas.addEventListener('mousedown', function (e) {
		var clickX = e.x - this.offsetLeft - Math.round(canvas.getBoundingClientRect().left);
		var clickY = e.y - this.offsetTop - Math.round(canvas.getBoundingClientRect().top);
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
			socket.emit('delete', {clickX: clickX + camera.x, clickY: clickY + camera.y});
			deleteStuff(clickX + camera.x, clickY + camera.y);
		}
    });

	backgroundThing = new Thing(backgroundImg, 0, 0, worldWidth, worldHeight);
	kidThing = new Thing(kidImg, spawnX, spawnY, playerWidth, playerHeight);
	player = new Thing(sprite1Img, spawnX, spawnY, playerWidth, playerHeight);

	 var nextFrame = function(){
	 	//var start = new Date();
	 	if(playing){

		 	var newX = player.x;
		 	var newY = player.y;

		 	//take away player collision for collision checks
			//clearCollision(x, y, playerWidth, playerHeight);

		 	//allow player to move left or right
		 	// if(controls.right) {
		 	// 	xSpeed += moveSpeed;
		 	// 	player.img = sprite1Img;
		 	// 	sprite = 1;
		 	// }
		 	// if(controls.left) {
		 	// 	xSpeed -= moveSpeed;
				// player.img = sprite2Img;
				// sprite = 2;
		 	// }

		 	//if(xSpeed !== 0) newX += moveX(x, y, playerWidth, playerHeight);

		 	newX = player.x + xSpeed;

		 	if(xSpeed !== 0 && checkCollision(newX, player.y, playerWidth, playerHeight)) {
		 		if(xSpeed > 0) {
		 			newX = hugRight(player.x, player.y, playerWidth, playerHeight);
		 		}
		 		else {
		 			newX = hugLeft(player.x, player.y, playerWidth, playerHeight);
		 		}
		 	}

		 	falling = (ySpeed > 0);
		 	rising = (ySpeed < 0);


			grounded = checkCollision(player.x, player.y + 1, playerWidth, playerHeight);
		 	if(falling){	
			 	//check and fix if falling would cause collision
			 	if(checkCollision(newX, player.y + ySpeed, playerWidth, playerHeight)) {
			 		newY = ground(newX, player.y, playerWidth, playerHeight);
			 		//console.log('nope');
			 	}
		 		//console.log(ySpeed);
		 	}else if(rising){
		 		if(checkCollision(newX, player.y + ySpeed, playerWidth, playerHeight)) {
		 			newY = bonk(newX, player.y, playerWidth, playerHeight);
			 		//console.log('nope');
			 	}
		 	}
		 	if(!grounded) {
		 		ySpeed += gravity;
		 	}
		 	newY += ySpeed;

			//camera.x = newX - canvasWidth/2;

			player.x = newX;
			player.y = newY;
	 	}

		//sidescrolling
		moveCam(player.x);

	 	ctx.clearRect(0, 0, 960, 640);

	 	drawWithCam(backgroundThing);

	 	things.forEach(function(thing){
	 		thing.render();
	 	});

	 	spikes.forEach(function(spike){
	 		drawWithCam(spike);
	 	});


	 	others.forEach(function(other){
	 		if(other) drawWithCam({img: spriteMap[other.sprite], x: other.x, y: other.y, width: playerWidth, height: playerHeight});
	 	});

	 	drawWithCam(player);
	 	if(newX !== player.x || newY !== player.y) socket.emit('move', {sprite: sprite,id: socket.id, x: newX, y: newY});
		//xSpeed = 0;
		if(checkDeath(newX, newY)){
			die();
		}
		FPS_Counter++;
		requestAnimationFrame(nextFrame);
	 	//setTimeout(nextFrame, 16 - (new Date() - start));
	 	//drawCollisionGrid();
	 };
	var FPS_Counter = 0;
	nextFrame();
	//drawCollisionGrid();
	setInterval(function(){
		$('#FPS-time').html(FPS_Counter);
		FPS_Counter = 0;
	}, 1000);
	




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
	});

	auto = function(){
		if(playing){
			playing = false;

			var ai = new Worker('/javascripts/AI.js');

			ai.postMessage({
				player: {
					x: player.x,
					y: player.y
				},
				things: things.map(function(thing){
					return {
						x: thing.x,
						y: thing.y,
						width: thing.width,
						height: thing.height
					};
				})
			});

			ai.addEventListener('message', function(e){
				if(e.data.x < player.x) {
					player.img = sprite2Img;
					sprite = 2;
				}
				if(e.data.x > player.x) {
					player.img = sprite1Img;
					sprite = 1;
				}
				player.x = e.data.x;
				player.y = e.data.y;
			});
		}
	};

	var friend = function(){

			var ai = new Worker('/javascripts/AI.js');

			var playerNumber = others.length;

			others.push({sprite: 1, x: -5000, y: -5000});

			ai.postMessage({
				player: {
					x: player.x,
					y: player.y
				},
				things: things.map(function(thing){
					return {
						x: thing.x,
						y: thing.y,
						width: thing.width,
						height: thing.height
					};
				})
			});

			ai.addEventListener('message', function(e){
				if(e.data.x < others[playerNumber].x) {
					others[playerNumber].sprite = '2';
				}
				if(e.data.x > others[playerNumber].x) {
					others[playerNumber].sprite = '1';
				}
				others[playerNumber].x = e.data.x;
				others[playerNumber].y = e.data.y;
			});

			AIs.push(ai);
	};

	$('.friend').click(friend);
	$('.auto').click(auto);

	$('.loading-container').hide();
	$('.post-load').show();
}
