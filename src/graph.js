/**
 * Network graph visualization (work in progress)
 * Based on Force-Directed Graph by Mike Bostock: https://observablehq.com/@d3/force-directed-graph
 */

/* global d3, dataUrl */

const GROUPING_OPTIONS = ["Resource Type", "Sector", "Topic"];
const fig = d3.select("#figure");
const svg = d3.select("#graph");
var dimensions = document.getElementById("graph").getBoundingClientRect();
var groupKey = GROUPING_OPTIONS[0];
var groups;
var groupPos;

const simulation = d3
  .forceSimulation()
  .force(
    "link",
    d3
      .forceLink()
      .id(d => d.id)
      .strength(0.01)
  )
  .force("charge", d3.forceManyBody())
  .force("collide", d3.forceCollide(20))
  .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2));

/** Find the unique categories and the number of nodes in each. */
function getGroups(nodes) {
  return d3
    .nest()
    .key(d => d[groupKey])
    .entries(nodes)
    .map(item => ({
      name: item.key,
      value: item.values.length
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Return positioning force coordinates for each categorical grouping of nodes.
 */
function getGroupPositions(groups) {
  const root = d3
    .hierarchy({ name: "root", children: groups })
    .sum(d => d.value);
  const packed = d3.pack().size([dimensions.width, dimensions.height])(root);
  return packed.children.reduce((ret, item) => {
    ret[item.data.name] = { x: item.x, y: item.y };
    return ret;
  }, {});
}

/** Update positioning and centering forces on the simulation. */
function updateDimensions(nodes) {
  dimensions = document.getElementById("graph").getBoundingClientRect();
  // Remove existing and apply new centering force
  simulation.force("center", null);
  simulation.force(
    "center",
    d3.forceCenter(dimensions.width / 2, dimensions.height / 2)
  );
  // Recalculate group positions and restart simulation
  groupPos = getGroupPositions(groups);
  updateGroupPositions();
}

/** Remove existing and apply new positioning forces to the simulation. */
function updateGroupPositions() {
  simulation.force("x", null).force("y", null);
  simulation
    .force("x", d3.forceX(node => groupPos[node[groupKey]].x).strength(0.1))
    .force("y", d3.forceY(node => groupPos[node[groupKey]].y).strength(0.1));
  simulation.alpha(1).restart();
}

/** Update the legend to reflect categories for selected grouping option. */
function updateLegend(nodes) {
  const legend = d3.select(".legend");
  legend.selectAll("div").remove();
  legend
    .selectAll("div")
    .data(groups)
    .enter()
    .append("div")
    .text(d => d.name);
}

/** Update everything when the grouping option is changed. */
function selectGrouping(nodes) {
  groupKey = d3.select("select").property("value");
  groups = getGroups(nodes);
  updateLegend(nodes);
  groupPos = getGroupPositions(groups);
  updateGroupPositions();
}

function ticked() {
  edge
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  node.attr("transform", d => "translate(" + d.x + ", " + d.y + ")");
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

function nodeClicked(d) {
  // TODO
  console.log(d.title);
}

function edgeClicked(d) {
  // TODO
  console.log(d.description);
}

/** Set up force-directed graph data visualization. */
function graph(data) {
  edge = svg
    .selectAll(".edge")
    .data(data.edges)
    .enter()
    .append("line")
    .classed("edge", true)
    .on("click", edgeClicked);

  node = svg
    .selectAll(".node")
    .data(data.nodes)
    .enter()
    .append("g")
    .classed("node", true)
    .on("click", nodeClicked)
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

  node.append("circle").attr("r", 5);
  node
    .append("text")
    .text(d => d.label)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle");

  simulation.nodes(data.nodes).on("tick", ticked);

  simulation.force("link").links(data.edges);
}

/** Create DOM elements necessary for displaying the legend box & contents. */
function createLegend(callback) {
  const legendBox = fig.insert("div").attr("class", "legend-box");
  legendBox.append("h6").text("Group by");

  const select = legendBox
    .append("select")
    .on("change", callback);

  select
    .selectAll("option")
    .data(GROUPING_OPTIONS)
    .enter()
    .append("option")
    .text(d => d);

  legendBox.append("h6").text("Legend");
  legendBox.append("div").attr("class", "legend");
}

/** Initialize visualization and set window resize behaviour. */
function visualize(data) {
  groups = getGroups(data.nodes);
  groupPos = getGroupPositions(groups);
  updateGroupPositions();
  createLegend(event => selectGrouping(data.nodes));
  updateLegend(data.nodes);
  graph(data);
  window.addEventListener("resize", event => {
    updateDimensions(data.nodes);
  });
}

d3.json(dataUrl).then(visualize);
