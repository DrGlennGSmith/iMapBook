/* iMapBook Application (IMB)
 * iMapBook LLC
 * All Rights Reserved
 * 04/08/2014
 * 
 * Version 2.5
 */

//----------------------------------------------------------------------------- finish login
// This function is called immediately after a successful login or registration
//------------------------------------------------------------------------------------------
function finish_login(login_data) {
	bookshelf_file = login_data.library; // use cohort's library file
	display_name = login_data.user_name; // save user name
	display_type = login_data.type_id; // save authorization bits
	points_max = login_data.points_max; // save database max points per cohort
	avatar = login_data.avatar; // set avatar
	if (debug) {
		console.log(login_data.books);
		console.log("DISPLAY TYPE: " + display_type);
	}
	if (!(display_type & 2)) { // remove goto window if not writer
		$(".summary_goto").remove();
	}
	if (!(display_type & 4) && !(display_type & 2)) {
		// only let admins and writers change these settings
		$(".admin-setup").remove();
	}
	load_bookshelf(login_data.books);
	if (experiment) { // bypass bookshelf and jump directly to book 1
		write_to_popup(0);
		load_book(0, 0);
	}
}
 
//----------------------------------------------------------------------------- load bookshelf
// This function is called each time the bookshelf is opened
// -------------------------------------------------------------------------------------------
function load_bookshelf(bkarr, firstLoad) {
    $.mobile.loading('show');
    if (typeof firstLoad == "undefined") {
        firstLoad = true;
    }
    var total_credits = 0;
    play_sound('bookshelf_open', ''); // play the bookshelf sound

    // archive the bookshelf open
    imb_archive(0, 0, 0, "BOOKSHELF OPEN", 200, 0);

    // stop any global page and state timers and auto updates
    window.clearTimeout(pageTimeoutVar);
    window.clearTimeout(pageTimerLast);
    window.clearTimeout(pageTimerNext);
    window.clearTimeout(timerVar);
    window.clearInterval(pageIntervalVar);
    window.clearInterval(intervalVar);
	socialManager.stopChatTimer();
	socialManager.stopMessageTimer();
    if (typeof customGame !== "undefined") {
        customGame.stop(function () {
            console.log("Stopping");
        });
    }

    if (book_list_idx < 0) { // load bookshelf content if no pages have been visited (should only happen once)
        imb_load_bookshelf_content(bkarr);
        // display books
        $.each(book_list, function (idx, book) {
            imb_book(idx, book.book_id);
            total_credits += parseInt(book.score); // sum up the individual book credits
            // create the book button DOM elements
			$("#bookshelf_book_list").append('<div class="bookshelf_book_container">' +
				'<a href="#" data-role="button" onclick="write_to_summary(' + idx + ')" class="bookshelf_book_button" data-position-to="window" data-transition="flip" data-theme="none" data-corners="false" data-shadow="false" data-inline="true">' +
					'<p class="bookshelf_book_title">' + book.title + '</p>' +
					'<div class="bookshelf_book_image">' +
						'<div class="bookshelf_book_cover_image" style="background-image:url(data/books/' + book.location + '/' + encodeURI(book.icon) + ');"></div>' +
						'<div class="bookshelf_book_cover_data">ID: ' + book.book_id + '</br>' + $.t('label.page') + ': ' + (book.page_list_idx + 1) + '</br>' + $.t('label.score') + ': ' + book.score + '</div>' +
					'</div>' +
				'</a></div>')
				.trigger('create');
        });
		// load character data for later
		// TODO: handle async properly
		imb_load_characters();

        // display achievements based on the score from all the books
        // Checks if this is a reload, first.
        if (firstLoad) {
			$("#bookshelf_welcome").text($.t('label.welcome') + ' ' + display_name);
			// update the number of credits, and show all achievements
			refresh_bookshelf_achievements(total_credits);
        }
    }
	else { // update total credits and last book visited info
        for (x = 0; x < book_list.length; x++) { // sum up the score from all the books
            total_credits += parseInt(book_list[x].score);
        }

        // update the recent book page and credits
        $("#bookshelf_book_list > div").each(function (idx) {
            if (idx == parseInt(book_list_idx)) {
                $(this).find(".imb_book_cover_data > b:eq(0)").html(book_list[book_list_idx].page_list_idx + 1); // first <b>
                $(this).find(".imb_book_cover_data > b:eq(1)").html(book_list[book_list_idx].score); // update the number of book credits
            }
        });

        // refresh the achievement list
		refresh_bookshelf_achievements(total_credits, true);
    }
    $.mobile.loading('hide');
    $.mobile.changePage("#bookshelf_page", {transition: "flip", reverse: true});
}


function refresh_bookshelf_achievements(credits, jQueryRefresh) {
	// update number of credits
	$("#bookshelf_credits").text(' ' + credits);
	// erase previously displayed achievements
	$(".bookshelf_achievement").remove();
	// add currently reached achievements
	var aList = $("#bookshelf_achievement_list");
	if (credits > 0) {
		aList.append('<li class="bookshelf_achievement"><h3>' + $.t('text.reader') + '</h3><p>' + $.t('text.readertext') + '</p></li>');
	}
	if (credits > 10) {
		aList.append('<li class="bookshelf_achievement"><h3>' + $.t('text.superreader') + '</h3><p>' + $.t('text.superreadertext') + '</p></li>');
	}
	// lastly, update the jQuery stuff
	if (jQueryRefresh) {
		aList.listview('refresh');
	}
}


//-----------------------------------------------------------------------------write book specific information to the popup panel
// This function is executed when the user clicks a book on the bookshelf... logic formerly found in load_book!  
//-------------------------------------------------------------------------------------------------------------------------------
function write_to_summary(bidx) {
    var book = book_list[bidx];
    if (debug)
        console.log("check_bookmark=" + bidx);
    book_list_idx = bidx; // set the global "last book opened" pointer

    if (book.page_list.length == 0) { // load pages for the book if they haven't been loaded yet
        imb_load_book_content(book.location);

        if (book.page_list.length == 0) {
            window.alert("ERROR: corrupted book.  Please, check the source files.");
            return;
        }

        imb_book_pages(bidx); // extract book page data from DB

        // pre-load sound files from state, lexicon words and responses
        $.each(book.page_list, function (idx) { // for each page
            $.each($(this).attr('state_list'), function () { // for each state
                var fname = $(this).attr('sound');
                var dsf = "data/sounds/" + book.location + "/" + fname + "." + codec;
                if (fname.length > 0) {
                    if (debug)
                        console.log("preloading state sound: " + dsf);
                    audio_player.src = dsf;
                    audio_player.preload = "auto"; // provide a hint to the browser to start loading files as soon as the page loads
                    audio_player.load();
                }
                $.each($(this).attr('lexicon').word_list, function () { // for each lexicon word
                    var fname = $(this).attr('sound');
                    var dsf = "data/sounds/" + book.location + "/" + fname + "." + codec;
                    if (fname.length > 0) {
                        if (debug)
                            console.log("preloding lexicon sound: " + dsf);
                        audio_player.src = dsf;
                        audio_player.preload = "auto";
                        audio_player.load();
                    }
                });
                $.each($(this).attr('transition_list'), function () { // for each transition
                    $.each($(this).attr('response_list'), function () { // for each response
                        var fname = $(this).attr('sound');
                        var dsf = "data/sounds/" + book.location + "/" + fname + "." + codec;
                        if (fname.length > 0) {
                            if (debug)
                                console.log("preloading response sound: " + dsf);
                            audio_player.src = dsf;
                            audio_player.preload = "auto";
                            audio_player.load();
                        }
                    });
                });
            });
        });

        // set progress_max to a total number of characters in all state.text fields (for progress bar)
        $.each(book.page_list, function () {
            $.each($(this).attr('state_list'), function () {
                book.progress_max += $(this).attr('text').length;
            });
        });

        interpolate(); // use linear interpolation to create any intermediate animation frames
    }
    var page = book.page_list[book.page_list_idx]; //sets last page visited
    if (!page)
        page = book.page_list[0]; //if the selected page doesn't exist anymore, set to first page
    var state = page.state_list[0];  //sets to first state

	// write the details from the book into the summary DOM
	$(".summary_title").text(book.title);
	$(".summary_author").text(book.author);
	$(".summary_abstract").empty().append(book.abstract_text);
	// add text for the page summary, and fix problems with definitions
    $(".summary_page_preview").empty().append(state.text)
		.find(".defWord").removeClass("defWord");

	$(".summary_jump_book_page").val("");
	$(".summary_btn_continue_book").parent().css("width", "100%");
	$(".summary_btn_reset_book").addClass("display_remove");
	// change the text to indicate whether we started reading or not
	if ((book.page_list_idx > 0) || (book.score > 0)) {
		$(".summary_preview_heading").text($.t("label.summary_review"));
		$(".summary_btn_continue_book").text($.t("label.read_continue"));
		// if we can reset the book, also show the button for that
		if (book.reset == 'y') {
			$(".summary_btn_continue_book").parent().css("width", "50%");
			$(".summary_btn_reset_book").removeClass("display_remove");
		}
	}
	else {
		// book has not been read yet
		$(".summary_preview_heading").text($.t("label.summary_preview"));
		$(".summary_btn_continue_book").text($.t("label.read_start"));
	}
	
	// move the components to the popup or page, depending on context,
	// and then load it
	if ($(window).width() < 550) {
		$.mobile.changePage("#summary_page", {transition: "pop", reverse: false});
	}
	else {
		$("#summary_popup").popup("open", {transition: "flip"});
	}
}

// ------------------------------------------------------------------------------
// Determines if there is a vertical scroll bar present or not.
// ------------------------------------------------------------------------------
function verticalScrollPresent() {
    return (document.documentElement.scrollHeight !== document.documentElement.clientHeight);
}

// ---------------------------------------------------------------------------- check book mark
// This function is used in conjunction with reset/continue logic of the bookshelf
// --------------------------------------------------------------------------------------------
/*function check_bookmark(bidx) {
    var book = book_list[bidx];
    if (debug)
        console.log("check_bookmark=" + bidx);
    book_list_idx = bidx; // set the global "last book opened" pointer

    if (book.reset == 'y' && (book.page_list_idx > 0 || book.score > 0)) {
        $.mobile.changePage("#bookmark", {transition: "pop"});
    } else {
        load_book(bidx, 0);
    }
}*/
// ---------------------------------------------------------------------------- load book
// This function is called when a book is clicked from a bookshelf
// --------------------------------------------------------------------------------------
function load_book(bidx, goto_pidx) {
    var book = book_list[bidx];

    if (debug)
        console.log("load_book=" + bidx + "/" + goto_pidx + "/" + book.location + " sound=" + book.sound);

    //Reset the registry
    for (var i = 0; i < book.registry.length; i++) {
        book.registry[i].value = book.regDefaults[i].value;
    }/*
     for (var i=0; i<state.image.hotspot_list.length; i++) {
     var obj = state.image.hotspot_list[i];
     obj.frame_list_idx = 0;
     }
     for (var i=0; i<state.image.container_list.length; i++) {
     var obj = state.image.container_list[i];
     obj.frame_list_idx = 0;
     }
     for (var i=0; i<state.image.draggable_list.length; i++) {
     var obj = state.image.draggable_list[i];
     obj.frame_list_idx = 0;
     }*/

    if (book.sound != '') { // play sound on book entry (if any)
        play_sound(book.sound, book.location);
    } else {
        play_sound('bookshelf_open', '');
    }

    // overwrite global language with values from the bookshelf
    language = book.language;
    // override the global TTS setting based on the individual book settings.
    if (book.tts == 'on' && location.hostname != '') { // if book TTS is on and not running locally
        sound_synthesis = 1; // TTS on
    } else {
        sound_synthesis = 0; // TTS off
    }
	
	// initialize the header details
	// TODO: this could be moved to the general log-in function
	if ((avatar) && (avatar.trim().length > 0)) {
		$("#imb_profile_image").attr("src", avatar);
	}
    $(".imb_title").text(book.title); // set the new book title
	$("#imb").data("title", book.title); // update the page title too
    $("#imb_gold_count").text(book.score);
	clear_game_message_list();
	
	// initialize the social group stuff
	imb_load_social_groups();
	
	// update the colors used by the eReader; remove the old theme and apply the new one
	var oldTheme = $("#imb").data("theme");
	$("#imb").attr("data-theme", book.color_theme).data("theme", book.color_theme)
		.removeClass("ui-page-theme-" + oldTheme).addClass("ui-page-theme-" + book.color_theme);
	$(".book_recolor").attr("data-theme", book.color_theme).data("theme", book.color_theme)
		.attr("data-form", "ui-body-" + book.color_theme).data("form", book.color_theme)
		.removeClass("ui-body-" + oldTheme).addClass("ui-body-" + book.color_theme);

	// load the eReader
    $.mobile.changePage("#imb", {transition: "none"});

    if (goto_pidx >= 0 && goto_pidx < book.page_list.length) {
        load_page(goto_pidx); // load the page pointed to by goto_page
    } else {
        load_page(book.page_list_idx); // load the last page visited
    }
	
	// refresh the list of unread messages, particularly discussion topics
	socialManager.initTopics(book.discussion_list);
	socialManager.startMessageTimer();
}
//--- TODO: finish this
function clear_game_message_list() {
    $("#imb_game_display_content_top_text").html(""); // clear the feedback text
	$("#imb_game_messages_container").empty();
}

