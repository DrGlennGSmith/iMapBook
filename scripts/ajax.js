/* iMapBook Application (IMB) - ajax functions
 * University of South Florida
 * 10/01/2012
 =======
 /* iMapBook Application (IMB) - ajax functions
 * iMapBook LLC
 * All Rights Reserved
 * 04/08/2014
 >>>>>>> master
 * 
 * Version 2.5
 */

// process user login and password and decide which book library file to use
function imb_login(user, pass, token, error_handler) {
    $.ajax({
        type: "GET",
        url: "service.php",
        data: {
            action: "login",
            imb_user: user,
            imb_pass: pass,
            imb_token: token
        },
        dataType: "json",
        async: false,

        beforeSend: function (){
            $.mobile.loading('show');
        },
        
        success: function (jd) { // returns Json Data
            $.mobile.loading('hide');
            if (debug)
                console.log(jd);
            if (jd.status == 'error') {
				if (error_handler) {
					error_handler.call(null, jd.value);
				}
				else {
					window.alert(jd.value);
				}
            } else {
				finish_login(jd)
            }
        },
        error: function () {
            $.mobile.loading('hide');
			if (error_handler) {
				error_handler.call(null, "Unable to authenticate. Please try again later.");
			}
			else {
				window.alert("Unable to authenticate. Please try again later.");
			}
        }
    });
}
// process user registration request and display error or load their bookshelf
function imb_register(user_name, login_name, pass, code, error_handler) {
    $.ajax({
        type: "POST",
        url: "service.php?action=register",
        data: {
            register_user_name: user_name,
            register_login_name: login_name,
            register_password: pass,
            register_code: code
        },
        dataType: "json",
        async: true,
        success: function (jd) {
            if (debug)
                console.log(jd);
            if (jd.status == 'error') {
				if (error_handler) {
					error_handler.call(null, jd.value);
				}
				else {
					window.alert(jd.value);
				}
            }
			else {
				finish_login(jd);
            }
        },
        error: function () {
			if (error_handler) {
				error_handler.call(null, "Unable to register. Please try again later.");
			}
			else {
				window.alert("Unable to register. Please try again later.");
			}
        }
    });
}

// archive user responses in a database table
function imb_archive(book_id, page_id, state_idx, response, response_type_id, response_weight) {
//if (debug) console.log("ARCHIVE:" + book_id + "," + page_id + "," + state_idx + "," + response + "," + response_type_id + "," + response_weight);
    if (location.hostname == '')
        return; // skip archive if running locally
    $.ajax({
        type: "GET",
        url: "service.php?action=archive",
        data: {
            imb_book_id: book_id,
            imb_page_id: page_id,
            imb_state_id: state_idx,
            imb_response: response,
            imb_response_type_id: response_type_id,
            imb_response_weight: response_weight
        },
        dataType: "json",
        async: false,
        success: function (jd) {
            if (debug)
                console.log(jd);
            if (jd.status == 'error') {
                window.alert(jd.value);
            }
        },
        error: function () {
            window.alert("Unable to archive your response.");
        }
    });
}

// obtain book usage data
function imb_book(book_idx, book_id) {
    if (location.hostname == '')
        return ""; // skip ajax if local
    $.ajax({
        type: "GET",
        url: "service.php?action=book",
        data: {
            imb_book_id: book_id
        },
        dataType: "json",
        async: false,
        success: function (jd) {
            if (debug)
                console.log(jd);
            if (jd.status == 'error') {
                window.alert(jd.value);
            } else {
                // set the current bookmark info
                book_list[book_idx].page_list_idx = parseInt(jd.book_page);
                book_list[book_idx].score = jd.book_score;
            }
        },
        error: function () {
            window.alert("Unable to read book data.");
        }
    });
}
// obtain book page usage data
function imb_book_pages(bidx) {
    var book = book_list[bidx];
    if (location.hostname == '')
        return ""; // skip ajax if local
    $.ajax({
        type: "GET",
        url: "service.php?action=pages",
        data: {
            imb_book_id: book.book_id
        },
        dataType: "json",
        async: false,
        success: function (jd) {
            if (debug)
                console.log(jd);
            if (jd.status == 'error') {
                window.alert(jd.value);
            } else {
                // set the current bookmark info
                for (var pidx = 0; pidx < jd.pages.length; pidx++) {
                    book.page_list[jd.pages[pidx][0]].complete = jd.pages[pidx][1];
                }
            }
        },
        error: function () {
            window.alert("Unable to read book page data.");
        }
    });
}

