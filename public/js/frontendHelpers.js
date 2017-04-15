
/**
 * Execute a jQuery Ajax Get
 * @param {String} url - URL to execute against
 * @param {function} success - Function callback on success
 * @param {function} error - Function callback on error
 */
function executeGet(url, success, error) {
	$.ajax({
		url: url,
		type: 'GET',
		success: success,
		error: error
	});	
}

/**
 * Execute a jQuery Ajax POST
 * @param {String} url - URL to execute against
 * @param {Object} data - Data to send 
 * @param {String} contentType - Content type string  
 * @param {function} success - Function callback on success
 * @param {function} error - Function callback on error
 */
function executePost(url, data, contentType, success, error) {
	$.ajax({
		url: url,
		type: 'POST',
		data: data,
		contentType: contentType,
		success: success,
		error: error
	});	
}

/**
 * Execute a jQuery Ajax PUT
 * @param {String} url - URL to execute against
 * @param {Object} data - Data to send 
 * @param {String} contentType - Content type string  
 * @param {function} success - Function callback on success
 * @param {function} error - Function callback on error
 */
function executePut(url, data, contentType, success, error) {
	$.ajax({
		url: url,
		type: 'PUT',
		data: data,
		contentType: contentType,
		success: success,
		error: error
	});
}

/**
 * Execute a jQuery Ajax DELETE
 * @param {String} url - URL to execute against
 * @param {Object} data - Data to send 
 * @param {String} contentType - Content type string  
 * @param {function} success - Function callback on success
 * @param {function} error - Function callback on error
 */
function executeDelete(url, success, error) {
	$.ajax({
		url: url,
		type: 'DELETE',
		success: success,
		error: error
	});	
}

/* Hash containing the x/y coordinates for each dart hit to draw on heat map.
	each dart contains coordinates for singles, doubles, and trebles*/
var heatmapDataPoints = {
	'20': { '1': {'x': 300, 'y': 150}, '2': {'x': 300, 'y': 110}, '3': {'x': 300, 'y': 185} },
	'19': { '1': {'x': 248, 'y': 465}, '2': {'x': 236, 'y': 503}, '3': {'x': 261, 'y': 428} },
	'18': { '1': {'x': 394, 'y': 180}, '2': {'x': 416, 'y': 148}, '3': {'x': 371, 'y': 211} },
	'17': { '1': {'x': 348, 'y': 465}, '2': {'x': 361, 'y': 502}, '3': {'x': 336, 'y': 427} },
	'16': { '1': {'x': 167, 'y': 406}, '2': {'x': 136, 'y': 431}, '3': {'x': 199, 'y': 384} },
	'15': { '1': {'x': 431, 'y': 407}, '2': {'x': 462, 'y': 431}, '3': {'x': 399, 'y': 383} },
	'14': { '1': {'x': 146, 'y': 260}, '2': {'x': 108, 'y': 250}, '3': {'x': 182, 'y': 273} },
	'13': { '1': {'x': 451, 'y': 260}, '2': {'x': 490, 'y': 250}, '3': {'x': 415, 'y': 273} },
	'12': { '1': {'x': 202, 'y': 180}, '2': {'x': 182, 'y': 148}, '3': {'x': 226, 'y': 212} },
	'11': { '1': {'x': 135, 'y': 312}, '2': {'x': 97, 'y': 310}, '3': {'x': 176, 'y': 310} },
	'10': { '1': {'x': 452, 'y': 359}, '2': {'x': 492, 'y': 372}, '3': {'x': 417, 'y': 349} },
	'9': { '1': {'x': 166, 'y': 214}, '2': {'x': 135, 'y': 194}, '3': {'x': 199, 'y': 238} },
	'8': { '1': {'x': 143, 'y': 359}, '2': {'x': 107, 'y': 372}, '3': {'x': 181, 'y': 349} },
	'7': { '1': {'x': 203, 'y': 442}, '2': {'x': 178, 'y': 474}, '3': {'x': 226, 'y': 409} },
	'6': { '1': {'x': 463, 'y': 312}, '2': {'x': 500, 'y': 310}, '3': {'x': 422, 'y': 310} },
	'5': { '1': {'x': 250, 'y': 158}, '2': {'x': 235, 'y': 122}, '3': {'x': 260, 'y': 194} },
	'4': { '1': {'x': 431, 'y': 214}, '2': {'x': 462, 'y': 194}, '3': {'x': 399, 'y': 238} },
	'3': { '1': {'x': 300, 'y': 472}, '2': {'x': 300, 'y': 513}, '3': {'x': 300, 'y': 433} },
	'2': { '1': {'x': 396, 'y': 442}, '2': {'x': 418, 'y': 474}, '3': {'x': 372, 'y': 409} },
	'1': { '1': {'x': 348, 'y': 158}, '2': {'x': 361, 'y': 120}, '3': {'x': 336, 'y': 194} },
	'25': { '1': {'x': 300, 'y': 310}, '2': {'x': 300, 'y': 310} },
	'0': { '1': {'x': 50, 'y': 50} } }

/**
 * Draw a heat map on the given canvas with the given scores. 
 * @param {object} canvas - Canvas where the heatmap should be drawn
 * @param {object} scoresMap - Hash with number of hits for each value
 * @param {integer} display - Which values to display, 0 = ALL, 1 = SINGLES, 2 = DOUBLES, 3 = TREBLES
 * @param {integer} size - Size to use when painting
 * @param {integer} spread - Spread to use when painting
 * @param {integer} intensity - Intensity to use when painting
*/
function drawHeatmap(canvas, scoresMap, display = 0, size = 20, spread = 20, intensity = 50) {
	var heatmap = createWebGLHeatmap({ canvas: canvas, intensityToAlpha: true });
	for (var dart in scoresMap) {
		var dartScores = scoresMap[dart];
		for (var multiplier in dartScores) {
			var count = dartScores[multiplier];
			if (count !== 0 && display == 0 || multiplier == display) {
				var coordinatesX = heatmapDataPoints[dart][multiplier]['x'];
				var coordinatesY = heatmapDataPoints[dart][multiplier]['y'];
				for (var i = 0; i < count; i++) {
					paintAtCoordinate(heatmap, coordinatesX, coordinatesY, spread, size, intensity);
				}
			}
		}
	}
	var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
		window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

	var update = function(){
		heatmap.adjustSize(); // can be commented out for statically sized heatmaps, resize clears the map
		heatmap.update(); // adds the buffered points
		heatmap.display(); // adds the buffered points
		raf(update);
	}
	raf(update);
}

/**
 * Paint at a given coordinate
 * @param {object} heatmap - WebGLHeatmap to draw on
 * @param {integer} x - x coordinate to draw
 * @param {integer} y - y coordinate to draw
 * @param {integer} size - Size to use when painting
 * @param {integer} spread - Spread to use when painting
 * @param {integer} intensity - Intensity to use when painting
*/
function paintAtCoordinate(heatmap, x, y, spread, size, intensity) {
	var i = 0;
	while (i < 70) {
		var xoff = Math.random() * 2 - 1;
		var yoff = Math.random() * 2 - 1;
		var l = xoff * xoff + yoff * yoff;
		if (l > 1) {
			continue;
		}
		var ls = Math.sqrt(l);
		xoff /= ls;
		yoff /= ls;
		xoff *= 1 - l;
		yoff *= 1 - l;
		i += 1;
		heatmap.addPoint(x + xoff * spread, y + yoff * spread, size, intensity / 1000);
	}
}		