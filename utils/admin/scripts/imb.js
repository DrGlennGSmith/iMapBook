/* iMapBook Admin Tool
 * iMapBook LLC
 * All Rights Reserved
 * 04/08/2014
 * 
 * Version 2.5
 *
 * NOTE: toSource() debug method will ONLY work in Firefox and may produce critical errors elsewhere!
 */
//----------------------------------------------------------------------------- load menu
function load_menu(login, user_name, type_id, cohort_id, cohort_arr, audit_tbl) {
    //Assign audit table
    audit_table = audit_tbl;

    // if (debug) console.log("load_menu: login=" + login + " user_name=" + user_name + " type_id=" + type_id + " cohort_arr=" + cohort_arr);
    user_type_id = parseInt(type_id);
    user_cohort_id = parseInt(cohort_id);

    // populate the cohort-user data structure
    for (var x = 0; x < cohort_arr.length; x++) {
		var cohortObject = new Cohort(cohort_arr[x][0], cohort_arr[x][1], cohort_arr[x][2], cohort_arr[x][3], cohort_arr[x][4], cohort_arr[x][5], cohort_arr[x][6], cohort_arr[x][7], cohort_arr[x][8]);
		for (var y = 0; y < cohort_arr[x][9].length; y++) {
			var userObject = new User(cohort_arr[x][9][y][0], cohort_arr[x][9][y][1], cohort_arr[x][9][y][2], cohort_arr[x][9][y][3], cohort_arr[x][9][y][4], cohort_arr[x][9][y][5], cohort_arr[x][9][y][6], cohort_arr[x][9][y][7], cohort_arr[x][9][y][8], cohort_arr[x][9][y][9], '', cohort_arr[x][9][y][10]);
			cohortObject.user_list.push(userObject);
		}
		// and add the social groups for this cohort
		for (y = 0; y < cohort_arr[x][10].length; y++) {
			var socialObject = new Social(cohort_arr[x][10][y][0], cohort_arr[x][10][y][1], cohort_arr[x][10][y][2], cohort_arr[x][10][y][3]);
			cohortObject.social_list.push(socialObject);
		}
		cohort_list.push(cohortObject);
    }

    // display the header
	var type_name = "";
	if (type_id & 1) {
		type_name += "reader";
	}
    if (type_id & 2) {
		type_name += ((type_name.length > 0) ? " | " : "") + "writer";
	}
    if (type_id & 4) {
		type_name += ((type_name.length > 0) ? " | " : "") + "admin";
	}
    if (type_id & 8) {
		type_name += ((type_name.length > 0) ? " | " : "") + "auditor";
	}
    $("#imb_menu_info").html("Welcome " + user_name + " (" + login + ")");
	$("#imb_menu_roles").html("You have " + type_name + " access");

    // generate default access mask for the user based on their access bits
    $("#imb_newuser_usertype").append(gen_user_type("imb_newuser_bits", 1));

	// TODO: this report needs to be removed because it doesn't work properly yet
	$(".report-remove").remove();
	// disable some features if not ADMIN
    if (!(type_id & 4)) {
		$("#imb_library_container").remove(); // remove library details
		$("#imb_chat_cohort_id").parent().remove(); // remove cohort selection for chat monitoring
		$("#imb_social_cohort_id").parent().remove(); // and social groups
		$(".report-admin-only").remove(); // remove reports that are only for admins
		// hide the cohort ID for reports, since only one is ever allowed, but don't
		// remove it since that will break stuff
		$("#imb_reports_cohort_id").parent().hide();
		
		// if neither admin nor writer, get rid of the cohort stuff; otherwise
		// writers should be able to edit their own cohort but not create/delete them
		if (!(type_id & 2)) {
			$("#imb_cohorts_container").remove();
			$("#imb_social_container").remove(); // remove bookclub details
		}
		else {
			$("#imb_new_cohort_container").remove();
			$("#imb_new_social_container").remove(); // writers can edit the social groups, not create/delete them
			// hide this, but don't delete it
			$("#imb_users_cohort_id").parent().hide();
		}
	}
    if (type_id == 8) { // disable some features if AUDITOR only
		$("#imb_users_container").remove(); // remove users
		$("#imb_cohorts_container").remove(); // remove cohorts
		$("#imb_social_container").remove(); // remove social groups
    }

    $.mobile.changePage("#menu", {transition: "pop"});
}

// return 0 or the index of cohort matching the cohort_id
//---------------------------------------------------------------------------------------------------
function get_cohort_idx(cohort_id) {
    for (var x = 0; x < cohort_list.length; x++) {
		if (cohort_list[x].cohort_id == cohort_id) {
			return x;
		}
    }
    return 0;
}

// return 0 or the index of social group matching the social_id
//---------------------------------------------------------------------------------------------------
function get_social_idx(cohort, social_id) {
    for (var x = 0; x < cohort.social_list.length; x++) {
		if (cohort.social_list[x].social_id == social_id) {
			return x;
		}
    }
    return 0;
}

