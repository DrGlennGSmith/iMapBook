DROP TABLE IF EXISTS user_type;
CREATE TABLE user_type (
type_id INTEGER NOT NULL,
label VARCHAR(64),
PRIMARY KEY (type_id)
);
INSERT INTO user_type VALUES(1, 'Reader');
INSERT INTO user_type VALUES(2, 'Writer');
INSERT INTO user_type VALUES(4, 'Administrator');
INSERT INTO user_type VALUES(8, 'Auditor');

DROP TABLE IF EXISTS cohort;
CREATE TABLE cohort (
cohort_id INTEGER NOT NULL AUTO_INCREMENT,
name VARCHAR(128) NOT NULL,
code VARCHAR(16),
library VARCHAR(64),
room INTEGER DEFAULT 0,
bookcase INTEGER DEFAULT 0,
bookshelves INTEGER DEFAULT 0,
bookclubs INTEGER DEFAULT 0,
social_profile INTEGER NOT NULL DEFAULT 0,
PRIMARY KEY (cohort_id)
);
INSERT INTO cohort VALUES(NULL, 'Default Cohort', 'IMB', 'default.xml', 0, 0, 0, 3, 1);

DROP TABLE IF EXISTS user;
CREATE TABLE user (
user_id INTEGER NOT NULL AUTO_INCREMENT,
type_id INTEGER NOT NULL,
cohort_id INTEGER NOT NULL,
bookshelf INTEGER DEFAULT 0,
bookclub INTEGER DEFAULT 0,
user_name VARCHAR(128) NOT NULL,
login VARCHAR(64),
password VARCHAR(64),
avatar VARCHAR(256),
created_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
usergroup VARCHAR(128) DEFAULT '',
blocked TINYINT UNSIGNED NOT NULL DEFAULT 0;
PRIMARY KEY (user_id)
);
INSERT INTO user VALUES(NULL, 7, 1, 0, 0, 'Tester', 'test', PASSWORD('password'), 'data/icons/i5.png', now(), 'period 1');

DROP TABLE IF EXISTS user_audit;
CREATE TABLE user_audit (
user_id INTEGER NOT NULL,
auditor_id INTEGER NOT NULL,
PRIMARY KEY (user_id)
);

