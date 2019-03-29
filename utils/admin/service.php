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

class QuizData {

    public $name;
    public $book_id;
    public $book_title;
    public $page;
    public $responses;
    public $correctness;
    public $grade;
	public $potential;
    public $numStates;

    function __construct($newName, $newBook, $newPage) {
		$this->name = $newName;
		$this->book_id = $newBook;
		$this->page = $newPage;
		$this->responses = array(null, null, null, null);
		$this->correctness = array(null, null, null, null);
		$this->grade = 0;
		$this->potential = 0;
    }
	
	function calculatePercent() {
		if ($this->potential > 0) {
			return floor($this->grade / $this->potential * 100);
		}
		return 0;
	}
}

//Check if the specified book page contains a quiz
function isAQuiz($shelf_xml, $book_id, $page_id) {
    $foundBookxml;
    foreach ($shelf_xml->cover as $book) {
	if ($book['book_id'] == $book_id) {
	    $foundBookxml = simplexml_load_file("../../data/books/" . $book['location'] . "/book.xml");
	    break;
	}
    }
    if ($foundBookxml == null || $foundBookxml->page[$page_id]['chapter_number'] != "quiz")
	return array($book_id, $page_id);
    else
	return null;
}

//remove specific item from an array
function removeFromArray($array, $itemToRemove) {
    $newArray = array();
    foreach ($array as $item) {
	if ($itemToRemove != $item) {
	    array_push($newArray, $item);
	}
    }

    return $newArray;
}

//a function for finding similar QuizData objects
function findLikeQD($cell_name, $cell_book_id, $cell_page, $arrayToSearch) {
    foreach ($arrayToSearch as $item) {
	if ($item->name == $cell_name && $item->book_id == $cell_book_id && $item->page == $cell_page) {
	    return $item;
	}
    }
    return null;
}

// extract service action
$action = (isset($_GET["action"])) ? $_GET["action"] : $_POST["action"];

session_start();
if (isset($_SESSION["s_start_dt"])) { // session exists
    $s_start_dt = $_SESSION["s_start_dt"];
    $s_user_id = $_SESSION["s_user_id"];
    $s_type_id = $_SESSION["s_type_id"];
    $s_cohort_id = $_SESSION["s_cohort_id"];
} else { // exit if not trying to login or register
    if (!($action == "login")) {
	echo json_encode((object) array('status' => 'error', 'value' => 'Expired session!  Please, login again.'));
	exit;
    }
}

ini_set('user_agent', $_SERVER['HTTP_USER_AGENT']);

// get a complete list of cohort(s) data from the database along with a complete user list
function getCohortsUsers($cohort_id, $user_id) {
    global $DB;
    $cl = array();
    $db0 = new MySQLClient($DB);
    if ($cohort_id == '') {
		$query = "SELECT cohort_id, name, code, library, room, bookcase, bookshelves, bookclubs, social_profile FROM cohort ORDER BY cohort_id;";
    } else { // only get a given cohort
		$query = "SELECT * FROM cohort WHERE cohort_id = '" . $cohort_id . "';";
    }
    if ($db0->query($query)) {
		for ($x = 0; $x < $db0->getNumberRows(); $x++) {
			$cl[$x][0] = $db0->data[$x][0]; // cohort_id
			$cl[$x][1] = $db0->data[$x][1]; // name
			$cl[$x][2] = $db0->data[$x][2]; // code
			$cl[$x][3] = $db0->data[$x][3]; // library
			$cl[$x][4] = $db0->data[$x][4]; // room
			$cl[$x][5] = $db0->data[$x][5]; // bookcase
			$cl[$x][6] = $db0->data[$x][6]; // bookshelves
			$cl[$x][7] = $db0->data[$x][7]; // bookclubs
			$cl[$x][8] = $db0->data[$x][8]; // socialprofile
			$cl[$x][9] = array();
			$cl[$x][10] = array();
		}
    }
	// add users and social groups to the cohorts
    for ($x = 0; $x < sizeof($cl); $x++) {
		if ($user_id == '') {
			$query = "SELECT * FROM user WHERE cohort_id = '" . $cl[$x][0] . "' ORDER BY usergroup, bookclub, bookshelf, user_name;";
		} else { // only get users viewable by this user_id - THIS LOGIC IS INCOMPLETE!
			$query = "SELECT * FROM user a, user_audit b WHERE a.cohort_id = '" . $cl[$x][0] . "' AND a.user_id = b.user_id AND b.auditor_id = '" . $user_id . "' ORDER BY a.usergroup, a.bookclub, a.bookshelf, a.user_name;";
		}
		if ($db0->query($query)) {
			for ($y = 0; $y < $db0->getNumberRows(); $y++) {
			$cl[$x][9][$y][0] = $db0->data[$y][0]; // user_id
			$cl[$x][9][$y][1] = $db0->data[$y][1]; // type_id
			$cl[$x][9][$y][2] = $db0->data[$y][2]; // cohort_id
			$cl[$x][9][$y][3] = $db0->data[$y][3]; // bookshelf
			$cl[$x][9][$y][4] = $db0->data[$y][4]; // bookclub
			$cl[$x][9][$y][5] = $db0->data[$y][5]; // user_name
			$cl[$x][9][$y][6] = $db0->data[$y][6]; // login
			$cl[$x][9][$y][7] = "********"; // password - never load actual password (encrypted or not)
			$cl[$x][9][$y][8] = $db0->data[$y][8]; // avatar
			$cl[$x][9][$y][9] = $db0->data[$y][9]; // created_dt
			$cl[$x][9][$y][10] = $db0->data[$y][10]; // group
			}
		}
		// add social groups for this cohort
		$query = "SELECT social_id, name, description, blocked "
			. "FROM social WHERE cohort_id = '" . $cl[$x][0] . "' ORDER BY social_id;";
		if ($db0->query($query)) {
			for ($y = 0; $y < $db0->getNumberRows(); $y++) {
				$cl[$x][10][$y][0] = $db0->data[$y][0]; // social_id
				$cl[$x][10][$y][1] = $db0->data[$y][1]; // name
				$cl[$x][10][$y][2] = $db0->data[$y][2]; // description
				$cl[$x][10][$y][3] = $db0->data[$y][3]; // blocked
			}
		}
    }
    $db0->closeDbConnection();
    return $cl;
}

function getAuditTable() {
    global $DB;
    $at = array();
    $db0 = new MySQLClient($DB);

    $query = "SELECT * FROM user_audit ORDER BY auditor_id";

    if ($db0->query($query)) {
	for ($x = 0; $x < $db0->getNumberRows(); $x++) {
	    $at[$x][0] = $db0->data[$x][0]; // user_id
	    $at[$x][1] = $db0->data[$x][1]; // auditor_id
	}
    }

    return $at;
}

