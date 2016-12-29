from pathlib import Path
from flask import Flask, render_template, request, redirect
# from flask_sqlalchemy import SQLAlchemy


app = Flask(__name__)  # Convention Flask

PROJECT_DIR = Path(__file__).absolute().parent
VAR_DIR = PROJECT_DIR.parent / 'var'
DB_PATH = VAR_DIR / 'db.sqlite'

# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + str(DB_PATH)
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# db = SQLAlchemy(app)


# class Contact(db.Model):
#     id = db.Column(db.Integer, primary_key=True)
#     nom = db.Column(db.String())
#     prenom = db.Column(db.String())
#     telephone = db.Column(db.String())




#	STRUCTURE DE BASE : 
# UN OBJET OBSERVATION QUI LIE A DES OBJETS ANIMAUX




# db.create_all()


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')



@app.route('/contact/create', methods=['POST'])
def create_contact():
    new_contact = Contact(
        nom=request.form['nom'].upper(),
        prenom=request.form['prenom'].title(),
        telephone=request.form['telephone'])
    db.session.add(new_contact)
    db.session.commit()
    return redirect('/contact/' + str(new_contact.id))


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
