/* iMapBook Application (IMB) - data structure
 * iMapBook LLC
 * All Rights Reserved
 * 04/08/2014
 * 
 * Version 2.5
 */
var type_list = new Array({1: "Reader"}, {2: "Writer"}, {4: "Administrator" }, {8: "Auditor"}); // possible access levels

// book_list is an array of book objects containing a list of all books available from the library
var book_list = new Array();

// book_list_idx contains the index of the last book opened (starting with 0).  -1 means that no books have been selected yet
var book_list_idx = -1;
// list of all the characters that have been created
var character_list = {};

// color matrix with properties
var color_matrix = [
	{id: 1, color: 'red', code: '#FF9999', type: 'noun', subtype: 'singular', label: 'Red noun (singular)'},
	{id: 11, color: 'red', code: '#FF9999', type: 'noun', subtype: 'plural', label: 'Red noun (plural)'},
	{id: 12, color: 'red', code: '#FF9999', type: 'noun', subtype: 'proper', label: 'Red noun (proper)'},
	{id: 2, color: 'orange', code: '#FF9933', type: 'verb', subtype: 'singular', label: 'Orange verb (singular)'},
	{id: 21, color: 'orange', code: '#FF9933', type: 'verb', subtype: 'plural', label: 'Orange verb (plural)'},
	{id: 3, color: 'yellow', code: '#FFFF99', type: 'adjective', subtype: '', label: 'Yellow adjective'},
	{id: 4, color: 'green', code: '#99FF66', type: 'adverb', subtype: '', label: 'Green adverb'},
	{id: 5, color: 'blue', code: '#CCFFFF', type: 'conjunction', subtype: '', label: 'Blue conjuction'},
	{id: 6, color: 'indigo', code: '#CCCCFF', type: 'preposition', subtype: '', label: 'Indigo preposition'},
	{id: 7, color: 'violet', code: '#CC99FF', type: 'interrogative', subtype: '', label: 'Violet interrogative'},
	{id: 8, color: 'white', code: '#FFFFFF', type: 'article', subtype: '', label: 'White article'},
	{id: 100, color: 'gray', code: '#DDDDDD', type: 'icon', subtype: '', label: 'Clickable icon'},
	{id: 101, color: 'gray', code: '#DDDDDD', type: 'text', subtype: '', label: 'Free-form text'}
];

