<?php
require_once 'speak.php';

$imb_text = (isset($_GET["imb_text"])) ? $_GET["imb_text"] : '';
$imb_attr = (isset($_GET["imb_attr"])) ? $_GET["imb_attr"] : '';
$imb_codec = (isset($_GET["imb_codec"])) ? $_GET["imb_codec"] : '';

function TextToAudioService($imb_text, $imb_attr, $imb_codec) {
	$rv = '';
	if (strlen($imb_text) > 0) {
		// if there is a file under /data/sounds matching $imb_text.wav then return that string instead
		$filename = strtolower(str_replace(array('\'', '"', ',', '.', '!', '?', ' '),'_',$imb_text));
		if (file_exists("../../data/sounds/".$filename.".wav")) { // only support recorded .wav files
			$rv = "data/sounds/".$filename.".wav";
		} else {
			$tta = new TextToAudio($imb_codec, $imb_attr);
			$rv = "data:audio/".$imb_codec.";base64,".base64_encode($tta->speak($imb_text));
		}
	}
	return $rv;
}

echo TextToAudioService($imb_text, $imb_attr, $imb_codec);

?>