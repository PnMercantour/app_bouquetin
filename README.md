# Base de donnée
## Architecture

```
                                  +---------------------+
                                  |    TaggedAnimalObs  |
                                  +---------------------+        +----------------+
    +------------------+          | FK id_tagged_animal +------> |  TaggedAnimal  |
    |   Observation    | <--------+ FK id_observation   |        +----------------+
    +------------------+          |    child_count      |        | name           |
    |    date          |          +---------------------+        | gender         |
    |    coord_x       |                                         | ears_color     |
    |    coord_y       |                                         | catch_date     |
    |    male_count    |                                         | picture        |
    |    female_count  |                                         +----------------+
    |    comment       |
+---+ FK people        |
|   +------------------+
|
|
|    +----------+
+--> | t_roles  | (UserHub)
     +----------+
     | name     |
     | surname  |
     +----------+
```
## Initialisation
- Créer un nouveau schéma visant à accueillir les données dans la base Postgres
- Initialiser la table TaggedAnimal avec des données

# Installation
> Hypothèse d'une base Postgres déjà configuré

Préalables : 
```bash
sudo apt update
sudo apt install git python3 nginx gunicorn
pip install -U pip
```

## Application
### Récupération des sources
```bash
git clone git@github.com:nicolasmanman/science_participative.git
```

### Installation des librairies
> Il est recommendé d'utiliser un virtualenv

```bash
pip install -r requirements.txt
```
Selon l'OS, on peut avoir besoin d'installer : `python-psycopg2 libpq-dev gcc python3-dev` pour pouvoir installer la librairie python `psycopg2`

### Configuration de l'application
De la configuration peut être trouvée dans le fichier : ```science_participative/web/static/conf.json```
- ```ign_api_key``` : token utilisé par le module IGN, voir le [portail IGN](http://professionnels.ign.fr/)
- ```ign_layer``` : layer utilisé par le module IGN
- ```backend_url``` : url du serveur hébergeant le code python
- ```animal_max_tagged_count``` : valeur haute du selecteur "Nombre d'individus marqués"
- ```childs_possible_values``` : valeurs possibles du selecteur "Cabris"
- ```animals_pictures_dir``` : répertoire contenant les photos des individus marqués
- ```low_zoom_alert_message``` : message d'alerte s'affichant lorsque l'utilisateur place un point sur la carte ayant un zoom insuffisant

De la configuration serveur peut-être trouvée dans le fichier : ```science_participative/web/conf-backend.json```
- ```database_uti``` : sous la forme `user:password@server:port/database`
- ```postgres_schema_data``` : nom du schéma accueillant les données de l'application
- ```postgres_schema_users``` : nom du schéma UserHub (contenant la table t_roles)

### Initialisation des données
Le script `science_participative/var/db_init.sql` peut être joué afin d'initialiser les données des individus bouclés

## Serveur
### Configuration de nginx
```bash
sudo /etc/init.d/nginx start
sudo rm /etc/nginx/sites-enabled/default
sudo touch /etc/nginx/sites-available/app_bouquetin
sudo ln -s /etc/nginx/sites-available/app_bouquetin /etc/nginx/sites-enabled/app_bouquetin
sudo vim /etc/nginx/sites-enabled/app_bouquetin
```

Dans /etc/nginx/sites-enabled/app_bouquetin : 
```
server {
    listen *:80;
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

puis : 
```bash
sudo /etc/init.d/nginx restart
```

### Lancement
```bash
gunicorn app:app
```