DROP TABLE IF EXISTS user_response;
CREATE TABLE user_response (
user_id INTEGER NOT NULL,
book_id INTEGER NOT NULL,
page_id INTEGER NOT NULL,
state_id INTEGER NOT NULL,
session_start_dt DATETIME NOT NULL,
response VARCHAR(256),
response_type_id INTEGER,
response_weight INTEGER,
response_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS social;
CREATE TABLE social (
social_id INTEGER NOT NULL AUTO_INCREMENT,
cohort_id INTEGER NOT NULL,
name VARCHAR(256),
description VARCHAR(256),
blocked tinyint(1) NOT NULL,
PRIMARY KEY (social_id)
);
INSERT INTO social VALUES(NULL, 1, 'Book Club One', 'Generic social book club chat room.', FALSE);
INSERT INTO social VALUES(NULL, 1, 'Book Club Two', 'Generic social book club chat room.', FALSE);
INSERT INTO social VALUES(NULL, 1, 'Book Club Three', 'Generic social book club chat room.', FALSE);

DROP TABLE IF EXISTS social_response;
CREATE TABLE social_response (
message_id INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
social_profile INTEGER NOT NULL,
social_id INTEGER NOT NULL,
topic_id INTEGER NOT NULL,
user_id INTEGER NOT NULL,
book_id INTEGER NOT NULL,
page_id INTEGER NOT NULL,
state_id INTEGER NOT NULL,
blocked TINYINT UNSIGNED NOT NULL DEFAULT 0,
archived TINYINT UNSIGNED NOT NULL DEFAULT 0,
topic_answer TINYINT UNSIGNED NOT NULL DEFAULT 0,
response VARCHAR(512),
response_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (message_id)
);

DROP TABLE IF EXISTS social_response_read;
CREATE TABLE social_response_read (
user_id INTEGER UNSIGNED NOT NULL,
message_id INTEGER UNSIGNED NOT NULL,
status TINYINT UNSIGNED NOT NULL DEFAULT 0
);

DROP TABLE IF EXISTS social_topic;
CREATE TABLE IF NOT EXISTS social_topic (
	book_id INTEGER UNSIGNED NOT NULL,
	topic_id INTEGER UNSIGNED NOT NULL,
	name VARCHAR(100) NOT NULL,
	question VARCHAR(500) NOT NULL,
	start_page INT UNSIGNED NOT NULL,
	PRIMARY KEY (book_id, topic_id)
);

DROP TABLE IF EXISTS user_object;
CREATE TABLE user_object (
user_id INTEGER NOT NULL,
book_id INTEGER NOT NULL,
session_start_dt DATETIME NOT NULL,
object VARCHAR(256),
object_dt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS book_access;
CREATE TABLE book_access (
book_id INTEGER UNSIGNED NOT NULL,
user_id INTEGER UNSIGNED NOT NULL,
last_opened DATETIME NOT NULL,
PRIMARY KEY (book_id)
);

DROP TABLE IF EXISTS collections;
CREATE TABLE collections (
room INTEGER NOT NULL,
bookcase INTEGER NOT NULL,
bookshelf INTEGER NOT NULL,
book_id INTEGER NOT NULL
);
INSERT INTO collections VALUES(1, 1, 1, 1);
INSERT INTO collections VALUES(1, 1, 1, 2);
INSERT INTO collections VALUES(1, 2, 1, 7);
INSERT INTO collections VALUES(1, 2, 1, 8);
INSERT INTO collections VALUES(1, 1, 2, 1);
INSERT INTO collections VALUES(1, 1, 2, 8);
INSERT INTO collections VALUES(1, 2, 2, 6);
INSERT INTO collections VALUES(1, 2, 2, 7);
INSERT INTO collections VALUES(1, 1, 3, 7);
INSERT INTO collections VALUES(1, 1, 3, 8);
INSERT INTO collections VALUES(1, 2, 3, 5);
INSERT INTO collections VALUES(1, 2, 3, 6);
INSERT INTO collections VALUES(1, 1, 4, 6);
INSERT INTO collections VALUES(1, 1, 4, 7);
INSERT INTO collections VALUES(1, 2, 4, 4);
INSERT INTO collections VALUES(1, 2, 4, 5);
INSERT INTO collections VALUES(1, 1, 5, 5);
INSERT INTO collections VALUES(1, 1, 5, 6);
INSERT INTO collections VALUES(1, 2, 5, 3);
INSERT INTO collections VALUES(1, 2, 5, 4);
INSERT INTO collections VALUES(1, 1, 6, 4);
INSERT INTO collections VALUES(1, 1, 6, 5);
INSERT INTO collections VALUES(1, 2, 6, 2);
INSERT INTO collections VALUES(1, 2, 6, 3);
INSERT INTO collections VALUES(1, 1, 7, 3);
INSERT INTO collections VALUES(1, 1, 7, 4);
INSERT INTO collections VALUES(1, 2, 7, 1);
INSERT INTO collections VALUES(1, 2, 7, 2);
INSERT INTO collections VALUES(1, 1, 8, 2);
INSERT INTO collections VALUES(1, 1, 8, 3);
INSERT INTO collections VALUES(1, 2, 8, 1);
INSERT INTO collections VALUES(1, 2, 8, 8);
INSERT INTO collections VALUES(2, 1, 1, 3);
INSERT INTO collections VALUES(2, 1, 1, 4);
INSERT INTO collections VALUES(2, 2, 1, 5);
INSERT INTO collections VALUES(2, 2, 1, 6);
INSERT INTO collections VALUES(2, 1, 2, 2);
INSERT INTO collections VALUES(2, 1, 2, 3);
INSERT INTO collections VALUES(2, 2, 2, 4);
INSERT INTO collections VALUES(2, 2, 2, 5);
INSERT INTO collections VALUES(2, 1, 3, 1);
INSERT INTO collections VALUES(2, 1, 3, 2);
INSERT INTO collections VALUES(2, 2, 3, 3);
INSERT INTO collections VALUES(2, 2, 3, 4);
INSERT INTO collections VALUES(2, 1, 4, 1);
INSERT INTO collections VALUES(2, 1, 4, 8);
INSERT INTO collections VALUES(2, 2, 4, 2);
INSERT INTO collections VALUES(2, 2, 4, 3);
INSERT INTO collections VALUES(2, 1, 5, 7);
INSERT INTO collections VALUES(2, 1, 5, 8);
INSERT INTO collections VALUES(2, 2, 5, 1);
INSERT INTO collections VALUES(2, 2, 5, 2);
INSERT INTO collections VALUES(2, 1, 6, 6);
INSERT INTO collections VALUES(2, 1, 6, 7);
INSERT INTO collections VALUES(2, 2, 6, 1);
INSERT INTO collections VALUES(2, 2, 6, 8);
INSERT INTO collections VALUES(2, 1, 7, 5);
INSERT INTO collections VALUES(2, 1, 7, 6);
INSERT INTO collections VALUES(2, 2, 7, 7);
INSERT INTO collections VALUES(2, 2, 7, 8);
INSERT INTO collections VALUES(2, 1, 8, 4);
INSERT INTO collections VALUES(2, 1, 8, 5);
INSERT INTO collections VALUES(2, 2, 8, 6);
INSERT INTO collections VALUES(2, 2, 8, 7);

DROP TABLE IF EXISTS vpf;
CREATE TABLE vpf (
user_id INTEGER NOT NULL,
book_id INTEGER NOT NULL,
vpf_id INTEGER NOT NULL
);
INSERT INTO vpf VALUES(1,1,18233);
INSERT INTO vpf VALUES(2,1,18233);
INSERT INTO vpf VALUES(3,1,18233);

DROP TABLE IF EXISTS user_data;
CREATE TABLE user_data (
user_id INTEGER NOT NULL,
institution VARCHAR(256) NOT NULL,
location VARCHAR(256) NOT NULL,
role VARCHAR(256) NOT NULL,
PRIMARY KEY (user_id)
);