function jqm_alert(header, description, callbackYes, callbackNo, buttonTextYes, buttonTextNo) {
	var btnSelectorYes;
	var btnSelectorNo;

	//Make sure the callbacks are defined
	if (typeof callbackYes === "undefined" || callbackYes === '') {
		callbackYes = function(){};
	}
	if (typeof callbackNo === "undefined" || callbackNo === '') {
		callbackNo = function(){};
	}
	
	//Check that the popup element exists on the page because this function is shared
	if ($("#jqm_popup").length < 1) {
		if (confirm(description)) {
			callbackYes();
		} else {
			callbackNo();
		}
		
		return;
	}
	
	//Set the text for the popup
	$("#jqm_popup .header").text(header);
	$("#jqm_popup .text").html(description);

	btnSelectorYes = "#jqm_popup .jqm_popup_yes";
	btnSelectorNo = "#jqm_popup .jqm_popup_no";
	
	if ($("#jqm_popup .jqm_popup_yes .ui-btn-inner").length !== 0) {
		btnSelectorYes += " .ui-btn-inner";
		btnSelectorNo += " .ui-btn-inner";
	}

	//Set text for the buttons
	if (typeof buttonTextYes !== "undefined") {
		$(btnSelectorYes).text(buttonTextYes);
	}
	else {
		$(btnSelectorYes).text("Okay");
	}
	if (typeof buttonTextNo !== "undefined") {
		$(btnSelectorNo).text(buttonTextNo);
	}
	else {
		$(btnSelectorNo).text("Cancel");
	}
	
	//Set events
	$("#jqm_popup .jqm_popup_yes").unbind("click.popup").on("click.popup", function() {
		callbackYes();
	    $(this).off("click.popup");
	});
	
	$("#jqm_popup .jqm_popup_no").unbind("click.popup").on("click.popup", function() {
		callbackNo();
	    $(this).off("click.popup");
	});

	$.mobile.changePage("#jqm_popup");

	$("#jqm_popup").trigger("create");
}

function isScreenLarge(width, height) {
	// determine the size of the screen based on the given dimensions, or default width	
	return ((width) ? window.matchMedia("(min-width: " + width + ")").matches : window.matchMedia("(min-width: 45em)").matches) &&
		   ((height) ? window.matchMedia("(min-height: " + height + ")").matches : true);
}