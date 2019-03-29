// globals
var bookshelf_file = "default.xml"; // set default bookshelf file
var display_name = "Tester"; // set default user name
var debug = true; // set to false for production
var browser = get_browser(navigator.userAgent); // detect browser type
var user_event = get_user_event(browser); // define appropriate user "click" event
var book_lock_timer = 0; // to keep a book locked in the database

$(document).ready(function() { // document loaded and DOM is ready
// BOOK cover CF event handlers
	// sortable bookshelf
	// -----------------------------------------------------------------
	$("#imb_book_list").sortable();
	$(document).on("sortupdate", "#imb_book_list", function(event, ui) {
		imb_sort_array(book_list, $(this).sortable('toArray'), "imb_book_list_item"); // sort the underlying data structure to reflect the ui ordering
		imb_update_list(".imb_bookshelf_collapsible", "imb_book_list_item"); // order the ui list element ids
		imb_save_flag(1,1);
		event.stopPropagation();
	});
	// book edit button
	// -----------------------------------------------------------------
	$(document).on(user_event, ".imb_editor_btn", function(e, ui) {
		load_book(book_list_idx);
	});
	// OPEN/READ
	// ------------------------------------------------------------------
	$(document).on("expand", ".imb_bookshelf_collapsible", function(event, ui) {
		//window.alert("here");
		book_list_idx = $(this).closest(".imb_bookshelf_collapsible").prevAll(".imb_bookshelf_collapsible").length; // update current book idx
		var idx = $(".imb_bookshelf_collapsible").index(this);
		$(this).append(cf_cover(idx)).trigger('create');
		$("#imb_book_list" ).sortable("disable"); // disable sortable while collapsible form is opened
		return false;
	});
	// CLOSE
	// --------------------------------------------------------------------
	$(document).on("collapse", ".imb_bookshelf_collapsible", function(event, ui) {
		$("#cf_cover").remove();
		$("#imb_book_list" ).sortable("enable");
		return false;
	});
	// INSERT/CREATE
	// -------------------------------------------------------------------------
	$(document).on("click", "#imb_bookshelf_insert_btn", function(e, ui) {
		var form = $(this).closest("form"); // get the parent form
		// get the book id which is the max of all current book ids + 1
		str = $('#ntitle', form).val();
		if (is_book_title_valid(str)){  //if book title is a valid string, then insert new book, otherwise we need to stop the operation
			var new_book_id = 0;
			$.each(book_list, function(idx, book) {
				if (parseInt(book.book_id) > new_book_id) {
					new_book_id = book.book_id;
				}
			});
			new_book_id++;
			// create/copy a new book record and prepend it to the book_list
			var new_dir = $('#ncat', form).val() + '-' + $('#ntitle', form).val().replace(/[\'\".,:!?& ]/g, '_').toLowerCase();

			//This had to be moved.
			function addBook() {
				var book = new Book(new_book_id, new_dir, $('#nauthor', form).val(), $('#ntitle', form).val(), "", "en", "c", 0, "", "", "y");
				book.modified = "new"; // used in merge logic in services.php ( "new" flags to verify book_id in services.php )
				book_list.unshift(book); // prepend the book record to internal data struct array
				insert_cover(0, 0); // prepend this book record to the bookshelf list ui
				$("#bookshelf").page("destroy").page();
				imb_update_list(".imb_bookshelf_collapsible", "imb_book_list_item"); // order the ui list element ids
				$(this).trigger("collapse");
				$(".imb_bookshelf_collapsible").trigger("collapse");
				$("#imb_book_list_item0 h3").addClass("highlight_inserted"); // highlight newly inserted item
				$("#imb_book_list_item0 h3").removeClass("highlight_inserted", 6000, "easeInBack"); // remove the highlight from the newly inserted item using a fade effect over 2.5 seconds				
				imb_save_flag(1,1);
				return false;
			}

			if (imb_book_directory(new_dir, "", "directory_read")) { // book directory already exists

				//Previous logic has been commented out. Remove after sufficient testing.
				//var agree = confirm("A book of this type and title already exists.  Would you like to create a copy?");
				
				jqm_alert("Copy book?", "A book of this type and title already exists. Would you like to create a copy or link to an existing book?", function() {
					var new_dir_copy = new_dir;
					while (!imb_book_directory(new_dir, new_dir_copy, "directory_copy")) {
						new_dir_copy = prompt("Please enter a new location", new_dir);
					}
					new_dir = new_dir_copy;
					//window.alert("Created a book copy: " + new_dir);
					addBook();
				}, function() {
					//window.alert("Linked to an existing book: " + new_dir);
					addBook();
				}, "Copy", "Link");

				/*if (agree) { // create a new duplicate directory location
					var new_dir_copy = new_dir;
					while (!imb_book_directory(new_dir, new_dir_copy, "directory_copy")) {
						new_dir_copy = prompt("Please enter a new location", new_dir);
					}
					new_dir = new_dir_copy;
					window.alert("Created a book copy: " + new_dir);
				} else { // use the existing directory location
					window.alert("Linked to an existing book: " + new_dir);
				}*/
			} else { // create a new book directory
				imb_book_directory(new_dir, "", "directory_create");
				$("#popupMessage").find("p").html("Created a new book: " + new_dir);
				$("#popupMessage").popup("open");

				addBook();
				//window.alert("Created a new book: " + new_dir);
			}
		}
		else {
			msg = "The book title contains an invalid character.<br><br>The title can consist of Letters, Numbers, Spaces, or any of the following symbols: <br><br>" +
			"?&nbsp;&nbsp;" +  "!&nbsp;&nbsp;" + ".&nbsp;&nbsp;" + ",&nbsp;&nbsp;" +  ":&nbsp;&nbsp;" + ";&nbsp;&nbsp;" +  "'&nbsp;&nbsp;" + "+&nbsp;&nbsp;" + "=&nbsp;&nbsp;" + "-&nbsp;&nbsp;" + "_";
			$("#popupMessage").find("p").html(msg);
			$("#popupMessage").popup("open");				
		}
	});
	function is_book_title_valid(title) {
		// identify valid characters for a title, including Unicode
		var Exp = /^[a-zA-Z0-9?_.,:;+='! \-\u00C0-\u017F\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*$/;
		return title.match(Exp);
	}
	// DELETE
	// ---------------------------------------------------------------------
	$(document).on("click", "#imb_bookshelf_delete_btn", function(e, ui) {
		// get the index of the row which triggered this
		var $this = $(this);
		var idx = $this.closest(".imb_bookshelf_collapsible").prevAll(".imb_bookshelf_collapsible").length;
		jqm_alert("Confirm", "Are you sure you want to delete this record?", function() {
			// remove this book record from book_list
			// book_list.splice(idx, 1); 			NOTE: Concurrent method: Book element is needed to send request of delete to services.php
			book_list[idx].modified = "delete";	// 	Update the modified flag to delete for the record, not deleted until "Save Bookshelf"  via services.php
			// remove this book record from bookshelf list ui 	NEW concurrent method: UI gone hides the element
			$this.closest(".imb_bookshelf_collapsible").trigger("collapse").remove();
			// refresh bookcase
			$("#bookshelf").page( "destroy" ).page();
			imb_update_list(".imb_bookshelf_collapsible", "imb_book_list_item"); // order the ui list element ids
		}, '', "Yes", "No");
		imb_save_flag(1,1);
		return false;
	});
	// UPDATE - triggered by any change on form inputs
	// ----------------------------------------------------------------------
	$(document).on("change", "#imb_bookshelf_form", function(e, ui) {
		// get the index of the row which triggered this
		var idx = $(this).closest(".imb_bookshelf_collapsible").prevAll(".imb_bookshelf_collapsible").length;
		// get the corresponding book object
		var book = book_list[idx];
		// get the parent form
		var form = $(this).closest("form");
		// update book object		
		//book.book_id = $('#nbook_id', form).val(); //-- removed from the updater
		book.location = $('#nlocation', form).val();
		book.author = $('#nauthor', form).val();
		// force title to follow allowed characters, even when editing it
		if (is_book_title_valid($('#ntitle', form).val())) {
			book.title = $('#ntitle', form).val();
		}
		// it uses invalid characters, so tell the user about it
		else {
			$('#ntitle', form).val(book.title);
			var msg = "The book title contains an invalid character.<br><br>The title can consist of Letters, Numbers, Spaces, or any of the following symbols: <br><br>" +
			"?&nbsp;&nbsp;" +  "!&nbsp;&nbsp;" + ".&nbsp;&nbsp;" + ",&nbsp;&nbsp;" +  ":&nbsp;&nbsp;" + ";&nbsp;&nbsp;" +  "'&nbsp;&nbsp;" + "+&nbsp;&nbsp;" + "=&nbsp;&nbsp;" + "-&nbsp;&nbsp;" + "_";
			$("#popupMessage").find("p").html(msg);
			$("#popupMessage").popup("open");				
		}
		book.icon = (($('#imb_cover_image', form).text() == "None") ? "" : $('#imb_cover_image', form).text());
		book.language = $('#nlanguage', form).val();
		book.char_idx = $('#ncharacter', form).val();
		book.voice = $('#nvoice', form).val();
		book.sound = (($('#imb_cover_sound', form).text() == "None") ? "" : $('#imb_cover_sound', form).text());
		book.reset = ($('#nreset', form).is(':checked')) ? 'y' : 'n';
		book.replay = ($('#nreplay', form).is(':checked')) ? 'y' : 'n';
		book.modified = (book.modified === "new") ? "new" : "true"; // used in merge logic in services.php ( indicates modified element ). Don't set if the book is new.
		book.abstract_text = $('#nabstract', form).val();
		$(this).closest(".imb_bookshelf_collapsible").find(".imb_bookshelf_book_title").html($('#ntitle', form).val() + ' [ID:' + $('#nbook_id', form).val() + ']');
		imb_save_flag(1,1);
		return false;
	});
// BOOK Dictionary CF event handlers
	// OPEN/READ
	// ------------------------------------------------------------------
	$(document).on("expand", ".imb_dictionary_definition_collapsible", function(event, ui) {
		var idx = $(".imb_dictionary_definition_collapsible").index(this); // index of the collapsible form
		$(this).append(cf_dictionary_definition(idx)); // create new object-form and populate it
		$(this).trigger('create');
		return false;
	});
	// CLOSE
	// --------------------------------------------------------------------
	$(document).on("collapse", ".imb_dictionary_definition_collapsible", function(event, ui) {
		$("#cf_dictionary_definition").remove(); // remove this object from DOM
		return false;
	});
	// INSERT/CREATE
	// -------------------------------------------------------------------------
	$(document).on("click", "#imb_dictionary_insert_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var definition = new Definition("Click Me", ""); // create new record
		book.definition_list.unshift(definition); // prepend it to the array
		insert_dictionary_definition(0, 0); // prepend it to the list ui
		$("#book").page("destroy").page(); // restyle the ui
		imb_save_flag(2,1);
		return false;
	});
	// DELETE
	// ---------------------------------------------------------------------
	$(document).on("click", "#imb_dictionary_delete_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var idx = $(this).closest(".imb_dictionary_definition_collapsible").prevAll(".imb_dictionary_definition_collapsible").length; // get the index of the row which triggered this
		var $this=$(this);
		jqm_alert("Confirm", "Are you sure you want to delete this record?", function() {
			book.definition_list.splice(idx, 1); // remove it from the array
			$this.closest(".imb_dictionary_definition_collapsible").trigger("collapse").remove(); // remove it from the list ui
		}, '', "Yes", "No");
		imb_save_flag(2,1);
		return false;
	});
	// UPDATE
	// ----------------------------------------------------------------------
	$(document).on("change", "#imb_dictionary_form :input", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var idx = $(this).closest(".imb_dictionary_definition_collapsible").prevAll(".imb_dictionary_definition_collapsible").length; // get the index of the row which triggered this
		var form = $(this).closest("form"); // parent form
		// update data
		book.definition_list[idx].word = $('#nword', form).val().toLowerCase();
		book.definition_list[idx].text = $('#ntext', form).val();
		// update display
		$(this).closest(".imb_dictionary_definition_collapsible").find(".yellow_definition").html($('#nword', form).val().toLowerCase());
		imb_save_flag(2,1);
		return false;
	});
// BOOK Registry CF event handlers
	// OPEN/READ
	// ------------------------------------------------------------------
	$(document).on("expand", ".imb_registry_variable_collapsible", function(event, ui) {
		var idx = $(".imb_registry_variable_collapsible").index(this); // index of the collapsible form
		$(this).append(cf_registry_variable(idx)); // create new object-form and populate it
		$(this).trigger('create');
		return false;
	});
	// CLOSE
	// --------------------------------------------------------------------
	$(document).on("collapse", ".imb_registry_variable_collapsible", function(event, ui) {
		$("#cf_registry_variable").remove(); // remove this object from DOM
		return false;
	});
	// INSERT/CREATE
	// -------------------------------------------------------------------------
	$(document).on("click", "#imb_registry_insert_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var variable = new Variable("Click Me", "0", "0", "0", "0"); // create new record
		book.registry.unshift(variable); // prepend it to the array
		insert_registry_variable(0, 0); // prepend it to the list ui
		$("#book").page("destroy").page(); // restyle the ui
		imb_save_flag(2,1);
		return false;
	});
	// DELETE
	// ---------------------------------------------------------------------
	$(document).on("click", "#imb_registry_delete_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var idx = $(this).closest(".imb_registry_variable_collapsible").prevAll(".imb_registry_variable_collapsible").length; // get the index of the row which triggered this
		var $this = $(this);
		jqm_alert("Confirm", "Are you sure you want to delete this record?", function() {
			book.registry.splice(idx, 1); // remove it from the array
			$this.closest(".imb_registry_variable_collapsible").trigger("collapse").remove(); // remove it from the list ui
		}, '', "Yes", "No");
		imb_save_flag(2,1);
		return false;
	});
	// UPDATE
	// ----------------------------------------------------------------------
	$(document).on("change", "#imb_registry_form :input", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var idx = $(this).closest(".imb_registry_variable_collapsible").prevAll(".imb_registry_variable_collapsible").length; // get the index of the row which triggered this
		var form = $(this).closest("form"); // parent form
		// update data
		book.registry[idx].name = $('#nname', form).val().toLowerCase();
		book.registry[idx].value = $('#nvalue', form).val();
		book.registry[idx].min = $('#nmin', form).val();
		book.registry[idx].max = $('#nmax', form).val();
		book.registry[idx].variance = $('#nvariance', form).val();
		// update display
		$(this).closest(".imb_registry_variable_collapsible").find(".yellow_definition").html($('#nname', form).val().toLowerCase());
		imb_save_flag(2,1);
		return false;
	});
