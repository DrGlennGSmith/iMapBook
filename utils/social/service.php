<?php

/* iMapBook Application (IMB)
 * iMapBook LLC
 * All Rights Reserved
 * 04/08/2014
 * 
 * Version 2.5
 */
require_once "../../constants.php";
require_once "../../common.php";

// extract service action
$action = (isset($_GET["action"])) ? $_GET["action"] : ((isset($_POST["action"])) ? $_POST["action"] : "do_nothing");

switch ($action) {
    case "social_groups_list": // get social groups available
        global $DB;
        $user_id = (isset($_GET["imb_user_id"])) ? $_GET["imb_user_id"] : $_POST["imb_user_id"];
		$return_arr = array();
		
		// get all of the social group IDs and names for this user, even if that
		// list is none
        $db0 = new MySQLClient($DB);
		$query  = "SELECT a.social_id, b.description ";
		$query .= "FROM social_user a JOIN social b ON (a.social_id = b.social_id) ";
		$query .= "WHERE a.user_id = '" . $user_id . "';";
		if ($db0->query($query)) {
			for ($x = 0; $x < $db0->getNumberRows(); $x++) {
				$return_arr[$x][0] = $db0->data[$x][0];
				$return_arr[$x][1] = $db0->data[$x][1];
			}
		}
		echo json_encode((object) array('status' => 'success', 'value' => $return_arr));
		
		$db0->closeDbConnection();
		break;

    case "social_read": // read from a social group
        global $DB;
        $user_id = (isset($_GET["imb_user_id"])) ? $_GET["imb_user_id"] : $_POST["imb_user_id"];
        $social_id = (isset($_GET["imb_social_id"])) ? $_GET["imb_social_id"] : $_POST["imb_social_id"];
        $book_id = (isset($_GET["imb_book_id"])) ? $_GET["imb_book_id"] : $_POST["imb_book_id"];
        $page_id = (isset($_GET["imb_page_id"])) ? $_GET["imb_page_id"] : $_POST["imb_page_id"];
        $state_id = (isset($_GET["imb_state_id"])) ? $_GET["imb_state_id"] : $_POST["imb_state_id"];

        $db0 = new MySQLClient($DB);
		// first, check that this user even has access to the social group being requested
		// NOTE: this is done separately instead of as part of the query below so that
		// messages by people who have left the group are still returned but denied access
		$query = "SELECT user_id FROM social_user WHERE user_id = '" . $user_id;
		$query .= "' AND social_id = '" . $social_id . "';";
		if ($db0->query($query)) {
			// obtain all the responses from that social group
			$query = "SELECT a.user_id, b.user_name, a.response, a.response_dt, b.avatar ";
			$query.= "FROM social_response a LEFT JOIN user b ON (a.user_id = b.user_id) ";
			$query.= "WHERE a.social_id = '" . $social_id . "' AND a.book_id = '" . $book_id . "' AND a.page_id = '" . $page_id . "' AND a.state_id = '" . $state_id . "' ";
			$query.= "ORDER BY a.response_dt ASC;";
			
			// array to be returned
			$return_arr = array();
			
			// the resulting structure is a list of users, with associated data,
			// one element of which is a list of their responses
			if ($db0->query($query)) {
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
						$user_data[$user_index][1] = ($db0->data[$x][0] == $user_id);	// myself or other person
						$user_data[$user_index][2] =  $db0->data[$x][4];	// avatar
					}
					else {
						$user_index = $user_map[$db0->data[$x][0]];
					}
					
					// store the response for this user
					$response_arr[$x][0] = $user_index;
					$response_arr[$x][1] = $db0->data[$x][2];	// response
					$response_arr[$x][2] = $db0->data[$x][3];	// time
				}
				
				// return these results
				$return_arr[0] = $user_data;
				$return_arr[1] = $response_arr;
			}
			
			// return the results
			echo json_encode((object) array('status' => 'success', 'value' => $return_arr));
		}
		else {
			echo json_encode((object) array('status' => 'error', 'value' => 'Cannot access given social group'));
		}
        $db0->closeDbConnection();
        break;
	
    case "social_write": // write to a social group
        global $DB;
        $social_id = (isset($_GET["imb_social_id"])) ? $_GET["imb_social_id"] : $_POST["imb_social_id"];
        $user_id = (isset($_GET["imb_user_id"])) ? $_GET["imb_user_id"] : $_POST["imb_user_id"];
        $book_id = (isset($_GET["imb_book_id"])) ? $_GET["imb_book_id"] : $_POST["imb_book_id"];
        $page_id = (isset($_GET["imb_page_id"])) ? $_GET["imb_page_id"] : $_POST["imb_page_id"];
        $state_id = (isset($_GET["imb_state_id"])) ? $_GET["imb_state_id"] : $_POST["imb_state_id"];
        $response = trim((isset($_GET["imb_response"])) ? $_GET["imb_response"] : $_POST["imb_response"]);
 
        $db0 = new MySQLClient($DB);
		// first, check that this user still has access to the social group
		$query = "SELECT user_id FROM social_user WHERE user_id = '" . $s_user_id;
		$query .= "' AND social_id = '" . $social_id . "';";
		if ($db0->query($query)) {
			$query = "INSERT INTO social_response (social_id, user_id, book_id, page_id, state_id, response, response_dt) ";
			$query.= "VALUES (" . $social_id . ", " . $user_id . ", " . $book_id . ", " . $page_id . ", " . $state_id . ", '" . addslashes($response) . "', now())";
			$db0->update($query);
		}
		
        $db0->closeDbConnection();
        echo json_encode((object) array('status' => 'success', 'value' => $query)); // just ignore failures
        break;
		
    default: // nothing to do
        break;
}
exit;
?>
