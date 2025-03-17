-- --------------------------------------------------------
-- Hôte:                         127.0.0.1
-- Version du serveur:           11.7.2-MariaDB - mariadb.org binary distribution
-- SE du serveur:                Win64
-- HeidiSQL Version:             12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Listage de la structure de la base pour testcoloc
CREATE DATABASE IF NOT EXISTS `testcoloc` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */;
USE `testcoloc`;

-- Listage de la structure de table testcoloc. auth_tokens
CREATE TABLE IF NOT EXISTS `auth_tokens` (
  `id_Utilisateur` int(11) NOT NULL,
  `token` varchar(255) DEFAULT NULL,
  KEY `id_Utilisateur` (`id_Utilisateur`),
  CONSTRAINT `id_Utilisateur` FOREIGN KEY (`id_Utilisateur`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table testcoloc. items
CREATE TABLE IF NOT EXISTS `items` (
  `id_Utilisateur` int(11) NOT NULL,
  `Date_Peremption` date NOT NULL,
  `Nom_produit` varchar(50) NOT NULL,
  `Container` varchar(50) NOT NULL,
  KEY `id_UtilisateurItem` (`id_Utilisateur`),
  CONSTRAINT `id_UtilisateurItem` FOREIGN KEY (`id_Utilisateur`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table testcoloc. users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL,
  `prenom` varchar(255) NOT NULL DEFAULT '',
  `nom` varchar(255) NOT NULL DEFAULT '',
  `password` varchar(50) NOT NULL DEFAULT '',
  `codePin` varchar(50) NOT NULL,
  `DataVisage` varchar(50) NOT NULL,
  `Rfid` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
