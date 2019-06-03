/* iMapBook Authoring Tool - ajax functions
 * iMapBook LLC
 * All Rights Reserved
 * 04/08/2014
 * 
 * Version 2.5
 */

// process user login and password and decide which book library file to use
function imb_login(user, pass) {
	$.ajax({
        type: "GET",
		url: "utils/author/service.php",
		data: {
			action: "login",
			imb_user: user,
			imb_pass: pass
		},
		dataType: "json",
		async: false,
		success: function(jd) { // returns Json Data
			if (debug) console.log(jd);
			if (jd.status == 'error') {
				window.alert(jd.value);
			} else {
				bookshelf_file = jd.library; // use cohort's library file
				display_name = jd.user_name; // save user name
				if (debug) console.log(jd.books);
				load_bookshelf(jd.books);
			}
		},
		error: function () {
			window.alert("Unable to authenticate. Please try again later.");
		}
	});
}

// directory functions which return true if successful
function imb_book_directory(new_dir, new_dir_copy, dir_action) {
	var rv = false;
	if (location.hostname == '') {
		return false;
	}
	$.ajax({
        type: "POST",
		url: "utils/author/service.php",
		data: {
			action: dir_action,
			imb_dir: new_dir,
			imb_dir_copy: new_dir_copy
		},
		dataType: "json",
		async: false,
		success: function(jd) { // returns Json Data
			if (debug) console.log(jd);
			if (jd.status == 'error') {
				rv = false;
			} else {
				rv = true;
			}
		},
		error: function () {
			window.alert("Book directory [" + new_dir + "] " + directory_action + " failed!");
			rv = false;
		}
	});
	return rv;
}
// save bookshelf data to a file
function imb_save_bookshelf_content(bookshelf_file) {
	var xmldata = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<covers>\n';
	$.each(book_list, function() {
		xmldata += '	<cover book_id="' + $(this).attr('book_id') + '" location="' + $(this).attr('location') + '" author="' + cleanXML($(this).attr('author'))
		+ '" title="' + cleanXML($(this).attr('title')) + '" icon="' + cleanXML($(this).attr('icon')) + '" language="' + $(this).attr('language') 
		+ '" coloring="' + $(this).attr('color_theme') + '" voice="' + $(this).attr('voice') + '" sound="' + cleanXML($(this).attr('sound')) 
		+ '" reset="' + $(this).attr('reset') + '" replay="' + $(this).attr('replay') + '" modified="' + $(this).attr('modified')
		+ '" nlp_model="' + cleanXML($(this).attr('nlp_model').trim()) + '" nlp_file="' + cleanXML($(this).attr('nlp_file').trim())
		+ '"><![CDATA[' + $(this).attr('abstract_text') + ']]></cover>\n';
	});
	xmldata += "</covers>";
	console.log(xmldata);
	var bookshelf_file_path = "data/bookshelves/" + bookshelf_file;
	var bookshelfContainsBooks = xmldata.search("book_id"); // seach for book_id to make sure there is at least one book in the bookshelf.xml file.
	if (bookshelfContainsBooks > -1) { // if there is at least one book, then run it through the XML parser.
		loadXMLDocErr(xmldata, bookshelf_file_path); //run xmldata file through the XMLparser to see if there are any XML errors before saving.
	}
	else {	// if no books were found, then alert the user and do not save or POST XML bookshelf file.
		alert("No books were found in the bookshelf XML file. Bookshelf will not be saved.")
		return;
	}
	if (location.hostname == '') {
		window.alert(xmldata);
		return;
	}
	
	$.ajax({
        type: "POST",
		url: "utils/author/service.php",
		data: {
			action: "savebookshelf",
			imb_dir: "data/bookshelves",
			imb_file: bookshelf_file,
			imb_data: xmldata
		},
		dataType: "json",
		async: false,
		success: function(jd, textStatus, jqXHR) { // returns Json Data
			if (debug) console.log(jd);
			if (jd.status == 'error') {
				window.alert(jd.value);
			} else {
				window.alert(jd.value);
			}
		},
		error: function (jqXHR, textStatus, errorThrown) { // file error returned
			console.log("--------------START jqXHR------------------");
			console.log(jqXHR);
			console.log("--------------END jqXHR------------------");			
			console.log(textStatus);
			console.log(errorThrown);			
			window.alert("Bookshelf [" + bookshelf_file + "] write failed!");
		}
	});
}

