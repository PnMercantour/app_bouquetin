from pathlib import Path
from flask import Flask, render_template, request, redirect, abort, Response, jsonify
from flask_sqlalchemy import SQLAlchemy
import json


app = Flask(__name__) 

PROJECT_DIR = Path(__file__).absolute().parent
VAR_DIR = PROJECT_DIR.parent / 'var'
DB_PATH = VAR_DIR / 'db.sqlite'

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + str(DB_PATH)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


class Observation(db.Model):
	id = db.Column(db.Integer, primary_key=True)
	date = db.Column(db.String())
	number = db.Column(db.String())
	observer_names = db.Column(db.String())
	coord_north = db.Column(db.String())
	coord_east = db.Column(db.String())
	male_count = db.Column(db.String())
	female_count = db.Column(db.String())
	child_count = db.Column(db.String())


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


@app.route('/', methods=['GET'])
def index():
	return render_template('index.html')



@app.route('/obs', methods=['PUT'])
def create_obs():
	try:
		new_obs = Observation(
			date = request.json['date'],
			number = request.json['number'],
			observer_name = request.json['observer_names'],
			coord_north = request.json['coord']['north'], 
			coord_east = request.json['coord']['east'],
			male_count = request.json['male_count'],
			female_count = request.json['female_count'],
			child_count = request.json['child_count'])

	except Exception as e:
		return Response('{"message":{}}'.format(str(e)), status = 400)


	try:
		db.session.add(new_obs)
		db.session.commit()
		return Response('{"message": "OK"}', status = 200)

	except Exception as e:
		abort(500)
	

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

		return Response(json.dumps(json_data), status = 200, content_type='application/json; charset=utf-8')

	except Exception as e:
		print("ERROR > " + str(e))
		abort(500)
	


if __name__ == '__main__':
	app.run(debug=True, host='0.0.0.0')
