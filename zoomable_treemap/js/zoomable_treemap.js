(function() {
  d3.zoomable_treemap = function() {

    // Setting margins. Top determines height of grandparent bar.
    var margin = {top: 30, right: 0, bottom: 0, left: 0},
        width = 960,
        height = 530,
        formatNumber = d3.format(",d"),
        transitioning,
        size = "count",
        color = "count"
        id = "chart",
        color_description = "sum of " + color;
        // tooltip formatting
    var percent = d3.format("%"),
        comma = d3.format(",f")
    // Scales linear, may want to add log option.
    function zoomable_treemap(selection) {
      selection.each( function(root) {
        height =  height - margin.top - margin.bottom
        var x = d3.scale.linear()
            .domain([0, width])
            .range([0, width]);

        var y = d3.scale.linear()
            .domain([0, height])
            .range([0, height]);

        // currently looks for variable "count" at deepest level. This should be set by initiating variable when function is declared.
        var treemap = d3.layout.treemap()
            .children(function(d, depth) { return depth ? null : d._children; }) 
//            .sort(function(a, b) { return parseFloat(a[size]) - parseFloat(b[size]); })
            .value(function(d) { return parseFloat(d[size]); })
              .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
            .round(false);

        // hangs svg on proper div
        var svg = d3.select("#" + id).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.bottom + margin.top)
            .style("margin-left", -margin.left + "px")
            .style("margin.right", -margin.right + "px")
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .style("shape-rendering", "crispEdges");

        // creates grandparent bar to click and go "up"
        var grandparent = svg.append("g")
            .attr("class", "grandparent");

        grandparent.append("rect")
            .attr("y", -margin.top)
            .attr("width", width)
            .attr("height", margin.top);

        grandparent.append("text")
            .attr("x", 6)
            .attr("y", 6 - margin.top)
            .attr("dy", ".75em");

      // begin tooltip
      // mounts actual tooltip, whatever it is.
        var body = d3.select("body");
        var tooltip = body.append("div")
            .style("display", "none")
            .attr("class", "treemap tooltip");


        function showTooltip(html) {
          var m = d3.mouse(body.node());
          tooltip
              .style("display", null)
              .style("left", m[0] + 30 + "px")
              .style("top", m[1] - 20 + "px")
              .html(html);
        }

        function hideTooltip() {
          tooltip.style("display", "none");
        }
        function unHighlight() {
          hideTooltip();
        }
        function defaultTooltip(d) {
          var dsize = parseFloat(d[size]),
              path = [],
              prop = d.prop_parent,
              prop_total = d.prop_total,
              par_total = parseFloat(d.parent[size]),
              child = d,
              children = d._children ? true : false,
              parent = d.parent.key;
          while (d.parent) {
            if (d.key) path.unshift(d.key);
            d = d.parent;
          }
          rpath = [root.key].concat(path)
          tip = rpath.join(" → ") + " " + 
            parseInt(root[size]*prop_total) + 
            " (" + 
            percent(prop_total) + 
            ")<br>"
          if(children){
            tip += rpath.slice(0,-1).join(" → ") + " " + 
              comma(par_total) + " (" + 
              percent(par_total/root[size]) + ")<br>" + 
              "(" + path.slice(0,-1).join(" → ") + ") → " + child.key + " " + 
               comma(dsize) + " (" + percent(prop) + 
              ")" ;
          } else {
            tip += rpath.slice(0,-1).join(" → ") + " " + 
              comma(child.parent.parent[size]) + " (" + 
              percent(par_total/root[size]) + ")<br>" + 
              "(" + path.slice(0,-1).join(" → ") + ") → " + child.parent.key  + " " + 
               comma(dsize) + " (" + percent(dsize/child.parent.parent[size]) + 
              ")" ;
          }
          return tip
        }
        var toolTip_ = defaultTooltip;
        // end tooltip stuff

        function initialize(root) {
          root.x = root.y = 0;
          root.dx = width;
          root.dy = height;
          root.depth = 0;
        }
        //// Possibly needs to be rewritten to accomodate different aggregation functions. mean, sum, variance, range, etc.
        // Aggregate the values for internal nodes. This is normally done by the
        // treemap layout, but not here because of our custom implementation.
        // We also take a snapshot of the original children (_children) to avoid
        // the children being overwritten when when layout is computed.
        function accumulate(d, weight) {
          return (d._children = d.values)
              ? d[weight] = d.values.reduce(function(p, v) { return p + accumulate(v, weight); }, 0)
              : parseFloat(d[weight]);
        }

        // Compute the treemap layout recursively such that each group of siblings
        // uses the same size (1×1) rather than the dimensions of the parent cell.
        // This optimizes the layout for the current zoom state. Note that a wrapper
        // object is created for the parent node for each group of siblings so that
        // the parent’s dimensions are not discarded as we recurse. Since each group
        // of sibling was laid out in 1×1, we must rescale to fit using absolute
        // coordinates. This lets us use a viewport to zoom.
        colors = d3.keys(colorbrewer).slice(0, 19)
        color_scale = {}
        function set_colors(d) {
          if (d._children) {
            if(!color_scale[d.key]) {
                col = colors[Math.floor((Math.random() * 9))];
                color_scale[d.key] = colorbrewer[col][9]
                d._children.forEach(function(c) {
                  set_colors(c);
                })
            }
          }
        }
        function layout(d) {
          if (d._children) {
            treemap.nodes({_children: d._children}); 
            d._children.forEach(function(c) {
              c.x = d.x + c.x * d.dx;
              c.y = d.y + c.y * d.dy;
              c.dx *= d.dx;
              c.dy *= d.dy;
              c.parent = d;
              c.prop_parent = parseFloat(c[size]) / parseFloat(d[size]);
              c.prop_total = parseFloat(c[size]) / root[size]
              if(c._children) {
                c.parent_color = d3.scale.quantile()
                  .range(color_scale[c.key])
                  .domain(d3.extent(c._children.map(
                    function(x) {
                      return parseFloat(x[color]);
                    })))
              } 
              c.child_color = d3.scale.quantile()
                          .range(color_scale[d.key])
                          .domain(d3.extent(d._children.map(
                            function(x) {
                              return parseFloat(x[color]);
                            })))
              layout(c);
            });
          }
        }

        // main function
        // a collection of nodes "d" is passed here.
        function display(d) {
          grandparent // adds ".<parent>" to the grandparent bar.
              .datum(d.parent)
              .on("click", transition)
            .select("text")
              .text(name(d));  

          // inserts a "g" element before ".grandparent" class.
          // attaches, as single element, the nodes.
          // it's class is "depth"
          var g1 = svg.insert("g", ".grandparent")
              .datum(d)
              .attr("class", "depth");

          // attaches a "g" to g1 for each of d's children
          // g is the object returned by this function.
          var g = g1.selectAll("g")
              .data(d._children)
            .enter().append("g");

          // if selection has children, sets the class and click function
          // to the entire <g> element. This holds of the the child's children
          // which are the one's with the actual dimensions.
          g.filter(function(d) { return d._children[0]._children; })
              .classed("children", true)
              .on("click", transition);

          g.selectAll(".child")
              .data(function(d) { return d._children || [d]; })
            .enter().append("rect") // first rect is appended - visible
              .style('fill', function(d) { 
                return d._children ? 
                  d.child_color(parseFloat(d[color])) :
                  d.parent.child_color(parseFloat(d[color])) ;}) 
              .on('mouseover', function(d) {
                d3.select(this).style('fill-opacity', 0.8)
              })
              .on('mouseout', function(d) {
                d3.select(this).style('fill-opacity', 1);
                unHighlight();
              })
              .on('mousemove', function(d) {
                showTooltip(defaultTooltip.call(this, d));
              })
              .attr("class", "child")
              .call(rect); // calling 'rect' creates an area 0 rectangle, but positive x and height variables so the animation can make the look like they 'grow' from the top or bottom.

          // g is now an object of length number of children d. It has a data object the length of the number of its children. We're calling 'rect' on the larger, first child squares now. So each first child is the last declared rect within each g. Mousing over it shows the aggregated size.
          g.append("rect").filter(function(d) { return d._children; })
              .attr("class", "parent")
              .call(rect);


          // do same thing to add it's name in center of parent cell
          g.append("text")
              .attr("dy", ".75em")
              .call(text); 

          // my effort at making dynamic legends.
          d3.selectAll('#legend').remove() 
          var nrow = Math.ceil((d._children.length * 120)/width) || 1,
              ncol = Math.floor(width / 120) || 1;
          var legend = d3.select('#' + id).append('svg')
                          .attr('width', width)
                          .attr('height', d._children ? nrow * 60 + 30: null )
                          .attr('id', 'legend')
          legend.append('svg')
                .attr('x', -40)
                .attr('y', 0)
                .attr('height', 30)
                .attr('width', 800)
                .append("text")
                .classed("legend-title", true)
                .attr('x', 20)
                .attr('y', 20)
                .text(d.key + ": " + color_description)

          
          var keys = legend.selectAll('svg.legends')
                            .data(function() { return d._children[0]._children[0]._children ? d._children: [d]; })
                          .enter().append('svg')
                            .attr('class', 'legends')
                            .attr('x', function(d, i) {
                              return ((i % ncol * 120) + -40);
                              })
                            .attr('y', function(d, i ) {
                              return Math.floor(i / ncol) * 60 + 30;
                            })
                            .attr("height", 60)
                            .attr('width', 120)
                            .call(make_keys);

          function make_keys(keys){
              function get_scale(d) {
                return d._children ? d.parent_color : d.parent.child_color;
              }
              keys
                .append('text')
                .attr('class','legend-text')
                .attr('x', 20)
                .attr('y', 12)
                .text(function(d) {return d.key})
              keys
                .append('text')
                .attr('class','legend-text')
                .text(function(d) {
                  return Math.round(get_scale(d).domain()[0] *100)/100
                })
                .attr('x',20)
                .attr('y', 47)
                .attr('text-anchor' ,'start');
              keys
                .append('text')
                .attr('class','legend-text')
                .text(function(d) {
                  return Math.round(get_scale(d).domain()[1]*100)/100 
                })
                .attr('x',110)
                .attr('y', 47)
                .attr('text-anchor' ,'end');
              keys
                  .selectAll('child-key')
                  .data(function(d) { return get_scale(d).range(); })
                .enter().append('rect')
                  .attr('class', 'key')
                  .style('fill', function(d) { return d; })
                  .style('stroke', 0)
                  .attr('width', 10)
                  .attr('height', 18)
                  .attr('y', 15)
                  .attr('x', function(d, i) { 
                    return 20 + i*10
                  })

          }

          function transition(d) {
            if (transitioning || !d) return;
            transitioning = true;

            var g2 = display(d),
                t1 = g1.transition().duration(750),
                t2 = g2.transition().duration(750);

            // Update the domain only after entering new elements.
            x.domain([d.x, d.x + d.dx]);
            y.domain([d.y, d.y + d.dy]);

            // Enable anti-aliasing during the transition.
            svg.style("shape-rendering", null);

            // Draw child nodes on top of parent nodes.
            svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });

            // Fade-in entering text.
            g2.selectAll("text").style("fill-opacity", 0);

            // Transition to the new view.
            t1.selectAll("text").call(text).style("fill-opacity", 0);
            t2.selectAll("text").call(text).style("fill-opacity", 1);
            t1.selectAll("rect").call(rect);
            t2.selectAll("rect").call(rect);

            // Remove the old node when the transition is finished.
            t1.remove().each("end", function() {
              svg.style("shape-rendering", "crispEdges");
              transitioning = false;
            });
          }
          return g;
        }
        function text(text) {
          text.filter(function(d) { return d._children; })
              .text(function(d) { 
                return d.key
              })
              .attr("x", function(d) { return x(d.x + d.dx * 0.5) ; })
              .attr("y", function(d) { return y(d.y + d.dy * 0.5) ; })
              .attr('font-size', function(d) {
                var box_width = x(d.x + d.dx) - x(d.x),
                    key_length = d.key.length,
                    w = "20px"
                    k = d.key
                    if(key_length * 12 > box_width) {
                      w = 'x-small';
                    }
                    return w;
              })
              .attr('width', function(d) { return d.key.length;})
              .attr("fill-opacity", 1)
              .attr('height', function(d) { return x(d.x + d.dx) - x(d.x)})
              .attr('text-anchor', 'middle');
        }
        function rect(rect) {
          rect.attr("x", function(d) { return x(d.x); })
              .attr("y", function(d) { return y(d.y); })
              .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
              .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
        }
        function name(d) {
          return d.parent
              ? name(d.parent) + " → " + d.key
              : d.key;
        }
        initialize(root);
        accumulate(root, color);
        accumulate(root, size)
        set_colors(root)
        layout(root);
        display(root);

      })
    };
    zoomable_treemap.margin = function(m, _) {
      if(arguments.length < 2) return margin[m];
      margin[m] = _;
      return zoomable_treemap;
    }
    zoomable_treemap.color = function(_) {
      if(!arguments.length) return color;
      color = _ ;
      return zoomable_treemap;
    }
    zoomable_treemap.color_description = function(_) {
      if(!arguments.length) return color_description;
      color_description = _ ;
      return zoomable_treemap;
    }
    zoomable_treemap.formatNumber = function(_) {
      if(!arguments.length) return formatNumber;
      formatNumber = _;
      return zoomable_treemap;
    }
    zoomable_treemap.size = function (_){
      if(!arguments.length) return size;
      size = _ ;
      return zoomable_treemap;
    }
    zoomable_treemap.width = function(_) {
      if(!arguments.length) return width;
      width = _;
      return zoomable_treemap;
    }
    zoomable_treemap.height = function(_) {
      if(!arguments.length) return height;
      height = _;
      return zoomable_treemap;
    }
    zoomable_treemap.id = function(_) {
      if(!arguments.length) return id;
      id = _;
      return zoomable_treemap;
    }
    return d3.rebind(zoomable_treemap);
    // return d3.rebind(zoomable_treemap, event, "on");
  };
})();
