// CONSTANTS
$UNKNOWN = 'unknown';
$UNDEFINED = 'undefined';
$NONE = 'none';
$ANIMAL_DEFAULT_NAME = 'Individu marqué'
$CONF = undefined;
$DATA = undefined;

$(document).ready(function() {
	$.getJSON("/static/conf.json")
		.done(function(conf_data) {  // Loads configuration from JSON file
			$CONF = conf_data;

			load_data(function(callback) {
				if (callback) {
					initialize_datepicker();
					initialize_select_tagged_count();
					initialize_select_people();

					initialize_input_sanitizer();

					add_form_block_for_each_animal();

					submit_button();
					reload_button();
				}
			});

		})
		.fail(function() {
			alert("ERROR : Failed to load configuration file ! ");
		});
})	


function load_data(callback) {
	$.ajax({
		url: $CONF.backend_url+"/data", 
		type: 'get', 
		success: function(data, status) {
			$DATA = data;
			callback(true);
		}, 
		error: function(result, status, error) {
			alert("ERROR : Failed to load configuration file ! ");
			callback(false);
		}
	});
}


function initialize_datepicker() {
	var date_input=$("#date"); 
	var container=$(".bootstrap-iso form").length>0 ? $(".bootstrap-iso form").parent() : "body";
	var options={
		language: "fr",
		container: container,
		todayHighlight: true,
		autoclose: true
	};

	$.fn.datepicker.dates['fr'] = {
		days: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
		daysShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
		daysMin: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
		months: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
		monthsShort: ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
		today: "Aujourd'hui",
		clear: "Nettoyer",
		format: "dd/mm/yyyy",
		titleFormat: "MM yyyy", /* Leverages same syntax as 'format' */
		weekStart: 1
	};

	date_input.datepicker(options);
}


function initialize_select_tagged_count() {
	Array.from(Array($CONF.animal_max_tagged_count + 1).keys()).forEach(function (i) {
		$("#tagged_count").append($('<option>', { 
			value: i,
			text : i 
		}));
	});
}


function initialize_select_people() {
	// Documentation : http://davidstutz.github.io/bootstrap-multiselect
	var observer_ids_select = $("#observer_ids");
	
	$DATA.departments.forEach(function ($i) {
		observer_ids_select.append($('<optgroup>', {
			label: $i.name, 
			class: "group-"+$i.id, 
			id: "department-"+$i.id
		}));
	});
		
	$DATA.peoples.forEach(function($j) {
		$('#department-'+$j.department_id).append($('<option>', { 
			value: $j.id,
			text : $j.name + " " + $j.surname
		}));
	});

	// from bootstrap-multiselect.js
	$("#observer_ids").multiselect({
		enableCaseInsensitiveFiltering: true,
		maxHeight: 300,
		includeSelectAllOption: false, 
		enableCollapsibleOptGroups: true, 
		selectAllText: 'Tous !', 
		buttonWidth: '300px', 
		buttonText: function(options, select) {
			if (options.length === 0) {
				return 'Aucun';
			}
			else if (options.length > 5) {
				return options.length + ' selectionnés';
			}
			 else {
				 var labels = [];
				 options.each(function() {
					 if ($(this).attr('label') !== undefined) {
						 labels.push($(this).attr('label'));
					 }
					 else {
						 labels.push($(this).html());
					 }
				 });
				 return labels.join(', ') + '';
			 }
		}
	});  
}


function initialize_input_sanitizer() {
	// Delete non numeric characters in counts inputs
	["male_count", "female_count", "child_count"].forEach(function(input) {
		$('#'+input).on('change keyup', function() {
			var sanitized = $(this).val().replace(/[^0-9]/g, '');
			$(this).val(sanitized);
		});
	});
}


