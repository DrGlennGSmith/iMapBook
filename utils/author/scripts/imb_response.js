/**
 * SECTION MARKER
 * 
 * Following are general functions and variables called by the event handlers above.
 */
//Transition to response editor	
function transition_to_response_editor(state_idx, transition_idx) {
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[state_idx]; // current state
	var transition = state.transition_list[transition_idx]; // current transition
	var responses = transition.response_list;
	//sets the parameters of the submit_respon_list() function dynamically.  This is needed for the state machine.
	$("#imb_submit_list_btn").replaceWith('<a href="#" data-role="button" onclick="submit_respon_list('+ false + ', ' + state_idx + ', ' + transition_idx + ');" data-theme="e" data-inline="true" data-mini="true" id="imb_submit_list_btn">Update and Exit</a>');
	$("#imb_submit_list_btn").addClass('ui-btn-right');
	$("#generate-text-responses").trigger('create');
	//$(this).closest(".imb_transition_collapsible").trigger("collapse"); //Close this transition collapsible
	
	//Navigate to new page
	$.mobile.changePage("#generate-text-responses", {transition: "pop"});
	//Update the header
	$("#response_editor_header_title").html('Response Editor - ' + imb_transition_label(transition.type) + ' transition (' + (state.transition_list_idx + 1) + ')');
	
	//Run page setup
	setup_page(transition, responses);
}

//Total number of generated responses
var num_gen_r_items = 0;

//Page setup function for entry into response editor
function setup_page(transition, responses)
{
	//Empty the response list from last time
	$('#imb_gen_response_list').empty();
	
	//Insert all the responses for the state
	for (var i=0; i<responses.length; i++)
	{
		var r = responses[i];
		insert_generated_response(i, r.text_input, r.text_output, r.sound, r.weight, r.asub, r.type, r.characters);
		//Toggle bits for element if needed
		if (r.bits > 0)
		{
			toggle_value("bits", "imb_r_bits" + i, "No");
		}
	}
	
	//Toggle keep for all elements
	$(".keep_btn_no").each(function(){
		toggle_value("keep", $(this).attr("id"), $(this).html());
	});
	
	// ---------------I have commented out this code for now because even non-object responses still can have a link or other text in this input field, so I believe they all need to be enabled - Mark (11/11/2013) ---------------------------------------------------------------------
	//Check if object input needs to be enabled
	//$(".gen_select_list").each(function(){
	//	check_enable_object(this);
	//});
	
	//Display bits column for bitmask transitions
	if (transition.type != "5")
	{
		$(".bits_btn_yes, .bits_btn_no").parent().css("display","none");
		$("#bits_sort").parent().parent().css("display","none")
			.parent().removeClass("ui-grid-c").addClass("ui-grid-b");
		
		/*$(".ui-block-c > div > .gen_out_txt").parent().css("width","100%");
		$("#output_sort").parent().parent().css("width", "100%");*/
	}
	
	//Don't display bits column for other transitions
	else
	{
		$(".bits_btn_yes, .bits_btn_no").parent().css("display","inline-block");
		$("#bits_sort").parent().parent().css("display","inline-block")
			.parent().removeClass("ui-grid-b").addClass("ui-grid-c");
		
		/*$(".ui-block-c > div > .gen_out_txt").parent().css("width","75%");
		$("#output_sort").parent().parent().css("width", "75%");*/
	}
	
	//Auto sort based on text input
	set_sort_respon_list("none");
	set_sort_respon_list("input");
}

//Establish default values for responses
function respon_defs()
{
	return {
		output: "",
		type: "1",
		sound: "",
		weight: 0,
		asub: "n",
		characters: {
			action_char  : -1, /* action comes from the user */
			action_avatar: 0,
			output_char  : 0,  /* output uses the default state character */
			output_avatar: 0
		}
	};
}

//Locate the maximum gen_r_id
function find_max_id()
{
	var responses = $(".gen_r_item");
	var maxId=0;
	
	//Iterate through responses to find the highest ID
	for (var i=0; i<responses.length; i++)
	{
		if (parseInt($(responses[i]).attr("id").substr(9)) > maxId)
			maxId=parseInt($(responses[i]).attr("id").substr(9));
	}
	
	maxId++;
	
	return maxId;
}

//Insert a blank response in the editor
function insert_blank_response()
{
	//Check max ID
	var maxId = find_max_id();
	
	//Establish defaults
	var defs = respon_defs();
	
	//Insert the response
	insert_generated_response(maxId, "", defs.output, defs.sound, defs.weight, defs.asub, defs.type, defs.characters);
	
    //Set focus to text input
    if (document.getElementById("imb_r_act_txt" + maxId)) {
		document.getElementById("imb_r_act_txt" + maxId).focus();
	}
	//Set Keep? to "YES"
	/*var type = "keep";
	var current_value = "No";
	var id = "imb_r_keep" + maxId; 
	toggle_value(type, id, current_value);*/
	
	//Remove sort
	set_sort_respon_list("none");
}

