<?php

/* iMapBook Application (IMB)
 * iMapBook LLC
 * All Rights Reserved
 * 04/08/2014
 * 
 * Version 2.5
 */
require_once "constants.php";
require_once "common.php";

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
		case "login":
		case "register":
		case "check_username":
		case "check_code":
		case "avatar_num":
			break;
		
		// everything else is unacceptable without a session
		default:
			echo json_encode((object) array('status' => 'error', 'value' => 'Unauthorized access!'));
			exit;
	}
}

// now, process the action and return desired results (if any)
switch ($action) {
	// login user
    case 'login':
        $imb_user = (isset($_GET["imb_user"])) ? $_GET["imb_user"] : $_POST["imb_user"];
        $imb_pass = (isset($_GET["imb_pass"])) ? $_GET["imb_pass"] : $_POST["imb_pass"];
        $imb_token = (isset($_GET["imb_token"])) ? $_GET["imb_token"] : $_POST["imb_token"];

		// process the login information and get back the necessary details
		// if nothing was returned, then the login attempt failed
		$return_arr = handle_login($imb_user, $imb_pass, $imb_token);
		if ($return_arr == null) {
			echo json_encode((object) array('status' => 'error', 'value' => 'Invalid user name and/or password. Please try again.'));
		}
		else {
			echo json_encode((object) $return_arr);
		}
        break;
	
	// register new user
    case 'register':
        $imb_user_name = (isset($_GET["register_user_name"])) ? $_GET["register_user_name"] : $_POST["register_user_name"];
        $imb_login_name = (isset($_GET["register_login_name"])) ? $_GET["register_login_name"] : $_POST["register_login_name"];
        $imb_pass = (isset($_GET["register_password"])) ? $_GET["register_password"] : $_POST["register_password"];
        $imb_code = (isset($_GET["register_code"])) ? $_GET["register_code"] : $_POST["register_code"];
		
		// process the registration information and pass back whatever is
		// returned; if the registration succeeds, it will return something
		// similar to the login function
		$return_arr = handle_registration($imb_user_name, $imb_login_name, $imb_pass, $imb_code);
		if ($return_arr == null) {
			echo json_encode((object) array('status' => 'error', 'value' => 'Registration invalid. Please try again later.'));
		}
		else {
			echo json_encode((object) $return_arr);
		}
        break;
	
	// check if username is unique
	case 'check_username':
        $imb_user = (isset($_GET["register_login_name"])) ? $_GET["register_login_name"] : $_POST["register_login_name"];
		echo (does_username_exist($imb_user)) ? "false" : "true";
		break;
	
	// check if the registration code is valid
	case 'check_code':
        $imb_code = (isset($_GET["register_code"])) ? $_GET["register_code"] : $_POST["register_code"];
		echo (is_registration_code_valid($imb_code) == null) ? "false" : "true";
		break;

    case 'archive': // archive user response
        global $DB;
        $book_id = (isset($_GET["imb_book_id"])) ? $_GET["imb_book_id"] : $_POST["imb_book_id"];
        $page_id = (isset($_GET["imb_page_id"])) ? $_GET["imb_page_id"] : $_POST["imb_page_id"];
        $state_id = (isset($_GET["imb_state_id"])) ? $_GET["imb_state_id"] : $_POST["imb_state_id"];
        $response = trim((isset($_GET["imb_response"])) ? $_GET["imb_response"] : $_POST["imb_response"]);
        $response_type_id = (isset($_GET["imb_response_type_id"])) ? $_GET["imb_response_type_id"] : $_POST["imb_response_type_id"];
        $response_weight = (isset($_GET["imb_response_weight"])) ? $_GET["imb_response_weight"] : $_POST["imb_response_weight"];

        $db0 = new MySQLClient($DB);
        $query = "INSERT INTO user_response (user_id, book_id, page_id, state_id, session_start_dt, response, response_type_id, response_weight) ";
        $query.= "VALUES (" . $s_user_id . ", " . $book_id . ", " . $page_id . ", " . $state_id . ", FROM_UNIXTIME(" . $s_start_dt . "), '" . addslashes($response) . "', " . $response_type_id . ", " . $response_weight . ")";
        $db0->update($query);
        $db0->closeDbConnection();
        echo json_encode((object) array('status' => 'success', 'value' => $query)); // just ignore failures
        break;

    case 'book': // extract book related data
        global $DB;
        $book_page = 0;
        $book_score = 0;
        $book_id = (isset($_GET["imb_book_id"])) ? $_GET["imb_book_id"] : $_POST["imb_book_id"];

        $db0 = new MySQLClient($DB);
        // obtain the current page and score (based on unique responses) up to but not including the current page in the latest session matching the search criteria.
        $query = "select page_id, response_weight ";
        $query.= "from user_response ";
        $query.= "where user_id = '" . $s_user_id . "' and book_id = '" . $book_id . "' and response_type_id = 0 and response_dt = (select max(response_dt) from user_response where user_id = '" . $s_user_id . "' and book_id = '" . $book_id . "' and response_type_id = 0);";
        if ($db0->query($query) AND $db0->getNumberRows() > 0) {
            $book_page = $db0->data[0][0];
            $book_score = $db0->data[0][1];
        }

        echo json_encode((object) array('status' => 'success', 'value' => $query, 'book_page' => $book_page, 'book_score' => $book_score));
        $db0->closeDbConnection();
        break;

    case 'pages': // extract book page related data
        global $DB;
        $book_id = (isset($_GET["imb_book_id"])) ? $_GET["imb_book_id"] : $_POST["imb_book_id"];
        $page_arr = array();

        $db0 = new MySQLClient($DB);
        // obtain the number of game completes since last book reset for each page_id (page_idx)
        $query = "select page_id, count(*) ";
        $query.= "from user_response ";
        $query.= "where user_id = '" . $s_user_id . "' and book_id = '" . $book_id . "' and response_type_id = 102 and response_dt >= (select max(response_dt) from user_response where user_id = '" . $s_user_id . "' and book_id = '" . $book_id . "' and response_type_id = 100) ";
        $query.= "group by page_id;";
        if ($db0->query($query)) {
            for ($x = 0; $x < $db0->getNumberRows(); $x++) {
                $page_arr[$x][0] = $db0->data[$x][0];
                $page_arr[$x][1] = $db0->data[$x][1];
            }
        }

        echo json_encode((object) array('status' => 'success', 'pages' => $page_arr));
        $db0->closeDbConnection();
        break;

    case 'achievement': // extract achievement related data
        global $DB;
        $db0 = new MySQLClient($DB);
        // TODO : add additional server-side achivements logic here
        $db0->closeDbConnection();
        break;
	
	case 'avatar_num': // gets how many avatar images to load
		$num_avatars = get_max_avatar_number();
		echo json_encode((object) array('status' => 'success', 'value' => $num_avatars));
		break;

    case 'objects': // save or load collected objects
        global $DB;
        $book_id = (isset($_GET["imb_book_id"])) ? $_GET["imb_book_id"] : $_POST["imb_book_id"];
        $object = (isset($_GET["imb_object"])) ? $_GET["imb_object"] : $_POST["imb_object"];
        $action = trim((isset($_GET["imb_action"])) ? $_GET["imb_action"] : $_POST["imb_action"]);
        $object_arr = array();

        // objects are considered current if they were received after the last reset (type_id = 100) or if reset never occured for this user/book
        $db0 = new MySQLClient($DB);
        $query = "SELECT max(response_dt) FROM user_response WHERE user_id = " . $s_user_id . " and book_id = " . $book_id . " and response_type_id = 100;";
        if ($db0->query($query) && $db0->getNumberRows() == 1) {
            $dt = $db0->data[0][0];
        } else {
            $dt = "1970-01-01 00:00:01";
        }
        if ($action == "save") {
            // get the user/book object from DB that was picked after the last reset
            $query = "SELECT object FROM user_object WHERE user_id = " . $s_user_id . " and book_id = " . $book_id . " and object = '" . $object . "' and object_dt >= '" . $dt . "';";
            if ($db0->query($query) && $db0->getNumberRows() > 0) { // record already exists
                echo json_encode((object) array('status' => 'success', 'objects' => $object_arr, 'value' => $query));
            } else {
                $query = "INSERT INTO user_object (user_id, book_id, session_start_dt, object) ";
                $query.= "VALUES (" . $s_user_id . ", " . $book_id . ", FROM_UNIXTIME(" . $s_start_dt . "), '" . addslashes($object) . "')";
                $db0->update($query);
                $object_arr[0][0] = $object;
                echo json_encode((object) array('status' => 'success', 'objects' => $object_arr, 'value' => $query));
            }
        } else if ($action == "load") {
            if (strlen($object) > 0) { // select specific object
                // get the user/book object from DB that was picked after the last reset
                $query = "SELECT object FROM user_object WHERE user_id = " . $s_user_id . " and book_id = " . $book_id . " and object = '" . $object . "' and object_dt >= '" . $dt . "';";
            } else { // select all object for this user, book and session
                $query = "SELECT object FROM user_object WHERE user_id = " . $s_user_id . " and book_id = " . $book_id . " and object_dt >= '" . $dt . "';";
            }
            if ($db0->query($query)) {
                for ($x = 0; $x < $db0->getNumberRows(); $x++) {
                    $object_arr[$x][0] = $db0->data[$x][0];
                }
            }
            echo json_encode((object) array('status' => 'success', 'objects' => $object_arr, 'value' => $query));
        }
        $db0->closeDbConnection();
        break;

    case 'vpf_match': // match egainst vpf
        global $DB;
        global $VPF;
        $book_id = (isset($_GET["imb_book_id"])) ? $_GET["imb_book_id"] : $_POST["imb_book_id"];
        $scenario_id = (isset($_GET["scenario_id"])) ? $_GET["scenario_id"] : $_POST["scenario_id"];
        $user_input = (isset($_GET["user_input"])) ? $_GET["user_input"] : $_POST["user_input"];
        // default response
        $response_state = 'mismatch';
        $response_text = '';

        // if we were passed a 999999 scenario id then see if we have a user/book scenario entry in vpf table.
        if ($VPF != 0 && $scenario_id === '999999') {
            $db0 = new MySQLClient($DB);
            $query = "SELECT vpf_id FROM vpf WHERE user_id = " . $s_user_id . " and book_id = " . $book_id . ";";
            if ($db0->query($query) && $db0->getNumberRows() > 0) { // got vpf scenario
                $scenario_id = $db0->data[0][0];
            }
            $db0->closeDbConnection();
        }
        // execute vpf service call IF we have a scenario
        if ($VPF != 0 && $scenario_id !== '999999') {
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

            $ctx = stream_context_create(array('http' =>
                array(
                    'timeout' => 5, // 5 seconds
                )
            ));

            $context = stream_context_create($options);

            $token_response = json_decode(file_get_contents($url, false, $context), true);
            $token = $token_response["access_token"];

            $text_response = file_get_contents("https://vpf2.cise.ufl.edu:35000/api/Interaction/FindResponse?ScenarioID=" . $scenario_id . "&access_token=" . $token . "&userinput=" . urlencode($user_input), false, $ctx);
            $text_decoded = json_decode($text_response, true);
            if (isset($text_decoded['SpeechText'])) {
                $response_text = $text_decoded['SpeechText'];
                $response_character = $text_decoded['CharacterID'];
                $response_audio = $text_decoded['AudioFileName'];
                $response_state = 'match';
            }
        }
        // return matching response or blank
        echo json_encode((object) array('status' => 'success', 'state' => $response_state, 'value' => $response_text, 'character' => $response_character, 'audio' => $response_audio));
        break;
	
	// nlp matching
	case "nlp_match":
		$model = (isset($_GET["imb_model"])) ? $_GET["imb_model"] : $_POST["imb_model"];
		$filename = (isset($_GET["imb_file"])) ? $_GET["imb_file"] : $_POST["imb_file"];
		$question = (isset($_GET["imb_question"])) ? $_GET["imb_question"] : $_POST["imb_question"];
		$response = (isset($_GET["imb_response"])) ? $_GET["imb_response"] : $_POST["imb_response"];
	
		$url = 'http://octonion.data-lab.si:8787/predict';
		$data = array(
			'modelId' => $model, 
			'modelFilename' => $filename,
			'question' => $question,
			'questionResponse' => $response
		);

		$options = array(
			'http' => array(
				'header'  => "Content-type: application/json\r\n",
				'method'  => 'POST',
				'content' => json_encode($data)
			)
		);
		$context  = stream_context_create($options);
		$result = file_get_contents($url, false, $context);
		if ($result === FALSE) {
			echo json_encode((object) array('status' => 'error', 'score' => -1));
		} else {
			echo $result;
		}
		break;
	
	// get social groups available for this user
    case "social_groups_list":
		global $DB;
		$book_id = (isset($_GET["imb_book_id"])) ? $_GET["imb_book_id"] : $_POST["imb_book_id"];
		$return_arr = array('bookclubs' => array(), 'latest_page' => -1, 'answers' => array(), 'profile' => 0);
		
		$db0 = new MySQLClient($DB);
		// get all of the bookclubs this user has access to, which will differ
		// depending on user type; admins and writers access all for their profile, while
		// readers only have their defined bookclub
		$query  = "SELECT a.bookclub, b.social_profile, b.bookclubs ";
		$query .= "FROM user a JOIN cohort b ON (a.cohort_id = b.cohort_id) ";
		$query .= "WHERE user_id =' " . $s_user_id . "';";
		if ($db0->query($query)) {
			$bookclub = (int)$db0->data[0][0];
			$profile = (int)$db0->data[0][1];
			$return_arr['settings'] = $profile;
			
			// if the social profile allows intra-club chat, get the appropriate bookclub(s)
			if (($profile & 1) || ($profile & 4)) {
				$query  = "SELECT social_id, name, description FROM social ";
				if (($s_type_id & 4) || ($s_type_id & 2)) {
					// admins and writers get all bookclubs for their cohort
					$query .= "WHERE cohort_id = " . $s_cohort_id . " ORDER BY social_id ASC LIMIT " . $db0->data[0][2] . ";";
				}
				else {
					// normal users only get their own bookclub
					$query .= "WHERE social_id = " . $bookclub . " ORDER BY social_id ASC;";
				}
				
				// run the query to get the social groups
				if ($db0->query($query)) {
					for ($x = 0; $x < $db0->getNumberRows(); $x++) {
						$return_arr['bookclubs'][] = array($db0->data[$x][0], $db0->data[$x][1], $db0->data[$x][2]);
					}
				}
			}
			// if the social profile allows cohort-wide chat, create a global chat room
			if ($profile & 2) {
				// return a custom value indicating the global chat room
				array_unshift($return_arr['bookclubs'], array(0, "Global Chatroom", "This room allows everyone in your cohort to socialize with each other"));
			}
			// if the social profile allows discussion topics, add them
			if ($profile & 4) {
				$latest_page = -1;
				// find the furthest page number that you have reached
				$query  = "SELECT page_id FROM user_response ";
				$query .= "WHERE response_type_id=0 AND book_id=" . addslashes($book_id) . " AND user_id=" . $s_user_id . " ";
				$query .= "ORDER BY response_dt DESC LIMIT 1;";
				if ($db0->query($query)) {
					for ($x = 0; $x < $db0->getNumberRows(); $x++) {
						$latest_page = (int)$db0->data[$x][0];
					}
				}
				$return_arr['latest_page'] = $latest_page;
				
				// and find the answers you have given to all of the topics
				$answers = array();
				$query  = "SELECT sr.topic_id, sr.response ";
				$query .= "FROM ( SELECT topic_id, MAX(response_dt) as latest_dt ";
				$query .= "    FROM social_response WHERE book_id=0 AND user_id=4 AND topic_answer=1 ";
				$query .= "    GROUP BY topic_id ) AS dt ";
				$query .= "INNER JOIN social_response sr ON sr.topic_id=dt.topic_id AND sr.response_dt=dt.latest_dt;";
				if ($db0->query($query)) {
					for ($x = 0; $x < $db0->getNumberRows(); $x++) {
						$answers[] = array( "id" => $db0->data[$x][0], "answer" => $db0->data[$x][1] );
					}
				}
				$return_arr['answers'] = $answers;
			}
		}
		
		$db0->closeDbConnection();
		echo json_encode((object) array('status' => 'success', 'value' => $return_arr));
		break;

    case "social_read": // read from a social group
		global $DB;
		$chat_type = (isset($_GET["imb_social_profile"])) ? $_GET["imb_social_profile"] : $_POST["imb_social_profile"];
		$topic_id = (isset($_GET["imb_topic_id"])) ? $_GET["imb_topic_id"] : $_POST["imb_topic_id"];
		$book_id = (isset($_GET["imb_book_id"])) ? $_GET["imb_book_id"] : $_POST["imb_book_id"];
		$page_id = (isset($_GET["imb_page_id"])) ? $_GET["imb_page_id"] : $_POST["imb_page_id"];
		$state_id = (isset($_GET["imb_state_id"])) ? $_GET["imb_state_id"] : $_POST["imb_state_id"];
		$latest_dt = (isset($_GET["imb_date"])) ? $_GET["imb_date"] : $_POST["imb_date"];
		$chosen_club = addslashes((isset($_GET["imb_social_id"]) ? $_GET["imb_social_id"] : $_POST["imb_social_id"]));
		$is_blocked = false;
		// by default, return nothing
		$return_arr = array();
		
		$db0 = new MySQLClient($DB);
		// first, get what social profile and bookclub this user belongs to, so we can
		// request the proper responses; if the user wants to read from a different
		// bookclub, something else will need to change that entry in the database
		$query  = "SELECT a.bookclub, a.blocked, b.social_profile ";
		$query .= "FROM user a JOIN cohort b ON (a.cohort_id = b.cohort_id) ";
		$query .= "WHERE user_id = '" . addslashes($s_user_id) . "'";
		if ($db0->query($query) && ($db0->data[0][2] > 0)) {
			$profile = $db0->data[0][2];
			$bookclub_id = $db0->data[0][0];
			$is_blocked = ($db0->data[0][1] == 1);
			$read = false;
			
			// if we can do open chat, see if that was requested
			if (($chat_type == 1) && ($profile & 1)) {
				// if the user is an administrator, we care what bookclub was requested
				// otherwise, only write to their assigned group
				if (($s_type_id & 4) || ($s_type_id & 2)) {
					$bookclub_id = $chosen_club;
				}
				$read = ($bookclub_id > 0);
				$profile = 1;
			}
			// if we can do cohort-wide chat, see if that was requested
			else if (($chat_type == 2) && ($profile & 2)) {
				$read = ($bookclub_id > 0);
				$profile = 2;
			}
			// if we can do topic-based chat, see if that was requested
			else if (($chat_type == 4) && ($profile & 4) && ($topic_id > 0)) {
				// same admin/write issue as in open chat
				if (($s_type_id & 4) || ($s_type_id & 2)) {
					$bookclub_id = $chosen_club;
				}
				$read = ($bookclub_id > 0);
				$profile = 4;
			}
			
			// now that we have this information, get all the responses for this club
			$query  = "SELECT a.user_id, b.user_name, a.response, a.response_dt, b.avatar, a.message_id, d.status ";
			$query .= "FROM social_response a LEFT JOIN user b ON (a.user_id = b.user_id) JOIN social c ON (a.social_id=c.social_id) ";
			$query .= "LEFT JOIN social_response_read d ON (a.message_id = d.message_id AND d.user_id=" . $s_user_id . ") ";
			$query .= "WHERE c.blocked=0 AND b.blocked=0 AND a.blocked=0 AND a.archived=0 AND a.topic_answer=0 AND b.cohort_id = '" . addslashes($s_cohort_id) . "' ";
			// the profile affects the kind of message to get
			$query .= "AND a.social_profile = " . $profile . " ";
			if ($profile != 2) {
				$query .= "AND a.social_id = " . $bookclub_id . " ";
			}
			// if the profile is for topics, then look at the topic
			$query .= "AND a.topic_id = '" . (($profile == 4) ? addslashes($topic_id) : 0) . "' ";
			// if we have a topic of interest, then we also care about the book
			if ($profile == 4) {
				$query .= "AND a.book_id = '" . addslashes($book_id) . "' ";
			}
			// if we have a timestamp limit, include that too
			if ($latest_dt != '') {
				$query .= "AND a.response_dt > '" . addslashes($latest_dt) . "' ";
			}
			$query .= "ORDER BY a.response_dt ASC;";
			
			// array to handle updates
			$update_arr = array();
			
			// the resulting structure is a list of users, with associated data,
			// one element of which is a list of their responses
			if ($read && !$is_blocked && $db0->query($query)) {
				// this maps the db user-ids to their index in the resulting array
				$user_map = array();
				// this array stores all the user data
				$user_data = array();
				// and this array stores all the responses
				$response_arr = array();
				// index for the user entries
				$user_index = -1;
				
				// process the query results
				for ($x = 0; $x < $db0->getNumberRows(); $x++) {
					// first, check if the user for this response needs their data stored
					if (!array_key_exists($db0->data[$x][0], $user_map)) {
						// update the user-id map
						$user_index = sizeof($user_data);
						$user_map[$db0->data[$x][0]] = $user_index;
						// store the details of this new user
						$user_data[$user_index][0] =  $db0->data[$x][1];	// user name
						$user_data[$user_index][1] = ($db0->data[$x][0] == $s_user_id);	// myself or other person
						$user_data[$user_index][2] =  $db0->data[$x][4];	// avatar
					}
					else {
						$user_index = $user_map[$db0->data[$x][0]];
					}
					
					// store the response for this user
					$response_arr[$x][0] = $user_index;
					$response_arr[$x][1] = $db0->data[$x][2];	// response
					$response_arr[$x][2] = $db0->data[$x][3];	// time
					
					// and record that this message will be read by the player
					if (is_null($db0->data[$x][6]) || $db0->data[$x][6] == 0) {
						$update_arr[] = "INSERT INTO social_response_read (user_id, message_id, status) VALUES (" . $s_user_id . "," . $db0->data[$x][5] . ",1) ;";
					}
				}
				
				// return these results
				$return_arr[0] = $user_data;
				$return_arr[1] = $response_arr;
			}
			
			// lastly, record that all of the messages returned have been read by that player
			foreach ($update_arr as $query) {
				$db0->query($query);
			}
		}
		
		// return the results
		$db0->closeDbConnection();
		echo json_encode((object) array('status' => 'success', 'value' => $return_arr, 'is_blocked' => $is_blocked));
        break;

	case "social_write": // write to a social group
		global $DB;
        $chat_type = (isset($_GET["imb_social_profile"])) ? $_GET["imb_social_profile"] : $_POST["imb_social_profile"];
        $topic_id = (isset($_GET["imb_topic_id"])) ? $_GET["imb_topic_id"] : $_POST["imb_topic_id"];
        $book_id = (isset($_GET["imb_book_id"])) ? $_GET["imb_book_id"] : $_POST["imb_book_id"];
        $page_id = (isset($_GET["imb_page_id"])) ? $_GET["imb_page_id"] : $_POST["imb_page_id"];
        $state_id = (isset($_GET["imb_state_id"])) ? $_GET["imb_state_id"] : $_POST["imb_state_id"];
		$chosen_club = addslashes((isset($_GET["imb_social_id"])) ? $_GET["imb_social_id"] : $_POST["imb_social_id"]);
        $response = trim((isset($_GET["imb_response"])) ? $_GET["imb_response"] : $_POST["imb_response"]);
        $final_answer = (isset($_GET["imb_as_answer"])) ? $_GET["imb_as_answer"] : $_POST["imb_as_answer"];
		$final_answer = ($final_answer === true || $final_answer === "true");
		$is_blocked = false;
		
		$db0 = new MySQLClient($DB);
		// like in the read function, get the social profile and bookclub for this user
		$query  = "SELECT a.bookclub, a.blocked, b.social_profile ";
		$query .= "FROM user a JOIN cohort b ON (a.cohort_id = b.cohort_id) ";
		$query .= "WHERE user_id = '" . $s_user_id . "'";
		if ($db0->query($query)) {
			$bookclub_id = $db0->data[0][0];
			$profile = $db0->data[0][2];
			$is_blocked = ($db0->data[0][1] == 1);
			$write = false;
			
			// if we can do open chat, see if that was requested
			if (($chat_type == 1) && ($profile & 1)) {
				// if the user is an administrator, we care what bookclub was requested
				// otherwise, only write to their assigned group
				if (($s_type_id & 4) || ($s_type_id & 2)) {
					$bookclub_id = $chosen_club;
				}
				$write = ($bookclub_id > 0);
				$profile = 1;
			}
			// if we can do cohort-wide chat, see if that was requested
			else if (($chat_type == 2) && ($profile & 2)) {
				$write = ($bookclub_id > 0);
				$profile = 2;
			}
			// if we can do topic-based chat, see if that was requested
			else if (($chat_type == 4) && ($profile & 4) && ($topic_id > 0)) {
				// same admin/write issue as in open chat
				if (($s_type_id & 4) || ($s_type_id & 2)) {
					$bookclub_id = $chosen_club;
				}
				$write = ($bookclub_id > 0);
				$profile = 4;
			}
			
			// then, add the message if the group isn't blocked
			$query = "SELECT blocked FROM social WHERE cohort_id=" . $s_cohort_id . " AND social_id=" . $bookclub_id . ";";
			if ($write && !$is_blocked && $db0->query($query) && ($db0->getNumberRows() > 0) && ($db0->data[0][0] == 0)) {
				$query = "INSERT INTO social_response (social_profile, social_id, topic_id, user_id, book_id, page_id, state_id, topic_answer, response, response_dt) ";
				$query.= "VALUES (" . $profile . ", " . $bookclub_id . ", " . addslashes($topic_id) . ", " . $s_user_id . ", " . $book_id . ", " . $page_id . ", " . $state_id . ", " . (($final_answer == true) ? 1 : 0) . ", '" . addslashes($response) . "', now())";
				$db0->update($query);
			}
		}
		
		$db0->closeDbConnection();
		echo json_encode((object) array('status' => 'success', 'value' => $write)); // just ignore failures
		break;

	case "social_avatar": // change the avatar image for the user
        global $DB;
        $img_name = (isset($_GET["image_name"])) ? $_GET["image_name"] : $_POST["image_name"];
		// TODO: temporary measure; force value to be a number between 1 and 9
		//       so that we get only the icons
		$img_name = addslashes("data/avatars/users/" . min(get_max_avatar_number(), max(1, $img_name)) . ".jpg");
 
        $db0 = new MySQLClient($DB);
		$query = "UPDATE user SET avatar='" . $img_name . "' WHERE user_id = '" . $s_user_id . "'";
		$db0->update($query);
		$db0->closeDbConnection();
		echo json_encode((object) array('status' => 'success', 'value' => $img_name)); // ignore failures here
        break;
	
	case "social_check_new": // get how many unread messages this user has in the given clubs/topics
        global $DB;
        $book_id = (isset($_GET["imb_book_id"])) ? $_GET["imb_book_id"] : $_POST["imb_book_id"];
        $bookclub_data = (isset($_GET["imb_group_obj"])) ? $_GET["imb_group_obj"] : $_POST["imb_group_obj"];
		if ($bookclub_data == '' || $bookclub_data == null) {
			$bookclub_data = array();
		}
		else {
			$bookclub_data = json_decode($bookclub_data);
		}
		$topic_data = (isset($_GET["imb_topic_obj"])) ? $_GET["imb_topic_obj"] : $_POST["imb_topic_obj"];
		if ($topic_data != '') {
			$topic_data = json_decode($topic_data);
		}
		$result_arr = array('groups' => array(), 'topics' => array());
		$profile = 0;
        $db0 = new MySQLClient($DB);
		
		// first, get what social profile and bookclub this user belongs to, so we can
		// request the proper responses; if the user wants to read from a different
		// bookclub, something else will need to change that entry in the database
		$query  = "SELECT a.bookclub, b.social_profile ";
		$query .= "FROM user a JOIN cohort b ON (a.cohort_id = b.cohort_id) ";
		$query .= "WHERE user_id = '" . addslashes($s_user_id) . "'";
		if ($db0->query($query) && ($db0->data[0][1] > 0)) {
			$profile = $db0->data[0][1];
			$newData = array();
			// if the profile allows intra-bookclub chat, then only the user's
			// current bookclub is allowed (unless an admin or writer)
			if ($profile & 1) {
				if (($s_type_id & 4) || ($s_type_id & 2)) {
					$newData = array_merge($bookclub_data);
				}
				
				if (array_key_exists($db0->data[0][0], $bookclub_data)) {
					$newData[ $db0->data[0][0] ] = $bookclub_data[ $db0->data[0][0] ];
				}
				else {
					$newData[ $db0->data[0][0] ] = '';
				}
			}
			// if the profile allows cohort-wide chat, then that option is also allowed
			if ($profile & 2) {
				if (array_key_exists(0, $bookclub_data)) {
					$newData[0] = $bookclub_data[0];
				}
				else {
					$newData[0] = '';
				}
			}
			$bookclub_data = $newData;
			// if the social profile prevents topic-based discussions, ignore topics completely
			if (!($profile & 4)) {
				$topic_data = array();
			}
		}
		
		// for regular users in the global cohort, we need a list of all
		// the bookclubs for this cohort
		$cohort_club_ids = '';
		$query = "SELECT social_id FROM social WHERE cohort_id=" . $s_cohort_id . " AND blocked=0;";
		if (($profile & 2) && $db0->query($query)) {
			for ($x = 0; $x < $db0->getNumberRows(); $x++) {
				$cohort_club_ids .= $db0->data[$x][0];
				if ($x < $db0->getNumberRows()-1) {
					$cohort_club_ids .= ',';
				}
			}
		}
		
		// then, go through the remaining bookclubs and topics and get data about each
		foreach ($bookclub_data as $club_id => $latest_dt) {
			$query  = "SELECT COUNT(a.message_id) AS total, MIN(a.response_dt) AS latest FROM social_response a ";
			$query .= "LEFT JOIN social_response_read b ON (a.message_id = b.message_id AND b.user_id=" . $s_user_id . ") ";
			if (($club_id > 0) || ($cohort_club_ids == '')) {
				$query .= "WHERE a.response_dt>='" . ((is_null($latest_dt)) ? '' : addslashes($latest_dt->timestamp))
					. "' AND a.social_profile=1 AND a.social_id=" . intval($club_id)
					. " AND (b.status=0 OR b.status IS NULL) AND a.archived=0 AND a.topic_id=0 AND a.topic_answer=0;";
			}
			else {
				$query .= "WHERE a.response_dt>='" . ((is_null($latest_dt)) ? '' : addslashes($latest_dt->timestamp))
					. "' AND a.social_profile=2 AND a.social_id IN (" . $cohort_club_ids . ")"
					. " AND (b.status=0 OR b.status IS NULL) AND a.archived=0 AND a.topic_id=0 AND a.topic_answer=0;";
			}
			// do it and store it for results
			if ($db0->query($query) && ($db0->getNumberRows() > 0)) {
				$result_arr['groups'][] = array("id" => $club_id, "num" => $db0->data[0][0], "time" => $db0->data[0][1], "query" => $query, "date" => $latest_dt);
			}
			// then do all the topics for this bookclub
			if ($club_id > 0) {
				foreach ($topic_data as $topic_id => $topic_date) {
					$query  = "SELECT COUNT(a.message_id) AS total, MIN(a.response_dt) AS latest FROM social_response a ";
					$query .= "LEFT JOIN social_response_read b ON (a.message_id = b.message_id AND b.user_id='" . $s_user_id . "') ";
					$query .= "WHERE a.response_dt>='" . ((is_null($topic_date)) ? '' : addslashes($topic_date->timestamp)) . "' AND a.social_id=" . intval($club_id) .
						" AND (b.status=0 OR b.status IS NULL) AND a.archived=0 AND a.topic_answer=0 AND a.topic_id=" . intval($topic_id) . " AND a.book_id=" . intval($book_id) . ";";
					// do it and store the results
					if ($db0->query($query) && ($db0->getNumberRows() > 0)) {
						$result_arr['topics'][] = array("id" => $topic_id, "num" => $db0->data[0][0], "time" => $db0->data[0][1], "query" => $query, "date" => $topic_date);
					}
				}
			}
		}
		$db0->closeDbConnection();
		
		echo json_encode((object) array('status' => 'success', 'value' => $result_arr));
		break;
       
    default: // nothing to do
        break;
}
exit;