// -------------------------------------------------------------------------- MAIN
switch ($action) {
    case 'login': // login user
	global $DB;
	$cohort_arr = array();
	$social_arr = array();
	$audit_table = array();
	$imb_user = (isset($_GET["imb_user"])) ? $_GET["imb_user"] : $_POST["imb_user"];
	$imb_pass = (isset($_GET["imb_pass"])) ? $_GET["imb_pass"] : $_POST["imb_pass"];

	$db0 = new MySQLClient($DB);
	// query user data
	$query = "SELECT user_id, user_name, type_id, cohort_id FROM user WHERE login = '" . addslashes($imb_user) . "' AND PASSWORD('" . $imb_pass . "') = password;";
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

	    // AUTHORIZATION bit LEVELS: 1 = read, 2 = write, 4 = admin, 8 = audit
	    if ($type_id & 4) { // ADMIN
			$cohort_arr = getCohortsUsers('', ''); // get all cohorts, all users
			$audit_table = getAuditTable();
	    } else if ($type_id & 2) { // WRITER
			$cohort_arr = getCohortsUsers($cohort_id, ''); // only get the writer's cohort, all users
	    } else if ($type_id & 8) { // AUDITOR
			$cohort_arr = getCohortsUsers($cohort_id, $user_id); // only get the auditor's cohort, auditor's users
	    } else {
			echo json_encode((object) array('status' => 'error', 'value' => 'You are not authorized for the administrative system'));
			exit;
	    }

	    $developEnv_arr = getDevelopEnv(''); // get the environemnts
	    // return required data
	    echo json_encode((object) array('status' => 'success', 'login' => $imb_user, 'user_name' => $user_name, 'type_id' => $type_id, 'cohort_id' => $cohort_id, 'cohort_arr' => $cohort_arr, 'developEnv_arr' => $developEnv_arr, 'audit_table' => $audit_table));
	} else {
	    echo json_encode((object) array('status' => 'error', 'value' => 'Invalid user name and/or password. Please try again.'));
	}
	$db0->closeDbConnection();
	break;

    case 'user_create': // create user
	global $DB;
	$imb_user_id = 0;
	$imb_type_id = (isset($_GET["imb_type_id"])) ? $_GET["imb_type_id"] : $_POST["imb_type_id"];
	$imb_cohort_id = (isset($_GET["imb_cohort_id"])) ? $_GET["imb_cohort_id"] : $_POST["imb_cohort_id"];
	$imb_bookshelf = (isset($_GET["imb_bookshelf"])) ? $_GET["imb_bookshelf"] : $_POST["imb_bookshelf"];
	$imb_bookclub = (isset($_GET["imb_bookclub"])) ? $_GET["imb_bookclub"] : $_POST["imb_bookclub"];
	$imb_user_name = (isset($_GET["imb_user_name"])) ? $_GET["imb_user_name"] : $_POST["imb_user_name"];
	$imb_login = (isset($_GET["imb_login"])) ? $_GET["imb_login"] : $_POST["imb_login"];
	$imb_password = (isset($_GET["imb_password"])) ? $_GET["imb_password"] : $_POST["imb_password"];
	$imb_avatar = (isset($_GET["imb_avatar"])) ? $_GET["imb_avatar"] : $_POST["imb_avatar"];
	$imb_group = (isset($_GET["imb_group"])) ? $_GET["imb_group"] : $_POST["imb_group"];

	// make sure all input fields have been entered
	if ($imb_user_name == '' OR $imb_login == '' OR $imb_password == '' OR $imb_cohort_id == '') {
	    echo json_encode((object) array('status' => 'error', 'value' => 'Input values cannot be blank.'));
	    exit;
	}
	// make sure password is fine
	if (strlen($imb_password) < 3) {
	    echo json_encode((object) array('status' => 'error', 'value' => 'Password must be at least 3 characters long.'));
	    exit;
	}
	$db0 = new MySQLClient($DB);
	// make sure user login is not taken
	$query = "SELECT login FROM user WHERE login = '" . addslashes($imb_login) . "'";
	if ($db0->query($query) && $db0->getNumberRows() > 0) {
	    echo json_encode((object) array('status' => 'error', 'value' => 'User Login already exists.'));
	    $db0->closeDbConnection();
	    exit;
	}
	$query = "INSERT INTO user (type_id, cohort_id, bookshelf, bookclub, user_name, login, password, avatar, created_dt, usergroup) VALUES ('" . $imb_type_id . "','" . $imb_cohort_id . "','" . addslashes($imb_bookshelf) . "','" . addslashes($imb_bookclub) . "','" . addslashes($imb_user_name) . "','" . addslashes($imb_login) . "',PASSWORD('" . $imb_password . "'), '" . addslashes($imb_avatar) . "',now(), '" . addslashes($imb_group) . "');";
	$db0->update($query);
	$query = "SELECT user_id FROM user WHERE login = '" . $imb_login . "';";
	if ($db0->query($query) && $db0->getNumberRows() == 1) {
	    $imb_user_id = $db0->data[0][0];
	} else {
	    echo json_encode((object) array('status' => 'error', 'value' => 'DB ERROR: failed to create a user.'));
	    $db0->closeDbConnection();
	    exit;
	}
	$db0->closeDbConnection();
	echo json_encode((object) array('status' => 'success', 'value' => $imb_user_id));
	break;

    case 'link_audit': //Link a user and an auditor
	global $DB;
	$db0 = new MySQLClient($DB);

	$user_id = (isset($_GET["user_id"])) ? $_GET["user_id"] : $_POST["user_id"];
	$auditor_id = (isset($_GET["auditor_id"])) ? $_GET["auditor_id"] : $_POST["auditor_id"];

	$query = "INSERT INTO user_audit VALUES ({$user_id}, {$auditor_id})";

	$db0->query($query);

	$db0->closeDbConnection();

	echo json_encode((object) array('status' => 'success', 'value' => $user_id));

	break;

    case 'clear_audit': //Remove user from audit table
	global $DB;
	$db0 = new MySQLClient($DB);

	$user_id = (isset($_GET["user_id"])) ? $_GET["user_id"] : $_POST["user_id"];

	$query = "DELETE FROM user_audit WHERE user_id={$user_id}";

	$db0->query($query);

	$db0->closeDbConnection();

	echo json_encode((object) array('status' => 'success', 'value' => $user_id));

	break;

    case 'user_delete': // delete user
	global $DB;
	$imb_user_id = (isset($_GET["imb_user_id"])) ? $_GET["imb_user_id"] : $_POST["imb_user_id"];
	$db0 = new MySQLClient($DB);
	$query = "DELETE FROM user WHERE user_id='" . $imb_user_id . "'";
	$db0->update($query);
	$db0->closeDbConnection();
	echo json_encode((object) array('status' => 'success', 'value' => $imb_user_id));
	break;

    case 'user_update': // update user
	global $DB;
	$imb_user_id = (isset($_GET["imb_user_id"])) ? $_GET["imb_user_id"] : $_POST["imb_user_id"];
	$imb_type_id = (isset($_GET["imb_type_id"])) ? $_GET["imb_type_id"] : $_POST["imb_type_id"];
	$imb_bookshelf = (isset($_GET["imb_bookshelf"])) ? $_GET["imb_bookshelf"] : $_POST["imb_bookshelf"];
	$imb_bookclub = (isset($_GET["imb_bookclub"])) ? $_GET["imb_bookclub"] : $_POST["imb_bookclub"];
	$imb_user_name = (isset($_GET["imb_user_name"])) ? $_GET["imb_user_name"] : $_POST["imb_user_name"];
	$imb_login = (isset($_GET["imb_login"])) ? $_GET["imb_login"] : $_POST["imb_login"];
	$imb_password = (isset($_GET["imb_password"])) ? $_GET["imb_password"] : $_POST["imb_password"];
	$imb_avatar = (isset($_GET["imb_avatar"])) ? $_GET["imb_avatar"] : $_POST["imb_avatar"];
	$imb_group = (isset($_GET["imb_group"])) ? $_GET["imb_group"] : $_POST["imb_group"];


	// make sure all input fields have been entered
	if ($imb_user_name == '' OR $imb_login == '') {
	    echo json_encode((object) array('status' => 'error', 'value' => 'Input values cannot be blank.'));
	    exit;
	}
	// make sure password is fine
	if ((strlen($imb_password) < 4) AND ( $imb_pass != '')) {
	    echo json_encode((object) array('status' => 'error', 'value' => 'Password must be at least 4 characters long.'));
	    exit;
	}
	$db0 = new MySQLClient($DB);
	// make sure user login is not taken
	$query = "SELECT login FROM user WHERE login = '" . addslashes($imb_login) . "' AND user_id != '" . $imb_user_id . "';";
	if ($db0->query($query) && $db0->getNumberRows() > 0) {
	    echo json_encode((object) array('status' => 'error', 'value' => 'User Login already exists.'));
	    $db0->closeDbConnection();
	    exit;
	}
	$query = "UPDATE user SET usergroup='" . addslashes($imb_group) . "', avatar='" . addslashes($imb_avatar) . "', type_id='" . $imb_type_id . "', bookshelf='" . addslashes($imb_bookshelf) . "', bookclub='" . addslashes($imb_bookclub) . "', user_name='" . addslashes($imb_user_name) . "', login='" . addslashes($imb_login) . "'";
	if (($imb_password != '') && ($imb_password != '********')) { // update the password
	    $query.= ", password = PASSWORD('" . $imb_password . "')";
	}
	$query.= " WHERE user_id='" . $imb_user_id . "';";
	$db0->update($query);
	$db0->closeDbConnection();
	echo json_encode((object) array('status' => 'success', 'value' => $imb_user_id));
	break;

    case 'cohort_create': // cohort user
	global $DB;
	$imb_cohort_id = 0;
	$imb_name = (isset($_GET["imb_name"])) ? $_GET["imb_name"] : $_POST["imb_name"];
	$imb_code = (isset($_GET["imb_code"])) ? $_GET["imb_code"] : $_POST["imb_code"];
	$imb_library = (isset($_GET["imb_library"])) ? $_GET["imb_library"] : $_POST["imb_library"];
	$imb_room = (isset($_GET["imb_room"])) ? $_GET["imb_room"] : $_POST["imb_room"];
	$imb_bookcase = (isset($_GET["imb_bookcase"])) ? $_GET["imb_bookcase"] : $_POST["imb_bookcase"];
	$imb_bookshelves = (isset($_GET["imb_bookshelves"])) ? $_GET["imb_bookshelves"] : $_POST["imb_bookshelves"];
	$imb_bookclubs = (isset($_GET["imb_bookclubs"])) ? $_GET["imb_bookclubs"] : $_POST["imb_bookclubs"];
	$imb_social_profile = (isset($_GET["imb_social_profile"])) ? $_GET["imb_social_profile"] : $_POST["imb_social_profile"];

	// make sure all input fields have been entered
	if ($imb_name == '' OR $imb_code == '' OR $imb_library == '') {
	    echo json_encode((object) array('status' => 'error', 'value' => 'Input values cannot be blank.'));
	    exit;
	}
	$db0 = new MySQLClient($DB);
	// make sure cohort code is not taken
	$query = "SELECT code FROM cohort WHERE code = '" . addslashes($imb_code) . "';";
	if ($db0->query($query) && $db0->getNumberRows() > 0) {
	    echo json_encode((object) array('status' => 'error', 'value' => 'Cohort code already exists.'));
	    $db0->closeDbConnection();
	    exit;
	}
	$query = "INSERT INTO cohort VALUES (NULL, '" . addslashes($imb_name) . "', '" . addslashes($imb_code) . "', '" . addslashes($imb_library) . "', '" . addslashes($imb_room) . "', '" . addslashes($imb_bookcase) . "', '" . addslashes($imb_bookshelves) . "', '" . addslashes($imb_bookclubs) . "', '" . addslashes($imb_social_profile) . "');";
	$db0->update($query);
	$query = "SELECT cohort_id FROM cohort WHERE code = '" . addslashes($imb_code) . "';";
	if ($db0->query($query) && $db0->getNumberRows() == 1) {
	    $imb_cohort_id = $db0->data[0][0];
	} else {
	    echo json_encode((object) array('status' => 'error', 'value' => 'DB ERROR: failed to create a cohort.'));
	    $db0->closeDbConnection();
	    exit;
	}
	verifyNumberOfBookclubsInCohort($db0, $imb_cohort_id, $imb_bookclubs);
	$db0->closeDbConnection();

	// create a new bookshelf file if it doesn't exist
	$file_name = "../../data/bookshelves/" . $imb_library;
	if (!file_exists($file_name)) {
	    if (file_put_contents($file_name, '<?xml version="1.0" encoding="UTF-8"?>' . "\n<covers>\n</covers>")) {
		chmod($file_name, 0775);
		echo json_encode((object) array('status' => 'success', 'value' => $imb_cohort_id));
	    } else {
		echo json_encode((object) array('status' => 'error', 'value' => 'DB ERROR: unable to create the file.'));
	    }
	} else {
	    echo json_encode((object) array('status' => 'success', 'value' => $imb_cohort_id));
	}
	break;

    case 'cohort_delete': // cohort user
	global $DB;
	$imb_cohort_id = (isset($_GET["imb_cohort_id"])) ? $_GET["imb_cohort_id"] : $_POST["imb_cohort_id"];
	$db0 = new MySQLClient($DB);
	$query = "DELETE FROM cohort WHERE cohort_id='" . $imb_cohort_id . "'";
	$db0->update($query);
	$db0->closeDbConnection();
	echo json_encode((object) array('status' => 'success', 'value' => $imb_cohort_id));
	break;

    case 'cohort_update': // cohort user
	global $DB;
	$imb_cohort_id = (isset($_GET["imb_cohort_id"])) ? $_GET["imb_cohort_id"] : $_POST["imb_cohort_id"];
	$imb_name = (isset($_GET["imb_name"])) ? $_GET["imb_name"] : $_POST["imb_name"];
	$imb_code = (isset($_GET["imb_code"])) ? $_GET["imb_code"] : $_POST["imb_code"];
	$imb_library = (isset($_GET["imb_library"])) ? $_GET["imb_library"] : $_POST["imb_library"];
	$imb_room = (isset($_GET["imb_room"])) ? $_GET["imb_room"] : $_POST["imb_room"];
	$imb_bookcase = (isset($_GET["imb_bookcase"])) ? $_GET["imb_bookcase"] : $_POST["imb_bookcase"];
	$imb_bookshelves = (isset($_GET["imb_bookshelves"])) ? $_GET["imb_bookshelves"] : $_POST["imb_bookshelves"];
	$imb_bookclubs = (isset($_GET["imb_bookclubs"])) ? $_GET["imb_bookclubs"] : $_POST["imb_bookclubs"];
	$imb_social_profile = (isset($_GET["imb_social_profile"])) ? $_GET["imb_social_profile"] : $_POST["imb_social_profile"];
	// make sure all input fields have been entered
	if ($imb_name == '' OR $imb_code == '' OR $imb_library == '') {
	    echo json_encode((object) array('status' => 'error', 'value' => 'Input values cannot be blank.'));
	    exit;
	}
	$db0 = new MySQLClient($DB);
	// make sure cohort code is not taken
	$query = "SELECT code FROM cohort WHERE code = '" . addslashes($imb_code) . "' AND cohort_id != '" . $imb_cohort_id . "';";
	if ($db0->query($query) && $db0->getNumberRows() > 0) {
	    echo json_encode((object) array('status' => 'error', 'value' => 'Cohort code already exists.'));
	    $db0->closeDbConnection();
	    exit;
	}
	$query = "UPDATE cohort SET name='" . addslashes($imb_name) . "', code='" . addslashes($imb_code) . "', library='" . addslashes($imb_library) . "', room='" . addslashes($imb_room) . "', bookcase='" . addslashes($imb_bookcase) . "', bookshelves='" . addslashes($imb_bookshelves) . "', bookclubs='" . addslashes($imb_bookclubs) . "', social_profile='" . addslashes($imb_social_profile) . "' WHERE cohort_id='" . $imb_cohort_id . "';";
	$db0->update($query);
	verifyNumberOfBookclubsInCohort($db0, $imb_cohort_id, $imb_bookclubs);
	$db0->closeDbConnection();
	echo json_encode((object) array('status' => 'success', 'value' => $imb_cohort_id));
	break;

    case 'social_create': // social group
	global $DB;
	$imb_social_id = 0;
	$imb_name = (isset($_GET["imb_name"])) ? $_GET["imb_name"] : $_POST["imb_name"];
	$imb_desc = (isset($_GET["imb_desc"])) ? $_GET["imb_desc"] : $_POST["imb_desc"];
	// make sure all input fields have been entered
	if ($imb_name == '') {
	    echo json_encode((object) array('status' => 'error', 'value' => 'Input values cannot be blank.'));
	    exit;
	}
	$db0 = new MySQLClient($DB);
	$query = "INSERT INTO social VALUES (NULL, '" . addslashes($imb_name) . "', '" . addslashes($imb_desc) . "');";
	$db0->update($query);

	$query = "SELECT social_id FROM social WHERE name = '" . addslashes($imb_name) . "' AND description = '" . addslashes($imb_desc) . "';";
	if ($db0->query($query) && $db0->getNumberRows() == 1) {
	    $imb_social_id = $db0->data[0][0];
	    echo json_encode((object) array('status' => 'success', 'value' => $imb_social_id));
	} else {
	    echo json_encode((object) array('status' => 'error', 'value' => 'DB ERROR: failed to create a social group.'));
	    $db0->closeDbConnection();
	    exit;
	}
	$db0->closeDbConnection();
	break;

    case 'social_delete': // social
	global $DB;
	$imb_social_id = (isset($_GET["imb_social_id"])) ? $_GET["imb_social_id"] : $_POST["imb_social_id"];
	$db0 = new MySQLClient($DB);
	$query = "DELETE FROM social WHERE social_id='" . $imb_social_id . "'";
	$db0->update($query);
	$db0->closeDbConnection();
	echo json_encode((object) array('status' => 'success', 'value' => $imb_social_id));
	break;

    case 'social_update': // social
	global $DB;
	$imb_social_id = (isset($_GET["imb_social_id"])) ? $_GET["imb_social_id"] : $_POST["imb_social_id"];
	$imb_name = (isset($_GET["imb_name"])) ? $_GET["imb_name"] : $_POST["imb_name"];
	$imb_desc = (isset($_GET["imb_desc"])) ? $_GET["imb_desc"] : $_POST["imb_desc"];
	// make sure all input fields have been entered
	if ($imb_name == '') {
	    echo json_encode((object) array('status' => 'error', 'value' => 'Input values cannot be blank.'));
	    exit;
	}
	$db0 = new MySQLClient($DB);
	$query = "UPDATE social SET name='" . addslashes($imb_name) . "', description='" . addslashes($imb_desc) . "' WHERE social_id='" . $imb_social_id . "';";
	$db0->update($query);
	$db0->closeDbConnection();
	echo json_encode((object) array('status' => 'success', 'value' => $imb_social_id));
	break;
	
	case 'social_groups_list': // chat monitoring
		global $DB;
		$imb_cohort_id = (isset($_GET["imb_cohort"])) ? $_GET["imb_cohort"] : $_POST["imb_cohort"];
		// make sure all input fields have been entered
		if ($imb_cohort_id == '') {
			echo json_encode((object) array('status' => 'error', 'value' => 'Input values cannot be blank.'));
			exit;
		}
		// get a list of all social groups this cohort can use
		$db0 = new MySQLClient($DB);
		$query = "SELECT c.social_profile, s.social_id, s.name, s.description, s.blocked
					FROM cohort AS c JOIN social AS s ON (s.cohort_id=c.cohort_id)
					WHERE c.cohort_id='" . addslashes($imb_cohort_id) . "'
				    ORDER BY s.social_id ASC;";
		$db0->query($query);
		// only return bookclub number of entries, since those are the only ones that
		// the cohort is currently using
		$max_index = $db0->getNumberRows();
		$profile = 0;
		if ($max_index > 0) {
			$profile = $db0->data[0][0]; // make sure we got results before checking the profile
		}
		$groups = array();
		for ($index = 0; $index < $max_index; $index++) {
			$groups[] = array($db0->data[$index][1], $db0->data[$index][2], $db0->data[$index][3], $db0->data[$index][4]);
		}
		$result = array('status' => 'success', 'value' => array('profile' => $profile, 'groups' => $groups));
		$db0->closeDbConnection();
		
		echo json_encode((object) $result);
	break;
	
	case 'social_messages':
		global $DB;
		$imb_cohort_id = (isset($_GET["imb_cohort"])) ? $_GET["imb_cohort"] : $_POST["imb_cohort"];
		$imb_book_id = (isset($_GET["imb_book"])) ? $_GET["imb_book"] : $_POST["imb_book"];
		$imb_topic_id = (isset($_GET["imb_topic"])) ? $_GET["imb_topic"] : $_POST["imb_topic"];
		$imb_period = (isset($_GET["imb_period"])) ? $_GET["imb_period"] : $_POST["imb_period"];
		$imb_date_list = json_decode( (isset($_GET["imb_dates"])) ? $_GET["imb_dates"] : $_POST["imb_dates"] );
		
		// make sure all input fields have been entered
		if ($imb_cohort_id == '') {
			echo json_encode((object) array('status' => 'error', 'value' => 'Input values cannot be blank.'));
			exit;
		}
		// determine which social groups to check
		$db0 = new MySQLClient($DB);
		$result = array();
		$group_ids = array();
		$query = "SELECT c.bookclubs, s.social_id
			FROM cohort AS c JOIN social AS s ON (s.cohort_id=c.cohort_id)
			WHERE c.cohort_id='" . addslashes($imb_cohort_id) . "'
			ORDER BY s.social_id ASC;";
		$db0->query($query);
		for ($index = 0; $index < $db0->getNumberRows() && $index < $db0->data[0][0]; $index++) {
			$group_ids[] = $db0->data[$index][1];
		}
		// get messages from all of those groups
		for ($index = 0, $size = min(count($imb_date_list), count($group_ids)); $index < $size; $index++) {
			$query = "SELECT b.user_name, a.response, a.response_dt, b.avatar, a.social_id, a.book_id, a.topic_id, a.user_id, a.message_id, b.blocked, a.blocked ";
			$query.= "FROM social_response a LEFT JOIN user b ON (a.user_id=b.user_id) ";
			$query.= "WHERE b.cohort_id='" . addslashes($imb_cohort_id) . "' AND a.social_id='" . $group_ids[$index] . "' AND a.response_dt > '" . addslashes($imb_date_list[$index]) .
				"' AND a.archived=0 " .
				(($imb_topic_id == 'none') ? " AND a.topic_id=0 " : (($imb_topic_id != 'all') ? ("AND a.topic_id=" . $imb_topic_id) : "")) .
				(($imb_period != '') ? (" AND b.usergroup='" . addslashes($imb_period) . "'") : "") .
				(($imb_book_id != 'all') ? (" AND a.book_id=" . $imb_book_id) : "");
			$query.= " ORDER BY a.response_dt ASC;";
			$db0->query($query);
			
			// store the messages for each group separately
			$result[$index] = $db0->data; //array( array('test', 'some message', $imb_date_list[$index], 'none') );
		}
		$db0->closeDbConnection();
		// this always succeeds
		echo json_encode((object) array('status' => 'success', 'value' => $result));
	break;
	
	case "social_write": // write to a social group
		global $DB;
        $chat_type = (isset($_GET["imb_social_profile"])) ? $_GET["imb_social_profile"] : $_POST["imb_social_profile"];		
        $book_id = (isset($_GET["imb_book_id"])) ? $_GET["imb_book_id"] : $_POST["imb_book_id"];
        $topic_id = (isset($_GET["imb_topic_id"])) ? $_GET["imb_topic_id"] : $_POST["imb_topic_id"];
		$chosen_club = addslashes((isset($_GET["imb_social_id"])) ? $_GET["imb_social_id"] : $_POST["imb_social_id"]);
        $response = trim((isset($_GET["imb_response"])) ? $_GET["imb_response"] : $_POST["imb_response"]);
		
		$db0 = new MySQLClient($DB);
		// like in the read function, get the social profile and bookclub for this user
		$query  = "SELECT a.bookclub, b.social_profile ";
		$query .= "FROM user a JOIN cohort b ON (a.cohort_id = b.cohort_id) ";
		$query .= "WHERE user_id = '" . $s_user_id . "'";
		if ($db0->query($query)) {
			$bookclub_id = $db0->data[0][0];
			$profile = $db0->data[0][1];
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
			if ($write && $db0->query($query) && ($db0->getNumberRows() > 0) && ($db0->data[0][0] == 0)) {
				$query = "INSERT INTO social_response (social_profile, social_id, topic_id, user_id, book_id, page_id, state_id, topic_answer, response, response_dt) ";
				$query.= "VALUES (" . $profile . ", " . $bookclub_id . ", " . addslashes($topic_id) . ", " . $s_user_id . ", " . addslashes($book_id) . ", 0, 0, 0, '" . addslashes($response) . "', now())";
				$db0->update($query);
			}
		}
		
		$db0->closeDbConnection();
		echo json_encode((object) array('status' => 'success', 'value' => $write));
	break;
		
	case 'social_archive_chat':
		global $DB;
		$imb_social_id = (isset($_GET["imb_social"])) ? $_GET["imb_social"] : $_POST["imb_social"];
		$imb_profile_id = (isset($_GET["imb_profile"])) ? $_GET["imb_profile"] : $_POST["imb_profile"];
		
		// make sure all input fields have been entered
		if (($imb_social_id == '') || ($imb_profile_id == '') || (intval($imb_social_id) < 1)) {
			echo json_encode((object) array('status' => 'error', 'value' => 'Input values cannot be blank.'));
			exit;
		}
		// only allow admins and writers to perform this action
		if (!($s_type_id & 4) && !($s_type_id & 2)) {
			echo json_encode((object) array('status' => 'error', 'value' => 'Unauthorized access.'));
		}
		// archive all messages from the chosen group
		$db0 = new MySQLClient($DB);
		$query = "UPDATE social_response SET archived=1 " .
					"WHERE social_id='" . addslashes($imb_social_id) . "' AND social_profile='" . addslashes($imb_profile_id) . "';";
		$db0->query($query);
		$db0->closeDbConnection();
		// this always succeeds
		echo json_encode((object) array('status' => 'success'));
	break;
	
	case 'social_block_chat':
		global $DB;
		$imb_cohort_id = (isset($_GET["imb_cohort"])) ? $_GET["imb_cohort"] : $_POST["imb_cohort"];
		$imb_social_id = (isset($_GET["imb_social"])) ? $_GET["imb_social"] : $_POST["imb_social"];
		$imb_state = (isset($_GET["imb_block"])) ? $_GET["imb_block"] : $_POST["imb_block"];
		
		// make sure all input fields have been entered
		if (($imb_cohort_id == '') || ($imb_social_id == '') || ($imb_state == '') || 
			(intval($imb_cohort_id) < 1) || (intval($imb_social_id) < 1))
		{
			echo json_encode((object) array('status' => 'error', 'value' => 'Input values cannot be blank.'));
			exit;
		}
		// only allow admins and writers to perform this action
		if (!($s_type_id & 4) && !($s_type_id & 2)) {
			echo json_encode((object) array('status' => 'error', 'value' => 'Unauthorized access.'));
		}
		// get messages from all of the groups
		$db0 = new MySQLClient($DB);
		$query = "UPDATE social SET blocked=" . addslashes($imb_state) . "
					WHERE cohort_id='" . addslashes($imb_cohort_id) . "' AND social_id='" . addslashes($imb_social_id) . "';";
		$db0->query($query);
		$db0->closeDbConnection();
		// this always succeeds
		echo json_encode((object) array('status' => 'success'));
	break;

	case 'social_block_message':
		global $DB;
		$imb_message_id = (isset($_GET["imb_msg"])) ? $_GET["imb_msg"] : $_POST["imb_msg"];
		$imb_state = (isset($_GET["imb_block"])) ? $_GET["imb_block"] : $_POST["imb_block"];
		
		// make sure all input fields have been entered
		if (($imb_message_id == '') || ($imb_state == '') || (intval($imb_message_id) < 1)) {
			echo json_encode((object) array('status' => 'error', 'value' => 'Input values cannot be blank.'));
			exit;
		}
		$imb_message_id = intval($imb_message_id);
		$imb_state = (intval($imb_state) > 0) || ($imb_state == true);
		// only allow admins and writers to perform this action
		if (!($s_type_id & 4) && !($s_type_id & 2)) {
			echo json_encode((object) array('status' => 'error', 'value' => 'Unauthorized access.'));
		}
		// get messages from all of the groups
		$db0 = new MySQLClient($DB);
		$query = "UPDATE social_response SET blocked=" . (($imb_state) ? 1 : 0) . "
					WHERE message_id='" . addslashes($imb_message_id) . "';";
		$db0->query($query);
		$db0->closeDbConnection();
		// this always succeeds
		echo json_encode((object) array('status' => 'success'));
	break;
	
	case 'social_block_user':
		global $DB;
		$imb_user_id = (isset($_GET["imb_user"])) ? $_GET["imb_user"] : $_POST["imb_user"];
		$imb_state = (isset($_GET["imb_block"])) ? $_GET["imb_block"] : $_POST["imb_block"];
		
		// make sure all input fields have been entered
		if (($imb_user_id == '') || ($imb_state == '') || (intval($imb_user_id) < 1)) {
			echo json_encode((object) array('status' => 'error', 'value' => 'Input values cannot be blank.'));
			exit;
		}
		$imb_user_id = intval($imb_user_id);
		$imb_state = (intval($imb_state) > 0) || ($imb_state == true);
		// only allow admins and writers to perform this action
		if (!($s_type_id & 4) && !($s_type_id & 2)) {
			echo json_encode((object) array('status' => 'error', 'value' => 'Unauthorized access.'));
		}
		// adjust blocked status of the chosen user
		$db0 = new MySQLClient($DB);
		$query = "UPDATE user SET blocked=" . (($imb_state) ? 1 : 0) . "
					WHERE user_id='" . addslashes($imb_user_id) . "';";
		$db0->query($query);
		$db0->closeDbConnection();
		// this always succeeds
		echo json_encode((object) array('status' => 'success'));
	break;
	
    case 'develop': // get development environments
	global $DB;
	$developEnv_arr = array();

	$path = $_SERVER['DOCUMENT_ROOT'];
	chdir($_SERVER['DOCUMENT_ROOT']);

	$tmpArray = rglob("data/books");

	foreach ($tmpArray as $tmpDir) {
	    array_push($developEnv_arr, "/" . substr($tmpDir, 0, (strlen($tmpDir) - 11)));
	}

	/* $objects = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path), RecursiveIteratorIterator::SELF_FIRST);
	  foreach($objects as $name => $object){
	  if (substr($name, strrpos($name, "/") + 1) == "data") {
	  array_push($developEnv_arr, substr($name, strlen($path)+1, (strlen($name)-strlen($path)-6)));

	  }
	  } */

	echo json_encode((object) array('status' => 'success', 'developEnv_arr' => $developEnv_arr));

	break;

    case 'books': // get books from selected environments
	global $DB;
	$folder = (isset($_GET["imb_folder"])) ? $_GET["imb_folder"] : $_POST["imb_folder"];
	$books_arr = array();

	//path to directory to environment
	$directory = $_SERVER['DOCUMENT_ROOT'] . "/" . $folder . "/data/books/"; //imapbook/trunk/";// . $folder  . "/data/books/";
	//get all files in dev directory
	$files = glob($directory . "*");
	//save each directory in array
	foreach ($files as $file) {
	    //check to see if the file is a folder/directory
	    if (is_dir($file)) {
		array_push($books_arr, substr($file, strripos($file, "/") + 1));
	    }
	}

	echo json_encode((object) array('status' => 'success', 'books_arr' => $books_arr));

	break;

    case 'delete_book': // delete book from environment
	global $DB;
	$book = (isset($_GET["imb_book"])) ? $_GET["imb_book"] : $_POST["imb_book"];
	$src = (isset($_GET["imb_src"])) ? $_GET["imb_src"] : $_POST["imb_src"];
	$books_arr = array();

	//path to directory to environment
	$directory = $_SERVER['DOCUMENT_ROOT'] . $src . "/data/books/";
	rmdirr($directory . $book);

	//get all files in dev directory
	$files = glob($directory . "*");


	//save each directory in array
	foreach ($files as $file) {
	    //check to see if the file is a folder/directory
	    if (is_dir($file)) {
		array_push($books_arr, substr($file, strripos($file, "/") + 1));
	    }
	}

	echo json_encode((object) array('status' => 'success', 'books_arr' => $books_arr));

	break;

    case 'copy_book': // copy book from source to destination environment
	global $DB;
	$book = (isset($_GET["imb_book"])) ? $_GET["imb_book"] : $_POST["imb_book"];
	$src = (isset($_GET["imb_src"])) ? $_GET["imb_src"] : $_POST["imb_src"];
	$dest = (isset($_GET["imb_dest"])) ? $_GET["imb_dest"] : $_POST["imb_dest"];
	$books_arr = array();

	//path to directory to environment
	$srcDirectory = $_SERVER['DOCUMENT_ROOT'] . $src . "/data/books/" . $book;
	$destDirectory = $_SERVER['DOCUMENT_ROOT'] . $dest . "/data/books/" . $book;

	if (!is_dir($destDirectory)) {
	    cpdirr($srcDirectory, $destDirectory);
	} else {
	    echo json_encode((object) array('status' => 'error'));
	    exit;
	}
	//get all files in dev directory
	$files = glob($_SERVER['DOCUMENT_ROOT'] . $dest . "/data/books/" . "*");


	//save each directory in array
	foreach ($files as $file) {
	    //check to see if the file is a folder/directory
	    if (is_dir($file)) {
		array_push($books_arr, substr($file, strripos($file, "/") + 1));
	    }
	}

	echo json_encode((object) array('status' => 'success', 'books_arr' => $books_arr));

	break;

    case 'merge_book': // merge book from source into destination
	global $DB;
	$bookSrc = (isset($_GET["imb_bookSrc"])) ? $_GET["imb_bookSrc"] : $_POST["imb_bookSrc"];
	$bookDest = (isset($_GET["imb_bookDest"])) ? $_GET["imb_bookDest"] : $_POST["imb_bookDest"];
	$src = (isset($_GET["imb_src"])) ? $_GET["imb_src"] : $_POST["imb_src"];
	$dest = (isset($_GET["imb_dest"])) ? $_GET["imb_dest"] : $_POST["imb_dest"];
	$books_arr = array();

	//path to directory to environment
	$srcDirectory = $_SERVER['DOCUMENT_ROOT'] . $src . "/data/books/" . $bookSrc;
	$destDirectory = $_SERVER['DOCUMENT_ROOT'] . $dest . "/data/books/" . $bookDest;


	mergeBook($srcDirectory, $destDirectory);
	//if (!is_dir($destDirectory)) {
	//cpdirr($srcDirectory, $destDirectory);
	//}
	//else
	//{
	//	echo json_encode((object) array('status' => 'error'));
	//	exit;
	//}
	//get all files in dev directory
	//$files = glob($_SERVER['DOCUMENT_ROOT'] . $dest .  "/data/books/" . "*");
	//save each directory in array
	//foreach($files as $file)
	//{
	//check to see if the file is a folder/directory
	// if(is_dir($file))
	// {
	//	array_push($books_arr, substr($file, strripos($file, "/") + 1));
	// }
	//}

	echo json_encode((object) array('status' => 'success', 'books_arr' => $books_arr));

	break;

    case 'update_book':
	$writepath = $_POST["path"];
	rename("../../../../" . $writepath . "book.xml", "../../../../" . $writepath . "book-old.xml");
	file_put_contents("../../../../" . $writepath . "book.xml", $_POST["xml"]);
	echo "../../../../" . $writepath . "book.xml";
	break;

    case 'report': // generate html reports
	global $DB;
	$report = (isset($_GET["report_id"])) ? $_GET["report_id"] : $_POST["report_id"];
	$cohort = (isset($_GET["cohort_id"])) ? $_GET["cohort_id"] : $_POST["cohort_id"];
	$user = (isset($_GET["user_id"])) ? $_GET["user_id"] : $_POST["user_id"];
	$bookclub = (isset($_GET["bookclub_id"])) ? $_GET["bookclub_id"] : $_POST["bookclub_id"];
	$book = (isset($_GET["book_id"])) ? $_GET["book_id"] : $_POST["book_id"];
	$page = intval((isset($_GET["page_id"])) ? $_GET["page_id"] : $_POST["page_id"]) - 1;
	$start_dt = (isset($_GET["start_dt"])) ? $_GET["start_dt"] : $_POST["start_dt"];
	$end_dt = (isset($_GET["end_dt"])) ? $_GET["end_dt"] : $_POST["end_dt"];
	$period = (isset($_GET["period_id"])) ? $_GET["period_id"] : $_POST["period_id"];
	$topic_id = (isset($_GET["topic_id"])) ? $_GET["topic_id"] : $_POST["topic_id"];
	$results_start = (isset($_GET["first_row"])) ? $_GET["first_row"] : 0;
	$results_limit = (isset($_GET["total_rows"])) ? $_GET["total_rows"] : 0;
	$sort_by = (isset($_GET["sort_by"])) ? strtolower(addslashes($_GET["sort_by"])) : "default";
	
	$results_count = 0;
	
	$result_arr = array();
	$db0 = new MySQLClient($DB);
	switch ($report) {
	    case 1: // Registration Activity
			$query = "select a.user_id, a.user_name, a.login, a.created_dt, b.cohort_id, b.library, b.code, b.room, a.bookshelf, a.bookclub, c.institution, c.location, c.role ";
			$query.= "	FROM user a left join cohort b on (b.cohort_id = a.cohort_id) LEFT JOIN user_data c ON (a.user_id = c.user_id) ";
			$query.= "	WHERE a.cohort_id = b.cohort_id";
			if ($cohort != 'all') {
				$query.= " AND a.cohort_id = '" . $cohort . "'";
			}
			if ($user != 'all') {
				$query.= " AND a.user_id = '" . $user . "'";
			}
			if ($bookclub != 'all') {
				$query.= " AND a.bookclub = " . intval($bookclub);
			}
			if ($start_dt != '') {
				$query.= " AND a.created_dt >= '" . $start_dt . "'";
			}
			if ($end_dt != '') {
				$query.= " AND a.created_dt <= '" . $end_dt . "'";
			}
			if ($period != '') {
				$query.= " AND a.usergroup = '" . $period . "'";
			}
			if ($sort_by == 'default') {
				$query.= " ORDER BY a.created_dt DESC;";
			}
			else {
				$from_client = array("user_id", "user_name", "login", "register_date", "cohort", "library", "code", "room", "bookshelf", "bookclub", "institution", "location", "role");
				$on_server = array("a.user_id", "a.user_name", "a.login", "a.created_dt", "b.cohort_id", "b.library", "b.code", "b.room", "a.bookshelf", "a.bookclub", "c.institution", "c.location", "c.role");
				$query.= " ORDER BY " . str_replace($from_client, $on_server, $sort_by) . ";";
			}
			
			if ($db0->query($query)) {
				$results_count = $db0->getNumberRows();
				$cnt = ($results_limit > 0) ? min($results_start + $results_limit, $db0->getNumberRows()) : $db0->getNumberRows();
				for ($x = $results_start; $x < $cnt; $x++) {
					$result_arr[] = array(
						"user_id" => $db0->data[$x][0],
						"user_name" => $db0->data[$x][1],
						"login" => $db0->data[$x][2],
						"register_date" => $db0->data[$x][3],
						"cohort" => $db0->data[$x][4],
						"library" => $db0->data[$x][5],
						"code" => $db0->data[$x][6],
						"room" => $db0->data[$x][7],
						"bookshelf" => $db0->data[$x][8],
						"bookclub" => $db0->data[$x][9],
						"institution" => $db0->data[$x][10],
						"location" => $db0->data[$x][11],
						"role" => $db0->data[$x][12]
					);
				}
			}
		break;
		
	    case 2: // Reader Activity
			$query = "SELECT a.user_id, b.user_name, a.book_id, a.page_id, a.state_id, a.response_type_id, a.response, a.response_weight, a.response_dt ";
			$query.= "FROM user_response a, user b ";
			$query.= "WHERE a.user_id = b.user_id ";
			if ($cohort != 'all') {
				$query.= " AND b.cohort_id = '" . $cohort . "'";
			}
			if ($user != 'all') {
				$query.= " AND a.user_id = '" . $user . "'";
			}
			if ($bookclub != 'all') {
				$query.= " AND a.bookclub = " . intval($bookclub);
			}
			if ($book != 'all') {
				$query.= " AND a.book_id = '" . $book . "'";
			}
			if ($start_dt != '') {
				$query.= " AND a.response_dt >= '" . $start_dt . "'";
			}
			if ($end_dt != '') {
				$query.= " AND a.response_dt <= '" . $end_dt . "'";
			}
			if ($period != '') {
				$query.= " AND b.usergroup = '" . $period . "'";
			}
			if ($sort_by == 'default') {
				$query.= " ORDER BY a.response_dt ASC;";
			}
			else {
				$from_client = array("user_id", "user_name", "book_id", "page_id", "state_id", "response_type", "response_text", "response_weight", "response_time");
				$on_server = array("a.user_id", "b.user_name", "a.book_id", "a.page_id", "a.state_id", "a.response_type_id", "a.response", "a.response_weight", "a.response_dt");
				$query.= " ORDER BY " . str_replace($from_client, $on_server, $sort_by) . ";";
			}
			
			if ($db0->query($query)) {
				$results_count = $db0->getNumberRows();
				$cnt = ($results_limit > 0) ? min($results_start + $results_limit, $db0->getNumberRows()) : $db0->getNumberRows();
				for ($x = $results_start; $x < $cnt; $x++) {
					$timestamp = new DateTime($db0->data[$x][8], new DateTimeZone("UTC"));
					$timestamp->setTimezone(new DateTimeZone("America/New_York"));
					$result_arr[] = array(
						"user_id" => $db0->data[$x][0],
						"user_name" => $db0->data[$x][1],
						"book_id" => $db0->data[$x][2],
						"page_id" => $db0->data[$x][3],
						"state_id" => $db0->data[$x][4],
						"response_type" => $db0->data[$x][5],
						"response_text" => $db0->data[$x][6],
						"response_weight" => $db0->data[$x][7],
						"response_time" => $timestamp->format("Y-m-d h:i:s A")
					);
				}
			}
		break;
		
	    case 3: // Invalid Responses
			$query = "SELECT DISTINCT response, response_dt FROM user_response WHERE user_id IN (SELECT user_id FROM user ";
			if ($cohort == 'all' && $period == '') {
				$query.= ")";
			}
			else {
				$query.= "WHERE ";
				$tempAdd = false;
				if ($cohort != 'all') {
					$query.= "cohort_id = '" . $cohort . "' ";
					$tempAdd = true;
				}
				if ($period != '') {
					$query.= (($tempAdd) ? "AND " : "") . " usergroup = '" . $period . "'";
				}
				$query .= ") ";
			}
			if ($user != 'all') {
				$query.= " AND user_id = '" . $user . "'";
			}
			if ($bookclub != 'all') {
				$query.= " AND bookclub = " . intval($bookclub);
			}
			if ($book != 'all') {
				$query.= " AND book_id = '" . $book . "'";
			}
			if ($start_dt != '') {
				$query.= " AND response_dt >= '" . $start_dt . "'";
			}
			if ($end_dt != '') {
				$query.= " AND response_dt <= '" . $end_dt . "'";
			}
			$query.= " AND response_type_id = 99 ";
			if ($sort_by == 'default') {
				$query.= " ORDER BY response_dt DESC;";
			}
			else {
				$from_client = array("response_text", "response_time");
				$on_server = array("response", "response_dt");
				$query.= " ORDER BY " . str_replace($from_client, $on_server, $sort_by) . ";";
			}
			
			if ($db0->query($query)) {
				$results_count = $db0->getNumberRows();
				$cnt = ($results_limit > 0) ? min($results_start + $results_limit, $db0->getNumberRows()) : $db0->getNumberRows();
				for ($x = $results_start; $x < $cnt; $x++) {
					$timestamp = new DateTime($db0->data[$x][1], new DateTimeZone("UTC"));
					$timestamp->setTimezone(new DateTimeZone("America/New_York"));
					$result_arr[] = array(
						"response_text" => $db0->data[$x][0],
						"response_time" => $timestamp->format("Y-m-d h:i:s A")
					);
				}
			}
		break;
		
	    case 4: // Response Totals
			$query = "SELECT a.user_id, b.user_name, SUM(a.response_type_id = 1) AS positive, SUM(a.response_type_id = 2) AS negative, SUM(a.response_type_id = 99) AS mismatch, SUM(a.response_type_id in (3,4)) AS other, COUNT(*) AS total";
			$query.= " FROM user_response a, user b ";
			$query.= " WHERE a.user_id = b.user_id";
			if ($cohort != 'all') {
				$query.= " AND b.cohort_id = '" . $cohort . "'";
			}
			if ($user != 'all') {
				$query.= " AND a.user_id = '" . $user . "'";
			}
			if ($bookclub != 'all') {
				$query.= " AND a.bookclub = " . intval($bookclub);
			}
			if ($book != 'all') {
				$query.= " AND a.book_id = '" . $book . "'";
			}
			if ($start_dt != '') {
				$query.= " AND a.response_dt >= '" . $start_dt . "'";
			}
			if ($end_dt != '') {
				$query.= " AND a.response_dt <= '" . $end_dt . "'";
			}
			if ($period != '') {
				$query.= " AND b.usergroup = '" . $period . "'";
			}
			$query.= " AND a.response_type_id IN (1,2,3,4,99) GROUP BY a.user_id ";
			if ($sort_by == 'default') {
				$query.= " ORDER BY a.user_id ASC;";
			}
			else {
				$from_client = array("user_id", "user_name", "positive", "negative", "mismatch", "other", "total");
				$on_server = array("a.user_id", "b.user_name", "positive", "negative", "mismatch", "other", "total");
				$query.= " ORDER BY " . str_replace($from_client, $on_server, $sort_by) . ";";
			}
			
			if ($db0->query($query)) {
				$results_count = $db0->getNumberRows();
				$cnt = ($results_limit > 0) ? min($results_start + $results_limit, $db0->getNumberRows()) : $db0->getNumberRows();
				for ($x = $results_start; $x < $cnt; $x++) {
					$result_arr[] = array(
						"user_id" => $db0->data[$x][0],
						"user_name" => $db0->data[$x][1],
						"positive" => $db0->data[$x][2],
						"negative" => $db0->data[$x][3],
						"mismatch" => $db0->data[$x][4],
						"other" => $db0->data[$x][5],
						"total" => $db0->data[$x][6]
					);
				}
			}
		break;
		
	    case 5: // Time Report
			$query = "SELECT a.user_id, b.user_name, a.book_id, a.page_id, a.session_start_dt, a.response, UNIX_TIMESTAMP(a.response_dt), a.response_weight ";
			$query.= " FROM user_response a, user b ";
			$query.= " WHERE a.response_type_id = 0 AND a.response IN ('PAGE TURN', 'BOOK SCORE') AND a.user_id = b.user_id";
			if ($cohort != 'all') {
				$query.= " AND b.cohort_id = '" . $cohort . "'";
			}
			if ($user != 'all') {
				$query.= " AND a.user_id = '" . $user . "'";
			}
			if ($bookclub != 'all') {
				$query.= " AND a.bookclub = " . intval($bookclub);
			}
			if ($book != 'all') {
				$query.= " AND a.book_id = '" . $book . "'";
			}
			if ($start_dt != '') {
				$query.= " AND a.response_dt >= '" . $start_dt . "'";
			}
			if ($end_dt != '') {
				$query.= " AND a.response_dt <= '" . $end_dt . "'";
			}
			if ($period != '') {
				$query.= " AND b.usergroup = '" . $period . "'";
			}
			$query.= " ORDER BY a.user_id, a.book_id, a.session_start_dt, a.response_dt ASC;";
			
			/*
			if ($db0->query($query)) {
				$cnt = $db0->getNumberRows();
				// get aggregate data
				$idx = 0;
				while ($idx < $cnt) {
				$user_id = $db0->data[$idx][0];
				$user_name = $db0->data[$idx][1];
				$session_id = $db0->data[$idx][4];
				$book_id = $db0->data[$idx][2];
				$page_id = $db0->data[$idx][3];
				$page_times = array();
				$page_credits = array();
				while ($db0->data[$idx][4] == $session_id) { // for all records in a session
					// get the time difference between page turns
					// as long as the next record falls in the same session and is a different page (i.e. not a return from bookshelf)
					if ($db0->data[$idx][5] == 'PAGE TURN' && $db0->data[$idx+1][5] == 'PAGE TURN' && $db0->data[$idx+1][4] == $session_id && $db0->data[$idx+1][3] != $db0->data[$idx][3]) {
						$tdiff = $db0->data[$idx + 1][6] - $db0->data[$idx][6];
						$page_times[$db0->data[$idx][3]] += $tdiff;
					}
					// get book scores between page turns
					if ($db0->data[$idx][5] == 'BOOK SCORE') {
						$page_credits[$db0->data[$idx][3]] = $db0->data[$idx][7];
					}
					$idx++;
				}
				echo "<table border=1>";
				echo "<tr><td>user_id</td><td>user_name</td><td>session</td><td>book_id</td><td>page</td><td>total time (s)</td><td>average time (s)</td><td>credits</td></tr>";
				$page_cnt = 0;
				$page_tot = 0;
				for ($x = 0; $x < count($page_times); $x++) { // NOTE: last page is not counted
					$page_cnt++;
					$page_tot += $page_times[$x];
					echo "<tr><td>" . $user_id . "</td><td>" . $user_name . "</td><td>" . $session_id . "</td><td>" . $book_id . "</td><td>" . $page_cnt . "</td><td>" . $page_times[$x] . "</td><td>&nbsp;</td><td>" . $page_credits[$x] . "</td>";
				}
				echo "<tr><td>" . $user_id . "</td><td>" . $user_name . "</td><td>" . $session_id . "</td><td>" . $book_id . "</td><td>All</td><td>" . $page_tot . "</td><td>" . (($page_cnt > 0) ? $page_tot / $page_cnt : 0) . "</td><td>&nbsp;</td>";
				echo "</table>";
				}
			}

			
			if ($db0->query($query)) {
				$cnt = $db0->getNumberRows();
				// get aggregate data
				$idx = 0;
				while ($idx < $cnt) {
					$user_id = $db0->data[$idx][0];
					$user_name = $db0->data[$idx][1];
					$session_id = $db0->data[$idx][4];
					$book_id = $db0->data[$idx][2];
					$page_id = $db0->data[$idx][3];
					$page_times = array();
					$page_credits = array();
					while ($db0->data[$idx][4] == $session_id) { // for all records in a session
						// get the time difference between page turns
						// as long as the next record falls in the same session and is a different page (i.e. not a return from bookshelf)
						if ($db0->data[$idx][5] == 'PAGE TURN' && $db0->data[$idx+1][5] == 'PAGE TURN' && $db0->data[$idx+1][4] == $session_id && $db0->data[$idx+1][3] != $db0->data[$idx][3]) {
							$tdiff = $db0->data[$idx + 1][6] - $db0->data[$idx][6];
							$page_times[$db0->data[$idx][3]] += $tdiff;
						}
						// get book scores between page turns
						if ($db0->data[$idx][5] == 'BOOK SCORE') {
							$page_credits[$db0->data[$idx][3]] = $db0->data[$idx][7];
						}
						$idx++;
					}
					
					echo "<table border=1>";
					echo "<tr><td>user_id</td><td>user_name</td><td>session</td><td>book_id</td><td>page</td><td>total time (s)</td><td>average time (s)</td><td>credits</td></tr>";
					$page_cnt = 0;
					$page_tot = 0;
					for ($x = 0; $x < count($page_times); $x++) { // NOTE: last page is not counted
						$page_cnt++;
						$page_tot += $page_times[$x];
						echo "<tr><td>" . $user_id . "</td><td>" . $user_name . "</td><td>" . $session_id . "</td><td>" . $book_id . "</td><td>" . $page_cnt . "</td><td>" . $page_times[$x] . "</td><td>&nbsp;</td><td>" . $page_credits[$x] . "</td>";
					}
					echo "<tr><td>" . $user_id . "</td><td>" . $user_name . "</td><td>" . $session_id . "</td><td>" . $book_id . "</td><td>All</td><td>" . $page_tot . "</td><td>" . (($page_cnt > 0) ? $page_tot / $page_cnt : 0) . "</td><td>&nbsp;</td>";
					echo "</table>";
				
					$page_cnt = 0;
					$page_tot = 0;
					for ($x = 0; $x < count($page_times); $x++) { // NOTE: last page is not counted
						$page_cnt++;
						$page_tot += $page_times[$x];
						$result_arr[] = array(
							"user_id" => $user_id,
							"user_name" => $user_name,
							"session" => $session_id,
							"book" => $book_id,
							"mismatch" => $db0->data[$x][4],
							"other" => $db0->data[$x][5],
							"total" => $db0->data[$x][6]
						);
						echo <td>" . $page_cnt . "</td><td>" . $page_times[$x] . "</td><td>&nbsp;</td><td>" . $page_credits[$x] . "</td>";
					}
				for ($x = 0; $x < $cnt; $x++) {
					$result_arr[] = array(
						"user_id" => $db0->data[$x][0],
						"user_name" => $db0->data[$x][1],
						"positive" => $db0->data[$x][2],
						"negative" => $db0->data[$x][3],
						"mismatch" => $db0->data[$x][4],
						"other" => $db0->data[$x][5],
						"total" => $db0->data[$x][6]
					);
				echo "<table border=1>";
				echo "<tr><td>user_id</td><td>user_name</td><td>session</td><td>book_id</td><td>page</td><td>total time (s)</td><td>average time (s)</td><td>credits</td></tr>";
				echo "<tr><td>" . $user_id . "</td><td>" . $user_name . "</td><td>" . $session_id . "</td><td>" . $book_id . "</td><td>All</td><td>" . $page_tot . "</td><td>" . (($page_cnt > 0) ? $page_tot / $page_cnt : 0) . "</td><td>&nbsp;</td>";
				echo "</table>";
				}
				}
			}
			if ($db0->query($query)) {
				
				$db0->closeDbConnection();
				echo "<br/>Found " . $cnt . " record(s)";
			} else {
				echo "No records found!";
			}*/
			
		break;
		
	    case 6: // Time Summary Report
			$query = "SELECT a.user_id, b.user_name, a.book_id, a.page_id, a.session_start_dt, a.response, UNIX_TIMESTAMP(a.response_dt) ";
			$query.= " FROM user_response a, user b ";
			$query.= " WHERE a.response_type_id = 0 AND a.response='PAGE TURN' AND a.user_id = b.user_id";
			if ($cohort != 'all') {
				$query.= " AND b.cohort_id = '" . $cohort . "'";
			}
			if ($user != 'all') {
				$query.= " AND a.user_id = '" . $user . "'";
			}
			if ($bookclub != 'all') {
				$query.= " AND a.bookclub = " . intval($bookclub);
			}
			if ($book != 'all') {
				$query.= " AND a.book_id = '" . $book . "'";
			}
			if ($start_dt != '') {
				$query.= " AND a.response_dt >= '" . $start_dt . "'";
			}
			if ($end_dt != '') {
				$query.= " AND a.response_dt <= '" . $end_dt . "'";
			}
			if ($period != '') {
				$query.= " AND b.usergroup = '" . $period . "'";
			}
			$query.= " ORDER BY b.user_name, a.book_id, a.session_start_dt, a.response_dt ASC;";
			
			if ($db0->query($query) && $db0->getNumberRows() > 0) {
				// we need to go through all of the data, but a lot of this data gets
				// aggregated instead of returned as is; so, process the whole thing,
				// figure out all of the data, and then return only the parts we want
				$results_count = 0;
				$cnt = $db0->getNumberRows();
				$minIndex = 0;
				$maxIndex = $cnt;
				if ($results_limit > 0) {
					$minIndex = $results_start;
					$maxIndex = $results_start + $results_limit;
				}
				// get aggregate data
				$idx = 0;
				while ($idx < $cnt) {
					$user_id = $db0->data[$idx][0];
					$user_name = $db0->data[$idx][1];
					$session_id = $db0->data[$idx][4];
					$book_id = $db0->data[$idx][2];
					$page_id = $db0->data[$idx][3];
					$page_times = array();
					// for all records in a session
					while ($db0->data[$idx][4] == $session_id) {
						// get the time difference between page turns
						// as long as the next record falls in the same session and is a different page (i.e. not a return from bookshelf)
						if ($db0->data[$idx + 1][4] == $session_id && $db0->data[$idx + 1][3] != $db0->data[$idx][3]) {
							$tdiff = $db0->data[$idx + 1][6] - $db0->data[$idx][6];
							$page_times[$db0->data[$idx][3]] += $tdiff;
						}
						$idx++;
					}
					// count the pages
					$page_cnt = 0;
					$page_tot = 0;
					for ($x = 0; $x < count($page_times); $x++) { // NOTE: last page is not counted
						$page_cnt++;
						$page_tot += $page_times[$x];
					}
					// we now have a result; check if we want to return it
					if ($results_count >= $minIndex && $results_count < $maxIndex) {
						// build this result row
						$result_arr[] = array(
							"user_id" => $user_id,
							"user_name" => $user_name,
							"session" => $session_id,
							"book_id" => $book_id,
							"total_pages" => $page_cnt,
							"total_time" => gmdate("H:i:s", $page_tot),
							"average_time" => gmdate("H:i:s", (($page_cnt > 0) ? $page_tot / $page_cnt : 0))
						);
					}
					$results_count++;
				}
			}
		break;
		
	    case 7: // Reader Responses
			$query  = "SELECT a.user_id, b.user_name, a.book_id, a.page_id, a.state_id, a.response_type_id, a.response, a.response_weight, a.response_dt ";
			$query .= "FROM user_response a, user b ";
			$query .= "WHERE a.user_id = b.user_id AND response_type_id IN (1, 98, 99) ";
			if ($cohort != 'all') {
				$query .= " AND b.cohort_id = '" . $cohort . "'";
			}
			if ($user != 'all') {
				$query .= " AND a.user_id = '" . $user . "'";
			}
			if ($bookclub != 'all') {
				$query.= " AND a.bookclub = " . intval($bookclub);
			}
			if ($book != 'all') {
				$query.= " AND a.book_id = '" . $book . "'";
			}
			if ($page != -1) {
				$query.= " AND a.page_id = '" . $page . "'";
			}
			if ($start_dt != '') {
				$query.= " AND a.response_dt >= '" . $start_dt . "'";
			}
			if ($end_dt != '') {
				$query.= " AND a.response_dt <= '" . $end_dt . "'";
			}
			if ($period != '') {
				$query.= " AND b.usergroup = '" . $period . "'";
			}
			if ($sort_by == 'default') {
				$query.= " ORDER BY a.response_dt ASC;";
			}
			else {
				$from_client = array("user_id", "user_name", "book_id", "page_id", "state_id", "response_type", "response_text", "response_weight", "response_time");
				$on_server = array("a.user_id", "b.user_name", "a.book_id", "a.page_id", "a.state_id", "a.response_type_id", "a.response", "a.response_weight", "a.response_dt");
				$query.= " ORDER BY " . str_replace($from_client, $on_server, $sort_by) . ";";
			}
			
			if ($db0->query($query)) {
				$results_count = $db0->getNumberRows();
				$cnt = ($results_limit > 0) ? min($results_start + $results_limit, $db0->getNumberRows()) : $db0->getNumberRows();
				for ($x = $results_start; $x < $cnt; $x++) {
					$timestamp = new DateTime($db0->data[$x][8], new DateTimeZone("UTC"));
					$timestamp->setTimezone(new DateTimeZone("America/New_York"));
					$result_arr[] = array(
						"user_id" => $db0->data[$x][0],
						"user_name" => $db0->data[$x][1],
						"book_id" => $db0->data[$x][2],
						"page_id" => $db0->data[$x][3],
						"state_id" => $db0->data[$x][4],
						"response_type" => $db0->data[$x][5],
						"response_text" => $db0->data[$x][6],
						"response_weight" => $db0->data[$x][7],
						"response_time" => $timestamp->format("Y-m-d h:i:s A")
					);
				}
			}
		break;
		
	    case 8: //Quiz Response data
			$query = "SELECT a.user_id, b.user_name, a.book_id, a.page_id, a.state_id, a.response_type_id, a.response, a.response_weight, a.response_dt ";
			$query.= "FROM user_response a, user b ";
			$query.= "WHERE a.user_id = b.user_id AND response_type_id IN (1, 98, 99) ";
			if ($cohort != 'all') {
				$query.= " AND b.cohort_id = '" . $cohort . "'";
			}
			if ($user != 'all') {
				$query.= " AND a.user_id = '" . $user . "'";
			}
			if ($bookclub != 'all') {
				$query.= " AND a.bookclub = " . intval($bookclub);
			}
			if ($book != 'all') {
				$query.= " AND a.book_id = '" . $book . "'";
			}
			if ($page != -1) {
				$query.= " AND a.page_id = '" . $page . "'";
			}
			if ($start_dt != '') {
				$query.= " AND a.response_dt >= '" . $start_dt . "'";
			}
			if ($end_dt != '') {
				$query.= " AND a.response_dt <= '" . $end_dt . "'";
			}
			if ($period != '') {
				$query.= " AND b.usergroup = '" . $period . "'";
			}
			$query.= " ORDER BY a.response_dt ASC;";

			//lists of QuizData objects
			$quiz_data_list = array();
			$completed_quiz_list = array();

			//lists for page numbers and book ID's that don't contain quizes (to avoid searching xml too much)
			$include_bookpages = array();
			$exclude_bookpages = array();

			//bookshelf data
			$bookshelf_xml = simplexml_load_file("../../data/bookshelves/default.xml");

			//debugC("Starting grading!");
			if ($db0->query($query)) {
				$cnt = $db0->getNumberRows();
				//traverse the rows of data!
				for ($x = 0; $x < $cnt; $x++) {
					//was this data already determined to not point to a quiz game?
					if (in_array(array($db0->data[$x][2], $db0->data[$x][3]), $exclude_bookpages)) {
						//debugC('this page isnt a quiz. we already determined that');
						continue;
					}

					//if not, determine whether this response came from a quiz
					$result = isAQuiz($bookshelf_xml, (int) $db0->data[$x][2], (int) $db0->data[$x][3]);

					if ($result != null) {
						//debugC('this page isnt a quiz--add it to list for future checking');
						array_push($exclude_bookpages, $result);
						continue;
					}

					//if the response data was from a quiz...
					$match = findLikeQD($db0->data[$x][1], $db0->data[$x][2], $db0->data[$x][3], $quiz_data_list);
					if ($match == null) {
						$state = $db0->data[$x][4];
						$newData = new QuizData($db0->data[$x][1], $db0->data[$x][2], $db0->data[$x][3]);
						$newData->responses[$state] = $db0->data[$x][6];
						$newData->correctness[$state] = $db0->data[$x][7];

						array_push($quiz_data_list, $newData);
					}
					else {
						$state = $db0->data[$x][4];
						$match->responses[$state] = $db0->data[$x][6];
						$match->correctness[$state] = $db0->data[$x][7];

						//if the QuizData object has been completed
						if (in_array(null, $match->responses) == false) {
							//calculate the grade
							$index = 0;
							foreach ($match->correctness as $isCorrect) {
								$match->potential = $match->potential + 1;
								if ($isCorrect == 1) {
									$match->grade = $match->grade + 1;
								}
								else {
									$match->responses[$index] = "*" . $match->responses[$index] . "* [Incorrect]";
								}
								$index++;
							}
							//add completed QuizData object to a list of completed QuizDatas
							array_push($completed_quiz_list, $match);
							$quiz_data_list = removeFromArray($quiz_data_list, $match);
						}
					}
				}

				// figure out what page of data within the quiz list that we want
				$cnt = count($completed_quiz_list);
				$results_count = $cnt;
				$minIndex = 0;
				$maxIndex = $cnt;
				if ($results_limit > 0) {
					$minIndex = $results_start;
					$maxIndex = min($results_start + $results_limit, $cnt);
				}
				//now draw out new rows for each QuizData in completed_quiz_list
				for ($x = $minIndex; $x < $maxIndex; $x++) {
					$quizData = $completed_quiz_list[$x];
					$result_arr[] = array(
						"user_name" => $quizData->name,
						"book_id" => $quizData->book_id,
						"page_id" => $quizData->page,
						"A1" => $quizData->responses[0],
						"A2" => $quizData->responses[1],
						"A3" => $quizData->responses[2],
						"A4" => $quizData->responses[3],
						"score" => $quizData->grade,
						"potential" => $quizData->potential,
						"percent" => $quizData->calculatePercent()
					);
				}
			}
		break;
		
		case 9: // Freeform discussion
			$query = "SELECT c.name, a.user_id, b.user_name, a.book_id, a.page_id, a.response, a.response_dt, a.social_id ";
			$query.= "FROM social_response a JOIN user b ON (a.user_id=b.user_id) ";
			$query.= "JOIN social c ON (a.social_id=c.social_id) ";
			$query.= "WHERE a.topic_answer=0 AND a.topic_id=0 AND a.archived=0 ";
			if ($cohort != 'all') {
				$query.= " AND b.cohort_id = '" . $cohort . "'";
			}
			if ($user != 'all') {
				$query.= " AND a.user_id = '" . $user . "'";
			}
			if ($bookclub != 'all') {
				$query.= " AND a.social_id = " . intval($bookclub);
			}
			if ($book != 'all') {
				$query.= " AND a.book_id = '" . $book . "'";
			}
			if ($page != -1) {
				$query.= " AND a.page_id = '" . $page . "'";
			}
			if ($start_dt != '') {
				$query.= " AND a.response_dt >= '" . $start_dt . "'";
			}
			if ($end_dt != '') {
				$query.= " AND a.response_dt <= '" . $end_dt . "'";
			}
			if ($period != '') {
				$query.= " AND b.usergroup = '" . $period . "'";
			}
			if ($sort_by == 'default') {
				$query.= " ORDER BY a.social_id, a.response_dt ASC;";
			}
			else {
				$from_client = array("bookclub", "user_id", "user_name", "book_id", "page_id", "message_text", "message_time");
				$on_server = array("c.name", "a.user_id", "b.user_name", "a.book_id", "a.page_id", "a.response", "a.response_dt");
				$query.= " ORDER BY " . str_replace($from_client, $on_server, $sort_by) . ";";
			}
			
			if ($db0->query($query)) {
				$results_count = $db0->getNumberRows();
				$cnt = ($results_limit > 0) ? min($results_start + $results_limit, $db0->getNumberRows()) : $db0->getNumberRows();
				for ($x = $results_start; $x < $cnt; $x++) {
					$timestamp = new DateTime($db0->data[$x][6], new DateTimeZone("UTC"));
					$timestamp->setTimezone(new DateTimeZone("America/New_York"));
					$result_arr[] = array(
						"bookclub" => $db0->data[$x][0],
						"user_id" => $db0->data[$x][1],
						"user_name" => $db0->data[$x][2],
						"book_id" => $db0->data[$x][3],
						"page_id" => (1 + $db0->data[$x][4]),
						"message_text" => $db0->data[$x][5],
						"message_time" => $timestamp->format("Y-m-d h:i:s A")
					);
				}
			}
		break;
		
		case 10: // Topic discussions
			$query = "SELECT a.book_id, d.question, c.name, a.user_id, b.user_name, a.response, a.response_dt, a.topic_answer, a.page_id, a.social_id ";
			$query.= "FROM social_response a JOIN user b ON (a.user_id=b.user_id) ";
			$query.= "JOIN social c ON (a.social_id=c.social_id) ";
			$query.= "LEFT JOIN social_topic d ON (a.topic_id=d.topic_id AND a.book_id=d.book_id) ";
			$query.= "WHERE a.archived=0 ";
			if ($cohort != 'all') {
				$query.= " AND b.cohort_id = '" . $cohort . "'";
			}
			if ($user != 'all') {
				$query.= " AND a.user_id = '" . $user . "'";
			}
			if ($bookclub != 'all') {
				$query.= " AND a.social_id = " . intval($bookclub);
			}
			if ($book != 'all') {
				$query.= " AND a.book_id = '" . $book . "'";
			}
			if (($topic_id != 'all') && ($topic_id != 'none')) {
				$query.= " AND a.topic_id = " . intval($topic_id);
			}
			else {
				$query.= " AND a.topic_id > 0";
			}
			if ($page != -1) {
				$query.= " AND a.page_id = '" . $page . "'";
			}
			if ($start_dt != '') {
				$query.= " AND a.response_dt >= '" . $start_dt . "'";
			}
			if ($end_dt != '') {
				$query.= " AND a.response_dt <= '" . $end_dt . "'";
			}
			if ($period != '') {
				$query.= " AND b.usergroup = '" . $period . "'";
			}
			if ($sort_by == 'default') {
				$query.= " ORDER BY a.book_id, d.question, a.social_id, a.response_dt ASC;";
			}
			else {
				$from_client = array("book_id", "topic", "bookclub", "user_id", "user_name", "message_text", "message_time", "answer", "page_id");
				$on_server = array("a.book_id", "d.question", "c.name", "a.user_id", "b.user_name", "a.response", "a.response_dt", "a.topic_answer", "a.page_id");
				$query.= " ORDER BY " . str_replace($from_client, $on_server, $sort_by) . ";";
			}
			
			if ($db0->query($query)) {
				$results_count = $db0->getNumberRows();
				$cnt = ($results_limit > 0) ? min($results_start + $results_limit, $db0->getNumberRows()) : $db0->getNumberRows();
				for ($x = $results_start; $x < $cnt; $x++) {
					$timestamp = new DateTime($db0->data[$x][6], new DateTimeZone("UTC"));
					$timestamp->setTimezone(new DateTimeZone("America/New_York"));
					$result_arr[] = array(
						"book_id" => $db0->data[$x][0],
						"topic" => $db0->data[$x][1],
						"bookclub" => $db0->data[$x][2],
						"user_id" => $db0->data[$x][3],
						"user_name" => $db0->data[$x][4],
						"message_text" => $db0->data[$x][5],
						"message_time" => $timestamp->format("Y-m-d h:i:s A"),
						"answer" => (($db0->data[$x][7] == 0) ? 'No' : 'Yes'),
						"page_id" => (1 + $db0->data[$x][8])
					);
				}
			}
		break;
		
		case 11: // Topic discussion answers
			$query = "SELECT a.book_id, t.question, s.name, a.user_id, b.user_name, a.response, a.response_dt, a.social_id ";
			$query.= "FROM (";
			$query.= "    SELECT user_id, topic_id, book_id, max(response_dt) as max_date ";
			$query.= "    FROM social_response ";
			$query.= "    WHERE topic_answer=1 AND archived=0 ";
			if ($user != 'all') {
				$query.= " AND user_id = '" . $user . "'";
			}
			if ($bookclub != 'all') {
				$query.= " AND social_id = " . intval($bookclub);
			}
			if ($book != 'all') {
				$query.= " AND book_id = '" . $book . "'";
			}
			if (($topic_id != 'all') && ($topic_id != 'none')) {
				$query.= " AND topic_id = " . intval($topic_id);
			}
			else {
				$query.= " AND topic_id > 0";
			}
			if ($page != -1) {
				$query.= " AND page_id = '" . $page . "'";
			}
			if ($start_dt != '') {
				$query.= " AND response_dt >= '" . $start_dt . "'";
			}
			if ($end_dt != '') {
				$query.= " AND response_dt <= '" . $end_dt . "'";
			}
			$query.= "    GROUP BY user_id, topic_id, book_id";
			$query.= ") AS c INNER JOIN social_response a ON (a.response_dt=c.max_date AND a.user_id=c.user_id AND a.topic_id=c.topic_id AND a.book_id=c.book_id) ";
			$query.= "JOIN user b ON (a.user_id=b.user_id) ";
			$query.= "JOIN social s ON (a.social_id=s.social_id) ";
			$query.= "LEFT JOIN social_topic t ON (a.topic_id=t.topic_id AND a.book_id=t.book_id) ";
			if (($cohort != 'all') || ($period != '')) {
				$query.="WHERE ";
				$needAnd = false;
				if ($cohort != 'all') {
					$query.= "b.cohort_id = '" . $cohort . "' ";
					$needAnd;
				}
				if ($period != '') {
					$query.= (($needAnd) ? "AND " : "") + "b.usergroup = '" . $period . "' ";
				}
			}
			if ($sort_by == 'default') {
				$query.= " ORDER BY a.book_id, t.question, a.social_id ASC, a.response_dt DESC;";
			}
			else {
				$from_client = array("book_id", "topic", "bookclub", "user_id", "user_name", "message_text", "message_time");
				$on_server = array("a.book_id", "t.question", "s.name", "a.user_id", "b.user_name", "a.response", "a.response_dt");
				$query.= " ORDER BY " . str_replace($from_client, $on_server, $sort_by) . ";";
			}
			
			if ($db0->query($query)) {
				$results_count = $db0->getNumberRows();
				$cnt = ($results_limit > 0) ? min($results_start + $results_limit, $db0->getNumberRows()) : $db0->getNumberRows();
				for ($x = $results_start; $x < $cnt; $x++) {
					$timestamp = new DateTime($db0->data[$x][6], new DateTimeZone("UTC"));
					$timestamp->setTimezone(new DateTimeZone("America/New_York"));
					$result_arr[] = array(
						"book_id" => $db0->data[$x][0],
						"topic" => $db0->data[$x][1],
						"bookclub" => $db0->data[$x][2],
						"user_id" => $db0->data[$x][3],
						"user_name" => $db0->data[$x][4],
						"message_text" => $db0->data[$x][5],
						"message_time" => $timestamp->format("Y-m-d h:i:s A")
					);
				}
			}
		break;
		
		case 12: // archived discussion
			$query = "SELECT a.book_id, t.question, s.name, a.user_id, b.user_name, a.response, a.response_dt, a.topic_answer, a.page_id, a.social_id ";
			$query.= "FROM social_response a JOIN user b ON (a.user_id=b.user_id) ";
			$query.= "JOIN social s ON (a.social_id=s.social_id) ";
			$query.= "LEFT JOIN social_topic t ON (a.topic_id=t.topic_id AND a.book_id=t.book_id) ";
			$query.= "WHERE a.archived=1 ";
			if ($cohort != 'all') {
				$query.= " AND b.cohort_id = '" . $cohort . "'";
			}
			if ($user != 'all') {
				$query.= " AND a.user_id = '" . $user . "'";
			}
			if ($bookclub != 'all') {
				$query.= " AND a.social_id = " . intval($bookclub);
			}
			if ($book != 'all') {
				$query.= " AND a.book_id = '" . $book . "'";
			}
			if ($topic_id == 'all') {
				$query.= " AND a.topic_id > 0";
			}
			else if ($topic_id == 'none') {
				$query.= " AND a.topic_id = 0";
			}
			else {
				$query.= " AND a.topic_id = " . intval($topic_id);
			}
			if ($page != -1) {
				$query.= " AND a.page_id = '" . $page . "'";
			}
			if ($start_dt != '') {
				$query.= " AND a.response_dt >= '" . $start_dt . "'";
			}
			if ($end_dt != '') {
				$query.= " AND a.response_dt <= '" . $end_dt . "'";
			}
			if ($period != '') {
				$query.= " AND b.usergroup = '" . $period . "'";
			}
			if ($sort_by == 'default') {
				$query.= " ORDER BY a.book_id, t.question, a.social_id, a.response_dt ASC;";
			}
			else {
				$from_client = array("book_id", "topic", "bookclub", "user_id", "user_name", "message_text", "message_time", "answer", "page_id");
				$on_server = array("a.book_id", "t.question", "s.name", "a.user_id", "b.user_name", "a.response", "a.response_dt", "a.topic_answer", "a.page_id");
				$query.= " ORDER BY " . str_replace($from_client, $on_server, $sort_by) . ";";
			}
			
			if ($db0->query($query)) {
				$results_count = $db0->getNumberRows();
				$cnt = ($results_limit > 0) ? min($results_start + $results_limit, $db0->getNumberRows()) : $db0->getNumberRows();
				for ($x = $results_start; $x < $cnt; $x++) {
					$timestamp = new DateTime($db0->data[$x][6], new DateTimeZone("UTC"));
					$timestamp->setTimezone(new DateTimeZone("America/New_York"));
					$result_arr[] = array(
						"book_id" => $db0->data[$x][0],
						"topic" => $db0->data[$x][1],
						"bookclub" => $db0->data[$x][2],
						"user_id" => $db0->data[$x][3],
						"user_name" => $db0->data[$x][4],
						"message_text" => $db0->data[$x][5],
						"message_time" => $timestamp->format("Y-m-d h:i:s A"),
						"answer" => (($db0->data[$x][7] == 0) ? 'No' : 'Yes'),
						"page_id" => (1 + $db0->data[$x][8])
					);
				}
			}
		break;
	}
	$db0->closeDbConnection();
	echo json_encode((object) array("Result" => "OK", "Records" => $result_arr, "TotalRecordCount" => $results_count));
	break;

    default: // nothing to do
	break;
}

