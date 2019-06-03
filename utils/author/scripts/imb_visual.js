/* iMapBook Visual Editor
 *
 */
	//globals
	var mousedown_x = 0; //Stores the X coordinate when left mouse button is clicked
	var mousedown_y = 0; //Stores the X coordinate when left mouse button is clicked
	var mouseup_x = 0; //Stores the X coordinate when left mouse button is clicked
	var mouseup_y = 0; //Stores the X coordinate when left mouse button is clicked	
	var isMouseDown = false; //used to store the state of the left mouse button, whether it is down state or not.
	var isObjectBeingDrag = false;	//used to store whether a draggable object is being dragged so that it doesn't interfere with the other mouse events.
	var isWorkingHotspotResponse = false; //used to store whether the user is finished working with the current hotspot response.  This is necessary to determine whether an addition hotspot click should add a word to the current response or should a new hotspot response be created.
	var active_object_group = ""; //stores the id on the open/active panel amoung the object groups
	var global_icon = "None";
	var global_opacity = 100;

// **************************************************************************************************************************************************************************************************
// Interactive Image Object Tool
// **************************************************************************************************************************************************************************************************

//-------------------------------------------------------------------------------------------------------------------------------------------------------------
// This function is called when user clicks the button to enter the visual image object editor which is under the state collapsible.
//-------------------------------------------------------------------------------------------------------------------------------------------------------------					
function transition_to_image_object_editor() {	
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[page.state_list_idx]; // current state
	$("#confirmed_vi_responses").empty(); //clear all previously created image objects
	$.mobile.changePage("#image_tool", { transition: "pop"});
	var display_object = "#imb_game_display_image_visual_tool"; //state image area
	//display image with containers and hotspots and draggable objects ------------------------------------------------------
	$(display_object).empty(); // clear any objects
	$(display_object).css("background-image", "url()"); // clear the image
	$(display_object).append('<div id="drag_box"></div><div id="temp_box"></div>'); //place holder for the visual feedback boxes when dragging a working object in the visual editor.
	// display image and hot spots
	if (state.image.file_name != '') { // display image
		$(display_object).css("background-image", "url(data/books/" + book.location + "/" + encodeURI(state.image.file_name) + ")");
	}
	// display objects
	$.each(state.image.container_list, function(idx, container) {
		loop_val = container.loop;
		count_val = container.count;
		lock_val = container.lock;
		obj_group = "cont" + idx;		
		var html = '<h3 id="header_cont' + idx + '" class="cont" obj_group="cont' + idx + '">Container' + (idx+1) +
					'<div class="c5_accordion show_btn_font"><a obj_group="cont" id="imb_cont_show' + idx + '" class="accord_show_btn" onclick="toggle_show_btn(id)" data-role="button" data-icon="star" data-iconpos="notext" data-theme="e"></a></div>'+
					'<div class="c4_accordion"><div obj_group="cont" id="delete_object_group_btn' + idx + '" onclick="delete_object_group(this);" data-role="button" data-icon="delete" data-inline="true" data-iconpos="notext"></div></div>'+
					'<div class="c1_accordion"><input data-mini="true" id="loop_cont' + idx + '" type="text" value="0"/></div><div class="c2_accordion">Loop</div> '+
					'<div class="c1_accordion"><input data-mini="true" id="count_cont' + idx + '" type="text" value="1"/></div><div class="c2_accordion">Count</div> '+ 
					'<div class="c3_accordion">'+
									'<select data-mini="true" id="lock_cont' + idx + '" data-role="slider">'+
										'<option value="n">No</option>'+
										'<option value="y">Yes</option>'+
									'</select>'+
					'</div>'+				
					'<div class="c2_accordion">Lock</div> '+
					'</h3>'+
						'<div id="content_cont' + idx + '" obj_group="cont' + idx + '"></div>';
		$("#confirmed_vi_responses").append(html);
		$("#loop_" + obj_group).val(loop_val);
		$("#count_" + obj_group).val(count_val);	
		$("#lock_" + obj_group).val(lock_val);
		var header_html = '<div id="vi_cont_header' + idx + '" class="bw">'+
								'<div class="c2"><div class="vi_header_labels">Action Text</div></div>'+
								'<div class="c3"><div class="vi_header_labels">Icon</div></div>'+
								'<div class="c6"><div class="vi_header_labels">Opacity</div></div>'+
								'<div class="c7"><div class="vi_header_labels">X</div></div>'+
								'<div class="c8"><div class="vi_header_labels">Y</div></div>'+	
								'<div class="c9"><div class="vi_header_labels">W</div></div>'+	
								'<div class="c10"><div class="vi_header_labels">H</div></div>'+										
							'</div>'+												
							'<hr>';
		$("#content_cont" + idx).append(header_html);								
		$.each(container.frame_list, function(idx2) {
			objtype_xml = "3";
			icon_xml = ($(this).attr('file_name') == '') ? "None" : $(this).attr('file_name');
			opacity_xml = $(this).attr('opacity');
			x_per_xml = $(this).attr('xloc');
			y_per_xml = $(this).attr('yloc');
			w_per_xml = $(this).attr('width');
			h_per_xml = $(this).attr('height');
			action_text_xml = $(this).attr('word');
			count_xml = $(this).attr('count');
			lock_xml = $(this).attr('lock');						
			//insert image object into the confirmed object list with the parameters from XML (container_list array)
			confirm_interactive_image_object(0,objtype_xml,icon_xml,opacity_xml,x_per_xml,y_per_xml,w_per_xml,h_per_xml,action_text_xml,"",false, "", idx);
		});
	});	
	$.each(state.image.draggable_list, function(idx, draggable) {
		loop_val = draggable.loop;
		clone_val = draggable.clone;
		obj_group = "drag" + idx;
		var html = '<h3 id="header_drag' + idx + '" class="drag" obj_group="drag' + idx + '">Draggable' + (idx+1) +
						'<div class="c5_accordion show_btn_font"><a obj_group="drag" id="imb_drag_show' + idx + '" class="accord_show_btn" onclick="toggle_show_btn(id)" data-role="button" data-icon="star" data-iconpos="notext" data-theme="e"></a></div>'+
						'<div class="c4_accordion"><div obj_group="drag" id="delete_object_group_btn' + idx + '" onclick="delete_object_group(this);" data-role="button" data-icon="delete" data-inline="true" data-iconpos="notext"></div></div>'+
						'<div class="c1_accordion"><input data-mini="true" id="loop_drag' + idx + '" type="text" value="0"/></div><div class="c2_accordion">Loop</div> '+
						'<div class="c3_accordion">'+
								'<select data-mini="true" id="clone_drag' + idx + '" data-role="slider">'+
									'<option value="n">No</option>'+
									'<option value="y">Yes</option>'+
								'</select>'+
						'</div>'+				
						'<div class="c2_accordion">Clone</div> '+
					'</h3>'+
						'<div id="content_drag' + idx + '" obj_group="drag' + idx + '"></div>';
		$("#confirmed_vi_responses").append(html);
		$("#loop_" + obj_group).val(loop_val);
		$("#clone_" + obj_group).val(clone_val);
		var header_html = '<div id="vi_drag_header' + idx + '" class="bw">'+
								'<div class="c2"><div class="vi_header_labels">Action Text</div></div>'+
								'<div class="c3"><div class="vi_header_labels">Icon</div></div>'+
								'<div class="c6"><div class="vi_header_labels">Opacity</div></div>'+
								'<div class="c7"><div class="vi_header_labels">X</div></div>'+
								'<div class="c8"><div class="vi_header_labels">Y</div></div>'+	
								'<div class="c9"><div class="vi_header_labels">W</div></div>'+	
								'<div class="c10"><div class="vi_header_labels">H</div></div>'+									
							'</div>'+												
							'<hr>';
		$("#content_drag" + idx).append(header_html);								
		$.each(draggable.frame_list, function(idx2) {
			objtype_xml = "2";
			icon_xml = ($(this).attr('file_name') == '') ? "None" : $(this).attr('file_name');
			opacity_xml = $(this).attr('opacity');
			x_per_xml = $(this).attr('xloc');
			y_per_xml = $(this).attr('yloc');
			w_per_xml = $(this).attr('width');
			h_per_xml = $(this).attr('height');
			action_text_xml = $(this).attr('word');
			clone_xml = $(this).attr('clone');
			//insert image object into the confirmed object list with the parameters from XML (draggable_list array)
			confirm_interactive_image_object(0,objtype_xml,icon_xml,opacity_xml,x_per_xml,y_per_xml,w_per_xml,h_per_xml,action_text_xml,"",false, "", idx);
		});
	});					
	$.each(state.image.hotspot_list, function(idx, hotspot) {
		loop_val = hotspot.loop;
		obj_group = "hot" + idx;
		var html = '<h3 id="header_hot' + idx + '" class="hot" obj_group="hot' + idx + '">Hotspot' + (idx+1) +
						'<div class="c5_accordion show_btn_font"><a obj_group="hot" id="imb_hot_show' + idx + '" class="accord_show_btn" onclick="toggle_show_btn(id)" data-role="button" data-icon="star" data-iconpos="notext" data-theme="e"></a></div>'+
						'<div class="c4_accordion"><div obj_group="hot" id="delete_object_group_btn' + idx + '" onclick="delete_object_group(this);" data-role="button" data-icon="delete" data-inline="true" data-iconpos="notext"></div></div>'+
						'<div class="c1_accordion"><input data-mini="true" id="loop_hot' + idx + '" type="text" value="0"/></div><div class="c2_accordion">Loop</div> '+		
					'</h3>'+
						'<div id="content_hot' + idx + '" obj_group="hot' + idx + '"></div>';
		$("#confirmed_vi_responses").append(html);
		$("#loop_" + obj_group).val(loop_val);		
		var header_html = '<div id="vi_hot_header' + idx + '" class="bw">'+
								'<div class="c2"><div class="vi_header_labels">Action Text</div></div>'+
								'<div class="c3"><div class="vi_header_labels">Icon</div></div>'+
								'<div class="c6"><div class="vi_header_labels">Opacity</div></div>'+
								'<div class="c7"><div class="vi_header_labels">X</div></div>'+
								'<div class="c8"><div class="vi_header_labels">Y</div></div>'+	
								'<div class="c9"><div class="vi_header_labels">W</div></div>'+	
								'<div class="c10"><div class="vi_header_labels">H</div></div>'+									
							'</div>'+												
							'<hr>';
		$("#content_hot" + idx).append(header_html);						
		$.each(hotspot.frame_list, function(idx2) {
			objtype_xml = "1";
			icon_xml = ($(this).attr('file_name') == '') ? "None" : $(this).attr('file_name');
			opacity_xml = $(this).attr('opacity');
			x_per_xml = $(this).attr('xloc');
			y_per_xml = $(this).attr('yloc');
			w_per_xml = $(this).attr('width');
			h_per_xml = $(this).attr('height');
			action_text_xml = $(this).attr('word');
			popup_text_xml = $(this).attr('text');
			//insert image object into the confirmed object list with the parameters from XML (hotspot_list array)
			confirm_interactive_image_object(0,objtype_xml,icon_xml,opacity_xml,x_per_xml,y_per_xml,w_per_xml,h_per_xml,action_text_xml,popup_text_xml, false, "", idx);
		});			
	});	
	$("#working_object_type_drop").change(); //trigger the change event so that the count and clone/lock form elements are disabled or enabled based on the type of object.
	
	if ($("#confirmed_vi_responses").hasClass("ui-accordion")) { //test if accordion already exsists
		$("#confirmed_vi_responses").accordion("refresh");
	}	
	else {
		$("#confirmed_vi_responses").accordion({
			heightStyle: "content", 
			event: "mouseenter mouseleave click",
			create: function(event, ui) {
				active_object_group = ui.panel.attr("obj_group");
				$("#" + ui.panel.attr("id") + " .confirmed_object_row").each(function(index) { //loop through confirmed objects of active panel
					idx = get_numbers($(this).attr("id"));
					$("#confirmed_display_object" + idx).addClass("yellow_border");
					if ($("#object_opacity_w" + idx).val() < 30) {
						$("#confirmed_display_object" + idx).addClass("minimum_opacity");
					}
				});
			},
			beforeActivate: function(event, ui) {
				var event_type = "";
				if(event.handleObj) {
					event_type = event.handleObj.origType;
				}
				if (event_type == "mouseenter"){
					event.preventDefault();
					$("#" + ui.newPanel.attr("id") + " .confirmed_object_row").each(function(index) { //loop through confirmed objects of panel that was clicked
						idx = get_numbers($(this).attr("id"));
						$("#confirmed_display_object" + idx).addClass("green_border");
						if ($("#object_opacity_w" + idx).val() < 30) {
						$("#confirmed_display_object" + idx).addClass("minimum_opacity");
				}
					});
					return false;
				}
				else if (event_type == "mouseleave") {
					event.preventDefault();
					$("#" + ui.newPanel.attr("id") + " .confirmed_object_row").each(function(index) { //loop through confirmed objects of panel that was clicked
						idx = get_numbers($(this).attr("id"));
						$("#confirmed_display_object" + idx).removeClass("green_border minimum_opacity");
					});				
					return false;
				}
				else {
					$("#" + ui.newPanel.attr("id") + " .confirmed_object_row").each(function(index) { //loop through confirmed objects of panel that was clicked
						idx = get_numbers($(this).attr("id"));
						$("#confirmed_display_object" + idx).removeClass("green_border minimum_opacity");
						$("#confirmed_display_object" + idx).addClass("yellow_border");
					});								
				}
			}
		});
	}
}	

