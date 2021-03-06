
/**
 *   Activating drag and drop for a given div
 *
 *   @param {string} divName: name of the div element to activate drag and drop for
 */
function activateDragAndDropEAE(divName) {
    var div = Ext.get(divName);
    var dtgI = new Ext.dd.DropTarget(div, {ddGroup: 'makeQuery'});
    dtgI.notifyDrop = dropOntoCategorySelection;
}

/**
 *   Clears drag & drop selections from the given div
 *
 *   @param {string} divName: name of the div element to clear
 */
function clearVarSelection(divName) {
    var div = Ext.get(divName).dom;
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }
}

/**
 *   Returns the concepts defined via drag & drop from the given div
 *
 *   @param {string} divName: name of the div to get the selected concepts from
 *   @return {string[]}: array of found concepts
 */
function getConcepts(divName) {
    var div = Ext.get(divName);
    div = div.dom;
    var variables = [];
    for (var i = 0, len = div.childNodes.length; i < len; i++) {
        variables.push(div.childNodes[i].getAttribute('conceptid'));
    }
    return variables;
}

/**
 *   Checks whether the given div only contains the specified icon/leaf
 *
 *   @param {string} divName: name of the div to check
 *   @param {string} icon: icon type to look for (i.e. valueicon or hleaficon)
 *   @return {bool}: true if div only contains the specified icon type
 */
function containsOnly(divName, icon) {
    var div = Ext.get(divName).dom;
    for (var i = 0, len = div.childNodes.length; i < len; i++) {
        if (div.childNodes[i].getAttribute('setnodetype') !== icon &&
            icon !== 'alphaicon') { // FIXME: this is just here so SmartR works on the current master branch
            return false;
        }
    }
    return true;
}

var conceptBoxes = [];
var sanityCheckErrors = [];
function registerConceptBoxEAE(name, cohorts, type, min, max) {
    var concepts = getConcepts(name);
    var check1 = type === undefined || containsOnly(name, type);
    var check2 = min === undefined || concepts.length >= min;
    var check3 = max === undefined || concepts.length <= max;
    sanityCheckErrors.push(
        !check1 ? 'Concept box (' + name + ') contains concepts with invalid type! Valid type: ' + type :
            !check2 ? 'Concept box (' + name + ') contains too few concepts! Valid range: ' + min + ' - ' + max :
                !check3 ? 'Concept box (' + name + ') contains too many concepts! Valid range: ' + min + ' - ' + max : '');
    conceptBoxes.push({name: name, cohorts: cohorts, type: type, concepts: concepts});
}

var workflowSelected = "";
function registerWorkflowParams(workflow){
    workflowSelected = workflow;
}

/**
 *   Prepares data for the AJAX call containing all neccesary information for computation
 *
 *   @return {[]}: array of objects containing the information for server side computations
 */
function prepareFormDataEAE(workflowSelected) {
    var data = customWorkflowParameters(); //method MUST be implemented by _inFoobarAnalysis.gsp
    data.push({name: 'workflow', value: workflowSelected});
    data.push({name: 'conceptBoxes', value: JSON.stringify(conceptBoxes)});
    data.push({name: 'result_instance_id1', value: GLOBAL.CurrentSubsetIDs[1]});
    data.push({name: 'result_instance_id2', value: GLOBAL.CurrentSubsetIDs[2]});
    return data;
}

/**
 *   Prepares data for the AJAX call containing all neccesary information for computation
 *
 *   @return {[]}: array of objects containing the information for server side computations
 */
function prepareNoSQLFormDataEAE(workflowSelected) {
    var data = customWorkflowParameters(); //method MUST be implemented by _inFoobarAnalysis.gsp
    data.push({name: 'workflow', value: workflowSelected});
    return data;
}

/**
 *   Checks for general sanity of all parameters and decided which script specific sanity check to call
 *
 *   @return {bool}: returns true if everything is fine, false otherwise
 */
function saneEAE() { // FIXME: somehow check for subset2 to be non empty iff two cohorts are needed
    if (isSubsetEmpty(1) && isSubsetEmpty(2)) {
        alert('No cohorts have been selected. Please drag&drop cohorts to the fields within the "Comparison" tab');
        return false;
    }

    for (var i = 0; i < sanityCheckErrors.length; i++) {
        var sanityCheckError = sanityCheckErrors[i];
        if (sanityCheckError !== '') {
            alert(sanityCheckError);
            return false;
        }
    }
    return customSanityCheck(); // method MUST be implemented by _inFoobarAnalysis.gsp
}

