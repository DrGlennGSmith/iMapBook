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

switch ($action) {  
    case "social_write": // write to a social group
        global $DB;
        $social_id = (isset($_GET["imb_social_id"])) ? $_GET["imb_social_id"] : $_POST["imb_social_id"];
        $user_id = (isset($_GET["imb_user_id"])) ? $_GET["imb_user_id"] : $_POST["imb_user_id"];
        $book_id = (isset($_GET["imb_book_id"])) ? $_GET["imb_book_id"] : $_POST["imb_book_id"];
        $page_id = (isset($_GET["imb_page_id"])) ? $_GET["imb_page_id"] : $_POST["imb_page_id"];
        $state_id = (isset($_GET["imb_state_id"])) ? $_GET["imb_state_id"] : $_POST["imb_state_id"];
        $response = trim((isset($_GET["imb_response"])) ? $_GET["imb_response"] : $_POST["imb_response"]);
 
        $db0 = new MySQLClient($DB);
        $query = "INSERT INTO social_response (social_id, user_id, book_id, page_id, state_id, response, response_dt) ";
        $query.= "VALUES (" . $social_id . ", " . $user_id . ", " . $book_id . ", " . $page_id . ", " . $state_id . ", '" . addslashes($response) . "', now())";
        $db0->update($query);
        $db0->closeDbConnection();
        echo json_encode((object) array('status' => 'success', 'value' => $query)); // just ignore failures
        break;

    case "social_read": // read from a social group
        global $DB;
        $social_id = (isset($_GET["imb_social_id"])) ? $_GET["imb_social_id"] : $_POST["imb_social_id"];
        $book_id = (isset($_GET["imb_book_id"])) ? $_GET["imb_book_id"] : $_POST["imb_book_id"];
        $page_id = (isset($_GET["imb_page_id"])) ? $_GET["imb_page_id"] : $_POST["imb_page_id"];
        $state_id = (isset($_GET["imb_state_id"])) ? $_GET["imb_state_id"] : $_POST["imb_state_id"];
  
        $sr_arr = array();

        $db0 = new MySQLClient($DB);
        // obtain the number of game completes since last book reset for each page_id (page_idx)
        $query = "SELECT a.user_id, b.user_name, a.response, a.response_dt, b.avatar ";
        $query.= "FROM social_response a LEFT JOIN user b ON (a.user_id = b.user_id) ";
        $query.= "WHERE a.social_id = '" . $social_id . "' AND a.book_id = '" . $book_id . "' AND a.page_id = '" . $page_id . "' AND a.state_id = '" . $state_id . "' ";
        $query.= "ORDER BY a.response_dt DESC;";
        
        if ($db0->query($query)) {
            for ($x = 0; $x < $db0->getNumberRows(); $x++) {
                $sr_arr[$x][0] = $db0->data[$x][0];
                $sr_arr[$x][1] = $db0->data[$x][1];
                $sr_arr[$x][2] = $db0->data[$x][2];
                $sr_arr[$x][3] = $db0->data[$x][3];
                $sr_arr[$x][4] = $db0->data[$x][4];
            }
        }

        echo json_encode((object) array('status' => 'success', 'social' => $sr_arr));
        $db0->closeDbConnection();
        break;
    
    default: // nothing to do
        break;
}
exit;
?>
