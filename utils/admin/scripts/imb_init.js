var debug = false; 			// set to false for production
var chat_updater = null;

$(document).ready(function () { // document loaded and DOM is ready
	// LOGIN validation and submission
	$("#login").find("form").validate({
		messages: {
			imb_user : "A login name is required",
			imb_pass : "A password is required"
		},
		focusInvalid  : false,
		errorPlacement: function(error, element) {
			error.insertAfter($(element).parent());
		},
		submitHandler : function(form) {
			var $form = $(form);
			// clean up the form and disable it while loading
			$form.find(".error").remove();
			$form.find("#imb_login_btn_submit").prop("disabled", true);
			$form.find("input").prop("disabled", true);
			imb_login( $form.find("#imb_user").val(), $form.find("#imb_pass").val(),
					  function(message) {
						  // re-enable the form since something went wrong
						  $form.find("#imb_login_btn_submit").prop("disabled", false);
						  $form.find("input").prop("disabled", false);
						  // indicate the problem
						  $("<label for=\"imb_pass\" class=\"error\">" + message + "</label>")
							.insertAfter( $("#imb_pass").parent() );
					  });
		}
	});
	// remove the initial hidden class
	$("#menu").removeClass("display-hidden");
	$("#jqm_popup").removeClass("display-hidden");


	// REPORTS handlers
	// EXPAND
	// ------------------------------------------------------------------
	$(document).on("expand", "#imb_reports_container", function (event, ui) {
		var idx = get_cohort_idx(user_cohort_id); // default cohort
		refresh_cohort_select("#imb_reports_cohort_id", user_cohort_id, true);
		refresh_user_select("#imb_reports_user_id", idx, 1);
		refresh_book_select("#imb_reports_book_id", idx);
		refresh_bookclub_select("#imb_reports_bookclub_id", idx);
		// by default, discussion-only options should be hidden since no report is chosen yet
		$(".report-discussion-options").hide();			

		return false;
	});
	// REPORT type change
	$(document).on("change", "#imb_reports_id", function (e, ui) {
		// show or hide the topic-based options if those reports were chosen
		if ( $(this).find(":selected").hasClass("report-discussions") ) {
			$(".report-discussion-options").show();
			refresh_topic_select($("#imb_reports_topic_id"), "#imb_reports_book_id");
		}
		else {
			$(".report-discussion-options").hide();			
		}
	});
	// COHORT change
	$(document).on("change", "#imb_reports_cohort_id", function (e, ui) {
		var idx = this.selectedIndex - 1;
		refresh_user_select("#imb_reports_user_id", idx, 1);
		refresh_book_select("#imb_reports_book_id", idx);
		refresh_bookclub_select("#imb_reports_bookclub_id", idx);
	});
	// BOOK change
	$(document).on("change", "#imb_reports_book_id", function (e, ui) {
		refresh_topic_select($("#imb_reports_topic_id"), "#imb_reports_book_id");
	});
	// SUBMIT
	$(document).on("click", "#imb_reports_btn_submit", function (e, ui) {
		create_reports_table($('#imb_reports_results'), $("#imb_reports_id").val());
		var postData = {
			report_id: 	$("#imb_reports_id").val(),
			cohort_id: 	$("#imb_reports_cohort_id").val(),
			user_id: 	$("#imb_reports_user_id").val(),
			book_id: 	$("#imb_reports_book_id").val(),
			page_id: 	$("#imb_reports_page_id").val().trim(),
			start_dt: 	$("#imb_reports_start_dt").val().trim(),
			end_dt: 	$("#imb_reports_end_dt").val().trim(),
			period_id:	$("#imb_reports_period_id").val().trim(),
			bookclub_id:$("#imb_reports_bookclub_id").val().trim(),
			topic_id:	$("#imb_reports_topic_id").val().trim()
		};
		$('#imb_reports_results').data("toPost", postData);
		$('#imb_reports_results').jtable('load', postData);
	});
	// create a sample empty table, that will be replaced when the first report is submitted
	$('#imb_reports_results').jtable({
		title: ''
	});

	
	// CHAT MONITOR handlers
	// EXPAND
	// ------------------------------------------------------------------
	$(document).on("expand", "#imb_chat_container", function (event, ui) {
		var idx = get_cohort_idx(user_cohort_id); // default cohort
		refresh_cohort_select("#imb_chat_cohort_id", user_cohort_id);
		refresh_book_select("#imb_chat_book_id", idx);
		refresh_topic_select("#imb_chat_topic_id", "#imb_chat_book_id");
		refresh_chat_container(user_cohort_id);
		return false;
	});
	// --------------------------------------------------------------------
	$(document).on("collapse", "#imb_chat_container", function (event, ui) {
		stop_chat_monitor();
		return false;
	});
	// --------------------------------------------------------------------
	$(document).on("change", "#imb_chat_cohort_id", function (event, ui) {
		var cohort = cohort_list[this.selectedIndex];
		refresh_book_select("#imb_chat_book_id", this.selectedIndex);
		refresh_topic_select("#imb_chat_topic_id", "#imb_chat_book_id");
		refresh_chat_container(cohort.cohort_id);
		//start_chat_monitor(cohort.cohort_id);
		return false;
	});
	// --------------------------------------------------------------------
	$(document).on("change", "#imb_chat_book_id", function (event, ui) {
		// update the topics available based on the selected book
		refresh_topic_select("#imb_chat_topic_id", "#imb_chat_book_id");//this.options[this.selectedIndex].value);
		// get the selected-cohort id
		var $cohort_select = $("#imb_chat_cohort_id");
		if ($cohort_select) {
			var cohort = cohort_list[$cohort_select.prop('selectedIndex')];
		}
		else {
			cohort = cohort_list[get_cohort_idx(user_cohort_id)];
		}
		// clear the chat and load it again, to remove messages inconsistent with selected book
		refresh_chat_container(cohort.cohort_id);
		return false;
	});
	// --------------------------------------------------------------------
	$(document).on("change", "#imb_chat_topic_id", function (event, ui) {
		var $cohort_select = $("#imb_chat_cohort_id");
		if ($cohort_select) {
			var cohort = cohort_list[$cohort_select.prop('selectedIndex')];
		}
		else {
			cohort = cohort_list[get_cohort_idx(user_cohort_id)];
		}
		// clear the chat and load it again, to remove topic-unrelated messages
		refresh_chat_container(cohort.cohort_id);
		return false;
	});
	// --------------------------------------------------------------------
	$(document).on("change", "#imb_chat_period_id", function (event, ui) {
		var $cohort_select = $("#imb_chat_cohort_id");
		if ($cohort_select) {
			var cohort = cohort_list[$cohort_select.prop('selectedIndex')];
		}
		else {
			cohort = cohort_list[get_cohort_idx(user_cohort_id)];
		}
		// clear the chat and load it again, to remove topic-unrelated messages
		refresh_chat_container(cohort.cohort_id);
		return false;
	});
	// allow enter to work for submitting a message
	$(document).on("keypress", ".chat-monitor-input-text", function (event) {
		if (event.which === 13) {
			event.preventDefault();
			send_chat_message();
		}
	});
	

	// USERS CF event handlers
	// EXPAND
	// ------------------------------------------------------------------
	$(document).on("expand", "#imb_users_container", function (event, ui) {
		var idx = get_cohort_idx(user_cohort_id); // default cohort
		refresh_cohort_select("#imb_users_cohort_id", user_cohort_id, true);
		clear_new_user(idx);
		refresh_users_list(idx);
		return false;
	});
	// EXPAND newuser
	// ------------------------------------------------------------------
	$(document).on("expand", "#imb_newuser_collapsible", function (event, ui) {
		return false;
	});
	// COHORT change
	$(document).on("change", "#imb_users_cohort_id", function (e, ui) {
		refresh_users_list(this.selectedIndex - 1);
		$("#imb_users_collapsible_list").collapsibleset("refresh");
		clear_new_user(get_cohort_idx($(this).val()));
		return false;
	});
	// OPEN/READ
	// ------------------------------------------------------------------
	$(document).on("expand", ".imb_user_collapsible", function (event, ui) {
		var form = $(this).closest("form"); // parent form
		var cidx = get_cohort_idx($("#imb_users_cohort_id", form).val()); // currently selected cohort idx
		var cohort = cohort_list[cidx];
		var uidx = $(".imb_user_collapsible").index(this); // index of the collapsible form
		$(this).append(cf_user(cidx, uidx)); // create new object-form and populate it
		$("#imb_user_usertype").html(gen_user_type("imb_user_bits", cohort.user_list[uidx].type_id)); // generate access mask for the user
		$(this).trigger('create');
		return false;
	});
	// CLOSE
	// --------------------------------------------------------------------
	$(document).on("collapse", ".imb_user_collapsible", function (event, ui) {
		$("#cf_user").remove(); // remove this object from DOM
		return false;
	});

	// INSERT/CREATE
	// -------------------------------------------------------------------------
	$(document).on("click", "#imb_newuser_add_btn", function (e, ui) {
		var form = $(this).closest("form"); // parent form
		var cidx = get_cohort_idx($("#imb_users_cohort_id", form).val()); // currently selected cohort idx
		var cohort = cohort_list[cidx]; // current cohort
		var abits = 0;
		$('input[name=imb_newuser_bits\\[\\]]', form).each(function (index) { // build an access mask
			if ($(this).prop("checked")) { // add the bits
				abits += Math.pow(2, index);
			}
		});
		// if we had no avatar, choose one at random
		var avatar = $('#imb_newuser_avatar', form).val().trim();
		if (avatar.length == 0) {
			var max_avatar = Math.max(0, imb_social_get_max_avatar() - 1);
			avatar = "data/avatars/users/" + Math.floor(Math.random()*max_avatar + 1) + ".jpg";
		}
		// if we want a random bookclub, choose it now
		var bookclub = $('#imb_newuser_bookclub', form).val();
		if (bookclub < 0) {
			bookclub = get_random_bookclub(cidx, 0);
		}
		// DATABASE insert
		var user_id = imb_user_create(abits, cohort.cohort_id, $('#imb_newuser_bookshelf', form).val(), bookclub, $('#imb_newuser_username', form).val(), $('#imb_newuser_login', form).val(), $('#imb_newuser_password', form).val(), avatar, $('#imb_newuser_group', form).val());
		if (user_id > 0) {
			var userObject = new User(user_id, abits, cohort.cohort_id, $('#imb_newuser_bookshelf', form).val(), bookclub, $('#imb_newuser_username', form).val(), $('#imb_newuser_login', form).val(), "********", avatar, '', '', $('#imb_newuser_group', form).val()); // create new record
			cohort.user_list.unshift(userObject); // prepend it to the array
			refresh_users_list(cidx); // refresh the user display
			//form[0].reset();
		}
		// clear the form now that we're done with it
		clear_new_user(cidx);
		return false;
	});
	// DELETE
	// ---------------------------------------------------------------------
	$(document).on("click", "#imb_user_delete_btn", function (e, ui) {
		var form = $(this).closest("form"); // parent form
		var cidx = get_cohort_idx($("#imb_users_cohort_id", form).val()); // currently selected cohort idx
		var cohort = cohort_list[cidx]; // current cohort
		var idx = $(this).closest(".imb_user_collapsible").prevAll(".imb_user_collapsible").length; // get the index of the row which triggered this
		var $this = $(this);
		jqm_alert("Confirm", "Are you sure you want to delete this record?", function () {
			// DATABASE delete
			var user_id = imb_user_delete(cohort.user_list[idx].user_id);
			if (user_id > 0) {
				cohort.user_list.splice(idx, 1); // remove it from the array
				$this.closest(".imb_user_collapsible").trigger("collapse").remove(); // remove it from the list ui
			}
		}, '', "Yes", "No");
		return false;
	});
	// UPDATE
	// ----------------------------------------------------------------------
	$(document).on("click", "#imb_user_update_btn", function (e, ui) {
		var form = $(this).closest("form"); // parent form
		var cidx = get_cohort_idx($("#imb_users_cohort_id", form).val()); // currently selected cohort idx
		var cohort = cohort_list[cidx]; // current cohort
		var idx = $(this).closest(".imb_user_collapsible").prevAll(".imb_user_collapsible").length; // get the index of the row which triggered this
		var user = cohort.user_list[idx];
		var abits = 0;
		$('input[name=imb_user_bits\\[\\]]', form).each(function (index) { // build an access mask
			if ($(this).prop("checked")) { // add the bits
				abits += Math.pow(2, index);
			}
		});
		// if we want a random bookclub, choose it now
		var bookclub = $('#imb_user_bookclub', form).val();
		if (bookclub < 0) {
			bookclub = get_random_bookclub(cidx, user.user_id);
		}
		// DATABASE update
		var user_id = imb_user_update(user.user_id, abits, $('#imb_user_bookshelf', form).val(), bookclub, $('#imb_user_username', form).val(), $('#imb_user_login', form).val(), $('#imb_user_password', form).val(),$('#imb_user_avatar', form).val(), $('#imb_user_group', form).val() );
		if (user_id > 0) {
			// update data
			user.type_id = abits;
			user.bookshelf = $('#imb_user_bookshelf', form).val();
			user.bookclub = bookclub;
			user.user_name = $('#imb_user_username', form).val();
			user.login = $('#imb_user_login', form).val();
			user.avatar = $('#imb_user_avatar', form).val();
			user.group = $('#imb_user_group', form).val();
			// update display
			$(this).closest(".imb_user_collapsible").find(".imb_user_header").html(gen_user_header(cidx, idx));
			// collapse form
			$(this).closest(".imb_user_collapsible").trigger('collapse');
		}
		return false;
	});
	//AUDIT add
	$(document).on("click", "#imb_add_audit_button", function (e, ui) {
		var form = $(this).closest("form"); // parent form
		var cidx = get_cohort_idx($("#imb_users_cohort_id", form).val()); // currently selected cohort idx
		var cohort = cohort_list[cidx]; // current cohort
		var users = cohort.user_list;
		var username = $("#imb_add_audit_text").val();
		var auditorId = parseInt($("#cf_user").closest(".imb_user_collapsible").attr("name"));

		var userId = -1;

		for (var i = 0; i < users.length; i++) {
			if (users[i].login === username) {
				userId = parseInt(users[i].user_id);
			}
		}

		if (userId !== -1) {
			imb_link_audit(userId, auditorId);
		}

		return false;
	});
	
	// COHORTS CF event handlers
	// EXPAND
	// ------------------------------------------------------------------
	$(document).on("expand", "#imb_cohorts_container", function (event, ui) {
		refresh_cohorts_list();
		return false;
	});
	// OPEN/READ
	// ------------------------------------------------------------------
	$(document).on("expand", ".imb_cohort_collapsible", function (event, ui) {
		var cidx = $(".imb_cohort_collapsible").index(this); // index of the collapsible form
		$(this).append(cf_cohort(cidx)); // create new object-form and populate it
		$(this).trigger('create');
		return false;
	});
	// CLOSE
	// --------------------------------------------------------------------
	$(document).on("collapse", ".imb_cohort_collapsible", function (event, ui) {
		$("#cf_cohort").remove(); // remove this object from DOM
		return false;
	});
	// INSERT/CREATE
	// -------------------------------------------------------------------------
	$(document).on("click", "#imb_newcohort_add_btn", function (e, ui) {
		var form = $(this).closest("form"); // parent form
		// DATABASE insert
		var cohort_id = imb_cohort_create($("#imb_newcohort_name").val(), $("#imb_newcohort_code").val(), $("#imb_newcohort_library").val(), $("#imb_newcohort_room").val(), $("#imb_newcohort_bookcase").val(), $("#imb_newcohort_bookshelves").val(), "3", "4");
		if (cohort_id > 0) {
			var cohortObject = new Cohort(cohort_id, $("#imb_newcohort_name").val(), $("#imb_newcohort_code").val(), $("#imb_newcohort_library").val(), $("#imb_newcohort_room").val(), $("#imb_newcohort_bookcase").val(), $("#imb_newcohort_bookshelves").val(), 3, 4); // create new record
			cohort_list.unshift(cohortObject); // prepend it to the array
			refresh_cohorts_list(); // refresh the display
			form[0].reset();
		}
		return false;
	});
	// DELETE
	// ---------------------------------------------------------------------
	$(document).on("click", "#imb_cohort_delete_btn", function (e, ui) {
		var idx = $(this).closest(".imb_cohort_collapsible").prevAll(".imb_cohort_collapsible").length; // get the index of the row which triggered this
		var $this = $(this);
		jqm_alert("Confirm", "Are you sure you want to delete this record?", function () {
			// DATABASE delete
			var cohort_id = imb_cohort_delete(cohort_list[idx].cohort_id);
			if (cohort_id > 0) {
				cohort_list.splice(idx, 1); // remove it from the array
				$this.closest(".imb_cohort_collapsible").trigger("collapse").remove(); // remove it from the list ui
			}
		}, '', "Yes", "No");
		return false;
	});
	// UPDATE
	// ----------------------------------------------------------------------
	$(document).on("click", "#imb_cohort_update_btn", function (e, ui) {
		var idx = $(this).closest(".imb_cohort_collapsible").prevAll(".imb_cohort_collapsible").length; // get the index of the row which triggered this
		var cohort = cohort_list[idx];
		var form = $(this).closest("form"); // parent form
		// DATABASE update
		var cohort_id = imb_cohort_update(cohort.cohort_id, $("#imb_cohort_name").val(), $("#imb_cohort_code").val(), $("#imb_cohort_library").val(), $("#imb_cohort_room").val(), $("#imb_cohort_bookcase").val(), $("#imb_cohort_bookshelves").val(), cohort.bookclubs, cohort.social_profile);
		if (cohort_id > 0) {
			// if the number of bookclubs was increased, get a new list from the database
			if (cohort.bookclubs < $('#imb_cohort_bookclubs', form).val()) {
				imb_social_get_groups(cohort.cohort_id, function(data){
					cohort.social_list = [];
					if ((data != null) && (data.groups != null)) {
						for (var i = 0; i < data.groups.length; i++) {
							cohort.social_list.push(new Social(data.groups[i][0],data.groups[i][1],data.groups[i][2],data.groups[i][3]));
						}
					}
				});
			}
			// update data
			cohort.name = $('#imb_cohort_name', form).val();
			cohort.code = $('#imb_cohort_code', form).val();
			cohort.library = $('#imb_cohort_library', form).val();
			cohort.room = $('#imb_cohort_room', form).val();
			cohort.bookcase = $('#imb_cohort_bookcase', form).val();
			cohort.bookshelves = $('#imb_cohort_bookshelves', form).val();
			// update display
			$(this).closest(".imb_cohort_collapsible").find(".imb_cohort_header").html(gen_cohort_header(idx));
			// collapse form
			$(this).closest(".imb_cohort_collapsible").trigger('collapse');
		}
		return false;
	});

	// SOCIAL CF event handlers
	// EXPAND
	// ------------------------------------------------------------------
	$(document).on("expand", "#imb_social_container", function (event, ui) {
		var cidx = get_cohort_idx(user_cohort_id); // default cohort
		refresh_cohort_select("#imb_social_cohort_id", user_cohort_id);
		refresh_social_settings(cidx);
		refresh_social_list(cidx);
		return false;
	});
	// COHORT change
	$(document).on("change", "#imb_social_cohort_id", function (e, ui) {
		refresh_social_settings(this.selectedIndex);
		refresh_social_list(this.selectedIndex);
		return false;
	});
	// OPEN/READ
	// ------------------------------------------------------------------
	$(document).on("expand", ".imb_social_collapsible", function (event, ui) {
		var cidx = get_cohort_idx($("#imb_social_cohort_id").val()); // default cohort
		var sidx = $(".imb_social_collapsible").index(this); // index of the collapsible form
		$(this).append(cf_social(cidx, sidx)); // create new object-form and populate it
		$(this).trigger('create');
		return false;
	});
	// CLOSE
	// --------------------------------------------------------------------
	$(document).on("collapse", ".imb_social_collapsible", function (event, ui) {
		$("#cf_social").remove(); // remove this object from DOM
		return false;
	});
	// INSERT/CREATE
	// -------------------------------------------------------------------------
	$(document).on("click", "#imb_newsocial_add_btn", function (e, ui) {
		var form = $(this).closest("form"); // parent form
		// DATABASE insert
		var social_id = imb_social_create($("#imb_social_cohort_id").val(), $("#imb_newsocial_name").val(), $("#imb_newsocial_desc").val());
		if (social_id > 0) {
			var cidx = get_cohort_idx($("#imb_social_cohort_id").val());
			var socialObject = new Social(social_id, $("#imb_newsocial_name").val(), $("#imb_newsocial_desc").val(), false); // create new record
			cohort_list[cidx].social_list.unshift(socialObject); // prepend it to the array
			refresh_social_list(cidx); // refresh the display
			form[0].reset();
		}
		return false;
	});
	// UPDATE SETTINGS
	// ----------------------------------------------------------------------
	$(document).on("click", "#imb_social_settings_update_btn", function (e, ui) {
		var cidx = get_cohort_idx($("#imb_social_cohort_id").val());
		var cohort = cohort_list[cidx];
		// calculate the social profile settings
		var profile = 0;
		if ($("#imb_chatsetting_bookclubs").prop("checked") == true) {
			profile += 1;
		}
		if ($("#imb_chatsetting_cohort").prop("checked") == true) {
			profile += 2;
		}
		if ($("#imb_chatsetting_qlatest").prop("checked") == true) {
			profile += 4;
		}
		// DATABASE update
		var cohort_id = imb_cohort_update(cohort.cohort_id, cohort.name, cohort.code, cohort.library, cohort.room, cohort.bookcase, cohort.bookshelves, ~~($("#imb_social_bookclubs").val()), profile);
		if (cohort_id > 0) {
			// if the number of bookclubs was increased, get a new list from the database
			if (cohort.bookclubs < $('#imb_social_bookclubs').val()) {
				imb_social_get_groups(cohort.cohort_id, function(data){
					cohort.social_list = [];
					if ((data != null) && (data.groups != null)) {
						for (var i = 0; i < data.groups.length; i++) {
							cohort.social_list.push(new Social(data.groups[i][0],data.groups[i][1],data.groups[i][2],data.groups[i][3]));
						}
					}
				});
			}
			// update data
			cohort.bookclubs = ~~($('#imb_social_bookclubs').val());
			cohort.social_profile = profile;
		}
		// update display
		refresh_social_list(cidx);
		//$("#imb_social_collapsible_list").collapsibleset("refresh");
		return false;
	});
	// DELETE
	// ---------------------------------------------------------------------
	$(document).on("click", "#imb_social_delete_btn", function (e, ui) {
		var sidx = $(this).closest(".imb_social_collapsible").prevAll(".imb_social_collapsible").length; // get the index of the row which triggered this
		var $this = $(this);
		jqm_alert("Confirm", "Are you sure you want to delete this record?", function () {
			// DATABASE delete
			var cidx = get_cohort_idx($("#imb_social_cohort_id").val());
			var cohort = cohort_list[cidx];
			var social_id = imb_social_delete(cohort.social_list[sidx].social_id);
			if (social_id > 0) {
				cohort.social_list.splice(sidx, 1); // remove it from the array
				$this.closest(".imb_social_collapsible").trigger("collapse").remove(); // remove it from the list ui
			}
		}, '', "Yes", "No");
		return false;
	});
	// UPDATE
	// ----------------------------------------------------------------------
	$(document).on("click", "#imb_social_update_btn", function (e, ui) {
		var cidx = get_cohort_idx($("#imb_social_cohort_id").val());
		var sidx = $(this).closest(".imb_social_collapsible").prevAll(".imb_social_collapsible").length; // get the index of the row which triggered this
		var social = cohort_list[cidx].social_list[sidx];
		var form = $(this).closest("form"); // parent form
		// DATABASE update
		var social_id = imb_social_update(social.social_id, $("#imb_social_name").val(), $("#imb_social_desc").val());
		if (social_id > 0) {
			// update data
			social.name = $('#imb_social_name', form).val();
			social.desc = $('#imb_social_desc', form).val();
			// update display
			$(this).closest(".imb_social_collapsible").find(".imb_social_header").html(gen_social_header(cidx, sidx));
			// collapse form
			$(this).closest(".imb_social_collapsible").trigger('collapse');
		}
		return false;
	});
	// RANDOMIZE BOOKCLUBS
	// ----------------------------------------------------------------------
	$(document).on("click", "#imb_social_randomize_clubs_btn", function (e, ui) {
		var cidx = get_cohort_idx($("#imb_social_cohort_id").val());
		var cohort = cohort_list[cidx];
		if (cohort == null) {
			return false;
		}
		jqm_alert("Confirm", "Are you sure you want to randomize the bookclubs for all reader in Cohort " + cohort.name, function () {
			// create a list of all the reader-type users in the cohort
			var readers = [];
			for (var i = 0; i < cohort.user_list.length; i++) {
				if (cohort.user_list[i].type_id == 1) {
					readers.push(cohort.user_list[i]);
				}
			}
			// get the list of bookclubs available for the cohort
			var bookclubs = [];
			for (i = 0; i < cohort.social_list.length && i < cohort.bookclubs; i++) {
				bookclubs.push (cohort.social_list[i]);
			}
			// go through each bookclub in order and randomly assign one of the readers to it
			while (readers.length > 0) {
				for (i = 0; i < bookclubs.length && readers.length > 0; i++) {
					var ridx = Math.floor(Math.random() * readers.length);
					var user = readers[ridx];
					readers.splice(ridx, 1);
					user.bookclub = bookclubs[i].social_id;
					// save the changes to the database
					imb_user_update(user.user_id, user.type_id, user.bookshelf, user.bookclub, user.user_name, user.login, user.password, user.avatar, user.group);
				}
			}
		}, '', "Yes", "No");
		return false;
	});


	// COLLECTIONS handlers
	// EXPAND
	// ------------------------------------------------------------------
	$(document).on("expand", "#imb_collections_container", function (event, ui) {
		return false;
	});

	// LIBRARY handlers
	// EXPAND
	// ------------------------------------------------------------------
	$(document).on("expand", "#imb_library_container", function (event, ui) {
		return false;
	});
	// SOURCE ENVIRONMENT change event
	$(document).on("change", "#imb_lm_sourceList", function (e, ui) {
		imb_bookList($(this).val(), 'src'); // update book list from server
	});

	// DESTINATION ENVIRONMENT change event
	$(document).on("change", "#imb_lm_destList", function (e, ui) {
		imb_bookList($(this).val(), 'dest'); // update book list from server
	});

	// DELETE SOURCE ENVIRONMENT BOOK submit button event
	$(document).on("click", "#imb_lm_srcDelete_btn_submit", function (e, ui) {
		jqm_alert("Confirm", 'Are you sure you want to delete ' + $("#imb_lm_bookSrcList").val() + ' from ' + $("#imb_lm_sourceList").val(), function () {
			imb_deleteSrcBook($("#imb_lm_bookSrcList").val(), $("#imb_lm_sourceList").val());
		}, '', "Yes", "No");
	});

	// DELETE DESTINATION ENVIRONMENT BOOK submit button event
	$(document).on("click", "#imb_lm_destDelete_btn_submit", function (e, ui) {
		jqm_alert("Confirm", 'Are you sure you want to delete ' + $("#imb_lm_bookDestList").val() + ' from ' + $("#imb_lm_destList").val(), function () {
			imb_deleteDestBook($("#imb_lm_bookDestList").val(), $("#imb_lm_destList").val());
		}, '', "Yes", "No");
	});

	// UPDATE SOURCE ENVIRONMENT BOOK submit button event
	$(document).on("click", "#imb_lm_destUpdate_btn_submit", function (e, ui) {
		jqm_alert("Confirm", "Are you sure you want to update " + $("#imb_lm_bookSrcList").val() + " from " + $("#imb_lm_sourceList").val(), function () {
			imb_updateSrcBook($("#imb_lm_bookSrcList").val(), $("#imb_lm_sourceList").val());
		}, '', "Yes", "No");
	});

	// COPY BOOK submit button event
	$(document).on("click", "#imb_lm_copy_btn_submit", function (e, ui) {
		jqm_alert("Confirm", 'Are you sure you want to copy ' + $("#imb_lm_bookSrcList").val() + ' from ' + $("#imb_lm_sourceList").val() + " to " + $("#imb_lm_destList").val(), function () {
			imb_copyBook($("#imb_lm_bookSrcList").val(), $("#imb_lm_sourceList").val(), $("#imb_lm_destList").val());
		}, '', "Yes", "No");
	});

	// MERGE BOOK submit button event
	$(document).on("click", "#imb_lm_merge_btn_submit", function (e, ui) {
		jqm_alert("Confirm", 'Are you sure you want to merge ' + $("#imb_lm_bookSrcList").val() + ' from ' + $("#imb_lm_sourceList").val() + ' into ' + $("#imb_lm_bookDestList").val() + ' from ' + $("#imb_lm_destList").val(), function () {
			imb_mergeBook($("#imb_lm_bookSrcList").val(), $("#imb_lm_bookDestList").val(), $("#imb_lm_sourceList").val(), $("#imb_lm_destList").val());
		}, '', "Yes", "No");
	});
});

$(window).load(function () { // content loaded
	$.ajaxSetup({async: false}); // ----------------------------- FORCE SYNCHRONOUS AJAX CALLS!
	if (location.hostname == '') {
		// skip login/registration
		load_menu('test', 'Johnny Test', 7, 1, '', '');
	}
});