//----------------------------------------------------------------------------- load page
// This function is called each time a new page is opened
// --------------------------------------------------------------------------------------
function load_page(pidx) {
    var book = book_list[book_list_idx];
	// adjust the page index so it only allows pages that currently exist in the book
	if (pidx > book.page_list.length) {
		pidx = book.page_list.length - 1;
	}
	else if (pidx < 0) {
		pidx = 0;
	}
	// create link to page object
    var page = book.page_list[pidx];
    var state = page.state_list[page.state_list_idx]; // create link to the current state object
    book.page_list_idx = pidx; // set page index
    if (debug)
        console.log("load_page=" + pidx + " into state=" + page.state_list_idx + " completed=" + page.complete + " with progress=" + book.progress_cnt + " / " + book.progress_max);

    // stop the global page timer and interval
    window.clearTimeout(pageTimeoutVar);
    window.clearTimeout(pageTimerLast);
    window.clearTimeout(pageTimerNext);
    window.clearInterval(pageIntervalVar);
	// global nav timer overwrites individual page timers
    if ((page.timer_last > 1) || (book.nav_timer > 0)) {
		if (book.nav_timer > 1) { // use global default
			page.allow_last = false; // question backward animation
			pageTimerLast = setTimeout("page_timer_last_expired()", book.nav_timer * 1000); // call function on timeout
		} else if (book.nav_timer != 1) { // use page timer
			page.allow_last = false; // question backward animation
			pageTimerLast = setTimeout("page_timer_last_expired()", page.timer_last * 1000); // call function on timeout
		}
	}
	// global nav timer overwrites individual page timers
	if ((page.timer_next > 1) || (book.nav_timer > 0)) {
		if (book.nav_timer > 1)  { // use global default
			page.allow_next = false; // question forward animation
			pageTimerNext = setTimeout("page_timer_next_expired()", book.nav_timer * 1000); // call function on timeout
		} else if (book.nav_timer != 1) { // use page timer
			page.allow_next = false; // question forward animation
			pageTimerNext = setTimeout("page_timer_next_expired()", page.timer_next * 1000); // call function on timeout
		}
	}
    // clear the display page timeout
    $("#imb_footer_page_timeout").html("&nbsp;");
    if (page.timeout > 0 && (page.type == 1 || state.transition_list.length > 0)) { // start page timer if there is a timeout and this is text page or if the current state is not an exit state
        pageTimeoutVar = setTimeout("page_timeout_expired()", page.timeout * 1000); // call function on timeout
        progress_counter("#imb_footer_page_timeout", -1, page.timeout, 0); // initialize the display timeout
        pageIntervalVar = setInterval("progress_counter(\"#imb_footer_page_timeout\", -1, " + page.timeout + ", 0)", 1000); // update every 1 second
    }

    // archive the page turn
    imb_archive(book.book_id, pidx, page.state_list_idx, "PAGE TURN", 0, book.score);

    // clear transition and response counts for all states in this page - YOU ALWAYS RESET A GAME IN PROGRESS IF YOU LEAVE THAT PAGE!
    page.score = 0;
    $.each(page.state_list, function () {
        $.each($(this).attr('transition_list'), function () {
            $.each($(this).attr('response_list'), function () {
                $(this).attr('count', 0);
            });
        });
    });

    // determine the number of characters up to and including the current page (for progress bar)
    book.progress_cnt = 0;
    $.each(book.page_list, function (idx) {
        if (idx <= pidx) {
            $.each($(this).attr('state_list'), function () {
                book.progress_cnt += $(this).attr('text').length;
            });
        }
    });

    // select the starting state based on the setting of page.complete: first state if page.complete=0 or last state otherwise
    if (page.complete > 0) {
        var finalsi = page.state_list.length - 1;
        for (var si = 0; si < page.state_list.length; si++) { // find the final state (with 0 transitions) - there should only be one
            if (page.state_list[si].transition_list.length == 0) {
                finalsi = si;
            }
        }
        page.state_list_idx = finalsi;
    } else {
        page.state_list_idx = 0; // this is always the start state
    }
	
	// display chapter label
    if (page.chapter_number != "") {
		$("#imb_footer_chapter").html( ((Number.isInteger(Number.parseInt(page.chapter_number))) ? $.t('label.chapter') + " " : "") + page.chapter_number );
	}
	// display page number / status
	$("#imb_footer_page_number").html($.t('label.page') + " " + (book.page_list_idx + 1) + " / " + book.page_list.length);
	
    switch (page.type) {
        case '1': // text only
            $("#imb_page").show();
            $("#imb_game").hide();
            $("#imb_graphic").hide();
            $("#imb_silver_coins").hide();
            break;
        case '2': // game page
            $("#imb_page").hide();
            $("#imb_game").show();
			$("#imb_game_messages_container").show();
			// move the graphics into the inference-game section
			$("#imb_graphic").show()
				.prependTo("#imb_game")
				.removeClass("game_graphics_container_full").addClass("game_graphics_container_partial");
            imb_display_objects(); // display any collected object before entering a state machine
			clear_game_message_list();
            $("#imb_silver_count").text(page.score);
            $("#imb_silver_coins").show();
            break;
        case '3': // graphic game page
            $("#imb_page").hide();
            $("#imb_game").hide();
			// move the graphics into the main page section
			$("#imb_graphic").show()
				.appendTo("#imb_content")
				.addClass("game_graphics_container_full").removeClass("game_graphics_container_partial");
            $("#imb_silver_coins").show();
            break;
        case '4': // lexicon only page
            $("#imb_page").hide();
            $("#imb_game").show();
			$("#imb_graphic").hide();
			$("#imb_game_messages_container").hide();
			clear_game_message_list();
            $("#imb_silver_count").text(page.score);
            $("#imb_silver_coins").show();
            break;
        default:
            $("#imb_page").show();
            $("#imb_game").hide();
            $("#imb_graphic").hide();
            $("#imb_silver_count").text(page.score);
            $("#imb_silver_coins").show();
            break;
    }

    if (page.hidden == "y") { // hide game features if page hidden flag is set
        console.log("load_page: HIDDEN GAME!");
        $(".imb_game_data").hide(); // header and footer data sections
    } else {
        console.log("load_page: UNHIDDEN GAME!");
        $(".imb_game_data").show(); // header and footer data sections
    }

    progress_bar(); // update the progress bar

    // take care of the page navigation buttons
    if ((pidx == 0) || (page.timer_last == 0 && book.nav_timer < 2)) { // this is the first page or not allowed to go back and global timer is off
        $("#imb_btn_page_last").addClass("display_invisible");
    } else {
        $("#imb_btn_page_last").removeClass("display_invisible");
    }
    if ((pidx == (book.page_list.length - 1)) || (page.timer_next == 0)) { // this is the last page or not allowed to go forward
        $("#imb_btn_page_next").addClass("display_invisible").removeClass("animate_button");
    } else {
        $("#imb_btn_page_next").removeClass("display_invisible").removeClass("animate_button");
    }
	// if this is an experiment then hide all header buttons and title along with other things
    if (experiment) {
       $("#imb_header").hide();
       $("#imb_footer_content").hide();
    }
	
    // now enter the state machine at the current state
    load_state(page.state_list_idx);
}
//------------------------------------------------------------------------------ load and process the state
// This function loads and processes a new state
//----------------------------------------------------------------------------------------------------------
function load_state(sid) {
    var book = book_list[book_list_idx];
    var page = book.page_list[book.page_list_idx];
    var state = page.state_list[sid];
    page.state_list_idx = sid;
    hack_drag_id = '';
    if (debug)
        console.log("load_state: sid=" + sid + " (sound=" + state.sound + ") book_score=" + book.score + " page_score=" + page.score);
    if (state.sound != '') {
        play_sound(state.sound, book.location);
    }
    //$("#imb_game_display_content_top_text").append("<br>"); // put a line break between each state
    //$("#imb_game_display_content_top_text").html(""); // clear the feedback text on each state transition

    for (var i = 0; i < state.transition_list.length; i++) {
        var transition = state.transition_list[i];
        var variable = book.registry[transition.variable_idx];
        for (var j = 0; j < transition.response_list.length; j++) {
            var response = transition.response_list[j];
            if (response.image_object_idx != -1) {
                var num_frames = state.image.hotspot_list[parseInt(response.image_object_idx)].frame_list.length;
                var new_frame_idx = variable.value - variable.min;
                var imgobj = state.image.hotspot_list[parseInt(response.image_object_idx)];
                var frame = imgobj.frame_list[new_frame_idx];
                imgobj.frame_list_idx = new_frame_idx;

                imb_update_variable_frame(book, frame, response.image_object_idx);
            }
        }
    }
    //Reset variables and image objects on load_state
    /*for (var i=0; i<book.registry.length; i++) {
     book.registry[i].value = book.regDefaults[i].value;
     }
     for (var i=0; i<state.image.hotspot_list.length; i++) {
     var obj = state.image.hotspot_list[i];
     obj.frame_list_idx = 0;
     }
     for (var i=0; i<state.image.container_list.length; i++) {
     var obj = state.image.container_list[i];
     obj.frame_list_idx = 0;
     }
     for (var i=0; i<state.image.draggable_list.length; i++) {
     var obj = state.image.draggable_list[i];
     obj.frame_list_idx = 0;
     }*/

    // stop any global state timers and auto updates
    window.clearTimeout(timerVar);
    window.clearInterval(intervalVar);
    window.clearInterval(intervalAnimateVar);
    if (typeof customGame !== "undefined") {
        customGame.stop(function () {
            console.log("Stopping");
        });
    }

    // process any automatic transitions such as timers or random jumps
    // ----------------------------------------------------------------
    var newsid = process_auto_transitions(sid);
    if (newsid != sid) { // we just jumped on to another state!
        load_state(newsid);
        return;
    }

    // start animation loop IF there is an Image object with a valid file name
    if (state.image.file_name != '') {
        if (state.image.hotspot_list.length > 0 || state.image.draggable_list.length > 0 || state.image.container_list.length > 0) {
            $.each(state.image.hotspot_list, function (idx, imgobj) {
                imgobj.frame_list_idx = 0; // always start at first frame
            });
            $.each(state.image.draggable_list, function (idx, imgobj) {
                imgobj.frame_list_idx = 0; // always start at first frame
            });
            $.each(state.image.container_list, function (idx, imgobj) {
                imgobj.frame_list_idx = 0; // always start at first frame
            });
            start_animation();
        }
    }

    // clear any display timers or count downs
    $("#imb_footer_timer").html("&nbsp;");
    $("#imb_footer_countdown").html("&nbsp;");

	// clear the definition pop-up
	$('#slideDef').hide();
	
    if (debug) { // fortify title with some debugging info
        $(".imb_title").html(book.title + " -- DEBUG [" + browser + "][" + bookshelf_file + "][" + codec + "]" + "[page:" + book.page_list_idx + "][state:" + page.state_list_idx + " [" + state.label + "]]");
    }

    // first decide if page progress is possible
    // -----------------------------------------
    if (state.transition_list.length == 0) { // if state has no transitions then its the final state
        if ((book.page_list_idx < (book.page_list.length - 1)) && (page.timer_next != 0)) {
			// display link to next page (if any left)
			// and animate the arrow if this is a game page
            $("#imb_btn_page_next").removeClass("display_invisible")
				.toggleClass("animate_button", (page.type != 1));
        }
    } else { // hide next page button
        $("#imb_btn_page_next").addClass("display_invisible"); // don't display link to next page if state has transitions
    }

    if (page.type == 1) { // page only has text - can terminate here
        imb_display_page(state.text);
        return;
    } else {
        // play state text using TTS engine (if on)
        // play(state.text);
    }

    // GAME PROCESSING STARTS HERE
    // ---------------------------
    if (state.transition_list.length == 0) { // if state has no transitions then its the last state in this game and we update the total book score and archive it in a DB
        page.complete++; // increment the number of times this page was completed and create DB event
        imb_archive(book.book_id, book.page_list_idx, page.state_list_idx, "PAGE COMPLETE", 102, page.complete);
        book.score = parseInt(book.score) + parseInt(page.score);
        imb_archive(book.book_id, book.page_list_idx, page.state_list_idx, "BOOK SCORE", 0, book.score);
    } else { // reset all transition and response counts in case we visited this state already
        $.each(state.transition_list, function (idx, transition) { // for each transition
            transition.count = 0;
            transition.mask = 0;
            // also reset all response counts in this state
            $.each(transition.response_list, function (idx, response) { // for each response
                response.count = 0;
            });
        });
    }

    // display state content changes
    $("#imb_game_display_content_bottom_text").html("");
	add_game_message(state.text, get_book_avatar(page, state.char_idx, state.avatar_idx)); // last state success message
    if (state.transition_list.length == 0) { // if state has no transitions then its the final state
        imb_display_feedback(2); // feedback message
        $("#imb_game_display_content_bottom_text").text(""); // clear the input area
    } else { // the game is on
        imb_display_feedback(1); // feedback message
        imb_display_word('', 0); // lexicon message
    }
	
	// add the background and hotspot images
	var gfxContainer = $("#imb_graphic");
    if ((page.type == 2) || (page.type == 3) || (page.type == 4)) {
		// replace the previous background image
		if (state.image.file_name != '') {
			gfxContainer.css("background-image", "url('data/books/" + book.location + "/" + encodeURI(state.image.file_name) + "')");
		}
		
		// remove previous objects (images and hotspots)
		gfxContainer.empty();
		
		// add any image objects
        $.each(state.image.hotspot_list, function (idx, hotspot) {
            var frame = hotspot.frame_list[hotspot.frame_list_idx];
            gfxContainer.append("<div word=\"" + frame.word + "\" id=\"hotspot" + idx + "\" class=\"imb_hotspot\" style=\"opacity:" + (frame.opacity / 100) + "; width:" + frame.width + "%; height:" + frame.height + "%;top:" + frame.yloc + "%; left:" + frame.xloc + "%;\"></div>");
            if (frame.file_name != '') { // hotspot has a background image
                $("#hotspot" + idx).css("background-image", "url(data/books/" + book.location + "/" + encodeURI(frame.file_name) + ")");
            } else { // hotspot has a background color
                $("#hotspot" + idx).css("background-color", "red");
            }
        });
        $.each(state.image.draggable_list, function (idx, draggable) {
            var frame = draggable.frame_list[draggable.frame_list_idx];
            gfxContainer.append("<div clone=\"" + draggable.clone + "\" word=\"" + frame.word + "\" id=\"draggable" + idx + "\" draggable=\"true\" ondragstart=\"drag(event)\" class=\"imb_draggable\" style=\"background-image:url(data/books/" + book.location + "/" + encodeURI(frame.file_name) + "); opacity:" + (frame.opacity / 100) + "; width:" + frame.width + "%; height:" + frame.height + "%;top:" + frame.yloc + "%; left:" + frame.xloc + "%;\"></div>");
        });
        $.each(state.image.container_list, function (idx, container) {
            var frame = container.frame_list[container.frame_list_idx];
            gfxContainer.append("<div count=\"" + container.count + "\" lock=\"" + container.lock + "\" width=\"" + frame.width + "\" height=\"" + frame.height + "\" word=\"" + frame.word + "\" id=\"container" + idx + "\" ondrop=\"drop(event)\" ondragover=\"allowDrop(event)\" class=\"imb_container\" style=\"opacity:" + (frame.opacity / 100) + "; width:" + frame.width + "%; height:" + frame.height + "%;top:" + frame.yloc + "%; left:" + frame.xloc + "%;\"></div>");
            if (frame.file_name != '') { // container has a background image
                $("#container" + idx).css("background-image", "url(data/books/" + book.location + "/" + encodeURI(frame.file_name) + ")");
            } else { // container has a frame
                $("#container" + idx).css("border-style", "dashed")
					.css("border-width", "1px")
					.css("border-color", "#444444");
            }
        });
	}

    if ((page.type == 2) || (page.type == 4)) { // clear any existing lexicon words and display new ones (if present)
        $("#imb_game_words_matrix").empty();
        if (state.lexicon.word_list.length > 0) { // show updated lexicon
            // display lexicon label if it exists
            if (state.lexicon.label != '') {
                $("#imb_game_words_matrix").append(state.lexicon.label + "</br></br>");
            }
            $.each(state.lexicon.word_list, function () {
                var word = $(this).attr('word');
                var matched_definition = false;
                $.each(book.definition_list, function () { // see if this is a dictionary word
                    if (word.toLowerCase() == $(this).attr('word').toLowerCase()) {
                        matched_definition = true;
                        return false;
                    }
                });

                if (matched_definition) { // format dictionary words in italics
                    var sts = ' style="font-style:italic;';
                } else {
                    var sts = ' style="font-style:normal;';
                }

                sts = sts + 'color:' + imb_type_color($(this).attr('type'), 'code') + ';"'; // set display colors

                if (page.chapter_number == 'Test') { // this is test lexicon so break between each item
                    if ($(this).attr('type') != '101') { // break before each new item
                        $("#imb_game_words_matrix").append("</br>");
                    }
                }

                if ($(this).attr('type') != '101') {
                    $("#imb_game_words_matrix").append("<input type=\"button\" class=\"imb_key\"" + sts + " value=\"" + $(this).attr('word') + "\" on" + user_event + "=\"btn_press('" + $(this).attr('word').replace(/\'/g, '\\\'') + "', '" + $(this).attr('sound') + "', " + $(this).attr('type') + ");\"/>");
                } else {
                    if (state.lexicon.word_list.length == 1) { // if this is the only one item then automatically display a text box
                        $("#imb_game_words_matrix").append($(this).attr('word') + " <textarea class=\"imb_text_key\" rows=\"1\" cols=\"40\" onBlur=\"btn_press(this.value.replace(/\'/g, '\\\''), '" + $(this).attr('sound') + "', " + $(this).attr('type') + ");this.value='';\"></textarea>");
                    } else {
                        $("#imb_game_words_matrix").append($(this).attr('word') + " <input type=\"text\" class=\"imb_input_key\" size=\"40\" onBlur=\"btn_press(this.value.replace(/\'/g, '\\\''), '" + $(this).attr('sound') + "', " + $(this).attr('type') + ");this.value='';\"/>");
                    }
                }
            });

            if (page.chapter_number == 'Test') { // end Test items with a break
                $("#imb_game_words_matrix").append("</br></br>");
            }

            // add the submit button to the end IF ANY lexicon words do not have matching response with asub set to 'y'!
            var subme = false;
            var match_found = false;
            $.each(state.lexicon.word_list, function (idx, word) {
                match_found = false;
                $.each(state.transition_list, function (idx, transition) {
                    $.each(transition.response_list, function (idx, response) { // see if any autosub response words match
                        if (response.asub == 'y' && word.word.toLowerCase() == response.text_input.toLowerCase()) {
                            match_found = true;
                            return false;
                        }
                    });
                });
                if (match_found == false) { // did not find any asub matches for this lexicon word
                    subme = true;
                    return false;
                }
            });
            if (subme) {
                $("#imb_game_words_matrix").append(" <a href=\"#\" data-role=\"button\" class=\"imb_key \" id=\"imb_btn_submit\" style=\"background-color:black;color:white\" >&check;</a>");
            }
        }
		else { // just the label
            if (state.lexicon.label != '') {
                $("#imb_game_words_matrix").append(state.lexicon.label + "</br></br>");
            }
        }
    }

    if (((page.type == "2") || (page.type == "3")) && (state.url !== '')) {
        //I have the current state already. I just need to get the "success" transition which is going to be type:1
        var success_state = 0;//0 is a fallback
        for (var i = 0; i < state.transition_list.length; i++) {
            if (state.transition_list[i].type == "1") {
                success_state = state.transition_list[i].next_state_idx;
                break;
            }
        }
		
		// clear previous images and hotspots, and add a new background image
		gfxContainer.empty()
			.css("background-image", "url('data/books/" + book.location + "/" + encodeURI(state.image.file_name) + "')");
		
        //load_state_game now has two callback parameters. The first is for success and the second is for failure.
        //We will use btn_submit with the first transition and first response to handle the first variable update,
        //	and the second transition first response to handle the second variable update. These correspond to success and failure.
        load_state_game(state.url, function () {
            imb_display_word("success", 0);
        }, function () {
            imb_display_word("failure", 0);
        });
    }

    // this is where we present optional replay popup
    if (page.complete > 0) {
        if (book.replay == 'y') {
            //if (confirm("Would you like to play again?")) {
            jqm_alert($.t("text.game-done"), $.t("text.game-done-score") + ' ' + book.score + '. ' + $.t("text.game-done-again"), function () { // reset page score, #complete and all response counts for this page
                page.score = 0;
                page.complete = 0;
                $.each(page.state_list, function (idx, st) { // for each state)
                    $.each(st.transition_list, function (idx, tr) { // for each transition
                        $.each(tr.response_list, function (idx, re) { // for each response
                            re.count = 0;
                        });
                    });
                });
                next_state_idx = 0;  // go to state 1
                $("#imb_game_display_content_bottom_text").html("");
                load_state(next_state_idx);
            }, function () { // do nothing
            }, $.t("label.yes"), $.t("label.no"));
        }
    }
}

