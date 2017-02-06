# Installation en dev
Préalables : git, python3, pip, sqlite3

## Récupération des sources
```bash
$ git clone git@github.com:nicolasmanman/science_participative.git
```

## Installation
```bash
$ pip install -r requirements.txt
```
Selon l'OS, on peut avoir besoin d'installer : `python-psycopg2 libpq-dev gcc python3-dev` pour pouvoir installer la librairie python `psycopg2`

## Initialisation des données
```bash
$ sqlite3 db.sqlite < science_participative/var/db_init.sql
```

## Configuration
De la configuration additionnelle peut être trouvée dans le fichier : ```science_participative/web/static/conf.json```
- ```ign_api_key``` : token utilisé par le module IGN, voir le [portail IGN](http://professionnels.ign.fr/).
- ```backend_url``` : url du serveur hébergeant le code python
- ```animal_max_tagged_count``` : valeur haute du selecteur "Nombre d'individus marqués"
- ```childs_possible_values``` : valeurs possibles du selecteur "Cabris"
- ```animals_pictures_dir``` : répertoire contenant les photos des individus marqués

## Sauvegarde de la base
Un cron doit être mis en place afin de dumper la base et sauvegarder ce dump sur un serveur différent.

# Développeurs
> Note : Application créée comme une application jetable => peu de configuration possible sans toucher au code

## Module IGN
- La carte GEOGRAPHICALGRIDSYSTEMS est utilisée
- Configuration du module dans ```science_participative/web/static/ign.js```
