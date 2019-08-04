/**
 * Network graph visualization (work in progress)
 * Based on Force-Directed Graph by Mike Bostock: https://observablehq.com/@d3/force-directed-graph
 */

/* global d3, dataUrl */

const svg = d3.select("svg");
const width = +svg.attr("width");
const height = +svg.attr("height");

var node;
var edge;

const simulation = d3
  .forceSimulation()
  .force(
    "link",
    d3.forceLink().id(function(d) {
      return d.id;
    })
  ) // use link.strength() to gather groupings of nodes?
  .force("charge", d3.forceManyBody())
  .force("center", d3.forceCenter(width / 2, height / 2));

function ticked() {
  edge
    .attr("x1", function(d) {
      return d.source.x;
    })
    .attr("y1", function(d) {
      return d.source.y;
    })
    .attr("x2", function(d) {
      return d.target.x;
    })
    .attr("y2", function(d) {
      return d.target.y;
    });

  node.attr("transform", function(d) {
    return "translate(" + d.x + ", " + d.y + ")";
  });
}

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

function visualize(data) {
  edge = svg
    .selectAll(".edge")
    .data(data.edges)
    .enter()
    .append("line")
    .classed("edge", true);

  node = svg
    .selectAll(".node")
    .data(data.nodes)
    .enter()
    .append("g")
    .classed("node", true)
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

  node.append("circle").attr("r", 5);
  node.append("title").text(function(d) {
    return d.label;
  });

  simulation.nodes(data.nodes).on("tick", ticked);

  simulation.force("link").links(data.edges);
}

d3.json(dataUrl).then(visualize);
