# apiSQL

Un service API RESTful pour les opérations sur bases de données SQL.

## Description

apiSQL fournit une interface simple pour interagir avec des bases de données SQL via des requêtes HTTP. Il vous permet d'effectuer des opérations CRUD sur votre base de données sans écrire de requêtes SQL brutes.

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/chokinyan/apiSQL.git

# Entrer dans le répertoire du projet
cd apiSQL

# Installer les dépendances
npm install
```

## Configuration

Créez un fichier `.env` à la racine du projet et ajoutez les variables d'environnement suivantes :

```
DB_HOST=localhost       # Nom d'hôte du serveur de base de données
DB_USER=username        # Nom d'utilisateur de la base de données
DB_PASSWORD=password    # Mot de passe de la base de données
DB_DATABASE=database_name     # Nom de la base de données
DB_PORT=3306            # Port du serveur de base de données (par défaut : 3306 pour MySQL)
DB_USER_TABLE=users          # Nom de la table principale pour l'authentification
DB_USER_COLLUM=username # Nom de la colonne pour le nom d'utilisateur/email dans la table d'authentification
DB_PASSWORD_COLLUM=password # Nom de la colonne pour le mot de passe dans la table d'authentification
DB_AOUTH_TABLE
DB_ITEM_TABLE
DB_USER_NAME_COLLUM
```

## Utilisation

Démarrez le serveur :

```bash
npm start
```

L'API sera disponible à l'adresse `http://localhost:3000`.

## Licence

[MIT](LICENSE)
