function game(ctx, i, canvas){
	

	var canvasWidth = 960;
	var canvasHeight = 640;
	var playerWidth = 22;
	var playerHeight = 30;

	//initialize controls
	var controls = {
		left: false,
		right: false,
		up: false,
		down: false
	};

	//set movespeed
	var moveSpeed = 5;
	var jumpStrength = 30;
	var gravity = 0;
	var hasJump = true;
	var jumping = false;

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
		if(keycode === 38) controls.up = true;
		if(keycode === 39) controls.right = true;
		if(keycode === 40) controls.down = true;
	});
	$(document).keyup(function(event){
	
		var keycode = (event.keyCode ? event.keyCode : event.which);
		if(keycode === 37) controls.left = false;
		if(keycode === 38) controls.up = false;
		if(keycode === 39) controls.right = false;
		if(keycode === 40) controls.down = false;	
	});

	 //initialize collision grid
	 var collisionGrid = [];
	 for(var k = 0; k < canvasWidth; k++){
	 	var row = [];
	 	for(var j = 0; j < canvasHeight; j++){
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
	 				return true;
	 			}
	 		}
	 	}
	 	return false;
	 };

	 var setCollision = function(x, y, width, height){
	 	for(var i = 0; i < width; i++){
		 	for(var j = 0; j < height; j++){
		 		if(collisionGrid[i + x] && collisionGrid[i + x][j + y]){
		 			collisionGrid[i + x][j + y].collision = true;
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
	 	while(!checkCollision(x, y + 1, playerWidth, playerHeight)) {
	 		y++;
	 	}
	 	return y;
	 };

	 var nextFrame = function(x, y){
	 	var newX = x;
	 	var newY = y;
		clearCollision(x, y, playerWidth, playerHeight);
	 	var grounded = checkCollision(x, y + 1, playerWidth, playerHeight);
	 	var falling = gravity > jumpStrength;
	 	//console.log(falling);
	 	if(checkCollision(x, y + gravity, playerWidth, playerHeight)) {
	 		if(grounded) gravity = 0;
	 		newY = ground(x, y, playerWidth, playerHeight);
	 	}
	 	else {
	 		newY += gravity;
	 		if(gravity < 20)gravity++;
	 	}
	 	if(controls.left) {
	 		newX -= moveSpeed;
	 	}
	 	//console.log(controls.up);
	 	if(jumping){
	 		if(controls.up && !falling){
	 			newY -= jumpStrength;
	 		}
	 		if(grounded) {
	 			jumping = false;
	 			hasJump = true;
	 			//console.log('jump restored!');
	 		}
	 	}
	 	if(controls.up && hasJump) {
	 		hasJump = false;
	 		newY -= jumpStrength;
	 		jumping = true;
	 	}
	 	if(controls.right) {
	 		newX += moveSpeed;
	 	}
	 	// if(controls.down) {
	 	// 	newY += moveSpeed;
	 	// }
	 	if(newY !== y || newX !== x){
	 		if(checkCollision(newX, newY, playerWidth, playerHeight)){
	 			//newY = y;
	 			newX = x;
	 		}
	 	}
		setCollision(newX, newY, playerWidth, playerHeight);
	 	ctx.clearRect(0, 0, 960, 640);
	 	ctx.drawImage(backgroundImg, 0, 0, canvasWidth, canvasHeight);
	 	ctx.drawImage(screamImg, 200, 260, 200, 380);
	 	setCollision(200, 260, 200, 380);
	 	ctx.drawImage(screamImg, 600, 540, 100, 100);
	 	setCollision(600, 540, 100, 100);
	 	// ctx.drawImage(jess2Img, 200, 260, 200, 380);
	 	// setCollision(200, 260, 200, 380);
	 	// ctx.drawImage(jessImg, 600, 540, 100, 100);
	 	// setCollision(600, 540, 100, 100);
	 	ctx.drawImage(kidImg, newX, newY, playerWidth, playerHeight);

	 	setTimeout(nextFrame, 33, newX, newY);
	 };
	 nextFrame(10, 10);
}