// BOOK Discussion Topic CF event handlers
	// OPEN/READ
	// ------------------------------------------------------------------
	$(document).on("expand", ".imb_discussion_topic_collapsible", function(event, ui) {
		var idx = $(".imb_discussion_topic_collapsible").index(this); // index of the collapsible form
		$(this).append(cf_discussion_topic(idx)); // create new object-form and populate it
		$(this).trigger('create');
		return false;
	});
	// CLOSE
	// --------------------------------------------------------------------
	$(document).on("collapse", ".imb_discussion_topic_collapsible", function(event, ui) {
		$("#cf_discussion_topic").remove(); // remove this object from DOM
		return false;
	});
	// INSERT/CREATE
	// -------------------------------------------------------------------------
	$(document).on("click", "#imb_discussion_insert_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		imb_get_new_topic_id(book.book_id, function(newID){
			if (newID > 0) {
				var topic = new DiscussionTopic(newID, "Click Me", "", 1); // create new record
				book.discussion_list.unshift(topic); // prepend it to the array
				insert_discussion_topic(0, 0); // prepend it to the list ui
				$("#book").page("destroy").page(); // restyle the ui
				imb_save_flag(2,1);
			}
		});
		return false;
	});
	// DELETE
	// ---------------------------------------------------------------------
	$(document).on("click", "#imb_discussion_delete_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var idx = $(this).closest(".imb_discussion_topic_collapsible").prevAll(".imb_discussion_topic_collapsible").length; // get the index of the row which triggered this
		var $this=$(this);
		jqm_alert("Confirm", "Are you sure you want to delete this discussion topic?", function() {
			book.discussion_list.splice(idx, 1); // remove it from the array
			$this.closest(".imb_discussion_topic_collapsible").trigger("collapse").remove(); // remove it from the list ui
		}, '', "Yes", "No");
		imb_save_flag(2,1);
		return false;
	});
	// UPDATE
	// ----------------------------------------------------------------------
	$(document).on("change", "#imb_discussion_form :input", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var idx = $(this).closest(".imb_discussion_topic_collapsible").prevAll(".imb_discussion_topic_collapsible").length; // get the index of the row which triggered this
		var form = $(this).closest("form"); // parent form
		// update data
		book.discussion_list[idx].name = $('#nname', form).val().trim();
		book.discussion_list[idx].page = ~~($('#npage', form).val()) - 1; // subtract 1 because we actually store the 0-based index
		book.discussion_list[idx].question = $('#nquestion', form).val().trim();
		// update display
		$(this).closest(".imb_discussion_topic_collapsible").find(".yellow_definition").html(book.discussion_list[idx].name);
		imb_save_flag(2,1);
		return false;
	});
