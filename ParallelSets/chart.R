## Simply adapted from Jason Davies
# https://www.jasondavies.com/parallel-sets/

library(rCharts)
library(RCurl)

f <- getURL('https://raw.githubusercontent.com/benjh33/rCharts_plugins/master/ParallelSets/titanic.csv')
d <- read.table(text=f, header=T, sep = ',')

ParallelSets = setRefClass('ParallelSets', contains = 'rCharts', methods = list(
	initialize = function(){
		callSuper()
		LIB <<- get_lib("path/to/rCharts_plugins/ParallelSets")
		lib <<- "ParallelSets"
		templates$script <<- '
		<script type="text/javascript">
		function draw{{chartId}}(){
		var params = {{{ chartParams }}}
		var chart = {{{ parsets }}}

		d3.select("#" + params.id).append("svg")
				.datum({{{data}}})
				.call(chart)
				return chart;
				};
		
		$(document).ready(function(){
			draw{{chartId}}()
		});
		
		</script>'
  },
  getPayload = function(chartId){
    skip = c('id', 'dom')
    parsets = toChain(params[!(names(params) %in% c(skip, 'data'))], "d3.parsets()")
    chartParams = RJSONIO:::toJSON(params[skip])
    list(parsets = parsets, chartParams = chartParams, data=toJSONArray(params[['data']]),
         chartId = chartId, lib = basename(lib), liburl = LIB$url
    )
  }
))
chart <- ParallelSets$new()

chart$set(data = d,
					height=700,
					width=800,
					dimensions = names(d)
					)
chart$addParams(height=700, width=800)
chart