//-------------------------------------------------------------------------------------------------------------------------------------------------------------
// Event Listeners for Interactive Object Editor
//-------------------------------------------------------------------------------------------------------------------------------------------------------------		
$(document).ready(function() {
	
	$("#confirmed_vi_responses").on("accordionactivate", function(event, ui) { //fire when a panel in the accordion is activated		
		active_object_group = ui.newPanel.attr("obj_group");
		$(".work_obj").remove(); // remove any working objects (in case any exist), each time a panel is activated	
		$(".frame_number").remove(); // remove any frame numbers
		$("#drag_box").css('height', 0);	
		$("#drag_box").css('width', 0);	
		$("#" + ui.newPanel.attr("id") + " .confirmed_object_row").each(function(index) { //loop through confirmed objects of panel that was clicked
			idx = get_numbers($(this).attr("id"));
			$("#confirmed_display_object" + idx).addClass("yellow_border");
			$("#confirmed_display_object" + idx).append('<span class="frame_number">' + (index+1) + '</span>')
			if ($("#object_opacity_w" + idx).val() < 30) {
				$("#confirmed_display_object" + idx).addClass("minimum_opacity");
			}
		});
		$("#" + ui.oldPanel.attr("id") + " .confirmed_object_row").each(function(index) { //loop through confirmed objects of panel that was open before user clicked on new panel
			idx = get_numbers($(this).attr("id"));
			$("#confirmed_display_object" + idx).removeClass("yellow_border minimum_opacity");
		});		
	});
	
	$("#confirmed_vi_responses").on("change", ".obj_dim", function(event) {// if any input box or select list is changed, this will trigger and update the display
		changed_element_id = $(this).attr("id");
		objtype_group = $(this).attr("obj_group");
		update_confirmed_object(changed_element_id, objtype_group);
	});
	
	$("#confirmed_vi_responses").on("click", ".obj_dim", function(event) { // highlights the text inside the input boxsfor the user to make it easier and faster to change values
		$(this).select();
	});
	
	$("#confirmed_vi_responses").on("click", ".delete_obj", function(event) { // deletes a confirmed response when the user clicks the "X" icon in the response list.
		idx = get_numbers($(this).attr("id")); //gets the number id of element that was clicked, so that we will know which confirmed row to delete.
		delete_single_confirmed_object(idx);
	});
	
	$("#imb_game_display_image_visual_tool").mousemove(function(event) { //event listener for mousemovement on the state image area. It displays the temp_box, which is designed to give the user visual feedback when dragging to create an image object
		if(isMouseDown && isObjectBeingDrag == false){
			mouseup_x = event.pageX - $('#imb_game_display_image_visual_tool').offset().left;
			mouseup_y = event.pageY - $('#imb_game_display_image_visual_tool').offset().top;
			//after the mouse click down, decides whether that click point should be the top left, top right, bottom left, bottom right corner of the temp_box
			if (mousedown_x <= mouseup_x) {
				left_bound = mousedown_x;
				box_width = mouseup_x - left_bound;			
			}
			else {
				left_bound = mouseup_x;
				box_width = mousedown_x - left_bound;			
			}		
			if (mousedown_y <= mouseup_y) {
				top_bound = mousedown_y;
				box_height = mouseup_y - top_bound;
			}
			else {
				top_bound = mouseup_y;
				box_height = mousedown_y - top_bound;			
			}					
			$("#temp_box").css('left', left_bound);	
			$("#temp_box").css('top', top_bound);		
			$("#temp_box").css('height', box_height);	
			$("#temp_box").css('width', box_width);		
		}
	});
		
	$("#imb_game_display_image_visual_tool").mousedown(function(event) { //event listener for mouse down event when in the interactive image object editor tool
		isMouseDown = true;
		mousedown_x = 0;
		mousedown_y = 0;
		mouseup_x = 0;
		mouseup_y = 0;
		$("#temp_box").css('width', '');
		$("#temp_box").css('height', '');
		$("#drag_box").css('width', '');
		$("#drag_box").css('height', '');					
		mousedown_x = event.pageX - $('#imb_game_display_image_visual_tool').offset().left;
		mousedown_y = event.pageY - $('#imb_game_display_image_visual_tool').offset().top;
	});
		
	$("body").mouseup(function(event) { //event listener for mouse up event to make sure it sets the isMouseDown flag even if user lifts mouse button outside state image area
		isMouseDown = false;
		if(mousedown_x == mouseup_x) { 
			$("#drag_box").css('width', '');
			$("#drag_box").css('height', '');
		}			
	});
		
	$("#imb_game_display_image_visual_tool").mouseup(function(event) { //event listener for mouse up event when in the interactive image object editor tool
		if(isObjectBeingDrag == false) {
			$("#temp_box").css('width', '');
			$("#temp_box").css('height', '');		
			mouseup_x = event.pageX - $('#imb_game_display_image_visual_tool').offset().left;
			mouseup_y = event.pageY - $('#imb_game_display_image_visual_tool').offset().top;
			box_width_percent = 0;
			//after the mouseup, decides whether the mousedown click point should be the top left, top right, bottom left, bottom right corner of the temp_box
			if (mousedown_x <= mouseup_x) {
				left_bound = mousedown_x;
				box_width = mouseup_x - left_bound;
			}
			else {
				left_bound = mouseup_x;
				box_width = mousedown_x - left_bound;				
			}		
			if (mousedown_y <= mouseup_y) {
				top_bound = mousedown_y;
				box_height = mouseup_y - top_bound;				
			}
			else {
				top_bound = mouseup_y;
				box_height = mousedown_y - top_bound;					
			}			
			$("#drag_box").css('left', left_bound);	
			$("#drag_box").css('top', top_bound);		
			$("#drag_box").css('height', box_height);	
			$("#drag_box").css('width', box_width);	
			current_img_height = $("#imb_game_display_image_visual_tool").height();	
			current_img_width = $("#imb_game_display_image_visual_tool").width();
			yloc_percent = ((top_bound) / current_img_height) * 100;	
			xloc_percent = ((left_bound) / current_img_width) * 100;
			box_height_percent =  (box_height / current_img_height) * 100;
			box_width_percent =  (box_width / current_img_width) * 100;	
			working_html = '<div id="working_object_' + active_object_group + '" class="work_obj" obj_group="' + active_object_group + '">'+
								'<div class="c2"><input data-theme="e" data-mini="true" id="object_action_text_w_' + active_object_group + '" type="text"></input></div>'+ 
								'<div class="c3">'+
									'<a href="#" data-role="button" data-mini="true" id="imb_image_image_' + active_object_group + '" obj_group="' + active_object_group + '" class="imb_media_btn">' + global_icon + '</a>'+
								'</div>'+ 
								'<div class="c6"><input data-theme="a" data-mini="true" id="object_opacity_w_' + active_object_group + '" type="text" value="' + global_opacity + '"></input></div> '+		
								'<div class="c7"><input data-mini="true" id="x_per_' + active_object_group + '" type="text" value="37"/></div> '+
								'<div class="c8"><input data-mini="true" id="y_per_' + active_object_group + '" type="text" value="37"/></div> '+
								'<div class="c9"><input data-mini="true" id="w_per_' + active_object_group + '" type="text" value="20"/></div> '+
								'<div class="c10"><input data-mini="true" id="h_per_' + active_object_group + '" type="text" value="20"/></div>'+
								'<div class="c11"><div id="confirm_obj_btn_' + active_object_group + '" onclick="confirm_interactive_image_object()" class="confirm_obj" data-theme="e" data-role="button" data-icon="plus" data-inline="true" data-iconpos="notext"></div></div>'+								
							'</div>';				
			element = "#working_object_" + active_object_group;
			if ($(element).length != 0) {
				global_icon = $('#imb_image_image_' + active_object_group).children('.ui-btn-inner').children('.ui-btn-text').text();
				global_opacity = $('#object_opacity_w_' + active_object_group).val();
				$(element).remove();
			}
			$("#content_" + active_object_group).prepend(working_html);
			$("#confirmed_vi_responses").trigger('create');
			
			if (box_width_percent <=1 && box_height_percent <=1) { //set the working object height and width back to the defaults when a user has not created an image object of sufficient size.
				$('#x_per_' + active_object_group).val(37);
				$('#y_per_' + active_object_group).val(37);
				$('#w_per_' + active_object_group).val(20);
				$('#h_per_' + active_object_group).val(20);
			}
			else {
				$('#x_per_' + active_object_group).val(xloc_percent);
				$('#y_per_' + active_object_group).val(yloc_percent);
				$('#w_per_' + active_object_group).val(box_width_percent);
				$('#h_per_' + active_object_group).val(box_height_percent);	
			}
		}
	});					
}); //close document ready function.			

function add_object_group() {//adds an object group based on the type specificed in the dropdown menu.
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[page.state_list_idx]; // current state
	var objtype = $('#working_object_type_drop').val();
	switch (objtype) {
			case "1": // hotspot
				var idx = (max_id_num("hot")) + 1; // loops through all hotspots and find the largest id number, then will use this to assign the next id to plus 1 so no overlap.
				active_object_group = "hot" + idx;  // the newly adding object group will not be the active_object_group
				var html = '<h3 id="header_hot' + idx + '" class="hot" obj_group="hot' + idx + '">Hotspot' + (idx+1) + 
								'<div class="c4_accordion"><div obj_group="hot" id="delete_object_group_btn' + idx + '" onclick="delete_object_group(this);" data-role="button" data-icon="delete" data-inline="true" data-iconpos="notext"></div></div>'+
								'<div class="c1_accordion"><input data-mini="true" id="loop_hot' + idx + '" type="text" value="0"/></div><div class="c2_accordion">Loop</div> '+
							'</h3>'+		
							'<div id="content_hot' + idx + '" obj_group="hot' + idx + '"></div>'; 
				$("#confirmed_vi_responses").prepend(html);
				var header_html = '<div id="vi_hot_header' + idx + '" class="bw">'+
								'<div class="c2"><div class="vi_header_labels">Action Text</div></div>'+
								'<div class="c3"><div class="vi_header_labels">Icon</div></div>'+
								'<div class="c6"><div class="vi_header_labels">Opacity</div></div>'+
								'<div class="c7"><div class="vi_header_labels">X</div></div>'+
								'<div class="c8"><div class="vi_header_labels">Y</div></div>'+	
								'<div class="c9"><div class="vi_header_labels">W</div></div>'+	
								'<div class="c10"><div class="vi_header_labels">H</div></div>'+									
							'</div>'+												
							'<hr>';
				$("#content_hot" + idx).append(header_html);							
				$("#confirmed_vi_responses").accordion('refresh');
				confirm_interactive_image_object(0, "1", "None", 100, 37, 37, 20, 20, "", "", false, "", idx)
			break;
			case "2": // draggable
				var idx = (max_id_num("drag")) + 1; // loops through all draggables and find the largest id number, then will use this to assign the next id to plus 1 so no overlap.
				active_object_group = "drag" + idx;  // the newly adding object group will not be the active_object_group
				var html = '<h3 id="header_drag' + idx + '" class="drag" obj_group="drag' + idx + '">Draggable' + (idx+1) + 
								'<div class="c4_accordion"><div obj_group="drag" id="delete_object_group_btn' + idx + '" onclick="delete_object_group(this);" data-role="button" data-icon="delete" data-inline="true" data-iconpos="notext"></div></div>'+
								'<div class="c1_accordion"><input data-mini="true" id="loop_drag' + idx + '" type="text" value="0"/></div><div class="c2_accordion">Loop</div> '+
								'<div class="c3_accordion">'+
										'<select data-mini="true" id="clone_drag' + idx + '" data-role="slider">'+
											'<option value="n">No</option>'+
											'<option value="y">Yes</option>'+
										'</select>'+
								'</div>'+				
								'<div class="c2_accordion">Clone</div> '+
							'</h3>'+
							'<div id="content_drag' + idx + '" obj_group="drag' + idx + '"></div>'; 
				$("#confirmed_vi_responses").prepend(html);
				var header_html = '<div id="vi_drag_header' + idx + '" class="bw">'+
								'<div class="c2"><div class="vi_header_labels">Action Text</div></div>'+
								'<div class="c3"><div class="vi_header_labels">Icon</div></div>'+
								'<div class="c6"><div class="vi_header_labels">Opacity</div></div>'+
								'<div class="c7"><div class="vi_header_labels">X</div></div>'+
								'<div class="c8"><div class="vi_header_labels">Y</div></div>'+	
								'<div class="c9"><div class="vi_header_labels">W</div></div>'+	
								'<div class="c10"><div class="vi_header_labels">H</div></div>'+									
							'</div>'+												
							'<hr>';
				$("#content_drag" + idx).append(header_html);				
				$("#confirmed_vi_responses").accordion('refresh');	
				confirm_interactive_image_object(0, "2", "None", 100, 37, 37, 20, 20, "", "", false, "", idx)				
			break;
			case "3": // container
				var idx = (max_id_num("cont")) + 1; // loops through all containers and find the largest id number, then will use this to assign the next id to plus 1 so no overlap.
				active_object_group = "cont" + idx;  // the newly adding object group will not be the active_object_group
				var html = '<h3 id="header_cont' + idx + '" class="cont" obj_group="cont' + idx + '">Container' + (idx+1) + 
								'<div class="c4_accordion"><div obj_group="cont" id="delete_object_group_btn' + idx + '" onclick="delete_object_group(this);" data-role="button" data-icon="delete" data-inline="true" data-iconpos="notext"></div></div>'+
								'<div class="c1_accordion"><input data-mini="true" id="loop_cont' + idx + '" type="text" value="0"/></div><div class="c2_accordion">Loop</div> '+
								'<div class="c1_accordion"><input data-mini="true" id="count_cont' + idx + '" type="text" value="1"/></div><div class="c2_accordion">Count</div> '+ 
								'<div class="c3_accordion">'+
												'<select data-mini="true" id="lock_cont' + idx + '" data-role="slider">'+
													'<option value="n">No</option>'+
													'<option value="y">Yes</option>'+
												'</select>'+
								'</div>'+				
								'<div class="c2_accordion">Lock</div> '+				
							'</h3>'+
							'<div id="content_cont' + idx + '" obj_group="cont' + idx + '"></div>'; 
				$("#confirmed_vi_responses").prepend(html);
				var header_html = '<div id="vi_cont_header' + idx + '" class="bw">'+
								'<div class="c2"><div class="vi_header_labels">Action Text</div></div>'+
								'<div class="c3"><div class="vi_header_labels">Icon</div></div>'+
								'<div class="c6"><div class="vi_header_labels">Opacity</div></div>'+
								'<div class="c7"><div class="vi_header_labels">X</div></div>'+
								'<div class="c8"><div class="vi_header_labels">Y</div></div>'+	
								'<div class="c9"><div class="vi_header_labels">W</div></div>'+	
								'<div class="c10"><div class="vi_header_labels">H</div></div>'+									
							'</div>'+												
							'<hr>';
				$("#content_cont" + idx).append(header_html);					
				$("#confirmed_vi_responses").accordion('refresh');
				if ($("h3").length == 1) {
					$("#confirmed_vi_responses").accordion("option","active",0);
				}	
				confirm_interactive_image_object(0, "3", "None", 100, 37, 37, 20, 20, "", "", false, "", idx)		
			default:
				console.log("ERROR! objtype:" + objtype);
			break;
		}
}

