/* iMapBook Authoring Tool
 * iMapBook LLC
 * All Rights Reserved
 * 04/08/2014
 * 
 * Version 2.5
 */

//------------------------------------------------------------------- load bookshelf
function load_bookshelf() {
	if (book_list_idx < 0) { // load bookshelf content if no pages have been visited (should only happen once)
		$("#imb_bookshelf_info").html(display_name + " editing " + bookshelf_file);
		imb_load_bookshelf_content(null);
		imb_load_characters();
		// add the books to the bookshelf
		$("#imb_book_list").empty();
		$.each(book_list, function(idx, book) {
			insert_cover(idx, 1);
		});
	} 
	$.mobile.changePage("#bookshelf", { transition: "flip", reverse: true});
}
//-------------------------------------------------------------------- load book
function load_book(idx) {
	var book = book_list[idx];
	if (debug) console.log("load_book:" + idx + "/" + book.location);
	
	// if someone else is already editing this book, don't load it and just
	// show the error message instead
	var current_editor = imb_lock_book(book.book_id, true);
	if (current_editor != '') {
		var msg = (current_editor != 'error')
			? ("That book is already being edited by " + current_editor + ". Try again later.")
			: "Unable to open book. Try again later.";

		$("#popupMessage").find("p").html(msg);
		$("#popupMessage").popup("open");
		return;
	}
	// if no one's using it, keep it locked every 5 minutes
	else {
		if (book_lock_timer != 0) {
			window.clearInterval(book_lock_timer);
		}
		book_lock_timer = window.setInterval(function(){
			imb_lock_book(book.book_id, true);
		}, 1000*60*5);
	}
	
	if (book.page_list.length == 0) { // load pages for this book if they haven't been loaded yet
		imb_load_book_content(book.location);
	}
	
	$("#imb_book_info").html(book.title); // set the title
	
	$('#imb_registry_variable_list').empty();
	$.each(book.registry, function(idx, variable) {
		insert_registry_variable(idx, 1);
	});
	$('#imb_registry_variable_list').trigger('create');
	
	$('#imb_dictionary_definition_list').empty();
	$.each(book.definition_list, function(idx, definition) {
		insert_dictionary_definition(idx, 1);
	});
	$('#imb_dictionary_definition_list').trigger('create');
	
	load_discussion_topics(idx);
	
	$('#imb_page_list').empty();
	$.each(book.page_list, function(idx, page) {
		insert_page(idx, 1);
	});
	$('#imb_page_list').trigger('create');
	
	$.mobile.changePage("#book", { transition: "pop"});
}
//------------------------------------------------------------------------ add topics to UI
function load_discussion_topics(bidx) {
	var book = book_list[bidx];
	$('#imb_discussion_topic_list').empty();
	$.each(book.discussion_list, function(idx, discussion) {
		insert_discussion_topic(idx, 1);
	});
	$('#imb_discussion_topic_list').trigger('create');
}
//------------------------------------------------------------------------------------- new insertion functions
// new book cover - into bookshelf
// --------------------------------
function insert_cover(idx, place) {
	var book = book_list[idx];
	var book_record = '<div data-role="collapsible" data-collapsed="true" id="imb_book_list_item' + idx + '" class="imb_bookshelf_collapsible" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d"><h3><div class="imb_bookshelf_book_title">' + book.title + ' [ID:' + book.book_id + ']</div></h3>' +
		'<div class="ui-bar-b">' +
			'<a href="#" data-role="button" data-theme="a" data-inline="true" data-mini="true" class="imb_media_btn">Upload Files</a>' +
			'<a href="#" data-role="button" data-theme="a" data-inline="true" data-mini="true" class="imb_editor_btn">Edit Book</a>' +
		'</div>' +
	'</div>';
	if (place > 0) {
		$("#imb_book_list").append(book_record);
	} else {
		$("#imb_book_list").prepend(book_record);
	} 
	
	// code refreshes the JQuery UI elements, if it exists call refresh, if not create a binding which does the necessary painting
	if ( $('#imb_book_list').hasClass('ui-listview')) 
	{
		$('#imb_book_list').listview('refresh');
	}
	else 
	{
		$('#imb_book_list').trigger('create');
	}

}
// new word definition - into dictionary
// ------------------------------
function insert_dictionary_definition(idx, place) {
	var book = book_list[book_list_idx];
	var definition = book.definition_list[idx];
	var definition_record = '<div data-role="collapsible" data-collapsed="true" class="imb_dictionary_definition_collapsible" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d"><h3><div class="yellow_definition">' + definition.word + '</div></h3></div>';
	if (place > 0) {
		$("#imb_dictionary_definition_list").append(definition_record);
	} else {
		$("#imb_dictionary_definition_list").prepend(definition_record);
	} 
}
// new variable - into registry
// ------------------------------
function insert_registry_variable(idx, place) {
	var book = book_list[book_list_idx];
	var variable = book.registry[idx];
	var variable_record = '<div data-role="collapsible" data-collapsed="true" class="imb_registry_variable_collapsible" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d"><h3><div class="yellow_definition">' + variable.name + '</div></h3></div>';
	if (place > 0) {
		$("#imb_registry_variable_list").append(variable_record);
	} else {
		$("#imb_registry_variable_list").prepend(variable_record);
	} 
}
// new discussion topic - into the corresponding list
// ------------------------------
function insert_discussion_topic(idx, place) {
	var book = book_list[book_list_idx];
	var topic = book.discussion_list[idx];
	var topic_record = '<div data-role="collapsible" data-collapsed="true" class="imb_discussion_topic_collapsible" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d"><h3><div class="yellow_definition">' + topic.name + '</div></h3></div>';
	if (place > 0) {
		$("#imb_discussion_topic_list").append(topic_record);
	} else {
		$("#imb_discussion_topic_list").prepend(topic_record);
	} 
}
// new page - into book based on type
// -------------------------------
function insert_page(idx, place) {
	var book = book_list[book_list_idx];
	var page = book.page_list[idx];
	var page_record = '<div data-role="collapsible" data-collapsed="true" id="imb_page_list_item' + idx +'" class="imb_page_collapsible" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d"><h3><div class="imb_page_title">Page ' + (idx + 1) + ' ( ' + imb_page_type_name(page.type) + ' ) ' + page.chapter_number + '</div>'+
	'</h3></div>';
	if (place > 0) {
		$("#imb_page_list").append(page_record);
	} else {
		$("#imb_page_list").prepend(page_record);
	} 
}
// new state - into page
// -------------------------
function insert_state(idx, place) {
	var book = book_list[book_list_idx];
	var page = book.page_list[book.page_list_idx];
	var state = page.state_list[idx];
	var state_record = '<div data-role="collapsible" data-mini="true" data-collapsed="true" id="imb_state_list_item' + idx + '" class="imb_state_collapsible" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d"><h3><div class="yellow_state">State ' + (idx + 1) + '</div></h3></div>';
	if (place > 0) {
		$("#imb_state_list").append(state_record);
	} else {
		$("#imb_state_list").prepend(state_record);
	}
}
// new state into state machine
// -------------------------
function insert_state_machine(idx, left_pos, top_pos) {
	var book = book_list[book_list_idx];
	var page = book.page_list[book.page_list_idx];
	var state = page.state_list[idx];
	var state_machine_state = '<div class="w" id="imb_state_machine_state' + idx + '" style="left: ' + left_pos + '%; top: ' + top_pos + '%;" ><div id="state_label_cont' + idx + '" class="state_label_cont">';
	state_machine_state += state.label + ' (' + (idx + 1) + ')' ;	
	state_machine_state += '</div><div id="state_ep' + idx + '" class="ep"></div></div>'
	$("#statemachine-demo").append(state_machine_state);
	$('#imb_state_machine_state' + idx).resizable({
	stop: function( event, ui ) {
						/* ********************************************************    TO DO - IF WE ADD A HEIGHT AND WIDTH ATTRIBUTE TO THE STATE OBJECT, WE WILL BE ABLE TO SAVE THE SIZE AFTER THE USER RESIZES.
						idx = get_numbers($(this).attr("id"));
					    box_height = ui.size.height;
					    box_width = ui.size.width;
						left_bound = ui.position.left;
						top_bound = ui.position.top;						
						current_img_height = $("#imb_game_display_image_visual_tool").height();	
						current_img_width = $("#imb_game_display_image_visual_tool").width();
						box_height_percent =  (box_height / current_img_height) * 100;
						box_width_percent =  (box_width / current_img_width) * 100;	
						yloc_percent = ((top_bound) / current_img_height) * 100;	
						xloc_percent = ((left_bound) / current_img_width) * 100;						
						$('#w_per' + idx).val(box_width_percent);
						$('#h_per' + idx).val(box_height_percent);
						$('#x_per' + idx).val(xloc_percent);
						$('#y_per'+ idx).val(yloc_percent);
						imb_save_flag(2,1);
						*/
						instance.repaintEverything();						
				}
	});
}
// new lexicon word - into lexicon
// --------------------------------
function insert_lexicon_word(idx, place) {
	var book = book_list[book_list_idx];
	var page = book.page_list[book.page_list_idx];
	var state = page.state_list[page.state_list_idx];
	var lexicon = state.lexicon.word_list[idx];
	var lexicon_word = '<div data-role="collapsible" data-mini="true" data-collapsed="true" id="imb_lexicon_item' + idx +'" class="imb_lexicon_collapsible" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d"><h3><div class="lexicon_word_label ' + imb_type_color(lexicon.type, 'color') + '">' + ((lexicon.word == "") ? imb_type_color(lexicon.type, 'label') : lexicon.word) + '</div></h3></div>';
	if (place > 0) {
		$("#imb_lexicon_list").append(lexicon_word);
	} else {
		$("#imb_lexicon_list").prepend(lexicon_word);
	}
}
// new transition - into state
// ------------------------------
function insert_transition(idx, place) {
	var book = book_list[book_list_idx];
	var page = book.page_list[book.page_list_idx];
	var state = page.state_list[page.state_list_idx];
	if (state.transition_list[idx].type == 4) { // RANDOM transition
		var transition = '<div data-role="collapsible" data-mini="true" data-collapsed="true" id="imb_transition_item' + idx +'" class="imb_transition_collapsible" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d"><h3><div class="green_transition">' + imb_transition_label(state.transition_list[idx].type) + ' ( Possibilities: ' + state.transition_list[idx].trigger + ', Starting from: ' + (parseInt(state.transition_list[idx].next_state_idx) + 1) + ' )</div></h3></div>';
	} else if (state.transition_list[idx].type == 5) { // BITMASK transition 
		var transition = '<div data-role="collapsible" data-mini="true" data-collapsed="true" id="imb_transition_item' + idx +'" class="imb_transition_collapsible" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d"><h3><div class="green_transition">' + imb_transition_label(state.transition_list[idx].type) + ' ( Transition to: ' + (parseInt(state.transition_list[idx].next_state_idx) + 1) + ' )</div></h3></div>';
	} else {
		var transition = '<div data-role="collapsible" data-mini="true" data-collapsed="true" id="imb_transition_item' + idx +'" class="imb_transition_collapsible" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d"><h3><div class="green_transition">' + imb_transition_label(state.transition_list[idx].type) + ' ( Trigger on: ' + state.transition_list[idx].trigger + ', Transition to: ' + (parseInt(state.transition_list[idx].next_state_idx) + 1) + ' )</div></h3></div>';
	}
	if (place > 0) {
		$("#imb_transition_list").append(transition);
	} else {
		$("#imb_transition_list").prepend(transition);
	}
}

