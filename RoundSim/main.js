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
    var scoreColor = "white"
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
            scoreColor = "#77acd9";
            break;
        case -2:
            scoreName = "EAGLE";
            scoreColor = "#4f93ce";
            break;
        case -3:
            scoreName = "ALBATROSS";
            break;
        case 1:
            scoreName = "BOGEY";
            scoreColor = "#ffd79d"
            break;
        case 2:
            scoreName = "DOUBLE BOGEY";
            scoreColor = "#ffad37"
            break;
        case 3:
            scoreName = "TRIPLE BOGEY";
            scoreColor = "#ffad37"
            break;
        case 4:
            scoreName = "QUADRUPLE BOGEY";
            scoreColor = "#ffad37"
            break;
        default:
            break;
    }

    return {"name": scoreName, "color": scoreColor};
}

function drawHole(hole) {

    console.log(hole);
    var holeContainter = d3.select(`#hole${hole}`);

    var strokeCount = 0

    holeContainter.select("#strokes")
        .selectAll("path")
        .each(d => strokeCount++)
        .transition()
        .duration(transitionLength)
        .delay(d => transitionLength * (d.stroke-1))
        .style("stroke-dashoffset", "0");

    holeContainter.select(".score-name").transition()
        .delay(transitionLength * strokeCount)
        .attr("class", "text-pop-up-top score-name")
        .on("end", function() {
            nextHole(hole);
        });
}

function nextHole(activeHole) {

    d3.select(".svg-container").transition()
        .duration(transitionLength*2)
        .delay(transitionLength)
        .ease(d3.easeCubic)
        .style("transform", `translateX(-${1000*activeHole++}px)`)
        .on("end", function() {
            drawHole(activeHole++);
        });;
    
}

var svgLive = d3.select("svg#live");
var svgStage = d3.select("svg#stage");
var pin = svgLive.select("#pin")

var hole = {
    hole: 1,
    par: 3,
    distance: 540
}

var activeHole = 1

var groundLength = 750;
var groundHeight = 250;

var transitionLength = 1000;

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


d3.csv("resources/holes.csv").then(function (holeData, err) {

    if (err) throw err;

    d3.csv("resources/strokes.csv").then(function (strokeData, err) {
        if (err) throw err;

        holeData.forEach((h, index, array) => {
            h.strokes = strokeData.filter(s => (s.hole == h.hole));

            h.fairwayStrokes = h.strokes.filter(s => (s.position != "C1" && s.position != "C2" && s.position != "In")).length;
            h.fairwayLength = circleTwoBoundary - 10;
            h.fairwayIncrements = h.fairwayLength / (h.fairwayStrokes + 1);

            h.strokes.forEach((d, index, array) => {

                d.stroke = +d.stroke;
                d.throwInDistance = +d.throwInDistance;

                if (typeof array[index-1] === 'undefined') {
                    d.positionChange = `Tee->${d.position}`;
                } else {
                    d.positionChange= `${array[index-1].position}->${d.position}`;
                }
        
                d.strokeStart = new Point(0,250);
                d.strokeApex = new Point(0,100);
                d.strokeEnd = new Point(0,250);
            
                if (index == 0) {
                    d.strokeStart.x = 10;
                } else {
                    d.strokeStart.x = array[index-1].strokeEnd.x;
                    d.strokeStart.y = array[index-1].strokeEnd.y;
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
            
                switch (d.position) {
                    case "Fairway":
                        d.strokeEnd.x = d.strokeStart.x + h.fairwayIncrements;
                        break;
                    case "C2":
                        d.strokeEnd.x = 670;
                        break;
        
                    case "C1":
                        d.strokeEnd.x = 720;
                        break;
        
                    case "In":
                        d.strokeEnd.x = pinPositionX;
                        d.strokeEnd.y -= 20;
                        break;
        
                    default:
                        d.strokeEnd.x = 200;
                        break;
                }

                d.strokeApex.x = (d.strokeStart.x + d.strokeEnd.x) / 2;
            
                d.curveLength = quadraticBezierLength(d.strokeStart, d.strokeApex, d.strokeEnd);

                // console.log(d);
            
            })
        })

        var container = d3.select(".svg-container");

        var holeContainers = container.selectAll("div").data(holeData).enter().append("div")
            .attr("class", "hole-container")
            .attr("id", d => `hole${d.hole}`)
            .style("transform", (d, i) => `translateX(${1000*i}px)`);

        var scoreNames = holeContainers.append("h1")
            .attr("class", "score-name")
            .style("color", d => getScoreName(d.par, d.strokes.length).color)
            .text(d => getScoreName(d.par, d.strokes.length).name);
 
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

        var circleBoundaryGroups = holeSVGs.append("path")
            .attr("class", "circle-boundaries");

        var strokeGroups = holeSVGs.append("g")
            .attr("id", "strokes");

        holeSVGs.append("g")
            .attr("id", "pin")
            .append("path")
            .attr("class", 'pin')
            .attr("d", `M ${pinPositionX} 250 L ${pinPositionX} 200 L ${pinPositionX - 15} 210 L ${pinPositionX} 215`);     

        var strokes = strokeGroups.selectAll(null)
            .data(d => d.strokes)
            .enter()
            .append("path")
            .style("stroke-dasharray", d => d.curveLength)
            .style("stroke-dashoffset", d => d.curveLength)
            .attr("d", d => `M${d.strokeStart.printCoordinates()}Q${d.strokeApex.printCoordinates()},${d.strokeEnd.printCoordinates()}`);
            
            drawHole(1)
    });

});