// refresh cohort select options and set it
// --------------------------------------------------------------------------------------------------
function refresh_cohort_select(obj, cohort_id, show_all) {
	if (show_all) {
		if (user_type_id & 4) { // admin
			var rv = '<option value="all">All cohorts</option>';
		} else {
			var rv = '<option value="all" DISABLED>All cohorts</option>';
		}
	}
    for (x = 0; x < cohort_list.length; x++) {
		rv += '<option value="' + cohort_list[x].cohort_id + '"';
		if (cohort_list[x].cohort_id == cohort_id) {
			rv += " SELECTED";
		}
		rv += '>' + cohort_list[x].name + ' [ID: ' + cohort_list[x].cohort_id + ']' + '</option>';
    }
    $(obj).html(rv).selectmenu("refresh");
}
// refresh user select options based on a bit mask and set it
//----------------------------------------------------------------------------------------------------
function refresh_user_select(obj, cidx, bit_mask) {
    var rv = "";
    if (bit_mask == 1) {
		rv = '<option value="all">All Readers</option>';
    }
	else {
		rv = '<option value="all">All Records</option>';
    }
    var cohort = cohort_list[cidx];
    if (cohort != null) {
		for (x = 0; x < cohort.user_list.length; x++) {
			if (cohort.user_list[x].type_id & bit_mask) { // only display users matching the bit mask
				rv += '<option value="' + cohort.user_list[x].user_id + '">' + cohort.user_list[x].user_name + ' [ ' + cohort.user_list[x].login + ' ]' + '</option>';
			}
		}
	}
    $(obj).html(rv).selectmenu("refresh");
}
// refresh book select options based on a cohort library xml file
//----------------------------------------------------------------------------------------------------
function refresh_book_select(obj, cidx) {
	var cohort = cohort_list[cidx];
    var rv = '<option value="all">All books</option>';
	if (cohort != null) {
		// should we store the book details as we're loading them?
		var storeBook = false;
		if (chat_book_topic.cohort_id != cohort.id) {
			storeBook = true;
			chat_book_topic.cohort_id = cohort.id;
			chat_book_topic.books = {};
		}
		// get book list from the xml file and build the select menu for it
		var xml = imb_books(cohort.library);
		$(xml).find('cover').each(function () {
			var id = $(this).attr("book_id");
			rv += '<option value="' + id + '" data-location="' + $(this).attr('location') + '">' + $(this).attr("title") + ' [ID: ' + id + ']' + '</option>';
			// and store the book details too
			if (storeBook) {
				chat_book_topic.books[id] = {
					name: $(this).attr("title"),
					topics: {}
				}
				// load topics for the book too
				imb_topics($(this).attr('location')).forEach(function(topic){
					chat_book_topic.books[id].topics[topic.id] = topic.name;
				});
			}
		});
	}
    $(obj).html(rv).selectmenu("refresh");
}
// refresh topic select options based on the selected book xml file
//----------------------------------------------------------------------------------------------------
function refresh_topic_select(obj, book_select_id) {
	var book_file = $(book_select_id + " :selected").data("location");
    var rv = '<option value="none">Open chat only</option>';
	rv += '<option value="all" selected>All topics</option>';
	// if we were given a book id, open that book and load its topics
	if (book_file) {
		imb_topics(book_file).forEach(function(topic){
			rv += '<option value="' + topic.id + '">' + topic.name + ' [ID:' + topic.id + ']</option>';
		});
		//var xml = imb_books(cohort_list[cidx].library);
		/*$(xml).find('cover').each(function () {
		rv += '<option value="' + $(this).attr("book_id") + '">' + $(this).attr("title") + ' [ID: ' + $(this).attr("book_id") + ']' + '</option>';
		});*/
	}
    $(obj).html(rv).selectmenu("refresh");
}
// refresh bookclub select options based on the selected cohort
//----------------------------------------------------------------------------------------------------
function refresh_bookclub_select(obj, cidx) {
    var cohort = cohort_list[cidx];
    var rv = '<option value="all" selected>All bookclubs</option>';
	if (cohort != null) {
		// add each group in the cohort to the select box
		for (var i = 0; i < cohort.social_list.length && i < cohort.bookclubs; i++) {
			var bookclub = cohort.social_list[i];
			rv += '<option value=' + bookclub.social_id + '>' + bookclub.name + '</option>';
		}
	}
    $(obj).html(rv).selectmenu("refresh");
}

// generate restricted code for user roles and set the display based on the bit mask
// ------------------------------------------------------------------------------------------------------------------
function gen_user_type(bit_name, bit_mask) {
    var rv = "";
    var mods = "";
    for (var x = 0; x < type_list.length; x++) { // number of access roles / bits
		// if the access role cannot be assigned by this user type, then don't
		// even bother to create the button for it
		if (((x == 0) && !(user_type_id & 4 || user_type_id & 2)) || // only Admin or Writer can set the Reader bit
			((x == 1) && !(user_type_id & 4 || user_type_id & 2)) || // only Admin or Writer can set the Writer bit
			((x == 2) && !(user_type_id & 4)) || // only Admin can set Admin bit
			((x == 3) && !(user_type_id & 4 || user_type_id & 2))) {	// only Admin or Writer can set the Auditor bit
			continue;
		}
		
		rv += '<label for="' + bit_name + x + '">' + type_list[x][Math.pow(2, x)] + '</label>';
		if (bit_mask & Math.pow(2, x)) { // this is selected
			mods = "CHECKED ";
		} else {
			mods = " ";
		}
		rv += '<input name="' + bit_name + '[]" id="' + bit_name + x + '" type="checkbox" ' + mods + '>';
    }
    return rv;
}