// CF: character names
// ---------------------
function cf_character_options(selected_idx) {
	var cf = '<option value="0"' + ((selected_idx == 0) ? ' selected' : '') + '>None</value>';
	$.each(character_list, function(id, c){
		cf += '<option value="' + id + '"' + ((selected_idx == id) ? ' selected' : '') + '>' + c.name + '</value>';
	});
	return cf;
}

//--------------------------------------------------------------------- Collapsible Form (CF) functions
// CF: cover
// ---------------------
function cf_cover(idx) {
	var book = book_list[idx];
	var cf = '<div id="cf_cover">' +
		'<form id="imb_bookshelf_form">' +
			// ---------------------------------------------------- icon image | icon | location
			'<div class="ui-grid-b">' +
				'<div class="ui-block-a">' +
					'<div data-role="controlgroup" data-type="horizontal">' +
						'<img src="data/books/' + book.location + '/' + book.icon + '" id="imb_cover_icon" width=50px height=50px />' +
					'</div>' +
				'</div>' +
				'<div class="ui-block-b">' +
					'<div class="imb_form_label">' +
						'<label for="imb_cover_image">Icon</label>' +
						'<a href="#" data-role="button" data-mini="true" id="imb_cover_image" name="imb_cover_image" class="imb_media_btn">' + ((book.icon == "") ? "None" : book.icon) + '</a>' +
					'</div>' +
				'</div>' +
				'<div class="ui-block-c">' +
					'<div class="imb_form_label">' +
						'<label for="nlocation">Location</label>' +
						'<input id="nlocation" name="nlocation" type="text" disabled="disabled" value="' + book.location + '"/>' +
					'</div>' +
				'</div>' +
			'</div>' +
			// ---------------------------------------------------- author | title | cover sound
			'<div class="ui-grid-b">' +
				'<div class="ui-block-a">' +
					'<div class="imb_form_label">' +
						'<label for="nauthor">Author</label>' +
						'<input id="nauthor" name="nauthor" type="text" value="' + book.author + '"/>' +
					'</div>' +
				'</div>' +
				'<div class="ui-block-b">' +
					'<div class="imb_form_label">' +
						'<label for="ntitle">Title</label>' +
						'<input id="ntitle" name="ntitle" type="text" value="' + book.title + '"/>' +
					'</div>' +
				'</div>' +
				'<div class="ui-block-c">' +
					'<div class="imb_form_label">' +
						'<label for="imb_cover_sound">Cover Sound</label>' +
						'<a href="#" data-role="button" data-mini="true" id="imb_cover_sound" name="imb_cover_sound" class="imb_media_btn">' + ((book.sound == "") ? "None" : book.sound) + '</a>' +
					'</div>' +
				'</div>' +
			'</div>' +
			// ---------------------------------------------------- language | voice | NLP model | NLP filename
			'<div class="ui-grid-c">' +
				'<div class="ui-block-a">' +
					'<div class="imb_form_label">' +
						'<label for="nlanguage">Language</label>' +
						'<select data-theme="a" data-mini="true" data-native-menu="false" id="nlanguage" name="nlanguage">' +
							'<option value="en" ' + ((book.language == "en") ? "selected" : "") + '>English</value>' +
							'<option value="es" ' + ((book.language == "es") ? "selected" : "") + '>Spanish</value>' +
							'<option value="nl" ' + ((book.language == "nl") ? "selected" : "") + '>Dutch</value>' +
						'</select>' +
					'</div>' +
				'</div>' +
				'<div class="ui-block-b">' +
					'<div class="imb_form_label">' +
						'<label for="nvoice">TTS Voice</label>' +
						'<select data-theme="a" data-mini="true" data-native-menu="false" id="nvoice" name="nvoice">' +
							'<option value=" " ' + ((book.voice == " ") ? "selected" : "") + '>None</value>' +
							'<option value="-ven-us+f3 -s160 -z -a165 -p45 -l15 -gz" ' + ((book.voice == "-ven-us+f3 -s160 -z -a165 -p45 -l15 -gz") ? "selected" : "") + '>Female</value>' +
							'<option value="-ven-us+m3 -s160 -z -a165 -p45 -l15 -gz" ' + ((book.voice == "-ven-us+m3 -s160 -z -a165 -p45 -l15 -gz") ? "selected" : "") + '>Male</value>' +
							'<option value="-ven+whisper" ' + ((book.voice == "-ven+whisper") ? "selected" : "") + '>Whisper</value>' + 
						'</select>' +
					'</div>' +
				'</div>' +
				'<div class="ui-block-c">' +
					'<div class="imb_form_label">' +
						'<label for="nnlp_model">NLP Model</label>' +
						'<select data-theme="a" data-mini="true" data-native-menu="false" id="nnlp_model" name="nnlp_model">' +
							'<option value=" "'  + ((book.nlp_model == " ") ? "selected" : "") + '>none</value>' +
							'<option value="A" ' + ((book.nlp_model == "A") ? "selected" : "") + '>A</value>' +
							'<option value="B" ' + ((book.nlp_model == "B") ? "selected" : "") + '>B</value>' +
							'<option value="C" ' + ((book.nlp_model == "C") ? "selected" : "") + '>C</value>' +
						'</select>' +
					'</div>' +
				'</div>' +
				'<div class="ui-block-d">' +
					'<div class="imb_form_label">' +
						'<label for="nnlp_file">NLP File</label>' +
						'<input id="nnlp_file" name="nnlp_file" type="text" value="' + book.nlp_file + '"/>' +
					'</div>' +
				'</div>' +
			'</div>' +
			// ---------------------------------------------------- abstract
			'<div class="imb_textarea">' +
				'<label for="nabstract">Abstract</label>' +
				'<textarea name="nabstract" id="nabstract" class="textedit">' + book.abstract_text + '</textarea>' +
			'</div>' +
			// ---------------------------------------------------- reset | delete | update
			'<div class="ui-grid-a">' +
				'<div class="ui-block-a">' +
						 '<fieldset data-role="controlgroup" data-type="horizontal">' +
							'<label data-inline="true" for="nreset">Allow Book Resets</label>' +
							'<input data-theme="a" data-inline="true" data-mini="true" id="nreset" name="nreset" type="checkbox" ' + ((book.reset == "y") ? "checked=\"checked\"" : "") + '/>' +
							'<label data-inline="true" for="nreplay">Allow Game Replays</label>' +
							'<input data-theme="a" data-inline="true" data-mini="true" id="nreplay" name="nreplay" type="checkbox" ' + ((book.replay == "y") ? "checked=\"checked\"" : "") + '/>' +
						'</fieldset>' +	
				'</div>' +
				'<div class="ui-block-b imb_buttons_right">' +
					'<a href="#" data-role="button" data-theme="b" data-inline="true" data-mini="true" id="imb_bookshelf_delete_btn">Delete Cover</a>' +
				'</div>' +
			'</div>' +
		'</form>' +
	'</div>';

	return cf;
}
//CF: dictionary word
//----------------------------------
function cf_dictionary_definition(idx) {
	var book = book_list[book_list_idx];
	var definition = book.definition_list[idx];
	var cf = '<div id="cf_dictionary_definition">' +
	'<form id="imb_dictionary_form">' +
		'<div class="ui-grid-a">' +
			'<div class="ui-block-a">' +
				'<div class="imb_form_label">' +
					'<label for="nword">Dictionary Word</label>' +
					'<input data-mini="true" id="nword" name="nword" type="text" value="' + definition.word + '" />' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-b">' +
				'<div class="imb_form_label">' +
					'<label for="ntext">Word Definition</label>' +
					'<input data-mini="true" id="ntext" name="ntext" type="text" value="' + definition.text + '" />' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="ui-grid-solo">' +
			'<div class="ui-block-a imb_buttons_right">' +
				'<a href="#" data-role="button" data-theme="b" data-inline="true" data-mini="true" id="imb_dictionary_delete_btn">Delete Definition</a>' +
			'</div>' +
		'</div>' +
	'</form>' +
	'</div>';
	return cf;
}
// CF: Registry variable
// --------------------
function cf_registry_variable(idx) {
	var book = book_list[book_list_idx];
	var variable = book.registry[idx];
	var cf = '<div id="cf_registry_variable">' +
	'<form id="imb_registry_form">' +
		'<div class="ui-grid-d">' +
			'<div class="ui-block-a">' +
				'<div class="imb_form_label">' +
					'<label for="nname">Variable Name</label>' +
					'<input data-mini="true" id="nname" name="nname" type="text" value="' + variable.name + '" />' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-b">' +
				'<div class="imb_form_label">' +
					'<label for="nvalue">Value</label>' +
					'<input data-mini="true" id="nvalue" name="nvalue" type="text" value="' + variable.value + '" />' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-c">' +
				'<div class="imb_form_label">' +
					'<label for="nmin">Min</label>' +
					'<input data-mini="true" id="nmin" name="nmin" type="text" value="' + variable.min + '" />' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-d">' +
				'<div class="imb_form_label">' +
					'<label for="nmax">Max</label>' +
					'<input data-mini="true" id="nmax" name="nmax" type="text" value="' + variable.max + '" />' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-e">' +
				'<div class="imb_form_label">' +
					'<label for="nvariance">Variance</label>' +
					'<input data-mini="true" id="nvariance" name="nvariance" type="text" value="' + variable.variance + '" />' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="ui-grid-solo">' +
			'<div class="ui-block-a imb_buttons_right">' +
				'<a href="#" data-role="button" data-theme="b" data-inline="true" data-mini="true" id="imb_registry_delete_btn">Delete Variable</a>' +
			'</div>' +
		'</div>' +
	'</form>' +
	'</div>';
	return cf;
}
// CF: Discussion topic
// --------------------
function cf_discussion_topic(idx) {
	var book = book_list[book_list_idx];
	var topic = book.discussion_list[idx];
	var cf = '<div id="cf_discussion_topic">' +
	'<form id="imb_discussion_form">' +
		'<div class="ui-grid-b">' +
			'<div class="ui-block-a">' +
				'<div class="imb_form_label">' +
					'<label for="nname">Topic Name</label>' +
					'<input data-mini="true" id="nname" name="nname" type="text" value="' + topic.name + '" placeholder="Example: Solar System #1" />' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-b">' +
				'<div class="imb_form_label">' +
					'<label for="npage">Starting Page</label>' +
					'<input data-mini="true" id="npage" name="npage" type="range" min="2" max="' + book.page_list.length + '" value="' + (topic.page+1) + '" ' + (book.page_list.length < 2 ? 'disabled' : '') + '/>' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="imb_form_label">' +
			'<label for="nquestion">Discussion Question</label>' +
			'<input data-mini="true" id="nquestion" name="nquestion" type="text" value="' + topic.question + '" placeholder="Example: What would you need to travel into space?" />' +
		'</div>' +
		'<div class="ui-grid-solo">' +
			'<div class="ui-block-a imb_buttons_right">' +
				'<a href="#" data-role="button" data-theme="b" data-inline="true" data-mini="true" id="imb_discussion_delete_btn">Delete Topic</a>' +
			'</div>' +
		'</div>' +
	'</form>' +
	'</div>';
	return cf;
}
// CF: page by type
// --------------------
function cf_page(idx) {
	var book = book_list[book_list_idx];
	var page = book.page_list[idx];
	if (page.type == 1) { // TEXT PAGE
		var cf = '<div id="cf_page">' +
 		'<div data-role="popup" data-theme="e" id="popupPageText"><p>To link a WORD to a dictionary definition, you must wrap it with &#60;span class="defWord">WORD&#60;/span></p></div>' +
		'<form id="imb_page_form">' +
			'<div class="ui-grid-d">' +
				'<div class="ui-block-a">' +
					'<div class="imb_form_label">' +
						'<label for="nchapter">Chapter Label</label>' +
						'<input data-mini="true" id="nchapter" name="nchapter" type="text" value="' + page.chapter_number + '" />' +
					'</div>' +
				'</div>' +
				'<div class="ui-block-b imb_form_label">' +
					'<label for="nhidden">Hide Progress</label>' +
					'<select data-mini="true" name="nhidden" id="nhidden" data-role="slider">' +
						'<option value="n">No</option>' +
						'<option value="y"' + ((page.hidden == "y") ? "Selected" : "") + '>Yes</option>' +
					'</select>' +
				'</div>' +
				// ------------------------------------------------ page sound
				'<div class="ui-block-c">' +
					'<div class="imb_form_label">' +
						'<label for="imb_page_sound">Page Sound</label>' +
						'<a href="#" data-role="button" data-mini="true" id="imb_page_sound" name="imb_page_sound" class="imb_media_btn">' + ((page.state_list[0].sound == "") ? "None" : page.state_list[0].sound) + '</a>' +
					'</div>' +
				'</div>' +
                // ------------------------------------------------ navigation restrictions
                '<div class="ui-block-d">' +
					'<div class="imb_form_label">' +
						'<label for="nchapter">Time to Last Page (s)</label>' +
						'<input data-mini="true" id="ntimerlast" name="ntimerlast" type="text" value="' + page.timer_last + '" />' +
					'</div>' +
				'</div>' +				
                '<div class="ui-block-e">' +
					'<div class="imb_form_label">' +
						'<label for="nchapter">Time to Next Page (s)</label>' +
						'<input data-mini="true" id="ntimernext" name="ntimernext" type="text" value="' + page.timer_next + '" />' +
					'</div>' +
				'</div>' +               
			'</div>' +
			// ---------------------------------------------------- page text
			'<div class="imb_textarea">' +
				'<label for="ntext">Page Text <a href="#popupPageText" data-position-to="origin" data-role="button" data-rel="popup" data-inline="true" data-mini="true" data-iconshadow="true" data-shadows="true" data-corners="true" data-icon="imb_help_btn" data-theme="b" data-iconpos="notext">Help</a></label>' +
				'<textarea name="ntext" id="ntext" class="textedit">' + page.state_list[0].text + '</textarea>' +
			'</div>' +
			'<div class="ui-grid-solo">' +
				'<div class="ui-block-a imb_buttons_right">' +
					'<a href="#" data-role="button" data-theme="c" data-inline="true" data-mini="true" id="imb_page_copy_btn">Copy Page</a>' +
					'<a href="#" data-role="button" data-theme="b" data-inline="true" data-mini="true" id="imb_page_delete_btn">Delete Page</a>' +
				'</div>' +
			'</div>' +
		'</form>' +
		'</div>';
	} else { // GAMES
		var cf = '<div id="cf_page">' +
		'<form id="imb_page_form">' +
			'<div class="ui-grid-d">' +
				'<div class="ui-block-a">' +
					'<div class="imb_form_label">' +
						'<label for="nchapter">Chapter Label</label>' +
						'<input data-mini="true" id="nchapter" name="nchapter" type="text" value="' + page.chapter_number + '" />' +
					'</div>' +
				'</div>' +
				'<div class="ui-block-b imb_form_label">' +
					'<label for="nhidden">Hide Progress</label>' +
					'<select data-mini="true" name="nhidden" id="nhidden" data-role="slider">' +
						'<option value="n">No</option>' +
						'<option value="y"' + ((page.hidden == "y") ? "Selected" : "") + '>Yes</option>' +
					'</select>' +
				'</div>' +
				((page.type == 2) ?
				'<div class="ui-block-c imb_form_label">' +
					'<label for="ncharacter">Default Game Character</label>' +
					'<select data-theme="a" data-mini="true" data-native-menu="false" id="ncharacter" name="ncharacter">' +
						cf_character_options(page.char_idx) +
					'</select>' +
				'</div>' : "") +
                // ------------------------------------------------ navigation restrictions
                '<div class="ui-block-d">' +
					'<div class="imb_form_label">' +
						'<label for="nchapter">Time to Last Page (s)</label>' +
						'<input data-mini="true" id="ntimerlast" name="ntimerlast" type="text" value="' + page.timer_last + '" />' +
					'</div>' +
				'</div>' +
                '<div class="ui-block-e">' +
					'<div class="imb_form_label">' +
						'<label for="nchapter">Time to Next Page (s)</label>' +
						'<input data-mini="true" id="ntimernext" name="ntimernext" type="text" value="' + page.timer_next + '" />' +
					'</div>' +
				'</div>' +    
			'</div>' +
			'<div class="ui-grid-solo">' +
				'<div class="ui-block-a imb_buttons_right">' +
					'<a href="#" data-role="button" data-theme="e" data-inline="true" data-mini="true" id="imb_page_states_btn">State Machine</a>' +				
					'<a href="#" data-role="button" data-theme="c" data-inline="true" data-mini="true" id="imb_page_copy_btn">Copy Page</a>' +
					'<a href="#" data-role="button" data-theme="b" data-inline="true" data-mini="true" id="imb_page_delete_btn">Delete Page</a>' +
				'</div>' +
			'</div>' +
		'</form>' +
		'<a href="#" data-role="button" data-theme="a" data-inline="false" data-mini="true" data-icon="plus" id="imb_state_insert_btn" style="text-align: left">New State</a>' +
		'<div data-role="collapsible-set" data-inset="false" data-theme="b" id="imb_state_list">' +
		'</div></div>';
	}
	return cf;
}
// CF: state
// ---------------------
function cf_state(idx, only_state_form) {
	var book = book_list[book_list_idx];
	var page = book.page_list[book.page_list_idx];
	var state = page.state_list[idx];
	var cf = '<div id="cf_state">' +
	'<form id="imb_state_form' + idx + '" class="imb_state_form">' +
		'<div class="ui-grid-b">' +
			'<div class="ui-block-a">' +
				'<div data-role="controlgroup" data-type="horizontal">' +
					'<img src="data/books/' + book.location + '/' + state.image.file_name + '" id="imb_state_icon" width=100px height=100px />' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-b">' + 
				'<div class="imb_form_label">' +
					'<label for="imb_state_image">State Image</label>' +
					'<a href="#" data-role="button" data-mini="true" id="imb_state_image" name="imb_state_image" class="imb_media_btn">' + ((state.image.file_name == "") ? "None" : state.image.file_name) + '</a>' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-c imb_buttons_right">' +
					'<a href="#" data-role="button" data-theme="a" data-inline="true" data-mini="true" id="imb_custom_game_btn' + idx + '" class="imb_custom_game_btn">Custom Game: ' + ((state.url !== "") ? state.url.substring(11, state.url.indexOf("/scripts/run.js")) : "None") + '</a>' +
					'<a href="#" data-role="button" data-theme="a" data-inline="true" data-mini="true" id="imb_image_object_editor_btn' + idx + '" class="imb_image_object_editor_btn">Image Object Editor</a>' +
					'<a href="#" data-role="button" data-theme="c" data-inline="true" data-mini="true" id="imb_state_copy_btn">Copy State</a>' +
					'<a href="#" data-role="button" onclick="delete_state(' + idx + ');" data-theme="b" data-inline="true" data-mini="true" id="imb_state_delete_btn">Delete State</a>' +
			'</div>' +
		'</div>' +
		'<div class="ui-grid-c">' +
			'<div class="ui-block-a">' +
				'<div class="imb_form_label">' +
					'<label for="imb_state_sound">State Sound</label>' +
					'<a href="#" data-role="button" data-mini="true" id="imb_state_sound" name="imb_state_sound" class="imb_media_btn">' + ((state.sound == "") ? "None" : state.sound) + '</a>' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-b">' +
				'<div class="imb_form_label">' +
					'<label for="imb_char_state'+ idx +'">Character</label>' +
					'<a href="#" data-role="button" data-mini="true" class="imb_state_avatar_btn" id="imb_char_state'+ idx +'" data-character="' + state.char_idx + '" data-avatar="' + state.avatar_idx + '">' + avatar_name(state.char_idx, state.avatar_idx) + '</a>' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-c">' +
				'<div class="imb_form_label">' +
					'<label for="imb_state_label">State Label</label>' +
					'<input data-mini="true" id="imb_state_label" type="text" value="' + state.label + '" />' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-d">' +
				'<div class="imb_form_label">' +
					'<label for="imb_state_nlp">NLP Question</label>' +
					'<input data-mini="true" id="imb_state_nlp" type="text" value="' + state.nlp_name + '" />' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="ui-grid-solo">' +
			'<div class="ui-block-a">' +
				'<div class="imb_textarea">' +
					'<label for="ntext">State Text</label>' +
					'<textarea name="ntext" id="ntext" class="textedit">' + state.text + '</textarea>' +
				'</div>' +
			'</div>' +
		'</div>' +
	'</form>';
	// LEXICON
	if (page.type == 2 || page.type == 4) { // need lexicon
		cf += '<div data-role="collapsible" data-inset="false" data-theme="c" data-mini="true" data-collapsed="true" id="imb_lexicon" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d"><h3>Lexicon</h3>';
		cf += '<form id="imb_lexicon_form">' +
			'<div class="ui-grid-b">' +
				'<div class="ui-block-a">' +
					'<div class="imb_form_label">' +
						'<label for="nlexlabel">Lexicon Label</label>' +
						'<input data-mini="true" id="nlexlabel" name="nlexlabel" type="text" value="' + state.lexicon.label + '" />' +
					'</div>' +
				'</div>' +
				'<div class="ui-block-b">' +
					'<div class="imb_form_label">' +
						'<label for="nlexdir">Directions Text</label>' +
						'<input data-mini="true" id="nlexdir" name="nlexdir" type="text" value="' + state.lexicon.text + '" />' +
					'</div>' +
				'</div>' +
				'<div class="ui-block-c imb_form_label">' +
					'<div class="imb_form_label">' +
						'<label for="nlexerror">Match Error Text</label>' +
						'<input data-mini="true" id="nlexerror" name="nlexerror" type="text" value="' + state.lexicon.error + '" />' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</form>' +
		'<div data-role="collapsible" data-inset="false" data-theme="a" data-mini="true" data-collapsed="true" id="imb_lexicon_insert" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d"><h3>New Lexicon Object</h3>' +
			'<form>' +
				'<div class="ui-grid-c">' +
					'<div class="ui-block-a">' +
						'<div class="imb_form_label">' +
							'<label for="xwordtype">Input Object Type</label>' +
							'<select data-theme="a" data-inline="false" data-mini="true" data-native-menu="false" id="xwordtype" name="xwordtype">';
								for (var x = 0; x < color_matrix.length; x++) {
									cf += '<option class="' + color_matrix[x]['color'] + '" value="' + color_matrix[x]['id'] + '">' + color_matrix[x]['label'] + '</option>';
								}
							cf += '</select>' +
						'</div>' +
					'</div>' +
					'<div class="ui-block-b">' +
						'<div class="imb_form_label">' +
							'<label for="ximb_lexicon_sound">Input Object Sound</label>' +
							'<a href="#" data-role="button" data-mini="true" id="ximb_lexicon_sound" name="ximb_lexicon_sound" class="imb_media_btn">None</a>' +
						'</div>' +
					'</div>' +
					'<div class="ui-block-c">' +
						'<div class="imb_form_label">' +
							'<label for="ximb_lexicon_image">Input Object Icon</label>' +
							'<a href="#" data-role="button" data-mini="true" id="ximb_lexicon_image" name="ximb_lexicon_image" class="imb_media_btn">None</a>' +
						'</div>' +
					'</div>' +
					'<div class="ui-block-d">' +
						'<div class="imb_form_label">' +
							'<label for="xwordtext">Action Text</label>' +
							'<input data-mini="true" data-theme="e" id="xwordtext" name="xwordtext" type="text" value="" />' +
						'</div>' +
					'</div>' +
				'</div>' +
				'<div class="ui-grid-solo">' +
					'<div class="ui-block-a imb_buttons_right">' +
						'<a href="#" data-role="button" data-theme="e" data-inline="true" data-mini="true" id="imb_lexicon_insert_btn">Insert Lexicon Object</a>' +
					'</div>' +
				'</div>' +
			'</form>' +
		'</div>' +
		'<div data-role="collapsible-set" data-inset="false" data-theme="a" id="imb_lexicon_list">' +
		'</div></div>';
	}
	if (only_state_form) {//return only the form portion of the state editor and not the lexicon and transition collectibles.  This html will be used in the state machine popup with when the user clicks on a state.
		cf += '</div>'
		return cf;
	}
	// TRANSITIONS
	cf += '<div data-role="collapsible" data-inset="false" data-theme="d" data-mini="true" data-collapsed="true" id="imb_transitions" data-collapsed-icon="arrow-r" data-expanded-icon="arrow-d"><h3>Transitions</h3>' +
		'<div data-role="collapsible" data-theme="a" data-inline="false" data-mini="true"><h3>New Transition</h3>' +
			'<form>' +
				'<div class="ui-grid-a">' +
					'<div data-role="fieldcontain" class="ui-hide-label ui-block-a">' +
						'<div class="imb_form_label">' +
							'<label for="ntrancat">Page Type</label>' +
							'<select data-theme="a" data-inline="true" data-mini="true" data-native-menu="false" id="ntrancat" name="ntrancat">';
								for (var x = 1; x < 8; x++) {
									cf += '<option value="' + x + '">' + imb_transition_label(x.toString()) + '</option>';
								}
							cf += '</select>' +
						'</div>' +
					'</div>' +
					'<div class="ui-block-b imb_buttons_right">' +
						'<a href="#" data-role="button" data-theme="e" data-inline="true" data-mini="true" id="imb_transition_insert_btn">Insert Transition</a>' +
					'</div>' +
				'</div>' +
			'</form>' +
		'</div>' +
		'<div data-role="collapsible-set" data-inset="false" data-theme="b" id="imb_transition_list">' +
		'</div></div>';
	return cf;
}
// CF: lexicon word by type
//----------------------------------
function cf_lexicon_word(idx) {
	var book = book_list[book_list_idx];
	var page = book.page_list[book.page_list_idx];
	var state = page.state_list[page.state_list_idx];
	var lexicon = state.lexicon.word_list[idx];
	var cf = '<div id="cf_lexicon_word">' +
	'<form id="imb_lexicon_object_form">' +
		'<div class="ui-grid-c">' +
			'<div class="ui-block-a">' +
				'<div class="imb_form_label">' +
					'<label for="nwordtype">Input Object Type</label>' +
					'<select data-theme="a" data-inline="false" data-mini="true" data-native-menu="false" id="nwordtype" name="nwordtype">';
						for (var x = 0; x < color_matrix.length; x++) {
							cf += '<option class="' + color_matrix[x]['color'] + '" value="' + color_matrix[x]['id'] + '" ' + ((lexicon.type == color_matrix[x]['id']) ? "selected" : "") + '>' + color_matrix[x]['label'] + '</option>';
						}
					cf += '</select>' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-b">' +
				'<div class="imb_form_label">' +
					'<label for="imb_lexicon_sound">Input Object Sound</label>' +
					'<a href="#" data-role="button" data-mini="true" id="imb_lexicon_sound" name="imb_lexicon_sound" class="imb_media_btn">' + ((lexicon.sound == "") ? "None" : lexicon.sound) + '</a>' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-c">' +
				'<div class="imb_form_label">' +
					'<label for="imb_lexicon_image">Input Object Icon</label>' +
					'<a href="#" data-role="button" data-mini="true" id="imb_lexicon_image" name="imb_lexicon_image" class="imb_media_btn">' + ((lexicon.icon == "") ? "None" : lexicon.icon) + '</a>' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-d">' +
				'<div class="imb_form_label">' +
					'<label for="nwordtext">Action Text</label>' +
					'<input data-mini="true" data-theme="e" id="nwordtext" name="nwordtext" type="text" value="' + lexicon.word + '" />' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="ui-grid-solo">' +
			'<div class="ui-block-a imb_buttons_right">' +
				'<a href="#" data-role="button" data-theme="c" data-inline="true" data-mini="true" id="imb_lexicon_copy_btn">Copy Lexicon Object</a>' +			
				'<a href="#" data-role="button" data-theme="b" data-inline="true" data-mini="true" id="imb_lexicon_delete_btn">Delete Lexicon Object</a>' +
			'</div>' +
		'</div>' +
	'</form>' +
	'</div>';
	return cf;
}
// CF: transition
//----------------------------------
function cf_transition(idx,state_idx) {
	var book = book_list[book_list_idx];
	var page = book.page_list[book.page_list_idx];
	if (state_idx != undefined) { //see if the second parameter is defined and if so, then use that as the state idx.  (this parameter will be defined in the state machine).
		var state = page.state_list[state_idx];
	}
	else {
		var state = page.state_list[page.state_list_idx];
		state_idx = page.state_list_idx;
	}	
	var transition = state.transition_list[idx];
	var cf = '<div id="cf_transition">' +
	'<form id="imb_transition_form' + idx + '" class="imb_transition_form">' +
		'<div class="ui-grid-c">' +
			'<div class="ui-block-a">' +
				'<div class="imb_form_label">';
					if (transition.type == 4) { // RANDOM transition
						cf += '<label for="ntrig">Random Possibilities</label>';
					} else {
						cf += '<label for="ntrig">Trigger Value</label>';
					}
					cf += '<input data-mini="true" id="ntrig" name="ntrig" type="text" value="' + transition.trigger + '" ';
						if (transition.type == 5) { // bitmask
							cf += "DISABLED ";
						}
					cf += '/>';
					if (transition.type == 6) {
						cf += '<label for="nvaridx">Variable Index</label>';
						cf += '<input data-mini="true" id="nvaridx" type="text" value="' + transition.variable_idx + '" />';
					}
				cf += '</div>' +
			'</div>' +
			'<div class="ui-block-b">' +
				'<div class="imb_form_label">';
					if (transition.type == 4) { // RANDOM transition
						cf += '<label for="ntrignext">Starting State Index</label>';
					} else {
						cf += '<label for="ntrignext">Next State Index</label>';
					}
					cf += '<select data-theme="a" data-inline="false" data-mini="true" data-native-menu="false" id="ntrignext" name="ntrignext">';
					for (var x = 0; x < page.state_list.length; x++) {
						cf += '<option value="' + x + '" ' + ((transition.next_state_idx == x) ? "selected" : "") + '>' + (x+1) + '</option>';
					}
					cf += '</select>' +
				'</div>' +
			'</div>' +
            '<div class="ui-block-c">' +
    			'<div class="imb_form_label">';
					cf += '<label for="ntrig">VPF Scenario ID</label>';
					cf += '<input data-mini="true" id="vpfid" name="vpfid" type="text" value="' + transition.scenario_id + '" ';
					cf += '/>';
                    cf += '</div>' +
			'</div>' +
			'<div class="ui-block-d imb_buttons_right">';
				if (transition.type == 1 || transition.type == 5) { // counter, bitmask
					cf += '<a href="#" data-role="button" data-theme="a" data-inline="true" data-mini="true" id="imb_visual_editor_btn' + idx + '" class="imb_visual_editor_btn">Visual Editor</a>';
				}
				if (transition.type == 1 || transition.type == 2 || transition.type == 5 || transition.type == 6 || transition.type == 7) { // counter, countdown, bitmask, variable, nlp
					cf += '<a href="#" data-role="button" onclick="transition_to_response_editor(' + state_idx + ', ' + idx + ');" data-theme="a" data-inline="true" data-mini="true" id="imb_response_editor_btn">Response Editior</a>';
				}
				cf += '<a href="#" data-role="button" data-theme="c" data-inline="true" data-mini="true" id="imb_transition_copy_btn">Copy Transition</a>' +
				'<a href="#" data-role="button" onclick="delete_transition(' + state_idx + ', ' + idx + ');" data-theme="b" data-inline="true" data-mini="true" id="imb_transition_delete_btn">Delete Transition</a>' +
			'</div>' +
		'</div>' +
	'</form>';
	cf += '</div>';
	return cf;
}