// PAGE CF event handlers
	// sortable page list
	// -----------------------------------------------------
	$("#imb_page_list").sortable();
	$(document).on("sortupdate", "#imb_page_list", function(event, ui) {
		var book = book_list[book_list_idx];
		imb_sort_array(book_list[book_list_idx].page_list, $(this).sortable('toArray'), "imb_page_list_item"); // sort the underlying data structure to reflect the ui ordering
		imb_update_list(".imb_page_collapsible", "imb_page_list_item"); // order the ui list element ids
		// update display of each list element
		$(".imb_page_collapsible").each(function(idx) {
			$(this).find(".imb_page_title").html('Page ' + (idx + 1) + ' ( ' + imb_page_type_name(book.page_list[idx].type) + ' ) ' + book.page_list[idx].chapter_number);
		});
		imb_save_flag(2,1);
		event.stopPropagation();
	});
	// OPEN/READ
	// ------------------------------------------------------------------
	$(document).on("expand", ".imb_page_collapsible", function(event, ui) {
		var book = book_list[book_list_idx];
		var idx = $(".imb_page_collapsible").index(this);
		book.page_list_idx = idx; // set the page index for future reference
		//$(this).append(cf_page(idx)); // populate the page form
		//$(this)[0].innerHTML = $(this)[0].innerHTML + cf_page(idx);
		//$(this).after(cf_page(idx));
		$(this).append(cf_page(idx)).contents().filter(function(){
			return this.nodeType === 3;
		}).remove();
		if (book.page_list[idx].type != "1") { // if this is a game
			$.each(book.page_list[idx].state_list, function(index) { // append any states to the list ui
				insert_state(index, 1);
			});
		}
		$("#imb_state_list").sortable(); // make the state list sortable
		$(this).trigger('create');
		$("#imb_page_list" ).sortable("disable"); // disable sortable while collapsible form is opened
		return false;
	});
	// CLOSE
	// --------------------------------------------------------------------
	$(document).on("collapse", ".imb_page_collapsible", function(event, ui) {
		$("#cf_page").remove();
		$("#imb_page_list" ).sortable("enable");
		return false;
	});
	// INSERT/CREATE
	// -------------------------------------------------------------------------
	$(document).on("click", "#imb_page_insert_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var form = $(this).closest("form"); // parent form
		var page = new Page($('#npagecat', form).val(), "", "n"); // create new record
		page.state_list[0] = new State("", 0, 0, ""); // each page must have at least 1 state
		book.page_list.unshift(page); // prepend it to the array
		insert_page(0, 0); // prepend it to the list ui
		$("#book").page("destroy").page(); // restyle the ui
		imb_update_list(".imb_page_collapsible", "imb_page_list_item"); // order the ui list element ids
		$("#imb_page_list_item0 h3").addClass("highlight_inserted"); // highlight newly inserted item
		$("#imb_page_list_item0 h3").removeClass("highlight_inserted", 3500, "easeInBack"); // remove the highlight from the newly inserted item using a fade effect over 2.5 seconds
		$(".imb_page_collapsible").each(function(idx) {
			$(this).find(".imb_page_title").html('Page ' + (idx + 1) + ' ( ' + imb_page_type_name(book.page_list[idx].type) + ' ) ' + book.page_list[idx].chapter_number);
		});
		imb_save_flag(2,1);
		return false;
	});
	// REFRESH TEXT PAGES from a file
	// --------------------------------------------------------------------
	$(document).on("click", "#imb_page_refresh_btn", function(event, ui) {
		window.alert("here");
		// set variable used by select logic
		sessionStorage.fileAction="refresh";
		// jump directly to file select dialog
		$.mobile.changePage("#upload-form", { transition: "pop", role: "dialog"});
	});
	// DELETE
	// ---------------------------------------------------------------------
	$(document).on("click", "#imb_page_delete_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var idx = $(this).closest(".imb_page_collapsible").prevAll(".imb_page_collapsible").length; // get the index of the row which triggered this
		var $this=$(this);
		jqm_alert("Confirm","Are you sure you want to delete this record?", function() {
			$.mobile.changePage("#book");
			book.page_list.splice(idx, 1); // remove it from the array
			$this.closest(".imb_page_collapsible").trigger("collapse").remove(); // remove it from the list ui
			imb_update_list(".imb_page_collapsible", "imb_page_list_item"); // order the ui list element ids
			$(".imb_page_collapsible").each(function(idx) {
				$(this).find(".imb_page_title").html('Page ' + (idx + 1) + ' ( ' + imb_page_type_name(book.page_list[idx].type) + ' ) ' + book.page_list[idx].chapter_number);
			});
			imb_save_flag(2,1);
			return false;
		}, '', "Yes", "No");

	});
	// STATE MACHINE
	// ---------------------------------------------------------------------
	$(document).on("click", "#imb_page_states_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var idx = $(this).closest(".imb_page_collapsible").prevAll(".imb_page_collapsible").length; // get the index of the row which triggered this
		$.mobile.changePage("#state_machine", { transition: "pop"});
		$("#statemachine-demo").empty();
		if (book.page_list[idx].type != "1") { // if this is a game
			
			/****************************** THIS CODE WILL AUTO PLACE THE STATES BASED ON CERTAIN ASSUMPTIONS -- This was used before Jack added the xloc and yloc attributes to state object
			num_states = book.page_list[idx].state_list.length;
			//alert(num_states);
			//calculates a multiplier that bases the spacing between states on how many states there are in that page.  For example, if there were 4 states, then each state would be placed 24% of the screen size away from each other.
			var start_spacing = 5;
			var state_spacing_multiplier = 0;
			if(num_states >= 10) {
				state_spacing_multiplier = (100/(num_states-1));
				start_spacing = 0;
			}
			else {
				state_spacing_multiplier = 10; //if number of states less than 20, just space then 5% apart
			} 
			$.each(book.page_list[idx].state_list, function(index) { // append any states to the list ui
				//test if index is even or odd number
				if(isOdd(index)) {
					left_pos = (state_spacing_multiplier * index) + start_spacing;
					top_pos = (state_spacing_multiplier * (index-1)) + start_spacing;
				}
				else {
					left_pos = (state_spacing_multiplier * index) + start_spacing;
					top_pos = (state_spacing_multiplier * index) + start_spacing;
					//alert("left: " + left_pos + "\ntop: " + top_pos);
				}
				insert_state_machine(index, left_pos, top_pos);
			});
		}
		***********************************************************************************************************************/
			$.each(book.page_list[idx].state_list, function(index, state) { // append any states to the list ui
				left_pos = (state.xloc);
				top_pos = (state.yloc);
				insert_state_machine(index, left_pos, top_pos);
			});
		}	
		alert("States and Transitions have been loaded for Page " + (idx+1));
		start_jsPlumb(book_list_idx, idx);
		return false;
	});				
	// COPY
	// ---------------------------------------------------------------------
	$(document).on("click", "#imb_page_copy_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var idx = $(this).closest(".imb_page_collapsible").prevAll(".imb_page_collapsible").length; // get the index of the row which triggered this
		var copied_page = deepObjCopy(book.page_list[idx]); // deeply (recursively) copy the entire page data structure array
		book.page_list.splice(idx, 0, copied_page); // copy current page and append it to the array (at current spot)
		insert_page(idx, 1);
		$("#book").page("destroy").page(); // restyle the ui
		imb_update_list(".imb_page_collapsible", "imb_page_list_item"); // order the ui list element ids
		// update display of each list element
		$(".imb_page_collapsible").each(function(index) {
			$(this).find(".imb_page_title").html('Page ' + (index + 1) + ' ( ' + imb_page_type_name(book.page_list[index].type) + ' ) ' + book.page_list[index].chapter_number);
		});
		$("#imb_page_list_item" + idx + " h3").addClass("highlight_inserted"); // highlight newly inserted item
		$("#imb_page_list_item" + idx + " h3").removeClass("highlight_inserted", 3500, "easeInBack"); // remove the highlight from the newly inserted item using a fade effect over 2.5 seconds
		imb_save_flag(2,1);
		return false;
	});			
	// UPDATE
	// ----------------------------------------------------------------------
	$(document).on("change", "#imb_page_form :input", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var idx = $(this).closest(".imb_page_collapsible").prevAll(".imb_page_collapsible").length; // get the index of the row which triggered this
		var page = book.page_list[idx];
		var form = $(this).closest("form"); // parent form
		// update data
		page.chapter_number = $('#nchapter', form).val();
		page.timer_last = $('#ntimerlast', form).val();
		page.timer_next = $('#ntimernext', form).val();
		page.hidden = $('#nhidden', form).val();
		if ($('#ncharacter', form).length > 0) { // some pages may not have the option for a character
			page.char_idx = $('#ncharacter', form).val();
		}
		if (page.type == 1) { // text page also has state[0].sound and state[0].text
			page.state_list[0].score = 0;
			page.state_list[0].sound = (($('#imb_page_sound', form).text() == "None") ? "" : $('#imb_page_sound', form).text());
			page.state_list[0].text = $('#ntext', form).val();
		}
		if (page.type == 2) {
			page.nlp_feedback = ($('#nlp_feedback', form).val() == "y");
		}
		// update display
		$(this).closest(".imb_page_collapsible").find(".imb_page_title").html('Page ' + (idx + 1) + ' ( ' + imb_page_type_name(page.type) + ' ) ' + page.chapter_number);
		imb_save_flag(2,1);
		return false;
	});