// save book data to a file
function imb_save_book_content(bidx) {
	var book = book_list[bidx];
	var xmldata = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n';
	xmldata += '<book title="' + cleanXML(book.title) + '" author="' + cleanXML(book.author) + '" version="' + cleanXML(book.version) +  '">\n'; // this is never loaded again (unlike bookshelf) - only used as a reference
	// DICTIONARY
	xmldata += '	<dictionary>\n';
	// DEFINITIONS
	$.each(book.definition_list, function() {
		xmldata += '		<definition word="' + cleanXML($(this).attr('word').toLowerCase()) + '"><![CDATA[' + $(this).attr('text') + ']]></definition>\n';
	});
	xmldata += '	</dictionary>\n';
	
	// REGISTRY
	xmldata += '	<registry>\n';
	// VARIABLES
	$.each(book.registry, function() {
		xmldata += '		<variable name="' + cleanXML($(this).attr('name').toLowerCase()) + '" value="' + cleanXML($(this).attr('value')) + '" min="' + cleanXML($(this).attr('min')) + '" max="' + cleanXML($(this).attr('max')) + '" variance="' + cleanXML($(this).attr('variance')) + '"></variable>\n';
	});
	xmldata += '	</registry>\n';
	// DISCUSSION TOPICS
	xmldata += '	<discussion>\n';
	$.each(book.discussion_list, function() {
		$this = $(this);
		xmldata += '		<topic id="' + cleanXML($this.attr('id')) + '" name="' + cleanXML($this.attr('name')) + '" page="' + cleanXML($this.attr('page')) + '">' + cleanXML($this.attr('question')) + '</topic>\n';
	});
	xmldata += '	</discussion>\n';

	// PAGES
	$.each(book.page_list, function() {
		xmldata += '	<page type_id="' + $(this).attr('type') + '" chapter_number="' + cleanXML($(this).attr('chapter_number')) + '" hidden="' + $(this).attr('hidden') + (($(this).attr('char_idx') > 0) ? '" character="' + $(this).attr('char_idx') : '') + '" timeout="' + $(this).attr('timeout') + '" timer_last="' + cleanXML($(this).attr('timer_last')) + '" timer_next="' + cleanXML($(this).attr('timer_next')) + '">\n';
		// STATES
		$.each($(this).attr('state_list'), function() {
			xmldata += '		<state sound="' + cleanXML($(this).attr('sound')) + '" xloc="' + cleanXML($(this).attr('xloc')) + '" yloc="' + cleanXML($(this).attr('yloc')) + '" label="' + cleanXML($(this).attr('label')) + '" url="' + cleanXML($(this).attr('url')) + (($(this).attr('char_idx') > 0) ? '" character="' + $(this).attr('char_idx') : '') + (($(this).attr('avatar_idx') > 0) ? '" avatar="' + $(this).attr('avatar_idx') : '') + (($(this).attr('nlp_name') != '') ? '" nlp_name="' + $(this).attr('nlp_name') : '') + '">\n';
			// TEXT
			xmldata += '			<text><![CDATA[' + $(this).attr('text') + ']]></text>\n';
			// IMAGE (if defined)
			if ( typeof $(this).attr('image').file_name != 'undefined') {
				xmldata += '			<image file_name="' + cleanXML($(this).attr('image').file_name) + '">\n';
				// IMAGE OBJECTS
				$.each($(this).attr('image').hotspot_list, function() {
					xmldata += '				<hotspot loop="' + cleanXML($(this).attr('loop')) +'">\n';
					    // FRAMES
					    $.each($(this).attr('frame_list'), function() {
						var fname = ($(this).attr('file_name') != 'None') ? $(this).attr('file_name') : '';
						xmldata += '				    <frame file_name="' + cleanXML(fname) + '" opacity="' + cleanXML($(this).attr('opacity')) + '" xloc="' + cleanXML($(this).attr('xloc')) + '" yloc="' + cleanXML($(this).attr('yloc')) + '" width="' + cleanXML($(this).attr('width')) + '" height="' + cleanXML($(this).attr('height')) + '" word="' + cleanXML($(this).attr('word')) + '"><![CDATA[' + $(this).attr('text') + ']]></frame>\n';
					    });
                                        xmldata += '				</hotspot>\n';
                                });
				$.each($(this).attr('image').draggable_list, function() {
					xmldata += '				<draggable clone="' + cleanXML($(this).attr('clone')) + '" loop="' + cleanXML($(this).attr('loop')) + '">\n';
					    // FRAMES
					    $.each($(this).attr('frame_list'), function() {
						var fname = ($(this).attr('file_name') != 'None') ? $(this).attr('file_name') : '';
						xmldata += '				    <frame file_name="' + cleanXML(fname) + '" opacity="' + cleanXML($(this).attr('opacity')) + '" xloc="' + cleanXML($(this).attr('xloc')) + '" yloc="' + cleanXML($(this).attr('yloc')) + '" width="' + cleanXML($(this).attr('width')) + '" height="' + cleanXML($(this).attr('height')) + '" word="' + cleanXML($(this).attr('word')) + '"></frame>\n';
					    });
					xmldata += '				</draggable>\n';
                                });
				$.each($(this).attr('image').container_list, function() {
					xmldata += '				<container count="' + cleanXML($(this).attr('count')) + '" lock="' + cleanXML($(this).attr('lock')) + '" loop="' + cleanXML($(this).attr('loop')) + '">\n';
					// FRAMES
					    $.each($(this).attr('frame_list'), function() {
						var fname = ($(this).attr('file_name') != 'None') ? $(this).attr('file_name') : '';
						xmldata += '				    <frame file_name="' + cleanXML(fname) + '" opacity="' + cleanXML($(this).attr('opacity')) + '" xloc="' + cleanXML($(this).attr('xloc')) + '" yloc="' + cleanXML($(this).attr('yloc')) + '" width="' + cleanXML($(this).attr('width')) + '" height="' + cleanXML($(this).attr('height')) + '" word="' + cleanXML($(this).attr('word')) + '"></frame>\n';
					    });
                                        xmldata += '				</container>\n';
                                });
				xmldata += '			</image>\n';
			}
			// LEXICON (if present)
			if ($(this).attr('lexicon').word_list.length > 0) {
				xmldata += '			<lexicon label="' + cleanXML($(this).attr('lexicon').label) + '" text="' + cleanXML($(this).attr('lexicon').text) + '" error="' + cleanXML($(this).attr('lexicon').error) + '">\n';
				// WORDS
				$.each($(this).attr('lexicon').word_list, function() {
					xmldata += '				<word type_id="' + cleanXML($(this).attr('type')) + '" sound="' + cleanXML($(this).attr('sound')) + '" icon="' + cleanXML($(this).attr('icon')) + '" word="' + cleanXML($(this).attr('word')) + '"></word>\n';
				});
				xmldata += '			</lexicon>\n';		
			}
			// TRANSITIONS
			$.each($(this).attr('transition_list'), function() {
				xmldata += '			<transition type_id="' + cleanXML($(this).attr('type')) + '" variable_idx="' + cleanXML($(this).attr('variable_idx')) + '" trigger="' + cleanXML($(this).attr('trigger')) + '" next_state_idx="' + cleanXML($(this).attr('next_state_idx')) + '" label="' + cleanXML($(this).attr('label')) + '" scenario_id="' + cleanXML($(this).attr('scenario_id')) + '">\n';
				// RESPONSES
				$.each($(this).attr('response_list'), function() {
					xmldata += '				<response type_id="' + cleanXML($(this).attr('type')) + '" sound="' + cleanXML($(this).attr('sound')) + '" weight="' + cleanXML($(this).attr('weight')) + '" bits="' + cleanXML($(this).attr('bits')) + '" asub="' + cleanXML($(this).attr('asub')) + '">\n';
					xmldata += '					<text_input character="'  + this.characters.action_char + '" avatar="' + this.characters.action_avatar + '">' + cleanXML($(this).attr('text_input'))  + '</text_input>\n';
					xmldata += '					<text_output character="' + this.characters.output_char + '" avatar="' + this.characters.output_avatar + '">' + cleanXML($(this).attr('text_output')) + '</text_output>\n';
					xmldata += '				</response>\n';
				});
				xmldata += '			</transition>\n';		
			});
			xmldata += '		</state>\n';
		});
		xmldata += '	</page>\n';
	});
	xmldata += '</book>\n';
	
	var book_file_path = "data/books/" + book.location + "book.xml";
	var bookContainsPages = xmldata.search("page"); // seach for page to make sure there is at least one page in the book.xml file.
	var bookContainsDefinitions = xmldata.search("definition"); // seach for definition to make sure there is at least dictionary entry in the book.xml file.
	if (bookContainsPages + bookContainsDefinitions > -2) { // if there is at least one book, then run it through the XML parser.
		loadXMLDocErr(xmldata, book_file_path); //run xmldata file through the XMLparser to see if there are any XML errors before saving.
	}
	else {	// if no pages or definitions were found, then alert the user and do not save or POST XML book file.
		alert("No pages or definitions were found in the book XML file. Book will not be saved.");
		return;
	}
	
	if (location.hostname == '') {
		window.alert(xmldata);
		//console.log(xmldata);
		return;
	}
	
	$.ajax({
        type: "POST",
		url: "utils/author/service.php",
		data: {
			action: "savebook",
			imb_dir: "data/books/" + book.location,
			imb_file: "book.xml",
			imb_data: xmldata
		},
		dataType: "json",
		async: false,
		success: function(jd) { // returns Json Data
			if (debug) console.log(jd);
			if (jd.status == 'error') {
				window.alert(jd.value);
			} else {
				window.alert(jd.value);
			}
		},
		error: function (jqXHR, textStatus, errorThrown) { // file error returned
			console.log("--------------START jqXHR------------------");
			console.log(jqXHR);
			console.log("--------------END jqXHR------------------");			
			console.log(textStatus);
			console.log(errorThrown);			
			window.alert("Book [" + book.location + "] write failed!");
		}
	});
}

