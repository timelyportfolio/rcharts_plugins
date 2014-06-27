d3.stackbar = function module() {
  // initialize variables that will be exposed
  var height = 600, 
      width,
      barwidth = 30,
      data,
      id,
      v1, 
      color_scale = d3.scale.category10(),
      size_var,
      factors,
      v2,
      padding = {
         "top":    5,
         "right":  30,
         "bottom": 60,
         "left":   70
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


  // beginning of function to return under namespace
  function stackbar(_selection) {
    // begin declartions requiring declaration of exposed variables

    _selection.each(function(d) {
      
      // make group based on stackvar,

      v2 = _.filter(factors, function(d) { return d != v1})[0]


      var expand = false;
      var stack_group = 'stacked',
      layers, GroupMax, StackMax, xes;

      function update_layers(){
        layers = d3.nest()
                  .key(function(d) { return d[v2] ;}) // layers
                  .key(function(d) { return d[v1] ;}) // x axis variable
                  .rollup(function(d) {
                    return {
                      v2: d[0][v2],
                      x: d[0][v1],
                      count: d.length,
                      w: d3.sum(_.map(d,function(x) { return x[size_var];}))
                          };})
                  .entries(data.top(Infinity)),

        // getting all possible x values
        xes = _.unique(_.flatten(_.map(layers, 
                            function(d) {
                              return _.map(d.values, 
                                           function(d) { return d.key;})}))),
        missing_entries = _.zipObject(_.map(layers, function(d) { return d.key;}), _.map(_.range(layers.length), function(d) { return [];}))
        _.map(layers, function(d) {
          _.map(d.values, function(x) { 
            missing_entries[d.key].push(x.key)
          })
          missing_entries[d.key] = _.difference(xes, missing_entries[d.key])
        })

        _.mapValues(missing_entries, function(v, k) {
          _.map(layers, function(d, i, layers) {
            if(d.key == k){
              _.map(v, function(val) {
                d.values.push({key:val, values:{x:val, v2:k, count:0, w:0}})
              })
            }
          })
        })
        _.forEach(layers, function(d, i, layers) { d.values = _.map(d.values, function(x) { return x.values;}) })
        _.forEach(layers, function(d, i, layers) {
          d.values = _.sortBy(d.values, function(x) { return x.x;})
        })

        var stack = d3.layout.stack()
                  .x(function(d) { return d.x; })
                  .y(function(d) { return d.count; })
                  .values(function(d) { return d.values; })
        stack = expand ? stack.offset('expand'): stack
        layers = stack(layers)
        GroupMax = d3.max(layers, function(layer) {
          return d3.max(layer.values, function(l) { return l.y});
        })
        StackMax = d3.max(layers, function(layer) {
          return d3.max(layer.values, function(l) { return l.y + l.y0; });
        })
      }
      update_layers()

      width;

      if(typeof width === 'undefined'){
        var size = {
          "x":  barwidth*layers[0].values.length,
          "y": height - padding.top  - padding.bottom
        }
        width = barwidth*layers[0].values.length + padding.left + padding.right
      } else {
        var size = {
          "x":  width - padding.left - padding.right,
          "y": height - padding.top  - padding.bottom
        }
      }


      // scales
      var x = d3.scale.ordinal()
              .domain(_.sortBy(xes))
              .rangeRoundBands([0, size.x], .08);

      var y = d3.scale.linear()
          .domain(expand_extent([0, StackMax], 0.1, true, false))
          .range([size.y, 0]);

      var xAxis = d3.svg.axis()
          .scale(x)
          .tickSize(-size.y)
          .tickPadding(6)
          .orient("bottom");

      var yAxis = d3.svg.axis()
          .scale(y)
          .tickSize(-size.x)
          .tickPadding(6)
          .orient("left");

      if(_selection.select('.frame').empty()){

        var buttons = _selection.append('div')
                  .attr('class', 'btn-group-vertical')
                  .style('float', 'left')
                  .append('div')
                  .attr('id', 'buttons'),
        choose_factor = buttons.append('div')
                        .style('padding-bottom', '5px')
                        .append('select')
                        .attr('id', 'factor_' + id)
                        .attr('class', 'btn')
        choose_factor.selectAll('option')
          .data(factors)
          .enter().append('option')
          .text(_.identity)
          .attr('value', _.identity)
          .attr('selected', function(d) {
            return d == v2 ? "selected": null;
          })
        choose_factor.on('change', function(){
          v2 = this.value
          draw_chart();
        })
        var choose_sort = buttons.append('div')
                        .style('padding-bottom', '5px')
                        .append('select')
                        .attr('id', 'choose_sort_' + id)
                        .attr('class', 'btn')

        choose_sort.selectAll('option')
              .data([v1, v2])
              .enter().append('option')
              .attr('selected', function(d, i) {
                return i == 0 ? "selected":null;})
              .attr('value', _.identity)
              .text(_.identity)
        var sort_button = buttons.append('div')
                        .style('padding-bottom', '5px')
                        .append('select')
                        .attr('id', 'sort_button_' + id)
                        .style('padding-bottom', '5px')
                        .attr('class', 'btn')
        sort_button.call(make_sort_button, v1)
        var stack_button = buttons.append('div')
                          .style('padding-bottom', '5px')
                          .append('select')
                          .attr('id', 'stack_group_' + id)
                        .attr('class', 'btn')
        stack_button.selectAll('option')
            .data(['stacked', 'grouped'])
            .enter().append('option')
            .text(_.identity)
            .attr('selected', function(d,i) { if(i==0) return "selected"})
            .attr('value', _.identity)
        stack_button.on('change', function() {
          stack_group = this.value;
          draw_chart()
        })
        var expand_button = buttons.append('div')
                          .style('padding-bottom', '5px')
                          .append('select')
                          .attr('id', 'expand_' + id)
                          .attr('class', 'btn')
        expand_button.selectAll('option')
            .data(['levels', 'expand'])
            .enter().append('option')
            .text(_.identity)
            .attr('selected', function(d,i) { if(i==0) return "selected"})
            .attr('value', _.identity)
        expand_button.on('change', function() {
          expand = this.value == 'expand' ? true: false;
          update_layers()
          draw_chart()
        })
        var svg = _selection.append('div')
            .attr('id', id)
            .style('position', 'relative')
            .style('float', 'right')
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr('class', 'frame')
          .append("g")
            .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + size.y + ")")
        svg.append("g")
            .attr("class", "y axis")
        var tooltip = _selection.select('#' + id).append('text')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .attr('id', 'stack_tooltip_' + id)
            .style('opacity', 0)
      } else {
        var svg = _selection.select('.frame g'),
        buttons = _selection.select('#buttons'),
        sort_button = _selection.select('#sort_button_' + id),
        tooltip = _selection.select("#stack_tooltip_" + id)
      }
      _selection.select("#choose_sort_" + id)
          .on('change', function() {
            _selection.select("#sort_button_" + id)
                .call(make_sort_button, this.value)
      })

      function tooltip_content(d) {
        return "<p><strong>" + v1 + "</strong>: " + 
        d.x + "<br>" + v2 + ": " + d.v2 + 
        '<br>count: ' + d.count
      }

      function make_sort_button(sel, variable){

        var button_data = variable == v1 ? ['ordered', 'ascending', 'descending']:_.map(layers, function(d) { return d.key;})

        var b = sel.selectAll('option')
                  .data(button_data)

        b.attr('selected', function(d,i) { return i == 0 ? "selected": null;})
          .attr('value', function(d) { return d; })
          .text(function(d) { return d;})

        b.enter().append('option')
          .attr('selected', function(d,i) { return i == 0 ? "selected": null;})
          .attr('value', function(d) { return d; })
          .text(function(d) { return d;})
        b.exit().remove()

        sort_button
          .on('change', function() {
            sort_layers(this.value);
          })
      }

      function sort_layers(variable) {
        console.log($("#choose_sort_" + id)[0].value)
        if($("#choose_sort_" + id)[0].value == v1){
          // object that has all x variables and their sums
          var agg = _.zipObject(xes, _.map(xes, function(x) {
                  return d3.sum(_.flatten(_.map(layers, function(l) {
                    return _.map(l.values, function(v) {
                      return v.x == x ? v.count: 0;
                    })
                  })))
                }))
          console.log(agg)

          switch(variable)
          {
          case  'ordered':
            x.domain(_.sortBy(x.domain()))
            break
          case "ascending":
            x.domain(_.sortBy(x.domain(), function(d) { return agg[d]}))
            break
          case "descending":
            x.domain(_.sortBy(x.domain(), function(d) { return -agg[d]}))
            break
          }
        } else {
          // var order = _.map(layers, function)
        }
        draw_chart('resort');
      }

      var transition = true;
      function transition_duration() {return transition ? 1000: 0};

      function draw_chart(resort) {

        if(typeof resort === 'undefined'){
          update_layers()
        }
        console.log(typeof resort)
        update_axes();
        layer = svg.selectAll(".layer")
            .data(layers)
          
        layer
          .transition().duration(transition_duration())
          .style("fill", function(d) { return colors(d.key); })

        layer.enter().append("g")
          .attr("class", "layer")
          .style("fill", function(d) { return colors(d.key); });

        layer.exit()
          .transition().duration(transition_duration())
          .style('opacity', 0)
          .remove()

        rect = layer.selectAll("rect")
            .data(function(d) { return d.values; })

        switch(stack_group){
          case "stacked":
            rect.transition().duration(transition_duration())
              .attr("x", function(d) { return x(d.x); })
              .attr("y", function(d) { return y(d.y0 + d.y); })
              .attr("height", function(d) { return y(d.y0)-y(d.y0 + d.y); })
              .attr("width", x.rangeBand())
          break;
          case "grouped":
            rect.transition()
                .duration(500)
                .delay(function(d, i) { return i * 10; })
                .attr("x", function(d, i, j) { return x(d.x) + 
                  x.rangeBand() / layers.length  * j; })
                .attr("width", x.rangeBand() / layers.length)
              .transition()
                .attr("y", function(d) { return y(d.y); })
                .attr("height", function(d) { return size.y - y(d.y); });
        }

        rect.enter().append("rect")
            .attr("x", function(d) { return x(d.x); })
            .attr("y", size.y)
            .attr("width", x.rangeBand())
            .attr("height", 0)
            .style('opacity', 0.4)
          .transition().duration(transition_duration())
            .delay(function(d, i) { return i * 10; })
            .attr("y", function(d) { return y(d.y0 + d.y); })
            .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); });

        rect.on('mouseover', function(d) {
          d3.select(this).style('opacity', 0.8)
            tooltip.transition()
              .duration(200)
              .style('opacity', 0.9)
            tooltip.html(function() { return tooltip_content(d)})
                .style('left', (d3.mouse(this)[0] + 80) + 'px')
                .style('top', (d3.mouse(this)[1] - 50) + 'px')
             })
          .on('mousemove', function() {
            tooltip
                .style('left', (d3.mouse(this)[0] + 80) + 'px')
                .style('top', (d3.mouse(this)[1] - 50) + 'px')
              })
          .on('mouseout', function() {
            d3.select(this).style('opacity', 0.4);
            tooltip.transition().duration(200).style('opacity', 0)
            })

        rect.exit()
          .transition().duration(transition_duration())
          .attr("y", size.y)
          .attr("height", 0);

      }
      draw_chart();

      function update_axes(){

        var stack_group = $('#stack_group_' + id)[0].value;

        ymax = stack_group == 'stacked' ? StackMax:GroupMax;
        if(expand){
          y = d3.scale.linear()
              .domain([0, 1])
              .range([size.y, 0]);
        } else {
          y = d3.scale.linear()
              .domain(expand_extent([0, ymax], 0.1, true, false))
              .range([size.y, 0]);
            }

        yAxis.scale(y)
        xAxis.scale(x)

        _selection.select('.x.axis')
          .transition().duration(transition_duration())
          .call(xAxis)
        _selection.select('.y.axis')
          .transition().duration(transition_duration())
          .call(yAxis)
      }

    });
  };
  // getters and setters here.
  stackbar.id = function(_x) {
    if(!arguments.length) return id;
    id = _x;
    return stackbar;
  }
  stackbar.height = function(_x) {
    if(!arguments.length) return height;
    height = _x;
    return stackbar;
  }
  stackbar.width = function(_x) {
    if(!arguments.length) return width;
    width = _x;
    return stackbar;
  }
  stackbar.barwidth = function(_x) {
    if(!arguments.length) return barwidth;
    barwidth = _x;
    return stackbar;
  }
  stackbar.color_scale = function(_x) {
    if(!arguments.length) return color_scale;
    color_scale = _x;
    return stackbar;
  }
  stackbar.v1 = function(_x) {
    if(!arguments.length) return v1;
    v1 = _x;
    return stackbar;
  }
  stackbar.v2 = function(_x) {
    if(!arguments.length) return v2;
    v2 = _x;
    return stackbar;
  }
  stackbar.color_var = function(_x) {
    if(!arguments.length) return color_var;
    color_var = _x;
    return stackbar;
  }
  stackbar.padding = function(_x) {
    if(!arguments.length) return padding;
    padding = _x;
    return stackbar;
  }
  stackbar.size_var = function(_x) {
    if(!arguments.length) return size_var;
    size_var = _x;
    return stackbar;
  }
  stackbar.factors = function(_x) {
    if(!arguments.length) return factors;
    factors = _x;
    return stackbar;
  }
  stackbar.data = function(_x) {
    if(!arguments.length) return data;
    data = _x;
    return stackbar;
  }
  d3.rebind(stackbar);
  return stackbar;
};