// --------------------------------------------------------------------------------------- file manager
function mediaContent(obj) {
	var book = book_list[book_list_idx]; // current book
	var dirloc = "data/books/" + book.location; // current book directory path
	var cursel = $("#" + sessionStorage.mediaButton).text(); // currently selected object (if any)
	if (debug) console.log("mediaContent: " + sessionStorage.mediaType + " SELECTED: " + cursel);

	if (obj == null) return;
	if (debug) console.log(obj);
	var ext;
	var content;
	var col = 0;
	
	// set the select to match the current mediaType
	$("#mediatype option").each(function() {
		if ($(this).val() == sessionStorage.mediaType) {
			$(this).attr('selected', true);
		} else {
			$(this).attr('selected', false);
		}
	});
		
	// clear the container first
	$("#container").empty();
	content = '<div class="ui-grid-a">';
	
	for (var i = 0; i < obj.length; i++) {
		col++;	
		if (col == 1 || col == 6) { // start the inner block-grid
			if (col == 1) { // start first inner column
				content += '<div class="ui-block-a"><div class="ui-grid-d">';
			} else { // start second inner column
				content += '<div class="ui-block-b"><div class="ui-grid-d">';
			}
			content += '<div class="ui-block-a">';
		} else if (col == 2 || col == 7) {
			content += '<div class="ui-block-b">';
		} else if (col == 3 || col == 8) {
			content += '<div class="ui-block-c">';
		} else if (col == 4 || col == 9) {
			content += '<div class="ui-block-d">';
		} else if (col == 5 || col == 10) {
			content += '<div class="ui-block-e">';
			if (col == 10) { // newline
				col = 0;
			}
		}
				
		ext = obj[i].substr(-4);
		
		if ((ext === ".jpg") || (ext === ".png") || (ext === "jpeg") || (ext === ".gif") || (ext === ".bmp")) { // image
			var img = new IMBImage();
			img.src = obj[i];
			content += "<div class='holder image-upload' file-source='" + img.src + "'>";
			content += "<img src='" + dirloc + "/" + img.src + "' /><br />";
			content += "<span class='name'>" + img.src + "</span><br />";
			content += "</div>";
		} else if ((ext === ".mp3") || (ext === ".wav")) { // audio
			content += "<div class='holder sound-upload' file-source='" + obj[i]+ "'>";
			content += "<audio controls>";
			content += "<source src='" + dirloc + "/" + obj[i]+"'>";
			content += "</audio><br /><br />";
			content += "<span class='name'>" + obj[i] + "</span>";
			content += "</div>";
		} else {
			content += "<div class='holder image-upload' file-source=''>";
			content += "<img src='data/icons/icon.png' /><br />";
			content += "<span class='name'>" + obj[i] + "</span>";
			content += "</div>";
		}
		content += '</div>'; // inner block
		
		if (col == 0 || col == 5) { // end the inner block-grid
			content += '</div></div>'; // inner block-grid
		}
	} 
	
	if (col != 0 && col != 5) { // left the loop before could end the inner block-grid
		content += '</div></div>'; // inner block-grid
	}
	
	content += '</div>'; // outer grid
	$("#container").append(content);
}
//--------------------- open the avatar selection form
function show_avatar_selection(response_id, char_id, avatar_id, category) {
	console.log("ID: " + response_id + ", Char: " + char_id + ", Avatar: " + avatar_id + ", Category: " + category);
	// clear and reload the character selection
	var list = $("#char_name_select");
	list.empty();
	list.append('<option value="0"' + ((char_id == "0") ? ' selected' : '') + '>Page Default</option>');
	list.append('<option value="-1"' + ((char_id == "-1") ? ' selected' : '') + '>User Avatar</option>');
	$.each(character_list, function(id, c) {
		list.append('<option value="' + id + '"' + ((char_id == id) ? ' selected' : '') + '>' + c.name + '</option>');
	});
	// show the form
	$("#avatar_select_form").data("response", response_id)
		.data("category", category);
	$.mobile.changePage("#avatar_select_form", {transition: "pop"});
	// update the shown avatars
	list.trigger("change");
}
//---------------------- convert avatar values into a string name
function avatar_name(char_id, avatar_id) {
	// the character and avatar exist
	if (character_list.hasOwnProperty(char_id)) {
		var c = character_list[char_id];
		if (c.avatar_list.hasOwnProperty(avatar_id)) {
			return c.name + ": " + c.avatar_names[avatar_id];
		}
		return c.name + ": " + c.avatar_names[c.default_avatar_idx];
	}
	// character does not exist, so we're likely dealing with special cases
	if (char_id == 0) {
		return "Default";
	}
	else if (char_id == -1) {
		return "User Avatar";
	}
	else {
		return "None";
	}
}
//---------------------- saves the changes made to the characters for a response
function set_response_avatar(response_id, char_id, avatar_id, category) {
	var btn = $("#imb_char_" + category + response_id);
	if (btn.length > 0) {
		// the state changes need to be saved directly
		if (category == 'state') {
			var book  = book_list[book_list_idx];
			var state = book.page_list[book.page_list_idx].state_list[response_id];
			state.char_idx = Number(char_id);
			state.avatar_idx = Number(avatar_id);
			imb_save_flag(2,1);
		}
		// response changes are saved only once the player accepts the changes
		else {
			btn.data("character", char_id)
				.data("avatar", avatar_id)
				.text(avatar_name(char_id, avatar_id));
		}
	}
}