//--------------------------------------------------------------------------------- FILE MANAGER
// get file names from the server
function getFileNames(directory, file_type) {
	var rv = null;
	if (location.hostname == '') {
		return rv;
	}
	$.ajax({
		url: "utils/author/service.php",
		data: {
			action: "list",
			imb_dir: directory,
			imb_file_type: file_type
		},
		type: "POST",
		dataType: "json",
		success: function (jd) {
			if (debug) console.log("AJAX connection successful for " + directory + "/*." + file_type);
			if (debug) console.log(jd);
			if (jd.status == 'error') {
				window.alert(jd.value);
			} else {
				rv = jd.files;
			}
		},
		error: function () {
			window.alert("Unable to connect. Please try again.");
		},
	});
	return rv;
}
// rename file
function renameFile(directory, old_file, new_file) {
	$.ajax({
		url: "utils/author/service.php",
		data: {
			action: "rename",
			imb_dir: directory,
			imb_old_file: old_file,
			imb_new_file: new_file
		},
		type: "POST",
		dataType: "json",
		success: function (jd) {
			if (debug) console.log("AJAX connection successful for " + directory + "/" + old_file);
			if (jd.status == 'error') {
				window.alert(jd.value);
			} else {
				mediaContent(getFileNames(directory, sessionStorage.mediaType));
			}
		},
		error: function () {
			window.alert("Unable to connect. Please try again.");
		},
	});
}
// delete file
function deleteFile(directory, old_file) {
	$.ajax({
		url: "utils/author/service.php",
		data: {
			action: "delete",
			imb_dir: directory,
			imb_old_file: old_file
		},
		type: "POST",
		dataType: "json",
		success: function (jd) {
			if (debug) console.log("AJAX connection successful for " + directory + "/" + old_file);
			if (jd.status == 'error') {
				window.alert(jd.value);
			} else {
				mediaContent(getFileNames(directory, sessionStorage.mediaType));
			}
		},
		error: function () {
			window.alert("Unable to connect. Please try again.");
		},
	});
}
// upload files to a server directory
function uploadFile(form) {
	if (debug) console.log("uploadFile: " + $('#frm_uploaded', form).val() + " to " + $('#frm_imb_dir', form).val() + " for " + sessionStorage.fileAction);
	var formData = new FormData(form[0]);
	$.ajax({
		url: "utils/author/service.php",
		data: formData,
		contentType: false,
		processData: false,
		type: "POST",
		dataType: "json",
		success: function (jd) {
			if (debug) console.log("AJAX connection successful");
			if (jd.status == 'error') {
				window.alert(jd.value);
			} else {
				if (sessionStorage.fileAction == "upload") { // just upload the file
					mediaContent(getFileNames($('#frm_imb_dir', form).val(), sessionStorage.mediaType));
					history.go(-1);
				} else { // process tje book file
					var filePosition = $("#frm_uploaded", form).val().split("\\").length-1;
					var fileName = $("#frm_uploaded", form).val().split("\\")[filePosition];
					process_book_file(fileName);
				}
			}
		},
		error: function () {
			window.alert("Upload failed. Please try again.");
			history.go(-1);
		},
	});
}

