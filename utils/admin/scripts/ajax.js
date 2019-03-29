/* iMapBook Admin Tool - ajax functions
 * iMapBook LLC
 * All Rights Reserved
 * 04/08/2014
 * 
 * Version 2.5
 */

// process user login and password and display proper menu options
function imb_login(user, pass, error_handler) {
    $.ajax({
		type: "POST",
		url: "utils/admin/service.php",
		data: {
			action: "login",
			imb_user: user,
			imb_pass: pass
		},
		dataType: "json",
		async: true,
		success: function (jd) { // returns Json Data
			if (jd.status == 'error') {
				if (error_handler) {
					error_handler.call(null, jd.value);
				}
				else {
					window.alert(jd.value);
				}
			}
			else {
				load_developEnv(jd.developEnv_arr);
				load_menu(jd.login, jd.user_name, jd.type_id, jd.cohort_id, jd.cohort_arr, jd.audit_table);
			}
		},
		error: function () {
			if (error_handler) {
				error_handler.call(null, "Unable to authenticate. Please try again later.");
			}
			else {
				window.alert("Unable to authenticate. Please try again later.");
			}
		}
    });
}

//update books lists from the bookshelf file
function imb_books(filename) {
    var rv = '';
    $.ajax({
	type: "GET",
	url: "data/bookshelves/" + filename,
	dataType: "xml",
	async: false,
	success: function (xml) {
	    rv = xml;
	},
	error: function () {
	    window.alert("Bookshelf [" + bookshelf_file + "] not found!");
	}
    });
    return rv;
}

// gets the list of topics in this book
function imb_topics(book_location) {
	var discussion_list = [];
	$.ajax({
        type: "GET",
		url: "data/books/" + book_location + "/book.xml",
		dataType: "xml",
		async: false,
		success: function(xml, textStatus, jqXHR) {
			$(xml).find('book').each(function(idx){ // book
				$(this).find('discussion').find('topic').each(function() {
					var $this = $(this);
					var topic = new DiscussionTopic($this.attr("id"), $this.attr("name"), $this.text(), $this.attr("page"));
					discussion_list.push(topic);
				});
				// sort the discussion topics by page number, with furthest page number at the back;
				// for ties, convert the id into a number and sort those in ascending order
				discussion_list = discussion_list.slice().sort(function(b,a){
					return (a.page === b.page) ? (~~(b.id)) - (~~(a.id)) : b.page - a.page;
				});
			});
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.error(jqXHR);
			console.log(textStatus);
			console.log(errorThrown);			
		}
	});
	return discussion_list;
}

// run report and process returned data
function imb_run_report(postData, jtData, success_handler) {
    if (debug)
		console.log("imb_run_report: report_id=" + postData.report_id + " cohort_id=" + postData.cohort_id + " user_id=" + postData.user_id + " book_id=" + postData.book_id + " page_id=" + postData.page_id + " start_dt=" + postData.start_dt + " end_dt=" + postData.end_dt);
	// add the action details and then send the ajax request along
	postData.action = "report";
	postData.first_row = (jtData && jtData.jtStartIndex) ? jtData.jtStartIndex : 0;
	postData.total_rows = (jtData && jtData.jtPageSize) ? jtData.jtPageSize : 0;
	postData.sort_by = (jtData && jtData.jtSorting) ? jtData.jtSorting : "default";
	$.ajax({
		url: "utils/admin/service.php",
		type: 'GET',
		dataType: 'json',
		async: true,
		data: postData,
		success: success_handler,
		error: function(err) {
			console.error(err);
			success_handler.call(null, {});
		}
	});
}