function does_username_exist($username) {
	global $DB;
	$db0 = new MySQLClient($DB);
	$query = "SELECT login FROM user WHERE login = '" . addslashes($username) . "';";
	$exists = ($db0->query($query) && $db0->getNumberRows() == 1);
	$db0->closeDbConnection();
	return $exists;
}

function handle_login($username, $password, $token) {
	global $DB;
	global $GDB;
	
	// first, attempt to log in normally with the username and password
	$db0 = new MySQLClient($DB);
	$query  = "SELECT a.user_id, a.user_name, a.type_id, a.cohort_id, b.library, b.room, b.bookcase, a.avatar ";
	$query .= "FROM user a JOIN cohort b ON (a.cohort_id = b.cohort_id) ";
	$query .= "WHERE a.login = '" . addslashes($username) . "' AND a.password = PASSWORD('" . $password . "');";
	if ($db0->query($query) && $db0->getNumberRows() == 1) {
		$return_arr = init_user_app($db0->data[0][0], $db0->data[0][1], $db0->data[0][2], $db0->data[0][3], $db0->data[0][4], $db0->data[0][5], $db0->data[0][6], $db0->data[0][7]);
	}
	$db0->closeDbConnection();
	
	// if that failed, use the token to log into the website database instead
	if (($return_arr == null) && (strlen($token) > 0) && isset($GDB)) {
		// validate token - to see if password check is needed (bypass only works for website users).
		if ($imb_token === base64_encode(md5($username . 'secretkeybypass'))) {
			$bypass = true;
		} else {
			$bypass = false;
		}
		
		// query user data            
		$db1 = new MySQLClient($GDB);
		if ($bypass) {
			$query  = "SELECT id, full_name, username, usertype FROM tbl_users ";
			$query .= "WHERE username='" . addslashes($username) . "' LIMIT 1";
		}
		else {
			$query  = "SELECT id, full_name, username, usertype FROM tbl_users ";
			$query .= "WHERE username='" . addslashes($username) . "' AND password='" . md5($password) . "' LIMIT 1";
		}
		
		// if this worked, then initialize the user details
		if ($db1->query($query) && $db1->getNumberRows() == 1) {
			$return_arr = init_user_website($db1->data[0][0], $db1->data[0][1], $db1->data[0][3]);
		}
		$db1->closeDbConnection();
	}
	
	return $return_arr;
}