//Insert a generated response
function insert_generated_response(idx, r_action_text, r_text_output, r_respon_sound, r_respon_weight, r_respon_auto_sub, r_respon_value, r_characters) {
	//Get current transition
	var book = book_list[book_list_idx];
	var page = book.page_list[book.page_list_idx];
	var state = page.state_list[page.state_list_idx];
	var transition = state.transition_list[state.transition_list_idx];
	
	//Create dom for response
	var gen_response = '<div id="imb_gen_r' + idx + '" class="gen_r_item">' +
		'<div class="ui-grid-c">' +
			'<div class="ui-block-a">' +
				'<div class="ui-grid-' + ((transition.type == "5") ? 'c' : 'b') + '">' +
					'<div class="imb_grid_block"><a href="#"><button class="imb_media_btn gen_btn" id="imb_response_sound'+ idx +'">' + ((r_respon_sound == "") ? "None" : r_respon_sound) + '</button></a></div>'+
					'<div class="imb_grid_block"><input id="imb_r_weight'+ idx +'" type="text" value="' + r_respon_weight + '" class="gen_weight_txt" /></div>' +
					'<div class="imb_grid_block">' +
							'<select class="gen_select_list" id="imb_r_asub' + idx + '">' +
								'<option value="n">No</option>' +
								'<option value="y">Yes</option>' +								
							'</select>' +
					'</div>' +
					'<div class="imb_grid_block' + ((transition.type != "5") ? ' display_remove' : '') + '"><button id="imb_r_bits' + idx + '" class="bits_btn_no imb_bits_btn" onclick="toggle_value(\'bits\', id, innerHTML)">No</button></div>' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-b">' +
				'<div class="ui-grid-a">' +
					'<div class="imb_grid_block column_large"><input class="gen_act_txt" id="imb_r_act_txt' + idx +'" type="text" value="' + r_action_text + '" /></div>' + 
					'<div class="imb_grid_block column_small"><a href="#"><button class="imb_res_avatar_btn gen_btn" id="imb_char_act'+ idx +'" data-character="' + r_characters.action_char + '" data-avatar="' + r_characters.action_avatar + '">' + avatar_name(r_characters.action_char, r_characters.action_avatar) + '</button></a></div>' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-c">' +
				'<div class="ui-grid-a">' +
					'<div class="imb_grid_block column_large"><input class="gen_out_txt" id="imb_r_out_txt' + idx +'" type="text" value="' + r_text_output + '" /></div>' + 
					'<div class="imb_grid_block column_small"><a href="#"><button class="imb_res_avatar_btn gen_btn" id="imb_char_out'+ idx +'" data-character="' + r_characters.output_char + '" data-avatar="' + r_characters.output_avatar + '">' + avatar_name(r_characters.output_char, r_characters.output_avatar) + '</button></a></div>' +
				'</div>' +
			'</div>' +
			'<div class="ui-block-d">' +
				'<div class="ui-grid-a">' +
					'<div class="imb_grid_block column_large">' +
						'<select class="gen_select_list" id="imb_r_res_value' + idx + '">' +
							'<option value="1">Positive Inference</option>' +
							'<option value="2">Negative Inference</option>' +
							'<option value="3">Variable +</option>' +
							'<option value="4">Variable -</option>' +
							'<option value="5">Variable *</option>' +
							'<option value="6">Variable /</option>' +
						'</select>' +
					'</div>' +
					'<div class="imb_grid_block column_small"><button id="imb_r_keep' + idx + '" class="btn_delete_resp" onclick="delete_response(' + idx + ')">Delete</button></div>' +
				'</div>' +
			'</div>' +
		'</div>' +
	'</div>';
	
	//Check for duplicates
	var duplicate = false;
	$(".gen_r_item .gen_act_txt").each(function()
	{
		if ($(this).attr("value") === r_action_text)
			duplicate = true;
	});
	
	//If it's not a duplicate, insert as normal
	if (!duplicate)
	{
		//Prepend to list and set num_gen_r_items
		$("#imb_gen_response_list").prepend(gen_response);
		num_gen_r_items = $('.gen_r_item').length;
		
		//Set field values
		document.getElementById("imb_r_out_txt" + idx).value = r_text_output; 
		document.getElementById("imb_r_res_value" + idx).value = r_respon_value;
		document.getElementById("imb_response_sound" + idx).value = r_respon_sound;
		document.getElementById("imb_r_weight" + idx).value = r_respon_weight;
		document.getElementById("imb_r_asub" + idx).value = r_respon_auto_sub;
	}
}

//Handle yes/no toggle for keep/bits value
function toggle_value(type, id, current_value) {
	if (current_value == "No") {
		document.getElementById(id).innerHTML = "Yes";
		document.getElementById(id).className = type+"_btn_yes";
	}
	if (current_value == "Yes") {
		document.getElementById(id).innerHTML = "No";
		document.getElementById(id).className = type+"_btn_no";		
	}			
}

// remove a response when 'delete' is clicked
function delete_response(index) {
	$("#imb_gen_r" + index).remove();
	paginate_respon_list();
}

//Remove responses not marked to keep:yes
function prune_respon_list () {
	$(".gen_r_item").each(function(){
		if ($(this).find(".ui-block-a .ui-block-d button").html() == "No")
			$(this).remove();
	});
	
	//Re-paginate
	paginate_respon_list();
}

//Filter the response list based on length (hidden via display:none in paginate_respon_list->filter_respon_pages)
function filter_respon_list () {
	var wordMin = parseInt($("#min_resp_length").val());
	var wordMax = parseInt($("#max_resp_length").val());
	
	//Mark items to get filtered (paginate_response_list->filter_respon_pages will actually do the filtering)
	$(".gen_r_item").each(function(){
		var $elem = $(this).find(".gen_act_txt");
		var value = $elem.val();
		var array = value.match(new RegExp(" ","g"));
		var numWords = (array != null) ? array.length+1 : 1;
		if (numWords < wordMin || numWords > wordMax) $(this).data("filtered", "yes");
		else $(this).data("filtered","no");
	});
	
	//Repaginate
	paginate_respon_list();
}

//Tags the pages with correct page numbers based on their order
function paginate_respon_list()
{
	var ROWS_PER_PAGE = 20;
	var pageNumber;
	
	//Get array of all responses that aren't already filtered
	var responses = $(".gen_r_item").filter(function(){return $(this).data("filtered") !== "yes";});
	
	//Mark pages with page number using page attribute
	for (var i=0; i<responses.length; i++)
	{
		pageNumber = Math.floor(i/ROWS_PER_PAGE)+1;
		$(responses[i]).attr("page", ""+pageNumber);
	}
	
	//Update page select dropdown to reflect new page numbers
	$("#r_page_select").empty();
	for (var i=0; i<pageNumber; i++)
	{
		$("#r_page_select").append("<option value='"+(i+1)+"'>"+(i+1)+"</option>");
	}
	
	//Filter the pages
	filter_respon_pages();
}