// book is an object as defined below
function Book (id, location, author, title, icon, language, color_theme, voice, sound, reset, replay, nav_timer, nav_popup, abstract_text, version) {
	this.book_id = id; // bookshelf book identifier - unique and constant inside the bookshelf
	this.definition_list = new Array(); // array of definition objects
	this.registry = new Array();		// array of variable objects
	this.regDefaults = new Array();		// stores current status of registry variables
	this.page_list = new Array(); // array of page objects
	this.page_list_idx = 0; // used to implement page bookmarks. range = 0 to page_list.length - 1
	this.location = location; // directory where the actual book is found under /books
	this.author = author;
	this.title = title;
	this.icon = icon;
	this.language = (typeof language != 'undefined') ? language : 'en';
	this.color_theme = ((typeof color_theme != 'undefined') && (color_theme.length == 1)) ? color_theme.toLowerCase() : 'c';
	this.voice = (typeof voice != 'undefined') ? voice : ''; // set to blank if no voice overlay specified
	this.sound = (typeof sound != 'undefined') ? sound : ''; // don't play any opening sounds unless specified
	this.reset = (typeof reset != 'undefined') ? reset : 'y'; // OPTIONAL reset attribute that allows reader to reset a book
	this.replay = (typeof replay != 'undefined') ? replay : 'n'; // OPTIONAL replay attribute that allows reader to replay any game
	this.nav_timer = (typeof nav_timer != 'undefined') ? nav_timer : 0; // OPTIONAL global page navigation timer
	this.nav_popup = (typeof nav_popup != 'undefined') ? nav_popup : 'n'; // OPTIONAL global navigation popup
	this.abstract_text = (typeof abstract_text != 'undefined') ? abstract_text : ''; // OPTIONAL abstract text for the book
	this.version = (typeof version != 'undefined') ? version : '2.0';
	this.score = 0;
	this.progress_cnt = 0;
	this.progress_max = 0;
	this.tts = (this.voice.length > 3) ? 'on' : 'off'; // decide if tts is on/off by default based on presence/absence of voice attributes
	this.modified = "false"; // used for merge logic when writing the default.xml in concurrent user environment
	this.discussion_list = new Array();
}
// definition (word) is an object as defined below and loaded once along with the book upon successful authentication
function Definition (word, text) {
		this.word = word;
		this.text = text;
}
// variable is on the same level as definitions in terms of load time. All fields required.
function Variable (name, value, min, max, variance) {
	this.name = name;
	this.value = value;
	this.min = min;
	this.max = max;
	this.variance = variance;
}
// page is an object as defined below and loaded once along with the book upon successful authentication
function Page (type, chapter_number, hidden, character_number, timeout, timer_last, timer_next, nlp_feedback) {
	this.type = type; // 1 = text only, 2 = inference game, etc.
	this.state_list = new Array(); // array of states
	this.state_list_idx = 0; // defaults to first state in the list.  Used to implement state bookmarks
	this.chapter_number = chapter_number; // chapter display number
	this.hidden = (typeof hidden != 'undefined') ? hidden : 'n';
	this.char_idx = (typeof character_number != 'undefined') ? Math.max(0, character_number) : 0;
	this.timeout = (typeof timeout != 'undefined') ? timeout : 0;
	this.timer_last = (typeof timer_last != 'undefined') ? timer_last : 1;
	this.timer_next = (typeof timer_next != 'undefined') ? timer_next: 1;
	this.allow_last = true;
	this.allow_next = true;
	this.score = 0;
    this.complete = 0; // number of times this page/game was complete since last game reset
	this.nlp_feedback = (nlp_feedback == 'y');
}
// state is an object as defined below and loded unpon user's first selection
function State (sound, xloc, yloc, label, text, file_name, url, character, avatar) {
	this.sound = (typeof sound != 'undefined') ? sound : ''; // OPTIONAL file to play when state is reached
	this.text = (typeof text != 'undefined') ? text : ''; // // OPTIONAL HTML formatted content of the page or game intro
	this.xloc = (typeof xloc != 'undefined') ? xloc : 0;
	this.yloc = (typeof yloc != 'undefined') ? yloc : 0;
	this.label = (typeof label != 'undefined') ? label : 'State';
	this.url = (typeof url != 'undefined') ? url : '';
	this.image = new IMBImage(file_name); // image object with hotspots
	this.char_idx = (typeof character != 'undefined') ? Math.max(Number(character), 0) : 0;
	this.avatar_idx = (typeof avatar != 'undefined') ? Math.max(Number(avatar), 0) : 0;
	this.lexicon = new Lexicon('','',''); // lexicon object with responses, label, text and error attributes
	this.transition_list = new Array(); // state with empty transition_list is the last state
	this.transition_list_idx = 0;
}
// image is an object as defined below
function IMBImage (file_name) {
	this.file_name = (typeof file_name != 'undefined') ? file_name : '';
	this.hotspot_list = new Array(); // hotspot is an object as defined below
	this.draggable_list = new Array(); // draggable is an object as defined below
	this.container_list = new Array(); // container is an object as defined below
}
function Hotspot (loop) {
	this.loop = (typeof loop != 'undefined') ? loop : 0; // duration of the animation loop in seconds
	this.frame_list = new Array();
	this.frame_list_idx = 0;
	this.pause = 0;
}
function Draggable (clone, loop) {
	this.clone = (typeof clone != 'undefined') ? clone : 'n'; // OPTIONAL copy vs. move attribute
	this.loop = (typeof loop != 'undefined') ? loop : 0; // duration of the animation loop in seconds
	this.frame_list = new Array();
	this.frame_list_idx = 0;
	this.pause = 0;
}
function Container (count, lock, loop) {
	this.count = (typeof count != 'undefined') ? count : 1; // OPTIONAL allowable count attribute
	this.lock = (typeof lock != 'undefined') ? lock : 'n'; // OPTIONAL container lock attribute
	this.loop = (typeof loop != 'undefined') ? loop : 0; // duration of the animation loop in seconds
	this.frame_list = new Array();
	this.frame_list_idx = 0;
	this.pause = 0;
}
function Frame (file_name, opacity, xloc, yloc, width, height, word, text) {
	this.file_name = (typeof file_name != 'undefined') ? file_name : ''; // image file name (if any)
	this.opacity = (typeof opacity != 'undefined') ? (opacity) : 100; // OPTIONAL opacity attribute (100% by default)
	this.xloc = xloc; // % offset from left side of the image
	this.yloc = yloc; // % offset from top of the image
	this.width = width; // % width
	this.height = height; // % height
	this.word = word; // corresponding word
	this.text = text; // OPTIONAL popup text - for hotspots only
}
	
