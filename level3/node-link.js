var width = 750,
    height = 600;
var tmp_color,tmp_style;

var color = d3.scale.category20();

var force = d3.layout.force()
    .charge(-120)
    .linkDistance(100)
    .size([width, height]);

var svgnode = d3.select("#header1").append("svg")
    .attr("width", width)
    .attr("height", height);

d3.json("HKUST_coauthor_graph.json", function(error, graph) {
  if (error) throw error;
    var all_nodes = graph.nodes;
    var all_links = graph.edges;
    var cse_nodes=[], cse_links=[],cse_id=[];
    all_nodes.forEach(function(e){
        if(e.dept=='CSE'){
        cse_nodes.push(e);
        cse_id.push(e.id)
        }
    });
    // console.log(cse_nodes);

    all_links.forEach(
        function(e){
            var source = cse_id.indexOf(e.source);
            var target = cse_id.indexOf(e.target);
            if((source!=-1)&&(target!=-1)){
                e.source = source;
                e.target = target;
                cse_links.push(e);
            }
        }
    );
    // console.log(cse_links);
    var i,count;
    for(i=0;i<cse_nodes.length;i++){
        count = 0;
        cse_links.forEach(function(e){
            if(e.source==i ||e.target==i){
                count = count+1;
            }
        });
        cse_nodes[i].count = count;
    }
console.log(cse_nodes);

  force
      .nodes(cse_nodes)
      .links(cse_links)
      .start();
    // console.log(force);

  var link = svgnode.selectAll(".link")
      .data(cse_links)
    .enter().append("line")
      .attr("class", "link")
      //.style("stroke-width", function(d) { return Math.sqrt(d.value); })
      ;

  var node = svgnode.selectAll(".node")
      .data(cse_nodes)
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", function(d){return d.count+5;})
      .attr("name",function(d){ return d.fullname;})
      .style("fill", function(d) { return color(d.id); })
      .on('mouseover',mouseover)
      .on('mouseout',mouseout)
      .call(force.drag);
      // mouseover function
      function mouseover() {
        d3.select(this)
            .style('stroke-width',3)
            .style("stroke", 'red');
        var tmp_name = d3.select(this).attr('name');
        // console.log(tmp_name);
        var mx_name = document.getElementsByClassName('cell');
        // console.log(mx_name);
        var i;
        for(i=0;i<mx_name.length;i++){
            if(mx_name[i].getAttribute('name1')==tmp_name||mx_name[i].getAttribute('name2')==tmp_name){
                tmp_color = mx_name[i].style.fill;
                mx_name[i].style.fill = 'orange';
            }
        }
        var mx_text = document.getElementsByTagName('text');
        console.log(mx_text[0].style);
        for(i=0;i<mx_text.length;i++){
            if(mx_text[i].innerHTML==tmp_name){
                tmp_style = mx_text.style;
                mx_text[i].style.fill = 'red';
            }
        }

      }
      //mouse out function
      function mouseout() {
      d3.select(this)
          // .transition()
          // .duration(750)
          .style('stroke-width',1.5)
          .style("stroke", 'white');
        var mx_name = document.getElementsByClassName('cell');
        var i;
        for(i=0;i<mx_name.length;i++){
            mx_name[i].style.fill = tmp_color;
        }
        d3.selectAll("text").classed("active", false);
        var mx_text = document.getElementsByTagName('text');
        for(i=0;i<mx_text.length;i++){
            mx_text[i].style = tmp_style;
        }
    }
  node.append("title")
      .text(function(d) { return d.fullname + " (" + d.itsc + ")"; });

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  });
});

 