//TODO: obtain current user achievements and return formatted string for bookshelf display
function imb_achievements() {
    if (location.hostname == '')
        return ""; // skip ajax if local
    var ach = "";
    $.ajax({
        type: "GET",
        url: "service.php?action=achievement",
        data: {
        },
        dataType: "json",
        async: false,
        success: function (jd) {
            if (debug)
                console.log(jd);
            if (jd.status == 'error') {
                window.alert(jd.value);
            } else {
            }
        },
        error: function () {
            window.alert("Unable to read achievement data.");
        }
    });
    return ach;
}

//save and return a list of user objects
function imb_objects(book_id, object, action) {
    //if (debug) console.log(book_id);
    if (location.hostname == '')
        return object; // skip ajax if local
    var objs = "";
    $.ajax({
        type: "GET",
        url: "service.php?action=objects",
        data: {
            imb_book_id: book_id,
            imb_object: object,
            imb_action: action
        },
        dataType: "json",
        async: false,
        success: function (jd) {
            if (debug)
                console.log(jd);
            if (jd.status == 'error') {
                window.alert(jd.value);
            } else {
                objs = jd.objects;
            }
        },
        error: function () {
            window.alert("Unable to read objects data.");
        }
    });
    return objs;
}

function load_state_game(url, callback_success, callback_failure) {
    $.ajax({
        type: "GET",
        url: url,
		cache: false,
        dataType: "text",
        async: false,
        success: function (textStatus) {
            eval(textStatus);
            customGame = new Scenario(); //Implicitly global to allow stop
            window.game = customGame;
            customGame.run(callback_success, callback_failure);
        }
    });
}

function vpf_match(book_id, scenario_id, user_input) {
    if (debug) console.log('vpf_match: ' + book_id + ' ' + scenario_id + ' ' + user_input);
    if (location.hostname === '' || scenario_id === 0)
        return ''; // skip ajax if local or missing scenario
    var rval = '';
    $.ajax({
        type: "GET",
        url: "service.php?action=vpf_match",
        data: {
            imb_book_id: book_id,
            scenario_id: scenario_id,
            user_input: user_input
        },
        dataType: "json",
        async: false,
        success: function (jd) {
            if (debug)
                console.log(jd);
            if (jd.status === 'error') {
                window.alert(jd.value);
            } else {
                if (jd.state === 'match') {
                    rval = jd.value;
                    if (jd.audio != '') { // play it right now, Sam!
                        audio_player.src = "http://vpf2.cise.ufl.edu/Uploads/Audio/Speeches/" + scenario_id + "/" + jd.character + "/" + jd.audio;
                        audio_player.load();
                        audio_player.play();
                    }
                } else {
                    rval = '';
                }
            }
        },
        error: function () {
            window.alert("VPF service failed.");
        }
    });
    return rval;
}

function nlp_match(user_input, correct) {
    if (debug) console.log('nlp_match: ' + user_input + ' ' + correct);
    if (location.hostname === '' || user_input == '' || correct == '')
        return false; // skip ajax if local or missing inputs
    var rval = false;
    $.ajax({
        type: "GET",
        url: NLP_url + "/compare",
        data: {
			user: user_input.trim(),
			correct: correct.trim()
        },
        dataType: "json",
        async: false,
        success: function (jd) {
            if (debug)
                console.log(jd);
            if (!jd) {
				console.error("No response from NLP");
			} else if (!jd.success) {
				window.alert(jd.error);
            } else {
				rval = jd;
            }
        },
        error: function () {
            window.alert("No response from NLP");
        }
    });
    return rval;
}




// use this ajax call to get a list of social groups the user has access to
// passes an array of social_id, group_name to success_handler
function imb_social_get_groups(book_id, success_handler) {
	if (debug) console.log('getting social group list');
    if (location.hostname == '')
        return ""; // skip ajax if local
    $.ajax({
        type: "GET",
        url: "service.php",
        data: {
			action: "social_groups_list",
			imb_book_id: book_id
        },
        dataType: "json",
        async: true,
        success: function (jd) {
            if (debug)
                console.log(jd);
            if (jd.status == 'error') {
                window.alert(jd.value);
            } else if (success_handler) {
				success_handler.call(null, jd.value);
            }
        },
        error: function (jd) {
			console.log(jd);
            window.alert("Unable to get social group list.");
        }
    });
}