// lexicon is an object as defined below				
function Lexicon (label, text, error) {
	this.label = label;
	this.text = text; // intro text for the input box
	this.error = (error.length > 1) ? error : 'Please try again.'; // error text for invalid word combinations /w default
	this.word_list = new Array();
}
// word is an object as defined below
function Word (type, sound, icon, word) {
	this.type = type; // besides nouns, verbs, etc., can introduce compound and other custom types here
	this.sound = (typeof sound != 'undefined') ? sound : ''; // OPTIONAL file to play when word is pressed
	this.icon = (typeof icon != 'undefined') ? icon : ''; // OPTIONAL image file to use inside the lexicon object
	this.word = word;
}
// transition is an object as defined below
function Transition (type, trigger, variable_idx, range, next_state_idx, label, scenario_id, nlp_match) {
	this.type = type; // 1 = counter, 2 = countdown, 3 = timer, 4 = random, 5 = bitmask, etc.
	this.trigger = trigger; // used by state machine and can be a number of user inputs, seconds, a number or random selections, etc. 
	this.variable_idx = variable_idx;
	this.range = range;
	this.response_list = new Array();
	this.count = 0; // set to 0 by default; reset when entering the state
	this.mask = 0; // set to 0 by default; reset when entering the state
	this.next_state_idx = (typeof next_state_idx !== 'undefined') ? (next_state_idx) : 1; // REQUIRED transition into state upon satisfying condition
	//********the if statement below if causing problems when the next_state_idx is zero.  It is not really needed because you shouldn't be able to create a transition without a next_state.***********
	//if (this.next_state_idx == '') { // if blank then set it to the next state index
	//	alert("Next State Inside New TRanstition3: " + next_state_idx)
	//	var book = book_list[book_list_idx];
	//	var page = book.page_list[book.page_list_idx];
	//	this.next_state_idx = page.state_list.length + 1;
	//}
	this.label = (typeof label != 'undefined') ? label : '';
    this.scenario_id = (typeof scenario_id !== 'undefined') ? (scenario_id) : 0;
	// only in cases where the NLP type is used
	if (nlp_match != undefined) {
		this.nlp_min_match = Math.max(0, Math.min(100, nlp_match));
	}
	// by default, all NLP transitions have a 70% match threshold
	else if (type == 7) {
		this.nlp_min_match = 70;
	}
}
// response is an object as defined below
function Response (type, sound, weight, bits, asub, text_input, text_output, input_character_number, input_avatar_number, output_character_number, output_avatar_number) {
	this.type = type; // 1 = true inference match, 2 = false inference match, etc.
	this.sound = (typeof sound != 'undefined') ? sound : ''; // OPTIONAL file to play for this response
	
	if (this.sound == "None") this.sound = ''; // temporary fix for AT sound hickups
	
	this.weight = (typeof weight != 'undefined') ? weight : 0; // OPTIONAL weight parameter that adds to the user total
	this.bits = (typeof bits != 'undefined') ? bits : 0; // OPTIONAL bits parameter that sets bit(s) in a transition mask 
	this.asub = (typeof asub != 'undefined') ? asub : 'n'; // OPTIONAL autosubmit parameter that emulates the enter key
	this.text_input = (typeof text_input != 'undefined') ? text_input : ''; // text to match against (if any)
	this.text_output = text_output; // text to display upon match
	this.characters = {
		action_char  : ((typeof input_character_number != 'undefined') ? Number(input_character_number) : -1),
		action_avatar: ((typeof input_avatar_number != 'undefined') ? Number(input_avatar_number) : 0),
		output_char  : ((typeof output_character_number != 'undefined') ? Number(output_character_number) : 0),
		output_avatar: ((typeof output_avatar_number != 'undefined') ? Number(output_avatar_number) : 0)
	};
	this.count = 0; // number of matches for this response; reset when (re)entering the state
	
	// TODO: remove these; leave them in for now so we don't create errors
	this.object = ''; // OPTIONAL object parameter
	this.image_object_idx = -1;
}
// a character; container for avatar images and tts details for inference-game responses
function Character (name, tts_params) {
	this.name = name;
	this.tts = tts_params;
	this.default_avatar_idx = 0;
	this.avatar_list = {};
	this.avatar_names = {};
}
// a discussion topic; added to chat at certain points in the book
function DiscussionTopic (id, name, question, page_start) {
	this.id = id;
	this.name = name;
	this.question = question;
	this.page = ~~(page_start);
	this.answer = '';
}
// manager to handle conversation data
function SocialManager () {
	this.chatTimer = 0; // to schedule/clear the functions that check for new messages
	this.totalNew = 0; // total number of new messages
	// sparse arrays id-date data, to indicate the last timestamp for messages in each 
	// social group or topic
	this.groupData = {};
	this.topicData = {};
	
	// TODO: this would be better handled by prototyping, though it doesn't matter
	// much since only one SocialManager needs to be created
	this.startChatTimer = function() {
		imb_social_refresh();
		if (this.chatTimer === 0) {
			this.chatTimer = setInterval(imb_social_refresh, 10000);
		}
	};
	this.stopChatTimer = function() {
		clearInterval(this.chatTimer);
		this.chatTimer = 0;
	};
	// the chat timers are used when chat is open, while this is just used in
	// the background to see how many new messages are waiting
	this.startMessageTimer = function() {
		imb_check_messages();
		if (this.msgTimer === 0) {
			this.msgTimer = setInterval(imb_check_messages, 60000);
		}
	};
	this.stopMessageTimer = function() {
		clearInterval(this.msgTimer);
		this.msgTimer = 0;
	};
	// this updates the internal data
	this.refresh = function(groupTimestamps, topicTimestamps) {
		this.totalNew = 0;
		this.groupData = {};
		groupTimestamps.forEach(function(obj) {
			this.groupData[obj.id] = { timestamp: obj.time, number: +obj.num };
			this.totalNew += +obj.num;
		}, this);
		this.topicData = {};
		topicTimestamps.forEach(function(obj) {
			this.topicData[obj.id] = { timestamp: obj.time, number: +obj.num };
			this.totalNew += +obj.num;
		}, this);
	};
	// initialize the topic data
	this.initTopics = function(topicList) {
		this.topicData = {};
		topicList.forEach(function(topic){
			this.topicData[topic.id] = { timestamp: '', number: 0 };
		}, this);
	};
}

