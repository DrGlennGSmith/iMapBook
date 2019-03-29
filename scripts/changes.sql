
ALTER TABLE `cohort` ADD `social_profile` INTEGER NOT NULL DEFAULT 0 AFTER `bookclubs`;

ALTER TABLE `user` ADD `avatar` VARCHAR(256) AFTER `password`;
ALTER TABLE `user` ADD `usergroup` VARCHAR(128) DEFAULT '' AFTER `created_dt`;

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
	moderated TINYINT UNSIGNED NOT NULL DEFAULT 0,
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