//Filter pages based on page number and filter marking
function filter_respon_pages()
{
	var page = $("#r_page_select").val();
	
	//Hide responses based on page numbers and filtered data, display others
	$(".gen_r_item").each(function(){
		if ($(this).attr("page") !== page.toString() || $(this).data("filtered") === "yes")
		{
			$(this).css("display", "none");
		}
		else $(this).css("display","block");
	});
	
	//Refresh the page select so it shows that you're viewing page 1 again
	$("#r_page_select").selectmenu("refresh");
}

//Set response list sort type and sort
function set_sort_respon_list(category)
{
	//Sort direction is down unless it's the second click on that button
	var direction="d";
	
	$("#imb_gen_response_list_header button").each(function()
	{
		//Change markup for all sort buttons to the default black
		$(this).buttonMarkup({theme:'a', icon:'bars'});
		
		//Check if the one to be sorted by has been clicked a second time
		if ($(this).attr("id") === category+"_sort" && $(this).data("sort") === "d")
		{
			direction = "u";
		}
		
		//Set sort data to none (it will be set correctly soon if we're sorting this)
		$(this).data("sort", "none");
	});
	
	//Change sort direction data and markup for the sort buttons
	switch(category)
	{
	case ("sound"): $("#sound_sort").data("sort", direction).buttonMarkup({theme:'b',icon:'arrow-'+direction}); break;
	case ("weight"): $("#weight_sort").data("sort", direction).buttonMarkup({theme:'b',icon:'arrow-'+direction}); break;
	case ("asub"): $("#asub_sort").data("sort", direction).buttonMarkup({theme:'b',icon:'arrow-'+direction}); break;
	case ("input"): $("#input_sort").data("sort", direction).buttonMarkup({theme:'b',icon:'arrow-'+direction}); break;
	case ("input_char"): $("#input_char_sort").data("sort", direction).buttonMarkup({theme:'b',icon:'arrow-'+direction}); break;
	case ("output"): $("#output_sort").data("sort", direction).buttonMarkup({theme:'b',icon:'arrow-'+direction}); break;
	case ("output_char"): $("#output_char_sort").data("sort", direction).buttonMarkup({theme:'b',icon:'arrow-'+direction}); break;
	case ("bits"): $("#bits_sort").data("sort", direction).buttonMarkup({theme: 'b',icon:'arrow-'+direction}); break;
	case ("type"): $("#type_sort").data("sort", direction).buttonMarkup({theme:'b',icon:'arrow-'+direction}); break;
	default: break;
	}
	
	//Sort the response list
	sort_respon_list();
}

//Sort the response list based on selected category
function sort_respon_list()
{
	var category;
	
	//Find the sort category based on sort button data
	$("#imb_gen_response_list_header button").each(function()
	{
		if ($(this).data("sort") !== "none")
		{
			category = $(this).attr("id").substring(0, $(this).attr("id").length-5);
			
			var rows = $(".gen_r_item");
			
			//Sort responses using functions that get html in different ways based on what we're sorting by
			switch(category)
			{
			case ("sound"):
				rows.sort(function(a, b){
					var A = $(a).find(".ui-block-a .imb_media_btn").html().toLowerCase();
					var B = $(b).find(".ui-block-a .imb_media_btn").html().toLowerCase();
					return (A<B) ? -1 : (A>B) ? 1 : 0;
				});
				break;
			case ("weight"):
				rows.sort(function(a, b){
					var A = $(a).find(".ui-block-a .gen_weight_txt").attr("value").toLowerCase();
					var B = $(b).find(".ui-block-a .gen_weight_txt").attr("value").toLowerCase();
					return (A<B) ? -1 : (A>B) ? 1 : 0;
				});
				break;
			case ("asub"):
				rows.sort(function(a, b){
					var A = $(a).find(".ui-block-a .gen_select_list").val().toLowerCase();
					var B = $(b).find(".ui-block-a .gen_select_list").val().toLowerCase();
					return (A<B) ? -1 : (A>B) ? 1 : 0;
				});
				break;
			case ("input"):
				rows.sort(function(a, b){
					var A = $(a).find(".ui-block-b .gen_act_txt").attr("value").toLowerCase();
					var B = $(b).find(".ui-block-b .gen_act_txt").attr("value").toLowerCase();
					return (A<B) ? -1 : (A>B) ? 1 : 0;
				});
				break;
			case ("output"):
				rows.sort(function(a, b){
					var A = $(a).find(".ui-block-c .gen_out_txt").attr("value").toLowerCase();
					var B = $(b).find(".ui-block-c .gen_out_txt").attr("value").toLowerCase();
					return (A<B) ? -1 : (A>B) ? 1 : 0;
				});
				break;
			case ("bits"):
				rows.sort(function(a, b){
					var A = $(a).find(".ui-block-a .imb_bits_btn").html().toLowerCase();
					var B = $(b).find(".ui-block-a .imb_bits_btn").html().toLowerCase();
					return (A<B) ? -1 : (A>B) ? 1 : 0;
				});
				break;
			case ("type"):
				rows.sort(function(a, b){
					var A = $(a).find(".ui-block-d .gen_select_list").val().toLowerCase();
					var B = $(b).find(".ui-block-d .gen_select_list").val().toLowerCase();
					return (A<B) ? -1 : (A>B) ? 1 : 0;
				});
				break;
			}
			
			//Array is sorted alphabetically from a->z. Append or prepend based on sort direction
			if ($(this).data("sort") === "d")
			{
				for (var i=0; i<rows.length; i++)
				{
					$(rows[i]).appendTo("#imb_gen_response_list"); //Appending means z is at bottom
				}
			}
			
			else
			{
				for (var i=0; i<rows.length; i++)
				{
					$(rows[i]).prependTo("#imb_gen_response_list"); //Prepending means z is at top
				}
			}
		}
	});
	
	//Re-paginate the response list
	paginate_respon_list();
}