// --------------------------------------------------------------------------------------- common editor functions
// BITERNATOR takes a transition and sets all positive response.bits that are non-zero to bitwise values then attempts to do the same to their negations.
// It also sets the transtion.trigger to the sum of all bits.
function biternator(transition) {
	var trigger = 1;
	$.each(transition.response_list, function(idx, response) { // for each response in this transition
		if (response.type == 1 && response.bits > 0) { // process positive response with a non-zero bits
			var words = response.text_input.split(" "); // break response into a word array
			response.bits = trigger; // ------------------------------------------------------------  set response.bits
			// now attempt so set any negation bits
			for (var x = 1; x < words.length; x++) { // for each marker word staring with the second one
				var negstr = "";
				for (var y = x; y < words.length; y++) { // append words from current marker till the end of the list
					negstr += words[y] + " ";
				}
				for (var z = 0; z < x; z++) { // append words from start up to the current marker
					negstr += words[z] + " ";
				}
				negstr = negstr.trim(); // trim any whitespaces
				$.each(transition.response_list, function(idx, invres) { // for each response
					if (invres.type == 2 && invres.text_input == negstr) { // try to match against negative responses
						invres.bits = trigger; // ------------------- set response.bits on a matching negative response
					}
				});
			}
			trigger = trigger << 1; // set the next trigger value
		}
	});
	transition.trigger = trigger - 1; // --------------------------------- set transition trigger to the sum of all bits
}

