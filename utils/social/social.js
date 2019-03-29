var debug = true;

// call the initialization function after the document has loaded
$(document).ready(init);
$("#imb_social_change_list").listview();

/**
 * Initialize this page. This code can be moved elsewhere in the real version.
 */
function init() {
	imb_load_social_groups();
		
	/**
	 * Gathers the information needed to send a message to a conversation,
	 * and then sends the message along.
	 */
	$("#imb_btn_social_submit").click(function() {
		// submit the message to the database, calling refresh if successful
		imb_social_write(
			document.getElementById("imb_social_id").value,
			document.getElementById("imb_user_id").value,
			document.getElementById("imb_book_id").value,
			document.getElementById("imb_page_id").value,
			document.getElementById("imb_state_id").value,
			document.getElementById("imb_response").value,
			imb_social_refresh
		);
		// clear the message to send
		document.getElementById("imb_response").value = "";
	});
	
	/**
	 * Start a timer to refresh the messages every 10 seconds.
	 */
	setInterval(imb_social_refresh, 10000);
}

/***
 * 
 */
function imb_load_social_groups() {
	// the social button should be disabled by default
	$("#imb_btn_social_open").hide();
	$("#imb_btn_social_change").hide();
	
	// get a list of the social groups to which this user belongs and prepare
	// the social section of the book; if the user has not social groups,
	// then completely disable the social option
	imb_social_get_groups(document.getElementById("imb_user_id").value, function(data) {
		var $dom_list = $("#imb_social_change_list");
		// erase the previous list
		while ($dom_list.firstChild) {
			$dom_list.removeChild($dom_list.firstChild);
		}
		// add the new entries
		if (data.length > 0) {
			for (var index = 0; index < data.length; index++) {
				var lnk = document.createElement("a");
				lnk.href = "#imb_social_page";
				lnk.dataset.socialId = data[index][0];
				lnk.innerHTML = data[index][1];
				lnk.onclick = function() {
					console.log(this.href);
					var $head = $("#imb_social_heading");
					$head.data("social-id", this.dataset.socialId);
					$head.text(this.textContent);
					return true;
				};
				var li = document.createElement("li");
				li.appendChild(lnk);
				$dom_list.append(li);
			}
			// since the user can talk, enable the button to do this
			$("#imb_btn_social_open").show();
			// however, only allow changing convos if there's more than one
			if (data.length > 1) {
				$("#imb_btn_social_change").show();
			}
			// initialize the social group to the first one
			var $head = $("#imb_social_heading");
			$head.data("social-id", data[0][0]);
			$head.text(data[0][1]);
			// and, lastly, automatically refresh the convo details
			imb_social_refresh();
		}
		else {
			$("#imb_social_heading").text("");
		}
		// refresh the jQuery list
		$dom_list.listview("refresh");
	});
}

/**
 * Looks for new messages for the given conversation and queues refreshing
 * the display until those messages have returned.
 */
function imb_social_refresh() {
	// gather the data, and this will re-enable the refresh button on success
	imb_social_read(
		document.getElementById("imb_user_id").value,
		$("#imb_social_heading").data("social-id"),
		document.getElementById("imb_book_id").value,
		document.getElementById("imb_page_id").value,
		document.getElementById("imb_state_id").value,
		imb_social_create_display
	);
}

/***
 * Given the set of messages, update the DOM elements so that the displayed
 * list of messages is up-to-date. This will also change the layout and types
 * of messages displayed depending on what conversation and user is selected.
 */	
function imb_social_create_display(data) {
	if (data != undefined) {
		// clear the previous display first
		// TODO: this could be optimized by only adding new messages
		var list = document.getElementById("imb_convo_list");
		var scroll = (list.childNodes.length <= 1);
		
		while (list.firstChild) {
			list.removeChild(list.firstChild);
		}
		
		// then display all the data
		var index = 0, max = data[1].length;
		for (; index < max; index++) {
			var msg = data[1][index];
			imb_create_social_response(imb_create_social_msg_id(msg[0], msg[2]), msg, data[0][msg[0]], list);
		}
		
		// scroll to the bottom if this is the first display
		if (scroll) {
			var $box = $("#imb_convo_box");
			$box.scrollTop($box.prop("scrollHeight"));
		}
	}
}

function imb_create_social_msg_id(user_id, dt_string) {
	return "imb_msg_" + user_id + "_" + dt_string.replace(/[-:\s]/g, "_");
}

/**
 * Creates the DOM elements for displaying a single response.
 */
function imb_create_social_response(msg_id, msg_data, user_data, container) {
	// determine the style to use
	var style = (user_data[1]) ? "imb_social_msg_right" : "imb_social_msg_left";
	// create the list element, which holds it all together
	var node = document.createElement("li");
	node.id = msg_id;
	node.classList.add(style);
	container.appendChild(node);
	
	// create an image for the avatar
	var tmp = document.createElement("img");
	if (user_data[2] != null) {
		tmp.src = user_data[2];
	}
	node.appendChild(tmp);
	
	// create the name for the message
	/*tmp = document.createElement("label");
	tmp.htmlFor = msg_id;
	tmp.innerHTML = (data[1] == null) ? "Unknown" : data[1];
	node.appendChild(tmp);*/
	
	// create the message
	tmp = document.createElement("p");
	tmp.innerHTML = msg_data[1];
	node.appendChild(tmp);
	
	// and create the timestamp
	/*tmp = document.createElement("p");
	tmp.classList.add("imb_social_timestamp");
	tmp.innerHTML = data[3];
	node.appendChild(tmp);*/
}