//Check if the object text input field needs to be enabled
/*
Should no longer be necessary - object get / use are removed. Uncomment and change val if they need to be returned.
function check_enable_object(selection)
{
	if ($(selection).val() == 3 || $(selection).val() == 4)
	{
		$(selection).closest(".ui-block-d").find(".gen_out_txt").removeAttr("disabled")
	}	

	else
	{
		$(selection).closest(".ui-block-d").find(".gen_out_txt").attr("disabled","disabled");
	}
}
*/

//Submit the response list and update it to the data structure
function submit_respon_list (batchMode) {
	//Get current transition
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[page.state_list_idx]; // current state
	var transition = state.transition_list[state.transition_list_idx]; // current transition

	//Flush the responses.
	transition.response_list = [];
	
	//Update responses
	for (i=0; i <= num_gen_r_items; i++) {
		var gen_r_id = document.getElementById("imb_gen_r" + i);
		if (gen_r_id){
			var res_type = document.getElementById("imb_r_res_value" + i).value;
			var sound = document.getElementById("imb_response_sound" + i).innerHTML;
			var weight = document.getElementById("imb_r_weight" + i).value;
			var bits = (document.getElementById("imb_r_bits"+i).innerHTML == "Yes") ? "1" : "0";
			var asub = document.getElementById("imb_r_asub" + i).value;
			var act_txt = document.getElementById("imb_r_act_txt" + i).value;
			var out_txt = document.getElementById("imb_r_out_txt" + i).value;
			var act_char = $("#imb_char_act" + i);
			var out_char = $("#imb_char_out" + i);
			
			// create new record
			var response = new Response(res_type, sound, weight, bits, asub, act_txt, out_txt, act_char.data("character"), act_char.data("avatar"), out_char.data("character"), out_char.data("avatar"));
			// prepend it to the array
			transition.response_list.unshift(response);		
		}
	};
	
	//Assign bits to the transition
	if (transition.type == "5") {
		biternator(transition);
	}
	//Go back if this is an update/exit button press
	if (!batchMode)
	{
		history.go(-1);
	}
	
	imb_save_flag(2,1);
	
	//Remove the response list from DOM so it doesn't stay cached
	$("#imb_response_list").remove();
	
	//Update page
	var src_transition_id = state.transition_list_idx;
	transition_selector = "#imb_transition_item" + src_transition_id;
	$(transition_selector).trigger("create");
	$(transition_selector).trigger("collapse");
	$(transition_selector).trigger("expand");
}

//Utility function to remove array duplicates
Array.prototype.unique = function (){
	var r = new Array();
	o:for(var i = 0, n = this.length; i < n; i++){
	for(var x = 0, y = r.length; x < y; x++){
	if(r[x]==this[i]){continue o;}}
	r[r.length] = this[i];}
	return r;
}

//Sets up and runs the permutation tool
function run_permuter(wordList)
{
	var rawWords = [];
	
	//Move word strings from the wordList[i] object into the rawWords array
	for (var i=0; i<wordList.length; i++)
	{
		rawWords.push(wordList[i].word);
	}
	
	//Get default values for responses
	var defs = respon_defs();
	
	//Permute
	var response_list_array = kperms(rawWords);

	//Find max ID before inserting with ID
	var maxId = find_max_id();
	
	//Insert the responses
	$.each(response_list_array, function(index) {
		gen_action_text = response_list_array[index];
		insert_generated_response(maxId, gen_action_text, defs.output, defs.sound, defs.weight, defs.asub, defs.type);
		maxId++;
	});
	
	//Remove sorting
	set_sort_respon_list("none");
}