//-------------------------------------------------------------------------------------------------------------------------------------------------------------
// This function is called when user confirms the working placed object.  It writes the object information to the page/grid in the confirmed responses section
//-------------------------------------------------------------------------------------------------------------------------------------------------------------

//IsWorkingObject tells whether the image object already exsists from the XML or whether it was created with the WYSIWYG ---- 0 = Non WYSIWYG; 1 = WYSIWYG working object;
function confirm_interactive_image_object(IsWorkingObject,objtype_xml,icon_xml,opacity_xml,x_per_xml,y_per_xml,w_per_xml,h_per_xml,action_text_xml,popup_text_xml, IsConfirmed, idx_from_event,idx_content_div) {    
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[page.state_list_idx]; // current state
	var form = $(this).closest("form"); // parent form
	if ($("#confirmed_vi_responses").find(".confirmed_object_row").length < 1) { //see how many confirmed rows there are, if it is the first confirmed row, then set idx to 0, else compute what the idx should be.
		idx = 0;
	}
	else {
		idx = parseInt(max_id_num("confirmed_object_row")) + 1; //find the largest confirm object row and then add 1, which sets the idx of the new confirmed image object.
	}
	if(IsConfirmed == true) { //only used if the object is being updated (i.e. it was already previously confirmed)
		idx = idx_from_event; //sets the idx to the id of the object that was being modified by the event.
	}
	else {
		if (objtype_xml == undefined) { //if object type does not come from the function parameter, then use the active object group variable to determin
			objtype_name = get_letters(active_object_group);
			objtype_xml = convert_objtypes("name", objtype_name);
			idx_content_div = get_numbers(active_object_group);
		}
		var obj_type_selector = "";
		var objtype_group = ""; // stored the id name of the object group, which will be used later to help identify which object group the frame belongs to.
		switch (objtype_xml) {
			case "1": // hotspot
				obj_type_selector = "#content_hot";
				objtype_group = "hot" + idx_content_div;
			break;
			case "2": // draggable
				obj_type_selector = "#content_drag";
				objtype_group = "drag" + idx_content_div;				
			
			break;
			case "3": // container
				obj_type_selector = "#content_cont";
				objtype_group = "cont" + idx_content_div;	
			break;
			default:
				console.log("ERROR! objtype:" + objtype_xml);
			break;
		}
		var io = '<div id="confirmed_response' + idx + '" obj_group="' + objtype_group + '" class="confirmed_object_row objtype' + objtype_xml + '">' + 
					'<div class="popup_text_hide"><input obj_group="' + objtype_group + '" id="popup_text' + idx + '" type="text" class="popup_text"></input></div>' +
					'<div class="c2"><input data-theme="e" data-mini="true" obj_group="' + objtype_group + '" id="object_action_text_w' + idx + '" type="text"></input></div> '+
					'<div class="c3"><a href="#" data-role="button" data-mini="true" obj_group="' + objtype_group + '" id="imb_image_image' + idx + '" obj_group="' + objtype_group + '" class="imb_media_btn">None</a></div> '+			
					'<div class="c6"><input class="obj_dim" data-theme="a" data-mini="true" obj_group="' + objtype_group + '" id="object_opacity_w' + idx + '" type="text" value="20"></input></div> '+		
					'<div class="c7"><input class="obj_dim" data-mini="true" obj_group="' + objtype_group + '" id="x_per' + idx + '" type="text" value=""/></div> '+
					'<div class="c8"><input class="obj_dim" data-mini="true" obj_group="' + objtype_group + '" id="y_per' + idx + '" type="text" value=""/></div> '+
					'<div class="c9"><input class="obj_dim" data-mini="true" obj_group="' + objtype_group + '" id="w_per' + idx + '" type="text" value=""/></div> '+
					'<div class="c10"><input class="obj_dim" data-mini="true" obj_group="' + objtype_group + '" id="h_per' + idx + '" type="text" value=""/></div> '+
					'<div class="c11"><div obj_group="' + objtype_group + '" id="delete_obj_btn' + idx + '" class="delete_obj" data-role="button" data-icon="delete" data-inline="true" data-iconpos="notext"></div></div>'+
					'<div class="c12 show_btn_font"><a id="imb_show' + idx + '" onclick="toggle_show_btn(id)" data-role="button" data-icon="star" data-iconpos="notext" data-theme="e"></a>' +
				'</div>';
		$(obj_type_selector + idx_content_div).append(io);
	}
	
	if (IsWorkingObject == 0) { //if image object came from the XML or is already confirmed
		objtype = objtype_xml // type of an image object to be confirmed
		action_text = action_text_xml;
		icon = icon_xml; 
		opacity = opacity_xml;
		x_per = x_per_xml;
		y_per = y_per_xml;
		w_per = w_per_xml;
		h_per = h_per_xml;
		popup_text = popup_text_xml;	
		
		$('#confirmed_object_type_drop' + idx).val(objtype);
		$('#object_action_text_w' + idx).val(action_text);	
		$("#imb_image_image" + idx).replaceWith('<a href="#" data-role="button" data-mini="true" id="imb_image_image' + idx + '" obj_group="' + objtype_group + '" class="imb_media_btn">' + icon +'</a>')	
		$('#object_opacity_w' + idx).val(opacity);
		$('#x_per' + idx).val(x_per);
		$('#y_per' + idx).val(y_per);
		$('#w_per' + idx).val(w_per);
		$('#h_per' + idx).val(h_per);
		$('#popup_text' + idx).val(popup_text);		
		$("#confirmed_vi_responses").trigger('create');	
		display_confirmed_object(idx,objtype_xml,icon_xml,opacity_xml,x_per_xml,y_per_xml,w_per_xml,h_per_xml);
	}
	else { // if image object came from the WYSIWIG editor
		objtype = objtype_xml;
		action_text = $('#object_action_text_w_' + objtype_group).val();
		icon = $('#imb_image_image_' + objtype_group).children('.ui-btn-inner').children('.ui-btn-text').text();
		opacity = $('#object_opacity_w_' + objtype_group).val();
		x_per = $('#x_per_' + objtype_group).val();
		y_per = $('#y_per_' + objtype_group).val();
		w_per = $('#w_per_' + objtype_group).val();
		h_per = $('#h_per_' + objtype_group).val();	
		
		$('#confirmed_object_type_drop' + idx).val(objtype);
		$('#object_action_text_w' + idx).val(action_text);	
		$('#imb_image_image' + idx).text(icon);
		$('#object_opacity_w' + idx).val(opacity);
		$('#x_per' + idx).val(x_per);
		$('#y_per' + idx).val(y_per);
		$('#w_per' + idx).val(w_per);
		$('#h_per' + idx).val(h_per);
		$("#confirmed_vi_responses").trigger('create');		
		display_confirmed_object(idx,objtype,icon,opacity,x_per,y_per,w_per,h_per);
		$("#drag_box").css('height', 0);	
		$("#drag_box").css('width', 0);	
		$("#confirmed_display_object" + idx).addClass("yellow_border");
	}
	element = "#working_object_" + active_object_group; //tests to see if the working object element exsists and then removes it from the DOM if true.
			if ($(element).length != 0) {
				global_icon = $('#imb_image_image_' + active_object_group).children('.ui-btn-inner').children('.ui-btn-text').text();
				global_opacity = $('#object_opacity_w_' + active_object_group).val();
				$(element).remove();
			}	
}		

//-------------------------------------------------------------------------------------------------------------------------------------------------------------
// Updates the display for any change to confirmed objects
//-------------------------------------------------------------------------------------------------------------------------------------------------------------
function update_confirmed_object(id, objtype_group) {
		if (typeof objtype_group == "undefined") {
			return //This is a fix for non-visual-editor calls from the select-button handler.
		}
		idx = get_numbers(id); //gets the number id of element that was changed, so that we will know which confirmed row was modified.
		idx_obj_group = get_numbers(objtype_group);
		name_obj_group = get_letters(objtype_group);
		if (!idx && idx !== 0) {return}; //if value is null or undefined or empty, then exit function.
		$("#confirmed_display_object" + idx).remove();
		var objtype = "";
		switch (name_obj_group) {
			case "hot": // hotspot
				objtype = "1";
			break;
			case "drag": // draggable
				objtype = "2";
			break;
			case "cont": // container
				objtype = "3";			
			break;
			default:
				console.log("ERROR! obj_type_name:" + name_obj_group);
		}
		action_text = $('#object_action_text_w' + idx).val();
		icon = $('#imb_image_image' + idx).children('.ui-btn-inner').children('.ui-btn-text').text();
		opacity = $('#object_opacity_w' + idx).val();
		x_per = $('#x_per' + idx).val();
		y_per = $('#y_per' + idx).val();
		w_per = $('#w_per' + idx).val();
		h_per = $('#h_per' + idx).val();
		popup_text = $('#popup_text' + idx).val();

		confirm_interactive_image_object(0, objtype, icon, opacity, x_per, y_per, w_per, h_per, action_text, popup_text, true, idx)	
}

//-------------------------------------------------------------------------------------------------------------------------------------------------------------
// Displays the confirmed object permanantly to the state image after the user has clicked to confirm the working placement
//-------------------------------------------------------------------------------------------------------------------------------------------------------------
function display_confirmed_object(idx,objtype,icon,opacity,x_per,y_per,w_per,h_per){
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[page.state_list_idx];
	var display_object = "#imb_game_display_image_visual_tool";
	switch (objtype) {
		case "1": // hotspot
			var html = '<div id="confirmed_display_object' + idx + '" class="imb_hotspot"';
			if(icon == 'None') {
				html += ' style="background-color: red; ';
			}
			else {
				html += 'style="background-image:url(data/books/' + book.location + '/' + encodeURI(icon) + ');';
			}
			html += 'opacity:' + (opacity / 100) + '; width:' + (w_per) + '%; height:' + (h_per) + '%;top:' + (y_per) + '%; left:' + (x_per) + '%;">'+
			'</div>';
			$(display_object).append(html);
			$("#confirmed_display_object" + idx).draggable({
				start: function( event, ui ) {
						isObjectBeingDrag = true;
						$(".work_obj").remove(); // remove any working objects rows when user starts dragging an object	
				},
				stop: function( event, ui ) {
						isObjectBeingDrag = false;
						idx = get_numbers($(this).attr("id"));
						left_bound = ui.position.left;
						top_bound = ui.position.top;
						current_img_height = $("#imb_game_display_image_visual_tool").height();	
						current_img_width = $("#imb_game_display_image_visual_tool").width();
						yloc_percent = ((top_bound) / current_img_height) * 100;	
						xloc_percent = ((left_bound) / current_img_width) * 100;
						$('#x_per' + idx).val(xloc_percent);
						$('#y_per'+ idx).val(yloc_percent);
						$(".work_obj").remove(); // remove any working objects rows when user stops dragging an object
				}						
			});
			$("#confirmed_display_object" + idx).resizable({
				start: function( event, ui ) {
						isObjectBeingDrag = true;
						$(".work_obj").remove(); // remove any working objects rows when user starts resizing an object	
				},
				stop: function( event, ui ) {
						isObjectBeingDrag = false;
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
						$(".work_obj").remove(); // remove any working objects rows when user stops resizing an object						
				},
				handles: "n, s, e, w, ne, se, nw, sw"							
			});
		break;
		case "2": // draggable
			$(display_object).append('<div id="confirmed_display_object' + idx + '" class="imb_draggable" style="background-image:url(data/books/' + book.location + '/' + encodeURI(icon) + '); opacity:' + (opacity / 100) + '; width:' + (w_per) + '%; height:' + (h_per) + '%;top:' + (y_per) + '%; left:' + (x_per) + '%;"></div>');
			$("#confirmed_display_object" + idx).draggable({
				start: function( event, ui ) {
						isObjectBeingDrag = true;
						$(".work_obj").remove(); // remove any working objects rows when user starts dragging an object	
				},
				stop: function( event, ui ) {
						isObjectBeingDrag = false;
						idx = get_numbers($(this).attr("id"));
						left_bound = ui.position.left
						top_bound = ui.position.top
						current_img_height = $("#imb_game_display_image_visual_tool").height();	
						current_img_width = $("#imb_game_display_image_visual_tool").width();
						yloc_percent = ((top_bound) / current_img_height) * 100;	
						xloc_percent = ((left_bound) / current_img_width) * 100;
						$('#x_per' + idx).val(xloc_percent);
						$('#y_per'+ idx).val(yloc_percent);
						$(".work_obj").remove(); // remove any working objects rows when user stops dragging an object
				}						
			});
			$("#confirmed_display_object" + idx).resizable({
				start: function( event, ui ) {
						isObjectBeingDrag = true;
						$(".work_obj").remove(); // remove any working objects rows when user starts resizing an object	
				},
				stop: function( event, ui ) {
						isObjectBeingDrag = false;
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
						$(".work_obj").remove(); // remove any working objects rows when user stops resizing an object						
				},
				handles: "n, s, e, w, ne, se, nw, sw"		
			});			
		break;
		case "3": // container
			$(display_object).append('<div data-role="none" id="confirmed_display_object' + idx + '" width="' + (w_per) + '" height="' + (h_per) + '" class="imb_container" style="opacity:' + (opacity / 100) + '; width:' + (w_per) + '%; height:' + (h_per) + '%; top:' + (y_per) + '%; left:' + (x_per) + '%; background-image:url(data/books/' + book.location + '/' + encodeURI(icon) + ');"></div>');
			$("#confirmed_display_object" + idx).draggable({
				start: function( event, ui ) {
						isObjectBeingDrag = true;
						$(".work_obj").remove(); // remove any working objects rows when user starts dragging an object	
				},
				stop: function( event, ui ) {
						isObjectBeingDrag = false;
						idx = get_numbers($(this).attr("id"));
						left_bound = ui.position.left
						top_bound = ui.position.top
						current_img_height = $("#imb_game_display_image_visual_tool").height();	
						current_img_width = $("#imb_game_display_image_visual_tool").width();
						yloc_percent = ((top_bound) / current_img_height) * 100;	
						xloc_percent = ((left_bound) / current_img_width) * 100;
						$('#x_per' + idx).val(xloc_percent);
						$('#y_per'+ idx).val(yloc_percent);
						$(".work_obj").remove(); // remove any working objects rows when user stops dragging an object
				}						
			});
			$("#confirmed_display_object" + idx).resizable({
				start: function( event, ui ) {
						isObjectBeingDrag = true;
						$(".work_obj").remove(); // remove any working objects rows when user starts resizing an object	
				},
				stop: function( event, ui ) {
						isObjectBeingDrag = false;
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
						$(".work_obj").remove(); // remove any working objects rows when user stops resizing an object	
				},
				handles: "n, s, e, w, ne, se, nw, sw"							
			});			
		break;
		default:
			console.log("ERROR! objtype:" + objtype);
		break;
	}
}	

