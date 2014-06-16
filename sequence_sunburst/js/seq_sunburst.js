(function() {
  d3.seq_sunburst = function() {

    // Dimensions of sunburst.
    var width = 400,
        color_scale =  colorbrewer.Dark2[8],
        id = 'seq_sunburst_chart',
        crumbWidth = 75,
        crumbHeight = 30,
        crumbSpace = 3,
        crumbText = 10,
        filter = 0.005,
        percentageText = 'of visitors started with this sequence of pages.';

    // Breadcrumb dimensions: width, height, spacing, width of tip/tail.
    var b = {
      w: crumbWidth, h: crumbHeight, s: crumbSpace, t: crumbText
    };

    // Mapping of step names to colors.
    var colors = {}

    // Total size of all segments; we set this later, after loading the data.
    var totalSize = 0; 

      // Use d3.text and d3.csv.parseRows so that we do not need to have a header
      // row, and can receive the csv as an array of arrays.

      // Main function to draw and set up the visualization, once we have the data.
    function seq_sunburst(selection) {
      selection.each( function(data) {
        var height = width;

        var vis = d3.select("#" + id)
                    .style('width', width + 90 + 'px')
                    .append('div')
                    .attr('id', 'seq_sunburst_chart')
                    .style('position', 'relative')
                    .append("svg:svg")
                    .style('float', "right")
                    .attr("width", width)
                    .attr("height", height)
                    .append("svg:g")
                    .attr("id", "container")
                    .attr("transform", "translate(" + width / 2 + "," + 
                      (height / 2 ) + ")");

        d3.select("#seq_sunburst_chart").append('div')
           .attr('id', 'explanation')
           .style("top", height / 2 + 'px')
           .style('left', width / 2 + 28   + 'px')
           .style('position', 'absolute')
           .append('span')
           .attr('id', 'percentage');

        var radius = Math.min(width, height) / 2;

        var partition = d3.layout.partition()
            .size([2 * Math.PI, radius * radius])
            .value(function(d) { return d.size; });

        var arc = d3.svg.arc()
            .startAngle(function(d) { return d.x; })
            .endAngle(function(d) { return d.x + d.dx; })
            .innerRadius(function(d) { return Math.sqrt(d.y); })
            .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

        json = buildHierarchy(data);
        createVisualization(json);
        function createVisualization(json) {

          // Basic setup of page elements.
          initializeBreadcrumbTrail();
          drawLegend();
          // d3.select("#togglelegend").on("click", toggleLegend);

          // Bounding circle underneath the sunburst, to make it easier to detect
          // when the mouse leaves the parent g.
          vis.append("svg:circle")
              .attr("r", radius)
              .style("opacity", 0);

          // For efficiency, filter nodes to keep only those large enough to see.
          var nodes = partition.nodes(json)
              .filter(function(d) {
              return (d.dx > filter); // 0.005 radians = 0.29 degrees
              });

          var path = vis.data([json]).selectAll("path")
              .data(nodes)
              .enter().append("svg:path")
              .attr("display", function(d) { return d.depth ? null : "none"; })
              .attr("d", arc)
              .attr("fill-rule", "evenodd")
              .style("fill", function(d) { return colors[d.name]; })
              .style("opacity", 1)
              .on("mouseover", mouseover);

          // Add the mouseleave handler to the bounding circle.
          d3.select("#container").on("mouseleave", mouseleave);

          // Get total size of the tree = value of root node from partition.
          totalSize = path.node().__data__.value;
         };

        // Fade all but the current sequence, and show it in the breadcrumb trail.
        function mouseover(d) {

          var percentage = (100 * d.value / totalSize).toPrecision(3);
          var percentageString = percentage + "%";
          if (percentage < 0.1) {
            percentageString = "< 0.1%";
          }

          d3.select("#percentage")
              .text(percentageString)
              .append('p')
              .style('font-size', '12pt')
              .html("<br>")
              .text(percentageText)

          d3.select("#explanation")
              .style("visibility", "")

          var sequenceArray = getAncestors(d);
          updateBreadcrumbs(sequenceArray, percentageString);

          // Fade all the segments.
          d3.selectAll("path")
              .style("opacity", 0.3);

          // Then highlight only those that are an ancestor of the current segment.
          vis.selectAll("path")
              .filter(function(node) {
                        return (sequenceArray.indexOf(node) >= 0);
                      })
              .style("opacity", 1);
        }

        // Restore everything to full opacity when moving off the visualization.
        function mouseleave(d) {

          // Hide the breadcrumb trail
          d3.select("#trail")
              .style("visibility", "hidden");

          // Deactivate all segments during transition.
          d3.selectAll("path").on("mouseover", null);

          // Transition each segment to full opacity and then reactivate it.
          d3.selectAll("path")
              .transition()
              .duration(1000)
              .style("opacity", 1)
              .each("end", function() {
                      d3.select(this).on("mouseover", mouseover);
                    });

          d3.select("#explanation")
              .transition()
              .duration(1000)
              .style("visibility", "hidden");
        }

        // Given a node in a partition layout, return an array of all of its ancestor
        // nodes, highest first, but excluding the root.
        function getAncestors(node) {
          var path = [];
          var current = node;
          while (current.parent) {
            path.unshift(current);
            current = current.parent;
          }
          return path;
        }

        function initializeBreadcrumbTrail() {
          // Add the svg area.
          var trail = d3.select("#seq_sunburst_chart")
                        .insert('div', 'svg')
                        .attr('id', 'sequence')
                        .append("svg:svg")
                        .attr("width", width + 75)
                        .attr("height", 50)
                        .attr("id", "trail");
          // Add the label at the end, for the percentage.
          trail.append("svg:text")
            .attr("id", "endlabel")
            .style("fill", "#000");
        }

        // Generate a string that describes the points of a breadcrumb polygon.
        function breadcrumbPoints(d, i) {
          var points = [];
          points.push("0,0");
          points.push(b.w + ",0");
          points.push(b.w + b.t + "," + (b.h / 2));
          points.push(b.w + "," + b.h);
          points.push("0," + b.h);
          if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
            points.push(b.t + "," + (b.h / 2));
          }
          return points.join(" ");
        }

        // Update the breadcrumb trail to show the current sequence and percentage.
        function updateBreadcrumbs(nodeArray, percentageString) {

          // Data join; key function combines name and depth (= position in sequence).
          var g = d3.select("#trail")
              .selectAll("g")
              .data(nodeArray, function(d) { return d.name + d.depth; });

          // Add breadcrumb and label for entering nodes.
          var entering = g.enter().append("svg:g");

          entering.append("svg:polygon")
              .attr("points", breadcrumbPoints)
              .style("fill", function(d) { return colors[d.name]; });

          entering.append("svg:text")
              .attr("x", (b.w + b.t) / 2)
              .attr("y", b.h / 2)
              .attr("dy", "0.35em")
              .attr("text-anchor", "middle")
              .text(function(d) { return d.name; });

          // Set position for entering and updating nodes.
          g.attr("transform", function(d, i) {
            return "translate(" + i * (b.w + b.s) + ", 0)";
          });

          // Remove exiting nodes.
          g.exit().remove();

          // Now move and update the percentage at the end.
          d3.select("#trail").select("#endlabel")
              .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
              .attr("y", b.h / 2)
              .attr("dy", "0.35em")
              .attr("text-anchor", "middle")
              // .text(percentageString);

          // Make the breadcrumb trail visible, if it's hidden.
          d3.select("#trail")
              .style("visibility", "");

        }

        function drawLegend() {

          // Dimensions of legend item: width, height, spacing, radius of rounded rect.
          var li = {
            w: 75, h: 30, s: 3, r: 3
          };

          var legend = d3.select("#sequence")
                         .append('div')
                         .attr('id', 'legend')
                         .append("svg:svg")
                         .attr("width", li.w)
                         .attr("height", d3.keys(colors).length * (li.h + li.s));

          var g = legend.selectAll("g")
              .data(d3.entries(colors))
              .enter().append("svg:g")
              .attr("transform", function(d, i) {
                      return "translate(0," + i * (li.h + li.s) + ")";
                   });

          g.append("svg:rect")
              .attr("rx", li.r)
              .attr("ry", li.r)
              .attr("width", li.w)
              .attr("height", li.h)
              .style("fill", function(d) { return d.value; });

          g.append("svg:text")
              .attr("x", li.w / 2)
              .attr("y", li.h / 2)
              .attr("dy", "0.35em")
              .attr("text-anchor", "middle")
              .text(function(d) { return d.key; });
        }

        // not really necessary for me
        function toggleLegend() {
          var legend = d3.select("#legend");
          if (legend.style("visibility") == "hidden") {
            legend.style("visibility", "");
          } else {
            legend.style("visibility", "hidden");
          }
        }

        // Take a 2-column CSV and transform it into a hierarchical structure suitable
        // for a partition layout. The first column is a sequence of step names, from
        // root to leaf, separated by hyphens. The second column is a count of how 
        // often that sequence occurred.
        function buildHierarchy(csv) {
          var root = {"name": "root", "children": [] },
              color_count = 0;

          for (var i = 0; i < csv.length; i++) {
            var sequence = csv[i][0];
            var size = +csv[i][1];
            if (isNaN(size)) { // e.g. if this is a header row
              continue;
            }
            var parts = sequence.split("~");
            var currentNode = root;
            for (var j = 0; j < parts.length; j++) {
              var children = currentNode["children"];
              var nodeName = parts[j];
              var childNode;
              if (j + 1 < parts.length) {
           // Not yet at the end of the sequence; move down the tree.
            var foundChild = false;
            for (var k = 0; k < children.length; k++) {
              if (children[k]["name"] == nodeName) {
                childNode = children[k];
                foundChild = true;
                break;
              }
            }
          // If we don't already have a child node for this branch, create it.
            if (!foundChild) {
              childNode = {"name": nodeName, "children": []};
              colors[nodeName] = color_scale[color_count % color_scale.length];
              color_count += 1;
              children.push(childNode);
            }
            currentNode = childNode;
              } else {
            // Reached the end of the sequence; create a leaf node.
            childNode = {"name": nodeName, "size": size};
            children.push(childNode);
              }
            }
          }
          colors['end'] = 'rgb(187, 187, 187)'
          return root;
        };

      });

    };
    seq_sunburst.width = function(_) {
      if(!arguments.length) return width;
      width = _;
      return seq_sunburst;
    }
    seq_sunburst.height = function(_) {
      if(!arguments.length) return height;
      height = _;
      return seq_sunburst;
    }
    seq_sunburst.custom_colors = function(_) {
      if(!arguments.length) return custom_colors;
      custom_colors = _;
      return seq_sunburst;
    }
    seq_sunburst.crumbWidth = function(_) {
      if(!arguments.length) return crumbWidth;
      crumbWidth = _;
      return seq_sunburst;
    }
    seq_sunburst.crumbHeight = function(_) {
      if(!arguments.length) return crumbHeight;
      crumbHeight = _;
      return seq_sunburst;
    }
    seq_sunburst.crumbSpace = function(_) {
      if(!arguments.length) return crumbSpace;
      crumbSpace = _;
      return seq_sunburst;
    }
    seq_sunburst.crumbText = function(_) {
      if(!arguments.length) return crumbText;
      crumbText = _;
      return seq_sunburst;
    }
    seq_sunburst.window_size = function(_) {
      if(!arguments.length) return window_size;
      window_size = _;
      return seq_sunburst;
    }
    seq_sunburst.percentageText = function(_) {
      if(!arguments.length) return percentageText;
      percentageText = _;
      return seq_sunburst;
    }
    seq_sunburst.id = function(_) {
      if(!arguments.length) return id;
      id = _;
      return seq_sunburst;
    }
    return d3.rebind(seq_sunburst);
  };
})();
