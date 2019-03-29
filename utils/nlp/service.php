<?php 

require_once "../../constants.php";
require_once "../../common.php";

// extract service action
$action = (isset($_GET["action"])) ? $_GET["action"] : ((isset($_POST["action"])) ? $_POST["action"] : "do_nothing");

session_start();
if (isset($_SESSION["s_start_dt"])) { // session exists
    $s_start_dt = $_SESSION["s_start_dt"];
    $s_user_id = $_SESSION["s_user_id"];
    $s_type_id = $_SESSION["s_type_id"];
    $s_cohort_id = $_SESSION["s_cohort_id"];
}
else {
	switch ($action) {
		// acceptable actions without a session
		case "test_nlp":
			process_nlp($_GET["user"], $_GET["correct"]);
			break;
		
		// everything else is unacceptable without a session
		default:
			echo json_encode((object) array('status' => 'error', 'value' => 'Unauthorized access!'));
			exit;
	}
}

function process_nlp($msg_user, $msg_correct) {
	if(!($sock = socket_create(AF_INET, SOCK_STREAM, 0))) {
		$errorcode = socket_last_error();
		$errormsg = socket_strerror($errorcode);
		 
		echo json_encode((object) array('status' => 'error', 'value' => "Couldn't create socket: [" . $errorcode. "] " . $errormsg . "\n"));
		return;
	}
	 
	//Connect socket to remote server
	if(!socket_connect($sock, 'localhost', 17650)) {
		$errorcode = socket_last_error();
		$errormsg = socket_strerror($errorcode);
		 
		echo json_encode((object) array('status' => 'error', 'value' => "Couldn't connect: [" . $errorcode. "] " . $errormsg . "\n"));
		return;
	}
	 
	//Send the message to the server
	if ($msg_user == 'stop testing the server') {
		$socket_msg = json_encode((object) array('action' => '^$HUTD0WN^', 'user' => $msg_user, 'correct' => $msg_correct)) . "\n";
	}
	else {
		$socket_msg = json_encode((object) array('action' => 'compare', 'user' => $msg_user, 'correct' => $msg_correct)) . "\n";
	}
	if(!socket_send($sock , $socket_msg, strlen($socket_msg), 0)) {
		$errorcode = socket_last_error();
		$errormsg = socket_strerror($errorcode);
		 
		echo json_encode((object) array('status' => 'error', 'value' => "Couldn't send data: [" . $errorcode. "] " . $errormsg . "\n"));
		socket_close($sock);
		return;
	}
	 
	//Now receive reply from server
	if(socket_recv ($sock, $buffer, 2045, MSG_WAITALL) === FALSE) {
		$errorcode = socket_last_error();
		$errormsg = socket_strerror($errorcode);
		 
		echo json_encode((object) array('status' => 'error', 'value' => "Couldn't receive data: [" . $errorcode. "] " . $errormsg . "\n"));
		socket_close($sock);
		return;
	}
	
	echo json_encode((object) array('status' => 'success', 'value' => $buffer));
	socket_close($sock);
}

?>