// create user and return new user_id upon success
function imb_user_create(type_id, cohort_id, boookshelf, bookclub, user_name, login, password, avatar, group) {
    var rv = 0;
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "user_create",
	    imb_type_id: type_id,
	    imb_cohort_id: cohort_id,
	    imb_bookshelf: boookshelf,
	    imb_bookclub: bookclub,
	    imb_user_name: user_name,
	    imb_login: login,
	    imb_password: password,
		imb_avatar: avatar,
		imb_group: group
	},
	dataType: "json",
	async: false,
	success: function (jd) { // returns Json Data
	    if (jd.status == 'error') {
		window.alert(jd.value);
	    } else {
		rv = jd.value;
	    }
	},
	error: function () {
	    window.alert("Unable to create user. Please try again later.");
	}
    });
    return rv;
}
// delete user and return user_id upon success
function imb_user_delete(user_id) {
    var rv = 0;
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "user_delete",
	    imb_user_id: user_id
	},
	dataType: "json",
	async: false,
	success: function (jd) { // returns Json Data
	    if (jd.status == 'error') {
		window.alert(jd.value);
	    } else {
		rv = jd.value;
	    }
	},
	error: function () {
	    window.alert("Unable to delete user. Please try again later.");
	}
    });
    return rv;
}
// update user and return user_id upon success
function imb_user_update(user_id, type_id, boookshelf, bookclub, user_name, login, password, avatar, group) {
    var rv = 0;
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "user_update",
	    imb_user_id: user_id,
	    imb_type_id: type_id,
	    imb_bookshelf: boookshelf,
	    imb_bookclub: bookclub,
	    imb_user_name: user_name,
	    imb_login: login,
	    imb_password: password,
		imb_avatar: avatar,
		imb_group: group
	},
	dataType: "json",
	async: false,
	success: function (jd) { // returns Json Data
	    if (jd.status == 'error') {
		window.alert(jd.value);
	    } else {
		rv = jd.value;
	    }
	},
	error: function () {
	    window.alert("Unable to update user. Please try again later.");
	}
    });
    return rv;
}

function imb_clear_audit(user_id) {
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "clear_audit",
	    user_id: user_id
	},
	dataType: "json"
    });

    //$("#"+user_id).remove();
}

function imb_link_audit(user_id, auditor_id) {
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "link_audit",
	    user_id: user_id,
	    auditor_id: auditor_id
	},
	dataType: "json"
    });
}

// create cohort and return new cohort_id upon success
function imb_cohort_create(name, code, library, room, bookcase, bookshelves, bookclubs, socialProfile) {
    var rv = 0;
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "cohort_create",
	    imb_name: name,
	    imb_code: code,
	    imb_library: library,
	    imb_room: room,
	    imb_bookcase: bookcase,
	    imb_bookshelves: bookshelves,
	    imb_bookclubs: (bookclubs !== undefined) ? bookclubs : 3,
	    imb_social_profile: (socialProfile !== undefined) ? socialProfile : 0
	},
	dataType: "json",
	async: false,
	success: function (jd) { // returns Json Data
	    if (jd.status == 'error') {
		window.alert(jd.value);
	    } else {
		rv = jd.value;
	    }
	},
	error: function () {
	    window.alert("Unable to create cohort. Please try again later.");
	}
    });
    return rv;
}
// delete cohort and return cohort_id upon success
function imb_cohort_delete(cohort_id) {
    var rv = 0;
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "cohort_delete",
	    imb_cohort_id: cohort_id
	},
	dataType: "json",
	async: false,
	success: function (jd) { // returns Json Data
	    if (jd.status == 'error') {
		window.alert(jd.value);
	    } else {
		rv = jd.value;
	    }
	},
	error: function () {
	    window.alert("Unable to delete cohort. Please try again later.");
	}
    });
    return rv;
}
// update cohort and return cohort_id upon success
function imb_cohort_update(cohort_id, name, code, library, room, bookcase, bookshelves, bookclubs, socialProfile) {
    var rv = 0;
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "cohort_update",
	    imb_cohort_id: cohort_id,
	    imb_name: name,
	    imb_code: code,
	    imb_library: library,
	    imb_room: room,
	    imb_bookcase: bookcase,
	    imb_bookshelves: bookshelves,
	    imb_bookclubs: bookclubs,
	    imb_social_profile: socialProfile
	},
	dataType: "json",
	async: false,
	success: function (jd) { // returns Json Data
	    if (jd.status == 'error') {
		window.alert(jd.value);
	    } else {
		rv = jd.value;
	    }
	},
	error: function (data) {
		console.error(data);
	    window.alert("Unable to update cohort. Please try again later.");
	}
    });
    return rv;
}

