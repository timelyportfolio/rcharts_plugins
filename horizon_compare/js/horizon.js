(function() {
  d3.horizon = function() {

    var step_size = 'daily',
        date_var = 'date',
        nticks = 10,
        height = 50,
        low = "#d73027",
        high = "#1a9850",
        nbands = 4,
        format = "+,f",
        step_sizes = {'weekly': 604800000, 
                      'daily': 24*60*60*1000,
                      'monthly': 24*61*60*1000*30,
                      'fifteen': 60*15 }, // about right
        formatPrimary = '+,f',
        formatChange = '+.2%',
        window_width = 800,
        repeats = 1,
        lag = 0;

    function horizon(selection) {

      selection.each(function(data) {
        context = cubism.context()

        context.step(step_sizes[step_size])
                        .size(data.length * repeats) 
                        .stop()
        context.scale.domain(d3.extent(data.map(
                          function(d) { return d[date_var] * 1000; })))
        
        d3.select(d3.select('#' + id)
                    .node().parentNode)
            .classed('rChart', false)
        d3.select('#' + id)
            .classed('rChart', false)
            .append('div')
            .attr('id', 'horizon_window')
            .style('width', window_width + 'px')
            .style('overflow-x', function() {
              return window_width < data.length * repeats ? 'scroll': 'hidden';
            });
        d3.select('#horizon_window')
            .append('div')
            .attr('class', 'rule')
            .style('position', 'absolute')
            .call(context.rule());

        color_range = d3.range(nbands + 1).slice(1, nbands + 1)

        low = color_range.map(d3.scale.linear()
                                .range(['white', low]).domain([0,4])).reverse()

        high = color_range.map(d3.scale.linear()
                                  .range(['white', high]).domain([0,4]))

        col_names = d3.keys(data[0]).filter(function(d) { return d != date_var ;})

        // overriding default rule line style
        d3.select('.rule .line')
          .style('top', '30px')
          .style('height', function() {
            return ((2 * col_names.length) - 1 ) * (height + 1) + 'px';
          });

        primary = col_names[0]

        function fillArray(value, len) {
          var arr = [];
          for (var i = 0; i < len; i++) {
            arr.push(value);
          };
          return arr;
        }
        function nlags(v, lag) {
          var l = fillArray(0, lag)
          out = v.slice(lag, v.length).map(function(d, i) { 
            return (d - v[i])/v[i]; })
          return l.concat(out);
        }
        function pct_diff(v, lag) {
          if(lag == 0) { return v.map(function(d) { return d;}) };
          var l = fillArray(0, lag);
          out = v.slice(lag, v.length).map(function(d, i) {
            return d - v[i]
          })
          return l.concat(out);
        }
        fun = lag == 0 ? 1: 0; 

        function stretch(v) {
          return _.flatten(_.map(v, function(d) {
            return fillArray(d, repeats);
          }))
        }

        function calc_metric(metric, lag, fun) {

          return context.metric(
              function(start, stop, step, callback) {
                var p = fun(md.ffill(data.map(function(d, i) {
                            return [i, parseFloat(d[metric])]
                            })
                            ).map(function(d) { return d[1] }), lag)
                values = p.map(function(d, i) {
                  return d
                })
              callback( null, stretch(values) ); 
            });
        }

        function calc_raw(metric) {

          return context.metric(
              function(start, stop, step, callback) {
                var rows = md.ffill(data.map(function(d, i) {
                  return [ i, parseFloat(d[metric])]
                }));
                rows = rows.map(function(d) { return d[1]});
              callback(null,  stretch(rows)); 
            }, metric);
        }

        function draw_horizon(metric_list) {

          d3.select('#horizon_window')
            .selectAll(".axis") 
            .data(["top"])      
            .enter()
            .append("div")
            .attr("class", function(d) {
              return d + " axis";
            })
            .each(function(d) {
              d3.select(this)
                .call(context.axis()
                  .ticks(nticks).orient(d)); 
            });

          horizon = context.horizon()
                          .format(d3.format(format))
                          .height(height)
                          .mode(['mirror'])
                          .colors( low.concat(high))

          d3.select('#horizon_window')
            .selectAll(".horizon")
            .data(metric_list.map(calc_raw))
            .enter()
            .append("div")
            .attr("class", "horizon")
            .call(horizon)


        }
        hscroll = $("#horizon_window")
        hscroll.bind('scroll', function() {
          d3.selectAll('.value').style('right', 
            - hscroll.scrollLeft() +  'px' )
          d3.selectAll('.title, select').style('left', 
            hscroll.scrollLeft() +  'px' )
        })

        context.on("focus", function(i) {
            d3.select('.rule .line').style("left", 
              i == null ? null : - hscroll.scrollLeft() + i + 'px')
        });
        function calculate_comparison(metric_list, primary, fun) {
          ch_data = metric_list.map(function(d) { 
            return calc_metric(d, lag, fun) }),
          primary_data = calc_metric(primary, lag, fun)
          ch_data = ch_data.map(function(d) { 
            return [ primary_data, d] });
          return ch_data;
        }

        function comp_chart(title) {
          return context.comparison()
                        .formatChange(d3.format(formatChange))
                        .formatPrimary(d3.format(formatPrimary))
                        .height(height)
                        .title(title);
        }

        function compare_title(metric_list, primary, metric) {
          return { "pct_ratio": function(d, i) { 
            return "%\u0394" + primary + ' / ' 
            + "%\u0394" + metric_list[i]
             ;} , 
            "pct_diff" : function(d, i) { 
              return "(" + primary + " - " + 
                metric_list[i] + ")/" + metric_list[i]; } }[metric]
        }

        function draw_comparison(primary) {
          metric_list = col_names.filter(function(d) {
            return d != primary;
          })
          title = compare_title(metric_list, primary, calc_data[fun]['code'])
          comparison = comp_chart(title);
          ch_data = calculate_comparison(metric_list, primary, calc_data[fun]['fun']);
          comps = comparisons
                    .data(ch_data)
                   .enter()
                    .append('div')
                    .attr('class', 'horizon comparison')
                    .call(comparison)
          d3.selectAll('.value.primary').style('bottom', 
            '20px' )
          return comps
        }

        calc_data = [{'label':'ratio of percent change',
                    'fun': nlags,
                    'code': 'pct_ratio'}, 
                    {'label':'percent difference', 
                    'fun': pct_diff, 'code': 'pct_diff'}]

        draw_horizon(col_names);
        comparisons =  d3.select('#horizon_window')
                        .append('div')
                        .attr('class', 'comparisons')
                        .selectAll('.comparison');

        comps = draw_comparison(primary);

        // get the first canvas element and give it a top border
        // because I can't figure out how to do it in style.css
        d3.select('#horizon_window > .horizon canvas')
          .style('border-top', 'solid 1px black')

        function update_comparison(primary, fun) {
          metric_list = col_names.filter(function(d) {
            return d != primary;
          })
          title = compare_title(metric_list, primary, calc_data[fun]['code'])
          comparison = comp_chart(title);
          ch_data = calculate_comparison(metric_list, primary, 
            calc_data[fun]['fun']);

          ncomps = comparisons
                    .data(ch_data)
          ncomps.enter()
              .append('div')
              .attr('class', 'horizon comparison')
          comps.remove();
          ncomps.call(comparison)
          comps = ncomps
          d3.selectAll('.value.primary').style('bottom', 
            '20px' )
        }

        var var_button = d3.select('#horizon_window')
                            .append('select')
                            .attr('id', 'ch_variable')
                            .style('position', 'relative')
                            .on('change', function(d) {
                              primary = this.value;
                              update_comparison(primary, fun);
                            });
        
        var_button.selectAll('option')
          .data(col_names)
          .enter()
          .append('option')
          .attr('value', function(d) { return d;})
          .attr('selected', function(d) { return d == primary ? 'selected': null })
          .text(function(d) { return d})

        var lags = d3.select('#horizon_window')
                        .append('select')
                        .attr('id', 'lags')
                        .style('position', 'relative')
                        .on('change', function(d) {
                          lag = this.value;
                          update_comparison(primary, fun);
                        });
        
        lags.selectAll('option')
            .data(d3.range(0, 13))
           .enter()
            .append('option')
            .attr('value', function(d) { return d})
            .attr('selected', function(d, i) { return d == lag ? 'selected': null })
            .text(function(d) { return d == 0 ? "no lag": d + "-period lag"})

        var calc_choice = d3.select('#horizon_window')
                        .append('select')
                        .attr('id', 'calc_choice')
                        .style('position', 'relative')
                        .on('change', function(d) {
                          fun = this.value;
                          update_comparison(primary, fun);
                        });

        calc_choice.selectAll('option') 
          .data(calc_data)
         .enter()
          .append('option')
          .attr('value', function(d, i) { return i;})
          .attr('selected', function(d, i) { 
            if (lag == 0) {return i == 1 ? 'selected': null }
              else {return i == 0 ? 'selected':null;} })
          .text(function(d) { return d.label;})

      });
    }
    horizon.step_size = function(_) {
      if(!arguments.length) return step_size;
      step_size = _ ;
      return horizon;
    };
    horizon.date_var = function(_) {
      if(!arguments.length) return date_var;
      date_var = _ ;
      return horizon;
    };
    horizon.nticks = function(_) {
      if(!arguments.length) return nticks;
      nticks = _ ;
      return horizon;
    };
    horizon.height = function(_) {
      if(!arguments.length) return height;
      height = _ ;
      return horizon;
    };
    horizon.low = function(_) {
      if(!arguments.length) return low;
      low = _ ;
      return horizon;
    };
    horizon.high = function(_) {
      if(!arguments.length) return high;
      high = _ ;
      return horizon;
    };
    horizon.nbands = function(_) {
      if(!arguments.length) return nbands;
      nbands = _ ;
      return horizon;
    };
    horizon.format = function(_) {
      if(!arguments.length) return format;
      format = _ ;
      return horizon;
    };
    horizon.id = function(_) {
      if(!arguments.length) return id;
      id = _ ;
      return horizon;
    };
    horizon.formatChange = function(_) {
      if(!arguments.length) return formatChange;
      formatChange = _ ;
      return horizon;
    };
    horizon.formatPrimary = function(_) {
      if(!arguments.length) return formatPrimary;
      formatPrimary = _ ;
      return horizon;
    };
    horizon.lag = function(_) {
      if(!arguments.length) return lag;
      lag = _ ;
      return horizon;
    };
    horizon.window_width = function(_) {
      if(!arguments.length) return window_width;
      window_width = _ ;
      return horizon;
    };
    horizon.repeats = function(_) {
      if(!arguments.length) return repeats;
      repeats = _ ;
      return horizon;
    };
    return d3.rebind(horizon);
  }; 
})();
