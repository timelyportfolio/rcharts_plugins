d3.hist_cf = function module() {
  // initialize variables that will be exposed
  var width = 600,
      height = 600, 
      color_var = null,
      dimensions = null,
      padding = {
         "top":    20,
         "right":  20,
         "bottom": 20,
         "left":   20
      }

  // functions and variables that don't need to be wrapped in closure
  // jitter, for example.

  // beginning of function to return under namespace
  function hist_cf(_selection) {
    // begin declartions requiring declaration of exposed variables
    size = {
      "x":  cx - padding.left - padding.right,
      "y": cy - padding.top  - padding.bottom
    };

    _selection.each(function(data, i) {
      // functions and stuff requiring access to data.
      var svg = d3.select(this).append('svg')
                  .attr('width',width)
                  .attr('height', height)

          plot = svg.append('g')
                    .attr('transform', 'translate(' + padding.left +
                              "," + padding.top + ")")
          
    });
  };
  // getters and setters here.
  chart.id = function(_x) {
    if(!arguments.length) return id;
    id = _x;
    return hist_cf;
  }
  chart.width = function(_x) {
    if(!arguments.length) return width;
    width = _x;
    return hist_cf;
  }
  chart.height = function(_x) {
    if(!arguments.length) return height;
    height = _x;
    return hist_cf;
  }
  chart.dimensions = function(_x) {
    if(!arguments.length) return dimensions;
    dimensions = _x;
    return hist_cf;
  }
  chart.color_var = function(_x) {
    if(!arguments.length) return color_var;
    color_var = _x;
    return hist_cf;
  }
  chart.id = function(_x) {
    if(!arguments.length) return id;
    id = _x;
    return hist_cf;
  }
  chart.id = function(_x) {
    if(!arguments.length) return id;
    id = _x;
    return hist_cf;
  }
  chart.id = function(_x) {
    if(!arguments.length) return id;
    id = _x;
    return hist_cf;
  }
  d3.rebind(hist_cf);
  return hist_cf;
};