// USER functions
// ----------------------------------------------------------------------------------------------------------------------------------
function refresh_users_list(cidx) {
    var cohort = cohort_list[cidx];
    $("#imb_users_collapsible_list").empty();
    if (typeof cohort == 'undefined')
	return;
    for (x = 0; x < cohort.user_list.length; x++) {
	var user = cohort.user_list[x];
	$("#imb_users_collapsible_list").append('<div class="imb_user_collapsible" data-role="collapsible" data-mini="true" data-theme="e" data-collapsed="true" id="imb_um_user" name="' + user.user_id + '" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d"><h3><div class="imb_user_header">' + gen_user_header(cidx, x) + '</div></h3></div>');
    }
    $("#imb_users_collapsible_list").collapsibleset("refresh");
}
function gen_user_header(cidx, uidx) {
    var cohort = cohort_list[cidx];
    var user = cohort.user_list[uidx];
    var rv = user.user_name + ' [ ' + user.login + ' ][ ' + user.group + ' ] '
		+ '( ' + user.created_dt + ' ) '
		+ ((user.bookshelf > 0) ? 'Bookshelf: ' + user.bookshelf + ' ' : '')
		+ ((user.bookclub > 0 && !(user.type_id & 2) && !(user.type_id & 4)) ? 'Bookclub: ' + (get_social_idx(cohort,user.bookclub) + 1) + ' ' : '');
    return rv;
}
function cf_user(cidx, uidx) {
    var cohort = cohort_list[cidx];
    var user = cohort.user_list[uidx];

    var auditList = '';
    var auditCount = 0;

    if (user.type_id & 8) {
	auditList += //Start audit list
		'<div class="imb_audit_list" data-theme="b">' +
		'<h3>Audit List</h3>' +
		'<div>' +
		'<div class="ui-grid-b">' +
		'<div class="ui-block-a">' +
		'<input type="text" data-mini="true" id="imb_add_audit_text" name="imb_add_audit_text" placeholder="Add By Username" />' +
		'</div>' +
		'<div class="ui-block-b">' +
		'<button data-mini="true" data-icon="plus" data-iconpos="notext" id="imb_add_audit_button">Add Audit</button>' +
		'</div>' +
		'<div class="ui-block-c">' +
		'</div>' +
		'</div>' +
		'</div>';
	//Add the audits		
	for (var i = 0; i < audit_table.length; i++) {
	    if (user.user_id == audit_table[i][1]) {
		auditCount++;

		//Find the appropriate user
		var linked;

		for (var j = 0; j < cohort.user_list.length; j++) {
		    if (cohort.user_list[j].user_id == audit_table[i][0]) {
			linked = cohort.user_list[j];
		    }
		}

		auditList +=
			'<div class="cf_auditor">' +
			linked.user_name + ": " + linked.user_id +
			'<button data-iconpos="notext" data-icon="delete" data-inline="true" id="' + audit_table[i][0] + '" onclick="imb_clear_audit(id);">Remove Audit</button>' +
			'</div>';
	    }
	}

	//Close the container
	auditList += '</div>';

    }

    if (auditCount === 0) {
	auditList = ''; //Nevermind, found no people they're auditing
    }

    var cf = '<div id="cf_user">' +
	    // User name/Login/Password
	    '<div class="ui-grid-c">' +
	    '<div class="ui-block-a">' +
	    '<div class="imb_form_label">' +
	    '<label for="imb_user_username">User Name</label>' +
	    '<input data-mini="true" id="imb_user_username" name="imb_user_username" type="text" value="' + user.user_name + '" />' +
	    '</div>' +
	    '</div>' + 
	    '<div class="ui-block-b">' +
	    '<div class="imb_form_label">' +
	    '<label for="imb_user_avatar">User Avatar</label>' +
	    '<input data-mini="true" id="imb_user_avatar" name="imb_user_avatar" type="text" value="' + user.avatar + '" />' +
	    '</div>' +
	    '</div>' +
	    '<div class="ui-block-c">' +
	    '<div class="imb_form_label">' +
	    '<label for="imb_user_login">Login</label>' +
	    '<input data-mini="true" id="imb_user_login" name="imb_user_login" type="text" value="' + user.login + '" />' +
	    '</div>' +
	    '</div>' +
	    '<div class="ui-block-d">' +
	    '<div class="imb_form_label">' +
	    '<label for="imb_user_password">Password</label>' +
	    '<input data-mini="true" id="imb_user_password" name="imb_user_password" type="password" value="********" />' +
	    '</div>' +
	    '</div>' +
	    '</div>' +
	    // User Type/Bookshelf/Bookclub
	    '<div class="ui-grid-c">' +
	    '<div class="ui-block-a">' +
	    '<div class="imb_form_label">' +
	    '<label for="imb_user_usertype">User Type</label>' +
	    '<fieldset data-mini="true" data-role="controlgroup" data-type="horizontal" id="imb_user_usertype"></fieldset>' +
	    '</div>' +
	    '</div>' +
	    '<div class="ui-block-b">' +
	    '<div class="imb_form_label">' +
	    '<label for="imb_user_bookshelf">Virtual Bookshelf</label>' +
	    '<input data-mini="true" id="imb_user_bookshelf" name="imb_user_bookshelf" type="text" value="' + user.bookshelf + '" />' +
	    '</div>' +
	    '</div>' +
	    '<div class="ui-block-c">' +
	    '<div class="imb_form_label">' +
	    '<label for="imb_user_bookclub">Bookclub</label>' +
		gen_user_bookclubs(cidx, uidx) +
	    '</div>' +
		'</div>' +
		'<div class="ui-block-d">' +
	    '<div class="imb_form_label">' +
	    '<label for="imb_user_group">Period</label>' +
	    '<input data-mini="true" id="imb_user_group" name="imb_user_group" type="text" value="' + user.group + '" />' +
	    '</div>' +
	    '</div>' +
	    '</div>' +
	    // Buttons
	    '<div class="ui-grid-solo">' +
	    '<div class="ui-block-a imb_buttons_right">' +
	    '<a href="#" data-mini="true" data-role="button" data-inline="true" data-theme="b" id="imb_user_delete_btn">Delete User</a>' +
	    '<a href="#" data-mini="true" data-role="button" data-inline="true" data-theme="e" id="imb_user_update_btn">Update User</a>' +
	    '</div>' +
	    '</div>' +
	    // Audit List
	    auditList +
	    '</div>';

    console.a = user.type_id;
    console.b = auditList;
    console.c = cf;

    return cf;
}

function clear_new_user(cidx) {
	$("#imb_newuser_username").val("");
	$("#imb_newuser_login").val("");
	$("#imb_newuser_avatar").val("");
	$("#imb_newuser_password").val("");
	$("#imb_newuser_bookshelf").val("0");
	$("#imb_newuser_group").val("");
	// recreate the dropdown for all bookclubs available, with 'random' as default
	$("#imb_newuser_bookclub").html(gen_user_bookclubs(cidx, -1)).selectmenu("refresh");
	// force new users to always be readers
	$("#imb_newuser_bits0").prop("checked", true).checkboxradio("refresh");
	$("#imb_newuser_bits1").prop("checked", false).checkboxradio("refresh");
	$("#imb_newuser_bits2").prop("checked", false).checkboxradio("refresh");
	$("#imb_newuser_bits3").prop("checked", false).checkboxradio("refresh");
}
// create a select-menu object for assigning bookclubs to users (not for other contexts)
// this also adds none and random, and disables the select if user isn't a plain reader
function gen_user_bookclubs(cidx, uidx) {
    var cohort = cohort_list[cidx];
	if (uidx === undefined) {
		uidx = -1;
	}
    var user = (uidx < 0) ? { type_id: 1, bookclub: -1 } : cohort.user_list[uidx];
	// writers and admins do not need a bookclub assigned to them, since they can
	// talk in any club
	var allGroups = ((user.type_id & 2) || (user.type_id & 4)); 
	
	var txt = '<select data-mini="true" ' + ((uidx < 0) ? 'id="imb_newuser_bookclub" name="imb_newuser_bookclub"' : 'id="imb_user_bookclub" name="imb_user_booklub"') + 
		(allGroups ? 'disabled' : '') + '>';
	// for admins and such, explicitly state that they use all groups
	if (allGroups) {
		txt += '<option selected>All</option>';
	}
	else {
		// add a no-club option
		txt += '<option ' + ((user.bookclub == 0) ? 'selected ' : '') + 'value=0>None</option>';
		// add an option to randomly assign a bookclub to them
		txt += '<option ' + ((user.bookclub == -1) ? 'selected ' : '') + 'value=-1>Random</option>';
		// add each group in the cohort to the select box
		for (var i = 0; i < cohort.social_list.length && i < cohort.bookclubs; i++) {
			var bookclub = cohort.social_list[i];
			txt += '<option ' + ((user.bookclub == bookclub.social_id) ? 'selected ' : '')
				+ 'value=' + bookclub.social_id + '>'
				+ bookclub.name + '</option>';
		}
	}
	txt += '</select>';
	return txt;
}
// determine which bookclub has the least users and pick one of them at random
function get_random_bookclub(cohort_idx, user_id) {
	var clubs = {};
	var cohort = cohort_list[cohort_idx];
	if (!cohort || cohort.bookclubs < 1) {
		return 0;
	}
	// initialize containers for each bookclub, so we can identify clubs that
	// have no one in them
	for (var i = 0; i < cohort.social_list.length && i < cohort.bookclubs; i++) {
		clubs[cohort.social_list[i].social_id] = 0;
	}
	// then, get each user in the cohort and add it to the count for a club,
	// excluding the current user
	for (var i = 0; i < cohort.user_list.length; i++) {
		var user = cohort.user_list[i];
		if ((user_id != user.user_id) && (user.type_id == 1) && (user.bookclub > 0)) {
			clubs[user.bookclub]++;
		}
	}
	// now, figure out which clubs have the lowest amount
	var min = cohort.user_list.length;
	var toCheck = [];
	for (var club_id in clubs) {
		if (clubs.hasOwnProperty(club_id)) {
			if (clubs[club_id] < min) {
				toCheck = [];
				min = clubs[club_id];
			}
			if (clubs[club_id] == min) {
				toCheck.push(club_id);
			}
		}
	}
	// pick randomly from the available clubs
	if (toCheck.length < 1) {
		return 0;
	}
	var result = toCheck[Math.floor(Math.random() * toCheck.length)];
	return result;
}

