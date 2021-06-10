function renderStrokes(hole, strokes) {
    var svg = d3.select("svg");
    var strokeGroup = svg.select("#strokes");

    // Make sure strokes are in the correct order
    strokes.sort((a, b) => (a.stroke > b.stroke) ? 1 : -1)

    strokeGroup.selectAll("path").data(strokes).enter().append("path")
        .style("stroke-dasharray", d => d.curveLength)
        .style("stroke-dashoffset", d => d.curveLength)
        .attr("d", function(d) {return `M${d.strokeStart.printCoordinates()}Q${d.strokeApex.printCoordinates()},${d.strokeEnd.printCoordinates()}`}).transition()
        .duration(1000)
        .delay(d => (1000 * (d.stroke-1)))
        .style("stroke-dashoffset", "0");
}

function getScoreName(par, strokes) {
    var scoreName = "";
    var score = strokes - par;

    if (strokes == 1) {
        return "ACE";
    }

    switch (score) {
        case 0:
            scoreName = "PAR";
            break;
        case -1:
            scoreName = "BIRDIE";
            break;
        case -2:
            scoreName = "EAGLE";
            break;
        case -3:
            scoreName = "ALBATROSS";
            break;
        case 1:
            scoreName = "BOGEY";
            break;
        case 2:
            scoreName = "DOUBLE BOGEY";
            break;
        case 3:
            scoreName = "TRIPLE BOGEY";
            break;
        case 4:
            scoreName = "QUADRUPLE BOGEY";
            break;
        default:
            break;
    }

    return scoreName;
}

var svgLive = d3.select("svg#live");
var svgStage = d3.select("svg#stage");
var pin = svgLive.select("#pin")

var hole = {
    hole: 1,
    par: 3,
    distance: 540
}

var groundLength = 750;
var groundHeight = 250

var scale = groundLength / hole["distance"];

pinPositionX = groundLength - (10)

pin.append("path")
    .attr("style", 'stroke:black;stroke-width:2;fill:red')
    .attr("d", `M ${pinPositionX} 250 L ${pinPositionX} 200 L ${pinPositionX - 15} 210 L ${pinPositionX} 215`);

var circlePercentage = 33 / hole["distance"]

var circleOneBoundary = pinPositionX - (33 * scale);
var circleTwoBoundary = circleOneBoundary - (33 * scale);
var circleBoundaries = d3.path();
circleBoundaries.moveTo(circleOneBoundary, groundHeight);
circleBoundaries.lineTo(circleOneBoundary, groundHeight - 10);
circleBoundaries.moveTo(circleTwoBoundary, groundHeight);
circleBoundaries.lineTo(circleTwoBoundary, groundHeight - 10);

d3.select("#circleBoundaries").attr("d", circleBoundaries);

d3.csv("resources/holes.csv").then(function(holeData, err) {

    if (err) throw err;

    var container = d3.select(".svg-container");

    var holeContainers = container.selectAll("div").data(holeData).enter().append("div")
        .attr("class", "hole-container")
        .attr("id", d => `hole${d.hole}`)

    var holeInfoContainers = holeContainers.append("div")
        .attr("class", "hole-info");

    holeInfoContainers.append("p")
        .text(d => `Hole: ${d.hole}`)
        .attr("class", "align-left");

    holeInfoContainers.append("p")
        .text(d => `Par: ${d.par}`)
        .attr("class", "align-right");

    holeInfoContainers.append("div")
        .attr("style", "clear: both;");

    var holeSVGs = holeContainers.append("svg")
        .attr("class", "hole-svg")
        .attr("viewBox", "0 0 750 250");
    
    holeSVGs.append("line")
        .attr("class", "ground-line")
        .attr("x1", "0")
        .attr("y1", "250")
        .attr("x2", "750")
        .attr("y2", "250")

    holeSVGs.append("path")
        .attr("class", "circle-boundaries");

    holeSVGs.append("g")
        .attr("id", "strokes");

    holeSVGs.append("g")
        .attr("id", "pin");
    


});

d3.csv("resources/strokes.csv").then(function(strokeData, err) {

    if (err) throw err;

    strokeData = strokeData.filter(d => (d.hole == hole.hole));

    var fairwayStrokes = strokeData.filter(s => (s.position != "C1" && s.position != "C2" && s.position != "In")).length;
    var fairwayLength = circleTwoBoundary - 10;
    var fairwayIncrements = fairwayLength/(fairwayStrokes+1);

    // console.log(`Fairway Shots: ${fairwayStrokes}`);
    // console.log(`Fairway Increments: ${fairwayIncrements}`);

    strokeData.forEach((d, index, array) => {
        
        d.stroke = +d.stroke;
        d.throwInDistance = +d.throwInDistance;

        d.strokeStart = new Point(0,250);
        d.strokeApex = new Point(0,100);
        d.strokeEnd = new Point(0,250);
    
        if (index == 0) {
            d.strokeStart.x = 10;
        } else {
            d.strokeStart.x = array[index-1].strokeEnd.x;
            d.strokeStart.y = array[index-1].strokeEnd.y;
        }
    
        switch (d.position) {
            case "Fairway":
                d.strokeEnd.x = d.strokeStart.x + fairwayIncrements;
                break;
            case "C2":
                d.strokeEnd.x = 670;
                break;

            case "C1":
                d.strokeEnd.x = 720;
                d.strokeApex.y = 235;
                break;

            case "In":
                d.strokeEnd.x = pinPositionX;
                d.strokeEnd.y -= 20;
                d.strokeApex.y = 230
                break;

            default:
                d.strokeEnd.x = 200;
                break;
        }

        switch (d.type) {
            case "roller":
                d.strokeApex.y = 240;
                break;
            case "overhand":
                d.strokeApex.y = -150;
            default:
                break;
        }        
    
        d.strokeApex.x = (d.strokeStart.x + d.strokeEnd.x) / 2;
    
        d.curveLength = quadraticBezierLength(d.strokeStart, d.strokeApex, d.strokeEnd);
    });

    var strokeGroup = svgLive.select("#strokes");

    // Make sure strokes are in the correct order
    strokeData.sort((a, b) => (a.stroke > b.stroke) ? 1 : -1)

    strokeGroup.selectAll("path").data(strokeData).enter().append("path")
        .style("stroke-dasharray", d => d.curveLength)
        .style("stroke-dashoffset", d => d.curveLength)
        .attr("d", function(d) {return `M${d.strokeStart.printCoordinates()}Q${d.strokeApex.printCoordinates()},${d.strokeEnd.printCoordinates()}`}).transition()
        .duration(1000)
        .delay(d => (1000 * (d.stroke-1)))
        .style("stroke-dashoffset", "0");

    d3.selectAll("#scoreName")
        .text(getScoreName(hole.par, strokeData.length))
        .style("animation-delay", `${strokeData.length}s`);

    // svgLive.attr("class", "slide-out-left").style("animation-delay", `${strokeData.length+1}s`);
    // svgStage.attr("class", "slide-in-right").style("animation-delay", `${strokeData.length+1}s`);
});

// console.log(foo);
// renderStrokes(hole, strokesToPoints(listStrokes));