// create social group and return new social_id upon success
function imb_social_create(name, desc) {
    var rv = 0;
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "social_create",
	    imb_name: name,
	    imb_desc: desc
	},
	dataType: "json",
	async: false,
	success: function (jd) { // returns Json Data
	    if (jd.status == 'error') {
		window.alert(jd.value);
	    } else {
		rv = jd.value;
	    }
	},
	error: function () {
	    window.alert("Unable to create social group. Please try again later.");
	}
    });
    return rv;
}
// delete social group and return social_id upon success
function imb_social_delete(social_id) {
    var rv = 0;
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "social_delete",
	    imb_social_id: social_id
	},
	dataType: "json",
	async: false,
	success: function (jd) { // returns Json Data
	    if (jd.status == 'error') {
		window.alert(jd.value);
	    } else {
		rv = jd.value;
	    }
	},
	error: function () {
	    window.alert("Unable to delete book club. Please try again later.");
	}
    });
    return rv;
}
// update cohort and return social_id upon success
function imb_social_update(social_id, name, desc) {
    var rv = 0;
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "social_update",
	    imb_social_id: social_id,
	    imb_name: name,
	    imb_desc: desc
	},
	dataType: "json",
	async: false,
	success: function (jd) { // returns Json Data
	    if (jd.status == 'error') {
		window.alert(jd.value);
	    } else {
		rv = jd.value;
	    }
	},
	error: function () {
	    window.alert("Unable to update book club. Please try again later.");
	}
    });
    return rv;
}
// 
function imb_social_get_groups(cohort_id, success_handler) {
	if (debug) console.log('getting social group list: ' + cohort_id);
    if (location.hostname == '')
        return ""; // skip ajax if local
    $.ajax({
        type: "GET",
        url: "utils/admin/service.php",
        data: {
			action: 	"social_groups_list",
			imb_cohort: cohort_id
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
        error: function () {
            window.alert("Unable to get social group list.");
        }
    });
}
//
function imb_social_get_messages(options, success_handler) {
	if (debug) console.log('social_messages: ' + JSON.stringify(options));
    if (location.hostname == '')
        return ""; // skip ajax if local
    $.ajax({
        type: "GET",
        url: "utils/admin/service.php",
        data: {
			action:		"social_messages",
			imb_cohort: options.cohort_id,
			imb_book: 	options.book_id,
			imb_topic: 	options.topic_id,
			imb_period: options.period,
			imb_dates:  JSON.stringify(options.date_list)
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
        error: function () {
            window.alert("Unable to read messages from social groups.");
        }
    });
}
// use this ajax call to write social response to a group
function imb_social_write(social_id, social_profile, book_id, topic_id, response) {
    if (debug) console.log('social_write: ' + social_id + ' ' + book_id + ' ' + topic_id + ' ' + response);
    if (location.hostname == '')
        return; // skip ajax if local
	// only send a non-empty response
	if (response.trim().length > 0) {
		$.ajax({
			type: "GET",
			url: "utils/admin/service.php",
			data: {
				action:			"social_write",
				imb_social_profile:	social_profile,
				imb_social_id: 	social_id,
				imb_book_id: 	book_id,
				imb_topic_id: 	topic_id,
				imb_response: 	response.trim()
			},
			dataType: "json",
			async: true,
			success: function (jd) {
				if (debug)
					console.log(jd);
				if (jd.status == 'error') {
					window.alert(jd.value);
				}
			},
			error: function () {
				window.alert("Unable to write to social group.");
			}
		});
	}
}
// use this to block an entire chat group
function imb_social_block_chat(cohort_id, social_id, block_it) {
	if (debug) console.log('social_block_chat: ' + cohort_id + ' social ' + social_id + ' to ' + block_it);
    if (location.hostname == '')
        return ""; // skip ajax if local
    $.ajax({
        type: "GET",
        url: "utils/admin/service.php",
        data: {
			action:		"social_block_chat",
			imb_cohort: cohort_id,
			imb_social: social_id,
			imb_block:  ((block_it) ? 1 : 0)
        },
        dataType: "json",
        async: true,
        error: function () {
            console.error("Blocking chat failed");
        }
    });
}
// use this to archive all text up until the time point of archiving
function imb_social_archive_chat(cohort_id, social_id, profile_id) {
	if (debug) console.log('social_archive_chat: ' + cohort_id + ' social ' + social_id + ' of profile ' + profile_id);
	if (location.hostname == '')
		return ""; // skip ajax if local
	$.ajax({
		type: "GET",
		url: "utils/admin/service.php",
		data: {
			action:		"social_archive_chat",
			imb_cohort:	cohort_id,
			imb_social: social_id,
			imb_profile:profile_id
		},
		dataType: "json",
		async: true,
		error: function() {
			console.error("Archiving chat failed");
		}
	});
}
// use this to block a user from talking the chat
function imb_social_block_user(user_id, block_it) {
	if (debug) console.log('social_block_user: ' + user_id + ' set to ' + block_it);
	if (location.hostname == '')
		return ""; // skip ajax if local
	$.ajax({
		type: "GET",
		url: "utils/admin/service.php",
		data: {
			action:		"social_block_user",
			imb_user:	user_id,
			imb_block:  ((block_it) ? 1 : 0)
		},
		dataType: "json",
		async: true,
		error: function() {
			console.error("Blocking user on chat failed");
		}
	});
}
// use this to block a specific message in chat
function imb_social_block_message(msg_id, block_it) {
	if (debug) console.log('social_block_message: ' + msg_id + ' set to ' + block_it);
	if (location.hostname == '')
		return ""; // skip ajax if local
	$.ajax({
		type: "GET",
		url: "utils/admin/service.php",
		data: {
			action:		"social_block_message",
			imb_msg:	msg_id,
			imb_block:  ((block_it) ? 1 : 0)
		},
		dataType: "json",
		async: true,
		error: function() {
			console.error("Blocking message on chat failed");
		}
	});
}
// gets the number of user avatar images in the data directory
function imb_social_get_max_avatar() {
	var num = 0;
	$.ajax({
		type: "GET",
		url: "service.php", /* NOTE: this is the eReader service, not the Admin service */
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


//get listing of all development directories
function imb_developEnv() {
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "develop"
	},
	async: false,
	success: function (jd) { // returns Json Data
	    if (jd.status == 'error') {
		window.alert(jd.value);
	    } else {
		load_developEnv(jd.developEnv_arr);
	    }
	},
	error: function () {
	    window.alert("Unable to retrieve development environments. Please try again later.");
	}
    });

}

// get list of books from server files
function imb_bookList(folder, orig) {
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "books",
	    imb_folder: folder
	},
	dataType: "json",
	async: false,
	success: function (jd) { // returns Json Data
	    if (jd.status == 'error') {
		window.alert(jd.value);
	    } else {
		loadBooks(jd.books_arr, orig);

	    }
	},
	error: function () {
	    window.alert("Unable to retrieve books from server. Please try again later.");
	}
    });

}