// ----------------------------------------------------------- METHODS ---------------------------------------------------------

// load bookshelf data from the global bookshelf file (and matching book array if defined)
function imb_load_bookshelf_content(bkarr) {
	$.ajax({
        type: "GET",
		url: "data/bookshelves/" + bookshelf_file,
		dataType: "xml",
		async: false,
		cache:false,                    //won't work sometimes but is to prevent the need of clearing browser cache to see changes to default.xml ( bookshelf )
		data : { r: Math.random() },    //start random number generator, this make a unique value so the transaction including the url read won't be cached - Google Find
		success: function(xml, textStatus, jqXHR) {
			$(xml).find('cover').each(function() { // traverse
				if (bkarr == null || $.inArray($(this).attr('book_id'), bkarr) != -1) { // load book content - implement book picker if book array is not null
					var book = new Book( $(this).attr('book_id'), $(this).attr('location'), $(this).attr('author'),
						$(this).attr('title'), $(this).attr('icon'), $(this).attr('language'), $(this).attr('coloring'),
						$(this).attr('voice'), $(this).attr('sound'), $(this).attr('reset'), $(this).attr('replay'),
						$(this).attr('nav_timer'), $(this).attr('nav_popup'), $(this).text() );
					book_list.push(book);
				}
			});
			bookshelf_file_path = "data/bookshelves/" + bookshelf_file;
			if (jqXHR.responseText != "") {
				loadXMLDocErr(jqXHR.responseText, bookshelf_file_path);
			}
		},
		error: function (jqXHR, textStatus, errorThrown) { // file error returned
			console.log("--------------START jqXHR------------------");
			console.log(jqXHR);
			console.log("--------------END jqXHR------------------");			
			console.log(textStatus);
			console.log(errorThrown);			
			window.alert("Bookshelf [" + bookshelf_file + "] not found!");			
		}
	});
}

