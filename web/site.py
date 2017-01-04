from pathlib import Path
from flask import Flask, render_template, request, redirect, abort, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import load_only
from sqlalchemy.ext.associationproxy import association_proxy
import json


app = Flask(__name__) 

PROJECT_DIR = Path(__file__).absolute().parent
VAR_DIR = PROJECT_DIR.parent / 'var'
DB_PATH = VAR_DIR / 'db.sqlite'

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + str(DB_PATH)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


people_observation_table = db.Table('people_observation',
    db.Column('people_id', db.Integer, db.ForeignKey('people.id')),
    db.Column('observation_id', db.Integer, db.ForeignKey('observation.id'))
)


class Observation(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	date = db.Column(db.String())
	coord_north = db.Column(db.String())
	coord_east = db.Column(db.String())
	male_count = db.Column(db.String())
	female_count = db.Column(db.String())
	child_count = db.Column(db.String())
	comment = db.Column(db.String())
	people = db.relationship("People", secondary = people_observation_table, backref = "observation")

	def to_json(obs):
		people_list = []
		for people in obs.people:
			people_list.append(people.name + " " + people.surname)
		return dict( 
			date = obs.date, 
			people = people_list)


class TaggedAnimal(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String())
	gender = db.Column(db.String())
	ears = db.Column(db.String())
	catch_date = db.Column(db.String())
	picture = db.Column(db.String())

	def to_json(animal):
		return dict(
			id = animal.id, 
			name = animal.name, 
			gender = animal.gender,
			ears = animal.ears,
			catch_date = animal.catch_date,
			picture = animal.picture)


class TaggedAnimalObservation(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	observation_id = db.Column(db.Integer, db.ForeignKey('observation.id'))
	animal_id = db.Column(db.Integer, db.ForeignKey('tagged_animal.id'))
	child_count = db.Column(db.String())
	observation = db.relationship(Observation, backref = "observation")
	animal = db.relationship(TaggedAnimal, backref = "animal")


class Department(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String())
	people = db.relationship("People")

	def to_json(dept):
		return dict(
			id = dept.id, 
			name = dept.name)


class People(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	name = db.Column(db.String())
	surname = db.Column(db.String())
	department_id = db.Column(db.Integer, db.ForeignKey('department.id'))

	def to_json(people):
		return dict(
			id = people.id, 
			name = people.name, 
			surname = people.surname,
			department_id = people.department_id)


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
							missing_fields.append("nombre de cabris d'un individu marqué")
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

		for people_id in request.json['observer_ids']:
			new_obs.people.append(People.query.get(people_id))

		if 'animals' in request.json:
			for animal in request.json['animals']:
				new_relation = TaggedAnimalObservation(
					observation = new_obs, 
					animal = TaggedAnimal.query.get(animal['id']))
				if animal['gender']== "female":
					new_relation.child_count = animal['childs']
				else:
					new_relation.child_count = ""

				db.session.add(new_relation)

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
		animals = TaggedAnimal.query.order_by(TaggedAnimal.ears)
		peoples = People.query.order_by(People.name, People.surname)
		departments = Department.query.all()

		json_data = {}
		json_data['animals'] = []
		json_data['peoples'] = []
		json_data['departments'] = []

		for animal in animals:
			json_data['animals'].append(TaggedAnimal.to_json(animal))
		for people in peoples:
			json_data['peoples'].append(People.to_json(people))
		for dept in departments:
			json_data['departments'].append(Department.to_json(dept))

		response = make_response(json.dumps(json_data), 200)
		response.headers['Content-Type'] = 'application/json; charset=utf-8'
		return response

	except Exception as e:
		raise e
		abort(500)
	

# PAGE DISPLAYING PLAIN TEXT DATA EXTRACTED FROM DB
@app.route('/results', methods=['GET'])
def get_results():
	try:
		observations = Observation.query.all()
		
		json_data = {}
		json_data['observations'] = []

		for obs in observations:
			json_data['observations'].append(Observation.to_json(obs))

		response = make_response(json.dumps(json_data), 200)
		response.headers['Content-Type'] = 'application/json; charset=utf-8'
		return response

	except Exception as e:
		raise e
		abort(500)



if __name__ == '__main__':
	app.run(debug=True, host='0.0.0.0')