// COHORT functions
//----------------------------------------------------------------------------------------------------------------------------------
function refresh_cohorts_list() {
    $("#imb_cohorts_collapsible_list").empty();
    for (x = 0; x < cohort_list.length; x++) {
	var cohort = cohort_list[x];
	$("#imb_cohorts_collapsible_list").append('<div class="imb_cohort_collapsible" data-role="collapsible" data-mini="true" data-theme="e" data-collapsed="true" id="imb_cm_cohort" name="' + cohort.cohort_id + '" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d"><h3><div class="imb_cohort_header">' + gen_cohort_header(x) + '</div></h3></div>');
    }
    $("#imb_cohorts_collapsible_list").collapsibleset("refresh");
}
function gen_cohort_header(cidx) {
    var cohort = cohort_list[cidx];
    var rv = cohort.name + ' [ ' + cohort.library + ' ] Room: ' + cohort.room + ' Bookcase: ' + cohort.bookcase;
    return rv;
}
function cf_cohort(cidx) {
    var cohort = cohort_list[cidx];
    var cf = '<div id="cf_cohort">' +
	    // Cohort Name/Code/Library
	    '<div class="ui-grid-b">' +
	    '<div class="ui-block-a">' +
	    '<div class="imb_form_label">' +
	    '<label for="imb_cohort_name">Cohort Name</label>' +
	    '<input data-mini="true" id="imb_cohort_name" name="imb_cohort_name" type="text" value="' + cohort.name + '" />' +
	    '</div>' +
	    '</div>' +
	    '<div class="ui-block-b">' +
	    '<div class="imb_form_label">' +
	    '<label for="imb_cohort_code">Code</label>' +
	    '<input data-mini="true" id="imb_cohort_code" name="imb_cohort_code" type="text" value="' + cohort.code + '" />' +
	    '</div>' +
	    '</div>' +
	    '<div class="ui-block-c">' +
	    '<div class="imb_form_label">' +
	    '<label for="imb_cohort_library">Library File</label>' +
	    '<input data-mini="true" id="imb_cohort_library" name="imb_cohort_library" type="text" value="' + cohort.library + '" />' +
	    '</div>' +
	    '</div>' +
	    '</div>' +
	    // Room/Bookcase/Bookshelves
	    '<div class="ui-grid-b">' +
	    '<div class="ui-block-a">' +
	    '<div class="imb_form_label">' +
	    '<label for="imb_cohort_room">Room</label>' +
	    '<input data-mini="true" id="imb_cohort_room" name="imb_cohort_room" type="text" value="' + cohort.room + '" />' +
	    '</div>' +
	    '</div>' +
	    '<div class="ui-block-b">' +
	    '<div class="imb_form_label">' +
	    '<label for="imb_cohort_bookcase">Bookcase</label>' +
	    '<input data-mini="true" id="imb_cohort_bookcase" name="imb_cohort_bookcase" type="text" value="' + cohort.bookcase + '" />' +
	    '</div>' +
	    '</div>' +
	    '<div class="ui-block-c">' +
	    '<div class="imb_form_label">' +
	    '<label for="imb_cohort_bookshelves">Max Bookshelves</label>' +
	    '<input data-mini="true" id="imb_cohort_bookshelves" name="imb_cohort_bookshelves" type="text" value="' + cohort.bookshelves + '" />' +
	    '</div>' +
	    '</div>' +
	    '</div>' +
	    // Delete Update Buttons
	    '<div class="ui-grid-a">' +
	    '<div class="ui-block-a">' +
	    '&nbsp;' +
	    '</div>' +
	    '<div class="ui-block-b">' +
	    '<div data-role="fieldcontain" class="ui-hide-label imb_buttons_right">' +
		((user_type_id & 4) ? '<a href="#" data-mini="true" data-role="button" data-inline="true" data-theme="b" id="imb_cohort_delete_btn">Delete Cohort</a>' : '') +
	    '<a href="#" data-mini="true" data-role="button" data-inline="true" data-theme="e" id="imb_cohort_update_btn">Update Cohort</a>' +
	    '</div>' +
	    '</div>' +
	    '</div>' +
	    '</div>';
    return cf;
}