function rglob($pattern = '*', $flags = 0, $path = '') {

    $paths = glob($path . '*', GLOB_MARK | GLOB_ONLYDIR | GLOB_NOSORT);
    $files = glob($path . $pattern, $flags);
    foreach ($paths as $path) {
	$files = array_merge($files, rglob($pattern, $flags, $path));
    }
    return $files;
}

// get development environments
function getDevelopEnv() {
    global $DB;
    $developEnv_arr = array();

    chdir($_SERVER['DOCUMENT_ROOT']);

    $tmpArray = rglob("data/books");

    foreach ($tmpArray as $tmpDir) {
	array_push($developEnv_arr, "/" . substr($tmpDir, 0, (strlen($tmpDir) - 11)));
    }

    /* $path = $_SERVER['DOCUMENT_ROOT'];
      $objects = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path), RecursiveIteratorIterator::SELF_FIRST);
      foreach($objects as $name => $object){
      if (substr($name, strrpos($name, "/") + 1) == "data") {
      array_push($developEnv_arr, substr($name, strlen($path)+1, (strlen($name)-strlen($path)-6)));

      }
      } */
    return $developEnv_arr;
}

// get books from environments
function getBooks($folder) {
    global $DB;
    $folder = (isset($_GET["imb_folder"])) ? $_GET["imb_folder"] : $_POST["imb_folder"];
    $books_arr = array();

    //path to directory to environment
    $directory = $_SERVER['DOCUMENT_ROOT'] . "/" . $folder . "/data/books/"; //imapbook/trunk/";// . $folder  . "/data/books/";
    //get all files in dev directory
    $files = glob($directory . "*");
    //save each directory in array
    foreach ($files as $file) {
	//check to see if the file is a folder/directory
	if (is_dir($file)) {
	    array_push($books_arr, substr($file, strripos($file, "/") + 1));
	}
    }
    return $books_arr;
}