//-------------------------------------------------------------------------------------------------------------------------------------------------------------
// Submits and adds all image objects to the main authoring tool and transitions back
//-------------------------------------------------------------------------------------------------------------------------------------------------------------
function submit_image_objects(){ 
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[page.state_list_idx]; //current_state
	remove_all_current_image_objects(book, page, state);
	$("#confirmed_vi_responses h3").each(function(index) { // loop through all accordian headers, which represent the different object groups (hotspots, draggables, and containers)
		obj_group = $(this).attr('obj_group')
		idx = get_numbers(obj_group); // set the idx based on what object group number the header has associated with it.
		objtype = convert_objtypes("name", get_letters(obj_group));		
		loop = $("#loop_" + obj_group).val();
		count = $("#count_" + obj_group).val();	
		lock = $("#lock_" + obj_group).val();
		clone = $("#clone_" + obj_group).val();		
		switch (objtype) {
			case "1": // hotspot
				var io = new Hotspot(loop); // create new hotspot record 
				state.image.hotspot_list.push(io);
				hotspot = state.image.hotspot_list[(state.image.hotspot_list.length - 1)];
				$("#content_" + obj_group + " .confirmed_object_row").each(function(index2) { // loop through all frames in the specific hotspot group
					idx = get_numbers($(this).attr('id'))
					action_text = $('#object_action_text_w' + idx).val();
					icon = $('#imb_image_image' + idx).children('.ui-btn-inner').children('.ui-btn-text').text();
					opacity = $('#object_opacity_w' + idx).val();
					x_per = $('#x_per' + idx).val();
					y_per = $('#y_per' + idx).val();
					w_per = $('#w_per' + idx).val();
					h_per = $('#h_per' + idx).val();
					popup_text = $('#popup_text' + idx).val();
					var io = new Frame(icon, opacity, x_per, y_per, w_per, h_per, action_text, popup_text); // create new frame record 
					hotspot.frame_list.push(io);
				});
			break;
			case "2": // draggable
				var io = new Draggable(clone, loop); // create new draggable record
				state.image.draggable_list.push(io);
				draggable = state.image.draggable_list[(state.image.draggable_list.length - 1)];
				$("#content_" + obj_group + " .confirmed_object_row").each(function(index2) { // loop through all frames in the specific draggable group
					idx = get_numbers($(this).attr('id'))
					action_text = $('#object_action_text_w' + idx).val();
					icon = $('#imb_image_image' + idx).children('.ui-btn-inner').children('.ui-btn-text').text();
					opacity = $('#object_opacity_w' + idx).val();
					x_per = $('#x_per' + idx).val();
					y_per = $('#y_per' + idx).val();
					w_per = $('#w_per' + idx).val();
					h_per = $('#h_per' + idx).val();
					popup_text = $('#popup_text' + idx).val();
					var io = new Frame(icon, opacity, x_per, y_per, w_per, h_per, action_text, popup_text); // create new frame record 
					draggable.frame_list.push(io);
				});			
			break;
			case "3": // container
				if (icon == 'None') {
					icon = '';
				}				
				var io = new Container(count, lock, loop); // create new container record  ("clone" is actually "lock" in this instance, I was saving space in the GUI interface)
				state.image.container_list.push(io);
				container = state.image.container_list[(state.image.container_list.length - 1)];
				$("#content_" + obj_group + " .confirmed_object_row").each(function(index2) { // loop through all frames in the specific container group
					idx = get_numbers($(this).attr('id'))
					action_text = $('#object_action_text_w' + idx).val();
					icon = $('#imb_image_image' + idx).children('.ui-btn-inner').children('.ui-btn-text').text();
					opacity = $('#object_opacity_w' + idx).val();
					x_per = $('#x_per' + idx).val();
					y_per = $('#y_per' + idx).val();
					w_per = $('#w_per' + idx).val();
					h_per = $('#h_per' + idx).val();
					popup_text = $('#popup_text' + idx).val();
					var io = new Frame(icon, opacity, x_per, y_per, w_per, h_per, action_text, popup_text); // create new frame record 
					container.frame_list.push(io);
				});			
			break;
			default:
				console.log("ERROR! objtype:" + objtype);
			break;
		}
	});
	history.go(-1); //transitions page back to main authoring tool (author.html)
	$("#book").page("destroy").page(); // restyle the ui
	imb_save_flag(2,1);	
	$("#confirmed_vi_responses").empty();
}

//-------------------------------------------------------------------------------------------------------------------------------------------------------------
// Clears all images objects from both the display image and object list
//-------------------------------------------------------------------------------------------------------------------------------------------------------------
function remove_all_current_image_objects(book, page, state) {
	state.image.hotspot_list.length = 0; //empty hotspot array
	state.image.draggable_list.length = 0; //empty draggable array
	state.image.container_list.length = 0;	//empty container array
} 

//-------------------------------------------------------------------------------------------------------------------------------------------------------------
// Returns back to the authoring tool without submitting any objects
//-------------------------------------------------------------------------------------------------------------------------------------------------------------
function return_to_main_authoring_tool_vi(){
	history.go(-1); //transitions page back to main authoring tool (author.html)
	$("#confirmed_vi_responses").empty();
}

//-------------------------------------------------------------------------------------------------------------------------------------------------------------
// Removes a object group when the "X" icon is clicked
//-------------------------------------------------------------------------------------------------------------------------------------------------------------
function delete_object_group(object) {
	name_obj_group = $(object).attr("obj_group");
	idx = get_numbers(object.id); //gets the number id of element where the delete button was clicked, so that we will know which one to delete.
	if (!idx && idx !== 0) {return}; //if value is null or undefined or empty, then exit function.
	switch (name_obj_group) {
		case "hot": // hotspot
			$("#header_hot" + idx).remove();
			
			$("#content_hot" + idx + " .confirmed_object_row").each(function(index) {	
				idx_of_confirmed_object = get_numbers($(this).attr('id'));
				$("#confirmed_display_object" + idx_of_confirmed_object).remove();
			});
			$("#content_hot" + idx).remove();
		break;
		case "drag": // draggable
			$("#header_drag" + idx).remove();
			$("#content_drag" + idx + " .confirmed_object_row").each(function(index) {	
				idx_of_confirmed_object = get_numbers($(this).attr('id'));
				$("#confirmed_display_object" + idx_of_confirmed_object).remove();
			});			
			$("#content_drag" + idx).remove();	
		break;
		case "cont": // container
			$("#header_cont" + idx).remove();
			$("#content_cont" + idx + " .confirmed_object_row").each(function(index) {	
				idx_of_confirmed_object = get_numbers($(this).attr('id'));
				$("#confirmed_display_object" + idx_of_confirmed_object).remove();
			});						
			$("#content_cont" + idx).remove();			
		break;
		default:
			console.log("ERROR! obj_type_name:" + name_obj_group);
	}
}

//-------------------------------------------------------------------------------------------------------------------------------------------------------------
// Removes a single object when the "X" icon is clicked
//-------------------------------------------------------------------------------------------------------------------------------------------------------------
function delete_single_confirmed_object(idx) {
	$("#confirmed_response" + idx).remove();
	$("#confirmed_display_object" + idx).remove();
}

// **************************************************************************************************************************************************************************************************
// **************************************************************************************************************************************************************************************************
//
//
// Bitmask Drag and Drop Tool
//
//
// ************************************************************************************************************************************************************************************************** 
// **************************************************************************************************************************************************************************************************

//-------------------------------------------------------------------------------------------------------------------------------------------------------------
// Transition to BitMask Drag and Drop Visual Editor 
//------------------------------------------------------------------------------------------------------------------------------------------------------------- 					
function transition_bitmask_DD_page(editor_type) { 			
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[page.state_list_idx]; // current state
	var transition = state.transition_list[state.transition_list_idx]; // current transition	
	$.mobile.changePage("#bitmask_DD_tool", { transition: "pop"});
	var display_object = "#imb_game_display_image_bitmask_DD"; //state image area
	//display image with containers and hotspots and draggable objects 
	//------------------------------------------------------
	$(display_object).empty(); // clear any objects
	$(display_object).css("background-image", "url()"); // clear the image
	if (state.image.file_name != '') { // display image
		$(display_object).css("background-image", "url(data/books/" + book.location + "/" + encodeURI(state.image.file_name) + ")");
	}
	// display objects
	$.each(state.image.hotspot_list, function(idx, hotspot) {
		$.each(hotspot.frame_list, function(idx2) {
			$(display_object).append("<div word=\"" + $(this).attr('word') + "\" class=\"imb_hotspot\" style=\"background-color: red; opacity:" + ($(this).attr('opacity') / 100) + "; width:" + $(this).attr('width') + "%; height:" + $(this).attr('height') + "%;top:" + $(this).attr('yloc') + "%; left:" + $(this).attr('xloc') + "%;\" on" + user_event + "=\"hot_press('" + $(this).attr('word') + "','" + $(this).attr('text') + "');\"></div>");
		});	
	});
	$.each(state.image.draggable_list, function(idx, draggable) {
		$.each(draggable.frame_list, function(idx2) {
			$(display_object).append("<div clone=\"" + $(draggable).attr('clone') + "\" word=\"" + $(this).attr('word') + "\" id=\"draggable" + idx + '_' + idx2 + "\" draggable=\"true\" ondragstart=\"drag(event)\" class=\"imb_draggable\" style=\"background-image:url(data/books/" + book.location + "/" + encodeURI($(this).attr('file_name')) + "); opacity:" + ($(this).attr('opacity') / 100) + "; width:" + $(this).attr('width') + "%; height:" + $(this).attr('height') + "%;top:" + $(this).attr('yloc') + "%; left:" + $(this).attr('xloc') + "%;\"></div>");
		});	
	});
	$.each(state.image.container_list, function(idx, container) {
		$.each(container.frame_list, function(idx2) {
			$(display_object).append("<div count=\"" + $(container).attr('count') + "\" lock=\"" + $(container).attr('lock') + "\" width=\"" + $(this).attr('width') + "\" height=\"" + $(this).attr('height') + "\" word=\"" + $(this).attr('word') + "\" id=\"container" + idx + '_' + idx2 + "\" ondrop=\"drop(event)\" ondragover=\"allowDrop(event)\" class=\"imb_container\" style=\"opacity:" + ($(this).attr('opacity') / 100) + "; width:" + $(this).attr('width') + "%; height:" + $(this).attr('height') + "%;top:" + $(this).attr('yloc') + "%; left:" + $(this).attr('xloc') + "%;\"></div>");
			if (encodeURI($(this).attr('file_name')) != '') { // container has a background image
				$("#container" + idx2).css("background-image", "url(data/books/" + book.location + "/" + encodeURI($(this).attr('file_name')) + ")");
			}
		});
	});
	
	var display_game_data = "#imb_game_display_data_bitmask_DD"; //writes HTML to display the game data of the bitmask DD tool (right half of screen)
	$(display_game_data).empty(); // clear any previously existing data
	$("#visual_editor_header").empty(); //clear header html
	var game_data_html = "";
						if(editor_type == "new"){
							game_data_html = '<a href="#" data-role="button" data-theme="b" data-inline="true" data-mini="true" id="imb_DD_response"';
							game_data_html += 'onclick="submit_DD_transition()">Create New Transition and Continue Working</a><br><br>';
							header = '<a href="#" onclick="return_to_main_authoring_tool_DD()" id="imb_DD_cancel" class="ui-btn-left" data-icon="arrow-l">Exit Without Saving Current Transition</a>' +
										'<h1 id="bitmask_DD_header_title" class="ui-title" role="heading" aria-level="1">Drag and Drop Transition Editor</h1>'+
										'<a href="#" data-role="button" onclick="submit_DD_transition_and_exit()" class="ui-btn-right" data-theme="e" data-inline="true" data-mini="true" id="imb_DD_response_exit">Save Current Transition and Exit</a>';
							$("#visual_editor_header").html(header);
							$("#bitmask_DD_tool").trigger("create");								
							
						}
						else {
							header = '<a href="#" onclick="return_to_main_authoring_tool_DD()" id="imb_DD_cancel" class="ui-btn-left" data-icon="arrow-l">Cancel</a>' +
										'<h1 id="bitmask_DD_header_title" class="ui-title" role="heading" aria-level="1">Visual Editor - ' + imb_transition_label(transition.type) + ' transition (' + (state.transition_list_idx + 1) + ')</h1>'+
										'<a href="#" data-role="button" onclick="submit_DD_responses()" class="ui-btn-right" data-theme="e" data-inline="true" data-mini="true" id="imb_DD_response">Update and Exit</a>';
							$("#visual_editor_header").html(header);
							$("#bitmask_DD_tool").trigger("create");							
						}	
		game_data_html += 
				'<div id="next_state_dropdown"></div>'+
				'<div id="temp_DD_responses_header" class="ui-grid-b">'+
					'<div class="ui-block-a"><div class="DD_header_labels">Action Text</div></div>'+
					'<div class="ui-block-b"><div class="DD_header_labels">Output Text</div></div>'+
					'<div class="ui-block-c"><div class="DD_header_labels DD_hidden">Response Bits</div></div>'+
				'</div><hr>'+
				'<h4>&nbsp;&nbsp;Drag and Drop Responses</h2>'+
				'<div id="temp_DD_responses"></div>'+
				'<div id="temp_inverse_DD_responses" class="DD_hidden"></div>' +
				'<h4>&nbsp;&nbsp;Hot Spot Responses</h2>'+				
				'<div id="temp_non_bitmask_responses" ></div>';				
	$(display_game_data).append(game_data_html);
	$(display_game_data).trigger("create");
	//Creates dropdown box that allows the user to choose the next state to transition to
	if(editor_type == "new"){
		var next_state_dropdown = '<div class="ui-grid-d"><div id="label_DD_next_state" class="ui-block-a">&nbsp;&nbsp;Next State Index</div>  ' +
				'<div class="ui-block-b"><select data-theme="a" data-inline="true" data-mini="true" data-native-menu="false" id="ntrignext" name="ntrignext">'+
				'<option>Next State</option>';
				for (var x = 0; x < page.state_list.length; x++) {
					next_state_dropdown += '<option value="' + x + '">' + (x+1) + '</option>';
				}
				next_state_dropdown += '</select></div></div>';		
		$("#next_state_dropdown").append(next_state_dropdown);
		$("#next_state_dropdown").trigger("create");
	}

	if(editor_type == "existing"){ //parses existing responses and adds them to the html display	
		$.each(transition.response_list, function(idx) {
			var response = transition.response_list[idx];
			var r_type = response.type;
			var r_text_input = response.text_input;
			var r_sound = response.sound;
			var r_object = response.object;
			var r_weight = response.weight;
			var r_bits = response.bits;
			var r_asub = response.asub;
			var r_text_output = response.text_output;
			var r_count = response.count;
			//positive bitmask response, need to check and see if a cooresponding negative bitmask inference already exists.  If it doesn't, then automatically create proper negative bitmask response.
			if(response.type == 1 && r_bits > 0) {				
				found_input_parts = new Array();
				found_input_parts = find_text_input_parts(r_text_input, r_type);
								
				var isMatchFound = found_input_parts[0];
				var matched_draggable_word = found_input_parts[1];
				var matched_container_word = found_input_parts[2];
				var inverse_input_text = matched_container_word + " " + matched_draggable_word;
				var isInverseResponseExisting = false;
				var source_id = ""; //stores the id of the draggable object; will be used in the place_object function after it is found;
				var target_id = ""; //stores the id of the container object; will be used in the place_object function after it is found;
				
				if(isMatchFound) { //found_input_parts() function was sucessfully able to break down the input text into draggable and container words.
					$(".imb_draggable").each(function(){ //find source_id; will be used to place the draggable in the appropriate container
						if($(this).attr('word') == matched_draggable_word) {
							source_id = $(this).attr('id');
						}
					});
					
					$(".imb_container").each(function(){ //find target_id; will be used to place the draggable in the appropriate container
						if($(this).attr('word') == matched_container_word) {
							target_id = $(this).attr('id');
						}
					});
					
				place_object(source_id, target_id);  //visually places the draggable object in the appropriate container.					
					
					$.each(transition.response_list, function(idx2) {//loop throught and see if a valid negative inference exsists.
						var response2 = transition.response_list[idx2];
						var r_type2 = response2.type;
						var r_text_input2 = response2.text_input;	
						var r_bits2 = response2.bits;
						if(r_type2 == 2 && r_bits2 == r_bits && inverse_input_text == r_text_input2) {
							isInverseResponseExisting = true;
							return false;
						}
					});
				}
				if(isInverseResponseExisting == false) {//if there was no existing negative bitmask response, then create one.
					bitmask_response_idx = $('#temp_inverse_DD_responses .ui-grid-b').length; //current number of inverse bitmask responses
					insert_inverse_DD_response(bitmask_response_idx, 2, inverse_input_text, r_sound, r_object, r_weight, r_bits, r_asub, r_text_output, r_count);
				}
				bitmask_response_idx = $('#temp_DD_responses .ui-grid-b').length; //current number of bitmask responses
				insert_DD_response(bitmask_response_idx, r_type, r_text_input, r_sound, r_object, r_weight, r_bits, r_asub, r_text_output, r_count);
			}
			//negative bitmask responses
			else if(response.type == 2 && r_bits > 0) {			
				bitmask_response_idx = $('#temp_inverse_DD_responses .ui-grid-b').length; //current number of inverse bitmask responses
				insert_inverse_DD_response(bitmask_response_idx, r_type, r_text_input, r_sound, r_object, r_weight, r_bits, r_asub, r_text_output, r_count);
			}	
			//all other responses (non bitmask responses)
			else {
				bitmask_response_idx = $('#temp_non_bitmask_responses .ui-grid-b').length; //current number of non bitmask responses
				if(action_text_matches_any_object_word(state, r_text_input)) {// see if the response is a possible hotspot response, so that it can be added to the visual editor list.
					hidden = false;
					existingHotspotResponse = true;					
					insert_non_bitmask_response(bitmask_response_idx, r_type, r_text_input, r_sound, r_object, r_weight, r_bits, r_asub, r_text_output, r_count, hidden, existingHotspotResponse);
				}
				else {
					hidden = true;
					existingHotspotResponse = false;
					insert_non_bitmask_response(bitmask_response_idx, r_type, r_text_input, r_sound, r_object, r_weight, r_bits, r_asub, r_text_output, r_count, hidden, existingHotspotResponse);
				}
			}
		});
	}
}

