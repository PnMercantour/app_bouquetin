# -*- coding: utf-8 -*-
from pathlib import Path
from flask import Flask, render_template, request, redirect, abort, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import load_only
from sqlalchemy.ext.associationproxy import association_proxy
import json
from datetime import date, datetime

app = Flask(__name__) 

PROJECT_DIR = Path(__file__).absolute().parent

# Get config from json
with open(str(PROJECT_DIR / 'static/conf.json')) as conf_file:
	with open(str(PROJECT_DIR / 'conf_backend.json')) as backend_conf_file:
		conf = dict(json.load(conf_file), **json.load(backend_conf_file)) 

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://' + conf['database_uri']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


# DB MODEL
db = SQLAlchemy(app)

class People(db.Model):
	__tablename__ = "t_roles"
	__table_args__ = {'schema' : conf['postgres_schema_users']}
	id_role = db.Column(db.Integer, primary_key=True)
	nom_role = db.Column(db.String())
	prenom_role = db.Column(db.String())
	groupe = db.Column(db.Boolean)

	def to_json(people):
		return dict(
			id = people.id_role, 
			name = people.nom_role, 
			surname = people.prenom_role)


class Observation(db.Model):
	__table_args__ = {'schema' : conf['postgres_schema_data']}
	id = db.Column(db.Integer, primary_key=True)
	date = db.Column(db.String())
	coord_north = db.Column(db.String())
	coord_east = db.Column(db.String())
	male_count = db.Column(db.String())
	female_count = db.Column(db.String())
	child_count = db.Column(db.String())
	comment = db.Column(db.String())


class TaggedAnimal(db.Model):
	__table_args__ = {'schema' : conf['postgres_schema_data']}
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String())
	gender = db.Column(db.String())
	ears = db.Column(db.String())
	catch_date = db.Column(db.String())
	picture = db.Column(db.String())
	necklace = db.Column(db.String())
	birthday = db.Column(db.Date())

	def to_json(animal):
		today = date.today()
		animal_age = 'Inconnu' # Setting default value
		if animal.birthday is not None:
			animal_age = today.year - animal.birthday.year - ((today.month, today.day) < (animal.birthday.month, animal.birthday.day))
		
		animal_necklace = 'Aucun' # Setting default value
		if animal.necklace is not None:
			animal_necklace = animal.necklace

		return dict(
			id = animal.id, 
			name = animal.name, 
			gender = animal.gender,
			ears = animal.ears,
			catch_date = animal.catch_date,
			picture = animal.picture, 
			necklace = animal_necklace,
			age = animal_age)


