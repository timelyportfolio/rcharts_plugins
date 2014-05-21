
            function drawcharta656e7aa0bf(){
            var params = {
 "id": "charta656e7aa0bf",
"dom": "charta656e7aa0bf",
"data": {
 "class": [ "Crew", "First Class", "Second Class", "Third Class", "Crew", "First Class", "Second Class", "Third Class", "Crew", "First Class", "Second Class", "Third Class", "Crew", "First Class", "Second Class", "Third Class", "Crew", "First Class", "Second Class", "Third Class", "Crew", "First Class", "Second Class", "Third Class", "Crew", "First Class", "Second Class", "Third Class", "Crew", "First Class", "Second Class", "Third Class" ],
"age": [ "Adult", "Adult", "Adult", "Adult", "Child", "Child", "Child", "Child", "Adult", "Adult", "Adult", "Adult", "Child", "Child", "Child", "Child", "Adult", "Adult", "Adult", "Adult", "Child", "Child", "Child", "Child", "Adult", "Adult", "Adult", "Adult", "Child", "Child", "Child", "Child" ],
"sex": [ "Female", "Female", "Female", "Female", "Female", "Female", "Female", "Female", "Male", "Male", "Male", "Male", "Male", "Male", "Male", "Male", "Female", "Female", "Female", "Female", "Female", "Female", "Female", "Female", "Male", "Male", "Male", "Male", "Male", "Male", "Male", "Male" ],
"status": [ "Perished", "Perished", "Perished", "Perished", "Perished", "Perished", "Perished", "Perished", "Perished", "Perished", "Perished", "Perished", "Perished", "Perished", "Perished", "Perished", "Survived", "Survived", "Survived", "Survived", "Survived", "Survived", "Survived", "Survived", "Survived", "Survived", "Survived", "Survived", "Survived", "Survived", "Survived", "Survived" ],
"count": [ 3, 4, 13, 89, 0, 0, 0, 17, 670, 118, 154, 387, 0, 0, 0, 35, 20, 140, 80, 76, 0, 1, 13, 14, 192, 57, 14, 75, 0, 5, 11, 13 ] 
},
"keys": [ "class", "age", "sex", "status" ] 
},
                root = d3.nest()
                         .key(function(d) { return d.class;})
.key(function(d) { return d.age;})
.key(function(d) { return d.sex;})
.key(function(d) { return d.status;})
                         .entries(params.data)

            var chart = d3.zoomable_treemap()
  .width(   800)
  .height(   400)
  .size("count")
  .color("count")
    
            d3.select("#" + params.id).append("svg")
                    .datum(root)
`                    .call(chart)
                    return chart;
                    };
            
            $(document).ready(function(){
                drawcharta656e7aa0bf()
            });
            
            