function init_user_website($user_id, $username, $user_type) {
	// guest id is offset by 1M
	$user_id += 1000000;
	
	// set server side session variables for future use
	$_SESSION["s_start_dt"] = time();
	$_SESSION["s_user_id"] = $user_id;

	$type_id = 1;
	if ($user_type == 'paid') { // paid user
		$cohort_id = 11;
		$library = 'paid.xml';
	}
	else { // unpaid
		$cohort_id = 10;
		$library = 'registered.xml';
	}
	$_SESSION["s_type_id"] = $type_id;
	$_SESSION["s_cohort_id"] = $cohort_id;
	
	// return required data
	return array( 'status' => 'success',
				'user_name' => $username,
				'type_id' => $type_id,
				'library' => $library,
				'books' => null,
				'points_max' => 0,
				's_start' => (isset($_SESSION["s_start_dt"]) ? $_SESSION["s_start_dt"] : "UNSET") );
}

function init_user_app($user_id, $username, $type_id, $cohort_id, $library_id, $room_id, $bookcase_id, $avatar) {
	global $DB;
	
	// set temp variables and set server side session variables for future use
	$_SESSION["s_start_dt"] = time();
	$_SESSION["s_user_id"] = $user_id;
	$_SESSION["s_type_id"] = $type_id;
	$_SESSION["s_cohort_id"] = $cohort_id;

	// if this cohort is assigned a room, pick books from a designated cohort bookcase and user bookshelf
	$book_arr = null;
	$db0 = new MySQLClient($DB);
	if ($room_id > 0) {
		$query  = "SELECT b.book_id ";
		$query .= "FROM user a JOIN collections b ON (a.bookshelf = b.bookshelf) ";
		$query .= "WHERE a.user_id = '" . $user_id . "' AND b.room = '" . $room_id . "' AND b.bookcase = '" . $bookcase_id . "' ";
		$query .= "ORDER BY book_id ASC;";
		if ($db0->query($query) && ($db0->getNumberRows() > 0)) {
			for ($x = 0; $x < $db0->getNumberRows(); $x++) {
				$book_arr[$x] = $db0->data[$x][0];
			}
		}
	}

	// now get the max user points for this user cohort from the database
	$query  = "SELECT COUNT(*) AS maxcnt FROM user_response ";
	$query .= "WHERE user_id IN (SELECT user_id FROM user WHERE cohort_id = '" . $cohort_id . "') ";
	$query .= "AND response_type_id IN (1,3,4) GROUP BY user_id ORDER BY maxcnt DESC;";
	$points_max = 0;
	if ($db0->query($query)) {
		$points_max = $db0->data[0][0];
	}
	$db0->closeDbConnection();
	
	// return required data
	return array('status' => 'success',
				'user_name' => $username,
				'type_id' => $type_id,
				'library' => $library_id,
				'books' => $book_arr,
				'points_max' => $points_max,
				'avatar' => $avatar,
				's_start' => (isset($_SESSION["s_start_dt"]) ? $_SESSION["s_start_dt"] : "UNSET") );
}