// REPORT functions
//----------------------------------------------------------------------------------------------------------------------------------
function create_reports_table($table_div, report_id) {
	var fieldset = { };
	var title = '';
	// create the columns based on the report id (forced to be a number)
	switch(~~report_id) {
		// registration activity
		case 1:
			title = "Registration Activity";
			fieldset["user_id"] = { title: "User ID", width: "5%", ord: 0 };
			fieldset["user_name"] = { title: "Name", width: "10%", ord: 1 };
			fieldset["login"] = { title: "Login", width: "10%", ord: 2 };
			fieldset["register_date"] = { title: "Registration Date", width: "10%", ord: 3 };
			fieldset["cohort"] = { title: "Cohort", width: "5%", ord: 4 };
			fieldset["library"] = { title: "Library", width: "10%", ord: 5 };
			fieldset["code"] = { title: "Code", width: "5%", ord: 6 };
			fieldset["room"] = { title: "Room", width: "5%", ord: 7 };
			fieldset["bookshelf"] = { title: "Bookshelf", width: "5%", ord: 8 };
			fieldset["bookclub"] = { title: "Bookclub", width: "5%", ord: 9 };
			fieldset["institution"] = { title: "Institution", width: "10%", ord: 10 };
			fieldset["location"] = { title: "Location", width: "10%", ord: 11 };
			fieldset["role"] = { title: "Role", width: "10%", ord: 12 };
			break;
		
		// reader activity
		case 2:
			title = "Reader Activity";
			fieldset["user_id"] = { title: "User ID", width: "5%", ord: 0 };
			fieldset["user_name"] = { title: "Name", ord: 1 };
			fieldset["book_id"] = { title: "Book ID", width: "5%", ord: 2 };
			fieldset["page_id"] = { title: "Page", width: "5%", ord: 3 };
			fieldset["state_id"] = { title: "State", width: "5%", ord: 4 };
			fieldset["response_type"] = { title: "Type Code", width: "5%", ord: 5 };
			fieldset["response_text"] = { title: "Response", ord: 6 };
			fieldset["response_weight"] = { title: "Weight", width: "5%", ord: 7 };
			fieldset["response_time"] = { title: "Time", width: "10%", ord: 8 };
			break;
		
		// invalid responses
		case 3:
			title = "Invalid Responses";
			fieldset["response_text"] = { title: "Response", width: "90%", ord: 0 };
			fieldset["response_time"] = { title: "Time", width: "10%", ord: 8 };
			break;
		
		// response totals
		case 4:
			title = "Response Totals";
			fieldset["user_id"] = { title: "User ID", ord: 0 };
			fieldset["user_name"] = { title: "Name", ord: 1 };
			fieldset["positive"] = { title: "Positive", ord: 2 };
			fieldset["negative"] = { title: "Negative", ord: 3 };
			fieldset["mismatch"] = { title: "Mismatch", ord: 4 };
			fieldset["other"] = { title: "Other", ord: 5 };
			fieldset["total"] = { title: "Total", ord: 6 };
			break;
		
		// time report
		case 5:
			title = "Time Report";
			break;
		
		// time summary report
		case 6:
			title = "Time Summary";
			fieldset["user_id"] = { title: "User ID", sorting: false, ord: 0 };
			fieldset["user_name"] = { title: "Name", sorting: false, ord: 1 };
			fieldset["session"] = { title: "Session", sorting: false, ord: 2 };
			fieldset["book_id"] = { title: "Book ID", sorting: false, ord: 3 };
			fieldset["total_pages"] = { title: "Total Pages", sorting: false, ord: 4 };
			fieldset["total_time"] = { title: "Total Time", sorting: false, ord: 5 };
			fieldset["average_time"] = { title: "Average Time", sorting: false, ord: 6 };
			break;
		
		// reader responses
		case 7:
			title = "Reader Responses";
			fieldset["user_id"] = { title: "User ID", width: "5%", ord: 0 };
			fieldset["user_name"] = { title: "Name", ord: 1 };
			fieldset["book_id"] = { title: "Book ID", width: "5%", ord: 2 };
			fieldset["page_id"] = { title: "Page", width: "5%", ord: 3 };
			fieldset["state_id"] = { title: "State", width: "5%", ord: 4 };
			fieldset["response_type"] = { title: "Type Code", width: "5%", ord: 5 };
			fieldset["response_text"] = { title: "Response", ord: 6 };
			fieldset["response_weight"] = { title: "Weight", width: "5%", ord: 7 };
			fieldset["response_time"] = { title: "Time", width: "10%", ord: 8 };
			break;
		
		// quiz response
		case 8:
			title = "Quiz Responses";
			fieldset["user_name"] = { title: "Name", sorting: false, ord: 0 };
			fieldset["book_id"] = { title: "Book ID", sorting: false, width: "5%", ord: 1 };
			fieldset["page_id"] = { title: "Page", sorting: false, width: "5%", ord: 2 };
			fieldset["A1"] = { title: "Question 1", sorting: false, ord: 3 };
			fieldset["A2"] = { title: "Question 2", sorting: false, ord: 4 };
			fieldset["A3"] = { title: "Question 3", sorting: false, ord: 5 };
			fieldset["A4"] = { title: "Question 4", sorting: false, ord: 6 };
			fieldset["score"] = { title: "Score", sorting: false, width: "5%", ord: 7 };
			fieldset["potential"] = { title: "Potential", sorting: false, width: "5%", ord: 8 };
			fieldset["percent"] = { title: "Percent", sorting: false, width: "5%", ord: 9 };
			break;
		
		// freeform discussion
		case 9:
			title = "Freeform Discussion";
			fieldset["bookclub"] = { title: "Bookclub", width: "5%", ord: 0 };
			fieldset["user_id"] = { title: "User ID", width: "5%", ord: 1 };
			fieldset["user_name"] = { title: "User Name", ord: 2 };
			fieldset["book_id"] = { title: "Book ID", width: "5%", ord: 3 };
			fieldset["page_id"] = { title: "Page", width: "5%", ord: 4 };
			fieldset["message_text"] = { title: "Message", ord: 5 };
			fieldset["message_time"] = { title: "Message Time", width: "10%", ord: 6 };
			break;
		
		// topic-based discussions
		case 10:
			title = "Topic Discussions";
			fieldset["book_id"] = { title: "Book ID", width: "5%", ord: 0 };
			fieldset["topic"] = { title: "Topic", width: "5%", ord: 1 };
			fieldset["bookclub"] = { title: "Bookclub", width: "5%", ord: 2 };
			fieldset["user_id"] = { title: "User ID", width: "5%", ord: 3 };
			fieldset["user_name"] = { title: "Name", width: "10%", ord: 4 };
			fieldset["message_text"] = { title: "Message", ord: 5 };
			fieldset["message_time"] = { title: "Message Time", width: "10%", ord: 6 };
			fieldset["answer"] = { title: "Is Answer", width: "5%", ord: 7 };
			fieldset["page_id"] = { title: "Page", width: "5%", ord: 8 };
			break;
		
		// topic discussion answers
		case 11:
			title = "Topic Discussion Answers";
			fieldset["book_id"] = { title: "Book ID", width: "5%", ord: 0 };
			fieldset["topic"] = { title: "Topic", width: "5%", ord: 1 };
			fieldset["bookclub"] = { title: "Bookclub", width: "5%", ord: 2 };
			fieldset["user_id"] = { title: "User ID", width: "5%", ord: 3 };
			fieldset["user_name"] = { title: "Name", ord: 4 };
			fieldset["message_text"] = { title: "Message", ord: 5 };
			fieldset["message_time"] = { title: "Message Time", width: "10%", ord: 6 };
			break;
		
		// archived discussion
		case 12:
			title = "Archived Discussion";
			fieldset["book_id"] = { title: "Book ID", width: "5%", ord: 0 };
			fieldset["topic"] = { title: "Topic", width: "5%", ord: 1 };
			fieldset["bookclub"] = { title: "Bookclub", width: "5%", ord: 2 };
			fieldset["user_id"] = { title: "User ID", width: "5%", ord: 3 };
			fieldset["user_name"] = { title: "User Name", ord: 4 };
			fieldset["message_text"] = { title: "Message", ord: 5 };
			fieldset["message_time"] = { title: "Message Time", ord: 6 };
			fieldset["answer"] = { title: "Is Answer", width: "5%", ord: 7 };
			fieldset["page_id"] = { title: "Page", width: "5%", ord: 8 };
			break;
	}
	
	// create the new table
	// NOTE: we need to destroy the previous one first, we can't dynamically change the fields (column headers)
	$table_div.jtable("destroy");
	$table_div.empty().jtable({
			title: title,
			actions: {
				listAction: imb_reports_get_data
			},
			fields: fieldset,
			sorting: true,
			multiSorting: true,
			paging: true,
			pageSize : 10,
			toolbar: {
				items: [{
					icon: './css/jtable/export-excel.png',
					text: 'Export to CSV',
					click: function () {
						// gather again all the data regarding this report
						var postData = $table_div.data("toPost");
						imb_run_report(postData, {}, function(data){
							if (!data) {
								window.alert("Error generating CSV");
							}
							else {
								export_report_to_csv(data.Records, fieldset, $table_div.jtable("option", "title"));
							}
						});
					}
				}]
			}
		});
}
// called by the load function of jtable
function imb_reports_get_data(postData, jtParams) {
    return $.Deferred(function($dfd) {
		imb_run_report(postData, jtParams,
			function(data) {
				$dfd.resolve(data);
			});
    });
}
// called to convert the row data into CSV format and download it
function export_report_to_csv(records, fieldNames, reportName) {
	if (records.length < 1) {
		return;
	}
	var header = [];
	var csv = [];
	// add the header values first
	var headerRow = [];
	for (field in fieldNames) {
		if (fieldNames.hasOwnProperty(field)) {
			var data = fieldNames[field];
			headerRow[data.ord] = data.title;
			header[data.ord] = field;
		}
	}
	csv.push(headerRow.join(','));
	// then add all the data
	records.forEach(function(row){
		var csvRow = [];
		header.forEach(function(field){
			var text = "" + row[field];
			if (text && text.indexOf(',') > -1) {
				text = '"' + text + '"';
			}
			// put data in the order in which the fields should appear
			csvRow.push(text);
		});
		csv.push(csvRow.join(','));
	});

	// the file to download
    var csvFile = new Blob(["\uFEFF" + csv.join("\r\n")], {type: "text/csv"});

    // create a link element to download the file, use it, and then remove it
    var downloadLink = document.createElement("a");
    downloadLink.download = ((reportName) ? reportName.split(' ').join('') : "data") + ".csv";
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
	document.body.removeChild(downloadLink);
}

