// globals
var bookshelf_file = "default.xml"; // set default bookshelf file
var display_name = "Tester"; // set default user name
var avatar = ""; // set default avatar
var avatar_max = 0; // used for loading avatar images
var display_type = 1; // set default user authorization (reader)
var points_total = 0; // set default total points
var points_max = 0; // set default max points
var pageTimeoutVar = 0; // used by setTimeout() page timeout event
var pageTimerLast = 0; // used to restrict backward navigation
var pageTimerNext = 0; // used to restrict forward navigation
var timerVar = 0; // used by setTimeout() in timer transitions
var pageIntervalVar = 0; // used by setInterval() in automatic display updates (such as counters)
var intervalVar = 0; // used by setInterval() in automatic display updates (such as counters)
var intervalAnimateVar = 0; // used to animate frames of image objects with setInterval()
var FPS = 50; // animate # of frames per second
var socialManager = new SocialManager(); // used to handle messages and new ones

var audio_player = new Audio(); // define a global audio object
var browser = get_browser(navigator.userAgent); // detect browser type
var codec = get_codec(browser); // define appropriate codec
var user_event = get_user_event(browser); // define appropriate user "click" event
var input_type = 0; // the type of last user input (1..9)
// HACKS
var hack_drag_id = ""; // used to simulate mobile "drag&drop"
var nextTopicIndex = -1; // index for the discussion topic that should be shown next

// global setup toggles
var debug = false; 			// set to false for production
var experiment = false;	 // set to true to bypass the bookshelf and disable other features
var sound = 1; 				// 0 = off, 1 = on
var sound_volume = 50;		// passed to Audio object
var sound_synthesis = 0;	// 0 = off, 1 = on -- serve only local files or try to synthesize sounds
var language = (typeof getUrlVars()["lang"] != 'undefined') ? getUrlVars()["lang"] : 'en'; // default language is english
var token = (typeof getUrlVars()["token"] != 'undefined') ? getUrlVars()["token"] : ''; // token used to bypass standard auth
var timeout; // used to distinguish dblclik from click

