

CREATE DATABASE IF NOT EXISTS `cakedarts`;

/*Table structure for table `darts_thrown` */
CREATE TABLE `darts_thrown` (
  `when` datetime NOT NULL,
  `match_id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL,
  `first_dart` int(11) NOT NULL,
  `second_dart` int(11) NOT NULL,
  `third_dart` int(11) NOT NULL,
  PRIMARY KEY (`when`,`match_id`,`player_id`),
  KEY `FK_darts_thrown2player` (`player_id`),
  KEY `FK_darts_thrown2match_player` (`match_id`,`player_id`),
  CONSTRAINT `FK_darts_thrown2match_player` FOREIGN KEY (`match_id`, `player_id`) REFERENCES `match_players` (`match_id`, `player_id`) ON DELETE CASCADE,
  CONSTRAINT `FK_darts_thrown2matches` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `match_players` */
CREATE TABLE `match_players` (
  `match_id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL,
  `current_score` int(11) NOT NULL DEFAULT '301',
  PRIMARY KEY (`match_id`,`player_id`),
  KEY `FK_match_players2player` (`player_id`),
  CONSTRAINT `FK_match_players2matches` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_match_players2player` FOREIGN KEY (`player_id`) REFERENCES `player` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `matches` */
CREATE TABLE `matches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `starting_score` int(11) NOT NULL DEFAULT '301',
  `winner_player_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_matches2player` (`winner_player_id`),
  CONSTRAINT `FK_matches2player` FOREIGN KEY (`winner_player_id`) REFERENCES `player` (`id`) ON DELETE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8;

/*Table structure for table `owes` */
CREATE TABLE `owes` (
  `player_ower_id` int(11) NOT NULL,
  `player_owee_id` int(11) NOT NULL,
  `amount` int(11) NOT NULL,
  PRIMARY KEY (`player_ower_id`,`player_owee_id`),
  KEY `FK_owes2player_owee` (`player_owee_id`),
  CONSTRAINT `FK_owes2player_owee` FOREIGN KEY (`player_owee_id`) REFERENCES `player` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_owes2player_ower` FOREIGN KEY (`player_ower_id`) REFERENCES `player` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

/*Table structure for table `payback` */
CREATE TABLE `payback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_ower_id` int(11) NOT NULL,
  `player_owee_id` int(11) NOT NULL,
  `payback_date` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_payback2player_ower` (`player_ower_id`),
  KEY `FK_payback2player_owee` (`player_owee_id`),
  CONSTRAINT `FK_payback2player_owee` FOREIGN KEY (`player_owee_id`) REFERENCES `player` (`id`) ON DELETE NO ACTION,
  CONSTRAINT `FK_payback2player_ower` FOREIGN KEY (`player_ower_id`) REFERENCES `player` (`id`) ON DELETE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

/*Table structure for table `player` */
CREATE TABLE `player` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `games_won` int(11) NOT NULL DEFAULT '0',
  `games_played` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

/* Procedure structure for procedure `finalize_match` */

DELIMITER $$
/*!50003 CREATE DEFINER=`developer`@`%` PROCEDURE `finalize_match`(IN match_id INT, IN winner_id INT)
BEGIN
	DECLARE is_finished DATETIME;
	declare is_existing_match int;
	declare is_valid_player int;
	
	SELECT end_time INTO is_finished FROM matches WHERE id = match_id;	
	SELECT id INTO is_existing_match FROM matches WHERE id = match_id;
	select id into is_valid_player from player where id = winner_id;
	
	IF is_existing_match IS NULL THEN
		SELECT -1 AS 'status_code';
		SELECT 'Not a valid match id' AS 'status_message';
	ELSE 
		IF is_finished IS NOT NULL THEN
			SELECT -1 AS 'status_code';
			SELECT 'Match already finished' AS 'status_message';
		ELSE
			IF is_valid_player IS NULL THEN
				SELECT -1 AS 'status_code';
				SELECT 'Not a valid played id' AS 'status_message';
			ELSE
				-- Set winner player_id
				UPDATE matches SET end_time = NOW(), winner_player_id = winner_id WHERE id = match_id;
				-- Increment games played from 'player'
				UPDATE player SET games_played = games_played+1 WHERE id IN(SELECT player_id FROM match_players WHERE match_id = match_id);
				-- Set games_won in 'player'
				UPDATE player SET games_won = games_won+1 WHERE id = winner_id;
				-- Increment 'owes'
				UPDATE owes SET amount = amount+1 WHERE player_owee_id = winner_id AND player_ower_id IN (SELECT player_id FROM match_players WHERE match_id = match_id);	
				SELECT 0 AS 'status_code';
			END IF;
		END IF;
	END IF;	
END */$$
DELIMITER ;