function rmdirr($dirname) {
    // Sanity check
    if (!file_exists($dirname)) {
	return false;
    }

    // Simple delete for a file
    if (is_file($dirname) || is_link($dirname)) {
	return unlink($dirname);
    }

    // Loop through the folder
    $dir = dir($dirname);
    while (false !== $entry = $dir->read()) {
	// Skip pointers
	if ($entry == '.' || $entry == '..') {
	    continue;
	}

	// Recurse
	rmdirr($dirname . DIRECTORY_SEPARATOR . $entry);
    }

    // Clean up
    $dir->close();
    return rmdir($dirname);
}

function cpdirr($source, $destination, $isMerge = false) {
    if (is_dir($source)) {
	@mkdir($destination);
	$directory = dir($source);
	while (FALSE !== ( $readdirectory = $directory->read() )) {
	    if ($readdirectory == '.' || $readdirectory == '..') {
		continue;
	    }
	    $PathDir = $source . '/' . $readdirectory;
	    if (is_dir($PathDir)) {
		cpdirr($PathDir, $destination . '/' . $readdirectory, $isMerge);
		continue;
	    }

	    if ($isMerge) {
		if ((strpos($PathDir, "book.xml")) === FALSE) {
		    copy($PathDir, $destination . '/' . $readdirectory);
		    //echo 'not Found --> ' . $PathDir . '<br />';
		} else {

		    //echo 'Found --> ' . $PathDir . '<br />';
		}
	    } else {
		copy($PathDir, $destination . '/' . $readdirectory);
	    }
	}

	$directory->close();
    } else {
	copy($source, $destination);
    }
}