$(document).ready(function () { // document loaded and DOM is ready

	$.i18n.init({// i18n localization
		lng: language,
		ns: {namespaces: ['language'], defaultNs: 'language'},
		useLocalStorage: false,
		debug: true
	}, function () {
		// first page is already enhanced!
		$('#btn_login_submit .ui-btn-text').text($.t('label.login'));
		$('#btn_login_register .ui-btn-text').text($.t('label.register'));
		// everything else is not
		$('.i18n').i18n();
		$('#btn_register_submit').text($.t('label.register'));
		$('#btn_register_cancel').text($.t('label.cancel'));
		$('#imb_help_ok').text($.t('label.ok'));
		$('#imb_popup_ok').text($.t('label.ok'));
		$('#imb_setup_ok').text($.t('label.ok'));
		$('#imb_btn_bookshelf').text($.t('label.books'));
		$('#imb_header_mobile_btn_home').text($.t('label.books'));
		//$('#imb_btn_page_last').text($.t('label.page'));
		//$('#imb_btn_page_next').text($.t('label.page'));
		$('.summary_btn_reset_book').text($.t('label.read_reset'));
		$('.summary_btn_continue_book').text($.t('label.read_continue'));
	});

	// disable scroll behavior
	/*$('.no-scroll').live('touchmove', function (event) {
	 event.preventDefault();
	 //event.stopPropagation();
	 });*/
	 
	// remove the initial hiding css since jQuery should be loaded and
	// active now; if we don't remove it, nothing will be shown
	$('.display_remove').removeClass('display_remove');

	// forced blur on Enter when in text input
	$(document).on('keypress', '.imb_input_key', function (event) {
		if (event.which === 13) {
			event.preventDefault();
			this.blur();
		}
	});
	// process Enter event by simulating Submit button click
	$(document).keypress(function (event) {
		if (event.which === 13) {
			event.preventDefault();
			$("#imb_btn_submit").click();
		}
	});

	// touch events for draggable objects (mobile only)
	if (browser == "mobile") {
		$(".imb_draggable").live('vmousedown', function (event) { // normalized event for handling touchstart or mousedown events
			hack_drag_id = $(this).attr("id");
		});
		$(".imb_container").live('vmousedown', function (event) {
			drop_object(hack_drag_id, event.target.id);
			hack_drag_id = ''; // clean the global drag_id variable
		});
	}
	// touch event for draggable object class
	$(document).on("vmousedown", ".imb_draggable", function (e, ui) { // when draggable is clicked on
		if (debug)
			console.log("draggable:" + e.target.id.substr(9));
		var book = book_list[book_list_idx];
		var page = book.page_list[book.page_list_idx];
		var state = page.state_list[page.state_list_idx];
		var imgobj = state.image.draggable_list[e.target.id.substr(9)]; // data structure image object
		var frame = imgobj.frame_list[imgobj.frame_list_idx]; // current frame

		if (timeout === 0) { // single
			timeout = setTimeout(function () {
				timeout = 0;
			}, 200);
		} else { //double
			clearTimeout(timeout);
			timeout = 0;
			animate_object(e.target, imgobj); // move to the next frame (if any)
		}
	});
	$(document).on("vmouseup", ".imb_draggable", function (e, ui) {
		var book = book_list[book_list_idx];
		var page = book.page_list[book.page_list_idx];
		var state = page.state_list[page.state_list_idx];
		var imgobj = state.image.draggable_list[e.target.id.substr(9)]; // data structure image object
		imgobj.pause = 0; // restart any animation of this object
	});

	// touch event for image hotspot object class
	$(document).on("vmousedown", ".imb_hotspot", function (e, ui) { // when hotspot is clicked on
		if (debug)
			console.log("hotspot:" + e.target.id.substr(7));
		var book = book_list[book_list_idx];
		var page = book.page_list[book.page_list_idx];
		var state = page.state_list[page.state_list_idx];
		var imgobj = state.image.hotspot_list[e.target.id.substr(7)]; // data structure image object
		var frame = imgobj.frame_list[imgobj.frame_list_idx]; // current frame

		if (timeout === 0) { // single
			timeout = setTimeout(function () {
				timeout = 0;
				hot_press(frame.word, frame.text); // process the current frame
			}, 200);
		} else { //double
			clearTimeout(timeout);
			timeout = 0;
			animate_object(e.target, imgobj); // move to the next frame (if any)
			var frame = imgobj.frame_list[imgobj.frame_list_idx]; // new current frame
			hot_press(frame.word, frame.text);
		}
	});
	// touch event for image container object class
	$(document).on("vmousedown", ".imb_container", function (e, ui) { // when container is clicked on
		if (debug)
			console.log("container:" + e.target.id.substr(9));
		var book = book_list[book_list_idx];
		var page = book.page_list[book.page_list_idx];
		var state = page.state_list[page.state_list_idx];
		var imgobj = state.image.container_list[e.target.id.substr(9)]; // data structure image object

		if (timeout === 0) { // single
			timeout = setTimeout(function () {
				timeout = 0;
			}, 200);
		} else { //double
			clearTimeout(timeout);
			timeout = 0;
			animate_object(e.target, imgobj); // move to the next frame (if any)
		}
	});

	// display cursors
	$(".imb_hotspot").live('vmouseover', function () {
		$(this).css('cursor', 'pointer'); // show hand cursor for hotspots
	});
	$(".imb_draggable").live('vmouseover', function () {
		$(this).css('cursor', 'move'); // show move cursor for draggables
	});
	
	// interactivity to hide the definition pop-up
    $('#slideDef').click(function () {
        if ($('#slideDef').css('display') == "block") {
            $('#slideDef').hide(100);
        }
    });
	
	// login form validation details
	$("#login_page").find("form").validate({
		messages: {
			login_username : "A login name is required",
			login_password : "A password is required"
		},
		focusInvalid  : false,
		errorClass	  : "input_error",
		errorPlacement: function(error, element) {
			error.appendTo("#login_errors");
		},
		submitHandler : function(form) {
			var $form = $(form);
			// clean up the form and disable it while loading
			$("#login_errors").empty();
			$form.find("#btn_login_submit").prop("disabled", true);
			$form.find("#btn_login_register").prop("disabled", true);
			$form.find("input").prop("disabled", true);
			imb_login( $form.find("#login_username").val(), $form.find("#login_password").val(), "",
					  function(message) {
						  // re-enable the form since something went wrong
						  $form.find("#btn_login_submit").prop("disabled", false);
						  $form.find("#btn_login_register").prop("disabled", false);
						  $form.find("input").prop("disabled", false);
						  // indicate the problem
						  $("#login_errors").append("<label>" + message + "</label>");
					  });
		}
	});
	
	// registration form validation details; checks to ensure all fields are
	// filled out with something, confirms the password, and ensures the login
	// and code are valid in the database
	$("#register_page").find("form").validate({
		rules	: {
			register_login_name : {
				remote	   : {
					url  : "service.php",
					async: true,
					type : "post",
					data : { action : "check_username" }
				}
			},
			register_password   : { minlength : 4 },
			register_password2  : {
				minlength : 4,
				equalTo	  : "#register_password"
			},
			register_code		: {
				remote     : {
					url  : "service.php",
					async: true,
					type : "post",
					data : { action : "check_code" }
				}
			}
		},
		messages: {
			register_user_name  : "A user name is required",
			register_login_name : {
				required : "A login name is required",
				remote   : "That login name is already taken"
			},
			register_password	: {
				required : "A password is required",
				minlength: "Your password must be at least 4 characters"
			},
			register_password2	: {
				required : "Your password needs to be confirmed",
				minlength: "Your password must be at least 4 characters",
				equalTo  : "Please enter the same password as above"
			},
			register_code		: {
				required : "A registration code is required",
				remote   : "That code is invalid"
			}
		},
		focusInvalid  : false,
		errorClass 	  : "input_error",
		errorElement  : "span",
		errorPlacement: function(error, element) {
			error.insertAfter($(element).parent());
		},
		submitHandler : function(form) {
			var $form = $(form);
			// clean up the form and disable it while waiting for registration
			$("#register_errors").empty();
			$form.find("#btn_register_submit").prop("disabled", true);
			$form.find("#btn_register_cancel").prop("disabled", true);
			$form.find("input").prop("disabled", true);
			imb_register( $form.find("#register_user_name").val(),
						  $form.find("#register_login_name").val(),
						  $form.find("#register_password").val(),
						  $form.find("#register_code").val(),
						  function(message) {
							  // re-enable the form since something went wrong
							  $form.find("#btn_register_submit").prop("disabled", false);
							  $form.find("#btn_register_cancel").prop("disabled", false);
							  $form.find("input").prop("disabled", false);
							  // indicate the problem
							  $("#register_errors").append("<label>" + message + "</label>");
						  });
		}
	});

	// add event listeners to all buttons
	$("#imb_btn_help").live(user_event, function () {
		$("#imb_help").toggle();
	});
	$("#imb_help_ok").live(user_event, function () {
		$("#imb_help").toggle();
	});
	$("#imb_popup_ok").live(user_event, function () {
		$("#imb_popup").toggle();
	});
	$("#imb_btn_submit").live(user_event, function () {
		btn_submit(input_type, '');
	});
	$(".summary_btn_continue_book").live(user_event, function () {
		load_book(book_list_idx, -1);
	});
	$(".summary_btn_reset_book").live(user_event, function () {
		var book = book_list[book_list_idx];
		imb_archive(book.book_id, 0, 0, "BOOK RESET", 100, 0); // archive the RESET event

		// reset the bookmark, the score, the progress counter and the page completes
		book.page_list_idx = 0;
		book.score = 0;
		book.progress_cnt = 0;
		$.each(book.page_list, function (idx, pg) { // clear all page completes
			pg.complete = 0;
		});

		load_book(book_list_idx, 0);
	});
	$("#summary_btn_goto_page1").live(user_event, function () {
		var goto_pidx = $("#summary_input_goto_page1").val() ? $("#summary_input_goto_page1").val() - 1 : -1;
		load_book(book_list_idx, goto_pidx);
	});
	$("#summary_btn_goto_page2").live(user_event, function () {
		var goto_pidx = $("#summary_input_goto_page2").val() ? $("#summary_input_goto_page2").val() - 1 : -1;
		load_book(book_list_idx, goto_pidx);
	});
	$("#imb_btn_bookshelf").live(user_event, function (e) {
		imb_check_end_game();
		$("#slideDef").hide();
		load_bookshelf(null);
	});
	$("#imb_header_mobile_btn_home").live(user_event, function(e) {
		$("#slideDef").hide();
	});
	$("#imb_header_mobile_btn_navbar").live(user_event, function(e) {
		$("#imb_mobile_nav_bar").slideToggle();
	});
	$("#imb_mobile_nav_home").live(user_event, function(e) {
		$("#imb_mobile_nav_bar").hide();
		imb_check_end_game();
		$("#slideDef").hide();
		load_bookshelf(null);
	});
	
	// configuration/setup enter logic
	$("#setup_popup").popup();
	$("#imb_btn_settings").live(user_event, function () {
		show_settings_page({popup : true});
	});
	$("#imb_mobile_nav_settings").live(user_event, function(e) {
		$("#imb_mobile_nav_bar").hide();
		show_settings_page({page : true});
	});
	
	// logic for preparing and showing the configuration/setup screen
	function show_settings_page(options) {
		// update the settings controls
		var book = book_list[book_list_idx];
		imb_check_end_game();
		$("#imb_setup_sound_synthesis").val((book.tts == 'on') ? 'on' : 'off'); // set tts on/off
		$("#imb_setup_sound_synthesis_attributes").val(book.voice); // load book's voice
		
		// hide definitions
		$("#slideDef").hide();
		
		// make the settings to be a new page for mobile devices
		if (options.page) {
			$("#setup_popup").children().appendTo("#setup_page");
			$.mobile.changePage("#setup_page", {transition: "pop", reverse: false});
		}
		// or a regular popup for larger screens
		else if (options.popup) {
			if ($("#setup_page").children.length > 0) {
				$("#setup_page").children()
					.appendTo("#setup_popup")
					.trigger("create"); // change to .enhanceWithin() for newer versions of jQueryMobile
			}
			$("#setup_popup").popup("open");
		}
		
		$("#imb_setup_sound_synthesis").slider('refresh'); // make sure the element gets refreshed
	}

	// configuration/setup exit logic
	$("#imb_setup_ok").live(user_event, function () {
		var book = book_list[book_list_idx];
		if (($("#imb_setup_debug").val() == 1) && ((display_type & 4) || (display_type & 2))) {
			debug = true; // can only enter debug mode when administrator or writer
		} else {
			debug = false;
		}
		sound = $("#imb_setup_sound").val();
		sound_volume = $("#imb_setup_sound_volume").val();
		book.voice = $("#imb_setup_sound_synthesis_attributes").val(); // set book voice to new values
		book.tts = $("#imb_setup_sound_synthesis").val();
		if (book.tts == 'on' && location.hostname != '') { // if book TTS is on and not running locally
			sound_synthesis = 1; // TTS on
		} else {
			sound_synthesis = 0; // TTS off
		}
		// close the page or popup, depending on what's open
		if ($.mobile.activePage.attr("id") == "setup_page") {
			$.mobile.changePage("#imb", {transition: "pop", reverse: true});
		}
		else {
			$("#setup_popup").popup("close");
		}
		// reload page, since external games are wiped on changepage
		load_page(book_list[book_list_idx].page_list_idx);
	});
	$("#imb_btn_profile").live(user_event, function () {
		$("#slideDef").hide();
		$("#imb_profile_dialog").popup("open");
	});
	
	// social window enter logic
	$("#imb_btn_social_open").live(user_event, function () {
		imb_check_end_game();
		$("#slideDef").hide();
		// start the timer for the chat
		//socialManager.stopMessageTimer();
		socialManager.startChatTimer();
	});
	$("#imb_mobile_nav_chat").live(user_event, function(e) {
		$("#imb_mobile_nav_bar").hide();
		imb_check_end_game();
		$("#slideDef").hide();
		// start the timer for the chat
		//socialManager.stopMessageTimer();
		socialManager.startChatTimer();
	});
	
	// to initialize the list for the social groups
	$("#imb_social_change_list").listview();
	$("#imb_social_topic_change_list").listview();
	// make pressing enter do the same thing as clicking the submit button
	$("#imb_social_input_text").on('keypress', function(event) {
		if (event.which === 13) {
			event.preventDefault();
			$("#imb_btn_social_submit").click();
		}
	});
	
	// submit button for social messages
	$("#imb_btn_social_submit").live(user_event, function() {
		var book = book_list[book_list_idx];
		var msg = $("#imb_social_input_text").val().trim();
		if (msg == '') {
			// do not send blank messages
			return;
		}
		// submit the message to the database, calling refresh if successful
		imb_social_write(
			$("#imb_social_heading").data("action-id"),
			$("#imb_social_heading").data("social-id"),
			book.book_id,
			book.page_list_idx,
			book.page_list[book.page_list_idx].state_list_idx,
			$("#imb_social_heading").data("discussion-id"),
			msg,
			imb_social_refresh,
			false
		);
		// clear the message to send
		$("#imb_social_input_text").val("");
	});
	
	// submit button for answers for discussion topics
	$("#imb_btn_topic_answer_submit").live(user_event, function() {
		var book = book_list[book_list_idx];
		var topic_idx = $("#imb_social_heading").data("discussion-index");
		// if this is your first answer, show a popup to indicate the answer
		if (book.discussion_list[topic_idx].answer == '') {
			var newAnswer = $("#imb_social_input_text").val().trim();
			if (newAnswer == '') {
				// don't submit empty sentences
				return;
			}
			var $popup = $("#popupShowTopicAnswer");
			$popup.find("p").text($.t("text.show-answer-text") + " " + newAnswer);
			$popup.popup("open");
			$popup.on("popupafterclose", function(event,ui){
				// submit the message to the database, calling refresh if successful
				imb_social_write(
					4,
					$("#imb_social_heading").data("social-id"),
					book.book_id,
					book.page_list_idx,
					book.page_list[book.page_list_idx].state_list_idx,
					$("#imb_social_heading").data("discussion-id"),
					newAnswer,
					imb_social_refresh,
					true
				);
				// then update the answer
				book.discussion_list[topic_idx].answer = newAnswer;
				$("#popupShowTopicAnswer").find("p").text(newAnswer);
				$popup.off("popupafterclose");
				// lastly, clear the textbox so new messages can be sent
				$("#imb_social_input_text").val("");
			});
		}
		// otherwise, verify that you want to overwrite your previous answer
		else {
			$popup = $("#popupChangeTopicAnswer");
			$popup.find("p").text($.t("text.change-topic-previously") + " " + book.discussion_list[topic_idx].answer);
			$popup.find("h3").text($.t("text.change-topic-newly") + " " + $("#imb_social_input_text").val());
			$popup.popup("open");
		}
	});
	
	// if we want to change the answer to a discussion topic
	$("#imb_btn_use_new_topic_answer").live(user_event, function () {
		var book = book_list[book_list_idx];
		var newAnswer = $("#imb_social_input_text").val().trim();
		imb_social_write(
			4,
			$("#imb_social_heading").data("social-id"),
			book.book_id,
			book.page_list_idx,
			book.page_list[book.page_list_idx].state_list_idx,
			$("#imb_social_heading").data("discussion-id"),
			newAnswer,
			imb_social_refresh,
			true
		);
		// then update the answer
		book.discussion_list[$("#imb_social_heading").data("discussion-index")].answer = newAnswer;
		$("#popupShowTopicAnswer").find("p").text(newAnswer);
		// lastly, clear the textbox so new messages can be sent
		$("#imb_social_input_text").val("");
	});
	
	// social window exit logic
	$("#imb_btn_social_close").live(user_event, function () {
		// stop the update timer
		socialManager.stopChatTimer();
		socialManager.startMessageTimer();
		// return to the book
		$.mobile.changePage("#imb", {transition: "pop", reverse: true});
		// external games are wiped when changePage is called, so we need to
		// reload them; however, text games are also reset and this is bad,
		// so only reload the page if it was an external game
		// NOTE: this will break the page timers though, so a better solution is needed
		if (book_list[book_list_idx].page_list[ book_list[book_list_idx].page_list_idx ].type == 3) {
			load_page(book_list[book_list_idx].page_list_idx);
		}
	});
	// prepare the lists for choosing an avatar for the social window
	$(".user-avatar-lists").each(function() {
		$(this).listview();
		if (avatar_max < 1) {
			avatar_max = imb_social_get_max_avatar();
		}
		for (var i = 1; i < avatar_max; i++) {
			var li = $("<li></li>");
			var btn = $('<a href="./" data-rel="back" data-ajax="false"></a>')
				.val(i);
			$('<img src="data/avatars/users/' + i + '.jpg" class="avatar_selection">')
				.appendTo(btn);
			btn.appendTo(li);
			li.appendTo($(this));
			
			btn.on("click", function() {
				imb_social_set_avatar( $(this).val(), function(new_avatar) {
					if (new_avatar) {
						avatar = new_avatar;
						$("#imb_profile_image").attr("src", new_avatar);
						imb_social_refresh();
					}
				});
			});
		}
	})
	
	// delete word from text display
	$("#imb_game_display_content_bottom_text").live(user_event, function () {
		btn_backspace();
	});

	// page last/next -----------------------------------------------------------------------------------------------------
	function page_turn(direction) {
		play_sound('page', '');
		imb_check_end_game();
		$.mobile.changePage("#imb", {transition: "none", reverse: false, allowSamePageTransition: true});
		load_page(book_list[book_list_idx].page_list_idx + direction);
		document.getElementById('imb_page').scrollTop = 0;
		imb_load_social_groups({showNewTopic: true}); /* reload the discussion topics and chat settings */
	}
	function page_navigation(direction) {
		var book = book_list[book_list_idx];
		var page = book.page_list[book.page_list_idx];
		
		if (direction == -1) { // move back
			if (book_list[book_list_idx].page_list_idx <= 0) { // sanity check: first page already
				return;
			}
			if (!page.allow_last) { // navigation timer still running
				$("#popupMessage").popup("open");
				return;
			}
			if (page.timer_last > 1 && book.nav_popup == 'y') { // last timer was enabled and global nav popup is on
				$("#popupDialogLast").popup("open");
				return;
			}
		}
		if (direction == 1) { // move forward
			if (book_list[book_list_idx].page_list_idx >= (book_list[book_list_idx].page_list.length - 1)) { // sanity check: last page already
				return;
			}
			if (!page.allow_next) { // navigation timer still running
				$("#popupMessage").popup("open");
				return;
			}
			if (page.timer_next > 1 && book.nav_popup == 'y') { // next timer was enabled and global nav popup is on
				$("#popupDialogNext").popup("open");
				return;
			}
		}
		page_turn(direction);
	}
	// events
	$("#imb_btn_page_last").live(user_event, function () {
		page_navigation(-1);
	});
	$("#imb_btn_page_next").live(user_event, function () {
		page_navigation(1);
	});
	$("#imb_btn_dialog_last").live(user_event, function () { // what to do when dialog continue last is pressed
		page_turn(-1);
	});
	$("#imb_btn_dialog_next").live(user_event, function () { // what to do when dialog continue next is pressed
		page_turn(1);
	});

	// mobile gestures ----------------------------------------------------------------------------------------------------
	function isTouchDevice() {
		try {
			document.createEvent("TouchEvent");
			return true;
		} catch (e) {
			return false;
		}
	}

	function touchScroll(id) {
		if (isTouchDevice()) {
			var el = document.getElementById(id);
			var scrollStartPos = 0;

			document.getElementById(id).addEventListener("touchstart", function (event) {
				scrollStartPos = this.scrollTop + event.touches[0].pageY;
				event.preventDefault();
			}, false);

			document.getElementById(id).addEventListener("touchmove", function (event) {
				this.scrollTop = scrollStartPos - event.touches[0].pageY;
				event.preventDefault();
			}, false);
		}
	}
	touchScroll('imb_page');

	/*$("#imb_page").on("swiperight", function() {
	 if (book_list[book_list_idx].page_list_idx > 0) {
	 play_sound('page', '');
	 $.mobile.changePage("#imb", {transition: "none", reverse: true, allowSamePageTransition: true});
	 load_page(book_list[book_list_idx].page_list_idx - 1);
	 
	 document.getElementById('imb_page').scrollTop =0;
	 
	 }
	 });
	 /*$("#imb_page").on("swipeleft", function(){
	 if (book_list[book_list_idx].page_list_idx < (book_list[book_list_idx].page_list.length - 1)) {
	 play_sound('page', '');
	 $.mobile.changePage("#imb", {transition: "none", reverse: false, allowSamePageTransition: true});
	 load_page(book_list[book_list_idx].page_list_idx + 1);
	 
	 document.getElementById('imb_page').scrollTop =0;
	 
	 }
	 });*/

	/*Page swipes handled by custom touch handlers (due to issues with JQM swiping)*/
	var element = document.getElementById('imb_page');
	imb_swipe(element, "right", function () {
		page_navigation(-1);
	});
	imb_swipe(element, "left", function () {
		page_navigation(1);
	});

	$('#sort_title').click(function () {
		book_list_idx = -1;
		$('#bookshelf_book_list').empty();
		book_list.sort(function (a, b) {
			var titleA = a.title.toLowerCase(),
					titleB = b.title.toLowerCase();
			return (titleA < titleB) ? -1 : 1;
		})
		load_bookshelf(book_list, false);
	});
	$('#sort_id').click(function () {
		book_list_idx = -1;
		$('#bookshelf_book_list').empty();
		book_list.sort(function (a, b) {
			var idA = a.book_id,
					idB = b.book_id;
			return idA - idB;
		})
		load_bookshelf(book_list, false);
	});
	$('#sort_category').click(function () {
		book_list_idx = -1;
		$('#bookshelf_book_list').empty();
		book_list.sort(function (a, b) {
			var catA = a.location,
					catB = b.location;
			return (catA < catB) ? -1 : 1;
		})
		load_bookshelf(book_list, false);
	});

	// John's Drag and drop engine
	// ---------------------------------------------------------------------------------------------------------------------
	function dragEngine() {
		var replaceDrop = true;
		var longtouch = false;
		var offset = null;
		var timeout;
		var orig;
		var pos;

		//Starting a drag
		var start = function (e) {
			//Testing code. Remove later.
			$("#op").html("");

			//Store on-start positioning data in case it must be moved back at end
			//Uses values for absolute positioning because a draggable div will be absolute-positioned
			$(this).data("dragStartx", $(this).css("left"));
			$(this).data("dragStarty", $(this).css("top"));

			//Clone if necessary
			if ($(this).attr("clone") === "y" && !($(this).parent().hasClass("imb_container"))) {
				$(this).clone("true").prependTo($(this).parent());
			}

			//Reset size on pickup
			$(this).css({
				width: $(this).data("defaultWidth"),
				height: $(this).data("defaultHeight"),
				position: "absolute"
			});

			//Get initial positioning data for drag movement
			orig = e.originalEvent;
			pos = $(this).position();
			offset = {
				x: orig.changedTouches[0].pageX - pos.left,
				y: orig.changedTouches[0].pageY - pos.top
			};

			timeout = setTimeout(function () {
				//Flag that it was a long touch for the on-end events
				longtouch = true;

				//Logging that it's a long touch (as soon as timeout occurs).
				//For testing. Replace with an actual event if desired.
				//The "if" statement checks whether or not the div had been moved
				//more than 10 pixels
				if (Math.abs(offset.x - (orig.changedTouches[0].pageX - pos.left)) < 10 && Math.abs(offset.y - (orig.changedTouches[0].pageY - pos.top)) < 10) {
					$("#op").html("Long touch!");
				}

			}, 400);
		};

		//Move the div by changing its CSS
		var moveMe = function (e) {
			e.preventDefault();
			$(this).css({
				top: orig.changedTouches[0].pageY - offset.y,
				left: orig.changedTouches[0].pageX - offset.x
			});
		};

		//Dropping
		var drop = function (e) {

			//Snap into a container
			var $this = $(this);

			$(".imb_container").each(function () {
				//Get all the boolean checks out of the way first
				//Centering
				var thistop = $this.offset().top + ($this.height() / 2);
				var thistopb = (thistop > $(this).offset().top && thistop < $(this).offset().top + $(this).outerHeight(true));

				var thisleft = $this.offset().left + ($this.width() / 2);
				var thisleftb = (thisleft > $(this).offset().left && thisleft < $(this).offset().left + $(this).outerWidth(true));

				//Getting rid of "top" and "left" css allows appendTo() to work with absolute positioning.
				if (thistopb && thisleftb) {
					drop_object($this.attr("id"), $(this).attr("id"));
				}
			});

			//Replace the dragged div if it wasn't moved to an accepting container
			if (replaceDrop) {
				$this.css({
					left: $this.data("dragStartx"),
					top: $this.data("dragStarty"),
					position: "absolute"
				});

				//Scale if necessary
				if ($this.parent().attr("scale") === "y") {
					$this.css({
						width: $this.parent().width(),
						height: $this.parent().height()
					});
				}
			} else {
				//Reset for later
				replaceDrop = true;
			}

			//On-touch-end events for short and long touches
			if (longtouch) {
				//It was a long press
			} else {
				if (Math.abs(offset.x - (orig.changedTouches[0].pageX - pos.left)) < 10 && Math.abs(offset.y - (orig.changedTouches[0].pageY - pos.top)) < 10) {
					$("#op").html("Short touch!");

					$this.css({
						left: $this.data("defaultPosx"),
						top: $this.data("defaultPosy"),
						width: $this.data("defaultWidth"),
						height: $this.data("defaultHeight"),
						position: "absolute"
					});

					$this.parent().data("containing", $this.parent().data("containing") - 1);

					$this.prependTo($this.data("defaultParent"));
				}
			}

			longtouch = false;
			clearTimeout(timeout);
		}

		//Bind all drag functions
		$(document).on("touchstart", "div[draggable='true'], img[draggable='true']", start);
		$(document).on("touchmove", "div[draggable='true'], img[draggable='true']", moveMe);
		$(document).on("touchend", "div[draggable='true'], img[draggable='true']", drop);

		//Hackfix for select all in games
		$(document).on("dblclick", "#imb_graphic", function () {
			if (document.selection && document.selection.empty) {
				document.selection.empty();
			} else if (window.getSelection) {
				var sel = window.getSelection();
				sel.removeAllRanges();
			}
		});

		//Record original position and dimensions for all draggable elements
		$(this).data("defaultPosx", $(this).css("left"));
		$(this).data("defaultPosy", $(this).css("top"));
		$(this).data("defaultParent", $(this).parent());
		$(this).data("defaultWidth", $(this).css("width"));
		$(this).data("defaultHeight", $(this).css("height"));
	}
	;

	//dragEngine();
});