// --------------------------------------------------------------------------------------- helper functions
function imb_save_flag(type, value) {
	if (debug) console.log("imb_save_flag: type=" + type + " value=" + value);
	switch (type) {
		case 1:
			if (value == 0) {
				$("#imb_bookshelf_save_btn").buttonMarkup({theme: 'd'});
			} else {
				$("#imb_bookshelf_save_btn").buttonMarkup({theme: 'e'});
			}
		break;
		case 2:
			if (value == 0) {
				$("#imb_book_save_btn").buttonMarkup({theme: 'd'});
				$("#imb_book_save_btn_SME").buttonMarkup({theme: 'd'});
			} else {
				$("#imb_book_save_btn").buttonMarkup({theme: 'e'});
				$("#imb_book_save_btn_SME").buttonMarkup({theme: 'e'});
			}
		break;
	}
}

// simply return the transition label by type
function imb_transition_label(type) {
	switch (type) {
		case "1":
			return "Counter";
		break;
		case "2":
			return "Countdown";
		break;
		case "3":
			return "Timer";
		break;
		case "4":
			return "Random";
		break;
		case "5":
			return "Bitmask";
		break;
		case "6":
			return "Variable";
		break;
		case "7":
			return "NLP Matching";
		break;
		default:
			return "unknown";
		break;
	}
}