function handle_registration($username, $login, $password, $code) {
	global $DB;
	$book_arr = array();

	// make sure all input fields have been entered
	if ($username == '' OR $login == '' OR $password == '' OR $code == '') {
		return array('status' => 'error', 'value' => 'Registration form is incomplete');
	}
	// make sure password is fine
	if (strlen($password) < 4) {
		return array('status' => 'error', 'value' => 'Passwords must be at least 4 characters long');
	}
	// make sure user login is unique
	if (does_username_exist($login)) {
		return array('status' => 'error', 'value' => 'User Login already exists');
	}
	// make sure the registration code is valid
	$code_parts = is_registration_code_valid($code);
	if ($code_parts == null) {
		return array('status' => 'error', 'value' => 'Invalid Registration Code');
	}

	// make sure the bookclub is within range
	if (($code_parts["bookclub"] > $code_parts["max_bookclub"]) || ($code_parts["bookclub"] < 0)) {
		return array('status' => 'error', 'value' => 'Invalid Registration Code: unknown book club');
	}
	// make sure the bookshelf is within range
	if (($code_parts["bookshelf"] > $code_parts["max_bookshelf"]) || ($code_parts["bookshelf"] < 0)) {
		return array('status' => 'error', 'value' => 'Invalid Registration Code: unknown bookshelf');
	}
	$db0 = new MySQLClient($DB);
	
	// get the list of all bookclub ids, in order of bookclub number
	$query = "SELECT social_id FROM social WHERE cohort_id='" . $code_parts["cohort_id"] . "' ";
	$query .= "ORDER BY social_id ASC;";
	$bookclub_list = array();
	if ($db0->query($query)) {
		$bookclub_list[] = 0;
		for ($index = 0; $index < $db0->getNumberRows(); $index++) {
			$bookclub_list[] = $db0->data[$index][0];
		}
	}
	
	// if no bookclub is given, get the next available one in sequence
	if (($code_parts["bookclub"] == 0) && ($code_parts["max_bookclub"] > 0)) {
		$query  = "SELECT user_id, bookclub, count(user_id) AS number FROM user ";
		$query .= "WHERE cohort_id='" . $code_parts["cohort_id"] . "' AND bookclub>0 "; 
		$query .= "GROUP BY bookclub ORDER BY number ASC;"; 
		if ($db0->query($query) && ($db0->getNumberRows() > 0)) {
			// if there are bookclubs that no one has been assigned to yet, use
			// the first of those groups
			if ($db0->getNumberRows()+1 <= $code_parts["max_bookclub"]) {
				$code_parts["bookclub"] = $bookclub_list[$db0->getNumberRows()+1];
			}
			else {
				// otherwise, put this person in the smallest bookclub group
				$code_parts["bookclub"] = $db0->data[0][1];
			}
		}
		else {
			// if we can't check what club is available, randomly assign one
			if ($code_parts["max_bookclub"] > 0) {
				$code_parts["bookclub"] = (empty($bookclub_list)) ? 0 : $bookclub_list[rand(1, $code_parts["max_bookclub"])];
			}
			else {
				$code_parts["bookclub"] = 0;
			}
		}
	}
	// otherwise, replace the bookclub entry with the correct social group id
	else {
		$code_parts["bookclub"] = $bookclub_list[$code_parts["bookclub"]];
	}
	// if no bookshelf is given, get the next available one in sequence
	if (($code_parts["bookshelf"] == 0) && ($code_parts["max_bookshelf"] > 0)) {
		$query  = "SELECT user_id, bookshelf FROM user ";
		$query .= "WHERE cohort_id =  '" . $code_parts["cohort_id"] . "' ORDER BY user_id DESC;";
		if ($db0->query($query)) {
			$next_bookshelf = $db0->data[0][1];
			if ($next_bookshelf >= $code_parts["max_bookshelf"]) {
				$bookshelf = 1;
			} else {
				$bookshelf = $next_bookshelf + 1;
			}
		}
		else {
			// if we can't check the bookshelves, randomly assign one
			$bookshelf = rand(1, $code_parts["max_bookshelf"]);
		}
	}
	
	// now actually register the user, giving him/her a random avatar
	$avatar = "data/avatars/users/" . rand(1, get_max_avatar_number()) . ".jpg";
	$query  = "INSERT INTO user (type_id, cohort_id, bookshelf, bookclub, user_name, login, password, avatar, created_dt) VALUES ";
	$query .= "(1, " . $code_parts["cohort_id"] . ", " . $code_parts["bookshelf"] . ", " . $code_parts["bookclub"] . ", '" . addslashes($username) . "', '" . addslashes($login) . "', PASSWORD('" . addslashes($password) . "'), '" . addslashes($avatar) . "', now());";
	//return array('status' => 'error', 'value' => $query);
	$db0->update($query);
	
	// finally, log the user in, using the registration bookcase value
	$return_arr = null;
	$query  = "SELECT a.user_id, a.user_name, a.type_id, a.cohort_id, b.library, b.room ";
	$query .= "FROM user a JOIN cohort b ON (a.cohort_id = b.cohort_id) ";
	$query .= "WHERE a.login = '" . addslashes($login) . "' AND a.password = PASSWORD('" . $password . "');";
	if ($db0->query($query) && ($db0->getNumberRows() == 1)) {
		$return_arr = init_user_app($db0->data[0][0], $db0->data[0][1], $db0->data[0][2], $db0->data[0][3], $db0->data[0][4], $db0->data[0][5], $code_parts["bookcase"], $avatar);
	}
	$db0->closeDbConnection();	
	return $return_arr;
}