//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// This function is called to see if any objects' "word" attribute in the current state, match the action text of the current response.  This is needed to find out if the action text can be generated from an object (specifically by clicking a hotspot), so that only this type of response will be parsed to the visual editor response list.  There is no need to display other types of responses in the visual editor, because that is what the response editor is for.
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function action_text_matches_any_object_word(state, action_text) {
	matches_found = 0; // 1 is added to this variable every time an object's word matches the action_text.
	
	$.each(state.image.hotspot_list, function(idx, hotspot) { // loop throught all the current state hotspots to see if hotspot word matches the action text.
		$.each(hotspot.frame_list, function(idx2) {
			if($(this).attr('word') == action_text) {
				matches_found += 1;
			}
		});
	});
	$.each(state.image.draggable_list, function(idx, draggable) { // loop throught all the current state draggables to see if draggable word matches the action text.
		$.each(draggable.frame_list, function(idx2) {
			if($(this).attr('word') == action_text) {
				matches_found += 1;
			}
		});
	});
	$.each(state.image.container_list, function(idx, container) { // loop throught all the current state containers to see if container word matches the action text.
		$.each(container.frame_list, function(idx2) {
			if($(this).attr('word') == action_text) {
				matches_found += 1;
			}
		});
	});

	if(matches_found > 0) { // is there is at least one match, then return true
		return true;
	}
	else return false;
}	
	
//----------------------------------------------------------------------------------------------------------
// This function is called to find the draggable and container text parts when you only know the input_text
//----------------------------------------------------------------------------------------------------------
function find_text_input_parts(find_text_input, find_type) {
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[page.state_list_idx]; // current state

	var possible_container_words = new Array();	
	var	matched_container_word;
	var matched_draggable_word;
	var isMatchFound = false;
	
	$.each(state.image.draggable_list, function(idx, draggable) {
		//var draggable = state.image.draggable_list[idx];
		//var d_word = draggable.word;
		$.each(draggable.frame_list, function(idx2) {
			var d_word = $(this).attr('word');
			possible_container_word = find_text_input.replace(d_word + " ","");
			$.each(state.image.container_list, function(idx, container) {
				$.each(container.frame_list, function(idx2) {
					c_word = $(this).attr('word');
				});
				//var container = state.image.container_list[idx];
				//c_word = container.word;
				if (c_word == possible_container_word) {
					matched_container_word = c_word;
				}
			});
		});	
	});

matched_draggable_word = find_text_input.replace(" " + matched_container_word,"");
	
	$.each(state.image.draggable_list, function(idx, draggable) {
		$.each(draggable.frame_list, function(idx2) {
			//var draggable = state.image.draggable_list[idx];
			//var d_word = draggable.word;
			var d_word = $(this).attr('word');
			if(matched_draggable_word == d_word) {
				isMatchFound = true;
				return false;
			}
		});
	});
return [isMatchFound, matched_draggable_word, matched_container_word];
}

//----------------------------------------------------------------------------------------------------------
// This function is called when a user clicks the Create Transition and Exit Button
//----------------------------------------------------------------------------------------------------------
function submit_DD_transition_and_exit() {
	submit_DD_bitmask_data("transition");
	return_to_main_authoring_tool_DD();	
}

//----------------------------------------------------------------------------------------------------------
// This function is called when a user clicks the Submit Transition Button
//----------------------------------------------------------------------------------------------------------
function submit_DD_transition() {
	submit_DD_bitmask_data("transition");
}

//----------------------------------------------------------------------------------------------------------
// This function is called when a user clicks the Submit Responses button
//----------------------------------------------------------------------------------------------------------
function submit_DD_responses() {
	submit_DD_bitmask_data("responses");
	alert("Drag and Drop Responses Were Sucessfully Submitted.");
	history.go(-1); //transitions page back to main authoring tool (author.html)
}

//--------------------------------------------------------------------------------------------------------------------------
//This function is called to insert already existing positive bitmask responses and their object onto the display area. 
//--------------------------------------------------------------------------------------------------------------------------
function place_object(source_id, target_id) {
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[page.state_list_idx]; // current state
	var transition = state.transition_list[state.transition_list_idx]; // current transition
	var container_count = $("#" + target_id).attr("count");
	var container_children_count = $("#" + target_id).children().length; // number of objects currently inside the container
	if (debug) console.log("drop-1: source_id=" + source_id + " target_id=" + target_id + " children_count=" + container_children_count + " / " + container_count);
	
	if ((typeof container_count == 'undefined') || (container_count <= container_children_count)) { // container count is undefined or full
		if (debug) console.log("Invalid or full container!");
		return;
	}
	var clone = $("#" + source_id).clone(); // create the clone
	// calculate new size of the clone
	var container_width = parseInt($("#" + target_id).attr("width")); // original % width
	var container_height = parseInt($("#" + target_id).attr("height")); // original % height
	if (container_width > container_height) { // target width > target height
		var ratio = Math.floor(container_width / container_height);
		var columns = Math.min(container_count, ratio);
		var clone_width = 100 / columns;					 			// clone width is the 100% / columns
		var clone_height = 100 / Math.ceil(container_count / columns); 	// clone height is the 100% / (max count / columns)
	} else if (container_width < container_height) { // target width < target height
		var ratio = Math.floor(container_height / container_width);
		var rows = Math.min(container_count, ratio);
		var clone_width = 100 / Math.ceil(container_count / rows); 		// clone width is the 100% / (max count / rows)
		var clone_height = 100 / rows; 									// clone height is the 100% / rows
	} else { // target width = target height
		var clone_width = 100 / Math.ceil(Math.sqrt(container_count)); 	// clone width is the 100% / square root of the max count
		var clone_height = clone_width;									// same
	}
	var clone_id = source_id + "clone" + container_children_count + target_id; // create a unique clone identifier
	if (debug) console.log("drop-2: clone_id=" + clone_id + " width=" + clone_width + " height=" + clone_height);
	
	// now modify clone's attributes
	$(clone).attr("id", clone_id);
	$(clone).attr("class", "imb_dragged");
	$(clone).attr("draggable", false);
	$(clone).attr("ondragstart", null);
	$(clone).css("cursor", "hand");
	$(clone).css("top", "");
	$(clone).css("left", "");
	$(clone).click(function() {
		remove(target_id, clone_id, source_id);
	});
	$(clone).css("width", clone_width + "%");
	$(clone).css("height", clone_height + "%");
	$(clone).css("float", "left"); // AUTO PLACEMENT!
	
	$("#" + target_id).append(clone); // insert into container
	
	if ($("#" + source_id).attr("clone") == 'n') { // you can only "clone" it once
		$("#" + source_id).hide();
	}
}

//--------------------------------------------------------------------------------------------------
// This function is called when hotspot is pressed
//--------------------------------------------------------------------------------------------------
function hot_press(word, text) { 
	if (word == '') {
		alert("This hotspot has no word(s) associated with it, if you want to use it as a response, please use the image object editor to set the word attribute.")
		return;
	}	
	else {
		if (isWorkingHotspotResponse == false) { // will create a new response if there are currently no working responses
			var book = book_list[book_list_idx]; // current book
			var page = book.page_list[book.page_list_idx]; // curent page
			var state = page.state_list[page.state_list_idx]; // current state
			var transition = state.transition_list[state.transition_list_idx]; // current transition
			var non_bitmask_response_idx = $('#temp_non_bitmask_responses .ui-grid-b').length; //current number of non-bitmask responses
			insert_non_bitmask_response(non_bitmask_response_idx, 1, word, "", "", 1, 0, "y", "", 0, false) //display hotspot response in visual editor list
			isWorkingHotspotResponse = true;
		}
		else { // will add the hotspot word to the working hotspot response until it has been confirmed
			idx = ($('#temp_non_bitmask_responses .ui-grid-b').length) - 1; //the last non-bitmask response, it will be unconfirmed if inside this else statement.
			r_text_input = $("#non_bitmask_action_text" + idx).val();
			multiword = r_text_input += (" " + word);
			$("#non_bitmask_action_text" + idx).val(multiword);
		}
	}
}