class TaggedAnimalObservation(db.Model):
	__table_args__ = {'schema' : conf['postgres_schema_data']}
	id = db.Column(db.Integer, primary_key=True)
	observation_id = db.Column(db.Integer, db.ForeignKey(conf['postgres_schema_data'] + '.observation.id', ondelete='CASCADE', onupdate='CASCADE'))
	animal_id = db.Column(db.Integer, db.ForeignKey(conf['postgres_schema_data'] + '.tagged_animal.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True)
	child_count = db.Column(db.String())
	comment = db.Column(db.String())
	observation = db.relationship(Observation, backref = 'animal_obs', foreign_keys=[observation_id])
	animal = db.relationship(TaggedAnimal, backref = 'obs_animals', foreign_keys=[animal_id])


class PeopleObservation(db.Model):
	__table_args__ = {'schema' : conf['postgres_schema_data']}
	id = db.Column(db.Integer, primary_key=True)
	observation_id = db.Column(db.Integer, db.ForeignKey(conf['postgres_schema_data'] + '.observation.id', ondelete='CASCADE', onupdate='CASCADE'))
	people_id = db.Column(db.Integer, db.ForeignKey(conf['postgres_schema_users'] + '.t_roles.id_role', ondelete='SET NULL', onupdate='CASCADE'), nullable=True)
	observation = db.relationship(Observation, backref = 'people_obs', foreign_keys=[observation_id])
	people = db.relationship(People, backref = 'obs_people', foreign_keys=[people_id])


db.create_all()


# MAIN PAGE HANDLER
@app.route('/', methods=['GET'])
def index():
	return render_template('index.html')


# WEBSERVICE TO ADD AN OBSERVATION
@app.route('/obs', methods=['PUT'])
def create_obs():
	try:
		# VALIDATE DATA
		missing_fields = []
		if request.json['date'] == "":
			missing_fields.append("date de l'observation")
		if request.json['coord']['north'] == "" or request.json['coord']['east'] == "":
			missing_fields.append("coordonnées")
		if request.json['male_count'] == "": 
			missing_fields.append("nombre de mâles")
		if request.json['female_count'] == "":
			missing_fields.append("nombre de femelles")
		if request.json['child_count'] == "": 
			missing_fields.append("nombre de cabris")
		if len(request.json['observer_ids']) == 0 :
			missing_fields.append("noms des observateurs")
		if 'animals' in request.json :
			for animal in request.json['animals']:
				if 'ears' not in animal:
					missing_fields.append("boucles d'un individu marqué")
				if 'gender' in animal:
					if animal['gender'] == "female":
						if 'childs' not in animal:
							missing_fields.append("nombre de cabris d'un individu marqué femelle")
						if 'necklace' not in animal:
							missing_fields.append("collier d'un individu marqué femelle")
					elif animal['gender'] == "male":
						if 'age' not in animal:
							missing_fields.append("âge d'un individu marqué mâle")
				else:
					missing_fields.append("genre d'un individu marqué")

		if len(missing_fields) > 0 :
			missing_fields_string = ""
			for field in missing_fields:
				missing_fields_string += field + ", "
			missing_fields_string = missing_fields_string[:-2] # removes trailing coma
			return make_response(jsonify({'message':'Les champs suivants n\'ont pas été remplis : ' + missing_fields_string}), 400)

		# DATA SERIALIZATION
		new_obs = Observation(
			date = request.json['date'],
			coord_north = request.json['coord']['north'], 
			coord_east = request.json['coord']['east'],
			male_count = request.json['male_count'],
			female_count = request.json['female_count'],
			child_count = request.json['child_count'],
			comment = request.json['comment'])

		if 'observer_ids' in request.json:
			for people_id in request.json['observer_ids']:
				new_people_obs_relation = PeopleObservation(
					observation = new_obs, 
					people = People.query.get(people_id))
				db.session.add(new_people_obs_relation)

		if 'animals' in request.json:
			for animal in request.json['animals']:
				new_animal_obs_relation = TaggedAnimalObservation(
					observation = new_obs, 
					animal = TaggedAnimal.query.get(animal['id']), 
					comment = animal['comment'])
				if animal['gender']== "female":
					new_animal_obs_relation.child_count = animal['childs']
				else:
					new_animal_obs_relation.child_count = None

				db.session.add(new_animal_obs_relation)

		db.session.add(new_obs)
		db.session.commit()
		return make_response(jsonify({'message':'Observation ajoutée'}), 201)

	except Exception as e:
		raise e
		abort(500)
	

# WEBSERVICE TO GET ANIMALS AND PEOPLE DATA
@app.route('/data', methods=['GET'])
def get_data():
	try:
		json_data = {}
		json_data['animals'] = []
		json_data['peoples'] = []

		peoples = People.query.order_by(People.nom_role).filter(People.groupe == False)
		animals = TaggedAnimal.query.order_by(TaggedAnimal.ears)
		
		for people in peoples:
			json_data['peoples'].append(People.to_json(people))
		for animal in animals:
			json_data['animals'].append(TaggedAnimal.to_json(animal))
		
		response = make_response(json.dumps(json_data), 200)
		response.headers['Content-Type'] = 'application/json; charset=utf-8'
		return response

	except Exception as e:
		raise e
		abort(500)


if __name__ == '__main__':
	app.run(debug=True, host='0.0.0.0')
