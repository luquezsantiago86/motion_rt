// Import Project & Read cordinates Files

// Lines Transparency
var lineSlider = document.getElementById("lineRange");


config = {
    header: false,
    encoding: "utf-8",
    skipEmptyLines: true,
    dynamicTyping: true,
}


// Import file
const imputCorFile = document.getElementById('fileInputProject');
const imputCorBtn = document.getElementById('fileInputProject-btn');
const imputCorTxt = document.getElementById('importProject-text');

function updateWeight() {
    const buffer = 0.32
    currentZoom = map.getZoom();
    // getMetersPerPixel
    var centerLatLng = map.getCenter(); // get map center
    var pointC = map.latLngToContainerPoint(centerLatLng); // convert to containerpoint (pixels)
    var pointX = L.point(pointC.x + 10, pointC.y); // add 10 pixels to x
    // convert containerpoints to latlng's
    var latLngX = map.containerPointToLatLng(pointX);
    var resultado = centerLatLng.distanceTo(latLngX) / 10; // calculate distance between c and x (latitude)
    buffer_new = buffer * 2 / resultado
    return buffer_new
}

updateWeight()
    // All Lines

var allLines = L.polyline([
        [
            [45.51, -122.68],
            [37.77, -122.43],
            [34.04, -118.2]
        ],
        [
            [40.78, -73.91],
            [41.83, -87.62],
            [32.76, -96.72]
        ]
    ], {
        color: 'blue',
        weight: buffer_new
    })
    .addTo(map);
var customOptions = {
    'className': 'custom-popup blink',
    autoPan: false
}


var arrowLast = [40.702222, -73.979378]
var arrowPrev = [40.802222, -73.979378]


map.on('zoomend', function() {
    currentZoom = map.getZoom();
    if (currentZoom !== 0) {
        updateWeight()
        lastLine.setStyle({ 'weight': buffer_new, opacity: 1 });
        allLines.setStyle({ 'weight': buffer_new, opacity: 1 });
    }
});

arrowGroup = L.layerGroup()

document.getElementById('fileInputProject-btn').addEventListener('click', async() => {

    let dlg = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    if (dlg.canceled) {
        return
    }
    try {
        L.control.liveupdate({
                update_map: function() {
                    arrowGroup.clearLayers()
                    getData();
                    async function getData() {
                        // A function that reads a directory and returns a promise for an array of filenames:
                        function getFilesAsync(dirname) {
                            return new Promise((resolve, reject) => {
                                fs.readdir(dirname, function(err, files) {
                                    if (err) reject(err);
                                    else resolve(files);

                                });
                            });
                        }
                        // A function that takes a filename and an optional encoding, and returns a promise for the file content:
                        function getFileContentAsync(filename, encoding) {
                            return new Promise((resolve, reject) => {
                                fs.readFile(filename, { encoding: encoding }, function(err, content) {
                                    if (err) reject(err);
                                    else resolve(content);
                                });
                            });
                        }
                        var txtFiles = (await getFilesAsync(dlg.filePaths[0]))
                            .filter(fn => path.extname(fn).toLowerCase() === '.cor')
                            .map(fn => path.join(dlg.filePaths[0], fn));

                        var pendingContents = txtFiles.map(fn => getFileContentAsync(fn, 'utf-8'));
                        var contents = await Promise.all(pendingContents);
                        var allArrays = []
                            //  Collect all files except the last one
                        for (let i = 0; i < txtFiles.length - 1; i++) {

                            var results = papa.parse(String(contents[i]), config)

                            var resultados = Object.values(results.data);
                            var alllatlng = resultados.map((node) => [node[3], node[5]]);
                            allArrays.push(alllatlng)


                        }
                        var nuevo = allArrays

                        // All Lines

                        updateWeight()
                        allLines.setLatLngs(allArrays)
                        allLines.setStyle({ 'weight': buffer_new, opacity: 1 });


                        //  Collect last file
                        const lastCor = txtFiles.length - 1
                        var results = papa.parse(String(contents[lastCor]), config)
                        var resultados = Object.values(results.data);
                        const latlng = resultados.map((node) => [node[3], node[5]]);
                        var lastCoordinate = latlng[latlng.length - 1]
                        var prevCoordinate = latlng[latlng.length - 3]
                            // =================================================================================================
                            // ============================================ MOTION =============================================
                            // =================================================================================================
                        var lastLine = L.motion.polyline(latlng, {
                            color: "orange",
                            weight: buffer_new
                        }, {
                            auto: true,
                            duration: 1000,
                            easing: L.Motion.Ease.swing
                        }, {
                            removeOnEnd: true,
                            showMarker: false,
                            // icon: L.divIcon({ html: "<i class='fa fa-globe fa-2x' aria-hidden='true'></i>", iconSize: L.point(27.5, 24) })
                        }).addTo(map);


                        // lastLine.setLatLngs(latlng)
                        map.panTo(lastCoordinate, { animate: true, duration: 0.5 });
                        var arrowSize = buffer_new * 1.09
                            //  Arrow
                        var arrow = L.canvasMarker(L.latLng(lastCoordinate), {
                                // radius: 0,
                                prevLatlng: L.latLng(prevCoordinate), //previous point
                                img: {
                                    url: 'assets/js/images/arrow_3.png',
                                    size: [arrowSize, arrowSize],
                                    rotate: -48,
                                },
                            })
                            // .addTo(map);
                            // arrowGroup.addLayer(arrow).addTo(map);
                        lastLine.on('mouseover', function() {
                            this.bindPopup(String(txtFiles[lastCor].split("\\").pop()).replace(".cor", ""), customOptions).openPopup();

                        });
                        lastLine.on('mouseout', function() {
                            this.closePopup();
                        });
                    }
                },
                position: 'topleft',
                interval: 5000 //750 //10000 = 1 seg
            })
            .addTo(map)
            .startUpdating().stopUpdating();


        var corFile = dlg.filePaths[0]
        var corPath = corFile.substr(0, corFile.lastIndexOf("\\"));
        var corFolder = corFile.split("\\").pop();
        imputCorTxt.innerHTML = '<a id="importProject-text" href="#" role="button"><i class="fa fa-globe"style="color: rgb(194, 3, 3);"></i>&nbsp;&nbsp;' + corFolder + ' </b></a>'


    } catch (err) {
        // console.log(err);
    }

}, false);

arrowGroup.clearLayers()