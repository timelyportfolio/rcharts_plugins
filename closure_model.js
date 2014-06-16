d3.chart = function module() {
  // initialize variables that will be exposed
  var width = 600,
      height = 600, 
      xvar = yvar = color_var = null,
      padding = {
         "top":    40,
         "right":  30,
         "bottom": 60,
         "left":   70
      }

  // functions and variables that don't need to be wrapped in closure
  // jitter, for example.
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

  // beginning of function to return under namespace
  function chart(_selection) {
    // begin declartions requiring declaration of exposed variables
    size = {
      "x":  cx - padding.left - padding.right,
      "y": cy - padding.top  - padding.bottom
    };

    _selection.each(function(data) {
      // functions and stuff requiring access to data.

    });
  };
  // getters and setters here.
  chart.id = function(_x) {
    if(!arguments.length) return id;
    id = _x;
    return chart;
  }
  d3.rebind(chart);
  return chart;
};