// load character data from the server
function imb_load_characters(success_handler) {
	// TODO: optimize this so it only loads characters in the current bookshelf
	$.ajax({
        type: "GET",
		url: "data/avatars/characters.xml",
		dataType: "xml",
		async: true,
		success: function(xml, textStatus, jqXHR) {
			character_list = {}; // clear the old list
			$(xml).find("character").each(function() {
				var $this = $(this);
				var c = new Character($this.attr("name"), $this.attr("voice"));
				$this.find("avatar").each(function() {
					c.avatar_list[$(this).attr("type")] = $(this).text();
					c.avatar_names[$(this).attr("type")] = $(this).attr("name");
					if ($(this).attr("default")) {
						c.default_avatar_idx = $(this).attr("type");
					}
				});
				character_list[$this.attr("id")] = c;
			});
			if (jqXHR.responseText != "") {
				loadXMLDocErr(jqXHR.responseText, "data/avatars/error.log");
			}
			if (success_handler) {
				success_handler.call();
			}
		},
		error: function (jqXHR, textStatus, errorThrown) { // file error returned
			console.log("--------------START jqXHR------------------");
			console.log(jqXHR);
			console.log("--------------END jqXHR------------------");			
			console.log(textStatus);
			console.log(errorThrown);			
			window.alert("Cannot load book characters!");			
		}
	});
}