// STATE CF event handlers
	// sortable state list
	// -------------------------------------------------------
	$(document).on( "sortupdate", "#imb_state_list", function(event, ui) {
		var book = book_list[book_list_idx];
		var page = book.page_list[book.page_list_idx];
		imb_sort_array(page.state_list, $(this).sortable('toArray'), "imb_state_list_item"); // sort the underlying data structure to reflect the ui ordering and store 
		// update id of each list element
		imb_update_list(".imb_state_collapsible", "imb_state_list_item");			
		// update display of each list element
		$(".imb_state_collapsible").each(function(idx) {
			$(this).find(".yellow_state").html('State ' + (idx + 1)); /* + ' (Score: ' + page.state_list[idx].score + ')');   -----------SCORE HAS BEEN DEPRECATED------------------------------*/
		});
		imb_save_flag(2,1);
		event.stopPropagation();
	});
	// OPEN/READ
	// ------------------------------------------------------------------
	$(document).on("expand", ".imb_state_collapsible", function(event, ui) {
		var book = book_list[book_list_idx];
		var page = book.page_list[book.page_list_idx];
		var idx = $(".imb_state_collapsible").index(this); // get the state index
		page.state_list_idx = idx; // set the state index for future reference
		var state = page.state_list[idx];
		$(this).append(cf_state(idx));
		//$.each(state.lexicon.word_list, function(index) { // append any lexicon words to the list ui
		//	insert_lexicon_word(index, 1);
		//});
		$.each(state.transition_list, function(index) { // append any transitions to the list ui
			insert_transition(index, 1);
		});
		// now set some things dynamically
		$("#imb_lexicon_list").sortable(); // make the lexicon objects sortable
		$("#imb_transition_list").sortable(); // make the transitions sortable
		$("#imb_state_list" ).sortable("disable");
		$(this).trigger('create');	
		return false;
	});
	// CLOSE
	// --------------------------------------------------------------------
	$(document).on("collapse", ".imb_state_collapsible", function(event, ui) {
		$("#cf_state").remove();
		$("#imb_state_list" ).sortable("enable");
		return false;
	});
	// INSERT/CREATE
	// -------------------------------------------------------------------------
	$(document).on("click", "#imb_state_insert_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var form = $(this).closest("form"); // parent form
		var state = new State("", 0, 0, ""); // create new record
		page.state_list.unshift(state); // prepend it to the array
		insert_state(0, 0); // prepend it to the list ui
		$("#book").page("destroy").page(); // restyle the ui
		imb_update_list(".imb_state_collapsible", "imb_state_list_item"); // order the ui list element ids
		$("#imb_state_list_item0 h3").addClass("highlight_inserted"); // highlight newly inserted item
		$("#imb_state_list_item0 h3").removeClass("highlight_inserted", 3500, "easeInBack"); // remove the highlight from the newly inserted item using a fade effect over 2.5 seconds				
		$(".imb_state_collapsible").each(function(idx) {
			$(this).find(".yellow_state").html('State ' + (idx + 1)); /* + ' (Score: ' + page.state_list[idx].score + ')');   -----------SCORE HAS BEEN DEPRECATED------------------------------*/
		});				
		imb_save_flag(2,1);
		return false;
	});
	// DELETE   *********THIS IS NOW HANDLED BY A FUNCTION WITH PARAMETERS DYNAMICALLY SET***************************
	// ---------------------------------------------------------------------
	/* $(document).on("click", "#imb_state_delete_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var idx = $(this).closest(".imb_state_collapsible").prevAll(".imb_state_collapsible").length; // get the index of the row which triggered this
		jqm_alert("Confirm", "Are you sure you want to delete this record?", function() {
			page.state_list.splice(idx, 1); // remove it from the array
			$(this).closest(".imb_state_collapsible").trigger("collapse").remove(); // remove it from the list ui
			imb_update_list(".imb_state_collapsible", "imb_state_list_item"); // order the ui list element ids
			// update display of each list element
			$(".imb_state_collapsible").each(function(idx) {
				$(this).find(".yellow_state").html('State ' + (idx + 1)); // + ' (Score: ' + page.state_list[idx].score + ')');   -----------SCORE HAS BEEN DEPRECATED------------------------------
			});
		}, '', "Yes", "No");
		imb_save_flag(2,1);
		return false;
	}); */
	// COPY
	// ---------------------------------------------------------------------
	$(document).on("click", "#imb_state_copy_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page				
		var idx = 0;
		var clicked_from = ''; // stores whether the click came from the state machine editor or the state list.
		if ($(".ui-page-active .ui-popup-active").length > 0) {
			clicked_from = 'SME';
			idx = parseInt(page.state_list_idx); // set the state index if from state machine editor
		}
		else {
			clicked_from = 'State_List';
			idx = parseInt($(this).closest(".imb_state_collapsible").prevAll(".imb_state_collapsible").length); // get the index of the row which triggered this
		}		
		var copied_state = deepObjCopy(page.state_list[idx]); // deeply (recursively) copy the entire state data structure array
		copied_state.xloc = Number(copied_state.xloc) + 10; //offsets new copied state by 10 pixels to make it easier to notice
		copied_state.yloc = Number(copied_state.yloc) + 10; //offsets new copied state by 10 pixels to make it easier to notice
		page.state_list.push(copied_state); // copy current state and append it to the array (at the end of the array)
		var copied_state_idx = (page.state_list.length - 1) // the new idx of the copied state.
		if (clicked_from == 'SME') {
			insert_state_machine(copied_state_idx, 3, 10);
			$("#popupMessageState").popup("close");
			refresh_state_machine();
			$("#imb_state_machine_state" + copied_state_idx).addClass("highlight_SME_state"); // highlight newly inserted item
			setTimeout(function() {
				$("#imb_state_machine_state" + copied_state_idx).removeClass("highlight_SME_state"); // remove the highlight from the newly inserted state after 3.5 seconds	
			}, 3500);
		}
		else if ( clicked_from == 'State_List') {
			insert_state(copied_state_idx, 1);
			$("#book").page("destroy").page(); // restyle the ui
			imb_update_list(".imb_state_collapsible", "imb_state_list_item"); // update id of each list element
			//update display of each list element
			$(".imb_state_collapsible").each(function(index) {
				$(this).find(".yellow_state").html('State ' + (index + 1));
			});
			$("#imb_state_list_item" + copied_state_idx + " h3").addClass("highlight_inserted"); // highlight newly inserted item
			$("#imb_state_list_item" + copied_state_idx + " h3").removeClass("highlight_inserted", 3500, "easeInBack"); // remove the highlight from the newly inserted item using a fade effect over 2.5 seconds	
		}				
		imb_save_flag(2,1);
		return false;
	});				
	// UPDATE
	// ----------------------------------------------------------------------
	$(document).on("change", ".imb_state_form", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // current page
		var idx = get_numbers($(e.currentTarget).attr('id')); // get the state_idx where the change happened.  This uses the event object to extract the id of the form and then extract the number from the id.
		var state = page.state_list[idx];
		var form = $(this).closest("form"); // parent form
		// update data
		state.sound = (($('#imb_state_sound', form).text() == "None") ? "" : $('#imb_state_sound', form).text());
		state.text = $('#ntext', form).val();
		state.image.file_name = (($('#imb_state_image', form).text() == "None") ? "" : $('#imb_state_image', form).text());
		state.label = ($('#imb_state_label', form).val());
		state.char_idx = Number($('.imb_state_avatar_btn', form).data("character"));
		state.avatar_idx = Number($('.imb_state_avatar_btn', form).data("avatar"));
		// update display
		$("#state_label_cont" + idx).text(state.label + ' (' + (idx + 1) + ')');
		$(this).closest(".imb_state_collapsible").find(".yellow_state").html('State ' + (idx + 1)); /* + ' (Score: ' + page.state_list[idx].score + ')');   -----------SCORE HAS BEEN DEPRECATED------------------------------*/
		imb_save_flag(2,1);
		return false;
	});