// delete book from server files
function imb_deleteSrcBook(book, src) {
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "delete_book",
	    imb_book: book,
	    imb_src: src
	},
	dataType: "json",
	async: false,
	success: function (jd) { // returns Json Data
	    if (jd.status == 'error') {
		window.alert(jd.value);
	    } else {
		loadBooks(jd.books_arr, "src");

	    }
	},
	error: function () {
	    window.alert("Unable to retrieve books from server. Please try again later.");
	}
    });
}

// update book
// retrieves the book directly and modifies it using jQuery before returning to server for write process
function imb_updateSrcBook(book, src) {
    var newxml;

    //path should be something like "/dev/john/data/books/science-weightless/" when finished
    var path = src + "/data/books/" + book + "/";

    //Replace with method to get path from form
    $.ajax({
	url: path + "book.xml", //".."+src+"/data/books/"+book+"/book.xml",
	dataType: "xml",
	async: false,
	success: function (xml) {
	    newxml = updateXml(xml);
	    writeBack(newxml, path);
	},
	error: function () {
	    console.log("AJAX error. Please try again later.");
	}
    });
}

// delete book from server files
function imb_deleteDestBook(book, src) {
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "delete_book",
	    imb_book: book,
	    imb_src: src
	},
	dataType: "json",
	async: false,
	success: function (jd) { // returns Json Data
	    if (jd.status == 'error') {
		window.alert(jd.value);
	    } else {
		loadBooks(jd.books_arr, "dest");

	    }
	},
	error: function () {
	    window.alert("Unable to retrieve books from server. Please try again later.");
	}
    });

}

// copy book from source to destination 
function imb_copyBook(book, src, dest) {
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "copy_book",
	    imb_book: book,
	    imb_src: src,
	    imb_dest: dest
	},
	dataType: "json",
	async: false,
	success: function (jd) { // returns Json Data
	    if (jd.status == 'error') {
		window.alert(jd.value);
	    } else {
		loadBooks(jd.books_arr, "dest");

	    }
	},
	error: function () {
	    window.alert("Unable to copy books from server. Please try again later.");
	}
    });

}