function mergeBook($sourceBook, $destBook) {
    $arrayDefinitions = array();

    $book1 = new DOMDocument();
    $book1->preserveWhiteSpace = false;
    $book1->formatOutput = true;
    $book1->load($sourceBook . '/book.xml');

    $book2 = new DOMDocument();
    $book2->preserveWhiteSpace = false;
    $book2->formatOutput = true;
    $book2->load($destBook . '/book.xml');


    $definitions1Root = $book1->getElementsByTagName("definition");
    $dictionary2Root = $book2->getElementsByTagName("dictionary");

    foreach ($definitions1Root as $definition) {
	$result = $book2->importNode($definition, true);
	$dictionary2Root->item(0)->appendChild($result);
    }

    $page1Root = $book1->getElementsByTagName("page");
    $book2Root = $book2->getElementsByTagName("book");

    foreach ($page1Root as $page) {
	$result = $book2->importNode($page, true);
	$book2Root->item(0)->appendChild($result);
    }

    $book2->save($destBook . '/book.xml');
    cpdirr($sourceBook, $destBook, true);
}

function verifyNumberOfBookclubsInCohort($db0, $cohort_id, $num_bookclubs) {
	// check how many bookclubs are available for the given cohort
	$query = "SELECT count(social_id) FROM social WHERE cohort_id=" . $cohort_id . ";";
	if ($db0->query($query)) {
		$cur_number = $db0->data[0][0];
		while ($cur_number < $num_bookclubs) {
			$cur_number++;
			$query = "INSERT INTO social (cohort_id, name, description, blocked) VALUES (" .
				$cohort_id . "," . "'Book Club " . numberToName($cur_number) . "', 'Social book club chat room', false);";
			$db0->update($query);
		}
	}
}

function numberToName($number) {
	switch ($number) {
		case 1: return "One";
		case 2: return "Two";
		case 3: return "Three";
		case 4: return "Four";
		case 5: return "Five";
		case 6: return "Six";
		case 7: return "Seven";
		case 8: return "Eight";
		case 9: return "Nine";
		case 10: return "Ten";
		case 11: return "Eleven";
		case 12: return "Twelve";
		case 13: return "Thirteen";
		case 14: return "Fourteen";
		case 15: return "Fifteen";
		case 16: return "Sixteen";
		case 17: return "Seventeen";
		case 18: return "Eighteen";
		case 19: return "Nineteen";
		case 20: return "Twenty";
	}
	return "";
}

?>