$(window).load(function () { // content loaded
	// display IE warning
	var ua = window.navigator.userAgent;
	var msie = ua.indexOf("MSIE ");
	var msie11 = ua.indexOf("Trident/");
	var msie12 = ua.indexOf("Edge/");
	if (msie > 0 || msie11 > 0 || msie12 > 0) {
		window.alert($.t("text.error-ie-unsupported"));
	}

	// disable speech recognition if not Chrome
	if (!('webkitSpeechRecognition' in window)) {
		$('#imb_btn_mic').css("visibility", "hidden");
	} else {
		// initialize the engine
		initialize_speech_recognition();

		// setup microphone toggle
		$("#imb_btn_mic").live(user_event, function () {
			toggle_speech_recorder();
		});
	}

	//play('welcome');
	$.ajaxSetup({async: false}); // ----------------------------------------------------------------------- FORCE SYNCHRONOUS AJAX CALLS!

	// if token is present then attemp token based authentication to bypass login screen
	if (token != '') { // use token-based authentication
		imb_login(getUrlVars()["user"], null, getUrlVars()["token"]);
	} else {
		$.mobile.changePage("#login_page", {transition: "flip", reverse: true});
		
		// LAST but not LEAST: if not served by imapbook server then bypass login screen and serve content locally
		if (location.hostname == '') {
			// skip login/registration
			load_bookshelf(null);
			if (experiment) { // bypass bookshelf display
				write_to_popup(0);
				load_book(0, 0);
			}
		}
	}
});