// load specific book data as defined by directory location
function imb_load_book_content(location) {
	$.ajax({
        type: "GET",
		url: "data/books/" + location + "/book.xml",
		dataType: "xml",
		async: false,
		/* TODO: this should be replaced with a version system, since we want the eReader to sometimes cache
				 so that mobile data plans don't explode trying to load the books */
		cache: false,
		success: function(xml, textStatus, jqXHR) {
//if (debug) console.log("XML PARSER ------------------------------------------------------------------------------- START: ");			
			$(xml).find('book').each(function(idx){ // book
				var book = book_list[book_list_idx];
				book.version = $(this).attr('version');
//if (debug) console.log("XML BOOK: " + book.toSource());
				$(this).find('dictionary').find('definition').each( function() { // load word definitions (if any)
					var definition = new Definition($(this).attr('word'), $(this).text());
//if (debug) console.log("XML DICTIONARY DEFINITION: " + definition.toSource());	
					book.definition_list.push(definition);
				});

				$(this).find("registry").find('variable').each(function() {
					var variable = new Variable($(this).attr("name"), $(this).attr("value"), $(this).attr("min"), $(this).attr("max"), $(this).attr("variance"));
					var varDefault = new Variable($(this).attr("name"), $(this).attr("value"), $(this).attr("min"), $(this).attr("max"), $(this).attr("variance"));
					book.registry.push(variable);
					book.regDefaults.push(varDefault);
				});
				
				$(this).find('discussion').find('topic').each(function() {
					var $this = $(this);
					var topic = new DiscussionTopic($this.attr("id"), $this.attr("name"), $this.text(), $this.attr("page"));
					book.discussion_list.push(topic);
				});
				// sort the discussion topics by page number, with furthest page number at the back;
				// for ties, convert the id into a number and sort those in ascending order
				book.discussion_list = book.discussion_list.slice().sort(function(b,a){
					return (a.page === b.page) ? (~~(b.id)) - (~~(a.id)) : b.page - a.page;
				});
				
				$(this).find('page').each(function(idx) { // page
					var page = new Page( $(this).attr('type_id'), $(this).attr('chapter_number'), $(this).attr('hidden'),
						$(this).attr('character'), $(this).attr('timeout'), $(this).attr('timer_last'), $(this).attr('timer_next'),
						$(this).attr('nlp_feedback') );
					book.page_list.push(page);	
//if (debug) console.log("XML PAGE: " + page.toSource());	
					$(this).find('state').each(function(idx) { // load state content
						var state = new State($(this).attr('sound'), $(this).attr('xloc'), $(this).attr('yloc'), $(this).attr('label'), $(this).find('text').text(), $(this).find('image').attr('file_name'), $(this).attr('url'), $(this).attr('character'), $(this).attr('avatar'));
						if  ($(this).find('image')) { // load image data
							$(this).find('image').find('hotspot').each( function() { // load image hotspots
								var hotspot = new Hotspot($(this).attr('loop'));
								$(this).find('frame').each(function(){
									var frame = new Frame($(this).attr('file_name'), $(this).attr('opacity'), $(this).attr('xloc'), $(this).attr('yloc'), $(this).attr('width'), $(this).attr('height'), $(this).attr('word'), $(this).text());
									hotspot.frame_list.push(frame);
								});					
								state.image.hotspot_list.push(hotspot);
							});
							$(this).find('image').find('draggable').each( function() { // load image draggables
								var draggable = new Draggable($(this).attr('clone'), $(this).attr('loop'));
								$(this).find('frame').each(function(){
									var frame = new Frame($(this).attr('file_name'), $(this).attr('opacity'), $(this).attr('xloc'), $(this).attr('yloc'), $(this).attr('width'), $(this).attr('height'), $(this).attr('word'), '');
									draggable.frame_list.push(frame);
								});	
								state.image.draggable_list.push(draggable);
							});
							$(this).find('image').find('container').each( function() { // load image containers
								var container = new Container($(this).attr('count'), $(this).attr('lock'), $(this).attr('loop'));
								$(this).find('frame').each(function(){
									var frame = new Frame($(this).attr('file_name'), $(this).attr('opacity'), $(this).attr('xloc'), $(this).attr('yloc'), $(this).attr('width'), $(this).attr('height'), $(this).attr('word'), '');
									container.frame_list.push(frame);
								});	
								state.image.container_list.push(container);
							});
						}
						if ($(this).find('lexicon')) { // load lexicon
							if ($(this).find('lexicon').attr('label')) state.lexicon.label = $(this).find('lexicon').attr('label');
							if ($(this).find('lexicon').attr('text')) state.lexicon.text = $(this).find('lexicon').attr('text');
							if ($(this).find('lexicon').attr('error')) state.lexicon.error = $(this).find('lexicon').attr('error');
							$(this).find('lexicon').find('word').each(function() { // load lexicon words
								var word = new Word( $(this).attr('type_id'), $(this).attr('sound'), $(this).attr('icon'), $(this).attr('word') );
								state.lexicon.word_list.push(word);
							});
						}
						if ($(this).find('transition')) { // load transitions
							$(this).find('transition').each(function() { // load transitions
								var transition = new Transition( $(this).attr('type_id'), $(this).attr('trigger'), $(this).attr('variable_idx'),
									$(this).attr('range'), $(this).attr('next_state_idx'), $(this).attr('label'),
									$(this).attr('scenario_id'), $(this).attr('nlp_min_match') );
								$(this).find('response').each(function() {
									var input = $(this).find('text_input');
									var output = $(this).find('text_output');
									
									var response = new Response( $(this).attr('type_id'), $(this).attr('sound'), $(this).attr('weight'),
										$(this).attr('bits'), $(this).attr('asub'), input.text(), output.text(),
										input.attr('character'), input.attr('avatar'), output.attr('character'), output.attr('avatar') );
									transition.response_list.push(response);
								});
								state.transition_list.push(transition);
							});
						}
//if (debug) console.log("XML STATE: " + state.toSource());
						page.state_list.push(state);
					});
				});
			});
//if (debug) console.log("XML PARSER ------------------------------------------------------------------------------- END");	
			book_file_path = "data/books/" + location + "/book.xml";
			if (jqXHR.responseText != "") {
				loadXMLDocErr(jqXHR.responseText, book_file_path);
			}
		},
		error: function (jqXHR, textStatus, errorThrown) { // file error returned
			console.log("--------------START jqXHR------------------");
			console.log(jqXHR);
			console.log("--------------END jqXHR------------------");			
			console.log(textStatus);
			console.log(errorThrown);			
			window.alert("Book [" + location + "] failed to load!");
		}
	});
}

