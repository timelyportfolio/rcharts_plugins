d3.scatter_matrix = function module() {
	// set up variables that can be exposed
	var width = 500,
		height = 500,
		margin = 15,
		group = filter = data_file = id = default_filter = null,
		point_size = 3,
		font_size = '0.6em'
		opacity = 0.25;

	function scatter_matrix(_selection) {
		//**** A handful of necessary functions ****
		//interquartile range function
		function iqr(k) {
			return function(d, i) {
				var q1 = d.quartiles[0],
				  q3 = d.quartiles[2],
				  iqr = (q3 - q1) * k,
				  i = -1,
				  j = d.length;
				while (d[++i] < q1 - iqr);
				while (d[--j] > q3 + iqr);
				return [i, j];
			};
		};

		function brushstart(p) {
			if (brush.data !== p) {
				cell.call(brush.clear());
				brush.x(x[p.x]).y(y[p.y]).data = p;
			};
		};

		// Highlight the selected circles.
		function brush(p) {
			var e = brush.extent();
				svg.selectAll(".scatter circle")
					.attr("style", function(d) {
						return e[0][0] <= d[p.x] && d[p.x] <= e[1][0]
						&& e[0][1] <= d[p.y] && d[p.y] <= e[1][1]
						?  "fill: " + color(d[var_positions[group]]) + ";" : 'fill: #ccc;';
					});
		};

		// If the brush is empty, select all circles.
		function brushend() {
			if (brush.empty()) svg.selectAll(".scatter circle").attr("style", function(d) {
				return "fill: " + color(d[var_positions[group]]) + ";";
			});
		};

		function cross(a, b) {
			var c = [], n = _.keys(a).length, m = _.keys(b).length, i, j, cell_data = {};
				for (i = -1; ++i < n;) {
					for (j = -1; ++j < m;) {
						cell_data = {x: a[i], i: i, y: b[j], j: j};
						if (i === j) {
							cell_data['plot'] = 'boxp';
						}else{
							cell_data['plot'] = 'scatter';
					};
				c.push(cell_data);
				};
			};
		return c;
		};
		function namify(name) {
			var reg = /\./g
			return name.replace(reg, '')

		}
		// scales
		_selection.each(function(data){
			var var_positions = _.zipObject(_.keys(data), _.range(_.keys(data).length)),
				measure = _.difference(_.keys(data), [group, filter]),
				size = (height - margin*measure.length)/measure.length,
				category = group ? _.unique(data[group]) : null,
				filters = filter ? _.unique(data[filter]) : null,
				boxMarg = {horiz_space: margin/2},
				bwidth = size/(category ? category.length : 2 ) - boxMarg.horiz_space,
				bheight = size - margin *2; 

			var color =  d3.scale.category10()
			color.domain(category ? category : '');

			// filter dataset, reset and redraw axes
			function filter_dataset(filter_val){
				filtered = _.zip(_.map(_.keys(data), function(k) { return data[k] }))
				if(filter_val !== "all"){
					filtered = _.filter(filtered, function(d) {
						return d[_.indexOf(_.keys(data), filter)] == filter_val ? d : 0;
					});
				}
				return filtered
			}
			// Root panel.

			var svg = d3.select('#' + id).append("svg:svg")
				.attr("width", width)
				.attr("height", height)
			  .append("svg:g")
				.attr("transform", "translate(" + margin/2 + "," + margin/2 + ")");
		// objects for axes and boxplots

			var x = {}, y = {}, chart = {};
			function make_axes(filtered_data) {
				var axis = d3.svg.axis()
					.ticks(5)
					.tickSize(margin/2 + size * measure.length)
					.tickFormat(function(d) {
						var prefix = d3.formatPrefix(d);
						return prefix.scale(d) + prefix.symbol;
					})
				_.forEach(measure, function(m) {
				var m_index = _.indexOf(_.keys(data), m),
				column = _.map(filtered_data, function(d) { return d[m_index] } ),
				domain = [Math.ceil(_.max(column)),Math.floor(_.min(column))],
			// why does the range work like this? Why are both reversed?
				range = [margin , size - margin ];
				x[m] = d3.scale.linear().domain(domain.reverse()).rangeRound(range);
				y[m] = d3.scale.linear().domain(domain.reverse()).rangeRound(range);
				chart[m] = d3.box()
					.whiskers(iqr(1.9))
					.width(bwidth)
					.height(bheight)
					.domain(domain.reverse());
				});
				// X-axis.
				svg.selectAll("g.x.axis").remove()
				svg.selectAll("g.x.axis").data(measure)
				  .enter().insert("svg:g", '.cell')
					.attr("class", function(d) { return "x axis " + namify(d)})
					.attr("transform", function(d, i) { 
						return "translate(" + i * size + ",0)"; })
					.each(function(d) { d3.select(this).call(axis.scale(x[d]).orient("bottom")); })
					.selectAll('text')
					.style("text-anchor", "middle")
					.attr("font-size", font_size)
					.attr('fill-opacity', 0.3);

				// Y-axis.
				svg.selectAll("g.y.axis").remove()
				svg.selectAll("g.y.axis").data(measure)
				  .enter().insert("svg:g", '.cell')
					.attr("class", function(d) { return "y axis " + namify(d)})
					.attr("transform", function(d, i) { 
						return "translate(0," + i * (size) + ")"; })
					.each(function(d) { d3.select(this).call(axis.scale(y[d]).orient("right")); })
					.selectAll('text')
					.style("text-anchor", 'middle')
					.attr("font-size", font_size)
					.attr('fill-opacity', 0.3);
			}

			var brush = d3.svg.brush()
				.x(x)
				.y(y)
				.on("brushstart", brushstart)
				.on("brush", brush)
				.on("brushend", brushend);

			// Legend.
			if(category || filters){
				legend = d3.select('#' + id)
						.append("div")
						.classed('row', 'true')
			}
			if(category){
				var categories = legend.append('div')
					.attr('class', 'col-sm-6')
					.style('width', function() {return width*0.5 + 'px'})
					.html(function() { return "<p>" + group + ":</p>"})
					.append("svg:svg")
					.attr('class', 'legend-box')
					.attr('height', function() {return category.length*20})
					.attr('width', function() { return width*0.5})
					.append('g')
					.attr('transform', "translate(20,10)")
					.selectAll("g.legend")
					.data(category)
				  .enter().append("svg:g")
					.attr("class", "legend")
					.attr("transform", function(d, i) { return "translate(0," + (i * 20) + ")"; });

				categories.append("svg:circle")
					.attr("class", String)
					.style("fill", function(d) {return color(d);})
					.attr("r", 5);

				categories.append("svg:text")
					.attr("x", 12)
					.attr("dy", ".31em")
					.text(function(d) { return d; });
			} 
			if(filters){
				var filter_label = '<a data-toggle="dropdown">Choose ' + filter + '</a>'
				var filter_button = legend.append('div')
					.attr('class', 'col-sm-6')
					.append('div')
					.attr('class', 'btn-default')
					.append('select')
					.attr('data-live-search', 'true')
					.attr('class', 'selectpicker show-tick')
					.attr('id', 'filter-select')
					.attr('data-style', 'btn-primary')
				filter_button.append('option')
					.attr('value', 'all')
					.text(function() { return filter + ": all"})

				filter_button.selectAll('select')
					.data(filters)
					.enter().append('option')
					.attr('value', function(d) { return d })
					.text(function(d) { return filter + ': ' + d })
				
				if(default_filter){
					legend.select('[value="' + default_filter + '"]')
						.attr('selected', 'selected')
				}
				$('.selectpicker').selectpicker({
				size: 4
				});
			}
			function plot(p, i) {
				var cell = d3.select(this),
					name = cell.attr('xname')
				if (cell.attr('class') == 'cell scatter') {
				// Plot dots.
					circles = cell.selectAll("circle")
						.data(filtered, function(d) { 
							  return d;})
					circles.attr('class', 'update')
						.transition()
						.duration(1000)
						.attr("cx", function(d) { return x[p.x](d[var_positions[p.x]]); })
						.attr("cy", function(d) { return y[p.y](d[var_positions[p.y]]); })
						.attr("r", point_size)
						.style("fill", function(d) { return color(d[var_positions[group]]); });
					circles
					  .enter().append("circle")
						.attr('class', 'enter')
						.attr("cx", function(d) { return x[p.x](d[var_positions[p.x]]); })
						.attr("cy", function(d) { return y[p.y](d[var_positions[p.y]]); })
						.attr("r", point_size)
						.style('fill-opacity', 1e-6)
						.style("fill", function(d) { 
							return group ? color(d[var_positions[group]]) : color(); })
						.transition()
						.duration(1000)
						.style('fill-opacity', opacity);
					circles.exit()
						.attr('class', 'exit')
						.transition()
						.duration(1000)
						.style('fill-opacity', 1e-6)
						.remove();
					// Plot brush.
					//    cell.call(brush.x(x[p.x]).y(y[p.y]));
				}
				else if ( cell.attr('class') == 'cell boxp') 
				{
					bdata = _.groupBy(filtered, 
						function(d) { return d[var_positions[group]]; })
					color_key = _.keys(bdata)
					bdata = _.map(bdata, function(e) { return _.map(e, function(x) { return x[var_positions[p.x]]}) } )
					box = cell.selectAll('svg').data(_.values(bdata),
							function(d) { return d ; })
					box.enter().append("svg")
						.attr('class', 'enter box')
						.attr("style", "fill: rgba(0, 0, 0, 0.0)")
						.attr("transform", function(d, i) { return "translate(" + (bwidth*i )  + ",0)"; })
						.attr("width", bwidth)
						.attr("height", bheight)
						.attr("x", function(d,i) {return bwidth*i + i*boxMarg.horiz_space })
						.attr("y", margin)
						.append("g")
						.attr("transform", function(d,i) { return "translate(" + boxMarg.horiz_space + "," + 0 + ")";})
						.call(chart[name])
						.style('fill-opacity', '0.7');
					box.exit().remove()
					box = cell.selectAll('svg g rect.box')
							.data(_.values(bdata))
					box.style("fill", function(d,i) { 
						return group ? color(color_key[i]) : color();})
					cell.selectAll('circle.outlier')
						.attr('r', 2)
						.attr('stroke-opacity', 0.2);
					cell.selectAll('line')
						.attr('stroke-opacity', 0.5)
				};
			};
			function plot_labels(p) {
				var cell = d3.select(this),
				name = cell.attr('xname')
				label_data = [[p.x, size*0.05, size*0.1, 0], 
				[p.y, size*0.05, size*0.17, 90]]
				labels = cell.selectAll('text')
					.data(label_data).enter()
					.append('text')
					.text(function(d) { return d[0] })
					.attr('x', function(d) { return d[1]})
					.attr('y', function(d) { return d[2]})
					.attr('font-size', font_size)
					.attr('transform', function(d) { 
						return "rotate(" + d[3] + " " + d[1] + "," + d[2] + ")";})
					.attr('fill-opacity', 0)
			d3.selectAll('g.cell')
				.on('mouseover', function() {
					xname = namify(d3.select(this).attr('xname'))
					yname = namify(d3.select(this).attr('yname'))
					d3.select(this).selectAll('text')
						.transition().duration(500)
						.attr('fill-opacity', 0.8)
					d3.selectAll(".x.axis." + xname + " g text")
						.transition().duration(500)
						.attr('fill-opacity', 0.9)
					d3.selectAll(".y.axis." + yname + " g text")
						.transition().duration(500)
						.attr('fill-opacity', 0.9)
				})
				.on('mouseout', function() {
					xname = namify(d3.select(this).attr('xname'))
					yname = namify(d3.select(this).attr('yname'))
					d3.select(this).selectAll('text')
						.transition().duration(500)
						.attr('fill-opacity', 0)
					d3.selectAll(".x.axis." + xname + " g text")
						.transition().duration(500)
						.attr('fill-opacity', 0.3)
					d3.selectAll(".y.axis." + yname + " g text")
						.transition().duration(500)
						.attr('fill-opacity', 0.3)
				})
			}
			var  matrix = cross(measure, measure);
			filtered = filter_dataset($('#filter-select').val())
			make_axes(filtered)
			cells = svg.selectAll('g.cell')
				.data(matrix)
			  .enter().append('svg:g')
				.attr("class", function(d) { return "cell " + d.plot })
				.attr("transform", function(d) { return "translate(" + d.i * size + "," + d.j * size + ")"; })
				.attr("xname", function(d) { return d.x ; } )
				.attr("yname", function(d) { return d.y ; } )

			cells.each(plot_labels)
			cells.each(plot)

			frames = cells.insert("rect", ':first-child')
				.attr("class", "frame")
				.attr("x", margin / 4)
				.attr("y", margin / 4)
				.attr("width", size - margin/2)
				.attr("height", size - margin/2)

			function update_plots(){
				filtered = filter_dataset($('#filter-select').val())
				make_axes(filtered)
				cells = svg.selectAll('g.cell')
				    .data(matrix).each(plot)
			}
			$('#filter-select').change(function() {
			update_plots();
			});
		});
	};
	scatter_matrix.width = function(_x) {
	  if(!arguments.length) return width;
	  width = _x;
	  return scatter_matrix;
	};

	scatter_matrix.height = function(_x) {
	  if(!arguments.length) return height;
	  height = _x;
	  return scatter_matrix;
	};

	scatter_matrix.margin = function(_x) {
	  if(!arguments.length) return margin;
	  margin = _x;
	  return scatter_matrix;
	};

	scatter_matrix.group = function(_x) {
	  if(!arguments.length) return group;
	  group = _x;
	  return scatter_matrix;
	};

	scatter_matrix.filter = function(_x) {
	  if(!arguments.length) return filter;
	  filter = _x;
	  return scatter_matrix;
	};

	scatter_matrix.id= function(_x) {
	  if(!arguments.length) return id;
	  id = _x;
	  return scatter_matrix;
	};

	scatter_matrix.point_size = function(_x) {
	  if(!arguments.length) return point_size;
	  point_size = _x;
	  return scatter_matrix;
	};

	scatter_matrix.opacity = function(_x) {
	  if(!arguments.length) return opacity;
	  opacity = _x;
	  return scatter_matrix;
	};

	scatter_matrix.default_filter = function(_x) {
	  if(!arguments.length) return default_filter;
	  default_filter = _x;
	  return scatter_matrix;
	};
	scatter_matrix.font_size = function(_x) {
	  if(!arguments.length) return font_size;
	  font_size = _x;
	  return scatter_matrix;
	};
	d3.rebind(scatter_matrix)
	return scatter_matrix;
};

