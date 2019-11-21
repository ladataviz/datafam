//Main drawing function
async function draw() {
  // **** Get data
  const graph = await d3.json("./datafam.json");
  const links = graph.links;
  const nodes = graph.nodes;
  let sortedNodes = nodes;
  let sortedLinks = links;

  // **** Scale for bubble size
  const sizeScale = d3
    .scaleLinear()
    .domain([0, 190])
    .range([2, 60]);

  // ***** Create Canvas
  const canvas = document.querySelector("canvas");
  const context = canvas.getContext("2d");
  canvas.width = document.body.clientWidth * 0.6;
  canvas.height = document.body.clientHeight - 10;
  const width = canvas.width;
  const height = canvas.height;

  // **** Create Force simulation
  const simulation = d3
    .forceSimulation(sortedNodes)
    .force(
      "link",
      d3.forceLink(sortedLinks).id(d => d.handle)
    )
    .force("charge", d3.forceManyBody().strength(-7))
    .force(
      "collide",
      d3.forceCollide(d => sizeScale(d.tweets) + 3)
    )
    .force("x", d3.forceX(width / 2))
    .force("y", d3.forceY(height / 2));

  // **** Tooltip
  const tooltip = d3.select("#tooltip");

  //Add mousemove action
  let closeNode;
  d3.select("canvas").on("mousemove", function(d) {
    const p = d3.mouse(this);
    closeNode = simulation.find(p[0], p[1], 20);
    closeNode ? onMouseEnter(closeNode) : onMouseLeave();
  });

  function onMouseEnter(datum) {
    tooltip.select("#count").text(datum.tweets);
    tooltip.select("#range").text(datum.handle);

    const x = datum.x + document.body.clientWidth * 0.35;
    const y = datum.y;

    tooltip.style(
      "transform",
      `translate(` + `calc( -50% + ${x}px),` + `calc(-100% + ${y}px)` + `)`
    );

    tooltip.style("opacity", 0.6);
  }

  function onMouseLeave() {
    tooltip.style("opacity", 0);
  }

  // ***** Text Input
  document.getElementById("handle").value = "@ladataviz";
  let handle_input = document.getElementById("handle");
  let handle = handle_input.value.toLowerCase();

  //Add listener when text input changes
  handle_input.addEventListener("input", onChange);
  function onChange(e) {
    changeHandle(e.target.value);
  }

  //Handle new Twitter handle in input text
  function changeHandle(newhandle) {
    handle = newhandle.toLowerCase();
    sortedNodes = [];
    sortedLinks = [];
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].handle !== handle) {
        sortedNodes.push(nodes[i]);
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].handle === handle) {
        sortedNodes.push(nodes[i]);
      }
    }

    for (let i = 0; i < links.length; i++) {
      if (
        links[i].source.handle !== handle &&
        links[i].target.handle !== handle
      ) {
        sortedLinks.push(links[i]);
      }
    }
    for (let i = 0; i < links.length; i++) {
      if (
        links[i].source.handle === handle ||
        links[i].target.handle === handle
      ) {
        sortedLinks.push(links[i]);
      }
    }
    ticked();
  }

  // **** Add Click action
  let clickedNode;
  d3.select("canvas").on("click", function(d) {
    const p = d3.mouse(this);
    clickedNode = simulation.find(p[0], p[1], 20);
    clickedNode ? onMouseClick(clickedNode) : "";
  });

  function onMouseClick(datum) {
    document.getElementById("handle").value = datum.handle;
    handle = document.getElementById("handle").value.toLowerCase();
    changeHandle(handle);
  }

  // **** Add drag action
  d3.select(canvas).call(
    d3
      .drag()
      .container(canvas)
      .subject(dragsubject)
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended)
  );
  function dragsubject() {
    return simulation.find(d3.event.x, d3.event.y);
  }

  function dragstarted() {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d3.event.subject.fx = d3.event.subject.x;
    d3.event.subject.fy = d3.event.subject.y;
  }

  function dragged() {
    d3.event.subject.fx = d3.event.x;
    d3.event.subject.fy = d3.event.y;
  }

  function dragended() {
    if (!d3.event.active) simulation.alphaTarget(0);
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
  }

  // **** Start
  //Tick simulation 100 times so it starts in an acceptable state
  simulation.tick(100);

  //Then run ticked function after every tick
  simulation.on("tick", ticked);

  //Ticked function
  function ticked() {
    context.clearRect(0, 0, width, height);

    //Draw links for each link where source or target != input handle
    context.beginPath();
    sortedLinks.forEach(d =>
      d.source.handle !== handle && d.target.handle !== handle
        ? drawLink(d)
        : ""
    );

    //Draw nodes for each link != input handle
    context.beginPath();
    sortedNodes.forEach(d => (d.handle !== handle ? drawNode(d) : ""));

    //Draw links for each link where source or target === input handle
    context.beginPath();
    sortedLinks.forEach(d =>
      d.source.handle === handle || d.target.handle === handle
        ? drawLink(d)
        : ""
    );

    //Draw nodes where handle === input handle
    context.beginPath();
    sortedNodes.forEach(d => (d.handle === handle ? drawNode(d) : ""));
  }

  // Link drawer function
  function drawLink(d) {
    context.beginPath();
    context.moveTo(d.source.x, d.source.y);
    context.lineTo(d.target.x, d.target.y);

    context.lineWidth =
      d.source.handle === handle || d.target.handle === handle ? 1.5 : 1;
    context.strokeStyle =
      d.source.handle === handle || d.target.handle === handle
        ? "white"
        : "#294972";
    context.stroke();
  }

  //Node drawer function
  function drawNode(d) {
    context.beginPath();
    context.moveTo(d.x + sizeScale(d.tweets), d.y);
    context.arc(d.x, d.y, sizeScale(d.tweets), 0, 2 * Math.PI);
    context.fillStyle = d.handle === handle ? "white" : "#417BBD";
    context.globalAlpha = 1;
    context.fill();
  }
}
draw();