//------------------------------------------------------------------------------ drag&drop functions
// Allow drops inside the container object
//--------------------------------------------------------------------------------------------------
function allowDrop(ev) {
	ev.preventDefault();
}
//--------------------------------------------------------------------------------------------------
// This function is called when user "clicks" on a draggable object
//--------------------------------------------------------------------------------------------------
function drag(ev) {
	ev.dataTransfer.setData("Text", ev.target.id);
	if (debug) console.log("DRAG: target.id=" + ev.target.id);
}
//--------------------------------------------------------------------------------------------------
// This function is called when user "drops" a draggable object over a container object
//--------------------------------------------------------------------------------------------------
function drop(ev) {
	var source_id = ev.dataTransfer.getData("Text");
	var target_id = ev.target.id;
	ev.preventDefault();
	drop_object(source_id, target_id);
}
//--------------------------------------------------------------------------------------------------
//This function is called to process the drop event
//--------------------------------------------------------------------------------------------------
function drop_object(source_id, target_id) {
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[page.state_list_idx]; // current state
	var transition = state.transition_list[state.transition_list_idx]; // current transition
	var bitmask_trigger_total = 0;
	$.each(state.transition_list, function(idx) {
		transition_in_loop = state.transition_list[idx];
		if(transition_in_loop.type == 5){
			bitmask_trigger_total += parseInt(transition_in_loop.trigger);
		}
	});
	var next_bitmask_exponent_from_transitions = parseInt(bitmask_trigger_total).toString(2).length; //Determines the next exponent that will be used to determined the next_bitmask_value.
	var next_bitmask_value_from_transitions = Math.pow(2,next_bitmask_exponent_from_transitions); //The next highest bitmask value that is assured not to overlap with previous bitmask values for the other type 5 (bitmask) 
	var draggable_idx = get_numbers(source_id.split(/_/)[0]); // extracts the index number of the draggable object from the html id name.
	var container_idx = get_numbers(target_id.split(/_/)[0]); // extracts the index number of the container object from the html id name.
	var d_frame_idx = source_id.split(/_/)[1]; // extracts the index number of the frame within the draggable object
	var c_frame_idx = target_id.split(/_/)[1]; // extracts the index number of the frame within the container object
	var container_count = $("#" + target_id).attr("count");
	var container_children_count = $("#" + target_id).children().length; // number of objects currently inside the container
	if (debug) console.log("drop-1: source_id=" + source_id + " target_id=" + target_id + " children_count=" + container_children_count + " / " + container_count);
	
	if ((typeof container_count == 'undefined') || (container_count <= container_children_count)) { // container count is undefined or full
		if (debug) console.log("Invalid or full container!");
		return;
	}
	var clone = $("#" + source_id).clone(); // create the clone
	// calculate new size of the clone
	var container_width = parseInt($("#" + target_id).attr("width")); // original % width
	var container_height = parseInt($("#" + target_id).attr("height")); // original % height
	if (container_width > container_height) { // target width > target height
		var ratio = Math.floor(container_width / container_height);
		var columns = Math.min(container_count, ratio);
		var clone_width = 100 / columns;					 			// clone width is the 100% / columns
		var clone_height = 100 / Math.ceil(container_count / columns); 	// clone height is the 100% / (max count / columns)
	} else if (container_width < container_height) { // target width < target height
		var ratio = Math.floor(container_height / container_width);
		var rows = Math.min(container_count, ratio);
		var clone_width = 100 / Math.ceil(container_count / rows); 		// clone width is the 100% / (max count / rows)
		var clone_height = 100 / rows; 									// clone height is the 100% / rows
	} else { // target width = target height
		var clone_width = 100 / Math.ceil(Math.sqrt(container_count)); 	// clone width is the 100% / square root of the max count
		var clone_height = clone_width;									// same
	}
	var clone_id = source_id + "clone" + container_children_count + target_id; // create a unique clone identifier
	if (debug) console.log("drop-2: clone_id=" + clone_id + " width=" + clone_width + " height=" + clone_height);
	
	// now modify clone's attributes
	$(clone).attr("id", clone_id);
	$(clone).attr("class", "imb_dragged");
	$(clone).attr("draggable", false);
	$(clone).attr("ondragstart", null);
	$(clone).css("cursor", "hand");
	$(clone).css("top", "");
	$(clone).css("left", "");
	$(clone).click(function() {
		remove(target_id, clone_id, source_id);
	});
	$(clone).css("width", clone_width + "%");
	$(clone).css("height", clone_height + "%");
	$(clone).css("float", "left"); // AUTO PLACEMENT!
	
	$("#" + target_id).append(clone); // insert into container
	
	if ($("#" + source_id).attr("clone") == 'n') { // you can only "clone" it once
		$("#" + source_id).hide();
	}
	
	var container_name = state.image.container_list[container_idx].frame_list[c_frame_idx].word; //get the word associated with the container/frame object
	var draggable_name = state.image.draggable_list[draggable_idx].frame_list[d_frame_idx].word; //get the word associated with the draggable/frame object
	var DD_action_text = draggable_name + " " + container_name;	//create the action text by combinding the words of both the container and draggable object
	var DD_inverse_action_text = container_name + " " + draggable_name; //invert the action text
	var bitmask_response_idx = $('#temp_DD_responses .ui-grid-b').length; //current number of bitmask responses 
	if(bitmask_response_idx > 0){
		$('#temp_DD_responses .ui-grid-b').each(function(index) { //adding up the current bitmask response values so that you can determine what bitmask value should come next
			idx = get_numbers($(this).attr('id'))
			if(document.getElementById("DD_bit" + idx)){
				response_bit_value = document.getElementById("DD_bit" + idx).value; 
				next_bitmask_value_from_transitions += parseInt(response_bit_value);
			}	
		});
	}
	var next_bitmask_exponent = parseInt(next_bitmask_value_from_transitions).toString(2).length; //Determines the next exponent that will be used to determined the next_bitmask_value.
	var next_bitmask_value = Math.pow(2,next_bitmask_exponent);	//the next bitmask value that should be used for the next response.		
	insert_DD_response(bitmask_response_idx, 1, DD_action_text, "", "", 1, next_bitmask_value, "y", "", 0);
	insert_inverse_DD_response(bitmask_response_idx, 2, DD_inverse_action_text, "", "", 1, next_bitmask_value, "y", "", 0);
}

//--------------------------------------------------------------------------------------------------
//This function is called to add the response to the Bitmask Visual tool page/grid
//--------------------------------------------------------------------------------------------------
function insert_DD_response(idx, r_type, r_text_input, r_sound, r_object, r_weight, r_bits, r_asub, r_text_output, r_count) { 
	DD_response = '<div id="temp_DD_responses_row' + idx + '" class="ui-grid-b">' +
						'<div id="DD_block_a' + idx + '" class="ui-block-a"><input data-theme="e" data-mini="true" id="DD_action_text' + idx + '" type="text" value="' + r_text_input + '" /></div>' +
						'<div id="DD_block_b' + idx + '" class="ui-block-b"><input data-mini="true" id="DD_output_text' + idx + '" type="text" value="'+ r_text_output + '" /></div>' +
						'<div id="DD_block_c' + idx + '" class="ui-block-c DD_hidden"><input data-mini="true" id="DD_bit' + idx + '" type="text" value="' + r_bits +'" /></div>' +
						'<div class="DD_hidden"><input data-mini="true" id="DD_type' + idx + '" type="text" value="' + r_type +'" /></div>' +
						'<div class="DD_hidden"><input data-mini="true" id="DD_sound' + idx + '" type="text" value="' + r_sound +'" /></div>' +
						'<div class="DD_hidden"><input data-mini="true" id="DD_object' + idx + '" type="text" value="' + r_object +'" /></div>' +
						'<div class="DD_hidden"><input data-mini="true" id="DD_weight' + idx + '" type="text" value="' + r_weight +'" /></div>' +
						'<div class="DD_hidden"><input data-mini="true" id="DD_asub' + idx + '" type="text" value="' + r_asub +'" /></div>' +
						'<div class="DD_hidden"><input data-mini="true" id="DD_count' + idx + '" type="text" value="' + r_count +'" /></div>' +
				  '</div>';	
	$("#temp_DD_responses").append(DD_response);
	$("#temp_DD_responses").trigger("create");
}

//--------------------------------------------------------------------------------------------------
//This function is called to add the inverse response to the Bitmask Visual tool page/grid
//--------------------------------------------------------------------------------------------------
function insert_inverse_DD_response(idx, r_type, r_text_input, r_sound, r_object, r_weight, r_bits, r_asub, r_text_output, r_count) {
	DD_inverse_response = '<div id="temp_DD_inverse_responses_row' + idx + '" class="ui-grid-b">' +
							'<div id="DD_inverse_block_a' + idx + '" class="ui-block-a"><input data-theme="e" data-mini="true" id="DD_inverse_action_text' + idx + '" type="text" value="' + r_text_input + '" /></div>' +
							'<div id="DD_inverse_block_b' + idx + '" class="ui-block-b"><input data-mini="true" id="DD_inverse_output_text' + idx + '" type="text" value="'+ r_text_output +'" /></div>' +
							'<div id="DD_inverse_block_c' + idx + '" class="ui-block-c"><input data-mini="true" id="DD_inverse_bit' + idx + '" type="text" value="' + r_bits +'" /></div>'+
							'<div class="DD_hidden"><input data-mini="true" id="DD_inverse_type' + idx + '" type="text" value="' + r_type +'" /></div>' +
							'<div class="DD_hidden"><input data-mini="true" id="DD_inverse_sound' + idx + '" type="text" value="' + r_sound +'" /></div>' +
							'<div class="DD_hidden"><input data-mini="true" id="DD_inverse_object' + idx + '" type="text" value="' + r_object +'" /></div>' +
							'<div class="DD_hidden"><input data-mini="true" id="DD_inverse_weight' + idx + '" type="text" value="' + r_weight +'" /></div>' +
							'<div class="DD_hidden"><input data-mini="true" id="DD_inverse_asub' + idx + '" type="text" value="' + r_asub +'" /></div>' +
							'<div class="DD_hidden"><input data-mini="true" id="DD_inverse_count' + idx + '" type="text" value="' + r_count +'" /></div>' +							
						'</div>';					
	$("#temp_inverse_DD_responses").append(DD_inverse_response);
	$("#temp_inverse_DD_responses").trigger("create");
}

//--------------------------------------------------------------------------------------------------
//This function is called to add non bitmask responses to the Bitmask Visual tool page/grid
//--------------------------------------------------------------------------------------------------
function insert_non_bitmask_response(idx, r_type, r_text_input, r_sound, r_object, r_weight, r_bits, r_asub, r_text_output, r_count, hidden, existingHotspotResponse) {
	non_bitmask_response =  '<div id="temp_non_bitmask_responses_row' + idx + '"';
							if(hidden) {
								non_bitmask_response += 'class="ui-grid-b DD_hidden">';
							}
							else {
								non_bitmask_response += 'class="ui-grid-b">';
							}
		non_bitmask_response +=	'<div id="non_bitmask_block_a' + idx + '" class="ui-block-a"><input data-theme="e" data-mini="true" id="non_bitmask_action_text' + idx + '" type="text" value="' + r_text_input + '" /></div>' +
								'<div id="non_bitmask_block_b' + idx + '" class="ui-block-b"><input data-mini="true" id="non_bitmask_output_text' + idx + '" type="text" value="' + r_text_output + '" /></div>';
							if(hidden) {
								non_bitmask_response += '<div id="non_bitmask_block_c' + idx + '" class="ui-block-c DD_hidden"></div>';
							}
							else {
								if (existingHotspotResponse) {
									non_bitmask_response += '<div id="non_bitmask_block_c' + idx + '" class="ui-block-c"><div id="delete_hotspot_r_btn' + idx + '" onclick="delete_hotspot_r(' + idx + ')" class="delete_hotspot_r" data-theme="a" data-role="button" data-icon="delete" data-inline="true" data-iconpos="notext"></div></div>';
								}
								else {
									non_bitmask_response += '<div id="non_bitmask_block_c' + idx + '" class="ui-block-c"><div id="confirm_hotspot_r_btn' + idx + '" onclick="confirm_hotspot_r(' + idx + ')" class="confirm_hotspot_r" data-theme="e" data-role="button" data-icon="check" data-inline="true" data-iconpos="notext"></div></div>';									
								}
							}								
								
		non_bitmask_response +=	'<div id="non_bitmask_block_c' + idx + '" class="ui-block-c DD_hidden"><input data-mini="true" id="non_bitmask_bit' + idx + '" type="text" value="' + r_bits +'" /></div>'+
								'<div class="DD_hidden"><input data-mini="true" id="non_bitmask_type' + idx + '" type="text" value="' + r_type +'" /></div>' +
								'<div class="DD_hidden"><input data-mini="true" id="non_bitmask_sound' + idx + '" type="text" value="' + r_sound +'" /></div>' +
								'<div class="DD_hidden"><input data-mini="true" id="non_bitmask_object' + idx + '" type="text" value="' + r_object +'" /></div>' +
								'<div class="DD_hidden"><input data-mini="true" id="non_bitmask_weight' + idx + '" type="text" value="' + r_weight +'" /></div>' +
								'<div class="DD_hidden"><input data-mini="true" id="non_bitmask_asub' + idx + '" type="text" value="' + r_asub +'" /></div>' +
								'<div class="DD_hidden"><input data-mini="true" id="non_bitmask_count' + idx + '" type="text" value="' + r_count +'" /></div>' +							
							'</div>';					
	$("#temp_non_bitmask_responses").append(non_bitmask_response);
	$("#temp_non_bitmask_responses").trigger("create");
}

