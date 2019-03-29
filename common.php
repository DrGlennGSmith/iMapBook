<?php
/* iMapBook Application (IMB)
 * iMapBook LLC
 * All Rights Reserved
 * 04/08/2014
 * 
 * Version 2.5
 */
require_once "constants.php";

//for debugging to browser console
function debugC( $data ) {

    if ( is_array( $data ) )
        $output = "<script>console.log( 'Debug Objects: " . implode( ',', $data) . "' );</script>";
    else
        $output = "<script>console.log( 'Debug Objects: " . $data . "' );</script>";

    echo $output;
}

//class for querying MySQL
class MySQLClient {
    private $host;
    private $db;
    private $dbuser;
    private $dbpassword;
    private $dbport;
    private $numberrows;
    private $numbercolumns;
    private $result;
    private $dbopenstatus;
    private $dbconnection;
    public $data;
    public $meta;
    public $prepstmt;
    
    function __construct($n) {
        global $DBC;

        $this->host = $DBC[$n]['host'];
        $this->db = $DBC[$n]['db'];
        $this->dbuser = $DBC[$n]['dbuser'];
        $this->dbpassword = $DBC[$n]['dbpassword'];
        $this->dbport = $DBC[$n]['dbport'];
        $this->dbopenstatus=0;
        $this->numberrows=0;
        $this->numbercolumns=0;
    }
    
    public function getNumberRows() {return $this->numberrows;}
    public function getNumberColumns() {return $this->numbercolumns;}
            
    private function openDbConnection() {
        $this->dbconnection = mysqli_connect($this->host, $this->dbuser, $this->dbpassword, $this->db, $this->dbport);
        
        if ($this->dbconnection) {
            if (!mysqli_select_db($this->dbconnection,$this->db)) {
                print("<script  type=text/javascript>");
                print("window.alert(\"ERROR: Unable to select DB [".mysqli_error($this->dbconnection)."]\");");
                print("</script>");
                return 0;
            }
            $this->dbopenstatus=1;
            return 1;
        } else {
            print("<script  type=text/javascript>");
            print("window.alert(\"ERROR: Unable to connect to DB [".mysqli_error($this->dbconnection)."]\");");
            print("</script>");
            return 0;
        }
    }
            
    public function closeDbConnection() {
        if ($this->dbopenstatus) {
            mysqli_close($this->dbconnection);
            $this->dbopenstatus=0;
        }
    }
    
    public function query($sql,$resultType='row') {
        // ResultType allows for row, associative array and object returns
        // 
        // ResultType options:
        //      row     : produces an array of arrays. Access a field in a row would be something like $this->data[1][3]
        //      assoc   : produces an array of associative arrays. Access a field in a row would be something like $this->data[1]['name']
        //      obj     : produces an array of objects. Access a field in a row would be something like $this->data[1]->name
        
        $old_track = ini_set('track_errors', '1');
        if ($this->dbopenstatus == 0) $this->openDbConnection();
 		
        $this->result = mysqli_query($this->dbconnection,$sql);

        if (!$this->result) {
            print("<script  type=text/javascript>");
            print("window.alert(\"ERROR: Unable to query DB [".mysqli_error($this->dbconnection)."]\");");
            print("</script>");
            return 0;
        }
        
        $this->numberrows = @mysqli_num_rows($this->result);
        $this->numbercolumns = @mysqli_num_fields($this->result);
        
        // Clear out the array and make it ready for new data
        unset ($this->data);
        $this->data = array();

        for($x = 0; $x < $this->numberrows; $x++) {
            switch(trim(strtolower($resultType))) {
                case "obj":
                    // $this->data[$x] = clone $this->result->fetch_obj();
                    $this->data[$x] = clone mysqli_fetch_object($this->result);
                    break;
                case "assoc":
                    // $this->data[$x] = clone $this->result->fetch_assoc();
                    $this->data[$x] = clone mysqli_fetch_assoc($this->result);
                    break;
                default:
                    // The "row" is the default so anything that is not an other case is the default "row" case
                    $this->data[$x] = mysqli_fetch_row($this->result);
                    break;
            }
        }
		
        @mysqli_free_result($this->result);
        ini_set('track_errors', $old_track);
        return $this->numberrows;
    }

    public function query_meta($sql) {
        if ($this->dbopenstatus == 0) $this->openDbConnection();

        $this->result = mysqli_query($this->dbconnection,$sql);
        if (!$this->result) {
            print("<script  type=text/javascript>");
            print("window.alert(\"ERROR: Unable to meta query DB [".mysqli_error($this->dbconnection)."]\");");
            print("</script>");
            return 0;
        }

        $this->numbercolumns = mysqli_num_fields($this->result);
        for ($i = 0; $i < $this->numbercolumns; $i++) {
            $meta = mysqli_fetch_field($this->result);
            if (!$meta) {
                print("<script  type=text/javascript>");
                print("window.alert(\"ERROR: No meta data available [".mysqli_error($this->dbconnection)."]\");");
                print("</script>");
                return 0;
            }
            $this->meta[$i][0] = $meta->name;
            $this->meta[$i][1] = $meta->type;
            $this->meta[$i][2] = $meta->flags & MYSQLI_NOT_NULL_FLAG;
            $this->meta[$i][3] = $meta->flags & MYSQLI_PRI_KEY_FLAG;
            $this->meta[$i][4] = $meta->def;
            $this->meta[$i][5] = $meta->max_length;
        }		
        mysqli_free_result($this->result);
        return $this->numbercolumns;
    }
    
