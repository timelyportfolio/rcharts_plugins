d3.barchart_errors = function module() {
  // initialize variables that will be exposed
  var width = 600,
      height = 600, 
      xvar = 'Estimate',
      yvar = 'variable',
      error = 'Std. Error',
      tval = 't value',
      prob = 'Pr(>|t|)',
      variable = 'variable',
      id = 'coef_plot',
      padding = {
         "top":    40,
         "right":  30,
         "bottom": 60,
         "left":   70
      }

  // functions and variables that don't need to be wrapped in closure
  // jitter, for example.

  // beginning of function to return under namespace
  function barchart_errors(_selection) {
    // begin declartions requiring declaration of exposed variables
    var size = {
      "x":  width - padding.left - padding.right,
      "y": height - padding.top  - padding.bottom
    };

    _selection.each(function(data) {
      // functions and stuff requiring access to data.
      data = _.sortBy(data, function(d) { return -d[xvar]})

      if(_selection.select('.coef_frame').empty()){
        var refitting = false,
        neg = colorbrewer.RdBu[3][0],
        pos = colorbrewer.RdBu[3][2],
        sel = _selection.append('svg')
                    .attr('class', 'coef_frame')
                    .attr('width', width)
                    .attr('height', height),
        tooltip = _selection.append('text')
            .attr('class', 'tooltip')
            .attr('id', 'coef_tooltip')
            .style('opacity', 0),

        g = sel.append('g')
                .attr('id', 'coef_chart')
                .attr('transform', 'translate(' + padding.left + ',' +
                      padding.top + ")");
        g.append('g')
          .attr('class', 'coef_xaxis')
          .attr('transform', 'translate(0, ' + size.y + ')')
        g.append('g').attr('class', ' coef_yaxis')
        g.append('rect')
          .attr("class", 'background')
          .attr('pointer-events', 'all')
          .attr('fill', 'none')
          .attr('height', size.y)
          .attr("width", size.x)
        g.append('svg')
          .attr('class', 'bars')
          .attr('top', 0)
          .attr('left', 0)
          .attr('width', size.x + 'px')
          .attr('height', size.y + 'px')
          .attr('viewBox', "0 0 " + size.x + " " + size.y)


      } 

      var tooltip = _selection.select('.tooltip')
      var refitting = false,
          neg = colorbrewer.RdBu[3][0],
          pos = colorbrewer.RdBu[3][2];
      var g = _selection.select('#coef_chart')
      var x = d3.scale.linear()
                  .range([0, size.x])
                  .domain(d3.extent(_.map(data, 
                          function(d) { 
                            return d[xvar] > 0 ? 
                            d[xvar] + d[error] * 2:
                            d[xvar] - d[error] * 2;})))

      var y = d3.scale.ordinal()
                  .rangeRoundBands([0, size.y], 0.1)
                  .domain(_.map(data, 
                          function(d) { return d[yvar]; }))

      var errorBarArea = d3.svg.area()
          .y(function(d) {return y(d[yvar]) + y.rangeBand()/2; })
          .x0(function(d) {return x(d[xvar] - d[error]); })
          .x1(function(d) {return x(d[xvar] + d[error]); })
          .interpolate("linear");

      var xax = d3.svg.axis()
              .scale(x)
              .orient('bottom')
              .ticks(10)
              .tickSize(-size.y)

      var yax = d3.svg.axis()
              .scale(y)
              .orient('left')
              .tickSize(-size.x),
      xaxis = g.select('.coef_xaxis')
      xaxis.call(xax).selectAll('text')
              .attr('dy', '1.5em')
              .attr('text-anchor', 'middle')
      var yaxis = g.select('.coef_yaxis')

      function transition_time() {return refitting ? 0:1000}

      function tooltip_content(d) {
        return "<p><strong>" + d[variable] + "</strong><br>" + xvar + ": " + d[xvar] + "<br>" + 
              error + ": " + d[error] + '<br>'
      }
      yaxis.transition().duration(transition_time()).call(yax)
            .selectAll('text')
            .attr('x', x(0))
            .attr('dy', '1em')
            .style('font-weight', 'bold')

      function draw_bars() {

        xaxis
            .call(xax)
            .transition().duration(transition_time())
        if(!refitting){
          yaxis
              .transition().duration(transition_time())
              .call(yax)
              .attr('x', x(0))
              .attr('dy', '1em')
        }
        yaxis.selectAll('text')
            .transition().duration(transition_time())
            .attr('x', x(0))
            .attr('dy', '1em')

        var bars = g.select('.bars').selectAll('.bar')
                 .data(data, function(d) { return d[yvar];})

        var bupdate = d3.transition(bars)
            bupdate.select('rect.est')
                   .transition().duration(transition_time())
                   .attr('x', function(d) {
                    return x(Math.min(0, d[xvar]));})
                   .attr('width', function(d) { 
                    return Math.abs(x(d[xvar]) - x(0))})
                   .style('fill', function(d) { return d[xvar] > 0 ? pos:neg})
                   .attr('height', y.rangeBand())
                   .attr('y', function(d) { return y(d[yvar]); })
            console.log(y.rangeBand());
            bupdate.selectAll('rect.est').on('mouseover', function(d,i) {
                      d3.select(this).style('opacity', 0.9);
                        tooltip.transition()
                          .duration(200)
                          .style('opacity', 0.9)
                        tooltip.html(function() { return tooltip_content(d)})
                            .style('left', (d3.mouse(this)[0] +390 + 'px'))
                            .style('top', (d3.mouse(this)[1] -20 + 'px'))
                         })
                      .on('mousemove', function() {
                        tooltip
                            .style('left', (d3.mouse(this)[0] + 30 + 'px'))
                            .style('top', (d3.mouse(this)[1] -20 + 'px'))
                          })
                      .on('mouseout', function() {
                        d3.select(this).style('opacity', 0.6);
                        tooltip.transition().duration(200).style('opacity', 0)
                        })
            bupdate.select('path.error')
                   .transition().duration(transition_time())
                   .attr('d', function(d) { return errorBarArea([d]) })
        var benter = bars.enter().append('g')
                     .attr('class', 'bar')
            benter.call(make_bars)
        var bexit = d3.transition(bars.exit(), 3000)
            bexit.select('rect.est')
                 .attr('width', 0)
                 .remove()
            bexit.select('path.error')
                  .attr('d', function(d) {
                    var tmp = {};
                    tmp[error] = 0;
                    tmp[xvar] = 0;
                    tmp[yvar] = d[yvar];
                    return errorBarArea([tmp])}).remove()
            bexit.remove();
        g.select(".background")
          .call(d3.behavior.zoom().x(x).on("zoom", refit));
      }
      function make_bars(selection) {

        var bar = selection
                     .append('rect')
                     .attr('class', 'est')
            bar.style('opacity', 0)
               .attr('x', function(d) {
                return x(0);})
               .attr('width', 0)
               .attr('height', y.rangeBand())
               .style('fill', function(d) { return d[xvar] > 0 ? pos:neg})
               .transition().duration(transition_time())
               .style('opacity', 0.6)
               .attr('x', function(d) {
                  return x(Math.min(0, d[xvar]));})
               .attr('width', function(d) { 
                  return Math.abs(x(d[xvar]) - x(0))})
               .attr('y', function(d) { return y(d[yvar]); })
        bar.on('mouseover', function(d,i) {
              d3.select(this).style('opacity', 0.9);
                tooltip.transition()
                  .duration(200)
                  .style('opacity', 0.9)
                tooltip.html(function() { return tooltip_content(d)})
                    .style('left', (d3.mouse(this)[0] +390 + 'px'))
                    .style('top', (d3.mouse(this)[1] -20 + 'px'))
                 })
              .on('mousemove', function() {
                tooltip
                    .style('left', (d3.mouse(this)[0] + 30 + 'px'))
                    .style('top', (d3.mouse(this)[1] -20 + 'px'))
                  })
              .on('mouseout', function() {
                d3.select(this).style('opacity', 0.6);
                tooltip.transition().duration(200).style('opacity', 0)
                })
        var errors = selection
                      .append('path')
                      .attr('class', 'error')
        errors.style('opacity', 0.1)
              .style('stroke-width', 5)
              .attr('d', function(d) {
                var tmp = {};
                tmp[error] = 0;
                tmp[xvar] = 0;
                tmp[yvar] = d[yvar];
                return errorBarArea([tmp])})
             .transition().duration(transition_time())
             .attr('d', function(d) { return errorBarArea([d]) })
             .style('stroke', 'black')
             .style('stroke-width', 5)
             .style('opacity', 0.8)

      }
      draw_bars();
      function refit() {
        refitting = true;
        draw_bars();
        refitting = false;
      }
    });
  };
  // getters and setters here.
  barchart_errors.id = function(_x) {
    if(!arguments.length) return id;
    id = _x;
    return barchart_errors;
  }
  barchart_errors.width = function(_x) {
    if(!arguments.length) return width;
    width = _x;
    return barchart_errors;
  }
  barchart_errors.height = function(_x) {
    if(!arguments.length) return height;
    height = _x;
    return barchart_errors;
  }
  barchart_errors.xvar = function(_x) {
    if(!arguments.length) return xvar;
    xvar = _x;
    return barchart_errors;
  }
  barchart_errors.yvar = function(_x) {
    if(!arguments.length) return yvar;
    yvar = _x;
    return barchart_errors;
  }
  barchart_errors.padding = function(_x) {
    if(!arguments.length) return padding;
    padding = _x;
    return barchart_errors;
  }
  barchart_errors.tval = function(_x) {
    if(!arguments.length) return tval;
    tval = _x;
    return barchart_errors;
  }
  barchart_errors.variable = function(_x) {
    if(!arguments.length) return variable;
    variable = _x;
    return barchart_errors;
  }
  barchart_errors.prob = function(_x) {
    if(!arguments.length) return prob;
    prob = _x;
    return barchart_errors;
  }
  return d3.rebind(barchart_errors);
};
