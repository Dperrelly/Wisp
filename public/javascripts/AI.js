	// importScripts('/bower_components/jquery/dist/jquery.min.js');

	var alive = true,
	canvasWidth = 960,
	canvasHeight = 640,
	worldWidth = 1500,
	worldHeight = 640,
	playerWidth = 22,
	playerHeight = 30,
	xSpeed = 0,
	ySpeed = 0,
	moveSpeed = 5,
	jumpStrength = 12,
	gravity = 0.6,
	spawnX = 70,
	spawnY = 384,
	others = [],
	things = [],
	spikes = [],
	maxJumpFrames = Math.ceil(jumpStrength / gravity),
	maxDoubleJumpFrames = maxJumpFrames + 
		Math.ceil(jumpStrength/1.3 / gravity),
	maxJumpHeight = (((Math.pow(jumpStrength, 2)) / (2 * gravity)) + (jumpStrength / 2)) +
		(((Math.pow(jumpStrength /1.3, 2)) / (2 * gravity)) + (jumpStrength/1.3 / 2)),
	maxJumpDistance = maxDoubleJumpFrames * moveSpeed,
	movingJumpInitialVelocity = Math.sqrt(moveSpeed*moveSpeed + jumpStrength*jumpStrength),
	movingJumpTheta = Math.acos(moveSpeed / movingJumpInitialVelocity),
	player = {x:1, y:1},
	floorBlock = {x: 0, y: worldHeight, width: worldWidth, height: worldHeight},
	currentBlock = floorBlock,
	lastBlock = null,
	dead = false,
	hasJump = true,
	hasDoubleJump = true,
	grounded = false,
	falling = false,
	rising = false,
	jumping = false,
	movingLeft = false,
	movingRight = false,
	destination = null,
	targetJumpFrames = null,
	jumpFrames = 0,
	doubleJumpFrames = 0,
	jumpCallback = null,
	maxJumping = false,
	idle = false,
	attempedBlock = 0,
	idleCounter = 0;


	// console.log("ddr max", movingJumpTheta);

	//initialize controls
	var controls = {
		left: false,
		right: false,
		up: false,
		down: false,
		d:false
	};

	var jump = function(frameTarget){
		//console.log('jump');
		if(!frameTarget) frameTarget = maxJumpFrames;
		jumpFrames = 0;
		targetJumpFrames = frameTarget;
		if(hasJump && grounded){
		 	jumping = true;
		 	ySpeed -= jumpStrength;
		 	hasJump = false;
		}else if(hasDoubleJump && !jumping){
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
	 	jumpFrames = 0;
	 	targetJumpFrames = null;
	};

	var pressRight = function(){
	 	if(!movingRight) {
			movingRight = true;
			xSpeed += moveSpeed;
		 }
	 };

	var pressLeft = function(){
 		if(!movingLeft){
			movingLeft = true;
			xSpeed -= moveSpeed;
		}
	};

	var stopMoving = function(){
		if(movingLeft) {
			movingLeft = false;
			xSpeed += moveSpeed;
		}
		if(movingRight) {
			movingRight = false;
			xSpeed -= moveSpeed;
		}
		destination = null;
	};

	var maxJump = function(cb){
		jump();
		maxJumping = true;
		if(cb) jumpCallback = cb;
	};

	var walkTo = function(x, cb){
		console.log('trying to walk to', x);
		stopMoving();
		destination = x;
		if(x < player.x) pressLeft();
		if(x > player.x) pressRight();
	};

	var jumpTo = function(x, cb){
		walkTo(x, cb);
		maxJump();
	};

	function straightJump(x){
		maxJump(function(){
			walkTo(x);
		});
	}

	var jumpToBlock = function(block){
		console.log('jumping to', block);
		if(isBlockInRange(currentBlock, block)){
			if(player.x < block.x) {
				jumpTo(block.x);
				console.log('jumping right');
			}
			else {
				jumpTo(block.x + block.width - 1);
				console.log('jumping left');
			}
			currentBlock = block;
		}
		else if( testJump(function(){straightJump(); }, 
					[findCornerX(block)], block) ){
			console.log('straightJump');
			straightJump(findCornerX(block));
		}
		console.log('i cant jump there');
	};

	var underOrOver = function(block){
		if((player.x + playerWidth > block.x) && (player.x < block.x + block.width)) return true;
		else return false;
	};

	var approachBlock = function(block){
		console.log('approaching', block);
		if(block.y > worldHeight - maxJumpHeight){
			if( Math.abs(player.x - findCornerX(block)) < 50 && !underOrOver(block)) {
				console.log('i can do this');
				straightJump(findCornerX(block));
				//attempedBlock++;
				currentBlock = block;	
			}else{
				if(player.x + playerWidth < block.x) {
					walkTo(block.x - moveSpeed);
					console.log('im left');
				}
				else if(player.x > block.x + block.width) {
					walkTo(block.x + moveSpeed + block.width);
					console.log('im right');
				}
				else {
					walkTo(block.x - moveSpeed - playerWidth);
					console.log('im under');
				}
			}
		}
	};

	var think = function(){
		if(things.length){
			console.log('thinking...');
			callback = null;
			destination = null;
			if(worldHeight - player.y === playerHeight) {
				approachBlock(things[attempedBlock]);
				// for(var i = 0; i < things.length; i++){
				// 	if(testJump(approachBlock, [things[0]])){

				// 	}
				// }
			}
			else{
				var inRange = [];
				for(var i=0; i < things.length; i++){
					if(things[i] !== currentBlock && isBlockInRange(currentBlock, things[i])){
						inRange.push(things[i]);
					}
				}
				sortByY(inRange);
				jumpToBlock(inRange[inRange.length - 1]);
			}		
		}
	};

	var edge = function(block){

	};

	var isTargetInRange = function(current, target){
		xDistance = Math.abs(target.x - current.x);
		if(target.y < (target.y + xDistance*Math.tan(movingJumpTheta) - 
			((gravity*xDistance*xDistance) / 
				(2*Math.pow(movingJumpInitialVelocity*Math.cos(movingJumpTheta), 2)))
		)) return true;
		return false;
	};

	var isBlockInRange = function(currentBlock, targetBlock){
		if(!currentBlock){
			currentBlock = {
				x: player.x,
				y: player.y - playerHeight,
				width: 1,
				height: 1
			};
		}
		if(Math.abs(currentBlock.y - targetBlock.y) > maxJumpHeight) return false;
		var currentX;
		var targetBlockX;
		var left = currentBlock.x >= targetBlock.x;
		if(left){
			currentX = currentBlock.x;
			targetBlockX = targetBlock.x  + targetBlock.width - 1;
		}else{
			currentX = currentBlock.x + currentBlock.width - 1;
			targetBlockX = targetBlock.x;
		}
		return isTargetInRange({x: currentX, y:currentBlock.y}, {x: targetBlockX, y: targetBlock.y});
	};


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

	 var die = function(){
	 	dead = true;
	 	player.x = -500;
		player.y = -1000;
		setTimeout(function(){
			player.x = spawnX;
			player.y = spawnY;
		}, 5000);
	 };

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
		 		if(collisionGrid[k][j].death){
		 			ctx.fillStyle = '#000000';
		 		}
		 		else if(collisionGrid[k][j].collision) {
		 			ctx.fillStyle = '#FF0000';
		 		}
		 		else ctx.fillStyle = '#FFFFFF';
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

	var findCornerX = function(block){
		if(player.x < block.x) return block.x;
		else return block.x + block.width - moveSpeed;
	};

	var deleteStuff = function(clickX, clickY){
		for(var i = things.length - 1; i >=0; i--) {
			if(clickX > things[i].x && clickX < things[i].x + Number(things[i].width) &&
			clickY > things[i].y && clickY < things[i].y + Number(things[i].height)){
				things.splice(i, 1);
			}
		}
		resetCollision();
	};

	var testJump = function(func, args, targetBlock){

		var result;
		var simFramesCalculated = 0;

		targetDest = {
			x: findCornerX(targetBlock),
			y: targetBlock.y
		};

		var state = {
			playerX: player.x,
			playerY: player.y,
			dead: dead,
			hasJump: hasJump,
			hasDoubleJump: hasDoubleJump,
			grounded: grounded,
			falling: falling,
			rising: rising,
			jumping: jumping,
			movingLeft: movingLeft,
			movingRight: movingRight,
			destination: destination,
			targetJumpFrames: targetJumpFrames,
			jumpFrames: jumpFrames,
			maxJumping: maxJumping,
			currentBlock: currentBlock
		};

		func.apply(this, args);

		simulation:
		while(true){

			if(player.x < targetDest.x &&
		 	 player.x + playerWidth > targetDest.x &&
		 	 player.y === targetDest.y - playerHeight){
				result = true;
				break simulation;
			}

			if(simFramesCalculated > 1000){
				result = false;
				break simulation;
			}

			simFramesCalculated++;
			
		 	if (player.x < destination &&
		 	 	player.x + playerWidth > destination){
		 			//console.log('arrived');
		 			stopMoving();
		 			//console.log(destination);
		 	}

		 	falling = (ySpeed > 0);
		 	rising = (ySpeed < 0);
		 	grounded = checkCollision(player.x, player.y + 1, playerWidth, playerHeight);

		 	if(rising) {
		 		jumpFrames++;
		 		if(jumpFrames >= targetJumpFrames){
		 			releaseJump();
			 		if(maxJumping){
			 			jump();
			 			maxJumping = false;
			 		}
		 		}
		 	}
		 	var newX = player.x;
		 	var newY = player.y;

		 	//take away player collision for collision checks
			//clearCollision(x, y, playerWidth, playerHeight);

		 	newX = player.x + xSpeed;

		 	if(xSpeed !== 0 && checkCollision(newX, player.y, playerWidth, playerHeight)) {
		 		if(xSpeed > 0) {
		 			newX = hugRight(player.x, player.y, playerWidth, playerHeight);
		 		}
		 		else {
		 			newX = hugLeft(player.x, player.y, playerWidth, playerHeight);
		 		}
		 	}

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

		 	player.x = newX;
			player.y = newY;
		}

		player = {
			x: state.playerX,
			y: state.playerY
		};
		dead = state.dead;
		hasJump = state.hasJump;
		hasDoubleJump = state.hasDoubleJump;
		grounded = state.grounded;
		falling = state.falling;
		rising = state.rising;
		jumping = state.jumping;
		movingLeft = state.movingLeft;
		movingRight = state.movingRight;
		destination = state.destination;
		targetJumpFrames = state.targetJumpFrames;
		jumpFrames = state.jumpFrames;
		maxJumping = state.maxJumping;
		currentBlock = state.currentBlock;
		return result;
	 };

	 var nextFrame = function(){
	 	var start = new Date();

	 	if (player.x < destination &&
	 	 	player.x + playerWidth > destination){
	 			//console.log('arrived');
	 			stopMoving();
	 			if(callback) callback();
	 			//console.log(destination);
	 	}

	 	if(jumpCallback){
	 		doubleJumpFrames++;
	 		if(doubleJumpFrames === maxDoubleJumpFrames){
	 			jumpCallback();
	 			doubleJumpFrames = 0;
	 			jumpCallback = null;
	 		}
	 	}

	 	//console.log(destination, player.x, playerWidth);

	 	// console.log(destination, player.x <= destination, player.x > destination - moveSpeed,
	 	// 		player.x + playerWidth >= destination, player.x + playerWidth < destination + moveSpeed
	 	// 	);

	 	falling = (ySpeed > 0);
	 	rising = (ySpeed < 0);
	 	grounded = checkCollision(player.x, player.y + 1, playerWidth, playerHeight);

	 	if(rising) {
	 		jumpFrames++;
	 		if(jumpFrames >= targetJumpFrames){
	 			releaseJump();
		 		if(maxJumping){
		 			
		 			jump();
		 			maxJumping = false;
		 		}
	 		}
	 	}

	 	//console.log(rising, jumpFrames, targetJumpFrames, maxJumping);
	 	var newX = player.x;
	 	var newY = player.y;

	 	//take away player collision for collision checks
		//clearCollision(x, y, playerWidth, playerHeight);

	 	newX = player.x + xSpeed;

	 	if(xSpeed !== 0 && checkCollision(newX, player.y, playerWidth, playerHeight)) {
	 		if(xSpeed > 0) {
	 			newX = hugRight(player.x, player.y, playerWidth, playerHeight);
	 		}
	 		else {
	 			newX = hugLeft(player.x, player.y, playerWidth, playerHeight);
	 		}
	 	}

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

		if(player.x === newX && player.y === newY && !idle){
			idleCounter++;
			console.log('counting');
			if(idleCounter > 5){
				idle = true;
				think();
			}
		}else{
			idle = false;
			idleCounter = 0;
		}
		self.postMessage({x: player.x, y: player.y});

	 	player.x = newX;
		player.y = newY;


		if(alive) setTimeout(nextFrame, 16 - (new Date() - start));
	 };

	function compareY(a,b) {
		if (a.y > b.y)
			return -1;
		if (a.y < b.y)
			return 1;
		return 0;
	}

	function sortByY(array){
		array.sort(compareY);
	}


	self.addEventListener('message', function(e) {
	  if(e.data.player) {
	  	player = e.data.player;
	  	alive = true;
	  	nextFrame();
	  }
	  if(e.data.things){
	  	things = e.data.things;
	  	sortByY(things);
	  	resetCollision();
	  	// setTimeout(function(){
	  		//console.log(things);
			// console.log(isBlockInRange(things[0], things[1]));
			// console.log(isBlockInRange(things[1], things[2]));
		// }, 1000);
	  }
	  if(e.data.newThing){
	  	var thing = e.data.newThing;
	  	createThing(1, thing.x, thing.y, thing.width, thing.height);
	  }
	  if(e.data.deleteThing){
	  	deleteStuff(e.data.deleteThing.x, e.data.deleteThing.y);
	  }
	  if(e.data.stop){
	  	alive = false;
	  }
	  console.log(e);
	}, false);