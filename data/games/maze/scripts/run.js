/**
 * Player Ops V2		John Rooks
 * 
 * Main document for player operations
 * in output of the game generator.
 */

//Scenario constructor
function Scenario()
{
	//Globals
	var GRID_WIDTH = 100;
    var GRID_HEIGHT = 100;
    var canvas;
	var context;
	var viewWidth;
	var viewHeight;
	var pxScaleW;
	var pxScaleH;
	var player = {};
	var characters = [];
	var entities = [];
	var background = {};
	var keypressed = "";
	var ended = false;
	var called = false;
	var tmo;
	
	//Start Scenario Trigger
	this.run = function(callback_success, callback_failure)
	{
		var t = this;
		init();

		tmo = setTimeout(function() {
			t.stop(callback_failure);
		}, 20000);
		
		function loop()
		{
			update();
			
			if (!ended) {
				window.requestAnimationFrame(loop);
			} else {
				t.stop(callback_success);
			}
			
			render();
		}
		
		loop();
	};
	
	this.stop = function(callback)
	{
		clearTimeout(tmo);

		ended = true;
		
		destroy();
		
		var status = {
			player: player
		};
		
		if (!called) {
			callback(status);
		}
		
		called = true;
	};
	
	function destroy() {
		if (canvas.parentElement !== null)
			canvas.parentElement.removeChild(canvas);
	}
	
	//Initialize game
	function init()
	{
		//Set keydown and keyup event handlers
		$("body").on("keydown", function(e)
		{
			keypressed = String.fromCharCode(e.keyCode);
		});
		
		$("body").on("keyup", function(e)
		{
			if (String.fromCharCode(e.keyCode) === keypressed)
			{
				keypressed = "";
			}
		});
		
		//Create canvas instead of loading from it
		canvas = document.createElement("canvas");
		document.getElementById("imb_graphic").appendChild(canvas);
		canvas.setAttribute("id", "gameField");
		canvas.setAttribute("width", document.getElementById("imb_graphic").offsetWidth);
		canvas.setAttribute("height", document.getElementById("imb_graphic").offsetHeight);
		
		//Get context
		context = canvas.getContext("2d");

		//Set view dimensions
		viewWidth = 15; //default: 15
		viewHeight = 9; //default: 9
		
		//Set pxscales
		pxScaleW = canvas.width / viewWidth;
		pxScaleH = canvas.height / viewHeight;
		
		//Better requestAnimationFrame function with browser detection - thank you, Erik Möller
		(function()
		{
		    var lastTime = 0;
		    var vendors = ['ms', 'moz', 'webkit', 'o'];
		    
		    //Try to set window.requestAnimationFrame to correct version
		    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x)
		    {
		        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		        window.cancelRequestAnimationFrame = window[vendors[x]+'CancelRequestAnimationFrame'];
		    }
		    
		    //If requestAnimationFrame isn't set, set it to a timeout function
		    if (!window.requestAnimationFrame)
		    {
		    	window.requestAnimationFrame = function(callback, element)
		        {
		            var currTime = new Date().getTime();
		            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
		            var id = window.setTimeout(function()
		            {
		            	callback(currTime + timeToCall); 
		            }, timeToCall);
		            lastTime = currTime + timeToCall;
		            return id;
		        };
		    }

		    //If cancelAnimmationFrame isn't set, set it to a clearTimeout function
		    if (!window.cancelAnimationFrame)
		    {
		    	window.cancelAnimationFrame = function(id) {
		            clearTimeout(id);
		        };
		    }
		}());
		
		//Initialize player variable
		player = new Player(0, 0, "animated", "data/games/maze/images/sprites.png");
		
		var doc = new XMLHttpRequest();
		doc.open('GET','data/games/maze/data/coordinates.txt', false);
		doc.onreadystatechange = function() {
			var str = doc.responseText;
			var array = str.split(" ");
			
			for (var i=0; i<array.length; i+=2) {
				entities.push(new Entity(parseInt(array[i]), parseInt(array[i+1]), 1, 1, true, "image", "data/games/maze/images/wall.jpg"));
			}
		};
		doc.send();
		
		entities.push(new Entity(10,10,1,1,false,"image","data/games/maze/images/parrot.jpg"));
		
		//Add walls
		entities.push(new Entity(-1, 0, 1, GRID_HEIGHT, true, "none", "")); //Left
		entities.push(new Entity(GRID_WIDTH, 0, 1, GRID_HEIGHT, true, "none", "")); //Right
		entities.push(new Entity(0, -1, GRID_WIDTH, 1, true, "none", "")); //Top
		entities.push(new Entity(0, GRID_HEIGHT, GRID_WIDTH, 1, true, "none", "")); //Bottom
		
		//Initialize background variable
		background = new Background("image", "data/games/maze/images/background.jpg");
	}
	
	//Calculations for movement
	function update()
	{
		//TEST CODE: Check if player is in right spot
		if (player.xc === 10 && player.yc === 10) {
			ended = true;
			return;
		}
		
		/*Select Phase*/
		//Player
		if (player.state.action === "idle")
		{
			playerSelect();
		}
		
		//Characters
		for (var i=0; i<characters.length; i++)
		{
			if (characters[i].state.action === "idle")
			{
				characterSelect(i);
			}
		}
		
		/*Move phase*/
		//Player
		if (player.state.action === "move")
		{
			personMove(player);
		}
		
		//Characters
		for (var i=0; i<characters.length; i++)
		{
			if (characters[i].state.action === "move")
			{
				personMove(characters[i]);
			}
		}
	}
	
	//Select phase calculations for the player
	function playerSelect()
	{
		//State has already been checked as idle, allow stuff
		switch(keypressed.toLowerCase())
		{
		case "w":
		case "&":
			player.state.direction = "up";
			if (checkCollisions(player, "up") === false)
			{
				setSelect(player, "up");
				player.yc--;
			}
			break;
		case "s":
		case "(":
			player.state.direction = "down";
			if (checkCollisions(player, "down") === false)
			{
				setSelect(player, "down");
				player.yc++;
			}
			break;
		case "a":
		case "%":
			player.state.direction = "left";
			if (checkCollisions(player, "left") === false)
			{
				setSelect(player, "left");
				player.xc--;
			}
			break;
		case "d":
		case "'":
			player.state.direction = "right";
			if (checkCollisions(player, "right") === false)
			{
				setSelect(player, "right");
				player.xc++;
			}
			break;
		default:
			break;
		}
	}
	
	//Select phase calculations for characters
	function characterSelect()
	{
		//This is a stub for now. I don't want to handle character AI unless I need to.
	}
	
	//Check for collisions
	function checkCollisions(person, direction)
	{
		var xc = person.xc;
		var yc = person.yc;
		
		//Check above
		if (direction === "up")
		{
			if (xc === player.xc && yc-1 === player.yc)
			{
				return player;
			}
			for (var i=0; i<characters.length; i++)
			{
				if (characters[i].collision && xc === characters[i].xc && yc-1 === characters[i].yc)
				{
					return characters[i];
				}
			}
			for (var i=0; i<entities.length; i++)
			{
				if ((xc >= entities[i].xc && xc < entities[i].xc+entities[i].width) && (yc-1 < entities[i].yc+entities[i].height && yc-1 >= entities[i].yc && entities[i].collision))
				{
					return entities[i];
				}
			}
		}
		
		//Below
		else if (direction === "down")
		{
			if (xc === player.xc && yc+1 === player.yc)
			{
				return player;
			}
			for (var i=0; i<characters.length; i++)
			{
				if (characters[i].collision && xc === characters[i].xc && yc+1 === characters[i].yc)
				{
					return characters[i];
				}
			}
			for (var i=0; i<entities.length; i++)
			{
				if ((xc >= entities[i].xc && xc < entities[i].xc+entities[i].width) && (yc+1 < entities[i].yc+entities[i].height && yc+1 >= entities[i].yc && entities[i].collision))
				{
					return entities[i];
				}
			}
		}
		
		//Left
		else if (direction === "left")
		{
			if (xc-1 === player.xc && yc === player.yc)
			{
				return player;
			}
			for (var i=0; i<characters.length; i++)
			{
				if (characters[i].collision && xc-1 === characters[i].xc && yc === characters[i].yc)
				{
					return characters[i];
				}
			}
			for (var i=0; i<entities.length; i++)
			{
				if ((yc >= entities[i].yc && yc < entities[i].yc+entities[i].height) && (xc-1 < entities[i].xc+entities[i].width && xc-1 >= entities[i].xc && entities[i].collision))
				{
					return entities[i];
				}
			}
		}
		
		//Right
		else if (direction === "right")
		{
			if (xc+1 === player.xc && yc === player.yc)
			{
				return player;
			}
			for (var i=0; i<characters.length; i++)
			{
				if (characters[i].collision && xc+1 === characters[i].xc && yc === characters[i].yc)
				{
					return characters[i];
				}
			}
			for (var i=0; i<entities.length; i++)
			{
				if ((yc >= entities[i].yc && yc < entities[i].yc+entities[i].height) && (xc+1 < entities[i].xc+entities[i].width && xc+1 >= entities[i].xc && entities[i].collision))
				{
					return entities[i];
				}
			}
		}
		
		return false;
	}
	
	//Set selections for player or characters.
	function setSelect(person)
	{
		person.state.action = "move";
		person.state.step++;
	}
	
	//Move phase calculations for player or character
	function personMove(person)
	{
		//Essentially need to take 10 frames per move, so it's pxScale/10 per frame for each grid block
		switch(person.state.direction)
		{
		case("up"):
			person.y -= pxScaleH/10;
			personCheckReset(person);
			break;
		case("down"):
			person.y += pxScaleH/10;
			personCheckReset(person);
			break;
		case("left"):
			person.x -= pxScaleW/10;
			personCheckReset(person);
			break;
		case ("right"):
			person.x += pxScaleW/10;
			personCheckReset(person);
			break;
		}
	}
	
	//Runs the checks to see if the player is done moving and if so rounds them to the correct spot.
	function personCheckReset(person) {
		person.state.frame++;
		if (person.state.frame === 10) {
			person.state.frame = 0;
			person.state.action = "idle";
			person.x = person.xc * pxScaleW;
			person.y = person.yc * pxScaleH;
		}
		else if (person.state.frame === 6) {
			person.state.step = (person.state.step === 3) ? 0 : 2;
		}
	}
	
	//Render objects onto the canvas
	function render()
	{
		//Set up canvas
		resetCanvas();
		
		//Draw background
		drawBackground();
		
		//Draw entities
		drawEntities();
		
		//Draw characters and player
		drawPeople();
	}
	
	//Canvas reset and transform set
	function resetCanvas()
	{
		var xtransform;
		var ytransform;
		
		//Reset transformation
		context.setTransform(1, 0, 0, 1, 0, 0);
		
		//Clear the canvas
		context.clearRect(0, 0, canvas.width, canvas.height);
		
		//Transform to follow the player
		//Horizontal
		if (player.x < Math.floor(viewWidth/2)*pxScaleW) {
			xtransform = 0;
		}
		else if (player.x > Math.floor(GRID_WIDTH-viewWidth/2)*pxScaleW) {
			xtransform = -(GRID_WIDTH-viewWidth)*pxScaleW;
		}
		else {
			xtransform = Math.floor(viewWidth/2)*pxScaleW-player.x;
		}
		
		//Vertical
		if (player.y < Math.floor(viewHeight/2)*pxScaleH) {
			ytransform = 0;
		}
		else if (player.y > Math.floor(GRID_HEIGHT-viewHeight/2)*pxScaleH) {
			ytransform = -(GRID_HEIGHT-viewHeight)*pxScaleH;
		}
		else {
			ytransform = Math.floor(viewHeight/2)*pxScaleH-player.y;
		}
		
		//Transform for drawing players and other things
		context.transform(1, 0, 0, 1, xtransform, ytransform);
	}
	
	//Draw background based on type
	function drawBackground()
	{
		if (background.type === "color")
		{
			context.fillStyle = background.color;
			context.fillRect(0, 0, GRID_WIDTH*pxScaleW, GRID_HEIGHT*pxScaleH);
		}
		else if (background.type === "image") {
			context.drawImage(background.image, 0, 0, GRID_WIDTH*pxScaleW, GRID_HEIGHT*pxScaleH);
		}
		
	}
	
	//Draw entities based on type
	function drawEntities()
	{
		for (var i=0; i<entities.length; i++)
		{
			drawObject(entities[i]);
		}
	}
	
	//Draw objects
	function drawObject(object)
	{
		if (object.render.type === "colorBox")
		{
			context.fillStyle = object.render.color;
			context.fillRect(object.x, object.y, pxScaleW*object.width, pxScaleH*object.height);
		}
		
		else if (object.render.type === "image")
		{
			context.drawImage(object.render.image, object.x, object.y, pxScaleW*object.width, pxScaleH*object.height);
		}
	}
	
	//Draw characters based on type
	function drawPeople()
	{
		var belowPlayer = [];
		
		//Draw the characters above player first
		for (var i=0; i<characters.length; i++)
		{
			if (characters[i].y < player.y)
			{
				drawPerson(characters[i]);
			}
			
			else
			{
				belowPlayer.push(characters[i]);
			}
		}
		
		//Draw the player
		drawPerson(player);
		
		//Draw the rest of the characters
		for (var i=0; i<belowPlayer.length; i++)
		{
			drawPerson(belowPlayer[i]);
		}
	}
	
	//Draw a single person
	function drawPerson(person)
	{
		//Solid color box render type
		if (person.render.type === "colorBox")
		{
			context.fillStyle = person.render.color;
			context.fillRect(person.x, person.y, pxScaleW, pxScaleH);
		}
		
		//Static image
		else if (person.render.type === "static")
		{
			context.drawImage(person.render.image, person.x, person.y, pxScaleW, pxScaleH);
		}
		
		//Image changes based on direction. ORDER: Up, down, left, right
		else if (person.render.type === "directional")
		{
			var sx = 5;
			
			//Select section of image based on direction
			switch(person.state.direction)
			{
			case "down":
				sx += 50;
				break;
			case "left":
				sx += 100;
				break;
			case "right":
				sx += 150;
				break;
			}
			
			//Parameters: Image, cut away first x pixels, cut away first y, pixels to draw from (x, y), where to draw, size
			context.drawImage(person.render.image, sx, 5, 32, 32, person.x, person.y, pxScaleW, pxScaleH);
		}
		
		//Image animates
		else if (person.render.type === "animated")
		{
			var sx = 0;
			var sy = 0;
			
			//Select area of image based on direction
			switch(person.state.direction)
			{
			case "left":
				sx += 48;
				break;
			case "up":
				sx += 96;
				break;
			case "right":
				sx += 144;
				break;
			}
			
			//Go down based on step
			sy += 48*person.state.step;

			//Draw the image
			context.drawImage(person.render.image, sx, sy, 48, 48, person.x, person.y, pxScaleW, pxScaleH);
		}
	}
	
	/**Object constructors**/
	function Player(xc, yc, renderType, imageData)
	{
		//Positioning data
		this.x = xc*pxScaleW;
		this.xc = xc;
		this.y = yc*pxScaleH;
		this.yc = yc;
		
		//State information
		this.state = {
			action: "idle",
			direction: "down",
			frame: 0,
			step: 0
		};
		
		//Rendering information
		this.render = {
			type: renderType
		};
		
		if (renderType === "colorBox")
		{
			this.render.color = imageData;
		}
		
		else if (renderType === "static" || renderType === "directional" || renderType === "animated")
		{
			this.render.image = new Image();
			this.render.image.src = imageData;
		}
	}
	
	function Character(xc, yc, collision, ai, renderType, imageData)
	{
		//Positioning data
		this.x = xc*pxScaleW;
		this.xc = xc;
		this.y = yc*pxScaleH;
		this.yc = yc;
		
		//Collision enabled?
		this.collision = collision;
		
		//State information
		this.state = {
			action: "idle",
			direction: "down",
			frame: 0,
			step: 0
		};
		this.ai = ai;
		
		//Rendering information
		this.render = {
			type: renderType
		};
		
		if (renderType === "colorBox")
		{
			this.render.color = imageData;
		}
		
		else if (renderType === "static" || renderType === "directional" || renderType === "animated")
		{
			this.render.image = new Image();
			this.render.image.src = imageData;
		}
	}
	
	function Entity(xc, yc, width, height, collision, renderType, imageData)
	{
		//Positioning data
		this.x = xc*pxScaleW;
		this.xc = xc;
		this.y = yc*pxScaleH;
		this.yc = yc;
		this.width = width;
		this.height = height;
		
		//Collision enabled
		this.collision = collision;
		
		//Render information
		this.render = {
			type: renderType
		};
		
		if (renderType === "colorBox")
		{
			this.render.color = imageData;
		}
		
		else
		{
			this.render.image = new Image();
			this.render.image.src = imageData;
		}
	}
	
	function Background(type, imageData)
	{
		this.type = type;
		
		//Solid color
		if (type === "color")
		{
			this.color = imageData;
		}
		
		//Image background
		if (type === "image" || type === "stretch" || type === "fit" || type === "tile" || type === "parallax")
		{
			this.image = new Image();
			this.image.src = imageData;
		}
	}
}