// use this ajax call to read social responses from a group
// passes an array of users (name, myself/others, avatar) and responses (user,
//   message, time) to success_handler
function imb_social_read(chat_type, social_id, book_id, page_id, state_id, topic_id, success_handler, latest_dt) {
    if (debug) console.log('social_read: ' + chat_type + ' ' + social_id + ' ' + book_id + ' ' + page_id + ' ' + state_id + ' ' + topic_id + ' ' + latest_dt);
    if (location.hostname == '')
        return ""; // skip ajax if local
    $.ajax({
        type: "GET",
        url: "service.php",
        data: {
			action:			"social_read",
			imb_social_profile: chat_type,
            imb_social_id: 	social_id,
            imb_book_id: 	book_id,
            imb_page_id: 	page_id,
            imb_state_id: 	state_id,
			imb_topic_id:	topic_id,
			imb_date:		(latest_dt !== undefined) ? latest_dt : ''
        },
        dataType: "json",
        async: true,
        success: function (jd) {
            if (debug)
                console.log(jd);
            if (jd.status == 'error') {
                window.alert(jd.value);
            } else if (success_handler) {
				success_handler.call(null, jd.value);
            }
        },
        error: function (jd) {
			console.log(jd);
			if (jd.statusText != "error") {
				window.alert("Unable to read from social group.");
			}
        }
    });
}

// use this ajax call to write social response to a group
function imb_social_write(chat_type, social_id, book_id, page_id, state_id, topic_id, response, success_handler, topic_answer) {
    if (debug) console.log('social_write: ' + chat_type + ' ' + social_id + ' ' + book_id + ' ' + page_id + ' ' + state_id + ' ' + topic_id  + ' "' + response + '"');
    if (location.hostname == '')
        return; // skip ajax if local
	
	// only send a non-empty response
	if (response.trim().length > 0) {
		$.ajax({
			type: "GET",
			url: "service.php",
			data: {
				action:			"social_write",
				imb_social_profile: chat_type,
				imb_social_id: 	(social_id === undefined) ? 0 : social_id,
				imb_book_id: 	book_id,
				imb_page_id: 	page_id,
				imb_state_id: 	state_id,
				imb_topic_id:	topic_id,
				imb_response: 	response.trim(),
				imb_as_answer:	topic_answer === true
			},
			dataType: "json",
			async: true,
			success: function (jd) {
				if (debug)
					console.log(jd);
				if (jd.status == 'error') {
					window.alert(jd.value);
				} else if (success_handler) {
					success_handler.call();
				}
			},
			error: function () {
				window.alert("Unable to write to social group.");
			}
		});
	}
}

function imb_social_set_avatar(img_num, success_handler) {
	if (debug) console.log('changing_avatar: ' + img_num);
    if (location.hostname == '')
        return; // skip ajax if local
	
	// only send a non-empty response
	if (img_num > 0) {
		$.ajax({
			type: "GET",
			url: "service.php",
			data: {
				action:		"social_avatar",
				image_name: img_num
			},
			dataType: "json",
			success: function(jd) {
				if (debug)
					console.log(jd);
				if (success_handler)
					success_handler.call(null, jd.value);
			},
			error: function() {
				window.alert("Failed to save changes to avatar.");
			}
		});
	}
}

function imb_social_get_max_avatar() {
	var num = 0;
	$.ajax({
		type: "GET",
		url: "service.php",
		async: false,
		data: {
			action: "avatar_num"
		},
		dataType: "json",
		success: function(jd) {
			num = jd.value;
		}
	});
	return num;
}

function imb_social_check_new_message(book_id, group_data, topic_data, success_handler) {
	if (debug) {
		console.log('check_new_messages: ' + book_id);
		console.log(group_data);
		console.log(topic_data);
	}
	if (location.hostname == '')
		return; // skip ajax if local
	// get list of waiting messages for the given bookclubs and topics
	$.ajax({
		type: "GET",
		url: "service.php",
		data: {
			action:	"social_check_new",
            imb_book_id: 	book_id,
			imb_group_obj: 	JSON.stringify(group_data),
			imb_topic_obj:	JSON.stringify(topic_data)
		},
		dataType: "json",
		success: function(jd) {
			if (debug) {
				console.log(jd);
			}
			if (success_handler) {
				success_handler.call(null, jd.value);
			}
		},
		error: function(ed) {
			console.error(ed);
		}
	});
}
