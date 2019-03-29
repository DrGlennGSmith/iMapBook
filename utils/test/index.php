<?php

require_once "../../constants.php";
require_once "../../common.php";

test('login'); // read
test('archive'); // write

function test($action) {
    
switch ($action) {
    case 'login': // login user
        global $DB;
        global $GDB;
        $imb_user = 'test';
        $imb_pass = '1234';
        $imb_token = '';
        $points_max = 0;
        $book_arr = array();

        // validate token - to see if password check is needed (bypass only works for website users).
        if ($imb_token === base64_encode(md5($imb_user . 'secretkeybypass'))) {
            $bypass = true;
        } else {
            $bypass = false;
        }

        $db0 = new MySQLClient($DB);
        // query user data
        $query = "SELECT a.user_id, a.user_name, a.type_id, a.cohort_id, b.library, b.room, b.bookcase, b.bookshelves, a.avatar FROM user a, cohort b WHERE a.login = '" . addslashes($imb_user) . "' AND PASSWORD('" . $imb_pass . "') = password AND a.cohort_id = b.cohort_id;";
        if ($db0->query($query) && $db0->getNumberRows() == 1) {
            // set temp variables and set server side session variables for future use
            $_SESSION["s_start_dt"] = time();
            $user_id = $db0->data[0][0];
            $_SESSION["s_user_id"] = $user_id;
            $user_name = $db0->data[0][1];
            $type_id = $db0->data[0][2];
            $_SESSION["s_type_id"] = $type_id;
            $cohort_id = $db0->data[0][3];
            $_SESSION["s_cohort_id"] = $cohort_id;
            $library = $db0->data[0][4];
            $room = $db0->data[0][5];
            $bookcase = $db0->data[0][6];
            $bookshelves = $db0->data[0][7];
            $avatar = $db0->data[0][8];

            if ($room > 0) { // this cohort is assigned a room - pick books from a designated cohort bookcase and user bookshelf
                $query = "select b.book_id from user a, collections b where a.user_id = '" . $user_id . "' and a.bookshelf = b.bookshelf and b.room = '" . $room . "' and b.bookcase = '" . $bookcase . "' order by book_id asc;";
                if ($db0->query($query) && $db0->getNumberRows() > 0) {
                    for ($x = 0; $x < $db0->getNumberRows(); $x++) {
                        $book_arr[$x] = $db0->data[$x][0];
                    }
                }
            } else { // make sure you return a null to disable a book picker on the client side
                $book_arr = null;
            }

            // now get the max user points for this user cohort from the database
            $query = " select count(*) as maxcnt from user_response where user_id in (select user_id from user where cohort_id = '" . $cohort_id . "') and response_type_id in (1,3,4) group by user_id order by maxcnt desc;";
            if ($db0->query($query)) {
                $points_max = $db0->data[0][0];
            }

            // return required data
            echo json_encode((object) array('status' => 'success', 'user_name' => $user_name, 'avatar '=> $avatar, 'type_id' => $type_id, 'library' => $library, 'books' => $book_arr, 'points_max' => $points_max, 's_start' => (isset($_SESSION["s_start_dt"]) ? $_SESSION["s_start_dt"] : "UNSET")));
        } else { // first authentication failed
            if (isset($GDB)) { // got guest db info
                $db1 = new MySQLClient($GDB);
                // query user data            
                if ($bypass) {
                    $query = "SELECT id, full_name, username, usertype FROM tbl_users WHERE username='" . addslashes($imb_user) . "' LIMIT 1";
                } else {
                    $query = "SELECT id, full_name, username, usertype FROM tbl_users WHERE username='" . addslashes($imb_user) . "' AND password='" . md5($imb_pass) . "' LIMIT 1";
                }
                if ($db1->query($query) && $db1->getNumberRows() == 1) {
                    // set temp variables and set server side session variables for future use
                    $_SESSION["s_start_dt"] = time();
                    $user_id = $db1->data[0][0] + 1000000; // guest id is offset by 1M
                    $_SESSION["s_user_id"] = $user_id;
                    $user_name = $db1->data[0][1];

                    if ($db1->data[0][3] == 'paid') { // paid user
                        $type_id = 1;
                        $cohort_id = 11;
                        $library = 'paid.xml';
                    } else { // unpaid
                        $type_id = 1;
                        $cohort_id = 10;
                        $library = 'registered.xml';
                    }
                    $_SESSION["s_type_id"] = $type_id;
                    $_SESSION["s_cohort_id"] = $cohort_id;

                    $room = 0;
                    $bookcase = 0;
                    $bookshelves = 0;
                    $book_arr = null;
                    $points_max = 0;
                    // return required data
                    echo json_encode((object) array('status' => 'success', 'user_name' => $user_name, 'type_id' => $type_id, 'library' => $library, 'books' => $book_arr, 'points_max' => $points_max, 's_start' => (isset($_SESSION["s_start_dt"]) ? $_SESSION["s_start_dt"] : "UNSET")));
                } else {
                    echo json_encode((object) array('status' => 'error', 'value' => 'Invalid user credentials. Please try again.'));
                }
                $db1->closeDbConnection();
            } else { // skip the guest authentication
                echo json_encode((object) array('status' => 'error', 'value' => 'Invalid credentials. Please try again.'));
            }
        }
        $db0->closeDbConnection();
        break;

    case 'archive': // archive user response
        global $DB;
        $book_id = '0';
        $page_id = '0';
        $state_id = '0';
        $response = 'stress test';
        $response_type_id = '0';
        $response_weight = '0';

        $db0 = new MySQLClient($DB);
        $query = "INSERT INTO user_response (user_id, book_id, page_id, state_id, session_start_dt, response, response_type_id, response_weight) ";
        $query.= "VALUES ('0', " . $book_id . ", " . $page_id . ", " . $state_id . ", now(), '" . addslashes($response) . "', " . $response_type_id . ", " . $response_weight . ")";
        $db0->update($query);
        $db0->closeDbConnection();
        echo json_encode((object) array('status' => 'success', 'value' => $query)); // just ignore failures
        break;
       
    default: // nothing to do
        break;
    }
}
exit;
?>
