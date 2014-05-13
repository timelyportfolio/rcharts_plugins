d3.hivePlot = function module() {
  var innerRadius = 40,
      margin = 20,
      outerRadius = 500,
      width = (outerRadius + innerRadius) * 2 + margin * 2,
      height = (outerRadius + innerRadius) * 2 + margin * 2,
      majorAngle = 2 * Math.PI / 3,
      minorAngle = 1 * Math.PI / 12,
      sortby = id = null,
      nodesize = 4;

      // original domain setup set up angle according to links in and out.
      // .domain(["source", "source-target", "target-source", "target"])
  var angle = d3.scale.ordinal()
      .domain(["1", "2", "3", "4"]) // change to however many you like
      .range([0, majorAngle - minorAngle, majorAngle + minorAngle, 2 * majorAngle]);

  var radius = d3.scale.linear()
      .range([innerRadius, outerRadius]);

  var color = d3.scale.category20();

  // Load the data and display the plot!
  function hivePlot(_selection) {
    _selection.each(function(dat) {
      var nodesByName = { },
          links = [],
          nodes = dat.data,
          formatNumber = d3.format(",d"),
          defaultInfo;

          // Construct an index by node name.
      nodes.forEach(function(d) {
        d.edges = [];
        d.productName = d.name.split(".")[1];
        nodesByName[d.name] = d;
      });

      function type_function(metric) {
        if (metric == 'degree') {
          var degrees = [],
             scale = d3.scale.quantile();
          nodes.forEach(function(n) { degrees.push(n.degree); });
          scale.domain(degrees)
            .range(["1", "2", "3", "4"]);
          nodes.forEach(function(n) { n.type = n.source.type = scale(n.degree)})
          nodes.forEach(function(n) { n.type = n.target.type = scale(n.degree)})
        } else if (metric=="weight"){
          var weights = [],
          scale = d3.scale.quantile();
          nodes.forEach(function(n) { weights.push(d3.sum(n.weights)/n.degree);})
          scale.domain(weights)
            .range(['1', '2','3','4'])
          color.domain(scale.range())
          nodes.forEach(function(n) { n.color = scale(d3.sum(n.weights)/n.degree)})
        }
      }


      // Convert the import lists into links with sources and targets.
      nodes.forEach(function(source) {
        source.neighbors.forEach(function(targetName, i) {
          var target = nodesByName[targetName];
          if (!source.source) source.edges.push(source.source = {node: source, degree: 0});
          if (!target.target) target.edges.push(target.target = {node: target, degree: 0});
          links.push({source: source.source, target: target.target,
            weight: source.weights[i]});
        });
      });
      type_function("degree");
      type_function("weight")

      // more of the original radial scale
      // // Determine the type of each node, based on incoming and outgoing links.
      // nodes.forEach(function(node) {
      //   if (node.source && node.target) {
      //     node.type = node.source.type = "target-source";
      //     node.target.type = "source-target";
      //   } else if (node.source) {
      //     node.type = node.source.type = "source";
      //   } else if (node.target) {
      //     node.type = node.target.type = "target";
      //   } else {
      //     node.edges = [{node: node}];
      //     node.type = "source";
      //   }
      // });

      // Initialize the info display.
      var info = _selection.insert('div', ":first-child")
                  .attr("id", "info")
                  .style("position", "absolute")
                  .html(defaultInfo = "Showing " + 
                    formatNumber(links.length) + " relationships among <br>" + formatNumber(nodes.length) + " food products.");

      // Normally, Hive Plots sort nodes by degree along each axis. However, since
      // this example visualizes a package hierarchy, we get more interesting
      // results if we group nodes by package. We don't need to sort explicitly
      // because the data file is already sorted by class name.

      // Nest nodes by type, for computing the rank.
      // optional sortby selection
      var nodesByType = d3.nest()
          .key(function(d) { return d.type; })
          .sortKeys(d3.ascending)
          .sortValues(function(a,b) { 
            if(sortby) // optional sortby sums a variable and scales by degree
              return d3.sum(a[sortby])/a.degree - d3.sum(b[sortby])/b.degree;})
          .entries(nodes);

      // Duplicate the target-source axis as source-target.
      //    nodesByType.push({key: "source-target", values: nodesByType[2].values});

      // Compute the rank for each type, with padding between packages.
      nodesByType.forEach(function(type) {
        var lastColor = type.values[0].color, count = 0;
        type.values.forEach(function(d, i) {
          if (d.color != lastColor) lastColor = d.color, count += 2;
          // figuring out what this does
          d.index = count++;
        });
        type.count = count - 1;
      });

      // Set the radius domain.
      radius.domain(d3.extent(nodes, function(d) { return d.index; }));
      twelveOclock = nodesByType[0].values[nodesByType[0].values.length - 1].index

      var svg = d3.select("#" + id).append("svg")
          .attr("width", width)
          .attr("height", height)
        .append("g")
          .attr("transform", "translate(" + (outerRadius+innerRadius+margin ) + "," + 
           (radius(twelveOclock) * 1.1 + margin*3) + ")");

      // Draw the axes.
      svg.selectAll(".axis")
          .data(nodesByType)
        .enter().append("line")
          .attr("class", "axis")
          .attr("transform", function(d) { return "rotate(" + degrees(angle(d.key)) + ")"; })
          .attr("x1", radius(-2))
          .attr("x2", function(d) { return radius(d.count); }); // + 2

      // Draw the links.
      svg.append("g")
          .attr("class", "links")
        .selectAll(".link")
          .data(links)
        .enter().append("path")
          .attr("class", "link")
          .attr("d", link()
            .angle(function(d) { return angle(d.type); })
            .radius(function(d) { return radius(d.node.index); })
            .metric(function(d) { return d.weight; }))
          .on("mouseover", linkMouseover)
          .on("mouseout", mouseout);

      // Draw the nodes. Note that each node can have up to two connectors,
      // representing the source (outgoing) and target (incoming) links.
      svg.append("g")
          .attr("class", "nodes")
        .selectAll(".node")
          .data(nodes)
        .enter().append("g")
          .attr("class", "node")
          .style("fill", function(d) { return color(d.color); })
        .selectAll("circle")
          .data(function(d) { return d.edges; })
        .enter().append("circle")
          .attr("transform", function(d) { return "rotate(" + 
            degrees(angle(d.type)) + ")"; })
          .attr("cx", function(d) { return radius(d.node.index); })
          .attr("r", nodesize)
          .on("mouseover", nodeMouseover)
          .on("mouseout", mouseout)
          .on("click", nodeClick);

      // Highlight the link and connected nodes on mouseover.
      function linkMouseover(d) {
        svg.selectAll(".link").classed("active", function(p) { return p === d; });
        svg.selectAll(".node circle").classed("active", function(p) { return p === d.source || p === d.target; });
        info.html(d.source.node.text + " → <br>" + d.target.node.text + 
          "<br>Edge weight: " + d.weight );
      }

      // // Highlight the node and connected links on mouseover.
      function nodeMouseover(d) {
        svg.selectAll(".link").classed("active", function(p) { return p.source === d || p.target === d; });
        d3.select(this).classed("active", true);
        info.html(d.node.text + " has <br>" + d.node.degree + " connections." + " Average edge weight:" + Math.round(d3.sum(d.node.weights)/d.node.degree*100)/100)
      }
      function nodeClick(d) {
        d3.selectAll(".clicked").classed("clicked", false);
        d3.selectAll(".link .node").classed("active", false);
        svg.selectAll(".link").classed("clicked", function(p) { return p.source === d || p.target === d; });
        d3.select(this).classed("clicked", true);
      }

      // Clear any highlighted nodes or links.
      function mouseout() {
        svg.selectAll(".active").classed("active", false);
        info.html(defaultInfo);
      }
    }); // end _selection
  } //end hivePlot

  // A shape generator for Hive links, based on a source and a target.
  // The source and target are defined in polar coordinates (angle and radius).
  // Ratio links can also be drawn by using a startRadius and endRadius.
  // This class is modeled after d3.svg.chord.
  function link() {
    var source = function(d) { return d.source; },
        target = function(d) { return d.target; },
        angle = function(d) { return d.angle; },
        startRadius = function(d) { return d.radius; },
        endRadius = startRadius,
        arcOffset = -Math.PI / 2;

    function link(d, i) {
      var s = node(source, this, d, i),
          t = node(target, this, d, i),
          x;
      if (t.a < s.a) x = t, t = s, s = x;
      if (t.a - s.a > Math.PI) s.a += 2 * Math.PI;
      var a1 = s.a + (t.a - s.a) / 3,
          a2 = t.a - (t.a - s.a) / 3;
      return s.r0 - s.r1 || t.r0 - t.r1
          ? "M" + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
          + "L" + Math.cos(s.a) * s.r1 + "," + Math.sin(s.a) * s.r1
          + "C" + Math.cos(a1) * s.r1 + "," + Math.sin(a1) * s.r1
          + " " + Math.cos(a2) * t.r1 + "," + Math.sin(a2) * t.r1
          + " " + Math.cos(t.a) * t.r1 + "," + Math.sin(t.a) * t.r1
          + "L" + Math.cos(t.a) * t.r0 + "," + Math.sin(t.a) * t.r0
          + "C" + Math.cos(a2) * t.r0 + "," + Math.sin(a2) * t.r0
          + " " + Math.cos(a1) * s.r0 + "," + Math.sin(a1) * s.r0
          + " " + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
          : "M" + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
          + "C" + Math.cos(a1) * s.r1 + "," + Math.sin(a1) * s.r1
          + " " + Math.cos(a2) * t.r1 + "," + Math.sin(a2) * t.r1
          + " " + Math.cos(t.a) * t.r1 + "," + Math.sin(t.a) * t.r1;
    }

    function node(method, thiz, d, i) {
      var node = method.call(thiz, d, i),
          a = +(typeof angle === "function" ? angle.call(thiz, node, i) : angle) + arcOffset,
          r0 = +(typeof startRadius === "function" ? startRadius.call(thiz, node, i) : startRadius),
          r1 = (startRadius === endRadius ? r0 : +(typeof endRadius === "function" ? endRadius.call(thiz, node, i) : endRadius));
      return {r0: r0, r1: r1, a: a};
    }

    link.source = function(_) {
      if (!arguments.length) return source;
      source = _;
      return link;
    };
    link.metric = function(_) {
      if(!arguments.length) return metric;
      metric = _;
      return link;
    }
    link.target = function(_) {
      if (!arguments.length) return target;
      target = _;
      return link;
    };

    link.angle = function(_) {
      if (!arguments.length) return angle;
      angle = _;
      return link;
    };

    link.radius = function(_) {
      if (!arguments.length) return startRadius;
      startRadius = endRadius = _;
      return link;
    };

    link.startRadius = function(_) {
      if (!arguments.length) return startRadius;
      startRadius = _;
      return link;
    };

    link.endRadius = function(_) {
      if (!arguments.length) return endRadius;
      endRadius = _;
      return link;
    };

    return link;
  }

  hivePlot.id = function(_) {
    if(!arguments.length) return id;
    id = _;
    return hivePlot;
  };
  hivePlot.width = function(_) {
    if(!arguments.length) return width;
    width = _;
    return hivePlot;
  };
  hivePlot.margin = function(_) {
    if(!arguments.length) return margin;
    margin = _;
    return hivePlot;
  };
    hivePlot.height = function(_) {
    if(!arguments.length) return height;
    height = _;
    return hivePlot;
  };
  hivePlot.innerRadius = function(_) {
    if(!arguments.length) return innerRadius;
    innerRadius = _;
    return hivePlot;
  };
  hivePlot.outerRadius = function(_) {
    if(!arguments.length) return outerRadius;
    outerRadius = _;
    return hivePlot;
  };
  hivePlot.majorAngle = function(_) {
    if(!arguments.length) return majorAngle;
    majorAngle = _;
    return hivePlot;
  };
  hivePlot.minorAngle = function(_) {
    if(!arguments.length) return minorAngle;
    minorAngle = _;
    return hivePlot;
  };
  hivePlot.sortby = function(_) {
    if(!arguments.length) return sortby;
    sortby = _;
    return hivePlot;
  };
  hivePlot.nodesize = function(_) {
    if(!arguments.length) return nodesize;
    nodesize = _;
    return hivePlot;
  };
  function degrees(radians) {
    return radians / Math.PI * 180 - 90;
  }
  d3.rebind(hivePlot);
  return hivePlot;
};