//Generate permutations of array of words from length 1 to a max of 6
function kperms(wrds){
	var words_min = 0;
	var words_max = 0;
	words_min = document.getElementById("select_min").value;
	words_max = document.getElementById("select_max").value;

	var div = " ";
	var arr1 = wrds;
	var arr2 = wrds;
	var arr3 = wrds;
	var arr4 = wrds;
	var arr5 = wrds;
	var arr6 = wrds;
	var arr7 = wrds;
	var arrlen = wrds.length;
	var subout1 = new Array();
	var subout2 = new Array();
	var subout3 = new Array();
	var subout4 = new Array();
	var subout5 = new Array();
	var subout6 = new Array();
	var subout7 = new Array();		
	var wrd1 = '';
	var wrd2 = '';
	var wrd3 = '';
	var wrd4 = '';
	var wrd5 = '';
	var wrd6 = '';
	var wrd7 = '';	
	var makeuq = '';
	if(words_max == 2 || words_max == 1){
		for (u=0; u<arrlen; u++){
			wrd1 = arr1[u];
			for (x=0; x<arrlen; x++){
				wrd2 = arr2[x]; 
				makeuq = [wrd1,wrd2]; 
				subout2[x] = makeuq.unique().join(div);
			}
		subout1[u] = subout2.join('\n');
		}
	}
	if(words_max == 3){
		for (u=0; u<arrlen; u++){
			wrd1 = arr1[u];
			for (v=0; v<arrlen; v++){
				wrd2 = arr2[v];
				for (x=0; x<arrlen; x++){
					wrd3 = arr3[x]; 
					makeuq = [wrd1,wrd2,wrd3]; 
					subout3[x] = makeuq.unique().join(div);
				}
				subout2[v] = subout3.join('\n');
			}
			subout1[u] = subout2.join('\n');
		}
	}
	if(words_max == 4){
		for (u=0; u<arrlen; u++){
			wrd1 = arr1[u];
			for (v=0; v<arrlen; v++){
				wrd2 = arr2[v];
				for (w=0; w<arrlen; w++){
					wrd3 = arr3[w];
					for (x=0; x<arrlen; x++){
						wrd4 = arr4[x]; 
						makeuq = [wrd1,wrd2,wrd3,wrd4]; 
						subout4[x] = makeuq.unique().join(div);
					}
					subout3[w] = subout4.join('\n');
				}
				subout2[v] = subout3.join('\n');
			}
			subout1[u] = subout2.join('\n');
		}
	}
	if(words_max == 5){
		for (u=0; u<arrlen; u++){
			wrd1 = arr1[u];
			for (v=0; v<arrlen; v++){
				wrd2 = arr2[v];
				for (w=0; w<arrlen; w++){
					wrd3 = arr3[w];
					for (y=0; y<arrlen; y++){
						wrd4 = arr4[y];			
						for (x=0; x<arrlen; x++){
							wrd5 = arr5[x]; 
							makeuq = [wrd1,wrd2,wrd3,wrd4,wrd5]; 
							subout5[x] = makeuq.unique().join(div);
						}
						subout4[y] = subout5.join('\n');
					}
					subout3[w] = subout4.join('\n');
				}
				subout2[v] = subout3.join('\n');
			}
			subout1[u] = subout2.join('\n');
		}
	}
	if(words_max == 6){
		for (u=0; u<arrlen; u++){
			wrd1 = arr1[u];
			for (v=0; v<arrlen; v++){
				wrd2 = arr2[v];
				for (w=0; w<arrlen; w++){
					wrd3 = arr3[w];
					for (y=0; y<arrlen; y++){
						wrd4 = arr4[y];
						for (z=0; z<arrlen; z++){
							wrd5 = arr5[z];
							for (x=0; x<arrlen; x++){
								wrd6 = arr6[x]; 
								makeuq = [wrd1,wrd2,wrd3,wrd4,wrd5,wrd6]; 
								subout6[x] = makeuq.unique().join(div);
							}
							subout5[z] = subout6.join('\n');
						}
						subout4[y] = subout5.join('\n');
					}
					subout3[w] = subout4.join('\n');
				}
				subout2[v] = subout3.join('\n');
			}
			subout1[u] = subout2.join('\n');
		}
	}		
	
	
	var out = subout1.join('\n');
	
	function cisort(a,b){
		var x = a.toString().toLowerCase(), y = b.toString().toLowerCase(),
		nC = String.fromCharCode(0),
		xN = x.replace(/([-]{0,1}[0-9.]{1,})/g, nC + '$1' + nC).split(nC),
		yN = y.replace(/([-]{0,1}[0-9.]{1,})/g, nC + '$1' + nC).split(nC);
			for (var cLoc=0, numS = Math.max( xN.length, yN.length); cLoc < numS; cLoc++){
				if ((parseFloat(xN[cLoc]) || xN[cLoc]) < (parseFloat(yN[cLoc]) || yN[cLoc]))
				return -1;
				else if ((parseFloat(xN[cLoc]) || xN[cLoc]) > (parseFloat( yN[cLoc]) || yN[cLoc]))
				return 1;
			}
		return 0;
	}
	out = out.split('\n').unique().sort(cisort);
	final_response_list = new Array();
	for (i=0; i<out.length; i++){
		words_length = out[i].split(" ").length;
		if (words_length >= words_min && words_length <= words_max){
			final_response_list.push(out[i]);	
		}
	}
	var lcount = final_response_list.length;
	if (lcount == 0) {
		alert("There were no responses generated, please check that the minimum and maximum response lengths are correct.")		
		return final_response_list;
	}
	else {
		return final_response_list;
	}
}

//Sets up for and runs the forward sentence generator
function run_generator(wordList)
{
	//Declare arrays
	var articles=[], properNouns=[], nouns=[], pluralNouns=[], adjectives=[], conjunctions=[], verbs=[], pluralVerbs=[], adverbs=[], prepositions=[], interrogatives=[];
				
	//Sort words into proper arrays
	for (var i=0; i<wordList.length; i++)
	{
		switch (wordList[i].type)
		{
		case ("1"): nouns.push(wordList[i].word); break;
		case ("11"): pluralNouns.push(wordList[i].word); break;
		case ("12"): properNouns.push(wordList[i].word); break;
		case ("2"): verbs.push(wordList[i].word); break;
		case ("21"): pluralVerbs.push(wordList[i].word); break;
		case ("3"): adjectives.push(wordList[i].word); break;
		case ("4"): adverbs.push(wordList[i].word); break;
		case ("5"): conjunctions.push(wordList[i].word); break;
		case ("6"): prepositions.push(wordList[i].word); break;
		case ("7"): interrogatives.push(wordList[i].word); break;
		case ("8"): articles.push(wordList[i].word); break;
		default: console.log("Error, could not sort "+wordList[i].word); break;
		}
	}
				
	//Get toggle data
	var generateStatements = $("label[for='gen-statements']").hasClass("ui-btn-active");
	var generateQuestions = $("label[for='gen-questions']").hasClass("ui-btn-active");
	var generateCommands = $("label[for='gen-commands']").hasClass("ui-btn-active");
	var allowCompoundNPs = $("label[for='compound-nps']").hasClass("ui-btn-active");
	var allowDirectObjects = $("label[for='direct-objects']").hasClass("ui-btn-active");
	var allowPrepNPs = $("label[for='prep-nouns']").hasClass("ui-btn-active");
	var allowPrepVPs = $("label[for='prep-verbs']").hasClass("ui-btn-active");
	
	//Generate sentences
	response_list_array = generateSentences(articles, properNouns, nouns, pluralNouns, adjectives, conjunctions,
			verbs, pluralVerbs, adverbs, prepositions, interrogatives, generateStatements, generateQuestions,
			generateCommands, allowCompoundNPs, allowDirectObjects, allowPrepNPs, allowPrepVPs, 1); 
	
	//Get default response values
	var defs = respon_defs();
				
	//Remove punctuation in generated responses. May be desired later.
	for (var i=0; i<response_list_array.length; i++)
	{
		response_list_array[i] = response_list_array[i].substring(0, response_list_array[i].length-1);
	}
				
	//Find max ID before inserting with ID
	var maxId = find_max_id();
	
	//Insert responses
	$.each(response_list_array, function(index) {
		gen_action_text = response_list_array[index];
		insert_generated_response(maxId, gen_action_text, defs.output, defs.sound, defs.weight, defs.asub, defs.type);
		maxId++;
	});
	
	//Remove sorting
	set_sort_respon_list("none");
}