//---------------------------------------------------------------------------------------------------------------------------------
//This function is called to add all the working responses and transition to the main authoring tool with a message alerting the user
//---------------------------------------------------------------------------------------------------------------------------------
function submit_DD_bitmask_data(submit_type) {
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[page.state_list_idx]; // current state
	var transition = state.transition_list[state.transition_list_idx]; // current transition
	transition.response_list.length = 0;
	
	//loop through all the responses to collect the data and insert it into the response array
	$('#temp_DD_responses .ui-block-a').each(function(idx) {
		idx = get_numbers($(this).attr('id'))
		if(document.getElementById('DD_action_text' + idx)){
			action_text_value = document.getElementById('DD_action_text' + idx).value; 
			output_text_value = document.getElementById('DD_output_text' + idx).value;
			bit_value = parseInt(document.getElementById('DD_bit' + idx).value);	
			r_type_value = document.getElementById('DD_type' + idx).value; 
			r_sound_value = document.getElementById('DD_sound' + idx).value; 
			r_object_value = document.getElementById('DD_object' + idx).value; 
			r_weight_value = parseInt(document.getElementById('DD_weight' + idx).value); 
			r_asub_value = document.getElementById('DD_asub' + idx).value; 
			r_count_value = parseInt(document.getElementById('DD_count' + idx).value); 			
			
			var response = new Response(r_type_value, r_sound_value, r_weight_value, bit_value, r_asub_value, action_text_value, output_text_value); // create new record
			transition.response_list.push(response); // prepend it to the array			
		}	
	});	
	
	//loop through all the inverse responses to collect the data and insert it into the response array
	$('#temp_inverse_DD_responses .ui-block-a').each(function(idx) {
		idx = get_numbers($(this).attr('id'))
		if(document.getElementById('DD_inverse_action_text' + idx)){
			action_text_value = document.getElementById('DD_inverse_action_text' + idx).value; 
			output_text_value = document.getElementById('DD_inverse_output_text' + idx).value;
			bit_value = parseInt(document.getElementById('DD_inverse_bit' + idx).value);	
			r_type_value = document.getElementById('DD_inverse_type' + idx).value; 
			r_sound_value = document.getElementById('DD_inverse_sound' + idx).value; 
			r_object_value = document.getElementById('DD_inverse_object' + idx).value; 
			r_weight_value = parseInt(document.getElementById('DD_inverse_weight' + idx).value); 
			r_asub_value = document.getElementById('DD_inverse_asub' + idx).value; 
			r_count_value = parseInt(document.getElementById('DD_inverse_count' + idx).value); 	
			
			var response = new Response(r_type_value, r_sound_value, r_weight_value, bit_value, r_asub_value, action_text_value, output_text_value); // create new record
			transition.response_list.push(response); // prepend it to the array				
		}	
	});	
	//loop through all the non bitmask responses to collect the data and insert it into the response array
	$('#temp_non_bitmask_responses .ui-block-a').each(function(idx) {
		idx = get_numbers($(this).attr('id'))
		if(document.getElementById('non_bitmask_action_text' + idx)){
			action_text_value = document.getElementById('non_bitmask_action_text' + idx).value; 
			output_text_value = document.getElementById('non_bitmask_output_text' + idx).value;
			//bit_value = parseInt(document.getElementById('non_bitmask_bit' + idx).value);	
			r_type_value = document.getElementById('non_bitmask_type' + idx).value; 
			r_sound_value = document.getElementById('non_bitmask_sound' + idx).value; 
			r_object_value = document.getElementById('non_bitmask_object' + idx).value; 
			r_weight_value = parseInt(document.getElementById('non_bitmask_weight' + idx).value); 
			r_asub_value = document.getElementById('non_bitmask_asub' + idx).value; 
			r_count_value = parseInt(document.getElementById('non_bitmask_count' + idx).value); 	
			
			var response = new Response(r_type_value, r_sound_value, r_weight_value, 0, r_asub_value, action_text_value, output_text_value); // create new record
			transition.response_list.push(response); // prepend it to the array				
		}	
	});	
	
	var display_object = "#imb_game_display_image_bitmask_DD";
	//display image with containers and hotspots and draggable objects ------------------------------------------------------
	$(display_object).empty(); // clear any objects
	$(display_object).css("background-image", "url()"); // clear the image
	if (state.image.file_name != '') { // display image
		$(display_object).css("background-image", "url(data/books/" + book.location + "/" + encodeURI(state.image.file_name) + ")");
	}
	// display objects
	$.each(state.image.hotspot_list, function(idx) {
		$(display_object).append("<div word=\"" + $(this).attr('word') + "\" class=\"imb_hotspot\" style=\"background-color: red; opacity:" + ($(this).attr('opacity') / 100) + "; width:" + $(this).attr('width') + "%; height:" + $(this).attr('height') + "%;top:" + $(this).attr('yloc') + "%; left:" + $(this).attr('xloc') + "%;\" on" + user_event + "=\"hot_press('" + $(this).attr('word') + "','" + $(this).attr('text') + "');\"></div>");
	});
	$.each(state.image.draggable_list, function(idx) {
		$(display_object).append("<div clone=\"" + $(this).attr('clone') + "\" word=\"" + $(this).attr('word') + "\" id=\"draggable" + idx + "\" draggable=\"true\" ondragstart=\"drag(event)\" class=\"imb_draggable\" style=\"background-image:url(data/books/" + book.location + "/" + encodeURI($(this).attr('file_name')) + "); opacity:" + ($(this).attr('opacity') / 100) + "; width:" + $(this).attr('width') + "%; height:" + $(this).attr('height') + "%;top:" + $(this).attr('yloc') + "%; left:" + $(this).attr('xloc') + "%;\"></div>");
	});
	$.each(state.image.container_list, function(idx) {
		$(display_object).append("<div count=\"" + $(this).attr('count') + "\" lock=\"" + $(this).attr('lock') + "\" width=\"" + $(this).attr('width') + "\" height=\"" + $(this).attr('height') + "\" word=\"" + $(this).attr('word') + "\" id=\"container" + idx + "\" ondrop=\"drop(event)\" ondragover=\"allowDrop(event)\" class=\"imb_container\" style=\"opacity:" + ($(this).attr('opacity') / 100) + "; width:" + $(this).attr('width') + "%; height:" + $(this).attr('height') + "%;top:" + $(this).attr('yloc') + "%; left:" + $(this).attr('xloc') + "%;\"></div>");
		if (encodeURI($(this).attr('file_name')) != '') { // container has a background image
			$("#container" + idx).css("background-image", "url(data/books/" + book.location + "/" + encodeURI($(this).attr('file_name')) + ")");
		}
	});
	
	$("#temp_DD_responses").empty(); //clear all responses from page
	$("#temp_inverse_DD_responses").empty(); //clear all inverse responses from page	
	$("#temp_non_bitmask_responses").empty(); //clear all non bitmask responses from page
	if (transition.type == "5") {
		biternator(transition);
	}
}

//------------------------------------------------------------------------------------------------------------------------
//This function is called when the user wants to cancel any bitmask work without submitting the transition and responses
//------------------------------------------------------------------------------------------------------------------------
function return_to_main_authoring_tool_DD() {
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[page.state_list_idx]; // current state	
	$("#temp_DD_responses").empty(); //clear all responses from page
	$("#temp_inverse_DD_responses").empty(); //clear all inverse responses from page	
	$("#temp_non_bitmask_responses").empty(); //clear all non bitmask responses from page	
	$("#next_state_dropdown").empty();
	history.go(-1); //transitions page back to main authoring tool (author.html)
	//insert_transition(state.transition_list.length - 1, 1); // append it to the list ui
	$("#book").page("destroy").page(); // restyle the ui
	imb_save_flag(2,1);
}

//--------------------------------------------------------------------------------------------------
// This function is called when user "removes" draggable object from a container object
//--------------------------------------------------------------------------------------------------
function remove(container_id, clone_id, original_id) {
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[page.state_list_idx]; // current state
	if (debug) console.log("REMOVE: container_id=" + container_id + " clone_id=" + clone_id + " original_id=" + original_id);	
	$("#" + clone_id).remove(); // remove the clone
	if ($("#" + original_id).attr("clone") == 'n') { // make the original visible again (if needed)
		$("#" + original_id).show();
	}
	var draggable_idx = get_numbers(original_id.split(/_/)[0]); // extracts the index number of the draggable object from the html id name.
	var container_idx = get_numbers(container_id.split(/_/)[0]); // extracts the index number of the container object from the html id name.
	var d_frame_idx = original_id.split(/_/)[1]; // extracts the index number of the frame within the draggable object
	var c_frame_idx = container_id.split(/_/)[1]; // extracts the index number of the frame within the container object
	var container_name = state.image.container_list[container_idx].frame_list[c_frame_idx].word; //get the word associated with the container/frame object
	var draggable_name = state.image.draggable_list[draggable_idx].frame_list[d_frame_idx].word; //get the word associated with the draggable/frame object
	var DD_action_text = draggable_name + " " + container_name; //create the action text by combinding the words of both the container and draggable object
	var DD_inverse_action_text = container_name + " " + draggable_name; //invert the action text
	//loop through all the inverse responses to find the object that was removed and then clear it from the page/grid
	$('#temp_inverse_DD_responses .ui-block-a').each(function(index) {
		idx = get_numbers($(this).attr('id'))
		ui_block_a_id = 'DD_inverse_block_a' + idx;
		ui_block_b_id = 'DD_inverse_block_b' + idx;
		ui_block_c_id = 'DD_inverse_block_c' + idx;
		ui_block_a_input = document.getElementById('DD_inverse_action_text' + idx);	
		if(ui_block_a_input){
			action_text_value = ui_block_a_input.value; 
			if(action_text_value == DD_inverse_action_text){
				$("#" + ui_block_a_id).remove();
				$("#" + ui_block_b_id).remove();
				$("#" + ui_block_c_id).remove();				
			}
		}	
	});	
	//loop through all the responses to find the object that was removed and then clear it from the page/grid	
	$('#temp_DD_responses .ui-block-a').each(function(index) {
		idx = get_numbers($(this).attr('id'))
		ui_block_a_id = 'DD_block_a' + idx;
		ui_block_b_id = 'DD_block_b' + idx;
		ui_block_c_id = 'DD_block_c' + idx;
		ui_block_a_input = document.getElementById('DD_action_text' + idx);	
		if(ui_block_a_input){
			action_text_value = ui_block_a_input.value; 
			if(action_text_value == DD_action_text){
				$("#" + ui_block_a_id).remove();
				$("#" + ui_block_b_id).remove();
				$("#" + ui_block_c_id).remove();				
			}
		}	
	});	
}

//----------------------------------------------------------------------------------------------------------------------------
// This function is called when a user clicks the "X" button next to a Hotspot response
//----------------------------------------------------------------------------------------------------------------------------
function delete_hotspot_r(idx) {
	$("#non_bitmask_block_a" + idx).remove();
	$("#non_bitmask_block_b" + idx).remove();
	$("#non_bitmask_block_c" + idx).remove();
}

//-----------------------------------------------------------------------------------------------------------------------------
// This function is called when a user clicks the checkmark button next to a Hotspot response - these are "Working" responses
//-----------------------------------------------------------------------------------------------------------------------------
function confirm_hotspot_r(idx) {
	isWorkingHotspotResponse = false;
	// change confirm icon button to delete icon button
	delete_btn_html = '<div id="delete_hotspot_r_btn' + idx + '" onclick="delete_hotspot_r(' + idx + ')" class="delete_hotspot_r" data-theme="a" data-role="button" data-icon="delete" data-inline="true" data-iconpos="notext"></div>';
	$("#non_bitmask_block_c" + idx).html(delete_btn_html);
	$("#non_bitmask_block_c" + idx).trigger('create');
}

