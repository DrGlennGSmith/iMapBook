<?php
$imb_text = (isset($_GET["imb_text"])) ? $_GET["imb_text"] : '';
$imb_scene = (isset($_GET["imb_scene"])) ? $_GET["imb_scene"] : '';

// get the token first	
$url = 'https://vpf2.cise.ufl.edu:35000/oauth2/token';
$data = array('grant_type' => 'client_credentials');

$clientid = "82b3ecea7c4c488bac1e6a8942d1ec73";
$secret = "vK5idmBY3Qtk6ctJgrLfol0MA-yzftoNn0-CIr_ziKU";

$options = array(
    'http' => array(
        'header' => "Content-type: application/x-www-form-urlencoded\r\nAuthorization: Basic " . base64_encode("$clientid:$secret"),
        'method' => 'POST',
        'content' => http_build_query($data),
        'timeout' => 5,
    ),
);

$ctx = stream_context_create(array('http'=>
    array(
        'timeout' => 5,  // 5 seconds
    )
));

$context = stream_context_create($options);
$token_response = json_decode(file_get_contents($url, false, $context), true);
$token = $token_response["access_token"];
$response = file_get_contents("https://vpf2.cise.ufl.edu:35000/api/Interaction/FindResponse?ScenarioID=".$imb_scene."&access_token=".$token."&userinput=".urlencode($imb_text), false, $ctx);
// return values
$return_object = json_decode($response, true);
$rval = $return_object['SpeechText'];
$character = $return_object['CharacterID'];
$audio = $return_object['AudioFileName'];
if ($rval !== null) {
    echo json_encode((object) array('status' => 'success', 'token' => $token, 'response' => $response, 'character' => $character, 'audio' => $audio, 'return' => $rval));
} else {
    echo json_encode((object) array('status' => 'error', 'token' => $token, 'response' => $response, 'return'  => 'VPF Mismatch!')); 
}

// return the result
echo $result;
?>