/**
 *
 * @param eae
 * @returns {Array}
 */
function formatData(eae) {
    var data = [];
    for (var i = 0; i < eae.length; i++)
        data.push({
            x: eae[i][0],
            y: eae[i][1]
        })
    return data
}

/**
 *  Method to display a standard png or jpeg image into tm.
 *  The image is retrieved from mongoFS
 * @param imageName
 * @returns {byteArray}
 */
function insertImageFromMongo(imageName, holderName){

    jQuery.ajax({
        url: pageInfo.basePath + '/eae/retieveDataFromMongoFS',
        type: "POST",
        timeout: '600000',
        data: {'FileName': imageName}
    }).done(function(serverAnswer) {
        console.log("I am here")
        var arrayBufferView = new Uint8Array(serverAnswer);
        var blob = new Blob([ arrayBufferView ], { type: "image/jpeg" });
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL(blob);
        $(holderName).attr("src", imageUrl);
        return "Image found"
    }).fail(function() {
       return "Cannot get the Image!"
    });
}

/**
 *   Renders the input form for entering the parameters for a visualization/script
 */
function changeEAEInput(){
    jQuery("#eaeoutputs").html("");

    jQuery.ajax({
        url: pageInfo.basePath + '/eae/renderInputs',
        type: "POST",
        timeout: '600000',
        data: {'workflow': $('#hpcscriptSelect').val()}
    }).done(function(serverAnswer) {
        jQuery("#eaeinputs").html(serverAnswer);
    }).fail(function() {
        jQuery("#eaeinputs").html("Something went wrong in the submission process please contact your system administrator.");
    });

}

/**
 *   Renders the input form for entering the parameters for a visualization/script
 */
function displayDataForStudy(){
    var _t = $('#dataAvailableDiv');
    _t.html("");

    jQuery.ajax({
        url: pageInfo.basePath + '/eae/renderDataList',
        type: "POST",
        timeout: '600000',
        data: {'study': $('#noSQLStudies').val()}
    }).done(function(dataList) {
        _t.append($('<select/>').attr("id", "dataTypeSelect"));
        var _h = $('#dataTypeSelect');
        var dataListJSON= $.parseJSON(dataList);
        $.each(dataListJSON.dataList, function (i, e) {
            _h.append($("<option>")
                .attr("value",e)
                .text(e))});
    }).fail(function() {
        _t.html("Something went wrong in the submission process please contact your system administrator.");
    });

}

/**
 * This function pulls all the available cache records for the user for the select workflow
 * @param currentworkflow - from the available eae workflows
 */
function populateCacheDIV(currentworkflow){
    var _t = $('#mongocachetable');
    _t.empty();
    _t.append($('<tr/>').attr("id", "headersRow"));

    var cacheTableHeaders = ["Query", "Workflow Specific Parameters", "Date", "Status", "Cached Results"];
    var _h = $('#headersRow');
    $.each(cacheTableHeaders, function(i, e){
        _h.append($('<th/>').text(e))
    });

    jQuery.ajax({
        url: pageInfo.basePath + '/mongoCache/retrieveCachedJobs',
        type: "POST",
        data:{workflow: currentworkflow}
        }).done(function(cachedJobs) {
        var jsonCache= $.parseJSON(cachedJobs);

        if(jsonCache.totalCount == 0){
            jQuery("#mongocachetable").hide();
            jQuery("#emptyCache").show();
        }else {
            var date;
            var workflowspecificparameters;
            jQuery("#mongocachetable").show();
            jQuery("#emptyCache").hide();
            $.each(jsonCache.jobs, function (i, e) {
                date = new Date(e.starttime.$date);
                workflowspecificparameters = e.workflowspecificparameters;
                var customname = cacheDIVCustomName(e); //method MUST be implemented by _inFoobarAnalysis.gsp
                _t.append($('<tr/>').append(customname.holder).append(
                    $('<td/>').text(workflowspecificparameters)
                ).append(
                    $('<td/>').text(date)
                ).append(
                    $('<td/>').text(e.status)
                ).append(
                     $('<td/>').append($('<button/>').addClass('flatbutton').attr('data-button', customname.name).on('click',function(){
                        var cacheQuery= $(this).attr('data-button');
                         showWorkflowOutput(currentworkflow, cacheQuery, workflowspecificparameters);
                     }).text("Result"))
                ))
            })
        }
    }).fail(function() {
        jQuery("#cacheTableDiv").html("Something went wrong in the submission process please contact your system administrator.");
    });
}

