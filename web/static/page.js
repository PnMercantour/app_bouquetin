$(document).ready(function(){
	$.getJSON("/static/conf.json")
		.done(function(data) { // Loads configuration from JSON file
			conf = data; 

			initialize_datepicker();
			initialize_select_number();

			add_form_block_for_each_animal();
		})
		.fail(function() {
			alert("ERROR : Failed to load configuration file !");
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


function add_form_block_for_each_animal() {
	var $number_displayed = 0;

	$('#number').change(function() {

		var div_global = $("#animals_details");
		var blocks = [];
		var $number_to_display = Number($("#number option:selected").val());

		if ($number_to_display < $number_displayed) {
			for (var $i = $number_to_display; $i < $number_displayed ; $i++) {
				var $id = $i+1;
				div_global.find('div#individu-'+$id).remove();
			}
		} 

		else if ($number_to_display > $number_displayed) {
		    for (var $i = $number_displayed; $i < $number_to_display ; $i++) {
		  		var $id = $i+1;

		    	var block = $("<div id='individu-"+$id+"'/>");

		    	// GENDER RADIO BUTTON
		    	var form_group_gender = $("<div/>");
		    	form_group_gender.addClass("form-group");

		    	var label_male = $("<label/>");
		    	label_male.addClass("radio-inline");

		    	var label_female = $("<label/>");
		    	label_female.addClass("radio-inline");

		    	var input = $("<input type='radio' value='male' name='animal-"+$id+"-gender'/>");
		    	label_male.append(input);
		    	label_male.append('Mâle');
				
				input = $("<input type='radio' value='female' name='animal-"+$id+"-gender'/>");
		    	label_female.append(input);
		    	label_female.append('Femelle');
				
		    	form_group_gender.append(label_male);
		    	form_group_gender.append(label_female);

		    	// 

		    	block.append("<h4>Individu "+$id+"</h4>");
		    	block.append(form_group_gender);

		    	blocks.push(block);
		    }

		    div_global.append(blocks);
		}

		$number_displayed = $number_to_display;
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
