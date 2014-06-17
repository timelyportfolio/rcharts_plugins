d3.sccf = function () {
  // initialize variables that will be exposed
  var width = 600,
      height = 600, 
      id = null,
      size_var = null,
      color_var =  null,
      filter_var =  null,
      xvar =  null,
      yvar = null,
      dtypes = null,
      dimension = null,
      color_scale = null,
      formula = null,
      max_factor = 20,
      coefs = null,
      preds = null, 
      xes = null,
      npredictlines = 5,
      padding = {
         "top":    40,
         "right":  30,
         "bottom": 60,
         "left":   70
      },
      l = null,
      lines = null;
  // functions to establish group from filtered dimension
  function reduceSub(x, y, color, size) { 
    return function(p, v) { 
      p.x -= null; p.y -= null; p.color = null; p.filter = null; 
      p.size = null;
      p._index = null;
      return p; 
    }
  }
  function reduceAdd(x, y, color, size) { 
    return function(p, v) { 
      p.x = v[x]; 
      p.y = v[y]; 
      p.color = v[color]; 
      p.size = v[size];
      p.filter = v[filter_var];
      p._index = v._index;
      return p; 
    }
  }

  function reduceInit() { return {x:null, y:null, 
                              color:null, 
                              filter:null, 
                              _index: null, 
                              size:null} };
  
  // helper functions
  function round(x) {
    return Math.round(x*100)/100
  }

  function expand_extent(extent, percent) {
    percent = typeof(percent) === 'undefined' ? 0.1: percent;
    pad = Math.abs(extent[1] - extent[0]) * percent
    extent[0] = extent[0] - pad
    extent[1] = extent[1] + pad
    return extent
  }

  // simple function to determine slider steps.
  function stepper(range) {
    var spread = range[1] - range[0]
    if(spread < 5) return 0.25
    else if(spread < 100) return 1
    else if(spread < 500) return 5
    else if(spread < 1000) return 10
    else if(spread < 100000) return 20
  }

  function chart_type() { // maybe not needed.
    return dtypes[xvar] + ' ' + dtypes[yvar]
  };

  function jitter(x, factor) {
    factor = typeof(factor)==='undefined' ? 1/Math.sqrt(_.unique(x).length): factor;
    factor = 1/2;
    range = d3.extent(x)
    if (x.length == 0) return x;
    r = d3.extent(x)
    z = Math.abs(r[1] - r[0])
    z = z == 0 ? 1 : z
    if(typeof(amount) === 'undefined') {
      x = _.sortBy(_.map(x, function(d) { 
        return d3.round(d, Math.floor(Math.log(z)/Math.LN10)) ;} 
        ))
      xx = _.unique(x)
      d = _.map(xx.slice(1,xx.length), function(d, i) { return d - xx[i]; })
      d = d.length > 0 ? d3.min(d) : xx!= 0 ? xx/10 : z/10
      amount = factor/5 * Math.abs(d)
    }
    else if (amount == 0) {
        amount = factor * (z/50)
    }
    return function(d) { 
      return d + _.random(-amount, amount, floating=true) 
    }
  }
  registerKeyboardHandler = function(callback) { // also maybe not needed.
    var callback = callback;
    d3.select(window).on("keydown", callback);  
  };

  // beginning of function to return under d3 namespace
  function sccf(_selection) {
    // begin declartions requiring declaration of exposed variables
    var size = {
      "x":  width - padding.left - padding.right,
      "y": height - padding.top  - padding.bottom
    };

    _selection.each(function(data) {

      var jittered,
      x,
      y,
      refitting = false,
      xax = d3.svg.axis().orient('bottom'),
      yax = d3.svg.axis().orient('left'),
      inxgroup = dimension.group()
                        .reduce(reduceAdd(xvar, yvar, color_var, size_var), 
                                reduceSub(xvar, yvar, color_var, size_var), 
                                reduceInit); 

      // keeping it simple with dtypes
      _.forOwn(dtypes, function(v,k) {
        if (_.contains(['integer', 'numeric'], v)) 
          return dtypes[k] = 'numeric';
        if (_.contains(['character', 'factor'], v)) 
          return dtypes[k] = 'factor';
      })

      if(typeof formula != 'undefined'){
        formula = formula.replace(/ /g, '')
        var dep_var = formula.slice(0, formula.search(/~/)),
        indeps = formula.slice(formula.search(/~/) + 1).split('+')
      }

      function jitter_points() {
        points = _.map(inxgroup.all(), function(d) { 
          return [d.value.x, d.value.y, 
                  d.value.color, d.value.filter, d.value.size, d.value._index]; });
        xjit = dtypes[xvar] == 'numeric' ? jitter(_.map(points, function(d) { return d[0]}), 1): function(d) { return d; }
        yjit = dtypes[yvar] == 'numeric' ? jitter(_.map(points, function(d) { return d[1]}), 1): function(d) { return d; }
        jittered = _.sortBy(_.map(points, function(d) { 
          return {x: xjit(d[0]), 
                  y: yjit(d[1]), 
                  x_actual: d[0], 
                  y_actual: d[1],
                  color: d[2],
                  size: d[4],
                  filter: d[3],
                  _index: d[5]}
        }), function(d) { return -d.size;})

        jittered = _.filter(jittered, function(d) { return d.color != null;})
      };
      var size_scale = function(d) { return 3;} // default size of 3

      // mapping size to absolute value of size var
      if(size_var != null && dtypes[size_var] == 'numeric') {
        size_scale = d3.scale.linear()
              .domain(d3.extent(_.map(inxgroup.all(), 
                function(d) { return Math.abs(d.value.size);})))
              .range([2, 15])
      } 
      // for a later date. mapping qualitative var to size scale based
      // on aggregation of a numeric variable.
      // else {
      //   var qrange = d3.scale.quantile().domain([0, 100]).range([0,1,2,3,4])
      //   size_scale = d3.scale.ordinal()
      //         .domain(_.sortBy(_.unique(_.map(inxgroup.all(), 
      //           function(d) { return Math.abs(d[size_var])}))))
      //         .range([0, 15])
      // }

      function update_scale(axis, variable) {
        if("numeric" == dtypes[variable]) {
          scale = d3.scale.linear()
                .range([0, size[axis]])
                .domain(expand_extent(d3.extent(_.map(jittered, 
                  function(d) { return d[axis]; }))))
        } else {
          scale = d3.scale.ordinal()
                .rangeRoundBands([0, size[axis]])
                .domain(_.unique(_.map(jittered, function(d) {
                    return d[axis]
                })))
        }
        return scale;
      }
      function predicting() {
        return (typeof formula !== 'undefined' && _.contains(indeps, xvar)
                   && yvar == dep_var)
      } 
      console.log(predicting())
      // skeleton for scatter plot if it doesn't exist.
      if(_selection.select('.frame').empty()){

        var frame = _selection.append('svg')
                  .attr('class', 'frame')
                  .attr('width', width)
                  .attr('height', height)

        frame.append('text')
            .attr('id', 'formula_title')
            .attr('x', (size.x/2 + padding.left) + 'px')
            .attr('y', 20 + 'px')
            .style('font-size', '20px')
            .attr('text-anchor', 'middle')

        var plot = frame.append('g')
                    .attr('id', 'plot')
                    .attr('transform', 'translate(' + padding.left + 
                      "," + padding.top + ')')

        plot.append('g')
            .attr('id', 'yaxis'),
        plot.append('g')
            .attr('id', 'xaxis')
            .attr('transform', 'translate(0,' + size.y + ')'),
        plot.append("rect")
              .attr("class", "background")
              .attr("pointer-events", "all")
              .attr("fill","none")
              .attr("width", width)
              .attr("height", height),

        tooltip = d3.select('#' + id).insert("text", ".frame")
                    .attr("class", "tooltip")
                    .style("opacity", 0);

        plot.append('svg')
            .attr('class', 'circles')
            .attr('top', 0)
            .attr('left', 0)
            .attr('width', size.x)
            .attr('height', size.y)
            .attr('viewBox', "0 0 " + size.x + " " + size.y)
        plot.append('text')
            .attr('class', 'x title')
            .attr('x', size.x / 2)
            .attr('y', size.y + padding.top)
            .attr('text-anchor', 'middle')
        plot.append('text')
            .attr('class', 'y title')
            .attr('transform', 'rotate(-90)')
            .attr('x', -size.y/2)
            .attr('y', -padding.left/2)
            .attr('text-anchor', 'middle')
        }
      // prediction controls
      if(predicting()) {
        if(d3.select('#prediction-table').empty())
          {d3.select('#controls').append('div')
                          .attr('id', 'prediction-table')}
        if(d3.select('.paths').empty()){
          lines = d3.select('#plot .circles')
                  .insert('g', 'circle')
                  .attr('class', 'paths')
        } else {
          lines = d3.select('#plot .circles .paths')
        }
      }
      function tooltip_content(d) {
        var xcontent = _.isString(d.x_actual) ? d.x_actual: round(d.x_actual),
        ycontent = _.isString(d.y_actual) ? d.y_actual: round(d.y_actual)
        return "<p>".concat(xvar, ": ", xcontent,"<br>",
        yvar ,": " , ycontent , "<br>" ,
        color_var , ": " , d.color , "<br>" ,
        size_var , ": ", d.size, "<br>",
        filter_var , ": " , d.filter, "</p>")
      }

      // fixed random numbers to apply to points when jittering about ordinal scale
      var noise = _.map(_.range(inxgroup.all().length), 
                        function() {return _.random(-0.5, 0.5)})

      function place(axis, scale, i) {
        return function(d) {
            pos = scale(d[axis]) + (scale.rangeRoundBands ? (scale.rangeBand()/2 + noise[i] * scale.rangeBand()*0.5): 0)
            return pos
            }
      }

      function transition_time() {return refitting ? 0:1000}

      function draw_chart() {

        var plot = _selection.select('#plot')
        xax.tickSize(-size.y).scale(x);
        yax.tickSize(-size.x).scale(y);
        d3.select('#xaxis')
          .transition().duration(transition_time())
          .call(xax)
        d3.select('#yaxis')
          .transition().duration(transition_time())
          .call(yax)
        grid('x');
        grid('y');

        if(!refitting){
          var ytitle = _selection.select('.y.title'),
          xtitle = _selection.select('.x.title')
          if(ytitle.text() != yvar){
          ytitle.transition().duration(500)
            .style('opacity', 0)
            .transition().duration(500)
            .style('opacity', 1)
            .text(yvar)
          }
          if(xtitle.text() != xvar) {
            xtitle.transition().duration(500)
              .style('opacity', 0)
              .transition().duration(500)
              .style('opacity', 1)
              .text(xvar)
          }
        }
        circles = plot.select('.circles')
                    .selectAll('circle')
                    .data(jittered, function(d) { return d._index;})
        circles.transition().duration(transition_time())
          .attr('index', function(d) { return d._index; })
          .attr('cx', function(d,i) { return place('x', x, i)(d)})
          .attr('cy', function(d,i) { return place('y', y, i)(d)})
          .attr('fill', function(d) { return color_scale(d.color)})
          .attr('r', function(d) { return size_scale(Math.abs(d.size));})
        circles.enter().append('circle')
          .attr('index', function(d) { return d._index; })
          .attr('cx', 0)
          .attr('cy', size.y)
          .attr('r', 1)
          .attr('fill', function(d) { return color_scale(d.color)})
          .transition().duration(transition_time())
          .attr('cx', function(d,i) { return place('x', x, i)(d)})
          .attr('cy', function(d,i) { return place('y', y, i)(d)})
          .transition().duration(transition_time())
          .attr('r', function(d) { return size_scale(Math.abs(d.size));})

        circles.exit()
              .transition().duration(transition_time())
              .attr('cx', x(0))
              .attr('cy', y(0))
              .style('fill-opacity', 0)
              .remove()

        circles.on("mouseover", function(d) {
            tooltip.transition()
                 .duration(200)
                 .style("opacity", .9);
            tooltip.html(function() { return tooltip_content(d)})
                     .style("left", (d3.mouse(this)[0] + 90) + "px")
                     .style("top", (d3.mouse(this)[1] - 50) + "px");
                  })
              .on("mouseout", function(d) {
                    tooltip.transition()
                         .duration(100)
                         .style("opacity", 0)
                       })

      if(chart_type() == 'numeric numeric'){
          d3.select(".background").call(d3.behavior.zoom().x(x).y(y).on("zoom", refit));
        } else if (dtypes[xvar] == 'numeric'){
          d3.select(".background").call(d3.behavior.zoom().x(x).on("zoom", refit));
        } else if (dtypes[yvar] == 'numeric'){
          d3.select(".background").call(d3.behavior.zoom().y(y).on("zoom", refit));
        } else {
          d3.select(".background").call(d3.behavior.zoom().on('zoom', null));
        }
      }

      function grid(axis){
        var tx = function(d) { 
          return "translate(" + x(d) + ",0)"; 
        },
        ty = function(d) { 
          return "translate(0," + y(d) + ")";
        },
        // also good for manually drawing gridlines
        stroke = function(d) { 
          return d ? "#ccc" : "#666";  
        }
        plot = _selection.select("#plot .circles"),
        variable = axis == 'x'? xvar: yvar;
        if(dtypes[variable] == 'numeric'){
          var grid_data = axis == 'x' ? x.ticks(): y.ticks()
          position = axis == 'x' ? tx: ty,
          xy = axis == 'x' ? 'y':'x',
          g = plot.selectAll('g.' + axis)
              .data([0])
          g.attr('class', axis)
                  .style('opacity', 1)
                  .attr('transform', position)
                  .attr('stroke', stroke)
                  .attr(xy + '1', 0)
                  .attr(xy + '2', size[xy])
          g.enter().append('g')
                  .style('opacity', 1)
                  .attr('class', axis)
                  .attr('transform', position)
                  .append('line')
                  .attr('stroke', stroke)
                  .attr(xy + '1', 0)
                  .attr(xy + '2', size[xy])
            
          } else {
            g = plot.selectAll('g.' + axis)
            g.style('opacity', 0)


          }
        }

      // get some data about the model variables
      if(typeof formula !== 'undefined') {
        var numbers = _.filter(indeps, function(d) { return dtypes[d] == 
          'numeric'})
        var quintiles = _.zipObject(numbers, _.map(numbers, function(d) {
          return _.sortBy(_.map(dimension.top(Infinity), function(e) {
            return e[d];
          }))
        }))
        quintiles = _.zipObject(_.keys(quintiles), _.map(_.keys(quintiles), function(d) {
          return [d3.min(quintiles[d]),
                  d3.quantile(quintiles[d], 0.1),
                  d3.quantile(quintiles[d], 0.3),
                  d3.quantile(quintiles[d], 0.5),
                  d3.quantile(quintiles[d], 0.7),
                  d3.quantile(quintiles[d], 0.9),
                  d3.max(quintiles[d])]
        }))
      }
      // if a formula exists, make a table of selects and sliders
      // to draw fit lines based on xvar
      function predictions(sel, step) {
        var predictors = _.filter(indeps, function(d) { return d != xvar;})
        sel.append('div')
           .attr('class', 'factor')
           .selectAll('div')
            .data(_.filter(predictors, function(d) { return dtypes[d] == 
              'factor';}))
          .enter().append('div')
          .each(function(d,i) {
            d3.select(this).append('label').text(d)
            d3.select(this).append('select')
            .attr('class', function(d) { return 'pred ' + d;})
            .each(function(d, i) {
              d3.select(this).attr('id', d)
              var options = _.unique(_.map(dimension.top(Infinity), 
                      function(r) { return r[d];} ))
              d3.select(this).selectAll('option')
                .data(options)
                .enter().append('option')
                .attr('selected', function(d,i) { 
                  return step % options.length == i  ? 'selected': null})
                .attr('value', function(d, i) { return d; })
                .text(function(d) { return d;})
            })
            .on('change', make_predictions_lm)
          })
        sel = sel.append('div').attr('class', 'numeric')
                .selectAll('div')
                .data(_.filter(predictors, function(d) 
                     { return dtypes[d] != 'factor'; }))
            .enter().append('div')
            .each(function(d, i) {
              d3.select(this).attr('id', d)
                  .attr('class', function(e) { return "pred numeric " + e; })
              var vrange = expand_extent(d3.extent(_.map(dimension.top(Infinity), function(r) { return parseFloat(r[d]);})))
              d3.select(this.parentNode).insert('label', '#' + d).text(d)
              $("#pred" + step + " .pred.numeric." + d).slider({min:vrange[0], 
                max:vrange[1], step:stepper(vrange), value: quintiles[d][step],
                change: make_predictions_lm})
              $('.pred.numeric.' + d).width(200)
            })
      }


      function inner_prod(pred) {
        return d3.sum(_.map(_.keys(pred), function(d) {
          if(dtypes[d] == 'numeric'){
            return $(pred[d][0]).slider('value') * coefs[d]['Estimate']
          } else if (dtypes[d] == 'factor'){
            return fetch_coef(d, pred[d][0].value);
          }
        })) + (coefs.hasOwnProperty('(Intercept)') ? coefs['(Intercept)']['Estimate']:0);
      }

      function make_predictions_lm() {
        if(predicting()){
          var formula_title = d3.select('#formula_title')
                                .text(formula)
                                .transition().duration(1000)
                                .style('opacity', 1);
          preds = d3.selectAll('#prediction-table .well.pred')[0],
          ids = _.map(preds, function(d) { return d.id; })
          preds = _.zipObject(ids, 
                      _.map(preds, function(d) { 
                        return _.groupBy(d3.select(d).selectAll('.pred')[0],
                                         function(x) { return x.id;})}))
          if(dtypes[xvar] == 'numeric'){
            var tmp_scale = d3.scale.linear()
                        .range(x.domain())
                        .domain([0,99])
            xes = _.map(d3.range(100), function(d) { 
              return tmp_scale(d);})
          } else {
            xes = x.domain()
          }
          preds = _.map(_.keys(preds), function(d) {
                                  return {'key': d, 'v':inner_prod(preds[d])};});
          update_lines(preds, xes);
          } else {
          // clean up modeling ui and elements if not needed.
            _selection.selectAll('.paths')
                  .transition().duration(1000)
                  .style('opacity', 0).remove()
            d3.select('#prediction-table')
              .transition().duration(1000)
              .style('opacity', 0).remove()
            d3.select('#formula_title')
                .transition().duration(1000)
                .style('opacity', 0);
          }
        }
      // different colors for fit lines.
      var path_colors = _.zipObject(_.map(d3.range(npredictlines),
                                    function(d) { return 'pred' + d;}),
                        _.map(d3.range(npredictlines), function(d) {
                          return colorbrewer.Dark2[8][d%8];
                        }))

      // factor variables come in the json as the variable name plus the 
      // actual value with no space. If it is the base case, 
      // it will not be found. catching that and returning 0
      function fetch_coef(coef, x) {
        return coefs.hasOwnProperty(coef + x) ? coefs[coef + x]['Estimate']:0
      }
      var nlines = lines.selectAll('path')

      function update_lines(preds, xes) {
        if(dtypes[xvar] == 'numeric') {
          nlines.selectAll('path').data(preds)
          nlines
            .transition().duration(transition_time())
              .attr('d', function(d) { return l(_.map(xes, function(x) {
                  return [x, x*coefs[xvar]['Estimate'] + d.v]}))})
          nlines.enter().append('path')
                  .attr('d', function(d) { return l(_.map(xes, function(x) {
            return [x, x*coefs[xvar]['Estimate'] + d.v]}))})
                  .style('opacity', 0)
                  .transition().duration(1500)
                  .style('opacity', 0.4)
                  .style('stroke-width', 5)
                  .style('stroke', function(d) { return path_colors[d.key]})
            nlines.on('mouseover', function() {
                    d3.select(this).style('opacity', 0.8)
                  })
                  .on('mouseout', function() {
                          d3.select(this).style('opacity', 0.4)
                        })
          nlines.exit().transition().duration(1000)
              .attr('d', l([[1,0],[0,0]]))
              .style('opacity', 0)
              .transition().duration(1000)
              .remove()
        } else {
          l = d3.svg.line()
                .x(function(d,i) { 
                  return x(d[0])+ x.rangeBand()/2 + (x.rangeBand()*(i==0?-0.45:0.45))})
                .y(function(d) { return y(d[1])})
                .interpolate('basis')
          preds = _.map(xes, function(x) {
            return _.map(_.keys(preds), function(d) {
              return {data: [[x, preds[d].v + fetch_coef(xvar,x)],
                [x, preds[d].v + fetch_coef(xvar,x)]],
                key: 'pred' + d}
            })
          })
          
          nlines.selectAll('path').data(_.flatten(preds))
          nlines.transition().duration(transition_time())
                    .transition().duration(transition_time())
                    .attr('d', l(d.data))
                    .style('opacity', 0.4)
                    .style('stroke-width', 5)
                    .style('stroke', function(d) { return path_colors[d.key]})
          nlines.enter().append('path')
                    .attr('d', l([[1,0],[0,0]]))
                    .style('opacity', 0)
                    .transition().duration(transition_time())
                    .style('opacity', 0.4)
                    .attr('d', l(d.data))
                    .style('stroke-width', 5)
                    .style('stroke', function(d) { return path_colors[d.key]})
          nlines.on('mouseover', function() {
                  d3.select(this).style('opacity', 0.8)
                })
                .on('mouseout', function() {
                        d3.select(this).style('opacity', 0.4)
                      })
        nlines.exit().transition().duration(1000)
            d3.select(this)
            .attr('d', l([[1,0],[0,0]]))
            .style('opacity', 0)
            .remove()
        }
      }
      function update_ui() {
        // add modeling UI and setup scales / elements
        if(predicting()){
          l = d3.svg.line()
                .x(function(d) { return x(d[0])})
                .y(function(d) { return y(d[1])})
                .interpolate('basis')
          d3.selectAll('#prediction-table div')
              .remove()
          var preds = d3.select('#prediction-table').selectAll('div')
                        .data(d3.range(npredictlines))
                        .enter()
                        .append('div')
                        .attr('class', 'well pred')
                        .attr('id', function(d) { return 'pred' + d })
                        .each(function(d, i) { 
                          d3.select(this).style('padding-top', '3px')
                          d3.select(this)
                            .append('div')
                            .style('width', "50px")
                            .style('height', '15px')
                            .style('float', 'right')
                            .style('background-color', path_colors['pred' + i])
                          d3.select(this).call(predictions, i)
                        })
                        .style('opacity', 0)
                        .transition().duration(500)
                        .style('opacity', 1)
        } 
        if(!predicting()){
          // clean up modeling ui and elements if not needed.
          _selection.selectAll('.paths path')
                .transition().duration(1000)
                .style('opacity', 0).remove()
          d3.select('#prediction-table')
            .transition().duration(1000)
            .style('opacity', 0).remove()
        }
      }

      function update_chart() {
          jitter_points();
          x = update_scale('x', xvar);
          y = update_scale('y', yvar);
          y.domain(y.domain().reverse());
          draw_chart();
          update_ui();
          make_predictions_lm();
      }

      function refit() {
        refitting = true;
        draw_chart();
        make_predictions_lm();
        grid('x');
        grid('y');
        refitting = false;
      }
      // handle empty data // doesn't work.
      if(jitter.length) {
        update_chart();
      } else {
        plot = _selection.select('#plot')
        plot.select('.circles').selectAll('circle path')
            .transition().duration(1000)
            .style('opacity', 0)
            .remove()
      }
    });
  };

  sccf.id = function(_x) {
    if(!arguments.length) return id;
    id = _x;
    return sccf;
  }
  sccf.width = function(_x) {
    if(!arguments.length) return width;
    width = _x;
    return sccf;
  }
  sccf.height = function(_x) {
    if(!arguments.length) return height;
    height = _x;
    return sccf;
  }
  sccf.xvar = function(_x) {
    if(!arguments.length) return xvar;
    xvar = _x;
    return sccf;
  }
  sccf.yvar = function(_x) {
    if(!arguments.length) return yvar;
    yvar = _x;
    return sccf;
  }
  sccf.color_var = function(_x) {
    if(!arguments.length) return color_var;
    color_var = _x;
    return sccf;
  }
  sccf.size_var = function(_x) {
    if(!arguments.length) return size_var;
    size_var = _x;
    return sccf;
  }
  sccf.filter_var = function(_x) {
    if(!arguments.length) return filter_var;
    filter_var = _x;
    return sccf;
  }
  sccf.dtypes = function(_x) {
    if(!arguments.length) return dtypes;
    dtypes = _x;
    return sccf;
  }
  sccf.padding = function(_x) {
    if(!arguments.length) return padding;
    padding = _x;
    return sccf;
  }
  sccf.color_scale = function(_x) {
    if(!arguments.length) return color_scale;
    color_scale = _x;
    return sccf;
  }
  sccf.dimension = function(_x) {
    if(!arguments.length) return dimension;
    dimension = _x;
    return sccf;
  }
  sccf.formula = function(_x) {
    if(!arguments.length) return formula;
    formula = _x;
    return sccf;
  }
  sccf.coefs = function(_x) {
    if(!arguments.length) return coefs;
    coefs = _x;
    return sccf;
  }

  return  d3.rebind(sccf);
};
