.plugins <- new.env()

library(rCharts)
.plugins$ScatterMatrix = setRefClass('ScatterMatrix', contains = 'rCharts', methods = list(
        initialize = function(){
            callSuper()
            LIB <<- get_lib("http://mostlyconjecture.com/rcharts_plugins/scatter_matrix")
            lib <<- "scatter_matrix"
      templates$chartDiv <<-''
            templates$script <<- '
            <script type="text/javascript">
            function draw{{chartId}}(){
            var params = {{{ chartParams }}}
            var scatter = {{{ scatter }}}.id(params.id)
            
            if(!params.data){
            d3.json(params.data_file, function(error, d) {
            d3.select("#" + params.id)
            .datum(d)
            .call(scatter)
            });
            } else {
            d3.select("#" + params.id)
            .datum(params.data)
            .call(scatter)
            }
            return scatter;
            };
            
            $(document).ready(function(){
            draw{{chartId}}()
            });
            
            </script>
<style>
.rChart .
</style>
      '
        },
        getPayload = function(chartId){
            skip = c('data', 'id', 'dom')
            scatter = toChain(params[!(names(params) %in% skip)], "d3.scatter_matrix()")
            chartParams = RJSONIO::toJSON(params[skip])
            list(scatter = scatter, chartParams = chartParams,
                     chartId = chartId, lib = basename(lib), liburl = LIB$url
            )
        }
    ))
