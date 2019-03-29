<?php
/* iMapBook Application (IMB)
 * iMapBook LLC
 * All Rights Reserved
 * 04/08/2014
 * 
 * Version 2.5
 *
 */

// PRODUCTION DATABASE	
$DBC[0]['host']                 =       "localhost";
$DBC[0]['db']                   =       "imb";
$DBC[0]['dbuser']               =       "user";
$DBC[0]['dbpassword']           =       "password";
$DBC[0]['dbport']               =       3306;
// TEST/DEVELOPMENT DATABASE
$DBC[1]['host']                 =       "localhost";
$DBC[1]['db']                   =       "imb_test";
$DBC[1]['dbuser']               =       "user";
$DBC[1]['dbpassword']           =       "password";
$DBC[1]['dbport']               =       3306;
// DEMO DATABASE
$DBC[2]['host']                 =       "localhost";
$DBC[2]['db']                   =       "imb_demo";
$DBC[2]['dbuser']               =       "user";
$DBC[2]['dbpassword']           =       "password";
$DBC[2]['dbport']               =       3306;

$DB = 1;

// WEBSITE DATABASE	
$DBC[3]['host']                 =       "localhost";
$DBC[3]['db']                   =       "imapbook_evs";
$DBC[3]['dbuser']               =       "user";
$DBC[3]['dbpassword']           =       "password";
$DBC[3]['dbport']               =       3306;

$GDB = 3;

// controls VPF service calls: 0 = off, 1 = on
$VPF = 0;
?>