// simple function to return browser flavor - may have to be adjusted later
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
// webkit browser don't handle onClick very well (or timely)
function get_user_event(browser) {
	if (browser == "mobile") {
		return "touchstart";
	} else {
		return "click";
	}
}

// process book file parse request
function process_book_file(filename) {
	var book = book_list[book_list_idx]; // current book
	var bookpath = "data/books/" + book.location + "/" + filename;
	var pcnt = imb_refresh_pages(book_list_idx, bookpath);
	// rebuild the page display
	$('#imb_page_list').empty();
	$.each(book.page_list, function(idx, page) {
		insert_page(idx, 1);
	});
	$('#imb_page_list').trigger('create');
	imb_save_flag(2,1);
	history.go(-1); // exit the form dialog
	window.alert(pcnt + " pages refreshed.");
}

// function needed to perform a deep (recursive) copy for arrays and objects.  Used when user wants to copy one of the data structures (page, state, transition...etc.)
function deepObjCopy (dupeObj) {
	var retObj = new Object();
	if (typeof(dupeObj) == 'object') {
		if (typeof(dupeObj.length) != 'undefined')
			var retObj = new Array();
		for (var objInd in dupeObj) {	
			if (typeof(dupeObj[objInd]) == 'object') {
				retObj[objInd] = deepObjCopy(dupeObj[objInd]);
			} else if (typeof(dupeObj[objInd]) == 'string') {
				retObj[objInd] = dupeObj[objInd];
			} else if (typeof(dupeObj[objInd]) == 'number') {
				retObj[objInd] = dupeObj[objInd];
			} else if (typeof(dupeObj[objInd]) == 'boolean') {
				((dupeObj[objInd] == true) ? retObj[objInd] = true : retObj[objInd] = false);
			}
		}
	}
	return retObj;
}