.plugins$ParallelSets = setRefClass('ParallelSets', contains = 'rCharts', methods = list(
        initialize = function(){
            callSuper()
            LIB <<- get_lib("http://mostlyconjecture.com/rcharts_plugins/parallelsets")
            lib <<- "parallelsets"
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
.plugins$ChordDiagram = setRefClass('ChordDiagram', contains = 'rCharts', methods = list(
  initialize = function(){
    callSuper()
    LIB <<- get_lib("http://mostlyconjecture.com/rcharts_plugins/chord_diagram")
    lib <<- "chord_diagram"
    templates$script <<- '
    <script type="text/javascript">
    function draw{{chartId}}(){
    var params = {{{ chartParams }}}
    var chart = {{{ chordD }}}
    
    d3.select("#" + params.id) //.append("svg")
    .datum({"data":{{{data}}}, "matrix":{{{matrix}}} })
    .call(chart)
    return chart;
    };
    
    $(document).ready(function(){
    draw{{chartId}}()
    });
    
    </script>'
  },
  getPayload = function(chartId){
    chordD = toChain(params[!(names(params) %in% c('dom', 'data', 'matrix'))], "d3.chordDiagram()")
    chartParams = RJSONIO:::toJSON(params[c('dom', 'id')])
    list(chordD = chordD, chartParams = chartParams, data=toJSONArray(params[['data']]),
         matrix=toJSONArray(params[['matrix']]), chartId = chartId, lib = basename(lib), liburl = LIB$url
    )
  }
))
.plugins$HivePlot = setRefClass('HivePlot', contains = 'rCharts', methods = list(
  initialize = function(){
    callSuper()
    params$margin <<- 20
    params$outerRadius <<- 350
    params$innerRadius <<- 40
    params$height <<- 0
    params$width <<- "100%"
    LIB <<- get_lib("http://mostlyconjecture.com/rcharts_plugins/hive_plot")
    lib <<- "hive_plot"
    templates$chartDiv <<- "<{{container}} id = '{{ chartId }}' class = '{{ lib }}'></{{ container}}>"
    templates$script <<- '
    <script type="text/javascript">
    function draw{{chartId}}(){
    var params = {{{ chartParams }}}
    var chart = {{{ chart }}}
    
    d3.select("#" + params.id)
    .datum({"data": {{{data}}} 
})
    .call(chart)
    return chart;
    };
    
    $(document).ready(function(){
    draw{{chartId}}()
    });
    
    </script>
'
  },
  getPayload = function(chartId){
    square <- params$outerRadius * 2.2 + params$margin * 2 +
      params$innerRadius * 2
    ## allow manually setting dims, square by default
    params$height <<- if (params$height) params$height else square
    params$width <<- if(!is.null(params$width)) params$width else square
    chart = toChain(params[!(names(params) %in% c('dom', 'data'))], 
                    "d3.hivePlot()")
    chartParams = RJSONIO:::toJSON(params[c('dom', 'id')])
    list(chart = chart, chartParams = chartParams, 
         data=toJSON(params[['data']]), width=params$width,
         height=params$height,
    chartId = chartId, lib = basename(lib), 
    liburl = LIB$url)
  }
))
.plugins$ZoomMap = setRefClass('ZoomMap', contains = 'rCharts', methods = list(
        initialize = function(){
            callSuper()
            params$rootname <<- 'root'
            LIB <<- 
              get_lib("http://mostlyconjecture.com/rcharts_plugins/zoomable_treemap/")
            lib <<- "zoomable_treemap"
            templates$chartDiv <<- "<{{container}} id = '{{ chartId }}' class = '{{ lib }}'></{{ container}}>"
            templates$script <<- '
            <script type="text/javascript">
function draw{{ chartId }}(){
    var params = {{{ chartParams }}},
            root = {"key": params.rootname, "values": d3.nest()
                                                        {{{ nest }}}
                                                        .entries({{{data}}})}
            var chart = {{{ zoommap }}}
            
            d3.select("#" + params.id)
            .datum(root)
            .call(chart)
            return chart;
}
            $(document).ready(function(){
            draw{{chartId}}()
            });
            
            </script>'
      },
      getPayload = function(chartId){
        nest = paste(sprintf(".key(function(d) { return d.%s;}).sortKeys(d3.ascending)", 
                             params[['keys']]), collapse = '\n')
        skip = c('dom','keys', "data", "rootname")
        zoommap = toChain(params[!(names(params) %in% skip)], "d3.zoomable_treemap()")
        chartParams = RJSONIO:::toJSON(params[c('dom', 'id', 'rootname')])
        list(zoommap = zoommap, chartParams = chartParams, data=toJSONArray2(params[['data']]), nest = nest,
             chartId = chartId, lib = basename(lib), liburl = LIB$url
        )
      }
    ))
.plugins$Horizon = setRefClass('Horizon', contains = 'rCharts', methods = list(
        initialize = function(){
            callSuper()
            params$width <<- NULL # dimensions will get figured out later.
            params$height <<- NULL
            LIB <<- get_lib("~/projects/rcharts_plugins/horizon")
            lib <<- "horizon"
            templates$chartDiv <<- "<{{container}} id = '{{ chartId }}' class = '{{ lib }}'></{{ container}}>"
            templates$script <<- "
            <script type='text/javascript'>
function draw{{chartId}}(){
            var params = {{{ chartParams }}}
            var chart = {{{ horizon }}}
            data = {{{data}}}
            
            svg = d3.select('body')
                    .append('div')
                    .attr('id', '#' + params.id)
            svg.datum(data)
            .call(chart);
            return chart;
        };
        
        $(document).ready(function(){
          draw{{chartId}}()
        });
        
        </script>
          "
      },
      getPayload = function(chartId){
        skip = c('dom')
        horizon = toChain(params[!(names(params) %in% c(skip, 'data'))], "d3.horizon()")
        chartParams = RJSONIO:::toJSON(params[c(skip, 'id')])
        list(horizon = horizon, chartParams = chartParams, chartId = chartId, lib = basename(lib), liburl = LIB$url, data=toJSONArray(params[['data']])
        )
      }
    ))
.plugins$SeqSunburst = setRefClass('SeqSunburst', contains = 'rCharts', methods = list(
  initialize = function(){
    callSuper()
    params$width <<- 600
    params$height <<- NULL
    LIB <<- get_lib("http://mostlyconjecture.com/rcharts_plugins/sequence_sunburst")
    lib <<- "sequence_sunburst"
    templates$chartDiv <<- "<{{container}} id = '{{ chartId }}' class = '{{ lib }}'></{{ container}}>"
    templates$script <<- "
    <script type='text/javascript'>
    function draw{{chartId}}(){
    var params = {{{ chartParams }}}
    var chart = {{{ seq_sunburst }}}
    data = {{{data}}}
    data = _.map(data, function(d) { return [d[params.id_var], d[params.count_var]]})

    svg = d3.select( '#' + params.id);
    svg.datum(data)
    .call(chart);
    return chart;
    };
    
    $(document).ready(function(){
    draw{{chartId}}()
    });
    
    </script>
    "
  },
  getPayload = function(chartId){
    skip = c('dom', 'id_var', 'count_var')
    seq_sunburst = toChain(params[!(names(params) %in% c(skip, 'data'))], "d3.seq_sunburst()")
    chartParams = RJSONIO:::toJSON(params[c(skip, 'id')])
    list(seq_sunburst = seq_sunburst, chartParams = chartParams, chartId = chartId, lib = basename(lib), liburl = LIB$url, data=toJSONArray(params[['data']])
    )
  }
))

.plugins$PlotLM = setRefClass('PlotLM', contains = 'rCharts', methods = list(
  initialize = function(){
    callSuper()
#    lib <<- "http://mostlyconjecture.com/rcharts_plugins/plot_glmer"
    lib <<- "http://mostlyconjecture.com/rcharts_plugins/plot_glmer"
    LIB <<- get_lib(lib)
    templates$page <<- "http://mostlyconjecture.com/rcharts_plugins/plot_glmer/rChart.html"
    templates$chartDiv <<- "<{{container}} class='container' id='{{chartId}}' class='{{ lib }}'>
  <div class='row'>
    <div class='col-md-3 well' id='controls'>
    </div>
    <div class='col-md-9 chart' id='chart'>
    </div>
  </div>
</{{container}}>
"
    templates$script <<- 'http://mostlyconjecture.com/rcharts_plugins/plot_glmer/layouts/chart.html'
  },
  getPayload = function(chartId){
    skip = c('data', 'coefs')
    chartParams = rjson:::toJSON(params[!(names(params) %in% c(skip))])
    list(chartParams = chartParams, 
         chartId = chartId, 
         formulas = rjson::toJSON(params[['formulas']]),
         lib = basename(lib), liburl = LIB$url, 
         data = toJSONArray(params[['data']]), 
         coefs = rjson::toJSON(params[['coefs']]), 
         dtypes = rjson::toJSON(sapply(params[['data']], class))
    )
  },
  render = function(chartId = NULL, cdn = TRUE, static = TRUE) {
        params$dom <<- chartId %||% params$dom
        template = read_template(templates$page, package=NULL)
        assets = Map("c", get_assets(LIB, static = static, cdn = cdn), 
            html_assets)
        html = render_template(template, list(params = params, assets = assets, 
            chartId = params$dom, script = .self$html(params$dom), 
            CODE = srccode, lib = LIB$name, tObj = tObj, container = container))
    }

    ))

attach(.plugins)