// SOCIAL functions
//----------------------------------------------------------------------------------------------------------------------------------
function refresh_social_list(cidx) {
	var cohort = cohort_list[cidx];
    $("#imb_social_collapsible_list").empty();
    for (x = 0; x < cohort.social_list.length && x < cohort.bookclubs; x++) {
		var social = cohort.social_list[x];
		$("#imb_social_collapsible_list").append('<div class="imb_social_collapsible" data-role="collapsible" data-mini="true" data-theme="e" data-collapsed="true" id="imb_cm_social" name="' + social.social_id + '" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d"><h3><div class="imb_social_header">' + gen_social_header(cidx, x) + '</div></h3></div>');
    }
	$("#imb_social_collapsible_list").collapsibleset("refresh");
}
function refresh_social_settings(cidx) {
	var cohort = cohort_list[cidx];
	$("#imb_social_bookclubs").val(cohort.bookclubs).slider("refresh");
	$("#imb_chatsetting_bookclubs").prop("checked", (cohort.social_profile & 1) > 0).checkboxradio("refresh");
	$("#imb_chatsetting_cohort").prop("checked", (cohort.social_profile & 2) > 0).checkboxradio("refresh");
	$("#imb_chatsetting_qlatest").prop("checked", (cohort.social_profile & 4) > 0).checkboxradio("refresh");
	
	$("#imb_social_settings_container").collapsibleset("refresh").collapsibleset("expand");
}
function gen_social_header(cidx, sidx) {
    var social = cohort_list[cidx].social_list[sidx];
    var rv = social.name;
	if (user_type_id & 4) {
		rv += ' [ id=' + social.social_id + ' ] ';
	}
    return rv;
}
function cf_social(cidx, sidx) {
    var social = cohort_list[cidx].social_list[sidx];
    var cf = '<div id="cf_social">' +
	    // Social Name/Description
	    '<div class="ui-grid-a">' +
	    '<div class="ui-block-a">' +
	    '<div class="imb_form_label">' +
	    '<label for="imb_social_name">Name</label>' +
	    '<input data-mini="true" id="imb_social_name" name="imb_social_name" type="text" value="' + social.name + '" />' +
	    '</div>' +
	    '</div>' +
	    '<div class="ui-block-b">' +
	    '<div class="imb_form_label">' +
	    '<label for="imb_social_desc">Description</label>' +
	    '<input data-mini="true" id="imb_social_desc" name="imb_social_desc" type="text" value="' + social.desc + '" />' +
	    '</div>' +
	    '</div>' +
	    '</div>' +
	    // Delete Update Buttons
	    '<div class="ui-grid-a">' +
	    '<div class="ui-block-a">' +
	    '&nbsp;' +
	    '</div>' +
	    '<div class="ui-block-b">' +
	    '<div data-role="fieldcontain" class="ui-hide-label imb_buttons_right">' +
		((user_type_id & 4) ? '<a href="#" data-mini="true" data-role="button" data-inline="true" data-theme="b" id="imb_social_delete_btn">Delete Book Club</a>' : '') +
	    '<a href="#" data-mini="true" data-role="button" data-inline="true" data-theme="e" id="imb_social_update_btn">Update Book Club</a>' +
	    '</div>' +
	    '</div>' +
	    '</div>' +
	    '</div>';
    return cf;
}