// LEXICON CF event handlers
	// OPEN/READ - since these are created dynamically inside each page
	// ------------------------------------------------------------------
	$(document).on("expand", "#imb_lexicon", function(event, ui) {
		//if(event.currentTarget.offsetParent.id == 'popupMessageState') { // this if statement is needed for the state machine editor because the lexicon form is not dynamically created because there is no state collapsible in the SME.
			$("#imb_lexicon_list").empty();
			var book = book_list[book_list_idx];
			var page = book.page_list[book.page_list_idx];
			var state = page.state_list[page.state_list_idx]; // get the state index
			$.each(state.lexicon.word_list, function(index) { // append any lexicon words to the list ui
				insert_lexicon_word(index, 1);
			});
			// now set some things dynamically
			$("#imb_lexicon_list").sortable(); // make the lexicon objects sortable
			$(this).trigger('create');	
		//}
		return false;
	});

	// CLOSE
	// --------------------------------------------------------------------
	$(document).on("collapse", "#imb_lexicon", function(event, ui) {
		return false;
	});
	// UPDATE
	// ----------------------------------------------------------------------
	$(document).on("change", "#imb_lexicon_form :input", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var state = page.state_list[page.state_list_idx]; // current state
		var form = $(this).closest("form"); // parent form
		// update data
		state.lexicon.label = $('#nlexlabel', form).val();
		state.lexicon.text = $('#nlexdir', form).val();
		state.lexicon.error = $('#nlexerror', form).val();
		imb_save_flag(2,1);
		return false;
	});
	// sortable lexicon list
	// -------------------------------------------------------
	$(document).on( "sortupdate", "#imb_lexicon_list", function(event, ui) {
		var book = book_list[book_list_idx];
		var page = book.page_list[book.page_list_idx];
		var state = page.state_list[page.state_list_idx];
		imb_sort_array(state.lexicon.word_list, $(this).sortable('toArray'), "imb_lexicon_item"); // sort the underlying data structure to reflect the ui ordering
		imb_update_list(".imb_lexicon_collapsible", "imb_lexicon_item");
		imb_save_flag(2,1);
		event.stopPropagation();
	});
	// OPEN/READ
	// ------------------------------------------------------------------
	$(document).on("expand", ".imb_lexicon_collapsible", function(event, ui) {
		var book = book_list[book_list_idx];
		var page = book.page_list[book.page_list_idx];
		var state = page.state_list[page.state_list_idx];
		var idx = $(".imb_lexicon_collapsible").index(this); // index of the collapsible form
		var lexicon = state.lexicon.word_list[idx];
		$("#nwordtype-dialog").remove();
		$(this).append(cf_lexicon_word(idx)); // populate the form
		$(this).trigger('create');
		$("#imb_lexicon_copy_btn").hide();
		$("#imb_lexicon_list" ).sortable("disable");
		return false;
	});
	// CLOSE
	// --------------------------------------------------------------------
	$(document).on("collapse", ".imb_lexicon_collapsible", function(event, ui) {
		$("#cf_lexicon_word").remove();
		$("#imb_lexicon_list" ).sortable("enable");
		return false;
	});
	// INSERT/CREATE
	// -------------------------------------------------------------------------
	$(document).on("click", "#imb_lexicon_insert_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var state = page.state_list[page.state_list_idx]; // current state
		var form = $(this).closest("form"); // parent form
		var lexicon_word = new Word($('#xwordtype', form).val(), ($('#ximb_lexicon_sound', form).text() == "None") ? "" : $('#ximb_lexicon_sound', form).text(), ($('#xwordicon', form).text() == "None") ? "" : $('#xwordicon', form).text(), $('#xwordtext', form).val()); // create new record
		state.lexicon.word_list.unshift(lexicon_word); // prepend it to the array
		insert_lexicon_word(0, 0); // prepend it to the list ui
		if ($("#book").hasClass("ui-page-active")) { // only destroy #book page if it is active (this happens when in the list editor)
			$("#book").page("destroy").page(); // restyle the ui
		}
		if ($("#state_machine").hasClass("ui-page-active")) { // only destroy #sate_machine page if it is active (this happens when in the State Machine Editor)
			$("#state_machine").page("destroy").page(); // restyle the ui 
		}
		imb_save_flag(2,1);
		return false;
	});
	// DELETE
	// ---------------------------------------------------------------------
	$(document).on("click", "#imb_lexicon_delete_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var state = page.state_list[page.state_list_idx];
		var idx = $(this).closest(".imb_lexicon_collapsible").prevAll(".imb_lexicon_collapsible").length; // get the index of the row which triggered this			
		var $this=$(this);
		jqm_alert("Confirm", "Are you sure you want to delete this record?", function(){
			state.lexicon.word_list.splice(idx, 1); // remove it from the array
			$this.closest(".imb_lexicon_collapsible").trigger("collapse").remove(); // remove it from the list ui
			imb_update_list(".imb_lexicon_collapsible", "imb_lexicon_item"); // order the ui list element ids
		}, '', "Yes", "No");
		imb_save_flag(2,1);
		return false;
	});
	// COPY
	// ---------------------------------------------------------------------
	$(document).on("click", "#imb_lexicon_copy_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var state = page.state_list[page.state_list_idx];
		var current_state_idx = page.state_list_idx // idx of the current state we are working in 				
		var idx = $(this).closest(".imb_lexicon_collapsible").prevAll(".imb_lexicon_collapsible").length; // get the index of the row which triggered this
		var copied_lexicon_obj = deepObjCopy(state.lexicon.word_list[idx]); // deeply (recursively) copy the entire lexicon object data structure array
		state.lexicon.word_list.splice(idx, 0, copied_lexicon_obj); // copy current lexicon object and append it to the array (at current spot)					
		insert_lexicon_word(idx, 1);	
		$("#book").page("destroy").page(); // restyle the ui					
		$("#imb_state_list_item" + current_state_idx).trigger("collapse");
		$("#imb_state_list_item" + current_state_idx).trigger("expand"); // expand current state so that lexicon words are reordered correctly according to their data structure				
		$("#imb_lexicon").trigger("expand"); // expand lexicon so that user gets back to viewable area where they just copied a lexicon item
		var element = $("#imb_lexicon_item" + idx); // html element (jquery object) of the lexicon item that was copied
		center_viewport(element); //center brower viewpoint on the lexcion item we copied			
		// update display of each list element
		$("#imb_lexicon_item" + idx).trigger("expand");
		$("#imb_lexicon_list" ).sortable("disable");				
		imb_save_flag(2,1);
		return false;
	});					
	// UPDATE
	// ----------------------------------------------------------------------
	$(document).on("change", "#imb_lexicon_object_form :input", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var state = page.state_list[page.state_list_idx]; // current state
		var idx = $(this).closest(".imb_lexicon_collapsible").prevAll(".imb_lexicon_collapsible").length; // get the index of the row which triggered this
		var lexicon = state.lexicon.word_list[idx];
		var form = $(this).closest("form"); // parent form
		// update data
		lexicon.type = $('#nwordtype', form).val();
		lexicon.sound = (($('#imb_lexicon_sound', form).text() == "None") ? "" : $('#imb_lexicon_sound', form).text());
		lexicon.icon = (($('#imb_lexicon_image', form).text() == "None") ? "" : $('#imb_lexicon_image', form).text());
		lexicon.word = $('#nwordtext', form).val();
		// update display
		$(this).closest(".imb_lexicon_collapsible").find(".lexicon_word_label").html(((lexicon.word == "") ? imb_type_color(lexicon.type, 'label') : lexicon.word)); // update the word
		$(this).closest(".imb_lexicon_collapsible").find(".lexicon_word_label").attr("class", "lexicon_word_label " + imb_type_color(lexicon.type, 'color')); // update the color
		imb_save_flag(2,1);
		return false;
	});