//-------------------------------------------------------------------------------
// This function generates the proper indentation and formating to the loaded text page
//--------------------------------------------------------------------------------

function parseWhitespace(string) {

    //replace preexsting <p> tags in the file text so that the algorithm works better
    var text = string.replace(/<\/p>/g, '\n');
	text = text.replace(/<p>/g, '\t');
	
	//now replace tabs and newlines with appropriate tags
	text = text.replace(/\n/g, '</p><p>');
	//text = text.replace(/\t/g, "<span class='page_tab'></span>");
	text = text.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
	
	//if there's at least four consecutive space characters, assume it's an indent
	//text = text.replace(/\s{4,}/g, "<span class='page_tab'></span>");
	text = text.replace(/\s{4,}/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
    return text;

    //places used
    //ajax.js line 149  x  (writing text to the xml files)
    //imb.js 1010 (for index.html) (writing text from xml file to the ebook page)
}

// ------------------------------------------------------------------------------- interpolate
// This function is called once per book to interpolate as needed between any animation frames
// ---------------------------------------------------------------------------------------------------------
function lerp(a, b, t) {
    a = parseInt(a);
    b = parseInt(b);

    if (a == b)
        return a;
    var x = Math.floor(a + t * (b - a));
    return x;
}
function interpolate() {
    if (debug)
        console.log("interpolate");
    var book = book_list[book_list_idx];
    $.each(book.page_list, function (idx, page) {
        if (page.type == 2 || page.type == 3 || page.type == 4) { // game page
            $.each(page.state_list, function (idx, state) { // state
                $.each(state.image.hotspot_list, function (idx, imgobj) {
                    if (imgobj.loop > 0) {
                        var frames_num = FPS * imgobj.loop; // total number of frames needed: fps * animation length
                        var interval_num = imgobj.frame_list.length - 1; // number of intervals
                        var interval_frames_num = Math.floor((frames_num - imgobj.frame_list.length) / interval_num); // number of frames per interval

                        ffr = 0; // first frame
                        for (var j = 0; j < interval_num; j++) { // for each interval
                            var a = imgobj.frame_list[ffr];
                            var b = imgobj.frame_list[ffr + 1];

                            for (var i = 1; i <= interval_frames_num; i++) { // for each intermediate frame in interval
                                var t = i / (interval_frames_num + 1);
                                var iframe = new Frame(// new intermediate frame between a and b
                                        a.file_name,
                                        lerp(a.opacity, b.opacity, t),
                                        lerp(a.xloc, b.xloc, t),
                                        lerp(a.yloc, b.yloc, t),
                                        lerp(a.width, b.width, t),
                                        lerp(a.height, b.height, t),
                                        a.word,
                                        a.text);

                                ffr++
                                imgobj.frame_list.splice(ffr, 0, iframe); // insert the new intermediate frame
                            }
                            ffr++; // last.b becomes next.a
                        }
                    }
                });
                $.each(state.image.draggable_list, function (idx, imgobj) {
                    if (imgobj.loop > 0) {
                        var frames_num = FPS * imgobj.loop; // total number of frames needed: fps * animation length
                        var interval_num = imgobj.frame_list.length - 1; // number of intervals
                        var interval_frames_num = Math.floor((frames_num - imgobj.frame_list.length) / interval_num); // number of frames per interval

                        ffr = 0; // first frame
                        for (var j = 1; j <= interval_num; j++) { // for each interval
                            var a = imgobj.frame_list[ffr];
                            var b = imgobj.frame_list[ffr + 1];

                            for (var i = 1; i <= interval_frames_num; i++) { // for each intermediate frame in interval
                                var t = i / (interval_frames_num + 1);
                                var iframe = new Frame(// new intermediate frame between a and b
                                        a.file_name,
                                        lerp(a.opacity, b.opacity, t),
                                        lerp(a.xloc, b.xloc, t),
                                        lerp(a.yloc, b.yloc, t),
                                        lerp(a.width, b.width, t),
                                        lerp(a.height, b.height, t),
                                        a.word,
                                        a.text);

                                ffr++
                                imgobj.frame_list.splice(ffr, 0, iframe); // insert the new intermediate frame
                            }
                            ffr++; // last.b becomes next.a
                        }
                    }
                });
                $.each(state.image.container_list, function (idx, imgobj) {
                    if (imgobj.loop > 0) {
                        var frames_num = FPS * imgobj.loop; // total number of frames needed: fps * animation length
                        var interval_num = imgobj.frame_list.length - 1; // number of intervals
                        var interval_frames_num = Math.floor((frames_num - imgobj.frame_list.length) / interval_num); // number of frames per interval

                        ffr = 0; // first frame
                        for (var j = 1; j <= interval_num; j++) { // for each interval
                            var a = imgobj.frame_list[ffr];
                            var b = imgobj.frame_list[ffr + 1];
                            for (var i = 1; i <= interval_frames_num; i++) { // for each intermediate frame in interval
                                var t = i / (interval_frames_num + 1);
                                var iframe = new Frame(// new intermediate frame between a and b
                                        a.file_name,
                                        lerp(a.opacity, b.opacity, t),
                                        lerp(a.xloc, b.xloc, t),
                                        lerp(a.yloc, b.yloc, t),
                                        lerp(a.width, b.width, t),
                                        lerp(a.height, b.height, t),
                                        a.word,
                                        a.text);

                                ffr++
                                imgobj.frame_list.splice(ffr, 0, iframe); // insert the new intermediate frame
                            }
                            ffr++; // last.b becomes next.a
                        }
                    }
                });
            });
        }
    });
}
// ------------------------------------------------------------------------------- animate
// This function is called when new state is opened to start the animation interval
// ---------------------------------------------------------------------------------------------------------
function start_animation() {
    if (debug)
        console.log("start_animation");
    intervalAnimateVar = setInterval("animate()", Math.floor(1000 / FPS)); // effective rate is 20 fps.
}
// ------------------------------------------------------------------------------- animate
// This function is called by the setInterval every 50ms (fps=20)
// ---------------------------------------------------------------------------------------------------------
function animate() {
    //if (debug) console.log("animate");
    var book = book_list[book_list_idx];
    var page = book.page_list[book.page_list_idx];
    var state = page.state_list[page.state_list_idx];
    $.each(state.image.hotspot_list, function (idx, imgobj) {
        if (imgobj.loop > 0 && imgobj.pause == 0) { // animated hotspot object
            animate_object(document.getElementById("hotspot" + idx), imgobj);
        }
    });
    $.each(state.image.draggable_list, function (idx, imgobj) {
        if (imgobj.loop > 0 && imgobj.pause == 0) { // animated draggable object
            animate_object(document.getElementById("draggable" + idx), imgobj);
        }
    });
    $.each(state.image.container_list, function (idx, imgobj) {
        if (imgobj.loop > 0 && imgobj.pause == 0) { // animated container object
            animate_object(document.getElementById("container" + idx), imgobj);
        }
    });
}
// ------------------------------------------------------------------------------- animate
// This function is called to update the current image object with the next frame (if any)
// ---------------------------------------------------------------------------------------------------------
function animate_object(obj, imgobj) {
    //if (debug) console.log("OBJECT:" + obj.id + " IMGOBJECT:" + imgobj.frame_list_idx);
    var book = book_list[book_list_idx];
    var frame_num = imgobj.frame_list.length;

    if (frame_num > 1) { // have at least 2 frames
        imgobj.frame_list_idx++; // next frame
        if (imgobj.frame_list_idx >= frame_num) { // return to frame 0
            imgobj.frame_list_idx = 0;
        }
        var nextimgobj = imgobj.frame_list[imgobj.frame_list_idx];
        $(obj).attr("word", nextimgobj.word);
        $(obj).css("left", nextimgobj.xloc + "%");
        $(obj).css("top", nextimgobj.yloc + "%");
        $(obj).css("width", nextimgobj.width + "%");
        $(obj).css("height", nextimgobj.height + "%");
        $(obj).css("opacity", nextimgobj.opacity / 100);
        $(obj).css("background-image", "url(data/books/" + book.location + "/" + encodeURI(nextimgobj.file_name) + ")");
    }
}

//--------------------------------------------------------------------------------_ process_auto_transitions
// This function gets called every time a new state is loaded to process ANY auto transitions
//----------------------------------------------------------------------------------------------------------
function process_auto_transitions(sid) {
    var book = book_list[book_list_idx];
    var page = book.page_list[book.page_list_idx];
    var state = page.state_list[sid];
    var seconds = -1;
    var jumper = -1;
    var jump_state_idx = 0;

    // TIMER transitions
    $.each(state.transition_list, function (idx, transition) { // for each transition in this state
        if (transition.type == 3) { // if timer type then trigger hold the number of seconds
            seconds = transition.trigger;
            return false; // terminate loop - only process first timer (if any)
        }
    });
    if (seconds != -1) { // START the state timer and display updates
        timerVar = setTimeout("state_timer_expired(" + sid + ")", seconds * 1000);
        progress_counter("#imb_footer_timer", -1, seconds, 0); // initialize the display count
        intervalVar = setInterval("progress_counter(\"#imb_footer_timer\", -1, " + seconds + ", 0)", 1000);
    }

    // RANDOM transitions
    $.each(state.transition_list, function (idx, transition) { // for each transition in this state
        if (transition.type == 4) { // if random type then trigger holds the number of random states
            jumper = transition.trigger;
            jump_state_idx = transition.next_state_idx;
            return false; // terminate loop - only process first random jump (if any)
        }
    });
    if (jumper != -1) { // jump to a state listed in transition.next_state_idx adjusted by a random value (0 .. jumper)
        sid = parseInt(jump_state_idx) + Math.floor(Math.random() * jumper);
        if (debug)
            console.log("RANDOM JUMP: " + sid);
    }

    if (debug)
        console.log("process_auto_transition: sid=" + sid);
    return sid;
}
//-------------------------------------------------------------------------------------- page_timeout_expired
// This function gets called when global timer expires to process the timeout transition
//----------------------------------------------------------------------------------------------------------
function page_timeout_expired() {
    var book = book_list[book_list_idx];
    var page = book.page_list[book.page_list_idx];
    var state = page.state_list[page.state_list_idx];
    var last_sid = page.state_list.length - 1;
    // stop the global page timer
    if (debug)
        console.log("page_timeout_expired: last_state_idx=" + last_sid);
    window.clearTimeout(pageTimeoutVar);
    window.clearInterval(pageIntervalVar);
    // clear the display timers
    $("#imb_footer_page_timeout").html("&nbsp;");
    // don't do anything unless current state has transitions (not an exit state)
    if (page.type == 1 || state.transition_list.length > 0) {
        imb_archive(book.book_id, book.page_list_idx, page.state_list_idx, 'TIME OUT', 2, 0); // timed out
        load_state(last_sid); // force transition to the last state now
    }
}
//-------------------------------------------------------------------------------------- page_timer_last_expired
// This function gets called when  page navigation timer expires
//----------------------------------------------------------------------------------------------------------
function page_timer_last_expired() {
    var book = book_list[book_list_idx];
    var page = book.page_list[book.page_list_idx];

    page.allow_last = true;
    window.clearTimeout(pageTimerLast);
    //console.log("timer_expired!");
}
//-------------------------------------------------------------------------------------- page_timer_next_expired
// This function gets called when  page navigation timer expires
//----------------------------------------------------------------------------------------------------------
function page_timer_next_expired() {
    var book = book_list[book_list_idx];
    var page = book.page_list[book.page_list_idx];

    page.allow_next = true;
    window.clearTimeout(pageTimerNext);
    //console.log("timer_expired!");
}
//-------------------------------------------------------------------------------------- state_timer_expired
// This function gets called when global timer expires to process the timer transition
//----------------------------------------------------------------------------------------------------------
function state_timer_expired(sid) {
    var book = book_list[book_list_idx];
    var page = book.page_list[book.page_list_idx];
    var state = page.state_list[sid];
    if (debug)
        console.log("timer_expired: state_idx=" + sid);
    // stop any global state timers and auto updates
    window.clearTimeout(timerVar);
    window.clearInterval(intervalVar);
    window.clearInterval(intervalAnimateVar);
    $.each(state.transition_list, function (idx, transition) { // for each transition
        console.log(transition);
        if (transition.type == 3) { // if timer type then process responses
            imb_archive(book.book_id, book.page_list_idx, page.state_list_idx, 'TIME OUT', 2, 0); // timed transition
            //if (page.type == "2" && state.url !== '') {
            //	var next_idx = transition.next_state_idx;
            //	customGame.stop(function() {
            //		load_state(next_idx);
            //	});
            //} else {
            load_state(transition.next_state_idx); // force transition to the next state now
            //}
            return false; // terminate loop
        }
    });
}

// -------------------------------------------------------------------------------- display functions
// This function is called to render a text only page   [width:800px; margin: auto 200px;]
// --------------------------------------------------------------------------------------------------
function imb_display_page(msg) {
    $("#imb_page").html("<div id=\"page_paragraph\" style=\" font-size: large;\">" + parseWhitespace(msg) + "</div>");
	imb_activate_definition("#imb_page");
}
//-------------------------------------------------------------------------- activate word definition
// Used to make the word definitions interactive
//--------------------------------------------------------------------------------------------------
function imb_activate_definition(node_selector) {
    $(node_selector).find('.defWord').click(function (e) {
		var container = $('#slideDef');
        if (container.css('display') == "none") {
            container.text(imb_display_definition($(this).text()))
				.css("top", e.pageY)
				.css("left", e.pageX)
				.show(100);
        } else {
            container.hide(100);
        }
    });
}
//-------------------------------------------------------------------------- display word definition
// Used in conjuction with the function above to display word definition in text only pages
//--------------------------------------------------------------------------------------------------
function imb_display_definition(thisWord) {
    var book = book_list[book_list_idx];
    for (var i = 0; i < book.definition_list.length; i++) {
        if (book.definition_list[i].word == thisWord.toLowerCase()) {
            return book.definition_list[i].text;
        }
    }
    return "Undefined";
}

// gets the image source for the given avatar
function get_book_avatar(page, char_id, av_id) {
	var character_id = 0, avatar_id = 0;
	
	// use the avatar from the response or state, if it exists
	if (char_id != undefined) {
		character_id = char_id;
		if (av_id != undefined) {
			avatar_id = av_id;
		}
	}
	// otherwise, use the page default
	if ((character_id <= 0) && (character_id != -1) && (page != undefined)) {
		character_id = page.char_idx;
	}
	
	// get the avatar details for the chosen character
	var image_src = "data/avatars/";
	if (!character_list.hasOwnProperty(character_id)) {
		// the user's avatar
		if (character_id == -1) {
			image_src = avatar;
		}
		else {
			// use no character at all if none was given
			image_src = "";
		}
	}
	else {
		var character = character_list[character_id];
		if (character.avatar_list.hasOwnProperty(avatar_id)) {
			image_src += character.avatar_list[avatar_id];
		}
		else {
			image_src += character.avatar_list[character.default_avatar_idx];
		}
	}
	
	return image_src;
}

//--------------------------------------------------------------------------------------------------
// This function is called to add a new message to the game messages panel
//--------------------------------------------------------------------------------------------------
function add_game_message(msg, avatar_image, display_as_from_user, is_user_speaking) {
	if (msg.length < 2) {
        return; // do nothing
	}
	// get the container that holds the messages
	var container = $("#imb_game_messages_container");
	// only scroll down if the scrollbar is near the bottom
	var scrollDown = (container.scrollTop() + container.innerHeight() >= container[0].scrollHeight - 20);
	
	// create and display the message like any chat message
	imb_create_social_response(msg, container[0], {
		msg_id		 : "game_msg_" + container.children().length,
		avatar_image : avatar_image,
		active_user  : (display_as_from_user == true), // to force boolean value
		can_change_avatar: (is_user_speaking == true),
		add_definition: true
	});
	
    /*if (msg.length < 2)
        return; // do nothing
    switch (type) {
        case 1: // red = error
            play(msg);
            txt = "<font style=\"color: #FF0000;\">";
            break;
        case 2: // orange = warning
            play(msg);
            txt = "<font style=\"color: #FF9900;\">";
            break;
        case 3: // green = success positive
            play(msg);
            txt = "<font style=\"color: #00FF00;\">";
            break;
        case 4: // blue = success negative
            play(msg);
            txt = "<font style=\"color: #7777FF;\">";
            break;
        case 5: // white = success
            txt = "<font style=\"color: #FFFFFF; font-size: x-large;\">";
            break;
        case 6: // yellow = user input
            txt = "&nbsp;&nbsp;&nbsp;<font style=\"color: #FFFF99;\">";
            break;
        case 7: // red/yellow = partial match
            txt = "<font style=\"color: #FF0000;\">";
            break;
        default:
            txt = "<font>";
            break;
    }
    $("#imb_game_display_content_top_text").append(txt + msg + "</font><br/>");*/
	if (scrollDown) {
		container.scrollTop(container[0].scrollHeight);
	}
}
//--------------------------------------------------------------------------------------------------
// Update silver and gold credits if current game is complete (last state is reached)
//--------------------------------------------------------------------------------------------------
function imb_display_feedback(action) {
    var book = book_list[book_list_idx];
    var page = book.page_list[book.page_list_idx];

    switch (action) {
        case 0: // set silver to 0
            $("#imb_silver_count").text("0");
            break;
        case 1: // update silver
            $("#imb_silver_count").text(page.score);
            $("#imb_btn_submit").show();
            break;
        case 2: // GAME FINISHED
            $("#imb_silver_count").text("0");
            $("#imb_gold_count").text(book.score);
            $("#imb_btn_submit").hide();
            break;
    }
}
//--------------------------------------------------------------------------------------------------
// helper function to easily check if the default game text is still shown (i.e., player has done nothing yet)
//--------------------------------------------------------------------------------------------------
function default_text_shown() {
    var book = book_list[book_list_idx];
    var page = book.page_list[book.page_list_idx];
    var state = page.state_list[page.state_list_idx];
	return ($("#imb_game_display_content_bottom_text").text() == state.lexicon.text);
}
//--------------------------------------------------------------------------------------------------
// update the score display and change the color to green if current game is complete (last state is reached)
//--------------------------------------------------------------------------------------------------
function imb_display_word(msg, type) {
    if (debug)
        console.log("imb_display_word:" + msg + " type:" + type);
    input_type = type; // set the global variable to the last user input type!
    var book = book_list[book_list_idx];
    var page = book.page_list[book.page_list_idx];
    var state = page.state_list[page.state_list_idx];

    if (msg == '') { // just set the default lexicon text
        $("#imb_game_display_content_bottom_text").text(state.lexicon.text);
        return;
    } else if (is_speech_recording()) { // ignore these buttons when the recorder is on
		return;
	} else if (default_text_shown()) { // clear the default text first
        $("#imb_game_display_content_bottom_text").text("");
    }

    $("#imb_game_display_content_bottom_text").append(" " + msg);
	update_speech_transcript("append", " " + msg);

    if (state.lexicon.word_list.length == 0) { // if there are NO lexicon items then check for partials:
        // IMPORTANT: if current user input is not a partial of a possible response...
        var counter_partial = 0;
        var bitmask_partial = 0;
        var variable_partial = 0;
        var counter = 0;
        var bitmask = 0;
        var variable = 0;
        $.each(state.transition_list, function (idx, transition) { // for each transition
            if (transition.type == 1) { // check all counter responses
                counter++;
                $.each(transition.response_list, function (idx, response) { // for each response
                    if (response.text_input.indexOf($.trim($("#imb_game_display_content_bottom_text").text())) == 0) { // found response matching beginning input
                        counter_partial++; // there is partial in counter responses
                    }
                });
            }
            if (transition.type == 5) { // check all bitmask responses
                bitmask++;
                $.each(transition.response_list, function (idx, response) { // for each response
                    if (response.text_input.indexOf($.trim($("#imb_game_display_content_bottom_text").text())) == 0) { // found response matching beginning input
                        bitmask_partial++; // there is a partial in bitmask responses
                    }
                });
            }
            if (transition.type == 6) { // check all variable responses
                variable++;
                $.each(transition.response_list, function (idx, response) { // for each response
                    if (response.text_input.indexOf($.trim($("#imb_game_display_content_bottom_text").text())) == 0) { // found response matching beginning input
                        variable_partial++; // there is a partial in bitmask responses
                    }
                });
            }
        });
        if ((counter_partial == 0 && bitmask_partial == 0 && variable_partial == 0) && (counter > 0 || bitmask > 0 || variable > 0)) { // if no counter or bitmask or variable partials but at least one transition type exists
            if (debug)
                console.log("AUTO CLEARED:" + $("#imb_game_display_content_bottom_text").text());
            add_game_message($("#imb_game_display_content_bottom_text").text(), avatar, true, true); // echo error to archive
            $("#imb_game_display_content_bottom_text").text("");
        }
    } //  NOTE: Above segment is only executed when state lexicon list is empty.



    // IMPORTANT: each time a new word (or hotspot) is pressed, check to see if the user input matches a valid response input and auto-submit it if asub for that response is set to 'y'
    $.each(state.transition_list, function (idx, transition) { // for each transition
        if (transition.type == 1 || transition.type == 5 || transition.type == 6) { // if counter or bitmask type then check responses
            $.each(transition.response_list, function (idx, response) { // for each response
                if ($.trim($("#imb_game_display_content_bottom_text").text()) == response.text_input && response.asub == 'y') { // transition text match and asub is set to 'y'
                    btn_submit(transition, response); // auto submit
                }
            });
        }
    });
}
//----------------------------------------------------------------------------------- display object
// This function is called to display a list of object icons (if any)
//--------------------------------------------------------------------------------------------------
function imb_display_objects() {
    var book = book_list[book_list_idx];
    var object_list = imb_objects(book.book_id, "", "load");
    var iobj;

    $("#imb_game_display_content_middle_object_matrix").empty();
    $.each(object_list, function (idx, obj) {
        iobj = "<img src=\"data/icons/object-" + obj + ".gif\" width=40 height=40 on" + user_event + "=\"btn_press('" + obj + "', '', 1);\" />&nbsp;"; // object is always a noun type
        $("#imb_game_display_content_middle_object_matrix").append(iobj);
    });
}
// 
//------------------------------------------------------------------------------- popup a new window
// This function is called each time a hotspot is pressed in case it contains a link with external content
//--------------------------------------------------------------------------------------------------
function imb_window(url) {
    if ((typeof url != 'undefined') && url.substr(0, 4) == "http") {
        window.open(url, "imb_remote");
    }
}

// ---------------------------------------------------------------------------------- state transition logic
// STATE MACHINE called on user input to process each manual response and to move the game forward
// ----------------------------------------------------------------------------------------------------------
function imb_transition_check_response(inftxt) {
    var book = book_list[book_list_idx];
    var page = book.page_list[book.page_list_idx];
    var state = page.state_list[page.state_list_idx];
    var next_state_idx = -1;
    var match = 0;
    var vpf_text = '';

    if (debug)
        console.log("Last user input type: " + input_type);

    $.each(state.transition_list, function (idx, transition) { // for each transition
        if (transition.type == 1 || transition.type == 5 || transition.type == 6 || transition.type == 7) { // if counter or bitmask type then check responses
            vpf_text = '';
            if (transition.scenario_id != 0) { // try to match against VPF
                vpf_text = vpf_match(book.book_id, transition.scenario_id, $.trim(inftxt));
            }
			// find the best match on the NLP server
			var nlpMatchedIdx = -1;
			if (transition.type == 7) {
				var result = {correctness: 0};
				$.each(transition.response_list, function (idx, response) {
					var tmp = nlp_match(response.text_input, inftxt);
					if (tmp.correctness > transition.nlp_min_match && tmp.correctness > result.correctness) {
						result = tmp;
						nlpMatchedIdx = idx;
					}
				});
			}
			// then, for each response
            $.each(transition.response_list, function (idx, response) {
                // this will match against a response OR output from VPF service.
                // !!! YOU MUST HAVE AT LEAST ONE positive response under transition for this to work!!!
                if (vpf_text != '' || (idx === nlpMatchedIdx) || $.trim(inftxt) == response.text_input) { // transition response match
                    play_sound(response.sound, book.location); // play associated sound (if any).
                    match = 1;
                    // play response output using TTS engine (if on)
                    play(response.text_output);
                    if (response.type == 1 || response.type == 3 || response.type == 4 || response.type == 5 || response.type == 6) { // positive inference, variables
                        switch (response.type) { // handle duplicate responses
                            case '1':
                                if (response.count > 0 && vpf_text == '') { // duplicate positive match - process but don't count it - UNLESS it came from VPF
                                    transition.count--; // subtract 1 from the transition.count if duplicate response has been detected
                                    imb_archive(book.book_id, book.page_list_idx, page.state_list_idx, inftxt, 1, 0); // duplicate positive match with 0 weight
                                    // pass the object for optional window popup if remote content is found (http...)
                                    imb_window(response.object);
                                }
                                break;
                            default:
                                break;
                        }

                        response.count++; // increment the number of this response matches
                        transition.count++; // increment the transition count
                        if (response.count == 1 || vpf_text != '') { // only count this response ONE time if NOT of VPF origin
                            page.score = parseInt(page.score) + parseInt(response.weight);  // increment the user page score by the weight of the response (if any) ONCE
                            imb_archive(book.book_id, book.page_list_idx, page.state_list_idx, inftxt, response.type, response.weight); // new positive match
                        }
                        if (vpf_text != '') { // got VPF response!
                            add_game_message(vpf_text, get_book_avatar(page, response.characters.output_char, response.characters.output_avatar)); // display vpf output
                        } else {
                            add_game_message(response.text_output, get_book_avatar(page, response.characters.output_char, response.characters.output_avatar)); // display response text output
                        }
                        // PERFORM ANY BITWISE OPERATIONS
                        if (transition.type == 5) {
                            if (response.bits > 0) { // set the bit(s)
                                transition.mask = transition.mask | response.bits;
                            }
                        }

                        // HAVE WE REACHED THE TRANSITION POINT?
                        // ------------------------------------------------------------------------------------------------------------------------------------------------
                        if ((transition.type == 1) && (transition.count >= transition.trigger)) {
                            // reached the trigger condition
                            next_state_idx = transition.next_state_idx;
                        } else if ((transition.type == 5) && (transition.mask == transition.trigger)) {
                            // transition mask matches the trigger
                            next_state_idx = transition.next_state_idx;
                        } else if (transition.type == 6 && book.registry[transition.variable_idx].value >= transition.trigger) {
                            next_state_idx = transition.next_state_idx;
                        } else { // otherwise, just update feedback
                            imb_display_feedback(1);
                        }
                        // -------------------------------------------------------------------------------------------------------------------------------------------------
                        imb_window(response.object); // pass the object for optional window popup if remote content is found (http...)
                    } else if (response.type == 2) { // negative inference
                        add_game_message(response.text_output, get_book_avatar(page, response.characters.output_char, response.characters.output_avatar));
                        imb_archive(book.book_id, book.page_list_idx, page.state_list_idx, inftxt, response.type, response.weight); // negative match

                        // PERFORM ANY BITWISE OPERATIONS
                        if (transition.type == 5) {
                            if (response.bits > 0) { // unset the bit(s) (if set)
                                transition.mask = transition.mask ^ response.bits;
                            }
                        }
                    } else if (response.type == 101) { // PAGE RESET!
                        add_game_message(response.text_output, get_book_avatar(page, response.characters.output_char, response.characters.output_avatar));
                        imb_archive(book.book_id, book.page_list_idx, page.state_list_idx, "PAGE RESET", response.type, response.weight); // page reset
                        // reset page score, #complete and all response counts for this page
                        page.score = 0;
                        page.complete = 0;
                        $.each(page.state_list, function (idx, st) { // for each state)
                            $.each(st.transition_list, function (idx, tr) { // for each transition
                                $.each(tr.response_list, function (idx, re) { // for each response
                                    re.count = 0;
                                });
                            });
                        });
                        next_state_idx = transition.next_state_idx;
                    }
                }
            });
        } else if (transition.type == 2) { // countdown transition
            transition.count++;
            progress_counter("#imb_footer_countdown", -1, (transition.trigger - 1), 0); // update progress counter
            if (transition.count >= transition.trigger && next_state_idx == -1) { // reached maximum number of guesses allowed for the state and not transitioned yet
                next_state_idx = transition.next_state_idx;
            } else if (page.score >= transition.trigger && next_state_idx == -1) { // OR reached the number of guesses allowed for the whole page
                if (next_state_idx != -1 && page.state_list[next_state_idx].transition_list.length != 0) { // the next state is not the last state
                    next_state_idx = transition.next_state_idx;
                }
            }
        } // TODO: add more transition types here
    });

    if (match == 0) { // none of the responses in any transitions matched
        if (input_type != 101) { // NOT an open text answer
            add_game_message(state.lexicon.error, get_book_avatar(page));
            // if TTS is on, play the error
            play(state.lexicon.error);
            imb_archive(book.book_id, book.page_list_idx, page.state_list_idx, inftxt, 99, 0); // complete mismatch
        } else { // open text answer
            //page.score = parseInt(page.score) + 1;  // increment the user page score by 1
            add_game_message($.t("text.game-response-noted"), get_book_avatar(page, state.char_idx, state.avatar_idx));
            imb_archive(book.book_id, book.page_list_idx, page.state_list_idx, inftxt, 98, 0); // open text answer weight is always 1 - 11/12/15 changed to 0 for VPF
        }
    }

    return (next_state_idx); // return -1 or the index to next state
}

//----------------------------------------------------------------------- user response functions
// This function simply clears the last user entry from the text dialog.
// ----------------------------------------------------------------------------------------------
function btn_backspace() {
    var current_statement = $("#imb_game_display_content_bottom_text").text();
    var len = current_statement.length;
	
	// do nothing in these situations
	if (default_text_shown() || is_speech_recording()) {
		return;
	}

	// otherwise, remove the last word from the text
    while ((len > 0) && (current_statement.charAt(len - 1) != ' ')) {
        current_statement = current_statement.substring(0, len - 1);
        len = current_statement.length;
    }
    if (len > 0) {
        current_statement = current_statement.substring(0, len - 1);
    }

	// and update the screen text
    $("#imb_game_display_content_bottom_text").text(current_statement);
	update_speech_transcript("set", current_statement);
}
// --------------------------------------------------------------------------------------------------
// This function is called when "submit" is pressed or "asub" response executed.
// --------------------------------------------------------------------------------------------------
function btn_submit(transition, response) {
    if (debug)
        console.log("btn_submit:" + response.text_input);
    var book = book_list[book_list_idx];
    var page = book.page_list[book.page_list_idx];
    var state = page.state_list[page.state_list_idx];
    var inftxt = $("#imb_game_display_content_bottom_text").text();

    // first, make sure the input is valid
    if ((inftxt == "" || inftxt == state.lexicon.text) && transition.type != 6) {
        return;
    }
	
	// if we're submitting a response, turn off the recorder
	if (is_speech_recording()) {
		toggle_speech_recorder();
	}

    //Before bothering with checking transitions, update the variable, then update corresponding images
    if (transition.type == 6) {
        var variable = book.registry[transition.variable_idx];

        if (response.type == 3) { 			//+
            variable.value = (parseInt(variable.value) + parseInt(response.weight)).toString();
        } else if (response.type == 4) {	//-
            variable.value = (parseInt(variable.value) - parseInt(response.weight)).toString();
        } else if (response.type == 5) {	//*
            variable.value = (parseInt(variable.value) * parseInt(response.weight)).toString();
        } else if (response.type == 6) {	///
            variable.value = (parseInt(variable.value) / parseInt(response.weight)).toString();
        }

        if (variable.value > variable.max) {
            variable.value = variable.max;
        } else if (variable.value < variable.min) {
            variable.value = variable.min;
        }

        //Update image object frame if relevant
        if (response.image_object_idx != -1) {
            var num_frames = state.image.hotspot_list[parseInt(response.image_object_idx)].frame_list.length;
            var new_frame_idx = variable.value - variable.min;
            var imgobj = state.image.hotspot_list[parseInt(response.image_object_idx)];
            var frame = imgobj.frame_list[new_frame_idx];
            imgobj.frame_list_idx = new_frame_idx;

            imb_update_variable_frame(book, frame, response.image_object_idx);
        }
    }
	
	// echo user input to archive
	if (response.characters) {
		// overwrite the player's avatar image with a specific one
		add_game_message(inftxt, get_book_avatar(page, response.characters.action_char, response.characters.action_avatar), true, false);
	}
	else {
		add_game_message(inftxt, avatar, true, true); 
	}
    
    if ((next_state_idx = imb_transition_check_response(inftxt)) >= 0) { // state satisfied one of transition conditions
        $("#imb_game_display_content_bottom_text").html("");
        load_state(next_state_idx);
    } else {
        $("#imb_game_display_content_bottom_text").text("");
    }
	update_speech_transcript("clear");
}

function imb_update_variable_frame(book, imgobj, idx) {
    var obj = document.getElementById("hotspot" + idx);
    $(obj).attr("word", imgobj.word);
    $(obj).css("left", imgobj.xloc + "%");
    $(obj).css("top", imgobj.yloc + "%");
    $(obj).css("width", imgobj.width + "%");
    $(obj).css("height", imgobj.height + "%");
    $(obj).css("opacity", imgobj.opacity / 100);
    $(obj).css("background-image", "url(data/books/" + book.location + "/" + encodeURI(imgobj.file_name) + ")");
}
//--------------------------------------------------------------------------------------------------
// This function is called when "word" is pressed
//--------------------------------------------------------------------------------------------------
function btn_press(word, sound, type) {
    if (word.length > 0) {
        imb_display_word(word, type);
        if (sound != '') {
            play_sound(sound, book_list[book_list_idx].location);
        } else {
            //play(word);
            // disabled 8/9/2017 - per GS
        }
    }
}
//--------------------------------------------------------------------------------------------------
// This function is called when hotspot is pressed
//--------------------------------------------------------------------------------------------------
function hot_press(word, text) {
    if (text != '') {
        $("#imb_popup_text").html(text);
        $("#imb_popup_text").show();
        $("#imb_popup").toggle();
    }
    imb_display_word(word, 0);
}
//------------------------------------------------------------------------------ drag&drop functions
// Allow drops inside the container object
//--------------------------------------------------------------------------------------------------
function allowDrop(ev) {
    ev.preventDefault();
}
//--------------------------------------------------------------------------------------------------
// This function is called when user "clicks" on a draggable object
//--------------------------------------------------------------------------------------------------
function drag(ev) {
    var book = book_list[book_list_idx];
    var page = book.page_list[book.page_list_idx];
    var state = page.state_list[page.state_list_idx];
    state.image.draggable_list[ev.target.id.substr(9)].pause = 1; // pause any animation of this object
    ev.dataTransfer.setData("Text", ev.target.id);
    if (debug)
        console.log("DRAG: target.id=" + ev.target.id);
}
//--------------------------------------------------------------------------------------------------
// This function is called when user "drops" a draggable object over a container object
//--------------------------------------------------------------------------------------------------
function drop(ev) {
    var book = book_list[book_list_idx];
    var page = book.page_list[book.page_list_idx];
    var state = page.state_list[page.state_list_idx];
    var source_id = ev.dataTransfer.getData("Text");
    var target_id = ev.target.id;
    ev.preventDefault();
    state.image.draggable_list[source_id.substr(9)].pause = 0; // restart any animation of this object
    drop_object(source_id, target_id);
}
//--------------------------------------------------------------------------------------------------
//This function is called to process the drop event
//--------------------------------------------------------------------------------------------------
function drop_object(source_id, target_id) {
    var container_count = $("#" + target_id).attr("count");
    var container_children_count = $("#" + target_id).children().length; // number of objects currently inside the container
    if (debug) {
        console.log("drop-1: source_id=" + source_id + " target_id=" + target_id + " children_count=" + container_children_count + " / " + container_count);
	}

    if ((typeof container_count == 'undefined') || (container_count <= container_children_count)) { // container count is undefined or full
        if (debug) {
            console.log("Invalid or full container!");
		}
        return;
    }

    var clone = $("#" + source_id).clone(); // create the clone 
    
    // calculate new size of the clone
    var clone_width;
    var clone_height;
    var container_width = $("#" + target_id).width(); // original width
    var container_height = $("#" + target_id).height(); // original height
    var source = $("#" + source_id);
	var source_width = source.width();
	var source_height = source.height();
	var ratio_heights = container_height / source_height;
	var ratio_widths = container_width / source_width;
	if (ratio_widths > ratio_heights) {
		clone_height = container_height;
		clone_width = source_width * ratio_heights;
	} else {
		clone_width = container_width;
		clone_height = source_height * ratio_widths;
	}

    var clone_id = source_id + "clone" + container_children_count + target_id; // create a unique clone identifier

    if (debug) {
        console.log("drop-2: clone_id=" + clone_id + " width=" + clone_width + " height=" + clone_height);
	}

    // now modify clone's attributes
    $(clone).attr("id", clone_id);
    $(clone).attr("class", "imb_dragged");
    $(clone).attr("draggable", false);
    $(clone).attr("ondragstart", null);
    $(clone).css("cursor", "hand");
    $(clone).css("top", "");
    $(clone).css("left", "");
    $(clone).click(function () {
        remove(target_id, clone_id, source_id);
    });
    $(clone).css("width", clone_width);
    $(clone).css("height", clone_height);
    //$(clone).css("float", "left"); // AUTO PLACEMENT!

    $(clone).appendTo("#" + target_id); // insert into container

    if ($("#" + source_id).attr("clone") == 'n') { // you can only "clone" it once
        $("#" + source_id).hide();
    }

    hot_press(document.getElementById(source_id).getAttribute('word') + ' ' + document.getElementById(target_id).getAttribute('word'), '');
}

//--------------------------------------------------------------------------------------------------
// This function is called when user "removes" draggable object from a container object
//--------------------------------------------------------------------------------------------------
function remove(container_id, clone_id, original_id) {
    if (debug)
        console.log("REMOVE: container_id=" + container_id + " clone_id=" + clone_id + " original_id=" + original_id);

    if ($("#" + clone_id).parent().attr("lock") == 'y') { // if parent container is locked then nothing can be removed
        if (debug)
            console.log("Locked container!");
        return;
    }

    // output the reverse sentence - may be used to reverse the drop inference
    hot_press(document.getElementById(container_id).getAttribute('word') + ' ' + document.getElementById(clone_id).getAttribute('word'), '');

    $("#" + clone_id).remove(); // remove the clone


    if ($("#" + original_id).attr("clone") == 'n') { // make the original visible again (if needed)
        $("#" + original_id).show();
    }
}



//------------------------------------------------------------------------ global utility functions
// Update progress bar in the footer section based on (book.progress_cnt / book.progress_max) * 200
// ------------------------------------------------------------------------------------------------
function progress_bar() {
    var book = book_list[book_list_idx];
    var page = book.page_list[book.page_list_idx];
    var ctx = document.getElementById("imb_footer_page_progress").getContext("2d");

    ctx.fillStyle = "#999999";
    ctx.fillRect(0, 0, 200, 10);
    ctx.fillStyle = "#2B4F81";
    ctx.fillRect(0, 0, (book.progress_cnt / book.progress_max) * 200, 10);
}
//------------------------------------------------------------------------------------------------
// Update progress counter in the footer section based on the offset value and terminated by end
//------------------------------------------------------------------------------------------------
function progress_counter(element, offset, start, end) {
    var book = book_list[book_list_idx];
    var page = book.page_list[book.page_list_idx];
    var display_number = parseInt($(element).html());
    //if (debug) console.log("progress_counter: display_number=" + display_number + " offset=" + offset + " start=" + start + " end=" + end);

    if (isNaN(display_number)) { // if blank or invalid number then set it to start
        $(element).html(start);
        return;
    }

    display_number = display_number + offset;

    if (display_number == end) { // clear the progress counter
        $(element).html("&nbsp;");
    } else {
        $(element).html(display_number);
    }
}

//------------------------------------------------------------------------ sounds functions
// Load and play the sound from a file found in a book directory or ../../sounds directory
// ----------------------------------------------------------------------------------------
function play_sound(file, directory) {
    if (sound == 0 || file == '')
        return;
    if (directory == '') {
        var dsf = "data/sounds/" + file + "." + codec; // play file from data/sounds
    } else {
        var dsf = "data/books/" + directory + "/" + file + "." + codec; // play file relative to the given book directory
    }

    if (debug)
        console.log("play_sound: " + dsf);

    audio_player.src = dsf;
    audio_player.volume = sound_volume / 100;
    audio_player.load();
    audio_player.play();
}
;
// ------------------------------------------------------------------------------------- TTS
// Play the sound stream
// -----------------------------------------------------------------------------------------
function play_text(s) {
    audio_player.src = s;
    audio_player.volume = sound_volume / 100;
    audio_player.load();
    audio_player.play();
}
;
//-----------------------------------------------------------------------------------------
// Use server side TTS service to "speak" the text through play_text()
//-----------------------------------------------------------------------------------------
function play(t) {
    var book = book_list[book_list_idx];
    if (sound == 0 || sound_synthesis == 0)
        return; // don't play anything
    if (debug)
        console.log("play: [" + t + "]");
    if (sound_synthesis == 0) { // only play recorded files from /sounds directory (local or remote)
        play_text("data/sounds/" + t.replace(/[\'\".,!? ]/g, '_').toLowerCase() + ".wav");
//		if (debug) console.log("data/sounds/" + t.replace(/[\'\".,!? ]/g, '_').toLowerCase() + ".wav");
    } else { // play remote recorded files (if present) or synthesize
        if (browser == 'mobile')
            return; // don't try to synthesize anything to prevent errors
        $.ajax({
            type: "GET",
            url: "utils/speak/service.php",
            data: {
                imb_text: t,
                imb_attr: book.voice,
                imb_codec: codec
            },
            dataType: "html",
            async: false,
            success: function (data) {
                play_text(data);
            },
            error: function () {
                window.alert("TTS error");
            }
        });
    }
}
// ---------------------------------------------------------------------------------------------
// get URL parameters
// ---------------------------------------------------------------------------------------------
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}
// ----------------------------------------------------------------------------------------------
// simple function to return a browser flavor
// ----------------------------------------------------------------------------------------------
function get_browser(userAgent) {
    if (userAgent.search("Firefox") > 0) {
        return "firefox";
    } else if (userAgent.search("Chrome") > 0) {
        return "chrome";
    } else if (userAgent.search("MSIE") > 0) {
        return "ie";
    } else if (userAgent.search("Mobile") > 0) {
        return "mobile";
    } else {
        return "safari";
    }
}
//----------------------------------------------------------------------------------------------
// get the browser codec to be used with speach and sounds
//----------------------------------------------------------------------------------------------
function get_codec(browser) {
    switch (browser) {
        case "firefox":
            return "wav"; // or ogg
            break;
        case "chrome":
            return "wav"; // or ogg
            break;
        case "ie":
            return "mp3"; // mpeg
            break;
        default:
            return "wav";
            break;
    }
}
//----------------------------------------------------------------------------------------------
// Webkit browsers don't handle onClick very well (or timely)
//----------------------------------------------------------------------------------------------
function get_user_event(browser) {
    if (browser == "mobile") {
        return "touchstart";
    } else {
        return "click";
    }
}


// ---------------------------- auxilary functions to get around webkit limitations <-- cubiq.org
function NoClickDelay(el) {
    this.element = el;
    if (window.Touch)
        this.element.addEventListener('touchstart', this, false);
}
NoClickDelay.prototype = {
    handleEvent: function (e) {
        switch (e.type) {
            case 'touchstart':
                this.onTouchStart(e);
                break;
            case 'touchmove':
                this.onTouchMove(e);
                break;
            case 'touchend':
                this.onTouchEnd(e);
                break;
        }
    },
    onTouchStart: function (e) {
        e.preventDefault();
        this.moved = false;

        this.element.addEventListener('touchmove', this, false);
        this.element.addEventListener('touchend', this, false);
    },
    onTouchMove: function (e) {
        this.moved = true;
    },
    onTouchEnd: function (e) {
        this.element.removeEventListener('touchmove', this, false);
        this.element.removeEventListener('touchend', this, false);

        if (!this.moved) {
            // Place your code here or use the click simulation below
            var theTarget = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            if (theTarget.nodeType == 3)
                theTarget = theTarget.parentNode;

            var theEvent = document.createEvent('MouseEvents');
            theEvent.initEvent('click', true, true);
            theTarget.dispatchEvent(theEvent);
        }
    }
};

//XML Error Handling function - this code is also in the utils/author/scripts/imb.js file.

var xt = "", h3OK = 1
function checkErrorXML(x)
{
    xt = ""
    h3OK = 1
    checkXML(x)
}

function checkXML(n)
{
    var l, i, nam
    nam = n.nodeName
    if (nam == "h3")
    {
        if (h3OK == 0)
        {
            return;
        }
        h3OK = 0
    }
    if (nam == "#text")
    {
        xt = xt + n.nodeValue + "\n"
    }
    l = n.childNodes.length
    for (i = 0; i < l; i++)
    {
        checkXML(n.childNodes[i])
    }
}

function loadXMLDocErr(dname, fileurl) {
    //Internet Explorer
    if (window.ActiveXObject) {
        var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = false;
        xmlDoc.loadXML(dname);
        if (xmlDoc.parseError.errorCode != 0) {
            txt = "Error Code: " + xmlDoc.parseError.errorCode + "\n";
            txt = txt + "Error Reason: " + xmlDoc.parseError.reason;
            txt = txt + "Error Line: " + xmlDoc.parseError.line;
            alert(txt + "\nXML file's URL is " + fileurl);
        }
        else {
            //alert("No errors found");
        }
    }
    //Firefox
    else if (document.implementation && document.implementation.createDocument) {
        var parser = new DOMParser();
        var text = dname;
        var xmlDoc = parser.parseFromString(text, "text/xml");
        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
            checkErrorXML(xmlDoc.getElementsByTagName("parsererror")[0]);
            alert(xt + "\nXML file's URL is " + fileurl);
        }
        else {
            //alert("No errors found");
        }
    }
    else {
        //alert("Browser does not have XML parsing abilities");
    }
}

function imb_check_end_game() {
    if (window.game != null) {
        window.game.stop();
        window.game = null;
    }
}







/**
 * Looks for new messages for the given conversation and queues refreshing
 * the display until those messages have returned.
 */
function imb_social_refresh() {
	var book = book_list[book_list_idx];
	var tmp = $("#imb_social_heading");
	var bookclub = tmp.data("social-id");
	var topic = tmp.data("discussion-id");
	var chat_type = tmp.data("action-id");
	// find the latest date for this topic, but use no date for the first
	// time we try to get data
	var latest_dt = '';
	if ($("#imb_convo_list").children().length > 0) {
		if (topic > 0) {
			if (socialManager.topicData.hasOwnProperty(topic)) {
				latest_dt = socialManager.topicData[topic].timestamp;
			}
		}
		else if ((chat_type == 2) && (socialManager.groupData.hasOwnProperty(0))) {
			latest_dt = socialManager.groupData[0].timestamp;
		}
		else if (socialManager.groupData.hasOwnProperty(bookclub)) {
			latest_dt = socialManager.groupData[bookclub].timestamp;
		}
	}
	// gather the data, and this will re-enable the refresh button on success
	imb_social_read(
		chat_type,
		bookclub,
		book.book_id,
		book.page_list_idx,
		book.page_list[book.page_list_idx].state_list_idx,
		topic,
		imb_social_create_display,
		latest_dt
	);
}

/***
 * 
 */
function imb_load_social_groups(options) {
	// the social button should be disabled by default
	$("#imb_btn_social_open").hide();
	$("#imb_btn_social_change").hide();
	// disable chat for the external games since they get reset when you enter/leave chat
	var isExternalGame = false;
	if ( (book_list_idx >= 0) && (book_list[book_list_idx] != undefined) ) {
		var page = book_list[book_list_idx].page_list[ book_list[book_list_idx].page_list_idx ];
		if (page) {
			isExternalGame = (book_list[book_list_idx].page_list[ book_list[book_list_idx].page_list_idx ].type == 3);
		}
	}
	
	// get a list of the social groups to which this user belongs and prepare
	// the social section of the book; if the user has no social groups or topics
	// then completely disable the social option
	imb_social_get_groups(book_list[book_list_idx].book_id, function(data) {
		var $dom_list  = $("#imb_social_change_list").empty();
		var showButton = (data.settings > 0);
		
		// add options for the bookclubs
		if (data.bookclubs && data.bookclubs.length > 0) {
			var localClubs = 0;
			for (var index = 0; index < data.bookclubs.length; index++) {
				var $lnk = $(document.createElement("a"))
					.html(data.bookclubs[index][1] + ' <span class="chat-unread-number"></span>')
					.attr("id", "social_change_group_" + data.bookclubs[index][0])
					.attr("href", "#social_page").data("social-id", data.bookclubs[index][0])
					.click(function() {
						imb_change_chat_group($(this).data("social-id"), $(this).text(), $(this).data("discussion-id"));
						return true;
					});
				var $li = $(document.createElement("li"));
				$lnk.appendTo($li);
				
				if (data.bookclubs[index][0] == 0) {
					// this is the global chatroom, so only add its details to the open-chat link
					$("#imb_social_open_change_global")
						.html($.t("text.chat-with-everyone") + ' <span class="chat-unread-number"></span>')
						.data("social-id", 0)
						.data("social-name", data.bookclubs[index][1])
						.off("click").on("click", function() {
							imb_change_chat_group($(this).data("social-id"), $(this).data("social-name"), 0);
							return true;
						});
				}
				// this is just a local chatroom, so add it to the change list
				else {
					$li.appendTo($dom_list);
					// but add the first one to the open-chat link
					if (localClubs == 0) {
						$("#imb_social_open_change_local")
							.html($.t("text.chat-with-club") + ' <span class="chat-unread-number"></span>')
							.data("social-id", data.bookclubs[index][0])
							.data("social-name", data.bookclubs[index][1])
							.off("click").on("click", function() {
								imb_change_chat_group($(this).data("social-id"), $(this).data("social-name"), 0);
								return true;
							});
					}
					localClubs++;
				}
			}
			
			// initialize the open-chat button to this user's main bookclub
			$("#imb_btn_free_chat")
				.html($.t("text.chat-without-topic") + ' <span class="chat-unread-number"></span>')
				.data("social-id", data.bookclubs[data.bookclubs.length-1][0])
				.data("social-name", data.bookclubs[data.bookclubs.length-1][1])
				.off("click").on("click", function() {
					imb_change_chat_group($(this).data("social-id"), $(this).data("social-name"), 0);
					return true;
				});
			
			// only show the open-chat button if it's allowed, but if there could be
			// multiple open-chat rooms then show the open-change button instead
			$("#imb_btn_free_chat").hide();
			$("#imb_btn_free_chat_choice").hide();
			if ((data.settings & 1) && (data.settings & 2)) {
				$("#imb_btn_free_chat_choice").show();
			}
			else if ((data.settings & 1) || (data.settings & 2)) {
				$("#imb_btn_free_chat").show();
			}
			
			// however, only allow changing convos if there's more than one
			if (localClubs > 1) {
				$("#imb_btn_social_change").show();
			}
			// initialize the social group to the first local one
			imb_change_chat_group(data.bookclubs[data.bookclubs.length-1][0], data.bookclubs[data.bookclubs.length-1][1], 0, true);
		}
		else {
			$("#imb_social_heading").text("");
		}
		// refresh the jQuery list
		$dom_list.listview("refresh");
		// store existing answers to the discussion topics
		if (data.answers && book_list_idx >= 0) {
			data.answers.forEach(function(ans){
				update_discussion_answer(ans.id, ans.answer);
			});
		}
		// this variable gets reset so save it to test later
		var oldNextTopicIndex = nextTopicIndex;
		// add the discussion topics
		$("#imb_btn_topic_change").hide();
		if (data.settings & 4) {
			refresh_discussion_topic_list(data.latest_page);
		}
		// update the display of the chat button
		if (showButton && !isExternalGame) {
			$("#imb_btn_social_open").show();
		}
		
		// check if a new topic is available and tell the user to check it out
		if ( options && options.showNewTopic &&
			 book_list[book_list_idx].discussion_list.hasOwnProperty(oldNextTopicIndex) && 
			 book_list[book_list_idx].discussion_list[oldNextTopicIndex].page == book_list[book_list_idx].page_list_idx )
		{
			$("#popupNewTopicReady").popup("open");
		}
	});
}

function imb_change_chat_group(social_id, social_name, discussion_id, initialize) {
	// clear the previous list of messages (do this before asking for messages
	// so that all of them are gathered instead of only unread ones)
	$("#imb_convo_list").empty();
	// update the header to have details necessary to load the messages
	if (discussion_id == 0) {
		$("#imb_convo_box").removeClass("imb_convo_box_structured").addClass("imb_convo_box_unstructured");
		$("#imb_btn_topic_answer_submit").hide();
		$("#imb_btn_show_topic_answer").hide();
	}
	$("#imb_social_heading")
		.data("action-id", (discussion_id > 0) ? 4 : ((social_id > 0) ? 1 : 2))
		.data("social-id", social_id)
		.data("discussion-id", discussion_id)
		.text(social_name);
	// don't get new data for the messages when we're just setting things up
	// NOTE: this is because reading messages clears their 'new message' status
	if (!initialize) {
		imb_social_refresh();
	}
}

function imb_change_chat_topic(topic_idx, initialize) {
	// clear the previous list of messages (do this before asking for messages
	// so that all of them are gathered instead of only unread ones)
	$("#imb_convo_list").empty();
	// update the header to have details necessary to load the messages
	var topic = book_list[book_list_idx].discussion_list[topic_idx];
	$("#imb_convo_box").removeClass("imb_convo_box_unstructured").addClass("imb_convo_box_structured");
	$("#imb_social_heading")
		.data("action-id", 4)
		.data("discussion-id", topic.id)
		.data("discussion-index", topic_idx);
	$("#imb_social_topic_container").empty().append('<h2 class="imb_social_discussion_topic">' + topic.question + '</h2>');
	$("#popupShowTopicAnswer").find("p").text( (topic.answer.trim() == '') ? $.t("text.show-answer-none") : topic.answer);
	if (!initialize) {
		imb_social_refresh();
	}
	$("#imb_btn_topic_answer_submit").show();
	$("#imb_btn_show_topic_answer").show();
	// change the text for the button to remove 'new' message comments
	$("#social_change_topic_" + topic.id).html(topic.name);
}

function get_topic_index(topic_id) {
	var list = book_list[book_list_idx].discussion_list;
	if (list == null || list.length < 1) {
		return -1;
	}
	var idx = 0, len = list.length;	
	for (; idx < len; idx++) {
		if (list[idx].id == topic_id) {
			break;
		}
	}
	return idx;
}

function refresh_discussion_topic_list(latest_page) {
	if (book_list_idx < 0) {
		return false;
	}
	
	nextTopicIndex = -1; // reset the global counter for checking for new topics
	$dom_list = $("#imb_social_topic_change_list").empty();
	var topic_data = book_list[book_list_idx].discussion_list;
	if ((topic_data.length > 0) && (latest_page >= 0)) {
		$("#imb_social_heading").data("discussion-id", 0);
		var shown = 0;
		for (var index = 0; index < topic_data.length; index++) {
			nextTopicIndex = index;
			// once we find the first topic that shouldn't be shown yet, stop
			// adding topics to the list and move on
			if (topic_data[index].page > latest_page) {
				break;
			}
			// if this topic is on the final page, it won't be loaded properly
			// so pretend the next topic is beyond the list
			if (topic_data[index].page == book_list[book_list_idx].page_list.length - 1) {
				nextTopicIndex++;
			}
			// create a link to load the topic
			var name = topic_data[index].name;
			if (socialManager.topicData.hasOwnProperty(topic_data[index].id) && socialManager.topicData[topic_data[index].id].number > 0) {
				name += ' <span class="chat-unread-number">(' + socialManager.topicData[topic_data[index].id].number + ' ' + $.t("text.chat-new") + ')</span>';
			}
			var $lnk = $(document.createElement("a")).html(name)
				.attr("id", "social_change_topic_" + topic_data[index].id)
				.attr("href", "#social_page").data("discussion-index", get_topic_index(topic_data[index].id))
				.click(function() {
					imb_change_chat_topic($(this).data("discussion-index"));
					return true;
				});
			var $li = $(document.createElement("li"));
			$lnk.appendTo($li);
			$li.prependTo($dom_list);
			shown++;
		}
		// show the change-topic button if we have at least one topic
		if (shown > 0) {
			$("#imb_btn_topic_change").show();
			// initialize the topic to the most recent one
			imb_change_chat_topic(nextTopicIndex < 1 ? get_topic_index(topic_data[0].id) : nextTopicIndex - 1, true);
		}
	}
	// refresh the jQuery list
	$dom_list.listview("refresh");
}

function update_discussion_answer(topic_id, answer) {
	book_list[book_list_idx].discussion_list.forEach(function(topic){
		if (topic.id == topic_id) {
			topic.answer = answer;
		}
	});
}

/***
 * Given the set of messages, update the DOM elements so that the displayed
 * list of messages is up-to-date. This will also change the layout and types
 * of messages displayed depending on what conversation and user is selected.
 */	
function imb_social_create_display(data) {
	// clear the previous display first
	// TODO: this could be optimized by only adding new messages
	var list = document.getElementById("imb_convo_list");
	var $container = $('#imb_convo_box');
	/*while (list.firstChild) {
		list.removeChild(list.firstChild);
	}*/
	
	if ((data != undefined) && (data.length > 0)) {
		// only scroll the list if the scrollbar is near the bottom
		var scrollDown = (list.childNodes.length < 1) || ($container.scrollTop() + $container.innerHeight() >= $container[0].scrollHeight - 20);
		var latest_dt = '';
		
		// then display all the data
		var index = 0, max = data[1].length;
		for (; index < max; index++) {
			var msg = data[1][index];
			var user_details = data[0][msg[0]];
			
			if (user_details) {
				imb_create_social_response(msg[1], list, {
					msg_id	     : imb_create_social_msg_id(msg[0], msg[2]),
					avatar_image : user_details[2],
					active_user  : user_details[1],
					timestamp	 : msg[2],
					can_change_avatar : user_details[1],
					user_name	 : user_details[0]
				});
			}
			else {
				imb_create_social_response(msg[1], list, {
					msg_id	     : imb_create_social_msg_id(msg[0], msg[2]),
					avatar_image : null,
					active_user  : false,
					timestamp	 : msg[2],
					can_change_avatar : false,
					user_name	 : ""
				});
			}
			latest_dt = msg[2];
		}
		
		// update the social manager to use the new latest date
		$header = $("#imb_social_heading");
		if ($header.data("discussion-id") > 0) {
			if (!socialManager.topicData.hasOwnProperty($header.data("discussion-id"))) {
				socialManager.topicData[$header.data("discussion-id")] = {
					timestamp: '', number: 0
				};
			}
			socialManager.topicData[$header.data("discussion-id")].timestamp = latest_dt;
		}
		else {
			var bookclub = ($header.data("action-id") == 2) ? 0 : $header.data("social-id");
			if (!socialManager.groupData.hasOwnProperty(bookclub)) {
				socialManager.groupData[bookclub] = {
					timestamp: '', number: 0
				};
			}
			socialManager.groupData[bookclub].timestamp = latest_dt;
		}
		
		// scroll to the bottom if this is the first display
		if (scrollDown) {
			$container.scrollTop($container.prop("scrollHeight"));
		}
	}
}

function imb_create_social_msg_id(user_id, dt_string) {
	return "imb_msg_" + user_id + "_" + dt_string.replace(/[-:\s]/g, "_");
}

/**
 * Creates the DOM elements for displaying a single response.
 */
function imb_create_social_response(message, container, options) {
	// determine the style to use
	var style = (options.active_user) ? "imb_social_msg_right" : "imb_social_msg_left";
	// create the list element, which holds it all together
	var node = document.createElement("li");
	node.id = options.msg_id;
	// if we already have this message displayed, don't add it again
	if (document.getElementById(options.msg_id) != null) {
		return;
	}
	container.appendChild(node);
	
	// create an image for the avatar
	if (options.avatar_image) {
		var tmp = document.createElement("img");
		tmp.src = options.avatar_image;
		
		// if this is the user's image,  make it click-able so the user can
		// change the image
		if (options.can_change_avatar) {
			$('<a href="#imb_social_choose_avatar" data-rel="popup"></a>')
				.appendTo( $(node) )
				.append( $(tmp) );
		}
		else {
			node.appendChild(tmp);
		}
	}
	else {
		// change style to remove space for the image
		style += "_full";
	}
	// use the style appropriate for the message
	node.classList.add(style);
	// add the username and timestamp
	if (options.user_name) {
		tmp = document.createElement("span");
		tmp.classList.add("chat-name");
		tmp.innerHTML = options.user_name;
		node.appendChild(tmp);
	}
	if (options.timestamp) {
		tmp = document.createElement("span");
		tmp.classList.add("chat-date");
		tmp.innerHTML = format_chat_date(better_date(options.timestamp));
		node.appendChild(tmp);
	}
	
	// create the message
	tmp = document.createElement("p");
	tmp.innerHTML = message;
	if (options.user_name || options.timestamp) {
		tmp.classList.add("chat-padded-text");
	}
	node.appendChild(tmp);
	
	// activate any definitions in the messages
	if (options.add_definition) {
		$(tmp).html(message);
		imb_activate_definition(tmp);
	}
	else {
		$(tmp).text(message);
	}
	
	// create the name for the message
	/*tmp = document.createElement("label");
	tmp.htmlFor = msg_id;
	tmp.innerHTML = (data[1] == null) ? "Unknown" : data[1];
	node.appendChild(tmp);*/
	
	// and create the timestamp
	/*tmp = document.createElement("p");
	tmp.classList.add("imb_social_timestamp");
	tmp.innerHTML = data[3];
	node.appendChild(tmp);*/
}
var MonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
function format_chat_date(date_object) {
	return (MonthNames[date_object.getMonth()]) + " " + date_object.getDate() + /*"-" + date_object.getFullYear() +*/ " at " +
		( (date_object.getHours() > 12)
			? ((date_object.getHours()-12) + ":" + ((date_object.getMinutes() < 10) ? + '0' : '') + date_object.getMinutes() + ":" + ((date_object.getSeconds() < 10) ? + '0' : '') + date_object.getSeconds() + " PM")
			: (date_object.getHours() + ":" + ((date_object.getMinutes() < 10) ? + '0' : '') + date_object.getMinutes() + ":" + ((date_object.getSeconds() < 10) ? + '0' : '') + date_object.getSeconds() + " AM") );
}
function better_date(date_string) {
	var result = new Date();
	// expects a date string of 'yyyy-mm-dd hh:mm:ss' and converts it to
	// a UTC date object
	var date_time = date_string.split(' ');
	if (date_time.length > 0) {
		var date_info = date_time[0].split('-');
		// remember that this expects 0 to 11 for month, but the string is 1 to 12
		result.setUTCFullYear(date_info[0], (date_info[1] - 1), date_info[2]);
	}
	if (date_time.length > 1) {
		var time_info = date_time[1].split(':');
		result.setUTCHours(time_info[0], time_info[1], time_info[2]);
	}
	// default value will be today's date
	return result;
}
// asks the server if this user has new messages
function imb_check_messages() {
	// check what book we're looking at, then ask for the latest message data
	if (book_list_idx < 0)
		return;
	imb_social_check_new_message(book_list[book_list_idx].book_id, socialManager.groupData, socialManager.topicData, imb_refresh_message_status);
}
// updates the internal containers and the UI to indicate whether new messages exist
function imb_refresh_message_status(data) {
	if (data && data.groups && data.topics) {
		socialManager.refresh(data.groups, data.topics);
	}
	// change the UI to indicate new messages
	$("#imb_btn_social_open").html( (socialManager.totalNew > 0) ? socialManager.totalNew : '&nbsp');
	// changing labels for the topic chat buttons
	book_list[book_list_idx].discussion_list.forEach(function(topic){
		var result = "";
		if (socialManager.topicData.hasOwnProperty(topic.id) && socialManager.topicData[topic.id].number > 0) {
			result = '(' + socialManager.topicData[topic.id].number + ' ' + $.t("text.chat-new") + ')';
		}
		$("social_change_topic_" + topic.id).find(".chat-unread-number").text(result);
	});
	
	// update label for local chat room
	var $btn = $("#imb_social_open_change_local");
	var group_id = $btn.data("social-id");
	var num = 0;
	result = "";
	if (socialManager.groupData.hasOwnProperty(group_id) && socialManager.groupData[group_id].number > 0) {
		result = '(' + socialManager.groupData[group_id].number + ' ' + $.t("text.chat-new") + ')';
		num += socialManager.groupData[group_id].number;
	}
	$btn.find(".chat-unread-number").text(result);
	// update label for global chat room
	$btn = $("#imb_social_open_change_global");
	result = "";
	if (socialManager.groupData.hasOwnProperty(0) && socialManager.groupData[0].number > 0) {
		result = '(' + socialManager.groupData[0].number + ' ' + $.t("text.chat-new") + ')';
		num += socialManager.groupData[0].number;
	}
	$btn.find(".chat-unread-number").text(result);
	// update the labels for open chat button(s)
	result = "";
	if (num > 0) {
		result = '(' + num + ' ' + $.t("text.chat-new") + ')';
	}
	$btn = $("#imb_btn_free_chat").find(".chat-unread-number").text(result);
	$btn = $("#imb_btn_free_chat_choice").find(".chat-unread-number").text(result);
	
	// changing labels for the change-group buttons for admins
	for (var id in socialManager.groupData) {
		result = "";
		if (socialManager.groupData[id].number > 0) {
			result = '(' + socialManager.groupData[id].number + ' ' + $.t("text.chat-new") + ')';
		}
		$("social_change_group_" + id).find(".chat-unread-number").text(result);
	}
	
	// NOTE: the 'change topic' button is broken when no topics are yet available (disable it until there are topics to talk about)
	
}
