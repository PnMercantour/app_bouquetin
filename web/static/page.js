$(document).ready(function(){
	$.getJSON("/static/conf.json")
		.done(function(data) { // Loads configuration from JSON file
			conf = data;
			initialize_datepicker();
			initialize_select_number();
			initialize_ear_colors_dict();

			add_form_block_for_each_animal();
		})
		.fail(function() {
			alert("ERROR : Failed to load configuration file ! ");
		});
})	


function initialize_select_number() {
	Array.from(Array(conf.animal_max_number + 1).keys()).forEach(function (i) {
	    $("#number").append($('<option>', { 
	        value: i,
	        text : i 
	    }));
	});
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

	conf.animals.forEach(function($animal) {
		$animal_left_ear_cap = capitalize($animal.left_ear);

		if ($.inArray($animal_left_ear_cap, $ears_colors_dict[$animal.gender]["left_ears"]) == -1) {
			$ears_colors_dict[$animal.gender]["left_ears"].push($animal_left_ear_cap);
		}

		$ears_colors_dict[$animal.gender]["ears"].push({ 
			"left": $animal_left_ear_cap, 
			"right": capitalize($animal.right_ear) 
		});	
	});
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


function add_form_block_for_each_animal() {
	var $number_displayed = 0;

	$('#number').change(function() {

		var div_global = $("#animals_details");
		var blocks = [];
		var $number_to_display = Number($("#number option:selected").val());

		// DELETE BLOCKS 
		if ($number_to_display < $number_displayed) {
			for (var $i = $number_to_display; $i < $number_displayed ; $i++) {
				var $id = $i+1;
				div_global.find('div#individu_'+$id).remove();
			}
		}

		// ADD BLOCKS
		else if ($number_to_display > $number_displayed) {
		    for (var $i = $number_displayed; $i < $number_to_display ; $i++) {
		  		var $id = $i+1;

		    	var block = $("<div id='individu_"+$id+"'/>");

	    	// *** GENDER RADIO BUTTON *** //
		    	var form_group_gender = $("<div class='form-group'/>");

		    	var label_male = $("<label class='radio-inline'/>");

		    	var label_female = $("<label class='radio-inline'/>");

		    	var input_radio_male = $("<input type='radio' value='male' name='animals["+$id+"][gender]'/>");
		    	label_male.append(input_radio_male);
		    	label_male.append('Mâle');
				
				var input_radio_female = $("<input type='radio' value='female' name='animals["+$id+"][gender]'/>");
		    	label_female.append(input_radio_female);
		    	label_female.append('Femelle');
				
		    	form_group_gender.append(label_male);
		    	form_group_gender.append(label_female);

	    	// *** EARS SELECTS *** //
		    	var form_group_ears = $("<div id='"+$id+"_ears' class='form-group'/>");

		    	var left_ear_select = $("<select class='form-control' name='animals["+$id+"][left_ear]'/>");
		    	form_group_ears.append("Boucle gauche : ");
		    	form_group_ears.append(left_ear_select);

		    	var right_ear_select = $("<select class='form-control' name='animals["+$id+"][right_ear]' disabled='true'/>");
		    	form_group_ears.append("Boucle droite : ");
		    	form_group_ears.append(right_ear_select);

		    	form_group_ears.hide();

	    	// *** CHILD NUMBER *** //
		    	var form_group_childs = $("<div class='form-group' id='"+$id+"_childs'/>");
		    	var childs_select = $("<select class='form-control' name='animals["+$id+"][childs]'/>");

		    	// Append default and unknown value
		    	childs_select.append(get_default_option_value());
		    	childs_select.append(get_unknown_option_value());

		    	// Append all possible options
		    	["0", "1", "2"].forEach(function (i) {
				    childs_select.append($('<option>', { 
				        value: i,
				        text : i 
				    }));
				});
		    	form_group_childs.append("Cabris : ");
		    	form_group_childs.append(childs_select);

		    	form_group_childs.hide();


	    	// *** CONSTRUCT BLOCK *** //
		    	block.append("<h4>Individu "+$id+"</h4>");
		    	block.append(form_group_gender);
		    	block.append(form_group_ears);
		    	block.append(form_group_childs);

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
	var $id = $i + 1;
	var left_ear_select = $("select[name='animals["+$id+"][left_ear]']");
	var right_ear_select = $("select[name='animals["+$id+"][right_ear]']");
	var childs_select = $("#"+$id+"_childs");

	// Set listener on radio button gender to change the display of the ears selects and child selects
	$("input[name='animals["+$id+"][gender]']").click(function() {
		var radio_gender_checked = $("input[name='animals["+$id+"][gender]']:checked");

		// Display ears selects, empty the animal's details and disable the right_ear select
		$("#"+$id+"_ears").show();
		left_ear_select.empty();
		right_ear_select.empty();
		right_ear_select.prop("disabled", true);

		// Depending on the radio button gender value, set the correspondant colors in left_ear select
		if (radio_gender_checked.val() == "male") {
			// Reset the childs select to default option
			childs_select.filter(function() { 
				return $(this).text() == "undefined";
			}).prop('selected', true);

			childs_select.hide();
			set_left_ears_select_options($id, "male");
		}

		else if (radio_gender_checked.val() == "female") {
			childs_select.show();
			set_left_ears_select_options($id, "female");
		}


		// Set listener on left_ear select to change right_ear select options
		left_ear_select.change(function() {
			// Able right ear select and empty its possible options
			right_ear_select.prop("disabled", false);
			right_ear_select.empty();

			// Append default and unknown value
			right_ear_select.append(get_default_option_value());
			right_ear_select.append(get_unknown_option_value());

			// Get every color possible
			var $right_ear_possible_colors = [];
			$ears_colors_dict[radio_gender_checked.val()]["ears"].forEach(function($ears_color) {
				if ($ears_color.left == left_ear_select.val()) {
					if ($.inArray($ears_color.right, $right_ear_possible_colors) == -1) {
						$right_ear_possible_colors.push($ears_color.right);
					}
				}
			});

			// Append the possible options to the right_ear select
			$right_ear_possible_colors.forEach(function($possible_color){
				right_ear_select.append($('<option>', { 
			        value: $possible_color,
			        text : $possible_color
			    }));
			});
		});
	});
}


function set_left_ears_select_options($id, $gender) {
	var left_ear_select = $("select[name='animals["+$id+"][left_ear]']");

	// Append default and unknwon value
	left_ear_select.append(get_default_option_value());
	left_ear_select.append(get_unknown_option_value());

	// Append every color possible
	$ears_colors_dict[$gender]["left_ears"].forEach(function($left_ear_color) {	
		left_ear_select.append($('<option>', { 
	        value: $left_ear_color,
	        text : $left_ear_color
	    }));
	});
}


function capitalize ($string) {
	return $string.substr(0,1).toUpperCase() + $string.substr(1)
}


function get_default_option_value() {
	return $('<option>', { 
        value: "undefined",
        text : "Sélectionner ...", 
        disabled : "true",
        selected: "selected"
    });
}


function get_unknown_option_value() {
	return $('<option>', { 
        value: "unknown",
        text : "Inconnu"
    });
}