d3.hist_cf = function module() {
  // initialize variables that will be exposed
  var width = 600,
  height = 600, 
  dimension,
  bins = 20, 
  tickFormat = "0.2f",
  tickdiv = 3,
  hist_variable,
  padding = {
     "top":    10,
     "right":  15,
     "bottom": 30,
     "left":   30
  };

  // beginning of function to return under namespace
  function hist_cf(_selection) {
    // begin declartions requiring declaration of exposed variables
    size = {
      "x":  width - padding.left - padding.right,
      "y": height - padding.top  - padding.bottom
    };
    refitting = false;

    _selection.each(function(data, i) {
      // functions and stuff requiring access to data.
      function transition_time() {return refitting ? 0:1000}

      function tooltip_content(d, i) {
        return "<p>" + hist_variable + ": " + d.length + "<br>" + 
              "range: " + d3.min(d) + ' - ' + d3.max(d) + 
              '<br></p>'
      }
      
      function expand_extent(extent, percent, top, bottom) {
        var top = typeof(top) === 'undefined' ? true: top,
        bottom = typeof(bottom) === 'undefined' ? true: bottom,
        percent = typeof(percent) === 'undefined' ? 0.1: percent,
        pad = Math.abs(extent[1] - extent[0]) * percent
        extent = extent
        if(bottom) {
          extent[0] = extent[0] - pad
        }
        if(top) {
          extent[1] = extent[1] + pad
        }
        return extent
      }
      var dimension = data.dim,
      
      hist_variable = data.vname,
      
      tooltip = d3.select(this).append('text')
                  .attr('class', 'tooltip')
                  .attr('id', 'hist_tooltip')
                  .style('opacity', 0),

      bindiv = _selection.append('div')
                          .attr('class', 'form-group')
                          .style('width', size.x + 'px')
                          .style('margin', '0px')
                          .style('padding', '2px')

      bindiv.append('label')
            .attr('for', 'bins')
            .style('margin', '10px')
            .text('no. bins: ' + hist_variable)

      var uniq = _.unique(_.map(dimension.top(Infinity), 
                          function(d) { return d[hist_variable]})),
      oldbin = 0;
      console.log(bins, uniq.length)
      oldbin = bins 
      if(bins > uniq.length) {
        bins = uniq.length
      }
      bindiv.append('input')
            .attr('type', 'number')
            .attr('class', 'form-control')
            .attr('id', 'bins_' + i)
            .style('width', '60px')
            .style('height', '25px')
            .style('float', 'left')
            .style('display', 'inline')
            .style('font-size', '10px')
            .style('margin', '5px')
            .attr('value', bins)
            .on('change', function() {
              bins = $(this)[0].value;
              if(bins > uniq.length) { 
              bins = uniq.length;
              $(this)[0].value = bins;}
              draw_bars(bins);
            })

      var sel = _selection.append('svg')
                  .attr('class', 'hist_frame')
                  .attr('width', width)
                  .attr('height', height),

      g = sel.append('g')
              .attr('id', 'hist_chart')
              .attr('transform', 'translate(' + padding.left + ',' +
                    padding.top + ")");

      g.append('g')
        .attr('class', 'hist_xaxis')

      g.append('g').attr('class', 'hist_yaxis')

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

      var xaxdiv = g.select('.hist_xaxis')
      xaxdiv.call(d3.svg.axis()
                  .scale(d3.scale.linear()).orient('bottom'))
                .selectAll('text')
                .attr('dy', '1em')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(-10,0)rotate(-30)')
                .style('opacity',0)
      var yaxdiv = g.select('.hist_yaxis')
      yaxdiv.call(d3.svg.axis().scale(d3.scale.linear()).orient('left'))
          .selectAll('text')
          .attr('text-anchor', 'middle')
          .style('opacity',0),

      gbrush = sel.append('g').attr('class', 'brush')
                  .attr('id', 'hist_brush')
                  .selectAll('rect').attr('height', size.y)

      function brushed() {
        var extent0 = brush.extent(),
            extent1;

        // if dragging, preserve the width of the extent
        if (d3.event.mode === "move") {
          var d0 = extent0[0],
              d1 = extent0[1]
          extent1 = [d0, d1];
        }

        // otherwise, if resizing, round both dates
        else {
          extent1 = extent0;

          // if empty when rounded, use floor & ceil instead
          if (extent1[0] >= extent1[1]) {
            extent1[0] = Math.floor(extent0[0]);
            extent1[1] = Math.ceil(extent0[1]);
          }
        }

        d3.select(this).call(brush.extent(extent1));
      }
      var x,y, hist_data, tickArray, tmp;

      function draw_bars(bins) { 
        console.log("inside draw_bars " + bins)
        hist_data = _.map(dimension.top(Infinity), function(d) {
          return d[hist_variable]
        }),

        x = d3.scale.linear()
                    .range([0, size.x])
                    .domain(expand_extent(d3.extent(hist_data))),

        tmp = d3.scale.linear()
                .domain([0, parseInt(bins)])
                .range(x.domain()),

        tickArray = d3.range(bins + 1).map(tmp),

        hist_data = d3.layout.histogram()
                      .bins(parseInt(bins))(hist_data);


        y = d3.scale.linear()
                    .range([size.y, 0])
                    .domain(expand_extent(d3.extent(_.map(hist_data, function(d) {
                      return d.y
                    })), 0.1, true, false)),
        xax = d3.svg.axis()
                .orient('bottom')
                .tickSize(4)
                .tickFormat(d3.format(tickFormat))
                .tickValues(tickArray.filter(function(d, i) { return !(i % tickdiv); }))
                .scale(x),

        yax = d3.svg.axis()
                .scale(y)
                .orient('left')
                .tickSize(-size.x)
                .orient('left'),

        brush = d3.svg.brush()
                  .x(x)
                  .extent(x.range())
                  .on('brush', brushed)
        gbrush.call(brush);

        xaxdiv.transition().duration(transition_time())
          .attr('transform', 'translate(0,' + size.y + ')')
          .style('opacity', 1).call(xax)

        yaxdiv.transition().duration(transition_time())
          .attr('transform', 'translate(0,0)')
          .style('opacity', 1).call(yax)

        // make a rank entry in hist_data.

        var bars = g.select('.bars').selectAll('rect.bar')
                 .data(hist_data)

        bars.transition().duration(transition_time())
            .attr('x', function(d) {
              return x(d.x) + 1})
            .attr('width', Math.floor(((size.x)/1.2)/bins) - 2)
            .attr('y', function(d) { return y(d.y)})
            .attr('height', function(d) { return size.y - y(d.y)})

        bars.enter().append('rect')
           .attr('class', 'bar')
           .style('fill', color)
           .style('opacity', 0.4)
           .attr('y', function(d) { return y(0)})
           .attr('x', function(d) {
            return x(d.x) + 1})
           .attr('width', 0)
           .transition().duration(transition_time())
           .attr('y', function(d) { return y(d.y)})
           .style('opacity', 0.4)
           .attr('width', Math.floor(((size.x)/1.2)/bins) - 2)
           .style('stroke', 'black')
           .style('stroke-opacity', 0.4)
           .attr('height', function(d) { return size.y - y(d.y)})

        bars.on('mouseover', function(d) {
            d3.select(this).style('opacity', 0.9)
            tooltip.transition().duration(200)
              .style('opacity', 0.9)
            tooltip.html(function() { return tooltip_content(d)})
              .style('left', (d3.mouse(this)[0] + 30) + 'px')
              .style('top', (d3.mouse(this)[1] - 20)+ 'px')
           })
           .on('mouseout', function(d) {
            d3.select(this).style('opacity', 0.4)
            tooltip.transition().duration(200)
                .style('opacity', 0)
           })
           .on('mousemove', function(d) {
            tooltip.style('left', d3.mouse(this)[0] + 30 + 'px')
              .style('top', (d3.mouse(this)[1] + padding.top)+ 'px')

           })

        bars.exit().transition().duration(transition_time())
           .attr('y', function(d) { return y(0)})
           .attr('x', function(d) {
            return x(d.x)})
           .attr('width', 0)
           .style('opacity', 0)
          .remove() 
      }
      draw_bars(bins)
      bins = oldbin;
    });
  };
  // getters and setters here.
  hist_cf.id = function(_x) {
    if(!arguments.length) return id;
    id = _x;
    return hist_cf;
  }
  hist_cf.width = function(_x) {
    if(!arguments.length) return width;
    width = _x;
    return hist_cf;
  }
  hist_cf.height = function(_x) {
    if(!arguments.length) return height;
    height = _x;
    return hist_cf;
  }
  hist_cf.dimension = function(_x) {
    if(!arguments.length) return dimension;
    dimension = _x;
    return hist_cf;
  }
  hist_cf.color = function(_x) {
    if(!arguments.length) return color;
    color = _x;
    return hist_cf;
  }
  hist_cf.bins = function(_x) {
    if(!arguments.length) return bins;
    bins = _x;
    return hist_cf;
  }
  hist_cf.tickFormat = function(_x) {
    if(!arguments.length) return tickFormat;
    tickFormat = _x;
    return hist_cf;
  }
  hist_cf.hist_variable = function(_x) {
    if(!arguments.length) return hist_variable;
    hist_variable = _x;
    return hist_cf;
  }
  hist_cf.tickdiv = function(_x) {
    if(!arguments.length) return tickdiv;
    tickdiv = _x;
    return hist_cf;
  }
  hist_cf.padding = function(_x) {
    if(!arguments.length) return padding;
    padding = _x;
    return hist_cf;
  }
  d3.rebind(hist_cf);
  return hist_cf;
};