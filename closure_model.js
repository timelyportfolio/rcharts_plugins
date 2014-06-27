d3.stackbar = function module() {
  // initialize variables that will be exposed
  var nlayers,
      height = 600, 
      width = 600,
      color_scale = d3.scale.category10(),
      xvar = yvar = color_var = null,
      stack = d3.layout.stack(),
      group,
      padding = {
         "top":    40,
         "right":  30,
         "bottom": 60,
         "left":   70
      }


  // beginning of function to return under namespace
  function stackbar(_selection) {
    // begin declartions requiring declaration of exposed variables
    size = {
      "x":  width - padding.left - padding.right,
      "y": height - padding.top  - padding.bottom
    };

    _selection.each(function(data) {
      // functions and stuff requiring access to data.
      GroupMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y; }); }),
      StackMax = d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });

      // scales
      var x = d3.scale.ordinal()
              .domain(d3.range(m))
              .rangeRoundBands([0, size.x], .08);

      var y = d3.scale.linear()
          .domain([0, StackMax])
          .range([size.y, 0]);

      var xAxis = d3.svg.axis()
          .scale(x)
          .tickSize(0)
          .tickPadding(6)
          .orient("bottom");

      var svg = _selection.append("svg")
          .attr("width", size.x)
          .attr("height", size.y)
        .append("g")
          .attr("transform", "translate(" + padding.left + "," + padding.top + ")");

      var layer = svg.selectAll(".layer")
          .data(layers)
        .enter().append("g")
          .attr("class", "layer")
          .style("fill", function(d, i) { return color(i); });

      var rect = layer.selectAll("rect")
          .data(function(d) { return d; })
        .enter().append("rect")
          .attr("x", function(d) { return x(d.x); })
          .attr("y", height)
          .attr("width", x.rangeBand())
          .attr("height", 0);


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
  stackbar.color_scale = function(_x) {
    if(!arguments.length) return color_scale;
    color_scale = _x;
    return stackbar;
  }
  stackbar.xvar = function(_x) {
    if(!arguments.length) return xvar;
    xvar = _x;
    return stackbar;
  }
  stackbar.yvar = function(_x) {
    if(!arguments.length) return yvar;
    yvar = _x;
    return stackbar;
  }
  stackbar.color_var = function(_x) {
    if(!arguments.length) return color_var;
    color_var = _x;
    return stackbar;
  }
  stackbar.dimension = function(_x) {
    if(!arguments.length) return dimension;
    dimension = _x;
    return stackbar;
  }
  stackbar.padding = function(_x) {
    if(!arguments.length) return padding;
    padding = _x;
    return stackbar;
  }
  stackbar.nlayers = function(_x) {
    if(!arguments.length) return nlayers;
    nlayers = _x;
    return stackbar;
  }
  d3.rebind(stackbar);
  return stackbar;
};