    public function update($sql) {
        if ($this->dbopenstatus == 0) $this->openDbConnection();

        $this->result = mysqli_query($this->dbconnection,$sql);

        if (!$this->result) {
            print("<script  type=text/javascript>");
            print("window.alert(\"ERROR: Unable to update DB [".mysqli_error($this->dbconnection)."]\");");
            print("</script>");
            return 0;
        }

        return 1;
    }  

    public function prepare($sql) {
        if ($this->dbopenstatus == 0) $this->openDbConnection();

        $this->prepstmt = mysqli_stmt_init($this->dbconnection);
        $this->prepstmt = mysqli_prepare($this->dbconnection,$sql);
        return $this->prepstmt;
    }
	
    public function escape_string ($unescaped_string) {
        if ($this->dbopenstatus == 0) $this->openDbConnection();

        return $this->dbconnection->real_escape_string($unescaped_string);		
    }

    public function query_prepared_experimental($sql,$params="") {
        if ($this->dbopenstatus == 0) $this->openDbConnection();

        if($params == "") {
            $this->result = mysqli_query($this->dbconnection,$sql);
	
            if (!$this->result) {
                print("<script  type=text/javascript>");
                print("window.alert(\"ERROR: Unable to query DB [".mysqli_error($this->dbconnection)."]\");");
                print("</script>");
                return 0;
            }
        
            $this->numberrows = mysqli_num_rows($this->result);
            $this->numbercolumns = mysqli_num_fields($this->result);
		
            for($x = 0; $x < $this->numberrows; $x++) {
                $this->data[$x] = mysqli_fetch_row($this->result);
            }
		
            mysqli_free_result($this->result);
        } else {
            $this->prepstmt = mysqli_stmt_init($this->dbconnection);
            $this->prepstmt = mysqli_prepare($this->dbconnection,$sql);

            if (!call_user_func_array(array(&$this->prepstmt, 'bind_param'), $params)) {
                print("<script  type=text/javascript>");
                print("window.alert(\"ERROR: Bind parameters failed [".mysqli_stmt_error($this->prepstmt)."]\");");
                print("</script>");
                return 0;
            }
			
            mysqli_stmt_execute($this->prepstmt);
            mysqli_stmt_store_result($this->prepstmt);
            $this->numberrows = mysqli_stmt_num_rows($this->prepstmt);
	
            $meta = mysqli_stmt_result_metadata($this->prepstmt);
            $this->numbercolumns = mysqli_num_fields($meta);
			
            $results=array();
            while ($column = $meta->fetch_field()) {
                $bindVarsArray[] = &$results[$column->name];
            }       
			
            if(!call_user_func_array(array(&$this->prepstmt, 'bind_result'), $bindVarsArray)) {
                print("<script  type=text/javascript>");
                print("window.alert(\"ERROR: Bind result failed [".mysqli_error($this->dbconnection)."]\");");
                print("</script>");
                return 0;
            }
			
            $this->data = array();
            $x = 0;
            while ($this->prepstmt->fetch()) {
                for($i=0;$i < $this->numbercolumns;$i++) {
                    $this->data[$x][$i]=$bindVarsArray[$i];
                }
                $x++;
            }
            if($this->numberrows < $x-1) {
                $this->numberrows = $x-1;
            }
            mysqli_stmt_free_result($this->prepstmt);			
            mysqli_stmt_close($this->prepstmt);
        }	


        return $this->numberrows;
    }	
		
    public function query_prepared($sql,$params) {
        if ($this->dbopenstatus == 0) $this->openDbConnection();

        $this->prepstmt = mysqli_stmt_init($this->dbconnection);
        mysqli_prepare($this->prepstmt,$sql);

        // Reverse the array, add to the end and reverse it back so it's in the front
        $params = array_reverse($params);
        $params[] = &$this->prepstmt; // Pass this by reference so it's updated in the class
        $params = array_reverse($params); 

        call_user_func_array('mysqli_stmt_bind_param', $params); 

        mysqli_stmt_execute($this->prepstmt);

        mysqli_stmt_store_result($this->prepstmt);

        $meta = mysqli_stmt_result_metadata($this->prepstmt);

        if (!$meta) {
            print("<script  type=text/javascript>");
            print("window.alert(\"ERROR: Unable to query DB [".mysqli_error($this->dbconnection)."]\");");
            print("</script>");
            return 0;
        }
        
        $this->numberrows = mysqli_num_rows($meta);
        $this->numbercolumns = mysqli_num_fields($meta);
		
        # The metadata of all fields
        $fieldMeta = mysqli_fetch_fields($meta);
		
        # convert it to a normal array just containing the field names
        $fields = array();
        for($i=0; $i < $this->numbercolumns; $i++)
            $fields[$i] = $fieldMeta[$i]->name;
		
        # The idea is to get an array with the result values just as in mysql_fetch_assoc();
        # But we have to use call_user_func_array to pass the right number of args ($nof+1)
        # So we create an array:
        # array( $stmt, &$result[0], &$result[1], ... )
        # So we get the right values in $result in the end!

        # Prepare $result and $arg (which will be passed to bind_result)

        $result = array();
        $arg = array($this->prepstmt);
        for ($i=0; $i < $this->numbercolumns; $i++) {
            $result[$i] = '';
            $arg[$i+1] = &$result[$i];
        }
		
        call_user_func_array('mysqli_stmt_bind_result',$arg);

        $x = 0;
        while (mysqli_stmt_fetch($this->prepstmt)) {
            $this->data[$x] = $result;
            $x++;
    	}
						
        mysqli_stmt_close($this->prepstmt);
        return $this->numberrows;
    }
}
?>