/* iMapBook Admin Tool - data structure
 * iMapBook LLC
 * All Rights Reserved
 * 04/08/2014
 * 
 * Version 2.5
 */

var type_list = new Array({1: "Reader"}, {2: "Writer"}, {4: "Administrator"}, {8: "Auditor"}); // possible access levels
var user_type_id = 0;
var user_cohort_id = 0;
var user_social_id = 0;
var cohort_list = new Array(); // cohort_list is an array of cohort objects
var audit_table = new Array(); // audit_table is a link between users and auditors
var chat_book_topic = { cohort_id:-1, books: {} }; // hashmap for books and topics in the chat

var pathnameURL = window.location.pathname;
var splitURL = pathnameURL.split("/");
splitURL.pop();
var tmpVar = splitURL.pop();

if ((tmpVar == "http:") || (tmpVar == "")) {
    var productionEnvPath = "/";
    var developmentEnvPath = "/dev";
    var testEnvPath = "/test";
} else {
    splitURL.pop();
    var productionEnvPath = splitURL.join("/") + "/prod";
    var developmentEnvPath = splitURL.join("/") + "/dev";
    var testEnvPath = splitURL.join("/") + "/test";
}

function Cohort(id, cohortName, cohortCode, cohortLibrary, cohortRoom, cohortBookcase, cohortBookshelves, cohortBookclubs, cohortSocialProfile) {
    this.cohort_id = id; // cohort identifier - unique
    this.name = cohortName; // cohort name
    this.code = cohortCode; // registration code
    this.library = cohortLibrary; // library files / default bookshelf
    this.room = cohortRoom; // virtual collections room
    this.bookcase = cohortBookcase; // virtual collections bookcase
    this.bookshelves = cohortBookshelves; // max number of bookshelves
    this.bookclubs = (cohortBookclubs !== undefined) ? cohortBookclubs : 3; // max number of bookclubs
    this.social_profile = (cohortSocialProfile !== undefined) ? cohortSocialProfile : 0; // social profile (how can users talk)
	this.user_list = new Array(); // user_list is an array of user objects containing a list of all users available from the database
	this.social_list = new Array(); // an array of social objects; a list of all the social groups for this cohort
}
function User(id, type, cohort, bookshelf, bookclub, user, userLogin, userPass, userAvatar, userCreate, userUpdate, userGroup) {
    this.user_id = id; // user identifier - unique 
    this.type_id = type; // user type
    this.cohort_id = cohort; //user cohort
    this.bookshelf = bookshelf; // currently selected bookshelf
    this.bookclub = bookclub; // currently selected bookclub
    this.user_name = user; //users name
    this.login = userLogin; // users login for system
    this.password = userPass; //users password for system
    this.avatar = (typeof userAvatar != 'undefined') ? userAvatar: '';  // users avatar for system
    this.created_dt = (typeof userCreate != 'undefined') ? userCreate : ''; // when user was first created
    this.updated_dt = (typeof userUpdate != 'undefined') ? userUpdate : ''; // when they were added to a group
    this.group = (typeof userGroup != 'undefined') ? userGroup: 0;  // user group assignment
}
function Social(id, socialName, socialDesc, blocked) {
    this.social_id = id; // social group / book club identifier - unique
    this.name = socialName; // social grouop name
    this.desc = socialDesc; // social group description
	this.blocked = blocked; // whether the chat is blocked
}
function DiscussionTopic (id, name, question, page_start) {
	this.id = id;
	this.name = name;
	this.question = question;
	this.page = ~~(page_start);
}