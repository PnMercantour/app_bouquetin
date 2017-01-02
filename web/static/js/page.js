// CONSTANTS
$UNKNOWN = 'unknown';
$UNDEFINED = 'undefined';
$NONE = 'none';
$ANIMAL_DEFAULT_NAME = 'Individu marqué'

$(document).ready(function(){
	$.getJSON("/static/conf.json")
		.done(function(data) {  // Loads configuration from JSON file
			$conf = data;

			initialize_alert();
			initialize_datepicker();
			initialize_select_tagged_count();
			initialize_select_people();
			initialize_ear_colors_dict();

			initialize_input_sanitizer();

			add_form_block_for_each_animal();

			submit_button();
		})
		.fail(function() {
			alert("ERROR : Failed to load configuration file ! ");
		});
})	

function initialize_alert() {
	$('#alert_success').hide();
	$('#alert_error').hide();
}


function initialize_datepicker() {
	var date_input=$("#date"); 
    var container=$(".bootstrap-iso form").length>0 ? $(".bootstrap-iso form").parent() : "body";
    var options={
      format: "dd/mm/yyyy",
      container: container,
      todayHighlight: true,
      autoclose: true,
    };
    date_input.datepicker(options);
}


function initialize_select_tagged_count() {
	Array.from(Array($conf.animal_max_tagged_count + 1).keys()).forEach(function (i) {
	    $("#tagged_count").append($('<option>', { 
	        value: i,
	        text : i 
	    }));
	});
}


function initialize_select_people() {
	var observer_names_select = $("#observer_names");
	
	$.each($conf.people, function ($i, $val) {
		var group = $('<optgroup>', {
			label: $i, 
			class:"group-"+$i
		});
		
		$val.forEach(function($j) {
		    group.append($('<option>', { 
		        value: $j,
		        text : $j 
		    }));
		});

		observer_names_select.append(group);
	});

	$("#observer_names").multiselect({
				enableCaseInsensitiveFiltering: true,
				maxHeight: 200,
				includeSelectAllOption: false, 
				enableCollapsibleOptGroups: true, 
				selectAllText: 'Tous !', 
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
			});  // from bootstrap-multiselect.js
}


