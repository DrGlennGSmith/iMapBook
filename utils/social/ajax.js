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

// use this ajax call to get a list of social groups the user has access to
// passes an array of social_id, group_name to success_handler
function imb_social_get_groups(user_id, success_handler) {
	if (debug) console.log('getting social group list');
    /*if (location.hostname == '')
        return ""; // skip ajax if local
	*/
    $.ajax({
        type: "GET",
        url: "service.php",
        data: {
			action: "social_groups_list",
			imb_user_id: user_id
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
        error: function (response) {
			console.log(response);
            //window.alert("Unable to get social group list.");
        }
    });
}

// use this ajax call to read social responses from a group
// passes an array of users (name, myself/others, avatar) and responses (user,
//   message, time) to success_handler
function imb_social_read(user_id, social_id, book_id, page_id, state_id, success_handler) {
    if (debug) console.log('social_read: ' + user_id + ' ' + social_id + ' ' + book_id + ' ' + page_id + ' ' + state_id);
    /*if (location.hostname == '')
        return ""; // skip ajax if local
	*/
    $.ajax({
        type: "GET",
        url: "service.php",
        data: {
			action:			"social_read",
			imb_user_id: 	user_id,
            imb_social_id: 	social_id,
            imb_book_id: 	book_id,
            imb_page_id: 	page_id,
            imb_state_id: 	state_id
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
        error: function (response) {
			console.log(response);
            //window.alert("Unable to read from social group.");
        }
    });
}

// use this ajax call to write social response to a group
function imb_social_write(social_id, user_id, book_id, page_id, state_id, response, success_handler) {
    if (debug) console.log('social_write: ' + social_id + ' ' + user_id + ' ' + book_id + ' ' + page_id + ' ' + state_id + ' ' + response);
    /*if (location.hostname == '')
        return ""; // skip ajax if local
	*/
	if (trim(response).length > 0){
		$.ajax({
			type: "GET",
			url: "service.php",
			data: {
				action:			"social_write",
				imb_social_id: 	social_id,
				imb_user_id: 	user_id,
				imb_book_id: 	book_id,
				imb_page_id: 	page_id,
				imb_state_id: 	state_id,
				imb_response: 	trim(response)
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