// CHAT monitoring functions
//----------------------------------------------------------------------------------------------------------------------------------
function refresh_chat_container(cohort_id) {
	var container = $("#imb_chat_logs");
	container.empty();
	container.removeClass();
	chat_updater.selected = { group: -1, topic: -1, book: -1 };
	// add loading image
	//container.append();
	// cancel the previous updater, if there is one
	stop_chat_monitor();
	// create the windows for each social group in the given cohort
	imb_social_get_groups(cohort_id, function(data){
		var cohort = cohort_list[get_cohort_idx(cohort_id)];
		var blockClasses = ['a', 'b', 'c', 'd'];
		// remove loading image
		container.empty();
		// adjust display if no chatting allowed
		if ((data === null) || (data.groups === null) || (data.groups.length <= 0)) {
			return;
		}
		// organize the panels horizontally
		var social_groups = data.groups;
		if (cohort.bookclubs >= 4) {
			container.addClass("ui-grid-c");
		}
		else if (cohort.bookclubs == 3) {
			container.addClass("ui-grid-b");
		}
		else if (cohort.bookclubs < 3) {
			container.addClass("ui-grid-a");
		}
		// create containers for each of the social groups
		chat_updater.dates = [];
		for (var i = 0; i < social_groups.length && i < cohort.bookclubs; i++) {
			container.append('<div class="ui-block-' + blockClasses[i % 4] + ' chat-window"><h3>' + social_groups[i][1] + '</h3>'
				+ '<div class="float-left"><label for="chat_monitor_block_' + social_groups[i][0] + '">Block Chat</label>'
				+ '<input id="chat_monitor_block_' + social_groups[i][0] + '" type="checkbox"' + ((social_groups[i][3] > 0) ? ' checked' : '') + '></div>'
				+ '<div class="float-right"><input id="chat_monitor_archive_' + social_groups[i][0] + '" type="button" value="Archive"></div>'
				+ '<div class="float-clear"></div>'
				/*+ '<div class="chat_monitor_checkbox"><label for="chat_monitor_block_' + social_groups[i][0] + '">Block Chat<label>'
				+ '<input id="chat_monitor_block_' + social_groups[i][0] + '" type="checkbox"' + ((social_groups[i][3] > 0) ? ' checked' : '') + '></div>'*/
				+ '<ul id="chat_monitor_' + social_groups[i][0] + '" class="chat-log' + ((social_groups[i][3] > 0) ? ' disable-chat' : '') + '"></ul>');
			// add the input box for sending messages
			if ((i + 1) % 4 === 0) {
				container.append('<div class="chat-monitor-input float-clear">'
					+ '<textarea class="chat-monitor-input-text" placeholder="Type your message to send"></textarea>'
					+ '<div class="chat-monitor-input-button float-right"><input type="button" class="chat-monitor-input-submit" value="Send Message"></div>'
					+ '</div>');
				$(".chat-monitor-input-submit").button().button("disable").on("click", send_chat_message);
				$(".chat-monitor-input-text").textinput().text("Click on a message to reply to it").textinput("disable");
			}
			
			// the starting date of January 1st, 2016, is given for every chat group
			// so that the monitors will start gathering all data
			chat_updater.dates.push(new Date(2016,0,1));
			
			// also, link the block button so that something actually happens
			$("#chat_monitor_block_" + social_groups[i][0]).checkboxradio({mini:true})
				.change(function(){
					// block or unblock it depending on whether the box is now checked/not
					// and then update the display
					imb_social_block_chat(cohort_id, $(this).data("group_id"), this.checked);
					if (this.checked) {
						$("#chat_monitor_" + $(this).data("group_id")).addClass("disable-chat");
					}
					else {
						$("#chat_monitor_" + $(this).data("group_id")).removeClass("disable-chat");
					}
					return false;
				})
				.data("group_id", social_groups[i][0]); //({ onText:"Unblock Chat", offText:"Block Chat", mini:true });
			$("#chat_monitor_archive_" + social_groups[i][0]).button({mini:true})
				.click(function(){
					var group_id = $(this).data("group_id");
					jqm_alert("Confirm", "Are you sure you want to archive all chat messages in " + $(this).data("group_name") + " up until now?", function () {
						imb_social_archive_chat(cohort_id, group_id, $("#imb_chat_social_profile").val());
						$("#chat_monitor_" + group_id).empty();
					}, '', "Yes", "No");
					return false;
				})
				.data("group_id", social_groups[i][0])
				.data("group_name", social_groups[i][1]);
		}
		$(".chat_monitor_checkbox").checkboxradio();
		// start the monitoring group
		start_chat_monitor(cohort_id);
	});
}
function start_chat_monitor(cohort_id) {
	// initialize and/or stop it if we're already running
	stop_chat_monitor();
	// create the options for what messages to load
	var chat_options = {
		cohort_id : cohort_id,
		book_id   : $("#imb_chat_book_id").val(),
		topic_id  : $("#imb_chat_topic_id").val(),
		period    : $("#imb_chat_period_id").val().trim(),
		date_list : chat_updater.dates
	};
	// ask for all chats for cohort X in group Y newer than time Z, then remember time Z
	imb_social_get_messages(chat_options, refresh_chat_messages);
	// then, have that same function repeat regularly
	chat_updater.interval = window.setInterval(function(){
		var chat_options = {
			cohort_id : cohort_id,
			book_id   : $("#imb_chat_book_id").val(),
			topic_id  : $("#imb_chat_topic_id").val(),
			period    : $("#imb_chat_period_id").val().trim(),
			date_list : chat_updater.dates
		};
		imb_social_get_messages(chat_options, refresh_chat_messages);
	}, 5000);
}
function send_chat_message() {
	if (chat_updater.selected.group < 0) {
		return;
	}
	var msg = $(".chat-monitor-input-text").val();
	$(".chat-monitor-input-text").val("");
	imb_social_write(chat_updater.selected.group, (chat_updater.selected.topic < 1) ? 1 : 4, chat_updater.selected.book, chat_updater.selected.topic, msg);
}

