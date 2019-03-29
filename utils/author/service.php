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
$action = (isset($_GET["action"])) ? $_GET["action"] : $_POST["action"];

session_start();
if (isset($_SESSION["s_start_dt"])) { // session exists
	$s_start_dt = $_SESSION["s_start_dt"];
	$s_user_id = $_SESSION["s_user_id"];
	$s_type_id = $_SESSION["s_type_id"];
	$s_cohort_id = $_SESSION["s_cohort_id"];
} else { // exit if not trying to login or register
	if (!($action == "login")) {
		echo json_encode((object) array('status' => 'error', 'value' => 'Unauthorized access!'));
		exit;
	}
}

ini_set ('user_agent', $_SERVER['HTTP_USER_AGENT']);

switch ($action) {
	case 'login': // login user
		global $DB;
		$imb_user = (isset($_GET["imb_user"])) ? $_GET["imb_user"] : $_POST["imb_user"];
		$imb_pass = (isset($_GET["imb_pass"])) ? $_GET["imb_pass"] : $_POST["imb_pass"];
		$points_total = 0;
		$points_max = 0;
		$book_arr = array();
		
		$db0 = new MySQLClient($DB);
		// query user data
		$query = "SELECT a.user_id, a.user_name, a.type_id, a.cohort_id, b.library FROM user a, cohort b WHERE a.login = '".addslashes($imb_user)."' AND PASSWORD('".$imb_pass."') = password AND a.cohort_id = b.cohort_id;";
		if ($db0->query($query) && $db0->getNumberRows() == 1) {
			// set temp variables and set server side session variables for future use
			$_SESSION["s_start_dt"] = time();
			$user_id = $db0->data[0][0];
			$_SESSION["s_user_id"] = $user_id;
			$user_name = $db0->data[0][1];
			$_SESSION["s_type_id"] = $db0->data[0][2];
			$cohort_id = $db0->data[0][3];
			$_SESSION["s_cohort_id"] = $cohort_id;
			$library = $db0->data[0][4];
			
			if (!($db0->data[0][2] & 2)) { // 1 = read, 2 = write, 4 = admin bit
				echo json_encode((object) array('status' => 'error', 'value' => 'Invalid authorization: [writer]'));
				exit;
			}
					
			// return required data
			echo json_encode((object) array('status' => 'success', 'user_name' => $user_name, 'library' => $library));
		} else {
			echo json_encode((object) array('status' => 'error', 'value' => 'Invalid credentials. Please try again.'));
		}
		$db0->closeDbConnection();
	break;
	
	case 'directory_read': // does the directory exist?
		$imb_dir = (isset($_GET["imb_dir"])) ? $_GET["imb_dir"] : $_POST["imb_dir"];
		$dir_name = "../../data/books/".$imb_dir;
		if (is_dir($dir_name)) {
			echo json_encode((object) array('status' => 'success')); // directory exists
		} else {
			echo json_encode((object) array('status' => 'error')); // directory does not exist
		}
	break;
	
	case 'directory_copy': // create duplicate
		$imb_dir = (isset($_GET["imb_dir"])) ? $_GET["imb_dir"] : $_POST["imb_dir"];
		$imb_dir_copy = (isset($_GET["imb_dir_copy"])) ? $_GET["imb_dir_copy"] : $_POST["imb_dir_copy"];
		$dir_name = "../../data/books/".$imb_dir;
		$dir_name_copy = "../../data/books/".$imb_dir_copy;
		if (!is_dir($dir_name_copy)) {
			shell_exec("cp -r ".$dir_name." ".$dir_name_copy); // create a copy of imb_dir in imb_dir_copy
			echo json_encode((object) array('status' => 'success'));
		} else {
			echo json_encode((object) array('status' => 'error'));
		}
	break;
	
	case 'directory_create': // create new directory
		$imb_dir = (isset($_GET["imb_dir"])) ? $_GET["imb_dir"] : $_POST["imb_dir"];
		$dir_name = "../../data/books/".$imb_dir;
		if (mkdir($dir_name, 0775)) {	// create a new imb_dir with a blank book.xml
			touch ($dir_name."/book.xml");
			chmod($dir_name."/book.xml", 0775);
			echo json_encode((object) array('status' => 'success'));
		} else {
			echo json_encode((object) array('status' => 'error'));
		}
	break;
	
	case 'list': // get a list of files in a directory
		$imb_dir = (isset($_GET["imb_dir"])) ? $_GET["imb_dir"] : $_POST["imb_dir"];
		$imb_file_type = (isset($_GET["imb_file_type"])) ? $_GET["imb_file_type"] : $_POST["imb_file_type"];
		$file_arr = array();
		
		if (chdir("../../data/books/".$imb_dir)) {
			if ($imb_file_type == "images") { // get images
				$file_arr = glob("{*.bmp,*.gif,*.jpg,*.jpeg,*.png}", GLOB_BRACE);
			} else if ($imb_file_type == "sounds") { // get sounds
				$file_arr = glob("{*.wav,*.mp3}", GLOB_BRACE);
			} else { // get all
				$file_arr = glob("{*.bmp,*.gif,*.jpg,*.jpeg,*.png,*.wav,*.mp3,*.txt}", GLOB_BRACE);
			}
			echo json_encode((object) array('status' => 'success', 'files' => $file_arr));
		} else {
			echo json_encode((object) array('status' => 'error', 'value' => 'File read failed!'));
		}
	break;

	case 'readGameList':
		$directories = scandir("../../data/games/");

		unset($directories[0]);
		unset($directories[1]);
		$directories = array_values($directories);

		echo json_encode((object) array('status' => success, 'value' => implode(",", $directories)));
	break;

	case 'rename':
		$imb_dir = (isset($_GET["imb_dir"])) ? $_GET["imb_dir"] : $_POST["imb_dir"];
		$imb_old_file = (isset($_GET["imb_old_file"])) ? $_GET["imb_old_file"] : $_POST["imb_old_file"];
		$imb_new_file = (isset($_GET["imb_new_file"])) ? $_GET["imb_new_file"] : $_POST["imb_new_file"];
		
		if (rename("../../data/books/".$imb_dir."/".$imb_old_file, "../../data/books/".$imb_dir."/".$imb_new_file)) {
			echo json_encode((object) array('status' => 'success'));
		} else {
			echo json_encode((object) array('status' => 'error', 'value' => 'File rename failed!'));
		}
	break;
	
	case 'delete':
		$imb_dir = (isset($_GET["imb_dir"])) ? $_GET["imb_dir"] : $_POST["imb_dir"];
		$imb_old_file = (isset($_GET["imb_old_file"])) ? $_GET["imb_old_file"] : $_POST["imb_old_file"];

		if (unlink("../../data/books/".$imb_dir."/".$imb_old_file)) {
			echo json_encode((object) array('status' => 'success'));
		} else {
			echo json_encode((object) array('status' => 'error', 'value' => 'File delete failed!'));
		}
	break;
	
	case 'getTopicId':
		$imb_book = (isset($_GET["imb_book"])) ? $_GET["imb_book"] : $_POST["imb_book"];
		$new_id = get_last_topic_id($imb_book);
		if ($new_id > 0) {
			echo json_encode((object) array('status' => 'success', 'value' => $new_id));
		} else {
			echo json_encode((object) array('status' => 'error', 'value' => 'Error accessing database.'));
		}
	break;
	
	case 'upload':
		$imb_dir = (isset($_GET["imb_dir"])) ? $_GET["imb_dir"] : $_POST["imb_dir"];
		$file_dir_name = "../../data/books/".$imb_dir."/".basename($_FILES['uploaded']['name']); 

		if (move_uploaded_file($_FILES['uploaded']['tmp_name'], $file_dir_name)) {
			chmod($file_dir_name, 0775);
			echo json_encode((object) array('status' => 'success'));
		} else {
			echo json_encode((object) array('status' => 'error', 'value' => 'File upload failed!'));
		}
	break;

	case 'game_upload':
		//If the directory does not exist, make it.
		$dir_name = "../../data/games/" . ((isset($_GET["name"])) ? $_GET["name"] : $_POST["name"]);

		if (!file_exists($dir_name)) {
			if (!mkdir($dir_name, 0775)) {
				echo json_encode((object) array('status' => 'error', 'value' => 'Failed to create directory!'));
				break;
			}
		}
		//Otherwise, return an error
		else {
			echo json_encode((object) array('status' => 'error', 'value' => 'Directory already exists!'));
			break;
		}

		//Then, place the zip file in the new directory
		$file_dir_name = $dir_name . "/" . basename($_FILES['uploaded']['name']);

		if (move_uploaded_file($_FILES['uploaded']['tmp_name'], $file_dir_name)) {
			chmod($file_dir_name, 0775);
		}
		//If that fails, return an error
		else {
			echo json_encode((object) array('status' => 'error', 'value' => ('Failed to place file!')));
			break;
		}

		//Do a preliminary check to make sure there are useful files in the folder
		//If not, return an error
		$game_type = ((isset($_GET["imb_game_type"])) ? $_GET["imb_game_type"] : $_POST["imb_game_type"]);
		$zip_file = new ZipArchive;

		$open_result = $zip_file->open($file_dir_name);
		if ($open_result == true) {
			$zip_file->extractTo($dir_name);
			$zip_file->close();
		}
		else {
			echo json_encode((object) array('status' => 'error', 'value' => 'Failed to extract file! Error code: ' . $open_result));
			break;
		}

		$error_flag = false;

		switch ($game_type) {
			case 'Construct 2':
				//Test for validity by checking for c2runtime file
				/*if (!file_exists($dir_name . "/c2runtime.js")) {
					echo json_encode((object) array('status' => 'error', 'value' => 'Required files not found!'));
					$error_flag = true;
					break;
				}*/

				//Make the scripts folder
				if (!mkdir($dir_name . "/scripts")) {
					echo json_encode((object) array('status' => 'error', 'value' => 'Unable to create runtime scripts folder!'));
					$error_flag = true;
					break;
				}

				//Copy the runtime to the new folder
				if (!copy("../../data/resources/construct2/run.js", $dir_name . "/scripts/run.js")) {
					echo json_encode((object) array('status' => 'error', 'value' => 'Failed to copy resources!'));
					$error_flag = true;
					break;
				}

				//Substitute name in file
				$lines = file($dir_name . "/scripts/run.js");
				$result = '';

				foreach($lines as $line) {
				    $result .= str_replace('PH_NAME', ((isset($_GET["name"])) ? $_GET["name"] : $_POST["name"]), $line);
				}

				file_put_contents($dir_name . "/scripts/run.js", $result);

				//Should be good to go at this point
				//echo json_encode((object) array('status' => 'success', 'value' => 'Game processed successfully!'));
				break;

			case 'Storyline':
				//Test for validity by checking for c2runtime file
				/*if (!file_exists($dir_name . "/c2runtime.js")) {
					echo json_encode((object) array('status' => 'error', 'value' => 'Required files not found!'));
					$error_flag = true;
					break;
				}*/

				//Make the scripts folder
				if (!mkdir($dir_name . "/scripts")) {
					echo json_encode((object) array('status' => 'error', 'value' => 'Unable to create runtime scripts folder!'));
					$error_flag = true;
					break;
				}

				//Copy the runtime to the new folder
				if (!copy("../../data/resources/storyline/run.js", $dir_name . "/scripts/run.js")) {
					echo json_encode((object) array('status' => 'error', 'value' => 'Failed to copy resources!'));
					$error_flag = true;
					break;
				}

				//Substitute name in file
				$lines = file($dir_name . "/scripts/run.js");
				$result = '';

				foreach($lines as $line) {
				    $result .= str_replace('PH_NAME', ((isset($_GET["name"])) ? $_GET["name"] : $_POST["name"]), $line);
				}

				file_put_contents($dir_name . "/scripts/run.js", $result);

				//Should be good to go at this point
				//echo json_encode((object) array('status' => 'success', 'value' => 'Game processed successfully!'));
				break;

			
			default:
				echo json_encode((object) array('status' => 'error', 'value' => 'Failed to identify file!'));
				$error_flag = true;
				break;
		}

		//If there was an issue in the type-specific stuff, cut now
		if ($error_flag) {
			break;
		}

		//Delete the zip folder
		//If that fails, don't worry about it - the game is at least there.
		unlink($file_dir_name);

		//Confirm success
		echo json_encode((object) array('status' => 'success', 'value' => 'Game processing succeeded!'));
	break;
	
	case 'lockBook':
		global $DB;
		$imb_book_id = (isset($_GET["imb_book"])) ? $_GET["imb_book"] : $_POST["imb_book"];
		$imb_new_state = ((isset($_GET["state"])) ? $_GET["state"] : $_POST["state"]) == 1;
		$user_id = $s_user_id;
		$result = 'error';
		$value = '';
		
		// first, check whether anyone is currently using the book, and when
		$db0 = new MySQLClient($DB);
		// query user data
		$query = "SELECT a.user_id, b.user_name, a.last_opened, now() AS cur_time " .
			" FROM book_access AS a JOIN user AS b ON (a.user_id=b.user_id) " .
			" WHERE a.book_id = '" . addslashes($imb_book_id) . "';";
		if ($imb_book_id >= 0) {
			if ($db0->query($query)) {
				// the book has an entry already, so check if it's someone else and it's recent enough
				// that we can override it
				if ($db0->data[0][0] != $user_id) {
					$result = 'locked';
					$value = $db0->data[0][1];
					$timeDifference = strtotime($db0->data[0][3]) - strtotime($db0->data[0][2]);
					// use a default time limit of 10 minutes
					if ($timeDifference > 600) {
						$query = "UPDATE book_access SET user_id='" . $user_id . "', last_opened=now() WHERE book_id='" . $imb_book_id . "';";
						$db0->update($query);
						$result = 'success';
					}
				}
				// it was us last time, so we can change it
				else {
					if ($imb_new_state) {
						$query = "UPDATE book_access SET last_opened=now() WHERE book_id='" . $imb_book_id . "';";
					}
					else {
						$query = "UPDATE book_access SET last_opened='2010-01-01' WHERE book_id='" . $imb_book_id . "';";
					}
					$db0->update($query);
					$result = 'success';
				}
			}
			// the book does not exist, so add it
			else if ($db0->getNumberRows() < 1) {
				// only insert details for the book if we want to lock it
				if ($imb_new_state) {
					$query = "INSERT INTO book_access (book_id, user_id, last_opened) VALUES ('" . addslashes($imb_book_id) . "', '" . $user_id . "', now());";
					$db0->update($query);
					$result = 'success';
				}
			}
		}
		
		// return whoever is currently using the book
		echo json_encode((object) array('status' => $result, 'current_user' => $value));
	break;
	
	case 'savebook':
		// get the vars passed via JQuery Ajax call
		$imb_dir = (isset($_GET["imb_dir"])) ? $_GET["imb_dir"] : $_POST["imb_dir"];
		$imb_file = (isset($_GET["imb_file"])) ? $_GET["imb_file"] : $_POST["imb_file"];
		$imb_data = (isset($_GET["imb_data"])) ? $_GET["imb_data"] : $_POST["imb_data"];
		
		// build the server file path including file name
		$file_dir_name = "../../".$imb_dir."/".$imb_file;

		// first backup the old file
		if (!copy($file_dir_name, $file_dir_name.".backup")) {
		    echo json_encode((object) array('status' => 'error', 'value' => 'Copy failed for ['.$file_dir_name.']'));
		} else if (file_put_contents($file_dir_name, $imb_data)) { // now save the new file content
			chmod($file_dir_name, 0775); // make sure the file is writable by apache AND usfuser
			echo json_encode((object) array('status' => 'success', 'value' => 'Data saved successfully to ['.$file_dir_name.']'));
		} else {
			echo json_encode((object) array('status' => 'error', 'value' => 'Data save failed for ['.$file_dir_name.']'));
		}
	break;
	
	case 'saveTopics':
		global $DB;
		$imb_book = (isset($_GET["imb_book"])) ? $_GET["imb_book"] : $_POST["imb_book"];
		$imb_topics = json_decode( (isset($_GET["imb_topic_list"])) ? $_GET["imb_topic_list"] : $_POST["imb_topic_list"] );
		$imb_new_topics = array();

		// get all of the topics in the database
		$db0 = new MySQLClient($DB);
		$query = "SELECT topic_id, name, question FROM social_topic WHERE book_id='" . addslashes($imb_book) . "' ORDER BY topic_id ASC;";
		$results = array();
		if ($db0->query($query)) {
			for ($count = 0; $count < $db0->getNumberRows(); $count++) {
				$results[ $db0->data[$count][0] ] = array('name' => $db0->data[$count][1], 'question' => $db0->data[$count][2]);
			}
		}
		// go through each topic get got and make sure it matches the existing ones
		$test = array();
		foreach ($imb_topics as $topic) {
			$test[] = array($topic->id, $topic->question, $results[ $topic->id ]['question']);
			// if this topic isn't in the database, then it needs to be added
			if (!array_key_exists($topic->id, $results)) {
				$query = "INSERT INTO social_topic (book_id, topic_id, name, question, start_page) "
					. "VALUES (" . intval($imb_book) . ", " . intval($topic->id) . ", '" 
					. addslashes($topic->name) . "', '" . addslashes($topic->question) . "', " . intval($topic->page) . ");";
				$db0->update($query);
			}
			// the topic is in the database, so check if the question is the same
			else if ($topic->question != $results[ $topic->id ]['question']) {
				$new_id = get_last_topic_id($imb_book);
				if ($new_id > 0) {
					// create a new topic and store the ID
					$query = "INSERT INTO social_topic (book_id, topic_id, name, question, start_page) "
						. "VALUES (" . intval($imb_book) . ", " . $new_id . ", '"
						. addslashes($topic->name) . "', '" . addslashes($topic->question) . "', " . intval($topic->page) . ");";
					$db0->update($query);
					// keep references in the archives, but change references to allowed topics
					// NOTE: this does not yet exist in the admin panel, so we're done here
					
					// change the topic in the list
					$topic->id = $new_id;
				}
			}
			// now, store this topic in the new list
			$imb_new_topics[] = $topic;
		}
		
		echo json_encode((object) array('status' => 'success', 'value' => $imb_new_topics, 'test' => $test));
	break;
	
	case 'savebookshelf': // save data to a file with concurrent user support of bookshelf

        /**
         * Created by JetBrains PhpStorm.
         * User: Henry Cutler
         * Date: 3/29/14
         * Time: 11:03 PM
         */

        /************************************************************************************************************************************************/
        /*                                                                                                                                              */
        /*  The Logic - Please note, this implementation is intended for providing multi client updating or creating DIFFERENT covers concurrently:     */
        /*  This will not protect for SAME cover concurrent operations.                                                                                 */
        /*                                                                                                                                              */
        /*  1)  Acquire flock. File based semaphore required as windows PHP does not support semaphore builtin.                                         */
        /*      Any concurrent users now have blocking wait ( using sleep ) read server and client xml data.                                            */
        /*                                                                                                                                              */
        /*  2)  While executing foreach/iterate on server_xml,                                                                                          */
        /*        if client flags modified and book_id match use client                                                                                 */
        /*        if client flags delete and book_id match skip entree otherwise all current covers are merged.                                         */
        /*      The above cases handles: All covers not modified by client AND All covers modified by client of current server book list AND deletes    */
        /*                                                                                                                                              */
        /*  3)  While executing foreach/iterate on client_xml, if client flags new, fix book_id if found in server list then add those entrees.         */
        /*      The above case handles: All covers new by client                                                                                        */
        /*                                                                                                                                              */
        /*  4)  Commit to server ( write default.xml ),  release flock ( file based semaphore ), modified flags will be cleared AFTER successful commit */
        /*      in the ajax calling function TBD. ( best to drop the Book Structure and reload from server default.xml )                                */
        /*                                                                                                                                              */
        /************************************************************************************************************************************************/

		// get the vars passed via JQuery Ajax call
		$imb_dir = (isset($_GET["imb_dir"])) ? $_GET["imb_dir"] : $_POST["imb_dir"];
		$imb_file = (isset($_GET["imb_file"])) ? $_GET["imb_file"] : $_POST["imb_file"];
		$imb_data = (isset($_GET["imb_data"])) ? $_GET["imb_data"] : $_POST["imb_data"];

		// build the server file path including file name
		$file_dir_name = "../../".$imb_dir."/".$imb_file;

        /************************************************************************************************************************************************/
        /*                                              STEP ONE                                                                                        */
        /************************************************************************************************************************************************/

        //Must use flock for semaphore to be cross platform capable, windows php does not support sem_get()
        $fp = fopen("../../flock.lock", "w");

        // while is used so other clients will be blocked until this merge is completed
        while(!flock($fp, LOCK_EX))
        {
            // idle until we can try again
            sleep(1);
        }
            // first backup the old file
            if (!copy($file_dir_name, $file_dir_name.".backup"))
            {
                // if it doesn't exist pass message back for debug
                echo json_encode((object) array('status' => 'error', 'value' => 'Copy failed for ['.$file_dir_name.']'));
            }
            else
            {
                // get the server copy
                if (!($xml_server = simplexml_load_file($file_dir_name)))
                {
                    // if it doesn't exist pass message back for debug
                    echo json_encode((object) array('status' => 'error', 'value' => 'Failed to open ['.$file_dir_name.']'));
                }
                else
                {
                    // take client xml ( String format )  and load for comparison
                    if (!($xml_client = simplexml_load_string($imb_data)))
                    {
                        echo json_encode((object) array('status' => 'error', 'value' => 'Failed to load imbdata '));
                    }
                    else
                    {
                        // Note, php requires /n to be in double quotes to be processed
                        $xml_header = '<?xml version="1.0" encoding="UTF-8"?>'."\n<covers>\n";

                        // build the string manually to write, PHP simplexmlload can't write the CDATA as defined by imapbook
                        $final_data = $xml_header;

                        /************************************************************************************************************************************************/
                        /*                                              STEP TWO                                                                                        */
                        /************************************************************************************************************************************************/

                        for( $loop = 0; $loop < count($xml_server); $loop++ )
                        {
                            // get server book id
                            $book_id = (int)$xml_server->cover[$loop]->attributes()->book_id;

                            // now check client for match
                            $results = scan_xml($xml_client,$book_id);

                            // if match and delete skip entree which effectively removes the cover
                            if(!(( $results[0] == true ) && ( $results[3] == true )))
                            {
                                // client book_id match AND client modified use the index to the client element : OR use current server entree
                                $which = (( $results[0] == true ) && ( $results[1] == true )) ? $xml_client->cover[$results[2]] : $xml_server->cover[$loop];

                                // for each cover ....
                                $final_data .= "\t<cover ";

                                // Iterate on attributes
                                foreach($which->attributes() as $a => $b)
                                {
                                    // fix attributes with &
                                    $str = str_replace('&', '&amp;', $b);

                                    // we don't put modified flag in file
                                    if($a != 'modified')
                                    {
                                        // attribute=value
                                        $final_data .= $a.'="'.$str.'" ';
                                    }
                                }
                                // CDATA string value, wrap in required XML
                                $final_data .= '><![CDATA['.$which."]]></cover>\n";
                            }
                        }

                        /************************************************************************************************************************************************/
                        /*                                              STEP THREE                                                                                      */
                        /************************************************************************************************************************************************/

                        // scan server list for last book_id - used to verify new client book_ids
                        $server_last_book_id = get_last_book_id($xml_server);

                        for( $loop = 0; $loop < count($xml_client); $loop++ )
                        {
                            // just used to keep code easy to read
                            $client = $xml_client->cover[$loop]->attributes();

                            // if its a new book
                            if((string)$client->modified == 'new')
                            {
                                // make sure the book_id has not been used
                                if((int)$client->book_id <= $server_last_book_id )
                                {
                                    // if it has , give book new book_id that is above known last server used book_id.
                                    $client->book_id = $server_last_book_id + 1;
                                    // since we just used one, increment the last server_id
                                    $server_last_book_id += 1;
                                }

                                // for each cover ....
                                $final_data .= "\t<cover ";

                                // Iterate on attributes of client that is new modified entree
                                foreach($xml_client->cover[$loop]->attributes() as $a => $b)
                                {
                                    // fix attributes with &
                                    $str = str_replace('&', '&amp;', $b);

                                    // we don't put modified flag in file
                                    if($a != 'modified')
                                    {
                                        // attribute=value
                                        $final_data .= $a.'="'.$str.'" ';
                                    }
                                }
                                // CDATA string value, wrap in required XML
                                $final_data .= '><![CDATA['.$xml_client->cover[$loop]."]]></cover>\n";
                            }
                        }
                       // close out XML build
                        $final_data .= "</covers>\n";

                        /************************************************************************************************************************************************/
                        /*                                              STEP FOUR                                                                                       */
                        /************************************************************************************************************************************************/

                        // Don't write out bad xml data. Validate it with read/parseud
                        if( $xmlvalidate = simplexml_load_string($final_data))
                        {
                            if (!file_put_contents($file_dir_name,$final_data))
                            {
                                echo json_encode((object) array('status' => 'error', 'value' => 'Data save failed for ['.$file_dir_name.']'));
                            }
                            else
                            {
                                // now save the new file content
                                chmod($file_dir_name, 0775); // make sure the file is writable by apache AND usfuser
                                echo json_encode((object) array('status' => 'success', 'value' => 'Data saved successfully to ['.$file_dir_name.']'));
                            }
                        }
                        else
                        {
                            echo json_encode((object) array('status' => 'error', 'value' => 'Services.php merged failed final parse, Data save failed for ['.$file_dir_name.']'));
                        }
                    }
                }
            }

        //Release the semaphore
        flock($fp, LOCK_UN);
        break; // of save

	default: // nothing to do
	break;   // case
}
exit;

