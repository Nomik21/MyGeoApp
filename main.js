//window.onload=init
window.onload=setTimeout(init,1300);

function init(){

    //Controls

    //Full Screen Control
    const fullScreenControl = new ol.control.FullScreen({
        labelActive: "F",
        tipLabel: " Nomik's Full Screen Widget"
    });

    
    //Mouse Position Control
    const MousePositionControl = new ol.control.MousePosition({
         projection: "EPSG:4326",
         coordinateFormat: function(coordinate){
             return ol.coordinate.format(coordinate,' λ: {x} φ: {y}', 4);
         }
    });


    //OverviewMapControl
    // const OverviewMapControl = new ol.control.OverviewMap({
    //     collapsed:true, // If the pop-up is open
    //     layers:[
    //         new ol.layer.Tile({
    //             source:new ol.source.XYZ({
    //                 url: "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png"
    //             })
    //         })
    //     ] 
    // });

    //Layers


    //BaseLayers ΥΠΟΒΑΘΡΑ
    
   //OSM STANDARD
    const OsmBasemap= new ol.layer.Tile({
        source: new ol.source.OSM(),
          visible: true,
          title:"OSMBasemap",
          attributions:'<a href=https://www.linkedin.com/in/nikolaos-nomikos-699419206/>Ⓒ Nomikos Nikolaos <a/>'
    })

    

    const LocalBasemap = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: "/output/test/{z}/{x}/{y}.png"
        }),
        visible:false,
        title:"LocalBasemap"
    })


    //Style for My  Position Layer
    const strokeStyle= new ol.style.Stroke({
        color:[249,249,249,1],
        width:3
    })

    const regularShape = new ol.style.RegularShape({
        fill: new ol.style.Fill({
            color: [231,5,5,0.8],
        }),
        stroke:strokeStyle,
        points:3,
        radius:10
    })


    const BasemapsforOffline = new ol.layer.Group({
        layers:[
            OsmBasemap,LocalBasemap
        ],
        zIndex:2
    })


    const map=new ol.Map({
        view: new ol.View({
            center:ol.proj.fromLonLat([25.5, 38.45]), // WEB MERCATOR l,f  Else Meters 2674590, +4562527.0297847847
            zoom:14
        }),
        layers:[BasemapsforOffline],
        target:"js-map",
        keyboardEventTarget: document,
        controls: ol.control.defaults({zoom:false,attribution:false}).extend([
            fullScreenControl,
            MousePositionControl,
            //OverviewMapControl,
        ])
    })




    
    const viewProjection = map.getView().getProjection();
    let geolocation = new ol.Geolocation({
        tracking:true,
        trackingOptions: {
            enableHighAccuracy: true
        },
        projection: 'EPSG:4326'//Mporeis na valeis kai viewprojection gia na pairnei automata
    })

    let geoSource =new ol.source.Vector([]);

    let geoCashing = new ol.layer.Vector({
        source: geoSource,
        visible:true,
        title:"MyPositions",
        style: new ol.style.Style({
            image: regularShape
        })
    });

    map.addLayer(geoCashing);

    const geolocationElement = document.getElementById('geolocation');
    geolocation.on('change:position',function(e){
        let myPos = this.getPosition();
        let accuracy= this.getAccuracy();
        let centerforview = ol.proj.fromLonLat(myPos);
        map.getView().setCenter(centerforview);
        geolocationElement.innerHTML= 'Lon: ' + myPos[0].toFixed(2) +'</br> Lat: ' + myPos[1].toFixed(2);

        let geoFeature = new ol.Feature({
            geometry: new ol.geom.Point(centerforview)
        });

        geoFeature.setProperties({
            'ID':'Nomikos',
            'Coords': [myPos[0].toFixed(2), myPos[1].toFixed(2)],
            'Time': new Date().toLocaleString()
        });

        geoSource.addFeature(geoFeature); 
    });


    //POP UP FOR GPS
    let overlayContainerElement = document.createElement("div");
    overlayContainerElement.className = "overlay-container";
    overlayContainerElement.innerHTML = "<span class='overlay-text' id='pos_id'></span></br>\
                                         <span class='overlay-text' id='pos_coords'></span></br>\
                                         <span class='overlay-text' id='pos_time'></span></br></span>";
    const overlayLayer = new ol.Overlay({
        element:overlayContainerElement
    });
    map.addOverlay(overlayLayer);

    const overlayFeatureName = document.getElementById('pos_id');
    console.log(overlayFeatureName);
    const overlayFeatureCoords = document.getElementById('pos_coords');
    const overlayFeatureTime = document.getElementById('pos_time');
    
    map.on("pointermove",function(e){
        overlayLayer.setPosition(undefined);   
        map.forEachFeatureAtPixel(e.pixel,function(feature,layer){
            let clickedCoordinate2 = e.coordinate;
            let IDFeature=feature.get('ID');
            let CoordFeature=feature.get('Coords');
            let TimeFeature=feature.get('Time');
            overlayLayer.setPosition(clickedCoordinate2);
            overlayFeatureName.innerHTML='Name: ' + IDFeature;
            overlayFeatureCoords.innerHTML='My Coords: '+ CoordFeature; 
            overlayFeatureTime.innerHTML='TimeStamp: '+ TimeFeature;
        },
        {
            layerFilter: function(layerCandidate){
                return layerCandidate.get('title') === 'MyPositions'
            }
        });
    });

   
    //DRAG ROTATE TOOL
    const DragRotateInteraction= new ol.interaction.DragRotate({
        condition: ol.events.condition.altKeyOnly
    })    
    map.addInteraction(DragRotateInteraction);
    


    //ZOOMTO
    let BtnZoomTo = document.createElement("button");
    BtnZoomTo.title  = "Zoom to my current position ";
    BtnZoomTo.id ="ZoomToBt";
    BtnZoomTo.addEventListener("click", function(){
        alert("Zoom to my Position ");
        map.getView().setCenter(ol.proj.fromLonLat(geolocation.position_));
        map.getView().setZoom(17);   
    });
    let elementZoomTo= document.createElement('div');
    elementZoomTo.id="ZoomToElement";
    elementZoomTo.className = 'ol-unselectable ol-control '+ 'ZoomTo';
    elementZoomTo.appendChild(BtnZoomTo);
    let ZoomToControl = new ol.control.Control ({
        element:elementZoomTo
    });
    map.addControl(ZoomToControl);





    //EXPORTTOGEOJSON
    let BtnExportToGeoJSON = document.createElement("button");
    BtnExportToGeoJSON.title = "Export my position to GeoJSON ";
    BtnExportToGeoJSON.id = "ExportToGJSONBt";
    BtnExportToGeoJSON.addEventListener("click", function(feature,layer){
        alert("Your position will be exported to GeoJSON ");
        let geoFeatureJSON = new ol.Feature({
            geometry: new ol.geom.Point(geolocation.position_)
        });
        console.log(geolocation.position_);
        geoFeatureJSON.setProperties({
            'ID': prompt("Define your id"),
            'Coords': [geolocation.position_[0].toFixed(2), geolocation.position_[1].toFixed(2)],
            'Time': new Date().toLocaleString()
        });
        let ExportJSON = new ol.format.GeoJSON();
        ExportJSONObject = ExportJSON.writeFeatureObject(geoFeatureJSON,null);
        console.log(ExportJSONObject);        
        let filename = "report.json";
        let blob = new Blob([JSON.stringify(ExportJSONObject,null,2)],{
            type: "text"
        });
        saveAs(blob,filename);
    });

    let elementExportToGeoJSON = document.createElement('div');
    elementExportToGeoJSON.id = "ExportToGeoJSONElement";
    elementExportToGeoJSON.className = 'ol-unselectable ol-control '+ 'ExportToGeoJSON';
    elementExportToGeoJSON.appendChild(BtnExportToGeoJSON);
    let ExportToGeoJSON = new ol.control.Control({
        element:elementExportToGeoJSON
    });

    map.addControl(ExportToGeoJSON);

    //LOAD GEOJSON


    const strokeStyle2= new ol.style.Stroke({
        color:[200,200,200,1],
        width:3
    })

    const regularShape2 = new ol.style.RegularShape({
        fill: new ol.style.Fill({
            color: [0,128,0,0.8],
        }),
        stroke:strokeStyle2,
        points:3,
        radius:10
    })

    let geoSource2 =new ol.source.Vector([]);

    let geoCashing2 = new ol.layer.Vector({
        source: geoSource2,
        visible:true,
        title:"OtherPositions",
        style: new ol.style.Style({
            image: regularShape2
        })
    });
    

    map.addLayer(geoCashing2);
    console.log(geoCashing2);

    let InputLoadGeoJSON = document.createElement("input");
    InputLoadGeoJSON.type = "file";
    InputLoadGeoJSON.name = "myFile";
    InputLoadGeoJSON.id = "myFile";


    let BtnLoadGeoJSON = document.createElement("button");
    BtnLoadGeoJSON.title = "Load a GeoJSON ";
    BtnLoadGeoJSON.id = "LoadGJSONBt";
    BtnLoadGeoJSON.addEventListener("click", function(){
        alert("You will load a GeoJSON ");
        
        console.log(InputLoadGeoJSON);
        InputLoadGeoJSON.click();
        InputLoadGeoJSON.addEventListener('change', function(e){
            let Filelist = InputLoadGeoJSON.files;
            console.log(Filelist);
            let FileObject = Filelist[0]
            console.log(FileObject);
            let reader = new FileReader(); //reader s an object with the sole purpose of reading data from Blob (and hence File too) objects.
            reader.readAsText(FileObject);
            reader.onload = function(){
                let test=reader.result;
                //console.log(JSON.parse(test)); 
                let LoadJSONObject = JSON.parse(test);
                console.log(LoadJSONObject); 
                console.log(LoadJSONObject.geometry.coordinates);
                let loadcoordinates = new ol.proj.fromLonLat(LoadJSONObject.geometry.coordinates);
                let loadid = LoadJSONObject.properties.ID;
                let loadtime = LoadJSONObject.properties.Time;
                console.log(loadid);
                console.log(loadcoordinates);
                console.log(loadtime);
                let geoFeature2 = new ol.Feature({
                    geometry: new ol.geom.Point(loadcoordinates)
                });
                geoFeature2.setProperties({
                    'ID':loadid,
                    'Coords': [LoadJSONObject.geometry.coordinates[0],LoadJSONObject.geometry.coordinates[1]],
                    'Time': loadtime
                });    
                console.log(geoFeature2);  
                geoSource2.addFeature(geoFeature2);

            }
            // LoadJSON.readFeature(geojsonurl);
            // console.log(LoadJSON);

        });
    });

    let elementLoadGeoJSON = document.createElement('div');
    elementLoadGeoJSON.id = "LoadGeoJSONElement";
    elementLoadGeoJSON.className = 'ol-unselectable ol-control '+ 'LoadGeoJSON';
    elementLoadGeoJSON.appendChild(BtnLoadGeoJSON);
    let LoadGeoJSON = new ol.control.Control({
        element:elementLoadGeoJSON
    });

    map.addControl(LoadGeoJSON);


    //SWITCH BASEMAP
    let BtnSwitchBasemap = document.createElement('button');
    BtnSwitchBasemap.title= "Switch Basemap";
    BtnSwitchBasemap.id= "SwitchBasemapBt";
    BtnSwitchBasemap.addEventListener("click", function(){
        alert ("Basemap is going to change. ");
        let OsmVisibility = OsmBasemap.getVisible();
        console.log(OsmVisibility);
        let LocalVisibility  =LocalBasemap.getVisible();
        console.log(LocalVisibility);
        if(OsmVisibility){
            LocalBasemap.setVisible(true);
            OsmBasemap.setVisible(false);
            console.log(" Basemap changed from OSM to Satellite. ");
        }
        else{
            LocalBasemap.setVisible(false);
            OsmBasemap.setVisible(true);
            console.log(" Basemap changed from Satellite to OSM. ")
        }
    });

    let elementSwitchBasemap = document.createElement("div");
    elementSwitchBasemap.id = "SwitchBasemapElement";
    elementSwitchBasemap.className = 'ol-unselectable ol-control ' + 'SwitchBasemap';
    elementSwitchBasemap.appendChild(BtnSwitchBasemap);
    let SwitchBasemapControl = new ol.control.Control ({
        element: elementSwitchBasemap
    });

    map.addControl(SwitchBasemapControl);

}


