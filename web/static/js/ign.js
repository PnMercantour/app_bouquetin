// Code snippet from IGN

window.onload= function() {
    $.getJSON("/static/conf.json", function(conf) { // Load configuration from JSON file
        Geoportal.load(
            "map-canvas",
            [conf.ign_api_key],
            {
                lon: 7.128371,
                    lat: 44.145992
            },
            10, 
            {
                layers:['GEOGRAPHICALGRIDSYSTEMS.MAPS'],
                layersOptions: {'GEOGRAPHICALGRIDSYSTEMS.MAPS': {visibility: true, opacity: 1}},
                overlays: {},
                mode: "normal", 

                onView: function() {
                    OpenLayers.Control.Click= OpenLayers.Class( OpenLayers.Control, {
                        defaultHandlerOptions:{
                            'single': true,
                            'double': false,
                            'pixelTolerance': 0,
                            'stopSingle': false,
                            'stopDouble': false
                        },

                        /**
                         * Constructor
                         */
                        initialize: function(options) {
                            OpenLayers.Control.prototype.initialize.apply(this,arguments);
                            this.handlerOptions= OpenLayers.Util.extend({},this.defaultHandlerOptions);
                            this.handler= new OpenLayers.Handler.Click(
                                this, {'click': this.trigger}, this.handlerOptions);
                        },

                        /**
                         * APIMethod: trigger
                         */
                        trigger: function(e) {
                            var lonlat= this.map.getLonLatFromViewPortPx(e.xy).transform(
                                this.map.getProjection(), new OpenLayers.Projection("EPSG:2154")
                            );
                            $('#coord_north').val(lonlat.lon);
                            $('#coord_east').val(lonlat.lat);

                            // Moves the marker
                            this.map.addLayer(markers);
                            markers.clearMarkers();
                            markers.addMarker(new OpenLayers.Marker(this.map.getLonLatFromViewPortPx(e.xy)));
                        }
                    });

                    // Creates and inserts new controller
                    var monClic= new OpenLayers.Control.Click({
                        autoActivate:true
                    });
                    this.getViewer().getMap().addControl(monClic);

                    // Adds a new marker layer
                    var markers = new OpenLayers.Layer.Markers( "Position" );
                    
                }
            }
        );
    });
};    