function scan_xml($xml_object,$book_id)
{
    /* This function is used to scan an simplexml object for matching book id's and return                  */
    /* status for: a match , if it was tagged modified or delete by the client and the index of the match   */

    // flags to return
    $match = false;
    $modified = false;
    $element = -1;
    $delete = false;

    // iterate on xml_object
    for( $loop = 0; $loop < count($xml_object); $loop++ )
    {
        // this will iterate the xml structure and check to see if a matching book_id is found and if match if its modified
        foreach($xml_object->cover[$loop]->attributes() as $a => $b)
        {
            // first check match
            if(!$match)
            {
                // One shot so we can then check for modified which is 10 attributes later
                $match = (( $a == 'book_id') && ( $b == $book_id )) ? true : false;
            }
            else
            {
                // iteration continues, when it checks the modified IF match is set for this cover
                $modified = ( $match && ( $a == 'modified') && ( (string)$b == 'true' )) ? true : false;

                // iteration continues, when it checks the modified IF match is set for this cover
                $delete = ( $match && ( $a == 'modified') && ( (string)$b == 'delete' )) ? true : false;
            }

            // and point to which element
            $element = $loop;
        }

        // exit if match found and return match, modified, index and new status
        if( $match == true ) return array( true , $modified, $element , $delete);
    }

    // mo match, return status
    return array( false , false, -1, false );
}

    function get_last_book_id($xml_object)
    {
        /* This function is used to scan an simplexml object for book id's and return the largest found */

        // flags to return
        $largest = -1;

        // iterate on xml_object
        for( $loop = 0; $loop < count($xml_object); $loop++ )
        {
            // this will iterate the xml structure and check to see if a matching book_id is found and if match if its modified
            foreach($xml_object->cover[$loop]->attributes() as $a => $b)
            {
                // get the largest book_id of the entire object
                $largest = (( $a == 'book_id') && ((int) $b > $largest )) ? (int) $b : $largest;
            }
        }

        // send back the largest book_id found
        return ($largest);
    }
	
	function get_last_topic_id($book_id) {
		global $DB;
		$db0 = new MySQLClient($DB);
		
		$new_id = 0;
		$query = "SELECT MAX(topic_id) AS last_id FROM social_topic WHERE book_id=" . intval($book_id) . ";";
		if ($db0->query($query)) {
			if ($db0->getNumberRows() > 0) {
				$new_id = $db0->data[0][0];
			}
			$new_id += 1;
		}
		else {
			$new_id = -1;
		}
		$db0->closeDbConnection();
		return $new_id;
	}
?>