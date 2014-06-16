(function() {

  jitter = function (x, range, factor) {
    factor = 1/5;
    if (x.length == 0) return x;
    r = d3.extent(x)
    z = Math.abs(r[1] - r[0])
    z = z == 0 ? 1 : z
    factor = typeof factor !== 'undefined' ? factor : 1;
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

  registerKeyboardHandler = function(callback) {
    var callback = callback;
    d3.select(window).on("keydown", callback);  
  };

  Scatter = function(elemid, options) {
      
    var self = this;
    this.chart = document.getElementById(elemid);
    this.cx = this.chart.clientWidth;
    this.cy = this.chart.clientHeight;
    this.options = options;
    this.dataset = options.dataset;
    this.numeric = _.filter(_.keys(self.options.dtypes), function(d) { return _.contains(['numeric', 'integer'], self.options.dtypes[d]) ;});
    this.factor = _.filter(_.keys(self.options.dtypes), function(d) { 
      return _.unique(_.map(self.dataset, function(r) {
        return r[d];
      })).length < options.max_colors;
     ;})
    this.xvar = options.xvar;
    this.yvar = options.yvar;
    this.color_var = this.factor[0];
    this.chart_type = function() { 
      return self.options.dtypes[self.xvar] + ' ' 
      + self.options.dtypes[self.yvar]
    }

    this.padding = {
       "top":    40,
       "right":  30,
       "bottom": 60,
       "left":   70
    };

    this.size = {
      "x":  this.cx - this.padding.left - this.padding.right,
      "y": this.cy - this.padding.top  - this.padding.bottom
    };

    var buttons = d3.select(this.chart).append('div')
                        .attr('class', 'buttons')
    this.choose_x = buttons.append('select')
                          .attr('id', 'choose_x')
    this.choose_x.on('change', function() { 
      self.xvar = this.value;
      self.changing = true;
      self.axes('x');
      self.redraw()();})

    this.choose_x.selectAll('option')
                .data(_.keys(self.options.dtypes))
               .enter()
                .append('option')
                .attr('selected', function(d) { return d == self.options.xvar ?
                  'selected': null;})
                .attr('value', function(d) { return d; })
                .text(function(d) { return d; })

    this.choose_y = buttons.append('select')
                          .attr('id', 'choose_y')
    this.choose_y.on('change', function() { 
      self.yvar = this.value;
      self.changing = true;
      self.axes('y');
      self.redraw()();})


    this.choose_y.selectAll('option')
                .data(_.keys(self.options.dtypes))
               .enter()
                .append('option')
                .attr('value', function(d) { return d; })
                .attr('selected', function(d) { return d == self.options.yvar ?
                  'selected': null;})
                .text(function(d) { return d; })

    this.choose_color = buttons.append('select')
                          .attr('id', 'choose_color')
                          .on('change', function(d) {
                            self.color_var = this.value;
                            self.changing = true;
                            self.set_colors();
                            self.redraw()();
                          })
    this.choose_color.selectAll('option')
                .data(self.factor)
               .enter()
                .append('option')
                .attr('value', function(d) { return d; })
                .text(function(d) { return d; })

    // drag axis logic
    this.downx = Math.NaN;
    this.downy = Math.NaN;

    this.dragged = this.selected = null;


    this.vis = d3.select(this.chart).append("svg")
        .attr("width",  this.cx)
        .attr("height", this.cy)
        .append("g")
          .attr("transform", "translate(" + this.padding.left + "," + this.padding.top + ")");


    this.plot = this.vis.append("rect")
        .attr("width", this.size.x)
        .attr("height", this.size.y)
        .style("fill", "#FFFFFF")
        .attr("pointer-events", "all")
        .on("mousedown.drag", self.plot_drag())
        .on("touchstart.drag", self.plot_drag())

    this.vis.append("svg")
        .attr("top", 0)
        .attr("left", 0)
        .attr("width", this.size.x)
        .attr("height", this.size.y)
        .attr("viewBox", "0 0 "+this.size.x +" "+this.size.y)
        .attr("class", "line")

    this.vis.append("text")
        .attr("class", "title")
        .text(this.options.title)
        .attr("x", this.size.x/2)
        .attr("dy","-0.8em")
        .style("text-anchor","middle");

    this.vis
        .append("text")
        .attr("class", "y axis")
        .style("text-anchor","middle")
        .attr("transform","translate(" + -40 + " " + this.size.y/2+") rotate(-90)");

    this.vis.append("text")
        .attr("class", "x axis")
        .attr("x", this.size.x/2)
        .attr("y", this.size.y)
        .attr("dy","2.4em")
        .style("text-anchor","middle")

    d3.select(this.chart)
        .on("mousemove.drag", self.mousemove())
        .on("touchmove.drag", self.mousemove())
        .on("mouseup.drag",   self.mouseup())
        .on("touchend.drag",  self.mouseup());

    this.jit = {};
    this.x = d3.scale.linear();
    this.y = d3.scale.linear();

    this.uniques = {x:[], y:[]};
    this.points = _.map(new Array(this.dataset.length), 
      function(d) { return {}});
    this.set_colors();
    this.axes('x');
    this.axes('y');
    this.redraw()();
  };

  Scatter.prototype.set_colors = function() {
    var self = this;
    categories = _.unique(_.map(self.dataset, function(d) { 
      return d[self.color_var];
    }));
    color_dict = {}
    _.map(categories, function(d, i) {
      color_dict[d] = colorbrewer.Dark2[8][i % 8]
    })
    self.points = _.map(self.points, function(d, i) {
      d['color'] = self.dataset[i][self.color_var]
      return d;
    })
    self.colors = color_dict;
  }

  Scatter.prototype.plot_drag = function() {
    var self = this;
    return function() {
      registerKeyboardHandler(self.keydown());
      d3.select('body').style("cursor", "move");
      if (d3.event.altKey) {
        var p = d3.mouse(self.vis.node());
        var newpoint = {};
        newpoint.x = self.x.invert(Math.max(0, Math.min(self.size.x,  p[0])));
        newpoint.y = self.y.invert(Math.max(0, Math.min(self.size.y, p[1])));
        self.points.push(newpoint);
        self.points.sort(function(a, b) {
          if (a.x < b.x) { return -1 };
          if (a.x > b.x) { return  1 };
          return 0
        });
        self.selected = newpoint;
        self.update();
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }    
    }
  };

  Scatter.prototype.jitter = function(vec, axis, extent) {

    var self = this;
    jit = self.uniques[axis].length < self.options.jitter_num;
    if(jit){
      self.jit[axis] =  jitter(vec, extent)
      self[axis].domain(self[axis + 'extent'])
                .range([0, self.size[axis]])
                .ticks(self.uniques[axis].length);
      self.points = _.map(self.points, function(d, i) {
        d[axis] = self.jit[axis](parseFloat(vec[i]));
        return d;
      })
    } else {
      self[axis].domain(self[axis + 'extent'])
                .range([0, self.size[axis]])
                .ticks(10);
      self.points = _.map(self.points, function(d, i) {
        d[axis] = parseFloat(vec[i]);
        return d;
      })
    }
    if(axis == 'y'){
      self[axis].domain(self.yextent.reverse())
              .range([0, self.size[axis]])

    }else {
      self[axis].domain(d3.extent(vec))
                      .range([0, self.size[axis]])
    }
  }

  Scatter.prototype.axes = function(axis) {
    var self = this,
    numbers = ['integer', 'numeric'],
    numeric = _.contains(numbers, self.options.dtypes[self[axis + 'var']]);
    self.uniques[axis] = _.sortBy(_.unique(_.map(self.dataset,
      function(d) { return parseFloat(d[self[axis + 'var']]);}))) 
    self[axis + 'linear'] = numeric;
    if(self[axis + 'linear']){
      self[axis] = d3.scale.linear()
      self[axis + 'extent'] = d3.extent(self.dataset.map(function(d) {
        return parseFloat(d[ self[axis + 'var'] ])
      }));
      self.jitter(_.map(self.dataset,
        function(d) { return parseFloat(d[self[axis + 'var']])}), axis, self[axis + 'extent'])
    self.plot.call(d3.behavior.zoom().x(self.x).y(self.y).on("zoom", self.redraw()));
    } else {
      self.points = _.map(self.points, function(d, i) {
        d[axis] = self.dataset[i][self[axis + 'var']]
        return d;
      })
      self[axis] = d3.scale.ordinal()
                          .domain(self.uniques[axis])
                          .rangeRoundBands([0, self.size[axis]])
    self.plot.call(d3.behavior.zoom()[axis](self[axis]).on("zoom", self.redraw()));
    }
  };

  Scatter.prototype.change_time = function() {
    return this.changing ? 1000:0;
  }

  Scatter.prototype.place = function(axis) {
    self = this;
    return function (d) {
      pos = self[axis](d[axis]) + (self[axis].rangeRoundBands ? (self[axis].rangeBand()/2 + _.random(-0.5, 0.5) * self[axis].rangeBand()*0.5): 0)
      return pos
    }
  }

  Scatter.prototype.update = function() {
    var self = this;
    // scatters = ['integer integer', 'numeric integer', 'integer numeric',
    // "numeric numeric"]
    // var lines = this.vis.select("path").attr("d", this.line(this.points));
    // if(_.contains(scatters, self.chart_type())){

      var circle = self.vis.select("svg").selectAll("circle")
          .data(self.points);

      circle.attr('class', 'update')
          .transition()
         .duration(self.change_time())
          .attr("class", function(d) { return d === self.selected ? "selected" : null; })
          .attr("cx", self.place('x'))
          .attr("cy", self.place('y'))
          .attr('value_y' , function(d) { return d.y})
          .attr('value_x' , function(d) { return d.x})
          .attr('actual_value_y' , function(d, i) { return self.dataset[i][self.yvar]})
          .attr('actual_value_x' , function(d, i) { return self.dataset[i][self.xvar]})
          .attr("r", 3.0)
          .style('fill-opacity', 0.4)
          .style('fill', function(d, i) { 
            return self.colors[d['color']];})
          .style("cursor", "ns-resize")

      circle.enter().append("circle")
          .attr("class", function(d) { return d === self.selected ? "selected" : 'enter'; })
          .attr("cx", self.place('x'))
          .attr("cy", self.place('y'))
          .attr('j_y' , function(d) { return d.y})
          .attr('j_x' , function(d) { return d.x})
          .attr('actual_value_y' , function(d, i) { return self.dataset[i][self.yvar]})
          .attr('actual_value_x' , function(d, i) { return self.dataset[i][self.xvar]})
          .attr("r", 3.0)
          .style('fill-opacity', 0.4)
          .style('fill', function(d, i) { 
              return self.colors[d['color']];
          })
          .style("cursor", "ns-resize")
          .transition()
          .duration(self.change_time())

      self.vis.select('svg').selectAll('circle')
          .on("mousedown.drag",  self.datapoint_drag())
          .on("touchstart.drag", self.datapoint_drag())
      circle.exit()
            .attr('class', 'exit')
          .transition().duration(self.change_time())
            .style('fill-opacity', 0)
            .remove();
      // Add the x-axis label
      xtitle = self.vis.select('.x.axis')
                    .data([self.xvar])
                    .style('fill-opacity', 0)
      xtitle.transition().duration(self.change_time())
            .text(function(d) { return d;})
            .style('fill-opacity', 1)
      xtitle.enter().append('text')
            .text(function(d) { return d ;} )
            .style("fill-opacity", 0)
            .transition().duration(self.change_time())
            .style("fill-opacity", 1)

      ytitle = self.vis.select('.y.axis')
                    .data([self.yvar])
                    .style('fill-opacity', 0)
      ytitle.transition().duration(self.change_time())
            .text(function(d) { return d;})
            .style('fill-opacity', 1)
      ytitle.enter().append('text')
            .text(function(d) { return d ;} )
            .style("fill-opacity", 0)
            .transition().duration(self.change_time())
            .style("fill-opacity", 1)
    // }
    self.changing = false;

    if (d3.event && d3.event.keyCode) {
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
  }
  Scatter.prototype.datapoint_drag = function() {
    var self = this;
    return function(d) {
      registerKeyboardHandler(self.keydown());
      document.onselectstart = function() { return false; };
      self.selected = self.dragged = d;
      self.update();
      
    }
  };

  Scatter.prototype.mousemove = function() {
    var self = this;
    return function() {
      var p = d3.mouse(self.vis[0][0]),
          t = d3.event.touches;
      
      if (self.dragged) {
        self.dragged.y = self.y.invert(Math.max(0, Math.min(self.size.y, p[1])));
        self.update();
      };
      if (!isNaN(self.downx)) {
        d3.select('body').style("cursor", "ew-resize");
        var rupx = self.x.invert(p[0]),
            xaxis1 = self.x.domain()[0],
            xaxis2 = self.x.domain()[1],
            xextent = xaxis2 - xaxis1;
        if (rupx != 0) {
          var changex, new_domain;
          changex = self.downx / rupx;
          new_domain = [xaxis1, xaxis1 + (xextent * changex)];
          self.x.domain(new_domain);
          self.redraw()();
        }
        d3.event.preventDefault();
        d3.event.stopPropagation();
      };
      if (!isNaN(self.downy)) {
        d3.select('body').style("cursor", "ns-resize");
        var rupy = self.y.invert(p[1]),
            yaxis1 = self.y.domain()[1],
            yaxis2 = self.y.domain()[0],
            yextent = yaxis2 - yaxis1;
        if (rupy != 0) {
          var changey, new_domain;
          changey = self.downy / rupy;
          new_domain = [yaxis1 + (yextent * changey), yaxis1];
          self.y.domain(new_domain);
          self.redraw()();
        }
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }
    }
  };

  Scatter.prototype.mouseup = function() {
    var self = this;
    return function() {
      document.onselectstart = function() { return true; };
      d3.select('body').style("cursor", "auto");
      d3.select('body').style("cursor", "auto");
      if (!isNaN(self.downx)) {
        self.redraw()();
        self.downx = Math.NaN;
        d3.event.preventDefault();
        d3.event.stopPropagation();
      };
      if (!isNaN(self.downy)) {
        self.redraw()();
        self.downy = Math.NaN;
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }
      if (self.dragged) { 
        self.dragged = null 
      }
    }
  }

  Scatter.prototype.keydown = function() {
    var self = this;
    return function() {
      if (!self.selected) return;
      switch (d3.event.keyCode) {
        case 8: // backspace
        case 46: { // delete
          var i = self.points.indexOf(self.selected);
          self.points.splice(i, 1);
          self.selected = self.points.length ? self.points[i > 0 ? i - 1 : 0] : null;
          self.update();
          break;
        }
      }
    }
  };

  Scatter.prototype.redraw = function() {
    var self = this;
    return function() {
      var tx = function(d) { 
        return "translate(" + self.x(d) + ",0)"; 
      },
      ty = function(d) { 
        return "translate(0," + self.y(d) + ")";
      },
      stroke = function(d) { 
        return d ? "#ccc" : "#666"; 
      }

      if(self.xlinear){

      // Regenerate x-ticks…
        self.vis.selectAll('.ord_xaxis') 
            .transition().duration(1000)
            .style('opacity', 0)
            .remove()

        var gx = self.vis.selectAll("g.x")
            .data(self.x.ticks(10), String)
            .attr("transform", tx),
            fx = self.x.tickFormat(10);

        gx.select("text")
            .text(fx);

        var gxe = gx.enter().insert("g", "a")
            .attr("class", "x")
            .attr("transform", tx);

        gxe.append("line")
            .attr("stroke", stroke)
            .attr("y1", 0)
            .attr("y2", self.size.y);

        gxe.append("text")
            .attr("class", "axis")
            .attr("y", self.size.y)
            .attr("dy", "1em")
            .attr("text-anchor", "middle")
            .text(fx)
            .style("cursor", "ew-resize")
            .on("mouseover", function(d) { return d3.select(this).style("font-weight", "bold");})
            .on("mouseout",  function(d) { return d3.select(this).style("font-weight", "normal");})
            .on("mousedown.drag",  self.xaxis_drag())
            .on("touchstart.drag", self.xaxis_drag());

          gx.exit().remove();

        } else {
          xaxis = d3.svg.axis()
                    .scale(self.x)
                    .orient('bottom')
                    .ticks(self.uniques.x.length)
          self.vis.select('.ord_xaxis')
                .transition().duration(1000)
                .style('opacity', 0)
                .remove()
          self.vis.append('g')
                  .attr('class', 'ord_xaxis')
                  .attr('transform', 'translate(0,' + self.size.y + ")")
                  .call(xaxis); 
          var gx = self.vis.selectAll('g.x')
                  .data(d3.range(0, self.uniques.x.length))
              gx.attr('class', 'update')
                  .attr('transform', function(d) {
                    return 'translate(' + (self.x.rangeBand()/2 + d * self.x.rangeBand())+ ",0)"
                  })
                  .attr('class', 'x')
          var gxe = gx.enter()
                  .append('g')
                  .attr('class', 'x')
                  .attr('transform', function(d) {
                    return 'translate(' + (self.x.rangeBand()/2 + d * self.x.rangeBand())+ ",0)"
                  })
              gxe.append('line')
                  .attr('y1', 0)
                  .attr('y2', self.size.y)
                  .style('stroke', "#ccc")
                  .style('z-index', 0)
                  .transition().duration(500)
              gx.exit().transition().duration(500)
                .style('opacity', 0).remove()
              gx.selectAll('text').transition().duration(500)
                .style('opacity', 0)
                .remove()
        }
// gx.data(d3.range(1, graph.uniques.x.length + 1)).enter().append('g').attr('class', 'x').attr('transform', function(d) { return 'translate(' + graph.x.rangeBand()/2 + ',0)'}).append('line').attr('y1', 0).attr('y2', graph.size.y).style('stroke', 'grey')
        if(self.ylinear){
        self.vis.select('.ord_yaxis') 
            .transition().duration(1000)
            .style('opacity', 0)
            .remove()

          // Regenerate y-ticks…
          var gy = self.vis.selectAll("g.y")
              .data(self.y.ticks(10), String)
              .attr("transform", ty),
              fy = self.y.tickFormat(10);

          gy.select("text")
              .text(fy);

          var gye = gy.enter().insert("g")
              .attr("class", "y")
              .attr("transform", ty)
              .attr("background-fill", "#FFEEB6");

          gye.append("line")
              .attr("stroke", stroke)
              .attr("x1", 0)
              .attr("x2", self.size.x);

          gye.append("text")
              .attr("class", "axis")
              .attr("x", -3)
              .attr("dy", ".35em")
              .attr("text-anchor", "end")
              .text(fy)
              .style("cursor", "ns-resize")
              .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
              .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
              .on("mousedown.drag",  self.yaxis_drag())
              .on("touchstart.drag", self.yaxis_drag());

          gy.exit().remove();
        } else {
          yaxis = d3.svg.axis()
                    .scale(self.y)
                    .orient('left')
                    .ticks(self.uniques.y.length)
          self.vis.select('.ord_yaxis')
                .transition().duration(1000)
                .style('opacity', 0)
                .remove()
          self.vis.append('g')
                  .attr('class', 'ord_yaxis')
                  .call(yaxis);
          var gy = self.vis.selectAll('g.y')
                  .data(d3.range(0, self.uniques.y.length))
              gy.attr('transform', function(d) {
                    return 'translate(0,' + (self.y.rangeBand()/2 + d * self.y.rangeBand())+ ")"
                  })
              gy.enter()
                  .insert('g')
                  .attr('class', 'y')
                  .attr('transform', function(d) {
                    return 'translate(0,' + (self.y.rangeBand()/2 + d * self.y.rangeBand())+ ")"
                  })
                  .append('line')
                  .attr('x1', 0)
                  .attr('x2', self.size.x)
                  .style('stroke', "#ccc")
                  .transition().duration(500)
              gy.exit().transition().duration(500)
                .style('opacity', 0).remove()
              gy.selectAll('text').transition().duration(500)
                .style('opacity', 0)
                .remove()
        }

      self.plot.call(d3.behavior.zoom().x(self.x).y(self.y).on("zoom", self.redraw()));
      self.update();    
    }  
  }

  Scatter.prototype.xaxis_drag = function() {
    var self = this;
    return function(d) {
      document.onselectstart = function() { return false; };
      var p = d3.mouse(self.vis[0][0]);
      self.downx = self.x.invert(p[0]);
    }
  };

  Scatter.prototype.yaxis_drag = function(d) {
    var self = this;
    return function(d) {
      document.onselectstart = function() { return false; };
      var p = d3.mouse(self.vis[0][0]);
      self.downy = self.y.invert(p[1]);
    }
  };
})();


      // this.vis.append("text")
      //     .attr("class", "axis")
      //     .text(this.options.title)
      //     .attr("x", this.size.x/2)
      //     .attr("dy","-0.8em")
      //     .style("text-anchor","middle");

      // // Add the x-axis label
      // this.vis.append("text")
      //     .attr("class", "axis")
      //     .text(this.options.xvar)
      //     .attr("x", this.size.x/2)
      //     .attr("y", this.size.y)
      //     .attr("dy","2.4em")
      //     .style("text-anchor","middle");

      // this.vis.append("g").append("text")
      //     .attr("class", "axis")
      //     .text(this.options.yvar)
      //     .style("text-anchor","middle")
      //     .attr("transform","translate(" + -40 + " " + this.size.y/2+") rotate(-90)");
