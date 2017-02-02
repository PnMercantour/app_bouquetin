$(document).ready(function() {
	$.getJSON("/static/conf.json", function(conf) { // Load configuration from JSON file
		// Load map in DOM div
		var mymap = L.map('mapid').setView([44.145992, 7.128371], 10);

		// Create icon
		var animalIcon = L.icon({
		    iconUrl: '/static/images/icon.png',
		    shadowUrl: '/static/images/shadow.png',

		    iconSize:     [55, 80], // size of the icon
		    shadowSize:   [0, 0], // size of the shadow
		    iconAnchor:   [25, 80], // point of the icon which will correspond to marker's location
		    shadowAnchor: [-2, 62],  // the same for the shadow
		    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
		});

		// Set variables
		var marker;
		var isMarker = false;
		var crs = new L.Proj.CRS("EPSG:2154",
			"+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");


		// onClick handler
		function onMapClick(e) {
			// Check scale level and display alert if too low
			if (mymap.getZoom() < 15) {
				alert(conf.low_zoom_alert_message);
			}
			else {
				if(isMarker) {
					mymap.removeLayer(marker);
				}
				marker = new L.marker(e.latlng, {icon: animalIcon});
				mymap.addLayer(marker);
				isMarker = true;

				// Project in L93 EPSG:2154
				var latlngLambert = crs.projection.project(e.latlng);

				$('#coord_north').val(latlngLambert.x);
				$('#coord_east').val(latlngLambert.y);
				$('#coord_north_hidden').val(latlngLambert.x);
				$('#coord_east_hidden').val(latlngLambert.y);
			}
		}

		// Add WMS from IGN into the map
		
		var url = 'https://gpp3-wxs.ign.fr/' + conf.ign_api_key + '/geoportail/wmts?LAYER=' + conf.ign_layer +
			'&EXCEPTIONS=text/xml&FORMAT=image/jpeg&SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';	
		L.tileLayer(url).addTo(mymap);

		mymap.on('click', onMapClick);
	});
});