// TRANSITION CF event handlers
	// OPEN/READ - since these are created dynamically inside each page
	// --------------------------------------------------------------------
	$(document).on("expand", "#imb_transitions", function(event, ui) {
		return false;
	});
	// CLOSE
	// --------------------------------------------------------------------
	$(document).on("collapse", "#imb_transitions", function(event, ui) {
		return false;
	});
	// sortable transition object
	// -----------------------------------------------------------------
	$(document).on( "sortupdate", "#imb_transition_list", function(event, ui) {
		var book = book_list[book_list_idx];
		var page = book.page_list[book.page_list_idx];
		var state = page.state_list[page.state_list_idx];
		imb_sort_array(state.transition_list, $(this).sortable('toArray'), "imb_transition_item"); // sort the underlying data structure to reflect the ui ordering
		imb_update_list(".imb_transition_collapsible", "imb_transition_item");
		imb_save_flag(2,1);
		event.stopPropagation();
	});
	// OPEN/READ
	// --------------------------------------------------------------------
	$(document).on("expand", ".imb_transition_collapsible", function(event, ui) {
		var book = book_list[book_list_idx];
		var page = book.page_list[book.page_list_idx];
		var state = page.state_list[page.state_list_idx];
		var idx = $(".imb_transition_collapsible").index(this); // index of the collapsible form
		state.transition_list_idx = idx; // save the current transition idx
		var transition = state.transition_list[idx];
		$(this).append(cf_transition(idx)); // populate the form
		$(this).trigger('create');
		$("#imb_transition_list" ).sortable("disable");
		return false;
	});
	// CLOSE
	// --------------------------------------------------------------------
	$(document).on("collapse", ".imb_transition_collapsible", function(event, ui) {
		$("#cf_transition").remove();
		$("#imb_transition_list" ).sortable("enable");
		return false;
	});
	// INSERT/CREATE
	// -------------------------------------------------------------------------
	$(document).on("click", "#imb_transition_insert_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var state = page.state_list[page.state_list_idx]; // current state
		var next_state_idx = page.state_list.length - 1; // number of states - 1
		var form = $(this).closest("form"); // parent form
		var transition = new Transition( $('#ntrancat', form).val(), "1", -1, -1, next_state_idx); // create new record
		state.transition_list.unshift(transition); // prepend it to the array
		insert_transition(0, 0); // prepend it to the list ui
		$("#book").page("destroy").page(); // restyle the ui
		imb_update_list(".imb_transition_collapsible", "imb_transition_item"); // order the ui list element ids
		$("#imb_transition_item0 h3").addClass("highlight_inserted"); // highlight newly inserted item
		$("#imb_transition_item0 h3").removeClass("highlight_inserted", 3500, "easeInBack"); // remove the highlight from the newly inserted item using a fade effect over 2.5 seconds		
		imb_save_flag(2,1);
		return false;
	});
	// COPY
	// ---------------------------------------------------------------------
	$(document).on("click", "#imb_transition_copy_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var state = page.state_list[page.state_list_idx]; // current state
		var current_state_idx = page.state_list_idx // idx of the current state we are working in 
		var idx = $(this).closest(".imb_transition_collapsible").prevAll(".imb_transition_collapsible").length; // get the index of the row which triggered this
		jqm_alert("Confirm", "Are you sure you want to copy this transition?", function() {
			var copied_transition = deepObjCopy(state.transition_list[idx]); // deeply (recursively) copy the entire transition data structure array
			state.transition_list.splice(idx, 0, copied_transition); // copy current transition and append it to the array (at current spot)
			insert_transition(idx, 1);
		}, '', "Yes", "No");
		$("#book").page("destroy").page(); // restyle the ui
		$("#imb_state_list_item" + current_state_idx).trigger("expand"); // expand current state so that transitions are reordered correctly according to their data structure				
		$("#imb_transitions").trigger("expand"); // expand transitions so that user gets back to viewable area where they just copied a transition
		var element = $("#imb_transition_item" + idx); // html element (jquery object) of the transition that was copied
		center_viewport(element); //center brower viewpoint on the transition we copied	
		$("#imb_transition_item" + idx + " h3").addClass("highlight_inserted"); // highlight newly inserted item
		$("#imb_transition_item" + idx + " h3").removeClass("highlight_inserted", 3500, "easeInBack"); // remove the highlight from the newly inserted item using a fade effect over 2.5 seconds					
		imb_save_flag(2,1);
		return false;
	});				
	// DELETE  *********THIS IS NOW HANDLED BY A FUNCTION WITH PARAMETERS DYNAMICALLY SET***************************
	// ---------------------------------------------------------------------
	/*$(document).on("click", "#imb_transition_delete_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var state = page.state_list[page.state_list_idx];
		var idx = $(this).closest(".imb_transition_collapsible").prevAll(".imb_transition_collapsible").length; // get the index of the row which triggered this
		jqm_alert("Confirm", "Are you sure you want to delete this record?", function(){
			state.transition_list.splice(idx, 1); // remove it from the array
			$(this).closest(".imb_transition_collapsible").trigger("collapse").remove(); // remove it from the list ui
			imb_update_list(".imb_transition_collapsible", "imb_transition_item"); // order the ui list element ids
		}, '', "Yes", "No");
		imb_save_flag(2,1);
		return false;
	});*/
	// UPDATE
	// ----------------------------------------------------------------------
	$(document).on("change", ".imb_transition_form", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var state = page.state_list[page.state_list_idx]; // current state
		var idx = get_numbers($(e.currentTarget).attr('id')); // get the transition_idx where the change happened.  This uses the event object to extract the id of the form and then extract the number from the id.
		var transition = state.transition_list[idx];
		var form = $(this).closest("form"); // parent form
		// update data
		transition.trigger = $('#ntrig', form).val();
		transition.next_state_idx = $('#ntrignext', form).val();
		transition.scenario_id = $('#vpfid', form).val();
		if (transition.type == 6) {
			transition.variable_idx = $("#nvaridx", form).val();
		}
		else if (transition.type == 7) {
			transition.nlp_min_match = Math.max(0, Math.min(100, +($("#nlp_match", form).val())));
		}
		// update display
		if (transition.type == 4) {
			$(this).closest(".imb_transition_collapsible").find(".green_transition").html(imb_transition_label(transition.type) + ' ( Possibilities: ' + state.transition_list[idx].trigger + ', Starting from: ' + (parseInt(state.transition_list[idx].next_state_idx) + 1) + ')'); // update the display
		} else {
			$(this).closest(".imb_transition_collapsible").find(".green_transition").html(imb_transition_label(transition.type) + ' ( Trigger on: ' + state.transition_list[idx].trigger + ', Transition to: ' + (parseInt(state.transition_list[idx].next_state_idx) + 1) + ')'); // update the display
		}
		refresh_state_machine();
		imb_save_flag(2,1);
		return false;
	});
