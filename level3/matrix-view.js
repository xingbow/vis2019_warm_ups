var margin = {top: 80, right: 180, bottom: 100, left: 80},
    width = 750,
    height = 750;

var x = d3.scale.ordinal().rangeBands([0, width]),
    z = d3.scale.linear().domain([0, 4]).clamp(true),
    c = d3.scale.category10().domain(d3.range(10));

var svg = d3.select("#header2").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("margin-left", -margin.left + "px")
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.json("HKUST_coauthor_graph.json", function(graph) {
  var matrix = [],
      nodes ,
      links,
      n ;
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
	nodes = cse_nodes;
	links = cse_links;
	n = cse_nodes.length;
	console.log(nodes);

  // Compute index per node.
  nodes.forEach(function(node, i) {
    node.index = i;
    node.count = 0;
    matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
  });

  // Convert links to matrix; count character occurrences.
  links.forEach(function(link) {
    matrix[link.source][link.target].z += link.publications.length;
    matrix[link.target][link.source].z += link.publications.length;
    // matrix[link.source][link.source].z += 4;
	// matrix[link.target][link.target].z += 4;
	console.log(link)
    nodes[link.source].count++;
    nodes[link.target].count++;
    // sampleCategoricalData[nodes[link.source].group] = nodes[link.source].region;
  });

  // Precompute the orders.
  var orders = {
    name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].fullname, nodes[b].fullname); }),
   count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
   group: d3.range(n).sort(function(a, b) { return nodes[a].id - nodes[b].id; })
  };
  console.log(orders);
  // The default sort order.
  x.domain(orders.name);

  svg.append("rect")
      .attr("class", "background")
      .attr("width", width)
      .attr("height", height);

  var row = svg.selectAll(".row")
      .data(matrix)
    .enter().append("g")
      .attr("class", "row")
      .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
      .each(row);

  row.append("line")
      .attr("x2", width);

  row.append("text")
      .attr("x", -6)
      .attr("y", x.rangeBand() / 2)
      .attr("dy", ".32em")
      .attr("text-anchor", "end")
      .text(function(d, i) { return nodes[i].fullname; });

  var column = svg.selectAll(".column")
      .data(matrix)
    .enter().append("g")
      .attr("class", "column")
      .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

  column.append("line")
      .attr("x1", -width);

  column.append("text")
      .attr("x", 6)
      .attr("y", x.rangeBand() / 2)
      .attr("dy", ".32em")
      .attr("text-anchor", "start")
      .text(function(d, i) { return nodes[i].fullname; });

  function row(row) {
    var cell = d3.select(this).selectAll(".cell")
        .data(row.filter(function(d) { return d.z; }))
      	.enter().append("rect")
        .attr("class", "cell")
        .attr("x", function(d) { return x(d.x); })
        .attr("width", x.rangeBand())
        .attr("height", x.rangeBand())
        .attr("name1",function(d){ return nodes[d.x].fullname; })
        .attr("name2",function(d){ return nodes[d.y].fullname; })
        .style("fill-opacity", function(d) { return z(d.z); })
        .style("fill", function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : c(0); })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);
  }

  
  function mouseover(p) {
    // console.log(nodes[p.y].fullname);
    d3.select(this).style('fill',c(1));
    d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
    d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
     // select node in force-link diagram
    d3.selectAll('circle')
            .style('stroke-width',function(d){
                if(d.fullname==nodes[p.y].fullname||d.fullname==nodes[p.x].fullname){
                    return 2.5;
                }
            })
            .style("stroke", function(d){
                if(d.fullname==nodes[p.y].fullname||d.fullname==nodes[p.x].fullname){
                    return 'red';
                }
            });
  }

  function mouseout() {
    d3.select(this).style('fill',c(0))
    d3.selectAll("text").classed("active", false);
     d3.selectAll("rect").attr("width",x.rangeBand());
     d3.selectAll("rect").attr("height",x.rangeBand());
     // select node in force-link diagram
    d3.selectAll('circle')
            .style('stroke-width',1.5)
            .style("stroke",'white');
  }

  d3.select("#order").on("change", function() {
    clearTimeout(timeout);
    order(this.value);
  });

  function order(value) {
    x.domain(orders[value]);

    var t = svg.transition().duration(1500);

    t.selectAll(".row")
        .delay(function(d, i) { return x(i) * 4; })
        .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
      .selectAll(".cell")
        .delay(function(d) { return x(d.x) * 4; })
        .attr("x", function(d) { return x(d.x); });

    t.selectAll(".column")
        .delay(function(d, i) { return x(i) * 4; })
        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
  }

  var timeout = setTimeout(function() {
    order("group");
    d3.select("#order").property("selectedIndex", 2).node().focus();
  }, 2000);
});