// upload game files to a server directory
function upload_game_file(form) {
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // current page
	var state = page.state_list[page.state_list_idx]; // current state
	if (debug) console.log("upload_game_file: " + $('#game_frm_uploaded', form).val() + " to " + $('#game_frm_imb_dir', form).val() + " for " + sessionStorage.fileAction);
	var formData = new FormData(form[0]);
	$.ajax({
		url: "utils/author/service.php",
		data: formData,
		contentType: false,
		processData: false,
		type: "POST",
		dataType: "json",
		success: function (jd) {
			if (debug) console.log("AJAX connection successful");
			if (jd.status == 'error') {
				window.alert(jd.value);
			} else {
				if (sessionStorage.fileAction == "upload") { // just upload the file
					mediaContent(getFileNames($('#frm_imb_dir', form).val(), sessionStorage.mediaType));
					history.go(-1);
				} else { // process the book file
					state.url = "data/games/" + $("#game_frm_name").val() + "/scripts/run.js";
					$(".imb_custom_game_btn .ui-btn-text").text("Custom Game: " + $("#game_frm_name").val());
					history.go(-1);
				}
			}
		},
		error: function () {
			window.alert("Upload failed. Please try again.");
			history.go(-1);
		},
	});
}

// parse the input book text file
function imb_refresh_pages(bidx, path) {
	var book = book_list[bidx];
	var idx = 0;
	var chapter_label = '';
	var chapters = [];

	$.ajax({
		url: path,
		dataType: 'text',
		async: false,
		success: function(data) {
			chapters = splitChapters(data);

			for (var i = 1; i < chapters.length; i+=2) {
				chapters[i] = splitPages(chapters[i]);
			}
			
			for (var i = 0; i < chapters.length; i++) {
				if (i%2 == 0) { // this is a header
					chapter_label = chapters[i];
				} else { // these are pages in the content following the header
					for (var j = 0; j < chapters[i].length; j++) {
						var page_type = (chapters[i][j] == '**game**') ? '2' : '1';
						console.log("CHAPTER: [" + chapter_label + "]");
						console.log("PAGE: #" + idx + " type=" + page_type + " text=[" + chapters[i][j] + "]");
						
						if (typeof book.page_list[idx] == 'undefined') { // if the page does not exist
							var newpage = new Page(page_type, chapter_label, 'n');
							var newstate = new State('', 0, 0, '', chapters[i][j]);
							newpage.state_list.push(newstate);
							book.page_list.splice(idx, 0, newpage); // add new page
							idx++;
						} else if (parseInt(book.page_list[idx].type) > 1) { // if the existing page is a game
							if (page_type == '1') { // if the new page is a text page then insert it in front of an existing game
								var newpage = new Page(page_type, chapter_label, 'n');
								var newstate = new State('', 0, 0, '', chapters[i][j]);
								newpage.state_list.push(newstate);
								book.page_list.splice(idx, 0, newpage); // insert new page
							} // else do nothing
							idx++;
						} else if (parseInt(book.page_list[idx].type) == 1) {// if the existing page is a text page
							if (page_type == '1') { // if the new page is a text page then update the existing page
								book.page_list[idx].chapter_number = chapter_label; 
								book.page_list[idx].state_list[0].text = chapters[i][j]; // update page (function added 4/7/15 by Alex)
							} else { // create a new game page then clone any next existing game content down into this index
								var newpage = new Page(page_type, chapter_label, 'n');
								for (var g = idx; g < book.page_list.length; g++) {
									if (parseInt(book.page_list[g].type) > 1) { // found a game page!
										newpage.type = book.page_list[g].type; // copy the old game type
										newpage.state_list = book.page_list[g].state_list.slice(0); // clone the state list using SLICE
										book.page_list.splice(g, 1); // remove old game page
										break;
									}
								}
								book.page_list.splice(idx, 0, newpage); // insert/clone the game page
							}
							idx++;
						}
					}
				}
			}
			
			for (var x = idx; x < book.page_list.length; x++) { // delete any remaning text pages
				if (parseInt(book.page_list[x].type) == 1) { // if page is text
					book.page_list.splice(x, 1); // remove old text page
				}
			}
		},
		error: function () {
			window.alert("Parser failed!");
		},
	});
	
	return idx; // number of text pages loaded
}

