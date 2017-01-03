from pathlib import Path
from flask import Flask, render_template, request, redirect, abort, Response
from flask_sqlalchemy import SQLAlchemy


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

db.create_all()


@app.route('/', methods=['GET'])
def index():
	return render_template('index.html')



@app.route('/obs', methods=['PUT'])
def create_obs():
	if True :
		new_obs = Observation(
			date = request.json['date'],
			number = request.json['number'],
			observer_name = request.json['observer_names'], 
			coord_north = request.json['coord']['north'], 
			coord_east = request.json['coord']['east'],
			male_count = request.json['male_count'],
			female_count = request.json['female_count'],
			child_count = request.json['child_count'])

		db.session.add(new_obs)
		db.session.commit()

		print(request.json)

		return Response('{"message":"OK"}', status=200)


	else :
		abort(400)
	


if __name__ == '__main__':
	app.run(debug=True, host='0.0.0.0')