// -----------------------------------------------------------------------------------------------------------------------------------------
// OTHERS	
	// event listener for login
	$(document).on(user_event, "#imb_login_btn", function(e, ui) {
		imb_login($("#imb_user").val(), $("#imb_pass").val());
	});
	// way to get back to bookshelf
	$(document).on(user_event, "#imb_bookshelf_btn", function(e, ui) {
		// unlock the book we're editing
		if ((book_list_idx > -1) && (book_list_idx < book_list.length)) {
			clearInterval(book_lock_timer);
			imb_lock_book(book_list[book_list_idx].book_id, false);
		}
		// return to the bookshelf
		$.mobile.changePage("#bookshelf", { transition: "pop", reverse: true});
	});
	// event listener for save bookshelf
	$(document).on(user_event, "#imb_bookshelf_save_btn", function(e, ui) {
		imb_save_bookshelf_content(bookshelf_file);
		imb_save_flag(1,0);
		
		// These steps will remove and reload the book list....
		
		// removes the book cover listing
		$( "[id^=imb_book_list_item]" ).remove();
		
		// indicates need to rebuild
		book_list_idx = -1;
		
		// delete the old book list
		book_list.length = 0; 
		
		// reload the books from server, ajax call is coded now to not cache the data!
		load_bookshelf();
	});
	// event listener for save book
	$(document).on(user_event, ".imb_book_save_btn", function(e, ui) {
		imb_save_discussion_topics(book_list_idx, function(){
			// save the book after the discussion topics are saved, since that
			// may change the book data to save
			imb_save_book_content(book_list_idx);
			imb_save_flag(2,0);
		});
	});

	// VE and RE vent listener for last transition
	$(document).on(user_event, "#imb_btn_transition_last", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var state = page.state_list[page.state_list_idx]; // current state
		var next_state_idx = page.state_list.length - 1; // next state idx
		var transition = state.transition_list[state.transition_list_idx];
		var parent_id = $(this).parent('div').parent('div').parent('div').attr("id");
		
		// find index of the previous transition of the same type
		var prev_transition_idx = -1;
		for (var x = state.transition_list_idx - 1; x > -1; x--) {
			if (state.transition_list[x].type == transition.type) {
				prev_transition_idx = x;
				break;
			}
		}
		if (prev_transition_idx == -1) {
			prev_transition_idx = state.transition_list_idx;
		}
		// update and move to the previous transition
		if (parent_id == "bitmask_DD_tool") { // called by Visual Editor
			submit_DD_transition("responses");
			state.transition_list_idx = prev_transition_idx;
			if (debug) console.log("VE book:" + book_list_idx + "page:" + book.page_list_idx + "state:" + page.state_list_idx + "trans:" + state.transition_list_idx);
			transition_bitmask_DD_page("existing");
		} else {
			submit_respon_list(true);
			state.transition_list_idx = prev_transition_idx;
			if (debug) console.log("RE book:" + book_list_idx + "page:" + book.page_list_idx + "state:" + page.state_list_idx + "trans:" + state.transition_list_idx);
			transition = state.transition_list[state.transition_list_idx]; // new current transition
			responses = transition.response_list;
			setup_page(transition, responses);
			// update the header
			$("#response_editor_header_title").html('Response Editor - ' + imb_transition_label(transition.type) + ' transition (' + (state.transition_list_idx + 1) + ')');
		}
	});
	// VE and RE event listener for next transition
	$(document).on(user_event, "#imb_btn_transition_next", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var state = page.state_list[page.state_list_idx]; // current state
		var next_state_idx = page.state_list_idx + 1; // next state idx
		var transition = state.transition_list[state.transition_list_idx];
		var parent_id = $(this).parent('div').parent('div').parent('div').attr("id");

		// find index of the next transition of the same type
		var next_transition_idx = 0;
		for (var x = state.transition_list_idx + 1; x < state.transition_list.length; x++) {
			if (state.transition_list[x].type == transition.type) {
				next_transition_idx = x;
				break;
			}
		}
		if (next_transition_idx == 0) { // this is the last transition of this type
			jqm_alert("Confirm", "Are you sure you want to create a new transition?", function() {
				next_transition_idx = state.transition_list.length;
				var new_transition = new Transition(transition.type, "1", next_state_idx); // create new record
				state.transition_list.push(new_transition); // append it to the array
				insert_transition(state.transition_list.length - 1, 1); // append it to the list ui
				$("#book").page("destroy").page(); // restyle the ui
				imb_save_flag(2,1);
			}, function() {
				next_transition_idx = state.transition_list_idx;
			}, "Yes", "No");
		}
		// update and move to the next transition
		if (parent_id == "bitmask_DD_tool") { // called by Visual Editor
			submit_DD_transition("responses");
			state.transition_list_idx = next_transition_idx;
			if (debug) console.log("VE book:" + book_list_idx + "page:" + book.page_list_idx + "state:" + page.state_list_idx + "trans:" + state.transition_list_idx);
			transition_bitmask_DD_page("existing");
		} else {
			submit_respon_list(true);
			state.transition_list_idx = next_transition_idx;
			if (debug) console.log("RE book:" + book_list_idx + "page:" + book.page_list_idx + "state:" + page.state_list_idx + "trans:" + state.transition_list_idx);
			transition = state.transition_list[state.transition_list_idx]; // new current transition
			responses = transition.response_list;
			setup_page(transition, responses);
			// update the header
			$("#response_editor_header_title").html('Response Editor - ' + imb_transition_label(transition.type) + ' transition (' + (state.transition_list_idx + 1) + ')');

		}
	});
	
	// MEDIA button callbacks
	// media upload button
	// --------------------------------------------------------------------
	$(document).on(user_event, ".imb_media_btn", function(e, ui) {
		var book = book_list[book_list_idx];
		var srcfrm = $(this).closest("form").attr("id"); // parent form id
		var srcbtn = $(this).closest(".imb_media_btn").attr("id"); // media button in
		if (debug) console.log(srcbtn);
		// set the name of media and icon buttons that may need to be updated:
		// imb_*_icon
		// imb_*_image
		// imb_*_sound
		if(srcbtn == undefined) {
			srcbtn = "nothing";  //this is needed when clicking the "upload files" button on the book cover screen because otherwise the srcbtn variable is undefined and then throws an error when trying to make a substring in the function below.				
		}
		sessionStorage.mediaForm=srcfrm;
		sessionStorage.mediaButton=srcbtn;
		sessionStorage.fileName="";
		switch (srcbtn.substring(0, 15)) {
			case "imb_cover_image":
				sessionStorage.mediaType="images";
				sessionStorage.iconButton="imb_cover_icon"; // image change should update the icon displayed
			break;
			case "imb_cover_sound":
				sessionStorage.mediaType="sounds";
				sessionStorage.iconButton="";
			break;
			case "imb_page_sound":
				sessionStorage.mediaType="sounds";
				sessionStorage.iconButton="";
			break;
			case "imb_state_image":
				sessionStorage.mediaType="images";
				sessionStorage.iconButton="imb_state_icon";
			break;
			case "imb_state_sound":
				sessionStorage.mediaType="sounds";
				sessionStorage.iconButton="";
			break;
			case "imb_lexicon_ima":
				sessionStorage.mediaType="images";
				sessionStorage.iconButton="";
				sessionStorage.mediaButton="imb_lexicon_image";
				sessionStorage.fileName="";
			break;
			case "imb_lexicon_sou":
				sessionStorage.mediaType="sounds";
				sessionStorage.iconButton="";
			break;
			case "imb_response_so":  
				sessionStorage.mediaType="sounds";
				sessionStorage.iconButton="";
				sessionStorage.mediaForm = "response_sound";  // This is needed because of how the response editor works, when using the old way of adding responses, it worked without this.  This value will be used below to handle response sounds.						
			break;
			case "imb_image_image":
				sessionStorage.mediaType="images";
				sessionStorage.iconButton="";
			break;
			default: // nothing to set
				sessionStorage.mediaType="all";
				sessionStorage.iconButton="";
			break;
		}
		// set variable used by select logic
		sessionStorage.fileAction="upload";
		// get the list of media files for this book and refresh the file manager
		mediaContent(getFileNames(book.location, sessionStorage.mediaType));
		$.mobile.changePage("#media", { transition: "pop"});
		if (srcbtn == "nothing") {
			$("#imb_media_cancel_btn .ui-btn-text").text("Return to Authoring Tool");
		}
		else {
			$("#imb_media_cancel_btn .ui-btn-text").text("Cancel");
		}
		$("#mediatype").selectmenu('refresh', true);
	});
	// exit media page
	//---------------------------------------------------------------------
	$(document).on(user_event, "#imb_media_cancel_btn", function(e, ui) {
		history.go(-1);
	});		
	// media object selection
	//---------------------------------------------------------------------
	$(document).on(user_event, ".holder", function(e, ui) {
		var fsrc = $(this).closest(".holder").attr("file-source");
		if (debug) console.log(fsrc);
		
		// set background color and clear all others
		$(".holder").css("background-color", "");
		$(this).css("background-color", "#33f");
		
		// save the file name
		sessionStorage.fileName = fsrc;
	});
	// media type selection
	//---------------------------------------------------------------------
	$(document).on("change", "#mediatype", function(e, ui) {
		var book = book_list[book_list_idx];
		sessionStorage.mediaType = $(this).val();
		// get the list of media files for this book and refresh the file manager
		mediaContent(getFileNames(book.location, sessionStorage.mediaType));
	});
	// process media select
	//---------------------------------------------------------------------
	$(document).on(user_event, "#imb_media_select_btn", function(e, ui) {
		var book = book_list[book_list_idx];
		if (debug) console.log("Media Select FILE TYPE: " + sessionStorage.mediaType + " ICON: " + sessionStorage.iconButton + " BUTTON: " + sessionStorage.mediaButton + " <-- " + sessionStorage.fileName);
		
		// set the media selectors
		if (sessionStorage.mediaButton != "") { // update the text
			if (sessionStorage.fileName != '') { // Display selected file
				var ext = sessionStorage.fileName.substr(-4);
				if ((ext == ".mp3") || (ext == ".wav")) { // strip the file extension from sound files
					$("#" + sessionStorage.mediaButton).children('.ui-btn-inner').children('.ui-btn-text').text(sessionStorage.fileName.slice(0, -4)); // don't save sound file extensions
					$("#" + sessionStorage.mediaButton).text(sessionStorage.fileName.slice(0, -4)); // this extra step is need to cover the response editor and any other situations that do not have jquery mobile button markup.
				} else {
					$("#" + sessionStorage.mediaButton).children('.ui-btn-inner').children('.ui-btn-text').text(sessionStorage.fileName);
					//$("#" + sessionStorage.mediaButton).html(sessionStorage.fileName); // this extra step is need to cover the response editor and any other situations that do not have jquery mobile button markup.
				}
			} else { // Display None
				$("#" + sessionStorage.mediaButton).children('.ui-btn-inner').children('.ui-btn-text').text("None");
				$("#" + sessionStorage.mediaButton).html("None"); // this extra step is need to cover the response editor and any other situations that do not have jquery mobile button markup.
			}
		}
		
		if (sessionStorage.iconButton != "") { // update the icon (if any)
			$("#" + sessionStorage.iconButton).attr("src", "data/books/" + book.location + "/" + sessionStorage.fileName);
		}
		
		// trigger change if necessary and return to calling form
		if (sessionStorage.mediaForm == "imb_bookshelf_form" || sessionStorage.mediaForm == "imb_lexicon_object_form" || sessionStorage.mediaForm.substring(0,14) == "imb_state_form") { // if request came from forms that use data-binding
			if (sessionStorage.mediaForm.substring(0,14) == "imb_state_form") {
				$("." + sessionStorage.mediaForm.substring(0,14)).trigger('change'); // this is needed to trigger a change on a state form because they have unique ids by index number
			}
			else if (sessionStorage.mediaForm == "imb_lexicon_object_form") {
				$("#" + sessionStorage.mediaForm + " :input").trigger('change');
			}	
			else {
				$("#" + sessionStorage.mediaForm).trigger('change');  "#imb_lexicon_object_form :input"
			}	
		}
		history.go(-1);
		obj_group = $("#" + sessionStorage.mediaButton).attr('obj_group'); // gets the obj_group to be used in the image object editor, so that we know which display object to update.
		if (obj_group == undefined) {
			return;
		}
		update_confirmed_object(sessionStorage.mediaButton, obj_group); // update the display when the user has change the draggable or container image.
	});
	// process media rename
	//---------------------------------------------------------------------
	$(document).on(user_event, "#imb_media_rename_btn", function(e, ui) {
		if (sessionStorage.fileName == "") return; // nothing selected
		var book = book_list[book_list_idx];
		var new_file = prompt("New file name: ", sessionStorage.fileName);
		if (new_file != null && new_file != "") {	
			if (debug) console.log("Media Rename: " + sessionStorage.fileName + " to " + new_file);
			renameFile(book.location, sessionStorage.fileName, new_file);
		}
	});
	// process media delete
	//---------------------------------------------------------------------
	$(document).on(user_event, "#imb_media_delete_btn", function(e, ui) {
		if (sessionStorage.fileName == "") return; // nothing selected
		var book = book_list[book_list_idx];
		var old_file = confirm("Are you sure you want to delete " + sessionStorage.fileName + "?");
		if (old_file == true) {	
			if (debug) console.log("Media Delete: " + sessionStorage.fileName);
			deleteFile(book.location, sessionStorage.fileName);
		}
	});
	// process media upload
	//---------------------------------------------------------------------
	$(document).on(user_event, "#imb_media_upload_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var form = $(this).closest("form"); // parent form
		if (debug) console.log("Media Upload: " + $('#frm_uploaded', form).val());
		$('#frm_imb_dir', form).val(book.location); // set the form file directory target
		if (location.hostname == '') { // try to process a local book.txt
			process_book_file("book.txt");
		} else { // upload a remote file and process if (if action=refresh)
			uploadFile(form);
		}
	});
	
	// avatar selection button
	// --------------------------------------------------------------------
	$(document).on("change", "#char_name_select", function(e, ui) {
		// refresh the list of avatars when changing the selected character
		var list = $("#char_avatar_list");
		list.empty();
		var avatars = ["default.png"], names = ["User Avatar"];
		var char_index = $(this).val(), orig_char_index = $(this).val();
		// if we chose the default character, then get the page default
		if (!character_list.hasOwnProperty(char_index)) {
			var book = book_list[book_list_idx];
			var page = book.page_list[book.page_list_idx];
			char_index = page.char_idx;
			// in case the page has no default, give it a different name
			// than the user's even though it will look the same
			names = ["Default Avatar"];
		}
		// get the avatars and names for this character
		if (character_list.hasOwnProperty(char_index)) {
			avatars = character_list[char_index].avatar_list;
			names   = character_list[char_index].avatar_names;
		}
		$.each(avatars, function(index, ava) {
			var btn = $('<a href="./" data-rel="back" data-ajax="false"><img src="data/avatars/' + ava + '" class="avatar_selection"><p class="avatar_selection_label">' + names[index] + '</p></a>');
			btn.val(index)
				.on("click", function() {
					var form = $("#avatar_select_form");
					set_response_avatar(form.data("response"), orig_char_index, $(this).val(), form.data("category"));
				});
			var li = $('<li></li>').append(btn);
			list.append(li);
		});
	});
	$(document).on(user_event, ".imb_res_avatar_btn", function(e, ui) {
		var cat_id = $(this).attr("id").substring(9);
		var res_id = cat_id.substring(3);
		show_avatar_selection(res_id, $(this).data("character"), $(this).data("avatar"), cat_id.substring(0,3));
	});
	$(document).on(user_event, ".imb_state_avatar_btn", function(e, ui) {
		var cat_id = $(this).attr("id").substring(9);
		var res_id = cat_id.substring(5);
		show_avatar_selection(res_id, $(this).data("character"), $(this).data("avatar"), cat_id.substring(0,5));
	});
	
