ALTER TABLE `social_response` CHANGE `moderated` `blocked` TINYINT(3) UNSIGNED NOT NULL DEFAULT '0';
ALTER TABLE `user` ADD `blocked` TINYINT UNSIGNED NOT NULL DEFAULT '0' AFTER `usergroup`;