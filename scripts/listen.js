/* iMapBook Application (IMB) - listen (speech recognition) functions
 * iMapBook LLC
 * All Rights Reserved
 * 2016
 * Version 1.0
 */
var langs =
        [['Afrikaans', ['af-ZA']],
            ['Bahasa Indonesia', ['id-ID']],
            ['Bahasa Melayu', ['ms-MY']],
            ['Catal�', ['ca-ES']],
            ['Ce�tina', ['cs-CZ']],
            ['Deutsch', ['de-DE']],
            ['English', ['en-AU', 'Australia'],
                ['en-CA', 'Canada'],
                ['en-IN', 'India'],
                ['en-NZ', 'New Zealand'],
                ['en-ZA', 'South Africa'],
                ['en-GB', 'United Kingdom'],
                ['en-US', 'United States']],
            ['Espa�ol', ['es-AR', 'Argentina'],
                ['es-BO', 'Bolivia'],
                ['es-CL', 'Chile'],
                ['es-CO', 'Colombia'],
                ['es-CR', 'Costa Rica'],
                ['es-EC', 'Ecuador'],
                ['es-SV', 'El Salvador'],
                ['es-ES', 'Espa�a'],
                ['es-US', 'Estados Unidos'],
                ['es-GT', 'Guatemala'],
                ['es-HN', 'Honduras'],
                ['es-MX', 'M�xico'],
                ['es-NI', 'Nicaragua'],
                ['es-PA', 'Panam�'],
                ['es-PY', 'Paraguay'],
                ['es-PE', 'Per�'],
                ['es-PR', 'Puerto Rico'],
                ['es-DO', 'Rep�blica Dominicana'],
                ['es-UY', 'Uruguay'],
                ['es-VE', 'Venezuela']],
            ['Euskara', ['eu-ES']],
            ['Fran�ais', ['fr-FR']],
            ['Galego', ['gl-ES']],
            ['Hrvatski', ['hr_HR']],
            ['IsiZulu', ['zu-ZA']],
            ['�slenska', ['is-IS']],
            ['Italiano', ['it-IT', 'Italia'],
                ['it-CH', 'Svizzera']],
            ['Magyar', ['hu-HU']],
            ['Nederlands', ['nl-NL']],
            ['Norsk bokm�l', ['nb-NO']],
            ['Polski', ['pl-PL']],
            ['Portugu�s', ['pt-BR', 'Brasil'],
                ['pt-PT', 'Portugal']],
            ['Rom�na', ['ro-RO']],
            ['Slovencina', ['sk-SK']],
            ['Suomi', ['fi-FI']],
            ['Svenska', ['sv-SE']],
            ['T�rk�e', ['tr-TR']],
            ['?????????', ['bg-BG']],
            ['P??????', ['ru-RU']],
            ['??????', ['sr-RS']],
            ['???', ['ko-KR']],
            ['??', ['cmn-Hans-CN', '??? (????)'],
                ['cmn-Hans-HK', '??? (??)'],
                ['cmn-Hant-TW', '?? (??)'],
                ['yue-Hant-HK', '?? (??)']],
            ['???', ['ja-JP']],
            ['Lingua latina', ['la']]];


// globals for the speech recognition
var recording = false;
var keep_going = false;
var ignore_onend;
var recognition = new webkitSpeechRecognition(); // SpeechRecognition() in Firefox
var final_transcript = "";

// this updates the an internal record of the transcript to correspond
// to what is stored visually; it is meant to synchronize the voice recognition
// transcripts with what the mouse/keyboard lexicon entries can change
function update_speech_transcript(action, text) {
	if (action === "append") {
		final_transcript += text;
	}
	else if (action === "set") {
		final_transcript = text;
	}
	else if (action === "clear") {
		final_transcript = "";
	}
}

// initialization
function initialize_speech_recognition() {
    recognition.continuous = true; // this does not work on Firefox
    recognition.interimResults = true;
	// temporary, just use English for now
	recognition.lang = 'en-US';

    // when we start the process, change the mic image
    recognition.onstart = function () {
        recording = true;
		$("#imb_btn_mic").css('background-image', 'url(data/icons/mic-on.png)');
    };

    // if there's an error, stop the recording
    recognition.onerror = function (event) {
		// if the recorder stopped because it heard silence, keep it going
        if (event.error == 'no-speech') {
            keep_going = true;
        }
		// otherwise, it's an actual problem to consider
        if (event.error == 'audio-capture') {
            ignore_onend = true;
			$("#imb_btn_mic").css('background-image', 'url(data/icons/mic-off.png)');
        }
        if (event.error == 'not-allowed') {
            ignore_onend = true;
			$("#imb_btn_mic").css('background-image', 'url(data/icons/mic-off.png)');
        }
    };
	
	// the recording is finished when it no longer hears anything or if it was
	// explicitly told to stop
	recognition.onend = function () {
		// if we're not done yet, restart it
		if (keep_going) {
			recognition.start();
			keep_going = false;
			return;
		}
		// otherwise, clean up and shut it down
		recording = false;
		if (ignore_onend) {
			return;
		}
		// change display of the microphone if desired
		$("#imb_btn_mic").css('background-image', 'url(data/icons/mic-off.png)');
	};

    // Now, process the results. It will be held in interim until it's clear
    // that the user has finished talking.
    recognition.onresult = function (event) {
		var transcript = final_transcript;
		// ignore this function entirely if we already stopped the recorder
		if (!is_speech_recording()) {
			return;
		}
		// keep the recorder going if we ever got anything
		keep_going = (event.results.length > 0);
		
        for (var i = event.resultIndex; i < event.results.length; ++i) {
			transcript += event.results[i][0].transcript;
			// save more permanently the final results
			if (event.results[i].isFinal) {
				final_transcript += event.results[i][0].transcript;
			}
        }
        // OUTPUT: this is where the output from the recorder goes
		$("#imb_game_display_content_bottom_text").html(linebreak(transcript));
    };
}

// helper formatting functions
var two_line = /\n\n/g;
var one_line = /\n/g;
function linebreak(s) {
    return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}
var first_char = /\S/;
function capitalize(s) {
    return s.replace(first_char, function (m) {
        return m.toUpperCase();
    });
}

// helper function to easily determine if the recorder is currently on
function is_speech_recording() {
	return recording;
}

// start the process (clicked start button)
function toggle_speech_recorder() {
	// if we're recording right now, stop it
	if (recording) {
		recording = false;
		recognition.stop();
		return;
	}
	
	// clear the default text if it's there
	if (default_text_shown()) {
		$("#imb_game_display_content_bottom_text").html("");
	}
	// but if it's not, make sure there's a space between this new set of text
	// and the previous block of text
	else {
		var txt = $("#imb_game_display_content_bottom_text").text();
		if (txt.length > 0) {
			txt = txt.trim() + " ";
			$("#imb_game_display_content_bottom_text").text(txt);
		}
		update_speech_transcript("set", txt);
	}

	// start the recorder
	recognition.start();
	ignore_onend = false;
}