//Logical forward sentence generator
function generateSentences(articles, properNouns, nouns, pluralNouns, adjectives, conjunctions, verbs, pluralVerbs,
							adverbs, prepositions, interrogatives, genStatements, genQuestions, genCommands,
							allowCompoundNPs, allowDirectObjects, allowPrepositionalNPs, allowPrepositionalVPs, complexityValue)
{
	//Check prepositions - if "to" is found, add it to infinitives array
	var infinitives = [];
	for (var i=0; i<prepositions.length; i++)
	{
		if (prepositions[i] === "to")
		{
			for (var j=0; j<pluralVerbs.length; j++)
			{
				infinitives.push("to "+pluralVerbs[j]);
			}
		}
	}
	
	//Pronouns are conjugated differently, check their existence
	var pronouns = [false, false, false, false, false, false, false];
	for (var i=0; i<nouns.length; i++)
	{
		switch (nouns[i])
		{
		case ("I"): pronouns[0] = true; nouns.splice(i, 1); i--; break;
		case ("you"): pronouns[1] = true; nouns.splice(i, 1); i--; break;
		case ("he"): pronouns[2] = true; nouns.splice(i, 1); i--; break;
		case ("she"): pronouns[3] = true; nouns.splice(i, 1); i--; break;
		}
	}
	for (var i=0; i<pluralNouns.length; i++)
	{
		switch (pluralNouns[i])
		{
		case ("we"): pronouns[4] = true; pluralNouns.splice(i, 1); i--; break;
		case ("you"): pronouns[5] = true; pluralNouns.splice(i, 1); i--; break;
		case ("they"): pronouns[6] = true; pluralNouns.splice(i, 1); i--; break;
		}
	}
	
	//Establish word phrase arrays
	var SNPs = [];
	var PNPs = [];
	var SVPs = [];
	var PVPs = [];
	var IPs = [];
	var PPs = [];
	
	/**SECTION: Sentence types**/
	//A statement is NP VP .
	function generateStatements()
	{
		var statements = [];
		
		for (var i=0; i<SNPs.length; i++)
		{
			for (var j=0; j<SVPs.length; j++)
			{
				statements.push(SNPs[i]+" "+SVPs[j]+".");
			}
		}
		
		for (var i=0; i<PNPs.length; i++)
		{
			for (var j=0; j<PVPs.length; j++)
			{
				statements.push(PNPs[i]+" "+PVPs[j]+".");
			}	
		}
		
		return statements;
	}

	//A question is NP VP ? | IP VP ?
	function generateQuestions()
	{
		var questions = [];
		
		//NP VP
		for (var i=0; i<SNPs.length; i++)
		{
			for (var j=0; j<SVPs.length; j++)
			{
				questions.push(SNPs[i]+" "+SVPs[j]+"?");
			}
		}
	
		for (var i=0; i<PNPs.length; i++)
		{
			for (var j=0; j<PVPs.length; j++)
			{
				questions.push(PNPs[i]+" "+PVPs[j]+"?");
			}
		}
	
		//IP VP
		for (var i=0; i<IPs.length; i++)
		{
			for (var j=0; j<SVPs.length; j++)
			{
				questions.push(IPs[i]+" "+SVPs[j]+"?");
			}
		}
	
		return questions;
	}

	//A command is VP .
	function generateCommands()
	{
		var commands = [];
		
		for (var i=0; i<PVPs.length; i++)
		{
			commands.push(PVPs[i]+"!");
		}
	
		return commands;
	}

	/**SECTION: Phrase generations - simple**/
	//A simple noun phrase is N | AJ N
	function generateNPs(singular)
	{
		//Simple stuff first - noun-only NPs, including articles.
		if (singular)
		{
			for (var i=0; i<articles.length; i++)
			{
				for (var j=0; j<nouns.length; j++)
				{
					SNPs.push(articles[i]+" "+nouns[j]);
				}
			}
	
			for (var i=0; i<properNouns.length; i++)
			{
				SNPs.push(properNouns[i]);
			}
			
			if (pronouns[2]) SNPs.push("he");
			if (pronouns[3]) SNPs.push("she");
		}
	
		else
		{
			for (var i=0; i<articles.length; i++)
			{
				if (articles[i] !== "a" && articles[i] !== "an")
				{
					for (var j=0; j<pluralNouns.length; j++)
					{
						PNPs.push(articles[i]+" "+pluralNouns[j]);
					}
				}
			}
			
			if (pronouns[0]) PNPs.push ("I");
			if (pronouns[1] || pronouns[5]) PNPs.push ("you");
			if (pronouns[4]) PNPs.push ("we");
			if (pronouns[6]) PNPs.push ("they");
		}
	
		//A double-loop for adjective followed by noun.
		if (singular)
		{
			for (var i=0; i<adjectives.length; i++)
			{
				for (var j=0; j<articles.length; j++)
				{
					for (var k=0; k<nouns.length; k++)
					{
						SNPs.push(articles[j]+" "+adjectives[i]+" "+nouns[k]);
					}
				
					for (var k=0; k<properNouns.length; k++)
					{
						SNPs.push(articles[j]+" "+adjectives[i]+" "+properNouns[k]);
					}
				}
			}
		}
	
		else
		{
			for (var i=0; i<adjectives.length; i++)
			{
				for (var j=0; j<articles.length; j++)
				{
					if (articles[j] !== "a" && articles[j] !== "an")
					{
						for (var k=0; k<pluralNouns.length; k++)
						{
							PNPs.push(articles[j]+" "+adjectives[i]+" "+pluralNouns[k]);
						}
					}
				}
			}
		}
	
		if (singular)
			return SNPs;
		else
			return PNPs;
	}

	//A simple verb phrase is V | V AV
	function generateVPs(singular)
	{
		//Verb-only VPs
		if (singular)
		{
			for (var i=0; i<verbs.length; i++)
			{
				SVPs.push(verbs[i]);
			}
		}
	
		else
		{
			for (var i=0; i<pluralVerbs.length; i++)
			{
				PVPs.push(pluralVerbs[i]);
			}
		}
		
		//A double-loop for verb adverb
		if (singular)
		{
			for (var i=0; i<verbs.length; i++)
			{
				for (var j=0; j<adverbs.length; j++)
				{
					SVPs.push(verbs[i]+" "+adverbs[j]);
				}
			}
		}
		
		else
		{
			for (var i=0; i<pluralVerbs.length; i++)
			{
				for (var j=0; j<adverbs.length; j++)
				{
					PVPs.push(pluralVerbs[i]+" "+adverbs[j]);
				}
			}
		}
	
		if (singular)
			return SVPs;
		else
			return PVPs;
	}

	//An interrogative phrase is I
	function generateIPs()
	{
		return interrogatives;
	}

	/**SECTION: Phrase generations - complex**/
	//NP C NP
	function generateCompoundNPs()
	{
		var composites = [];
		
		//Triple loop for all the SNP C SNP
		for (var i=0; i<SNPs.length; i++)
		{
			for (var j=0; j<conjunctions.length; j++)
			{
				for (var k=0; k<SNPs.length; k++)
				{
					if (i !== k) composites.push(SNPs[i]+" "+conjunctions[j]+" "+SNPs[k]);
				}
			}
		}
	
		//Triple loop for all the SNP C PNP and PNP C SNP
		for (var i=0; i<SNPs.length; i++)
		{
			for (var j=0; j<conjunctions.length; j++)
			{
				for (var k=0; k<PNPs.length; k++)
				{
					composites.push(SNPs[i]+" "+conjunctions[j]+" "+PNPs[k]);
					composites.push(PNPs[k]+" "+conjunctions[j]+" "+SNPs[i]);
				}
			}
		}
	
		//Triple loop for all the PNP C PNP
		for (var i=0; i<PNPs.length; i++)
		{
			for (var j=0; j<conjunctions.length; j++)
			{
				for (var k=0; k<PNPs.length; k++)
				{
					if (i !== k) composites.push(PNPs[i]+" "+conjunctions[j]+" "+PNPs[k]);
				}
			}
		}
	
		return composites;
	}

	//V NP
	function generateDOVPs(verbArray)
	{
		var DOVPs = [];
	
		//Double loop for V SNP or V PNP
		for (var i=0; i<verbArray.length; i++)
		{
			for (var j=0; j<SNPs.length; j++)
			{
				DOVPs.push(verbArray[i]+" "+SNPs[j]);
			}
		
			for (var j=0; j<PNPs.length; j++)
			{
				DOVPs.push(verbArray[i]+" "+PNPs[j]);
			}
			
			for (var j=0; j<infinitives.length; j++)
			{
				DOVPs.push(verbArray[i]+" "+infinitives[j]);
			}
		}
	
		return DOVPs;
	}

	//PP = P NP
	function generatePPs()
	{
		//Double loop for P SNP and P PNP
		for (var i=0; i<prepositions.length; i++)
		{
			for (var j=0; j<SNPs.length; j++)
			{
				PPs.push(prepositions[i]+" "+SNPs[j]);
			}
		
			for (var j=0; j<PNPs.length; j++)
			{
				PPs.push(prepositions[i]+" "+PNPs[j]);
			}
		}
	
		return PPs;
	}

	//N PP
	function generatePrepositionals(PArray)
	{
		var prepositionals = [];
	
		for (var i=0; i<PArray.length; i++)
		{
			for (var j=0; j<PPs.length; j++)
			{
				prepositionals.push(PArray[i]+" "+PPs[j]);
			}
		}
	
		return prepositionals;
	}

	/**SECTION: Cleanup based on noun presence**/
	function cleanup(array)
	{
		var count;
		
		for (var i=0; i<nouns.length; i++)
		{
			for (var j=0; j<array.length; j++)
			{
				count = array[j].match(new RegExp(nouns[i], "g"));
			
				if (count !== null && count.length > 1)
				{
					array.splice(j, 1);
					j--;
				}
			}
		}
	
		for (var i=0; i<pluralNouns.length; i++)
		{
			for (var j=0; j<array.length; j++)
			{
				count = array[j].match(new RegExp(pluralNouns[i], "g"));
			
				if (count !== null && count.length > 1)
				{
					array.splice(j, 1);
					j--;
				}
			}
		}
	
		for (var i=0; i<properNouns.length; i++)
		{
			for (var j=0; j<array.length; j++)
			{
				count = array[j].match(new RegExp(properNouns[i], "g"));
			
				if (count !== null && count.length > 1)
				{
					array.splice(j, 1);
					j--;
				}
			}
		}
		
		//I you he she we you they
		for (var j=0; j<array.length; j++)
		{
			var tmp;
			var count = [];
			if (pronouns[0]) count = array[j].match(new RegExp("I", "g"));
			if (pronouns[1] || pronouns[5]) count = (tmp = array[j].match(new RegExp("you", "g")) > count) ? tmp : count;
			if (pronouns[2]) count = (tmp = array[j].match(new RegExp("he", "g")) > count) ? tmp : count;
			if (pronouns[3]) count = (tmp = array[j].match(new RegExp("she", "g")) > count) ? tmp : count;
			if (pronouns[4]) count = (tmp = array[j].match(new RegExp("we", "g")) > count) ? tmp : count;
			if (pronouns[6]) count = (tmp = array[j].match(new RegExp("they", "g")) > count) ? tmp : count;
			
			if (count !== null && count.length > 1)
			{
				array.splice(j, 1);
				j--;
			}
		}
	}
	
	/**SECTION: Evaluate input to determine why no output was generated**/
	function evaluate()
	{
		var foundSomething = false;
		var remindVerbMarks = false;
		
		//No nouns entered
		if (properNouns.length === 0 && nouns.length === 0 && pluralNouns.length === 0)
		{
			alert("It looks like no nouns were entered. Check to make sure nouns are labeled as such!");
			foundSomething = true;
		}
		
		//No verbs entered
		if (verbs.length === 0 && pluralVerbs.length === 0)
		{
			alert("It looks like no verbs were entered. Check to make sure verbs are labeled as such!");
			foundSomething = true;
		}
		
		//No articles entered
		if (nouns.length > 0 && articles.length === 0)
		{
			alert("There were some nouns, but no noun phrases can be generated without articles! Add at least one!");
			foundSomething = true;
		}
		
		if (pluralNouns.length > 0 && articles.length === 0)
		{
			alert("There were some plural nouns, but this system needs articles to make noun phrases with them. Add at least one!");
			foundSomething = true;
		}
		
		//Nouns and verbs could not be conjugated
		if (nouns.length === 0 && properNouns.length === 0  && !pronouns[2] && !pronouns[3] && verbs.length > 0)
		{
			alert("There were some singular verbs but no singular nouns to match!");
			remindVerbMarks = true;
			foundSomething = true;
		}
		
		if ((nouns.length > 0 || properNouns.length > 0 || pronouns[2] || pronouns[3]) && verbs.length === 0)
		{
			alert("There were some singular nouns but no singular verbs to match!");
			remindVerbMarks = true;
			foundSomething = true;
		}
		
		if (pluralNouns.length === 0 && !pronouns[0] && !pronouns[1] && !pronouns[4] && !pronouns[5] && !pronouns[6] && pluralVerbs.length > 0)
		{
			alert("There were some plural verbs but no plural nouns to match!");
			remindVerbMarks = true;
			foundSomething = true;
		}
		
		if (pluralVerbs.length === 0 && (pronouns[0] || pronouns[1] || pronouns[4] || pronouns[5] || pronouns[6] || pluralNouns.length > 0))
		{
			alert("There were some plural nouns but no plural verbs to match!");
			remindVerbMarks = true;
			foundSomething = true;
		}
		
		if (remindVerbMarks)
		{
			alert("Remember: Verbs are singular or plural based on what you can conjugate them with, so 'jumps' for example would be plural," +
					" because sentences like 'the cat jumps' make sense. Some pronouns are irregular though. The word 'I' is conjugated" +
					" differently. So, when you mark your verbs singular or plural, check them with nouns that aren't pronouns like" +
					" 'the desk' or 'the skunks'!");
		}
		
		//Nothing found
		if (!foundSomething)
		{
			alert("No common problems found. Please check the word type markings.")
		}
	}
	
	/**SECTION: Main function**/
	//Sentence array declaration
	var sentences = [];
	
	//First pass - generates simple phrases
	SNPs = generateNPs(true);
	PNPs = generateNPs(false);
	SVPs = generateVPs(true);
	PVPs = generateVPs(false);
	IPs = generateIPs();
	
	//Clean up repetition of noun phrases
	cleanup(SNPs);
	cleanup(PNPs);
	
	//Extra passes - complex constructions
	for (var c=0; c<complexityValue; c++)
	{
		//Generate compound noun phrases
		if (allowCompoundNPs)
		{
			PNPs = PNPs.concat(generateCompoundNPs());
		}
		
		//Generate verb phrases with direct objects
		if (allowDirectObjects)
		{
			SVPs = SVPs.concat(generateDOVPs(verbs));
			PVPs = PVPs.concat(generateDOVPs(pluralVerbs));
		}
		
		//Generate prepositional phrases
		PPs = generatePPs();
		
		//Generate prepositional noun phrases
		if (allowPrepositionalNPs)
		{
			SNPs = SNPs.concat(generatePrepositionals(SNPs));
			PNPs = PNPs.concat(generatePrepositionals(PNPs));
		}
		
		//Generate prepositional verb phrases
		if (allowPrepositionalVPs)
		{
			SVPs = SVPs.concat(generatePrepositionals(SVPs));
			PVPs = PVPs.concat(generatePrepositionals(PVPs));
		}
		
		//Clean up again after each iteration to prevent the array from getting too large
		cleanup(SNPs);
		cleanup(PNPs);
	}
	
	//Generate sentences, and cleanup to avoid noun phrase repetition
	if (genStatements) sentences = sentences.concat(generateStatements());
	
	if (genQuestions) sentences = sentences.concat(generateQuestions());
	
	if (genCommands) sentences = sentences.concat(generateCommands());
	
	//Final cleanup of noun phrase repetition
	cleanup(sentences);
	
	if (sentences.length < 1 && confirm("No sentences generated. Want to try to find out why?"))
	{
		evaluate();
	}
	
	return sentences;
}