/**
 *  This method builds the output in tm interface once the result has been retirved from mongo
 * @param currentworkflow
 * @param cacheQuery
 */
function showWorkflowOutput(currentworkflow, cacheQuery, workflowspecificparameters){
    jQuery("#eaeoutputs").html("");

    jQuery.ajax({
        url: pageInfo.basePath + '/mongoCache/retrieveSingleCachedJob',
        type: "POST",
        data: prepareDataForMongoRetrievale(currentworkflow, cacheQuery, workflowspecificparameters) //method MUST be implemented by _inFoobarAnalysis.gsp
    }).done(function(cachedJob) {
        var jsonRecord= $.parseJSON(cachedJob);
        // The method buildOutput must be implemented by _inFoobarAnalysis.gsp
        // this enables us to build custom outputs for each workflow
        buildOutput(jsonRecord);
        }
    )
}


/**
 * Generic NoSQL workflow trigger
 * @returns {boolean}
 */
function runNoSQLWorkflow(){

    if(!customSanityCheck()){ // Must be implemented by _inFoobarAnalysis.gsp
        return false;
    }

    jQuery.ajax({
        url: pageInfo.basePath + '/eae/runNoSQLWorkflow',
        type: "POST",
        data: prepareNoSQLFormDataEAE(workflowSelected)
    }).done(function(serverAnswer) {
        var jsonAnswer= $.parseJSON(serverAnswer);
        if(jsonAnswer["iscached"] === "NotCached"){
            jQuery("#eaeoutputs").html(jsonAnswer["result"]);
        }else{
            buildOutput($.parseJSON(jsonAnswer["result"]));
        }
    }).fail(function() {
        jQuery("#eaeoutputs").html("Something went wrong in the submission process please contact your system administrator.");
    });
}

/**
 * Generic workflow trigger
 * @returns {boolean}
 */
function runWorkflow(){
    conceptBoxes = [];
    sanityCheckErrors = [];
    register();

    if(!saneEAE()){
     return false;
    }

    // if no subset IDs exist compute them
    if((!(isSubsetEmpty(1) || GLOBAL.CurrentSubsetIDs[1]) || !(isSubsetEmpty(2) || GLOBAL.CurrentSubsetIDs[2])) ) {
        runAllQueries(runWorkflow);
        return false;
    }

    jQuery.ajax({
        url: pageInfo.basePath + '/eae/runWorkflow',
        type: "POST",
        data: prepareFormDataEAE(workflowSelected)
    }).done(function(serverAnswer) {
        var jsonAnswer= $.parseJSON(serverAnswer);
        if(jsonAnswer.iscached === "NotCached"){
            jQuery("#eaeoutputs").html(jsonAnswer.result);
        }else{
            buildOutput($.parseJSON(jsonAnswer.result));
        }
    }).fail(function() {
        jQuery("#eaeoutputs").html("Something went wrong in the submission process please contact your system administrator.");
    });
}


/****************************************************
*                                                   *
*       Crossvalidation Table                       *
*                                                   *
****************************************************/

var gradient = [
    [
        0,
        [0,0,255]
    ],
    [
        50,
        [240,240,240]
    ],
    [
        100,
        [255,0,0]
    ]
];

function gradientTarget(min, max, value) {

    var norm = (max - value) * 100 / (max - min);
    norm = norm <= 0 ? 0.1 : norm;

    var range = [];
    $.each(gradient, function(index, colors) {
        if(norm <= colors[0]) {
            range = [index - 1 , index]
            return false;
        }
    });

    var fc = gradient[range[0]][1];
    var sc = gradient[range[1]][1];
    var tcp = 100 * (gradient[range[0]][0] / 100);
    var scp = 100 * (gradient[range[1]][0] / 100) - tcp;
    var slider_x = 100 * (norm / 100) - tcp;
    var ratio = slider_x / scp;
    var result = colorTarget(sc, fc, ratio);
    return result.join();
}

function colorTarget(up, down, weight) {
    var p = weight;
    var w = p * 2 - 1;
    var w1 = (w / 1 + 1) / 2;
    var w2 = 1 - w1;
    var rgb = [
        Math.round(up[0] * w1 + down[0] * w2),
        Math.round(up[1] * w1 + down[1] * w2),
        Math.round(up[2] * w1 + down[2] * w2)
    ];
    return rgb;
}

function delfation(value) {
    var n = value;
    var c = 0;
    if (n < 0)
        c++;
    n = Math.abs(n);
    while (n >= 10) {
        c++;
        n /= 10;
    }
    return c;
}

