function Scenario() {
	this.run = function(callback_success, callback_failure) {
		//Add the game workspace
		$("#imb_graphic").append('<iframe src="data/games/PH_NAME/story_html5.html" id="c2game" style="width:100%; height:100%; border:0;"></iframe>');
		$("#c2game")[0].contentWindow.game_success = callback_success;
		$("#c2game")[0].contentWindow.game_failure = callback_failure;
	};

	this.stop = function(callback) {
		$("#imb_graphic").empty();

		if (typeof callback != "undefined")
			callback();
	};
}