// copy book from source to destination 
function imb_mergeBook(bookSrc, bookDest, src, dest) {
    $.ajax({
	type: "GET",
	url: "utils/admin/service.php",
	data: {
	    action: "merge_book",
	    imb_bookSrc: bookSrc,
	    imb_bookDest: bookDest,
	    imb_src: src,
	    imb_dest: dest
	},
	dataType: "json",
	async: false,
	success: function (jd) { // returns Json Data
	    if (jd.status == 'error') {
		window.alert(jd.value);
	    } else {
		window.alert("Books successfully merged.");

	    }
	},
	error: function () {
	    window.alert("Unable to copy books from server. Please try again later.");
	}
    });
}

function updateXml(xml) {
    //Iterate through the updater functions until the version is correct.
    var LATEST_VERSION = "2.0";

    var i = 0;
    while (true) {
	var bookVersion = $(xml).find("book").attr("version"); //Default in case there's no update
	if (bookVersion === undefined)
	{
	    bookVersion = "1.0";
	}

	if (bookVersion === LATEST_VERSION) {
	    break;
	}

	if (i === 100)
	{
	    alert("There was an issue in updating the book. Please try again later.");
	    break;
	}

	switch (bookVersion) {
	    case "1.0":
		xml = updatev10(xml);
		break;
	    default:
		i++;
		break;
	}

	i++;
    }

    return xml;
}

// Tell service.php to write the updated xml back to the server
function writeBack(newxml, path) {
    $.ajax({
	url: "utils/admin/service.php",
	type: "POST",
	data: {
	    action: "update_book",
	    xml: (new XMLSerializer).serializeToString(newxml),
	    path: path
	},
	dataType: "text",
	async: false,
	success: function (txt) {
	    console.log("Success. Received message " + txt);
	    alert("Book has been updated!");
	},
	error: function () {
	    alert("AJAX Error. Please try again later.");
	}
    });
}

function updatev10(xml) {
    $(xml).find("image_hotspot").each(function () {
	var xmlfrag = $.parseXML("<hotspot>\n\t\t\t\t\t<frame></frame>\n\t\t\t\t</hotspot>");
	var $hotspot = $(xmlfrag).find("hotspot");

	var $frame = $hotspot.find("frame");

	$frame.attr("file_name", $(this).attr("file_name"));
	$frame.attr("opacity", $(this).attr("opacity"));
	$frame.attr("xloc", $(this).attr("xloc"));
	$frame.attr("yloc", $(this).attr("yloc"));
	$frame.attr("width", $(this).attr("width"));
	$frame.attr("height", $(this).attr("height"));
	$frame.attr("word", $(this).attr("word"));
	$frame.html($(this).html());

	$(this).before($hotspot);

	$(this).remove();
    });

    $(xml).find("image_container").each(function () {
	var xmlfrag = $.parseXML("<container>\n\t\t\t\t\t<frame></frame>\n\t\t\t\t</container>");
	var $container = $(xmlfrag).find("container");

	var $frame = $container.find("frame");

	$container.attr("count", $(this).attr("count"));
	$container.attr("lock", $(this).attr("lock"));

	$frame.attr("file_name", $(this).attr("file_name"));
	$frame.attr("opacity", $(this).attr("opacity"));
	$frame.attr("xloc", $(this).attr("xloc"));
	$frame.attr("yloc", $(this).attr("yloc"));
	$frame.attr("width", $(this).attr("width"));
	$frame.attr("height", $(this).attr("height"));
	$frame.attr("word", $(this).attr("word"));
	$frame.html($(this).html());

	$(this).before($container);

	$(this).remove();
    });

    $(xml).find("image_draggable").each(function () {
	var xmlfrag = $.parseXML("<draggable>\n\t\t\t\t\t<frame></frame>\n\t\t\t\t</draggable>");
	var $draggable = $(xmlfrag).find("draggable");

	var $frame = $draggable.find("frame");

	$draggable.attr("clone", $(this).attr("clone"));

	$frame.attr("file_name", $(this).attr("file_name"));
	$frame.attr("opacity", $(this).attr("opacity"));
	$frame.attr("xloc", $(this).attr("xloc"));
	$frame.attr("yloc", $(this).attr("yloc"));
	$frame.attr("width", $(this).attr("width"));
	$frame.attr("height", $(this).attr("height"));
	$frame.attr("word", $(this).attr("word"));
	$frame.html($(this).html());

	$(this).before($draggable);

	$(this).remove();
    });

    $(xml).find("book").attr("version", "2.0");

    return xml;
}