/**
 * Network graph visualization (work in progress)
 * Based on Force-Directed Graph by Mike Bostock: https://observablehq.com/@d3/force-directed-graph
 */

/* global d3, dataUrl */

/** This must correspond to nodes.csv columns */
const GROUPING_OPTIONS = ["Resource Type", "Design Level", "Industry Sector"];

const fig = d3.select("#figure");
const svg = d3.select("#graph");

var dimensions = document.getElementById("graph").getBoundingClientRect();
var groupKey = GROUPING_OPTIONS[0];
var groups;
var groupPos;
var color;
var node;
var edge;
var card;

const simulation = d3
  .forceSimulation()
  .force(
    "link",
    d3
      .forceLink()
      .id(d => d.id)
      .strength(0.05)
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

/** Create color map for groupings. */
function createColorScale(groups) {
  return d3
    .scaleOrdinal()
    .range(d3.schemeSet2)
    .domain(groups.map(d => d.name));
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
function updateLegend() {
  const legend = d3.select("#legend");
  legend.selectAll("div").remove();
  const legendItems = legend
    .selectAll("div")
    .data(groups)
    .enter()
    .append("div");
  legendItems
    .append("span")
    .classed("legend-item", true)
    .style("background-color", d => color(d.name));
  legendItems.append("span").text(d => d.name);
}

function updateNodeColors() {
  node
    .selectAll("circle")
    .style("fill", d => color(d[groupKey]))
    .style("stroke", d => color(d[groupKey]));
}

/** Update everything when the grouping option is changed. */
function selectGrouping(nodes) {
  groupKey = d3.select("select").property("value");
  groups = getGroups(nodes);
  color = createColorScale(groups);
  updateLegend();
  updateNodeColors();
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

function updateCardContents(d) {
  card.select("#description").text(d.description);
  card
    .select("#references")
    .selectAll("span")
    .remove();
  const links = card
    .select("#references")
    .selectAll("span")
    .data(d.links)
    .enter()
    .append("span")
    .html((d, i) => ` <a href="d">[${i + 1}]</a>`);
}

function nodeClicked(d) {
  // TODO
  card.select("#title").text(d.title);
  updateCardContents(d);
  card.classed("hidden", false);
}

function edgeClicked(d) {
  card.select("#title").text(`${d.source.label} → ${d.target.label}`);
  updateCardContents(d);
  card.classed("hidden", false);
}

function bgClicked() {
  card.classed("hidden", true);
}

/** Set up force-directed graph data visualization. */
function graph(data) {
  edge = svg
    .selectAll(".edge")
    .data(data.edges)
    .enter()
    .append("line")
    .classed("edge", true)
    .attr("id", (d, i) => `e-${i}`)
    .on("click", edgeClicked)
    .on("mouseover", (d, i) => {
      document.getElementById(`e-${i}`).setAttribute("class", "edge selected");
    })
    .on("mouseout", (d, i) => {
      document.getElementById(`e-${i}`).setAttribute("class", "edge");
    });

  node = svg
    .selectAll(".node")
    .data(data.nodes)
    .enter()
    .append("g")
    .classed("node", true)
    .attr("id", (d, i) => `n-${i}`)
    .on("click", nodeClicked)
    .on("mouseover", (d, i) => {
      document.getElementById(`n-${i}`).setAttribute("class", "node selected");
    })
    .on("mouseout", (d, i) => {
      document.getElementById(`n-${i}`).setAttribute("class", "node");
    })
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

  node
    .append("circle")
    .attr("r", 6)
    .style("fill", d => color(d[groupKey]))
    .style("stroke", d => color(d[groupKey]));
  node
    .append("text")
    .text(d => d.label)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle");

  simulation.nodes(data.nodes).on("tick", ticked);

  simulation.force("link").links(data.edges);
}

/** Create DOM elements necessary for displaying the legend & other widgets. */
function decorate(handleSelect) {
  const rect = svg
    .append("rect")
    .attr("id", "bg")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", dimensions.width)
    .attr("height", dimensions.height)
    .on("click", bgClicked);

  const legendBox = fig.append("div").attr("id", "legend-box");
  legendBox
    .append("div")
    .classed("heading", true)
    .text("Group by");

  const select = legendBox.append("select").on("change", handleSelect);

  select
    .selectAll("option")
    .data(GROUPING_OPTIONS)
    .enter()
    .append("option")
    .text(d => d);

  legendBox
    .append("div")
    .classed("heading", true)
    .text("Legend");
  legendBox.append("div").attr("id", "legend");

  card = fig
    .append("div")
    .attr("id", "card")
    .classed("hidden", true);

  card
    .append("div")
    .attr("id", "title")
    .classed("heading", true);
  card.append("div").attr("id", "description");
  const sources = card.append("div");
  sources
    .append("span")
    .classed("quiet", true)
    .text("Sources:");
  sources.append("span").attr("id", "references");
}

/** Initialize visualization and set window resize behaviour. */
function visualize(parsed) {
  const data = { nodes: parsed[0], edges: parsed[1] };
  groups = getGroups(data.nodes);
  groupPos = getGroupPositions(groups);
  color = createColorScale(groups);
  updateGroupPositions();
  decorate(event => selectGrouping(data.nodes));
  updateLegend();
  graph(data);
  window.addEventListener("resize", event => {
    updateDimensions(data.nodes);
  });
}

/** CSV row conversion function */
function readCSV(row) {
  return {
    ...row,
    links: row.links.split(" ")
  };
}

Promise.all([
  d3.csv(`${dataUrl}/nodes.csv`, readCSV),
  d3.csv(`${dataUrl}/edges.csv`, readCSV)
]).then(visualize);