function is_registration_code_valid($code) {
	global $DB;
	
	// the code cannot be empty
	$imb_code = trim($code);
	if (strlen($imb_code) < 1) {
		return null;
	}
	
	// split the code into cohort CODE and bookclub - bookshelf - bookcase NUMBERS 
	// (if present) i.e., CODE-BOOKCLUB-BOOKSHELF-BOOKCASE
	$code_parts = explode("-", $code);
	$bookclub = 0;
	if (is_numeric($code_parts[1])) {
		$bookclub = $code_parts[1];
	}
	$bookcase = 0;
	if (is_numeric($code_parts[2])) {
		$bookcase = $code_parts[2];
	}
	$bookshelf = 0;
	if (is_numeric($code_parts[3])) {
		$bookshelf = $code_parts[3];
	}
	
	// check that the code is valid and, while doing so, get other details
	// useful for completing registration
	$db0 = new MySQLClient($DB);
	$return_arr = null;
	$query  = "SELECT cohort_id, bookclubs, bookcase, bookshelves FROM cohort ";
	$query .= "WHERE code = '" . addslashes($code_parts[0]) . "';";
	if ($db0->query($query) && ($db0->getNumberRows() >= 1)) {
		// store those details in an array to be returned
		$return_arr = array('cohort_id' => $db0->data[0][0],
							'bookclub' => $bookclub, 'max_bookclub' => $db0->data[0][1],
							'bookcase' => ($bookcase > 0) ? $bookcase : $db0->data[0][2],
							'bookshelf' => $bookshelf, 'max_bookshelf' => $db0->data[0][3]);
	}
	$db0->closeDbConnection();
	return $return_arr;
}

function get_max_avatar_number() {
	// get all of the avatar images and count them
	$files = glob(__DIR__ . "/data/avatars/users/*.jpg");
	if ($files){
		return count($files);
	}
	return 0;
}

?>