function add_form_block_for_each_animal() {
	var $number_displayed = 0;

	$('#tagged_count').change(function() {

		var div_global = $("#animals_details");
		var blocks = [];
		var $number_to_display = Number($("#tagged_count option:selected").val());

		// DELETE BLOCKS 
		if ($number_to_display < $number_displayed) {
			for (var $i = $number_to_display; $i < $number_displayed ; $i++) {
				div_global.find('div#individu_'+$i).remove();
			}
		}

		// ADD BLOCKS
		else if ($number_to_display > $number_displayed) {
			for (var $i = $number_displayed; $i < $number_to_display ; $i++) {

				var block = $("<div class='animal-block row' id='individu_"+$i+"'/>");
				var left_col = $("<div class='col-md-4'/>");
				var center_col = $("<div class='col-md-4' id='"+$i+"_details'/>");
				var right_col = $("<div class='col-md-4' id='"+$i+"_identity'/>");

			// *** GENDER RADIO BUTTON *** //
				var form_group_gender = $("<div class='form-group'/>");

				var label_male = $("<label class='radio-inline'/>");

				var label_female = $("<label class='radio-inline'/>");

				var input_radio_male = $("<input type='radio' value='male' name='animals["+$i+"][gender]'/>");
				label_male.append(input_radio_male);
				label_male.append('Mâle');
				
				var input_radio_female = $("<input type='radio' value='female' name='animals["+$i+"][gender]'/>");
				label_female.append(input_radio_female);
				label_female.append('Femelle');
				
				form_group_gender.append(label_male);
				form_group_gender.append(label_female);

			// *** EARS SELECT *** //
				var form_group_ears = $("<div id='"+$i+"_ears' class='form-group'/>");

				var ears_select = $("<select class='form-control' name='animals["+$i+"][ears]'/>");
				form_group_ears.append("Boucles <i>(gauche - droite)</i> :");
				form_group_ears.append(ears_select);

				form_group_ears.hide();

			// *** CHILD NUMBER *** //
				var form_group_childs = $("<div class='form-group' id='"+$i+"_childs'/>");
				var childs_select = $("<select class='form-control' name='animals["+$i+"][childs]'/>");

				// Append default and unknown value
				childs_select.append(get_default_option());
				childs_select.append($('<option>', { 
					value: $UNKNOWN,
					text : "Non compté"
				}));

				// Append all possible options
				$CONF.childs_possible_values.forEach(function (i) {
					childs_select.append($('<option>', { 
						value: i,
						text : i 
					}));
				});
				form_group_childs.append("Cabris : ");
				form_group_childs.append(childs_select);

				form_group_childs.hide();

			// *** COMMENT *** //
				var form_comment = $("<div id='"+$i+"_comment' class='form-group'/>");

				var comment = $("<input type='text' class='form-control' name='animals["+$i+"][comment]'/>");
				form_comment.append("Commentaire : ");
				form_comment.append(comment);

				form_comment.hide();


			// *** CONSTRUCT LEFT COLUMN *** //
				left_col.append(form_group_gender);
				left_col.append(form_group_ears);
				left_col.append(form_group_childs);
				left_col.append(form_comment);

				block.append("<h4 class='col-md-12' id='"+$i+"_title'>"+$ANIMAL_DEFAULT_NAME+" "+($i+1)+"</h4>");
				block.append("<input type='hidden' name='animals["+$i+"][id]'' id='"+$i+"_id' value=''/>");
				block.append(left_col);
				block.append(center_col);
				block.append(right_col);

				blocks.push(block);
			}

			div_global.append(blocks);

			// for each block, initialize the listeners and set the data to display
			for ($i = 0; $i < $number_to_display; $i++) {
				set_block_data_and_behaviour($i)
			}
		}

		$number_displayed = $number_to_display;
	});
}


function set_block_data_and_behaviour($id) {
	var name = $("#"+$id+"_title");
	var ears_select = $("select[name='animals["+$id+"][ears]']");
	var childs_select = $("#"+$id+"_childs");
	var comment = $("#"+$id+"_comment");
	var identity = $("#"+$id+"_identity");
	var details = $("#"+$id+"_details");
	var hidden_id = $("#"+$id+"_id");

	// Set listener on radio button gender to change the display of the ears selects and child selects
	$("input[name='animals["+$id+"][gender]']").click(function() {
		var radio_gender_checked = $("input[name='animals["+$id+"][gender]']:checked");

		// Reset the animal form
		name.text($ANIMAL_DEFAULT_NAME+" "+($id+1));
		$("#"+$id+"_ears").show();
		comment.show()
		ears_select.empty();
		identity.empty();
		details.empty();

		// Set the colors in ears select
		ears_select.append(get_default_option());
		$DATA.animals.forEach(function($animal) {	
			if ($animal.gender == radio_gender_checked.val()) {
				ears_select.append($('<option>', { 
					value: $animal.ears,
					text : $animal.ears
				}));
			}
		});

		// Display or hide the child select
		if (radio_gender_checked.val() == "male") {
			childs_select.hide();
		}

		else if (radio_gender_checked.val() == "female") {
			childs_select.show();
		}

		// Set listener on ears_select
		ears_select.change(function() {
			identity.empty();
			details.empty();
			$DATA.animals.forEach(function($animal) {
				if (radio_gender_checked.val() == $animal.gender && ears_select.val() == $animal.ears) {
					if ($animal.name != undefined) {
						name.text($animal.name);
					}
					if ($animal.picture != undefined) {
						identity.append("<img src='" +$CONF.animals_pictures_dir+$animal.picture+ "' class='animal-img img-rounded center-block'/>");
						details.append("<p><b>Date de capture : </b>"+$animal.catch_date+"</p>");
					}
					hidden_id.val($animal.id);
				}
			});
		});
	});
}


function get_default_option() {
	return $('<option>', { 
		value: $UNDEFINED,
		text : "Sélectionner ...", 
		disabled : "true",
		selected: "selected"
	});
}


function submit_button() {
	$("#submit_button").click(function() {
		$(this).text('Validation ...');
		$(this).prop('disabled', true);

		// serializeObject does not support multiple select => need to set the value manually
		var form_data = $("#form").serializeObject();
		form_data.observer_ids = $("#observer_ids").val();

		// Send data to backend
		$.ajax({
			url: $CONF.backend_url+"/obs", 
			type: 'put', 
			data: JSON.stringify(form_data), 
			dataType: 'json', 
			contentType: 'application/json; charset=UTF-8',

			success: function(data, status) {
				$("#submit_button").text('Validé !');
				$('#alert_error').hide();
				$('#alert_success').show();
			}, 
			error: function(result, status, error) {
				if (result.responseJSON.message) {
					$('#error_details').text(result.responseJSON.message);
				}
				$('#alert_error').show();
				$("#submit_button").prop('disabled', false);
				$("#submit_button").text("Valider");
			}, 
			complete: function() {
				window.scrollTo(0, 0);
			}
		});
		
	});
}


function reload_button() {
	$("#reload_button").click(function() {
		window.location.replace(window.location.pathname + window.location.search + window.location.hash);
	});
}