function imb_get_game_list() {
	var gamelist = [];

	$.ajax({
		url: "utils/author/service.php",
		data: {
			action: "readGameList"
		},
		async: false,
		type: "POST",
		dataType: "json",
		success: function (jd) {
			gamelist = jd.value.split(",");
		},
		error: function () {
		},
	});

	return gamelist;
}
// get the first unused topic id from the database for this book
function imb_get_new_topic_id(book_id, success_callback) {
	$.ajax({
		url: "utils/author/service.php",
		data: {
			action: "getTopicId",
			imb_book: book_id
		},
		async: true,
		type: "POST",
		dataType: "json",
		success: function (jd) {
			if (jd && jd.value) {
				success_callback(jd.value);
			}
			else {
				console.error(jd);
			}
		},
		error: function (d) {
			console.error(d);
		},
	});
}
// save the discussion topics to the database (they're saved to file when the
// whole book is saved)
function imb_save_discussion_topics(bidx, success_callback) {
	var book = book_list[bidx];
	if (book == null) {
		return;
	}
	$.ajax({
		url: "utils/author/service.php",
		data: {
			action: "saveTopics",
			imb_book: book.book_id,
			imb_topic_list: JSON.stringify(book.discussion_list)
		},
		async: true,
		type: "POST",
		dataType: "json",
		success: function (jd) {
			// this may change the IDs of discussion topics, particularly when the
			// question has changed to something different, so we need to update
			// the book in memory with these changes before saving
			if (jd && jd.status == 'success') {
				// replace the discussion list in memory with what was determined
				// by the database as the correct one (so IDs aren't mismatched)
				book.discussion_list = [];
				jd.value.forEach(function(entry){
					book.discussion_list.push(new DiscussionTopic(entry.id, entry.name, entry.question, entry.page));
				});
				// collapse the topic bar
				load_discussion_topics(bidx);
				// continue
				success_callback();
			}
			else {
				console.error(jd);
			}
		},
		error: function (d) {
			console.error(d);
		},
	});
	
}

// check if a book is already being edited and, if not, lock/unlock it for now
function imb_lock_book(book_id, lock_state) {
	if (debug) console.log("changing lock state for " + book_id + " to " + lock_state);
	
	var result = 'error';
	$.ajax({
		url: "utils/author/service.php",
		data: {
			action: "lockBook",
			imb_book: book_id,
			state: ((lock_state) ? 1 : 0)
		},
		async: false, // so we can unlock the book when closing the window
		type: "GET",
		dataType: "json",
		success: function (jd) {
			console.log(jd);
			if (jd) {
				result = jd.current_user;
				if (jd.status == 'success') {
					result = '';
				}
			}
		},
		error: function (d) {
			console.error(d);
		},
	});
	return result;
}
