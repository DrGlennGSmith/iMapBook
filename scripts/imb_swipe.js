//Custom Javscript swipe handler

var imb_swipe = function(element, direction, callback){
	
	var xStart;
	var xLoc;
	var xDiff;
	
	var targetDiff = 160;
	
	var startTime;
	var endTime;
	
	var ender;
	
	if (direction === "left") ender = -100;
	else ender = 3000;
	
	function startSwipe(event){
		event.preventDefault();
		xStart = event.changedTouches[0].pageX;
		startTime = event.timeStamp;
		console.log("touch started");
	}
	function swipingLeft(event){
		console.log("swiping");
		xLoc = event.changedTouches[0].pageX;
		endTime = event.timeStamp
		xDiff = xStart - xLoc;
		var timeDiff = endTime - startTime
		if (timeDiff <= 1000 && xDiff >= targetDiff){
			callback.call();
			xStart = ender;
		}
	}
	function swipingRight(event){
		console.log("swiping");
		xLoc = event.changedTouches[0].pageX;
		endTime = event.timeStamp
		xDiff = xStart - xLoc;
		var timeDiff = endTime - startTime
		if (timeDiff <= 1000 && xDiff <= -targetDiff){
			callback.call();
			xStart = ender;
		}
	}
	
	element.addEventListener("touchstart", startSwipe, false);
	if (direction === "left"){
		element.addEventListener("touchend", swipingLeft, false);
	}
	else{
		element.addEventListener("touchend", swipingRight, false);
	}

	
	
}