// ----------------------------------- array utility functions
// replace idx1 with idx2 and shift everything down
function imb_array_shift_items(arr, idx1, idx2) {
	var tmp = arr[idx2];
	for (i = idx2; i > idx1; i--) {
		arr[i] = arr[i-1];
	}
	arr[idx1] = tmp;
}
// sort the data array to match the supplied list of ui elements based on a prefix
function imb_sort_array(ds_array, ui_list, prefix) {
	for (x = 0; x < ds_array.length; x++) {
		if (ui_list[x] != (prefix + x)) { // if the items of the same index do not match
			for (y = x; y < ds_array.length; y++) { // find the index of the item that should be in x
				if (ui_list[x] == (prefix + y)) { 
					imb_array_shift_items(ds_array, x, y); // move y to x and shift everything down
					if(prefix == "imb_state_list_item") {
						update_next_state_values(x, y)
					}
					console.log("MOVE:" + y + " to " + x);
					break;
				}
			}
		}
	}
}
// loop through all transitions of the current state and update the next state value based on where the next state list order
function update_next_state_values(new_pos, ori_pos) {
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	$.each(page.state_list, function(index) { //loop through all states of current page
		var state = page.state_list[index]; // current state
		$.each(state.transition_list, function(index2) { // loop through all transitions of current state
			var transition = state.transition_list[index2]; // current transition		
			if (transition.next_state_idx > ori_pos) {
				return true;
			}			
			if (transition.next_state_idx < ori_pos && transition.next_state_idx >= new_pos) {
				transition.next_state_idx = parseInt(transition.next_state_idx) + 1 //increase next_state_idx by 1
				return true;				
			}	
			if (transition.next_state_idx == ori_pos) {
				transition.next_state_idx = new_pos //set next_state_idx to where state was dragged too (new position)
			}				
		});				
	});
}

// reset all ids in the ui list to reflect ordered array
function imb_update_list(list_selector, prefix) {
	$(list_selector).each(function(idx) {
		$(this).attr("id", prefix + idx);
	});
}
// return name/label of the page type
function imb_page_type_name(type) {
	switch (type) {
		case "1":
			return "Text";
		break;
		case "2":
			return "Text Game";
		break;
		case "3":
			return "Graphics Game";
		break;
		case "4":
			return "Lexicon Only";
		break;
	}
}
// return color property by type
function imb_type_color(type_id, property) {
	var rv = "";
	var id = parseInt(type_id);
    for (var i = 0; i < color_matrix.length; i++) {
        if (color_matrix[i]['id'] === id) {
            rv = color_matrix[i][property];
            break;
        }
    }
    return rv;
}