function refresh_chat_messages(data) {
	$.each(data, function(i, list){
		var bookclub = (list.length > 0) ? list[0][4] : '';
		var container = $("#chat_monitor_" + bookclub);
		if (!container[0]) {
			return;
		}
		// only scroll the if the scrollbar is near the bottom
		var scrollDown = ((list.length > 0) && (container.scrollTop() + container.innerHeight() >= container[0].scrollHeight - 20));
		// add each new message to the bottom
		$.each(list, function(j, msg){
			var newDate = better_date(msg[2]);
			if (newDate > chat_updater.dates[i]) {
				chat_updater.dates[i] = newDate;
			}
			var src = ((msg[6] > 0) ? (chat_book_topic.books[msg[5]].name + ': ' + ((chat_book_topic.books[msg[5]].topics[msg[6]]) ? chat_book_topic.books[msg[5]].topics[msg[6]] : 'Unknown Topic') ) : 'Unstructured Chat');
			var chatEntry = $(create_chat_message(msg[0], msg[1], newDate, msg[3], src));
			chatEntry.attr("data-group", bookclub)
				.attr("data-book", msg[5])
				.attr("data-topic", msg[6])
				.attr("data-user", msg[7])
				.data("ublock", msg[9] == 1)
				.data("msg", msg[8])
				.data("mblock", msg[10] == 1)
				.on("click", select_chat_group_to_send);
			create_chat_message_buttons(chatEntry);
			refresh_chat_message_block_status(chatEntry);
			container.append(chatEntry);
		});
		// scroll to the bottom if something was added, and the scroll window
		// was not moved up to review past messages
		if (scrollDown) {
			container.scrollTop(container[0].scrollHeight);
		}
	});	
}
// 
function select_chat_group_to_send() {
	var $me = $(this).first();
	var bookclub = $me.attr("data-group");
	var topic_id = $me.attr("data-topic");
	var book_id = $me.attr("data-book");
	var $container = $(".chat_monitor_" + bookclub);
	// show all messages
	$(".chat-message").removeClass("chat-message-unrelated");
	// enable and highlight all blocking controls
	$(".chat-monitor-block-user-button, .chat-monitor-block-message-button").each(function(index, elem){
		$(this).prop("disabled", false);
		refresh_chat_message_block_status($(this).parent());
	});
	// if we previously selected a group, also disable and dim it
	if ((chat_updater.selected.group == bookclub) && (chat_updater.selected.topic == topic_id) && (chat_updater.selected.book == book_id)) {
		chat_updater.selected = { group: -1, topic: -1, book: -1 };
		$(".chat-monitor-input-text").text("Click on a message to reply to it")
			.textinput("disable");
		$(".chat-monitor-input-submit").button("disable");
	}
	else {
		chat_updater.selected = { group: bookclub, topic: topic_id, book: book_id };
		// disable and dim all messages and controls not related to the selected topic
		$(".chat-message")
			.filter("[data-group!='" + chat_updater.selected.group + "']," +
					"[data-group='"  + chat_updater.selected.group + "'][data-book='"  + chat_updater.selected.book + "'][data-topic!='" + chat_updater.selected.topic + "']," +
					"[data-group='"  + chat_updater.selected.group + "'][data-book!='" + chat_updater.selected.book + "']" + ((chat_updater.selected.topic > 0) ? "" : "[data-topic!=0]"))
			.addClass("chat-message-unrelated")
			.find(".chat-monitor-block-user-button, .chat-monitor-block-message-button").prop("disabled", true);
		$(".chat-monitor-input-text").text("").textinput("enable");
		$(".chat-monitor-input-submit").button("enable");
	}
}
// updates how a single message element looks and functions relative to its blocked status
function refresh_chat_message_block_status(message_element) {
	var $message_element = $(message_element);
	// change the message coloring if it is hidden
	if ($message_element.data("mblock") || $message_element.data("ublock")) {
		$message_element.addClass("blocked-coloring");
		$message_element.removeClass("structured-coloring").removeClass("unstructured-coloring");
	}
	else if ($message_element.attr("data-topic") > 0) {
		$message_element.addClass("structured-coloring");
		$message_element.removeClass("blocked-coloring");
	}
	else {
		$message_element.addClass("unstructured-coloring");
		$message_element.removeClass("blocked-coloring");
	}
	// also disable the show/hide message button if it is blocked because of the user
	// bring up the avatar blocked image if the user is blocked
	if ($message_element.data("ublock")) {
		$message_element.find(".blocked-user-avatar").removeClass("display-hidden");
		$message_element.find(".chat-monitor-block-message-button").addClass("display-hidden");
	}
	else {
		$message_element.find(".blocked-user-avatar").addClass("display-hidden");
		$message_element.find(".chat-monitor-block-message-button").removeClass("display-hidden");
	}
}
// 
function create_chat_message_buttons($message_element) {
	// create buttons for blocking the user or message
	var btn = $('<button class="chat-monitor-block-user-button">' + (($message_element.data("ublock")) ? "Allow User" : "Block User") + '</button>');
	btn.data("target", $message_element.attr("data-user"))
		.data("state", $message_element.data("ublock"))
		.click(function(e){
			e.stopPropagation();
			var status = !$message_element.data("ublock"); // if they're not blocked, we want them to be
			imb_social_block_user($(this).data("target"), status);
			// need to update all messages in all groups for that user
			var userMsgs = $(".chat-message").filter("[data-user='" + $message_element.attr("data-user") + "']");
			userMsgs.each(function(index) {
				$(this).data("ublock", status);
				$(this).find(".chat-monitor-block-user-button").text((status) ? "Allow User" : "Block User");
				refresh_chat_message_block_status(this);
			});
		});
	$message_element.append(btn);
	btn = $('<button class="chat-monitor-block-message-button">' + (($message_element.data("mblock")) ? "Show Message" : "Hide Message") + '</button>');
	btn.data("target", $message_element.data("msg"))
		.click(function(e){
			e.stopPropagation();
			var status = !$message_element.data("mblock");
			imb_social_block_message($(this).data("target"), status);
			$message_element.data("mblock", status);
			$message_element.find(".chat-monitor-block-message-button").text((status) ? "Show Message" : "Hide Message");
			refresh_chat_message_block_status($message_element);
		});
	$message_element.append(btn);
}
function stop_chat_monitor() {
	// reset the updater object if needed
	if (chat_updater == null) {
		chat_updater = {
			dates 	: [],
			interval: 0
		}
	}
	// cancel the current monitoring thread if it's running
	else if (chat_updater.interval != 0) {
		window.clearInterval(chat_updater.interval);
		chat_updater.interval = 0;
	}
}
function create_chat_message(username, message, date_object, avatar, source) {
	var div = $('<li class="chat-message ' + ((source == 'Unstructured Chat') ? 'unstructured-coloring' : 'structured-coloring') + '"><img src="' + avatar + '"><img src="css/images/icons-png/delete-black.png" class="blocked-user-avatar display-hidden">' + 
		'<p class="chat-name">' + username +
		'</p><span class="chat-date">' + format_chat_date(date_object) + '</span><p class="chat-source">' + source +
		'</p><p class="chat-message-text"></p></li>');
	div.find(".chat-message-text").text(message);
	return div;
}
function format_chat_date(date_object) {
	return date_object.getFullYear() + ((date_object.getMonth() < 9) ? "-0":"-") + (date_object.getMonth() + 1) +
		((date_object.getDate() < 10) ? "-0" : "-") + date_object.getDate() + 
		((date_object.getHours() < 10) ? " 0" : " ") + date_object.getHours() +
		((date_object.getMinutes() < 10) ? ":0" : ":") + + date_object.getMinutes();
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

//---------- load available enviroments for library
function load_developEnv(developEnv_arr) {
    for (x = 0; x < developEnv_arr.length; x++) {
	$("#imb_lm_sourceList").append("<option value=\"" + developEnv_arr[x] + "\">" + developEnv_arr[x] + "</option>");
    }

    for (x = 0; x < developEnv_arr.length; x++) {
	$("#imb_lm_destList").append("<option value=\"" + developEnv_arr[x] + "\">" + developEnv_arr[x] + "</option>");
    }
}

//---------- update booklisting from server files
function loadBooks(books_arr, orig) {
    if (orig == "src") {
	$("#imb_lm_bookSrcList").empty();
	for (x = 0; x < books_arr.length; x++) {
	    $("#imb_lm_bookSrcList").append("<option value=\"" + books_arr[x] + "\">" + books_arr[x] + "</option>");
	}
	$("#imb_lm_bookSrcList").selectmenu('refresh', true);
    } else if (orig == "dest") {
	$("#imb_lm_bookDestList").empty();
	for (x = 0; x < books_arr.length; x++) {
	    $("#imb_lm_bookDestList").append("<option value=\"" + books_arr[x] + "\">" + books_arr[x] + "</option>");
	}
	$("#imb_lm_bookDestList").selectmenu('refresh', true);
    }
}


// -------------------------------------------------------------------------------------------- auxilary functions to get around webkit limitations <-- cubiq.org
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
