## Simply adapted from Jason Davies
# https://www.jasondavies.com/parallel-sets/

library(rCharts)


d <- read.csv('~/Downloads/titanic.csv')
## uncomment and stick wherever
# ParallelSets = setRefClass('ParallelSets', contains = 'rCharts', methods = list(
# 	initialize = function(){
# 		callSuper()
# 		LIB <<- get_lib("http://benjh33.github.io/rchart_plugins/ParallelSets")
# 		lib <<- "ParallelSets"
# 		templates$script <<- '
# 		<script type="text/javascript">
# 		function draw{{chartId}}(){
# 		var params = {{{ chartParams }}}
# 		var chart = {{{ parsets }}}
# 
# 		d3.select("#" + params.id).append("svg")
# 				.datum({{{data}}})
# 				.call(chart)
# 				return chart;
# 				};
# 		
# 		$(document).ready(function(){
# 			draw{{chartId}}()
# 		});
# 		
# 		</script>'
#   },
#   getPayload = function(chartId){
#     skip = c('id', 'dom')
#     parsets = toChain(params[!(names(params) %in% c(skip, 'data'))], "d3.parsets()")
#     chartParams = RJSONIO:::toJSON(params[skip])
#     list(parsets = parsets, chartParams = chartParams, data=toJSONArray(params[['data']]),
#          chartId = chartId, lib = basename(lib), liburl = LIB$url
#     )
#   }
# ))
chart <- ParallelSets$new()

chart$set(data = d[1:1000,],
					height=700,
					width=800,
					dimensions = names(d)
					)
chart$addParams(height=700, width=800)
chart