// **************************************************************************************************************************************************************************************************
// STATE MACHINE
// ************************************************************************************************************************************************************************************************** 
//globals for state machine
var clicked_connection = 0; //this stores the jsPlumb connection that was clicked so that if the user wants to delete the transition, we know which one to delete.
var moved_connection = false; //this is change to true when the connectionMoved event is fired to prevent the connection event also firing.
var moved_next_state_idx = 0;
var instance;
function start_jsPlumb(book_list_idx, page_idx){	
	// setup some defaults for jsPlumb.	
	$("#state_machine_add_state").off("click"); // unbind the add state event listener.  This is needed so that the state_machine_add_state event listener is not duplicated everytime we enter the state machine.
		instance = jsPlumb.getInstance({
		Anchor:"Continuous",
		DropOptions:{ hoverClass:"dragHover" },
		Endpoint : ["Dot", {radius:10}],
		HoverPaintStyle : {strokeStyle:"#1e8151", lineWidth:2 },
		MaxConnections: 10,
		ConnectionOverlays : [
			[ "Arrow", { 
				location:1,
				id:"arrow",
				length:14,
				foldback:0.8
			} ],
			[ "Label", { label:"", id:"label", cssClass:"aLabel" }]
		],
		Container: "statemachine-demo",
		Connector: ["StateMachine", {curviness:40}],
		PaintStyle:{ strokeStyle:"#5c96bc", lineWidth:3, outlineColor:"transparent", outlineWidth:5 },
		//Connector : [ "Flowchart", { cornerRadius:20 } ]
	});
	
	$(window).resize(function(){  // refresh and reconnect everything if browser is resized
		instance.repaintEverything();
	});
	
	$("#state_machine_add_state").on("click", function(event) { 
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		var state = new State(0, "", ""); // create new record
		page.state_list.push(state); // append it to the array
		state_idx = (page.state_list.length - 1);
		insert_state_machine(state_idx, 3, 10);
		instance.draggable($('#imb_state_machine_state' + state_idx), {
			stop: function( event, ui ) {
				idx = get_numbers($(this).attr("id"));
				var book1 = book_list[book_list_idx]; // current book
				var page1 = book1.page_list[book.page_list_idx]; // curent page
				var state1 = page1.state_list[idx];				
				left_bound = ui.offset.left;
				top_bound = ui.offset.top;
				current_height = $(document).height()	
				current_width = $(document).width()
				yloc_percent = ((top_bound) / current_height) * 100;	
				xloc_percent = ((left_bound) / current_width) * 100;
				state1.xloc = xloc_percent;
				state1.yloc = yloc_percent;
				imb_save_flag(2,1);
			}					
		});
		
		instance.makeSource('imb_state_machine_state' + state_idx, {
			filter:".ep",				// only supported by jquery
			onMaxConnections:function(info, e) {
				alert("Maximum connections (" + info.maxConnections + ") reached");
			}
		});
		instance.makeTarget('imb_state_machine_state' + state_idx, {	
		});	
		imb_save_flag(2,1);	
	});	
	
	instance.bind("connection", function(info, originalEvent) {
		if(originalEvent != undefined) {
			var state_idx = get_numbers(info.sourceId); // where the user dragged from (source) is the state we are adding the transition to.
			var book = book_list[book_list_idx]; // current book
			var page = book.page_list[book.page_list_idx]; // curent page
			var state = page.state_list[state_idx];	
			if (moved_connection == false) {
				clicked_connection = info.connection;
				var next_state_idx = get_numbers(info.targetId); // next state is where user dragged to. (target)
				//if (next_state_idx == state_idx) {
					//alert('test1')
					//instance.detach(clicked_connection);
					//alert('test2')
					//instance.connect({
					//	source: info.sourceId, 
					//	target: info.targetId,
					//	connectorStyle: ["State Machine", {curviness:30}]
					//});	
					//alert('test3')
				//}
				new_transition_html = '<form id="new_transition"><div class="imb_form_label">' +
								'<label for="ntrancat">Choose Transition Type</label>' +
								'<select data-theme="a" data-inline="true" data-mini="true" data-native-menu="false" id="ntrancat" name="ntrancat">';
									for (var x = 1; x < 8; x++) {
										new_transition_html += '<option value="' + x + '">' + imb_transition_label(x.toString()) + '</option>';
									}
								new_transition_html += '</select>' +
							'</div></form><a href="#" id="popup_new_transition_ok" onclick="submit_new_transition(' + state_idx + ', ' + next_state_idx + ');" data-role="button" data-inline="true" data-rel="back" data-theme="e">Ok</a>';;
				$("#popupMessageNewTransition").find("p").html(new_transition_html);
				$("#popupMessageNewTransition").popup("open");
				$("#popupMessageNewTransition").trigger("create");
			}
			else {
				//alert("Connection moved!")
				transition_idx = (get_numbers(info.connection.getOverlay("label").labelText)) - 1;
				transition = state.transition_list[transition_idx];
				transition.next_state_idx = moved_next_state_idx; 	
			}	
		imb_save_flag(2,1);
		}
		moved_connection = false;
	});
	
	instance.bind("connectionMoved", function(info) {
		moved_connection = true;
		moved_next_state_idx = get_numbers(info.newTargetId); // next state is where user dragged to. (target)
	});
	
	var windows = jsPlumb.getSelector(".statemachine-demo .w");
	// initialise draggable elements.  
	instance.draggable(windows, {
			stop: function( event, ui ) {
				idx = get_numbers($(this).attr("id"));
				var book = book_list[book_list_idx]; // current book
				var page = book.page_list[book.page_list_idx]; // curent page
				var state = page.state_list[idx];	
				left_bound = ui.offset.left;
				top_bound = ui.offset.top;
				current_height = $(document).height()	
				current_width = $(document).width()
				yloc_percent = ((top_bound) / current_height) * 100;	
				xloc_percent = ((left_bound) / current_width) * 100;
				state.xloc = xloc_percent;
				state.yloc = yloc_percent;
				imb_save_flag(2,1);
			}					
		});
	instance.bind("click", function(c) { // bind an event listen to when transition is clicked, this will popup the transition editor screen. 
		clicked_connection = c;
		var book = book_list[book_list_idx]; // current book
		var page = book.page_list[book.page_list_idx]; // curent page
		state_idx = get_numbers($(c.source).attr("id"));
		page.state_list_idx = state_idx;  // sets the current state to the currently clicked transition.  This is needed so that if a user changes any of the transition properties, we will know the state that the transition belongs to.
		state = page.state_list[page.state_list_idx];
		transition_idx = (get_numbers(c.getOverlay("label").labelText)) - 1;
		state.transition_list_idx = transition_idx;
		transition = state.transition_list[transition_idx];		
		transition_html = cf_transition(transition_idx, state_idx);
		//alert(
		transition_html += '<div class="imb_form_label">' +
								'<label for="ntrancat">Transition Type</label>' +
								'<input id="transition_type" type="text" disabled="disabled" value="' + imb_transition_label(transition.type.toString()) + '"></input>' +
							'</div>';
		$("#popupMessageTransition").find("p").html(transition_html);
		$("#popupMessageTransition").popup("open");
		$("#imb_transition_copy_btn").hide();
		$("#popupMessageTransition").trigger("create");
	});
	// suspend drawing and initialise.
	instance.doWhileSuspended(function() {
		// make each ".ep" div a source and give it some parameters to work with.  here we tell it
		// to use a Continuous anchor and the StateMachine connectors, and also we give it the
		// connector's paint style.  note that in this demo the strokeStyle is dynamically generated,
		// which prevents us from just setting a jsPlumb.Defaults.PaintStyle.  but that is what i
		// would recommend you do. Note also here that we use the 'filter' option to tell jsPlumb
		// which parts of the element should actually respond to a drag start.
		instance.makeSource(windows, {
			filter:".ep",				// only supported by jquery
			onMaxConnections:function(info, e) {
				alert("Maximum connections (" + info.maxConnections + ") reached");
			}
		});

		// initialise all '.w' elements as connection targets.
		instance.makeTarget(windows, {		
		});
		// and finally, make a couple of connections
		var book = book_list[book_list_idx];
		var page = book.page_list[book.page_list_idx];
		$.each(page.state_list, function(index) { // loop through all states
			var state = page.state_list[index];
			$.each(state.transition_list, function(index2) { // loop through all transitions of a particular state and programically make a connection in the state machine
				var transition = state.transition_list[index2];
				if(transition.next_state_idx != undefined) {
					source_id = "imb_state_machine_state" + index;
					if ($("#imb_state_machine_state" + transition.next_state_idx).length) { // test to make sure next_state_idx is an actual existing state to make sure state machine doesn't break.
						target_id = "imb_state_machine_state" + transition.next_state_idx;
						instance.connect({ source:source_id, target:target_id, reattach:true}).getOverlay("label").setLabel(imb_transition_label(transition.type) + ' (' + (index2+1) + ')');
					}
					else { // if next_state_idx is not an actual state, then delete the transition.  This cleans up orphaned transitions.
						state.transition_list.splice(index2,1);
					}
				}
			});
		});
	});
}	

function submit_new_transition(state_idx, next_state_idx) {
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[state_idx]; // current state	
	var form = $("#new_transition"); // parent form
	var transition = new Transition( $('#ntrancat', form).val(), "1", -1, -1, parseInt(next_state_idx)); // create new record
	state.transition_list.push(transition); // append it to the array
	clicked_connection.getOverlay("label").setLabel(imb_transition_label(transition.type) + ' (' + (state.transition_list.length) + ')');
	imb_save_flag(2,1);
}
function delete_transition(state_idx, transition_idx) {
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[state_idx];
	var idx = transition_idx;
	var agree = confirm("Are you sure you want to delete this record?");
	if (agree) {
		state.transition_list.splice(idx, 1); // remove it from the array
		jsPlumb.detach(clicked_connection);
		$("#imb_transition_item"+idx).trigger("collapse").remove();
		$("#popupMessageTransition").popup("close");
	}
	refresh_state_machine();
	imb_save_flag(2,1);
	return false;
}

function delete_state(state_idx) {
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]; // curent page
	var state = page.state_list[state_idx];
	var agree = confirm("Are you sure you want to delete this record?");
	if (agree) {
		page.state_list.splice(state_idx, 1); // remove it from the array
		$("#imb_state_machine_state" + state_idx).remove();
		imb_save_flag(2,1);
		if ($(".ui-page-active .ui-popup-active").length > 0) {
			$("#popupMessageState").popup("close");
			refresh_state_machine();
		}
		else {
			$("#imb_state_list_item" + state_idx).closest(".imb_state_collapsible").trigger("collapse").remove(); // remove it from the list ui
			imb_update_list(".imb_state_collapsible", "imb_state_list_item"); // order the ui list element ids
			$(".imb_state_collapsible").each(function(index) {
				$(this).find(".yellow_state").html('State ' + (index + 1)); 
			});
		}
	}
}

function refresh_state_machine() {
	var book = book_list[book_list_idx]; // current book
	var page = book.page_list[book.page_list_idx]
	$("#statemachine-demo").empty();
	$.each(book.page_list[book.page_list_idx].state_list, function(index, state) { // append any states to the list ui
		left_pos = (state.xloc);
		top_pos = (state.yloc);
		insert_state_machine(index, left_pos, top_pos);
		instance.draggable($('#imb_state_machine_state' + index), {
			stop: function( event, ui ) {
				idx = get_numbers($(this).attr("id"));
				var book1 = book_list[book_list_idx]; // current book
				var page1 = book1.page_list[book.page_list_idx]; // curent page
				var state1 = page1.state_list[idx];				
				left_bound = ui.offset.left;
				top_bound = ui.offset.top;
				current_height = $(document).height()	
				current_width = $(document).width()
				yloc_percent = ((top_bound) / current_height) * 100;	
				xloc_percent = ((left_bound) / current_width) * 100;
				state1.xloc = xloc_percent;
				state1.yloc = yloc_percent;
			}					
		});
		instance.makeSource('imb_state_machine_state' + index, {
			filter:".ep",				// only supported by jquery
			onMaxConnections:function(info, e) {
				alert("Maximum connections (" + info.maxConnections + ") reached");
			}
		});
		instance.makeTarget('imb_state_machine_state' + index, {	
		});	
	});
	$.each(page.state_list, function(index) { // append any states to the list ui
		var state = page.state_list[index];
		$.each(state.transition_list, function(index2) { // append any transitions to the list ui
			var transition = state.transition_list[index2];
			if(transition.next_state_idx != undefined) {
				source_id = "imb_state_machine_state" + index;
				target_id = "imb_state_machine_state" + transition.next_state_idx;
				instance.connect({ source:source_id, target:target_id, reattach:true}).getOverlay("label").setLabel(imb_transition_label(transition.type) + (index2+1) );
			}
		});
	});
}

//----------------------------------------------------------------------------------------------------------------------------------------------------
// This function exits back to main authoring tool and refreshes state and transition info for the page being edited.
//----------------------------------------------------------------------------------------------------------------------------------------------------
function update_exit_state_machine() {
	history.go(-1);
	var book = book_list[book_list_idx]; // current book
	$("#cf_page").remove();
	$("#imb_page_list_item" + book.page_list_idx).trigger("expand");
}					

//-------------------------------------------------------------------------------------------------------------------------------------------------------------
// Event Listeners for STATE MACHINE
//-------------------------------------------------------------------------------------------------------------------------------------------------------------		
$(document).ready(function() { //opens the popup for state editor
	$("#statemachine-demo").on("click", ".w", function(event) {  // when user single clicks on the div representing a state
		state_idx = get_numbers($(this).attr("id"));
		var book = book_list[book_list_idx];
		var page = book.page_list[book.page_list_idx];
		var state = page.state_list[state_idx];
		page.state_list_idx = parseInt(state_idx);	
		state_html = cf_state(state_idx, true);
		$("#popupMessageState").find("p").html('<div id="reduced_collapsible_margins">' + state_html + '</div>');
		$("#popupMessageState").popup("open");
		//$("#imb_state_copy_btn").hide();		
		$("#popupMessageState").trigger("create");
	});	
});



// **************************************************************************************************************************************************************************************************
// ALL PURPOSE FUNCTIONS
// **************************************************************************************************************************************************************************************************

//-----------------------------------------------------------------------------------------------------------------------------
// This function returns only the numbers from any string of text using regular expressions
//-----------------------------------------------------------------------------------------------------------------------------
function get_numbers(input) {
	if (typeof input != 'undefined') {
		return parseInt(input.match(/[0-9]+/g));
	} else {
		if (debug) console.log("get_numbers: undefined input ERROR!");
	}
}

function get_letters(input) {
	if (typeof input != 'undefined') {
		return $.trim(input.match(/[a-zA-Z]+/g));
	} else {
		if (debug) console.log("get_letters: undefined input ERROR!");
	}
}

function max_id_num(common_class) {
	var numArray = new Array();
	if ($("#confirmed_vi_responses ." + common_class).length == 0) {// if there are no objects with this common class, then return -1, so that the idx will be set to 0 and will display "1" in the object header.
		return -1;
	}
	$("#confirmed_vi_responses ." + common_class).each(function(idx) {
		numArray.push(parseInt(get_numbers($(this).attr('id'))));
	});
	return Math.max.apply(Math, numArray);
}

function convert_objtypes(name_or_number, objtype) { //converts objtypes between number or string
		if (name_or_number == "name") {
			switch (objtype) {
				case "hot": // hotspot
					converted_objtype = "1";
				break;
				case "drag": // draggable
					converted_objtype = "2";
				break;
				case "cont": // container
					converted_objtype = "3";		
				break;
				default:
					console.log("ERROR! objtype:" + objtype);
				break;
			}	
		}
		else {
			switch (objtype) {
				case "1": // hotspot
					converted_objtype = "hot";
				break;
				case "2": // draggable
					converted_objtype = "drag";
				break;
				case "3": // container
					converted_objtype = "cont";		
				break;
				default:
					console.log("ERROR! objtype:" + objtype);
				break;
			}			
		}
	return converted_objtype;
}

//Handle yes/no toggle for show btn
function toggle_show_btn(id, current_icon) {
	if (current_icon == undefined) {
		object_attribute = $('#' + id).attr('data-icon');
	}
	else {
		object_attribute = current_icon
	}
	obj_group = $("#" + id).attr('obj_group');
	if (obj_group != undefined) {
		$("#content_" + obj_group + get_numbers(id) + " .confirmed_object_row").each(function(index) { //loop through confirmed objects of active panel
				number_of_confirmed_row = get_numbers($(this).attr("id"));
				if (object_attribute == "alert") {
					toggle_show_btn("imb_show" + number_of_confirmed_row, "alert");
				}
				else if (object_attribute == "star") {
					toggle_show_btn("imb_show" + number_of_confirmed_row, "star");
				}
		});
	}
	if (object_attribute == "alert") {
		$("#" + id).attr('data-icon', 'star');
		$("#" + id).attr("data-theme", "e").removeClass("ui-btn-up-a").addClass("ui-btn-up-e");
		$("#" + id).removeClass("ui-btn-hover-a").addClass("ui-btn-hover-e");
		$("#" + id).buttonMarkup({ icon: "star" });
		//$("#" + id).trigger('create');
		$("#confirmed_display_object" + get_numbers(id)).show();
	}
	else if (object_attribute == "star") {
		$('#' + id).attr('data-icon', 'alert');
		$("#" + id).buttonMarkup({ icon: "alert" });
		$("#" + id).attr("data-theme", "a").removeClass("ui-btn-up-e").addClass("ui-btn-up-a");
		$("#" + id).removeClass("ui-btn-hover-e").addClass("ui-btn-hover-a");
		//$("#" + id).trigger('create');	
		$("#confirmed_display_object" + get_numbers(id)).hide();		
	}			
}

function toggle_all_objects(show_or_hide) {
	if(show_or_hide == 'show') {
		$(".accord_show_btn").each(function(index) { //loop through confirmed objects of active panel
			id_of_panel = $(this).attr("id");
			toggle_show_btn(id_of_panel, "alert")
		});
	}
	else if(show_or_hide == 'hide') {
		$(".accord_show_btn").each(function(index) { //loop through confirmed objects of active panel
			id_of_panel = $(this).attr("id");
			toggle_show_btn(id_of_panel, "star")
		});
	}		
}