// CUSTOM GAME event handlers
	$(document).on(user_event, ".imb_custom_game_btn", function(e, ui) {
		imb_custom_game_dialog();
	});

	//Note: Unfinished
	$(document).on(user_event, "#imb_game_upload_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var form = $(this).closest("form"); // parent form
		if (debug) console.log("Game Upload: " + $('#game_frm_uploaded', form).val());
		$('#game_frm_imb_dir', form).val(book.location); // set the form file directory target
		if (location.hostname == '') { // try to process a local book.txt
			window.alert("Cannot upload game locally.");
		} else { // upload a remote file and process if (if action=refresh)
			upload_game_file(form);
		}
	});

// VISUAL event handlers
	// event listener for Image Object Editor button
	$(document).on(user_event, ".imb_image_object_editor_btn", function(e, ui) { // Transitions to Image Object Editor
		var idx = get_numbers($(e.currentTarget).attr('id')); // get the state_idx where Image_Object_Editor Button was click.  This uses the event object to extract the id of the form and then extract the number from the id.
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // current page
		var state = page.state_list[page.state_list_idx]; // current state
		page.state_list_idx = idx; // set the state index for future reference
		transition_to_image_object_editor();
	});
	// event listener for Visual Editor button
	$(document).on(user_event, ".imb_visual_editor_btn", function(e, ui) {	// existing bitmask transition responses editor
		var idx = get_numbers($(e.currentTarget).attr('id')); // get the state_idx where Image_Object_Editor Button was click.  This uses the event object to extract the id of the form and then extract the number 
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // current page
		var state = page.state_list[page.state_list_idx]; // current state
		state.transition_list_idx = idx // set the transition index for future reference
		$(this).closest(".imb_transition_collapsible").trigger("collapse"); // close this transition collapsible
		transition_bitmask_DD_page("existing");
	});
// RESPONSE event handlers
	//Transition to response editor	
	/*
	$(document).on(user_event, "#imb_response_editor_btn", function(e, ui) {
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var state = page.state_list[page.state_list_idx]; // current state
		var transition = state.transition_list[state.transition_list_idx]; // current transition
		var responses = transition.response_list;
		
		$(this).closest(".imb_transition_collapsible").trigger("collapse"); //Close this transition collapsible
		
		//Navigate to new page
		$.mobile.changePage("#generate-text-responses", {transition: "pop"});
		
		//Update the header
		$("#response_editor_header_title").html('Response Editor - ' + imb_transition_label(transition.type) + ' transition (' + (state.transition_list_idx + 1) + ')');
		
		//Run page setup
		setup_page(transition, responses);
	}); */

	//Use forward sentence generator
	$(document).on(user_event, "#imb_response_generate_txt_list_btn", function(e, ui) {				
		//Get a handle on the data structure and empty the response list
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var state = page.state_list[page.state_list_idx]; // current state
		var transition = state.transition_list[state.transition_list_idx]; // current transition
		var wordList = state.lexicon.word_list; //word list
					
		run_generator(wordList);
	});
				
	//Permute responses
	$(document).on(user_event, "#imb_response_permute_btn", function(){
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var state = page.state_list[page.state_list_idx]; // current state
		var transition = state.transition_list[state.transition_list_idx]; // current transition
		var wordList = state.lexicon.word_list;
					
		run_permuter(wordList);
	});

	//Handle sort button clicks
	$(document).on("click", "#imb_gen_response_list_header button", function(){
		var id = $(this).attr("id");
				
		var category = id.substring(0, id.length-5);
					
		set_sort_respon_list(category);
	});
				
	//Handle page filtering
	$(document).on("change", "#r_page_select", function(){
		filter_respon_pages();
	});
	
	//Handle response type changes (enable object)
	/*
	$(document).on("change", ".gen_select_list", function(){
		check_enable_object($(this));
	});*/
				
	//Auto filter length
	$('#max_resp_length, #min_resp_length').each(function() {
		var elem = $(this);

		// Save current value of element
		elem.data('oldVal', elem.val());

		// Look for changes in the value
		elem.bind("propertychange keyup input paste", function(event){
			// If value has changed...
			if (elem.data('oldVal') != elem.val()) {
				// Updated stored value
				elem.data('oldVal', elem.val());
			
				// Do action
				filter_respon_list();
			 }
		});
	});
});

$(window).load(function() { // content loaded
	//play('welcome');
	$.ajaxSetup({async:false}); // ----------------------------------------------------------------------- FORCE SYNCHRONOUS AJAX CALLS!
	// if not served by imapbook server then bypass login screen and serve content locally
	if (location.hostname == '') {
		// skip login/registration
		load_bookshelf();
	}
});
// unlock any book currently being edited when we leave
// -----------------------------------------------------------------
$(window).on("beforeunload", function(e) {
	if ((book_list_idx > -1) && (book_list_idx < book_list.length)) {
		imb_lock_book(book_list[book_list_idx].book_id, false);
	}
});