function initialize_ear_colors_dict() {
	$ears_colors_dict = {
		"male":{
			"left_ears" : [], 
			"ears" : []
		}, 
		"female":{
			"left_ears" : [], 
			"ears" : []
		}
	}; 

	$conf.animals.forEach(function($animal) {
		if ($.inArray($animal.left_ear, $ears_colors_dict[$animal.gender]["left_ears"]) == -1) {
			$ears_colors_dict[$animal.gender]["left_ears"].push($animal.left_ear);
		}

		$ears_colors_dict[$animal.gender]["ears"].push({ 
			"left": $animal.left_ear, 
			"right": $animal.right_ear
		});	
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

	    	// *** EARS SELECTS *** //
		    	var form_group_ears = $("<div id='"+$i+"_ears' class='form-group'/>");

		    	var left_ear_select = $("<select class='form-control' name='animals["+$i+"][left_ear]'/>");
		    	form_group_ears.append("Boucle gauche : ");
		    	form_group_ears.append(left_ear_select);

		    	var right_ear_select = $("<select class='form-control' name='animals["+$i+"][right_ear]'/>");
		    	form_group_ears.append("Boucle droite : ");
		    	form_group_ears.append(right_ear_select);

		    	form_group_ears.hide();

	    	// *** CHILD NUMBER *** //
		    	var form_group_childs = $("<div class='form-group' id='"+$i+"_childs'/>");
		    	var childs_select = $("<select class='form-control' name='animals["+$i+"][childs]'/>");

		    	// Append default and unknown value
		    	childs_select.append(get_default_option());
		    	childs_select.append(get_not_counted_option());

		    	// Append all possible options
		    	$conf.childs_possible_values.forEach(function (i) {
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

		    // *** NAME (HIDDEN) *** //
		    	var animal_name = $("<input type='hidden' id='"+$i+"_name' name='animals["+$i+"][name]' value='"+$UNKNOWN+"'/>");


	    	// *** CONSTRUCT LEFT COLUMN *** //
		    	left_col.append(form_group_gender);
		    	left_col.append(form_group_ears);
		    	left_col.append(form_group_childs);
		    	left_col.append(form_comment);
		    	left_col.append(animal_name);

		    	block.append("<h4 class='col-md-12' id='"+$i+"_title'>"+$ANIMAL_DEFAULT_NAME+" "+($i+1)+"</h4>");
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


function set_block_data_and_behaviour($i) {
	var name = $("#"+$i+"_title");
	var left_ear_select = $("select[name='animals["+$i+"][left_ear]']");
	var right_ear_select = $("select[name='animals["+$i+"][right_ear]']");
	var childs_select = $("#"+$i+"_childs");
	var comment = $("#"+$i+"_comment");
	var animal_name = $("#"+$i+"_name"); // Hidden field
	var identity = $("#"+$i+"_identity");
	var details = $("#"+$i+"_details");

	// Set listener on radio button gender to change the display of the ears selects and child selects
	$("input[name='animals["+$i+"][gender]']").click(function() {
		var radio_gender_checked = $("input[name='animals["+$i+"][gender]']:checked");

		// Empty and display ears selects
		$("#"+$i+"_ears").show();
		left_ear_select.empty();
		right_ear_select.empty();

		// Display comment 
		comment.show()
		

		// Remove animal picture and reset its name
		identity.empty();
		details.empty();
		name.text($ANIMAL_DEFAULT_NAME+" "+($i+1));

		// Depending on the radio button gender value, set the correspondant colors in left_ear select
		if (radio_gender_checked.val() == "male") {
			// Reset the childs select to default option
			childs_select.filter(function() { 
				return $(this).text() == $UNDEFINED;
			}).prop('selected', true);

			childs_select.hide();
			set_left_ears_select_options($i, "male");
		}

		else if (radio_gender_checked.val() == "female") {
			childs_select.show();
			set_left_ears_select_options($i, "female");
		}

		// Add only the none option to the right ear select, so the options none none are displayed by default
		right_ear_select.append(get_none_option_value());


		// Set listener on left_ear select to change right_ear select options
		left_ear_select.change(function() {
			// Empty the right ear select possible options
			right_ear_select.empty();

			// Remove animal picture and reset its name
			identity.empty();
			details.empty();
			name.text($ANIMAL_DEFAULT_NAME+" "+($i+1));

			// Append default and $UNKNOWN value
			right_ear_select.append(get_none_option_value());
			right_ear_select.append(get_unknown_ear_option());

			// If the left ear color is $UNKNOWN, add every color to the right ear select
			var $right_ear_possible_colors = [];
			if (left_ear_select.val() == $UNKNOWN) {
				$ears_colors_dict[radio_gender_checked.val()]["ears"].forEach(function($ears_color) {
					if ($.inArray($ears_color.right, $right_ear_possible_colors) == -1) {
							$right_ear_possible_colors.push($ears_color.right);
						}
					});
			}
			// Else, get every right ear color that matches the left ear color already selected
			else { 
				$ears_colors_dict[radio_gender_checked.val()]["ears"].forEach(function($ears_color) {
					if ($ears_color.left == left_ear_select.val()) {
						if ($.inArray($ears_color.right, $right_ear_possible_colors) == -1) {
							$right_ear_possible_colors.push($ears_color.right);
						}
					}
				});
			}

			// Append the possible options to the right_ear select
			$right_ear_possible_colors.forEach(function($possible_color){
				right_ear_select.append($('<option>', { 
			        value: $possible_color,
			        text : $possible_color
			    }));
			});


			// Set listener on right_ear select to add the name and picture of a matched animal
			right_ear_select.change(function() {
				// Remove animal picture and reset its name
				identity.empty();
				details.empty();
				name.text($ANIMAL_DEFAULT_NAME+" "+($i+1));

				if (right_ear_select.val() != $UNKNOWN && left_ear_select.val() != $UNKNOWN) {
					var $selected_animal;

					$conf.animals.forEach(function($animal) {
						if (left_ear_select.val() == $animal.left_ear && 
							right_ear_select.val() == $animal.right_ear && 
							radio_gender_checked.val() == $animal.gender) {
							$selected_animal = $animal;
						}
					});

					if ($selected_animal != undefined) {
						if ($selected_animal.name != undefined) {
							name.text($selected_animal.name);
							animal_name.val($selected_animal.name);
						}
						if ($selected_animal.picture != undefined) {
							identity.append("<img src='" +$conf.animals_pictures_dir+$selected_animal.picture+ "' class='animal-img img-rounded'/>");
							details.append("<p><b>Date de capture : </b>"+$selected_animal.catch_date+"</p>");
						}
					}
				}
			});
		});
	});
}


function set_left_ears_select_options($id, $gender) {
	var left_ear_select = $("select[name='animals["+$id+"][left_ear]']");

	// Append default and unknwon value
	left_ear_select.append(get_none_option_value());
	left_ear_select.append(get_unknown_ear_option());

	// Append every color possible
	$ears_colors_dict[$gender]["left_ears"].forEach(function($left_ear_color) {	
		left_ear_select.append($('<option>', { 
	        value: $left_ear_color,
	        text : $left_ear_color
	    }));
	});
}


function get_none_option_value() {
	return $('<option>', { 
        value: $NONE,
        text : "Non marqué", 
        selected: "selected"
    });
}


function get_not_counted_option() {
	return $('<option>', { 
        value: $UNKNOWN,
        text : "Non compté"
    });
}


function get_unknown_ear_option() {
	return $('<option>', { 
        value: $UNKNOWN,
        text : "Non identifiable"
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
		$(this).text('Validation123 ...');
		$(this).prop('disabled', true);

		// serializeObject does not support multiple select => need to set the value manually
		var form_data = $("#form").serializeObject();
		form_data.observer_names = $("#observer_names").val();



		console.log(JSON.stringify(form_data));



		// Send data to backend
		$.ajax({
			url: $conf.backend_url+"/obs", 
			type: 'put', 
			data: JSON.stringify(form_data), 
			dataType: 'json', 
			contentType: 'application/json; charset=UTF-8',

			success: function(data, status) {
				$("#submit_button").text('Validé !');
				console.log("success");
				$('#alert_error').hide();
				$('#alert_success').show();
			}, 
			error: function(result, status, error) {
				console.log("error");
				$('#error_details').text(error);
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