// centers browser viewpoint to any element that is passed to this function.  Of course if there is no scrolling, then it will only center as much as possible
function center_viewport(element){
    var $this = element;
    var posY = $this.offset().top;
    var $thisHeight = $this.outerHeight();
    var windowHeight = $(window).height();
    var scrollPos = posY - windowHeight/2 + $thisHeight/2;
    $('html, body').animate({scrollTop: scrollPos}, 200);
}

// converts any string to XML compliant by replacing certain illegal characters that cause the final XML file to be "not well formed"
function cleanXML(str) {
	if(str == undefined){
		console.log("Warning, The string that was passed to the CleanXML function was undefined");
		return undefined;
	}
	var truestring = str.toString();
	var clean1 = truestring.replace(/&/g,"&amp;");
	var clean2 = clean1.replace(/</g,"&lt;");
	var clean3 = clean2.replace(/>/g,"&gt;");
	var clean4 = clean3.replace(/"/g,"&quot;");
	var clean5 = clean4.replace(/'/g,"&apos;");
	return clean5;	
} 

var xt="",h3OK=1
function checkErrorXML(x)
{
xt=""
h3OK=1
checkXML(x)
}

function checkXML(n)
{
var l,i,nam
nam=n.nodeName
if (nam=="h3")
	{
	if (h3OK==0)
		{
		return;
		}
	h3OK=0
	}
if (nam=="#text")
	{
	xt=xt + n.nodeValue + "\n"
	}
l=n.childNodes.length
for (i=0;i<l;i++)
	{
	checkXML(n.childNodes[i])
	}
}

function loadXMLDocErr(dname, fileurl) {
		//Internet Explorer
		if (window.ActiveXObject) {
			var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async=false;
			xmlDoc.loadXML(dname);
			if (xmlDoc.parseError.errorCode!=0) {
				txt="Error Code: " + xmlDoc.parseError.errorCode + "\n";
				txt=txt+"Error Reason: " + xmlDoc.parseError.reason;
				txt=txt+"Error Line: " + xmlDoc.parseError.line;
				alert(txt + "\nXML file's URL is " + fileurl);
			}	
			else {
				//alert("No errors found");
			}
		}	
		//Firefox
		else if (document.implementation && document.implementation.createDocument) {
				var parser=new DOMParser();
				var text=dname;
				var xmlDoc=parser.parseFromString(text,"text/xml");
				if (xmlDoc.getElementsByTagName("parsererror").length>0) {
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
// tests if number is odd.  Returns True if odd.
function isOdd(num) { 
	return num % 2;
}
// ------------------------------------------------------------------------ auxilary functions to get around webkit limitations <-- cubiq.org
function NoClickDelay(el) {
	this.element = el;
	if( window.Touch ) this.element.addEventListener('touchstart', this, false);
}
NoClickDelay.prototype = {
	handleEvent: function(e) {
		switch(e.type) {
			case 'touchstart': this.onTouchStart(e); break;
			case 'touchmove': this.onTouchMove(e); break;
			case 'touchend': this.onTouchEnd(e); break;
		}
	},

	onTouchStart: function(e) {
		e.preventDefault();
		this.moved = false;

		this.element.addEventListener('touchmove', this, false);
		this.element.addEventListener('touchend', this, false);
	},

	onTouchMove: function(e) {
		this.moved = true;
	},

	onTouchEnd: function(e) {
		this.element.removeEventListener('touchmove', this, false);
		this.element.removeEventListener('touchend', this, false);

		if( !this.moved ) {
			// Place your code here or use the click simulation below
			var theTarget = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
			if(theTarget.nodeType == 3) theTarget = theTarget.parentNode;

			var theEvent = document.createEvent('MouseEvents');
			theEvent.initEvent('click', true, true);
			theTarget.dispatchEvent(theEvent);
		}
	}
};

function imb_custom_game_dialog() {
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // current page
	var state = page.state_list[page.state_list_idx]; // current state

	var gameList = imb_get_game_list();

	var gameHtml = "";

	if (gameList.length === 0) {
		window.alert("No games found.");
	}
	else {
		gameHtml = '<br /><br />Or select a game:<select data-theme="a" data-inline="false" data-mini="true" data-native-menu="false" id="gameSelectList" name="gameSelectList">';

		gameHtml += '<option value="None">None</option>';

		for (var i = 0; i < gameList.length; i++) {
			gameHtml += '<option value="' + gameList[i] + '">' + gameList[i] + '</option>';
		}

		gameHtml += '</select>';
	}

	var formBody = "Upload Game: " +
	"<form enctype='multipart/form-data' data-ajax='false'>" +
		"<input type='hidden' id='game_frm_action' name='action' value='game_upload' />" +
		"<input type='hidden' id='game_frm_imb_dir' name='imb_dir' value='' />" +
		"<input type='file' id='game_frm_uploaded' name='uploaded' />" +
		"<select id='imb_game_type' name='imb_game_type' data-theme='a' data-inline='false' data-mini='true' data-native-menu='false'>" +
			"<option value='None'>Select Type</option>" +
			"<option value='Construct 2'>Construct 2</option>" +
			"<option value='Storyline'>Storyline</option>" +
		"</select>" +
		"<input type='text' id='game_frm_name' name='name' value='Name' />" +
		"<a href='#' data-role='button' data-theme='e' id='imb_game_upload_btn'>Upload</a>" +
	"</form>" + gameHtml;

	jqm_alert("Add Custom Game", formBody, function() {
		state.url = ($("#gameSelectList").val() !== "None") ? "data/games/" + $("#gameSelectList").val() + "/scripts/run.js" : "";
		$(".imb_custom_game_btn .ui-btn-text").text("Custom Game: " + $("#gameSelectList").val());
	}, function() {

	}, "Submit", "Cancel");
}