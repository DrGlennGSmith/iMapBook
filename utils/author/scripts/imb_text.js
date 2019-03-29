//Book splitter - reload/refresh all text pages from book.txt file
//
// Uses the following base specs:
// Smallest screen: iPad
// Orientation: Landscape (results in most space "wasted" by newline)
// Max lines: 13 @ 122 characters per line
// Max characters: 1590
//*************************
var MAX_CHARACTERS = 1590;
var ROW_AVERAGE_CHARACTERS = 122;

//Takes a string
//Returns an array
//Array values alternate between chapter titles and chapter text
function splitChapters(text) {
	var chapters = [];
	
	//(1) Look for **chapter**
	//(2) Drop the tag, capture the string between the end of the tag and newline
	//(3) Push the string before the newline, find earliest non-newline
	var tempArray = text.split(/\*\*chapter\*\*/g);
	
	//Get rid of the initial empty bits that came from the first chapter tag
	tempArray.splice(0, 1);
	
	//Push the label and get rid of leading white space
	for (var i=0; i<tempArray.length; i++) {
		var endLabel = tempArray[i].search(/\r\n/);
		var startChapter = tempArray[i].substring(endLabel, tempArray[i].length).search(/[^\r\n]/);
		
		chapters.push(tempArray[i].substring(1, endLabel));
		chapters.push(tempArray[i].substring(endLabel+startChapter, tempArray[i].length));
	}
	
	return chapters;
}

//Takes a string
//Returns an array
//Array values alternate between chapter titles and chapter text
function splitChapters(text) {
	var chapters = [];
	
	//(1) Look for **chapter**
	//(2) Drop the tag, capture the string between the end of the tag and newline
	//(3) Push the string before the newline, find earliest non-newline
	var tempArray = text.split(/\*\*chapter\*\*/g);
	
	//Get rid of the initial empty bits that came from the first chapter tag
	if (text.indexOf("**chapter**") === 0)
		tempArray.splice(0, 1);
	
	//Push the label and get rid of leading white space
	for (var i=0; i<tempArray.length; i++) {
		var endLabel = 0;
		
		if (i === 0 && text.indexOf("**chapter**") !== 0 ) {
			chapters.push("");
		}
		
		else {
			endLabel = tempArray[i].search(/\r\n/);
			chapters.push(tempArray[i].substring(1, endLabel));
		}
		
		var startChapter = tempArray[i].substring(endLabel, tempArray[i].length).search(/[^\r\n]/);
		chapters.push(tempArray[i].substring(endLabel+startChapter, tempArray[i].length));
	}
	
	return chapters;
}

//Takes a string
//Returns an array
//Array values are text pages
function splitPages(text) {
	var index = 0;
	var lastIndex;
	var pages = [];
	var newline = /\r\n\r\n/g;
	var adjusted_max_characters;
	
	while (index < text.length) {
		//Get all characters that could go in the next page
		var string = text.substr(index, MAX_CHARACTERS);
		
		//Find the last newline
		//Take into account wasted newline space
		adjusted_max_characters = MAX_CHARACTERS;
		while (newline.test(string) == true) {
			if (adjusted_max_characters-ROW_AVERAGE_CHARACTERS > newline.lastIndex) {
				adjusted_max_characters -= ROW_AVERAGE_CHARACTERS;
				string = string.substring(0, adjusted_max_characters);
			}
			
			lastIndex = newline.lastIndex;
		}
		
		//Check for a game tag
		var gameIndex = string.toLowerCase().indexOf("**game**");
		var pageIndex = string.toLowerCase().indexOf("**page**");
		if (gameIndex !== -1) {
			//Game tag at start (already cut out preceding text)
			if (gameIndex === 0) {
				pages.push("**game**");
				index += 12;
			}
			
			//Game tag not at start (so cut out the preceding text and give it a page)
			else {
				pages.push(string.substring(0, gameIndex-4));
				index += gameIndex;
			}
		}
		
		//Check for page tag
		else if (pageIndex !== -1) {
			//There's a page tag in here so just kind of...add the preceding text.
			pages.push(string.substring(0, pageIndex-4));
			index += pageIndex+12;
		}
		
		//No game tag or page tag, so find the last newline
		else {
			//Push the substring from 0 to the last newline to pages
			if (lastIndex > (adjusted_max_characters)*0.8) {
				pages.push(string.substring(0, lastIndex-4));
			}
			
			//Newline not found in the last 20% of the page
			else {
				//The newline occurs too early
				if (string.length === adjusted_max_characters) {
					lastIndex = string.lastIndexOf(" ");
					pages.push(string.substring(0, lastIndex));
				}
				
				//The chapter is actually ending
				else {
					pages.push(string);
					break;
				}
			}
		
			//Set index for next part of text
			index += lastIndex;
			lastIndex = 0;
		}
	}
	
	return pages;
}