function tablePad(el, col) {
    var p = 0;
    var x = null;
    var n = null;
    var table = $('tbody', $(el));
    $('tr>td:nth-of-type(' + col + ')', table).each(function () {
        var v = parseFloat($(this).text());
        var c = delfation(v);
        if (x == null || n == null)
            x = n = v;
        p = c > p ? c : p;
        x = v > x ? v : x;
        n = v < n ? v : n;
    }).each(function () {
        var v = parseFloat($(this).text());
        var d = delfation(v);
        var c = p - d;
        while (c-- > 0)
            $(this).prepend('&nbsp;');
        $(this).prepend($('<span>').css('background-color', 'rgb(' + gradientTarget(n, x, v) + ')'));
    });
}

function tableSort(el) {
    $('th', $(el)).each(function (i) {
        $(this).data({idx: i, dir: 0}).click(function () {
            var h = $(this);
            var idx = h.data('idx');
            var dir = h.data('dir');
            var table = $('tbody', $(el));
            var rows = table.children('tr').detach();
            $('th', $(el)).removeClass('s0 s1');
            h.addClass('s' + ((dir > 0) ? '0' : '1'));

            console.log(dir)
            rows.sort(function(up, down) {

                var u = $('td:nth-of-type(' + (idx + 1) + ')', $(up)).text();
                var d = $('td:nth-of-type(' + (idx + 1) + ')', $(down)).text();
                var pu = parseFloat(u);
                var pd = parseFloat(d);

                if (pu != 'Nan' && pd != 'Nan') {
                    if (dir > 0)
                        return (pu < pd) ? -1 : 1;
                    return (pu > pd) ? -1 : 1;
                }
            });

            if (dir > 0)
                h.data('dir', 0);
            else
                h.data('dir', 1);

            $(rows).each(function(){
                table.append($(this));
            });
        }).append($('<span>').addClass('d').html('&#9662;')).append($('<span>').addClass('u').html('&#9652;'))
    });
}



/*****************************************************
 *                                                   *
 *     D3 Section for workflows                      *
 *                                                   *
 ****************************************************/

function scatterPlot(){
    var margin = {
            top: 10,
            right: 25,
            bottom: 25,
            left: 40
        },
        width = 600,
        height = 400,
        raduis = 4,
        xValue = function(d) {
            return d[0];
        },
        yValue = function(d) {
            return d[1];
        },
        xScale = d3.scale.linear(),
        yScale = d3.scale.linear(),
        xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickSize(6, 1);
    yAxis = d3.svg.axis().scale(yScale).orient("left").tickSize(6, 1);

    function chart(selection) {
        selection.each(function(data) {
            data = data.map(function(d, i) {
                return [xValue.call(data, d, i),
                    yValue.call(data, d, i)
                ];
            });

            xScale
                .domain(d3.extent(data, function(d) {
                    return d[0];
                }))
                .range([0, width - margin.left - margin.right]);

            yScale
                .domain([0, d3.max(data, function(d) {
                    return d[1];
                })])
                .range([height - margin.top - margin.bottom, 0]);

            var svg = d3.select(this).selectAll("svg").data([data]);

            var gEnter = svg.enter().append("svg").append("g");
            gEnter.append("g").attr("class", "points");
            gEnter.append("g").attr("class", "x axis");
            gEnter.append("g").attr("class", "y axis");

            // Update the outer dimensions.
            svg.attr("width", width)
                .attr("height", height);

            var g = svg.select("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            g.select("g.points")
                .selectAll("circles.point")
                .data(data)
                .enter()
                .append("circle")
                .attr("class", "point")
                .attr("r", raduis)
                .attr("transform", function(d) {
                    return "translate(" + xScale(d[0]) + "," + yScale(d[1]) + ")";
                });

            g.select(".x.axis")
                .attr("transform", "translate(0," + yScale.range()[0] + ")")
                .call(xAxis);

            g.select(".y.axis")
                .attr("transform", "translate(0," + xScale.range()[0] + ")")
                .call(yAxis);
        });
    }

    function X(d) {
        return xScale(d[0]);
    }

    function Y(d) {
        return yScale(d[1]);
    }

    chart.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return chart;
    };

    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    chart.x = function(_) {
        if (!arguments.length) return xValue;
        xValue = _;
        return chart;
    };

    chart.y = function(_) {
        if (!arguments.length) return yValue;
        yValue = _;
        return chart;
    };

    return chart;
}









