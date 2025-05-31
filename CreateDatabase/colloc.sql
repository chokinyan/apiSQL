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
CREATE DATABASE IF NOT EXISTS `Collocation` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */;
USE `Collocation`;

-- Listage de la structure de table testcoloc. auth_tokens
CREATE TABLE IF NOT EXISTS `jetons` (
  `id_Utilisateur` int(11) NOT NULL,
  `jeton` varchar(255) DEFAULT NULL,
  KEY `id_Utilisateur` (`id_Utilisateur`),
  CONSTRAINT `id_Utilisateur` FOREIGN KEY (`id_Utilisateur`) REFERENCES `utilisateur` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table testcoloc. items
CREATE TABLE IF NOT EXISTS `objet` (
  `id` int(100) NOT NULL AUTO_INCREMENT,
  `id_Utilisateur` int(11) NOT NULL,
  `Date_Peremption` date NOT NULL,
  `Nom_produit` varchar(50) NOT NULL,
  `Container` varchar(50) NOT NULL,
  `ImageUrl` varchar(100),
  PRIMARY KEY (`id`),
  KEY `id_UtilisateurItem` (`id_Utilisateur`),
  CONSTRAINT `id_UtilisateurItem` FOREIGN KEY (`id_Utilisateur`) REFERENCES `utilisateur` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table testcoloc. users
CREATE TABLE IF NOT EXISTS `utilisateur` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prenom` varchar(255) NOT NULL DEFAULT '',
  `nom` varchar(255) NOT NULL DEFAULT '',
  `motDePasse` varchar(50) NOT NULL DEFAULT '',
  `codePin` varchar(4) NOT NULL,
  `codeRfid` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
