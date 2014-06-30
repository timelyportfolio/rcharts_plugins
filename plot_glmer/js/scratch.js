

var svg = d3.select('.container').append('div')
    .style('float', 'right')
    .append("svg")
    .attr("width", '500px')
    .attr("height", '500px')
    .attr('class', 'frame')
    .append("g")
    .attr("transform", "translate(" + padding.left + "," + padding.top + ")")


_selection.select('.frame').append("g")
    .attr("class", "y axis")
    .attr('transform', 'translate(40, 10)')

svg.append('rect')
    .attr('class', 'background')
    .attr('pointer-events', 'all')
    .attr('fill', 'none')
    .attr('height', 460 + 'px')
    .attr('width', 490 + 'px')

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + 490 + ")")

var vb = svg.append('svg')
    .attr('id', 'vb')
    .attr('class', 'vb')
    .attr('top', 0)
    .attr('left', 0)
    .attr('width', 460 + 'px')
    .attr('height', 490 + 'px')
    .attr('viewBox', "0 0 " + 460 + " " + 490)

var d = [5,6,7,8,9]
var x = d3.scale.ordinal()
      .domain(d3.range(d.length))
      .rangeRoundBands([0, 460], .1)
var y = d3.scale.linear()
            .domain(d3.extent(d))
            .range([490, 0])
d3.select('#vb').append('g')
    .selectAll('rect')
    .data(d)
    .enter().append('rect')
    .attr('x', function(d,i) { return x(i)})
    .attr('y',  490)
    .attr('height', function(d) { return y(d)})

