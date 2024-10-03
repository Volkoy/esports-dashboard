var globalData;

// Initialization of the dashboard

function init() {
  d3.json("data.json").then(function (data) {
    globalData = data;
    createBarChart(globalData);
    createScatterPlot(globalData);
    createLineChart(globalData);
  });
}

// Create visual idioms

function createBarChart(data) {
  const svgWidth = window.innerWidth / 2;
  const svgHeight = 350;
  const margin = 70;
  const xScale = d3
    .scaleLinear()
    .domain([0, 10])
    .range([margin, svgWidth - margin]);
  const yScale = d3
    .scaleBand()
    .domain(data.map((d) => d.oscar_year))
    .range([0, svgHeight - margin])
    .padding(0.3);
  const colorScale = d3
    .scaleLinear()
    .domain([d3.min(data, (d) => d.budget), d3.max(data, (d) => d.budget)])
    .range([0, 1]);
  d3.select(".BarChart")
    .append("h3")
    .style("margin-left", `${margin}px`)
    .text("Rating for each oscar year");
  const svg = d3
    .select(".BarChart")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);
  svg
    .selectAll("rect")
    .data(data, (d) => d.title)
    .enter()
    .append("rect")
    .attr("class", "dataItem")
    .attr("x", margin)
    .attr("y", (d) => yScale(d.oscar_year))
    .attr("width", (d) => xScale(d.rating) - margin)
    .attr("height", yScale.bandwidth())
    .style("fill", (d) => d3.interpolateBlues(colorScale(d.budget)))
    .style("stroke", "black")
    .style("stroke-width", 1)
    .on("mouseover", mouseOverFunction)
    .on("mouseleave", mouseLeaveFunction)
    .append("title")
    .text((d) => d.title);
  svg
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", `translate(0,${svgHeight - margin})`)
    .call(
      d3
        .axisBottom(xScale)
        .tickValues(d3.range(0, 11, 1))
        .tickFormat(d3.format("d"))
    );
  svg
    .append("g")
    .attr("class", "yAxis")
    .attr("transform", `translate(${margin},0)`)
    .call(
      d3
        .axisLeft(yScale)
        .tickValues(data.map((d) => d.oscar_year))
        .tickSizeOuter(0)
    );
  svg
    .append("text")
    .attr("x", svgWidth / 2)
    .attr("y", svgHeight - margin / 3)
    .attr("text-anchor", "middle")
    .text("Rating");
  svg
    .append("text")
    .attr("x", -svgHeight / 2 + margin / 2)
    .attr("y", margin / 3)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Year");
  svg
    .append("defs")
    .append("linearGradient")
    .attr("id", "barChartGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%")
    .append("stop")
    .attr("offset", "0%")
    .attr(
      "stop-color",
      d3.interpolateBlues(colorScale(d3.min(data, (d) => d.budget)))
    );

  svg
    .select("defs")
    .select("linearGradient")
    .append("stop")
    .attr("offset", "100%")
    .attr(
      "stop-color",
      d3.interpolateBlues(colorScale(d3.max(data, (d) => d.budget)))
    );

  svg
    .append("rect")
    .attr("x", svgWidth * 0.85)
    .attr("y", svgHeight * 0.1)
    .attr("width", 20)
    .attr("height", 70)
    .style("fill", "url(#barChartGradient)");

  const label = svg.append("g").attr("class", "label");

  label
    .append("text")
    .attr("x", svgWidth * 0.85)
    .attr("y", svgHeight * 0.1 - 20)
    .text("Budget");

  label
    .append("text")
    .attr("class", "labelMin")
    .attr("x", svgWidth * 0.85 + 25)
    .attr("y", svgHeight * 0.1 + 10)
    .style("font-size", "12px")
    .text(d3.min(data, (d) => d.budget / 1000000) + "M");

  label
    .append("text")
    .attr("class", "labelMax")
    .attr("x", svgWidth * 0.85 + 25)
    .attr("y", svgHeight * 0.1 + 70)
    .style("font-size", "12px")
    .text(d3.max(data, (d) => d.budget / 1000000) + "M");
}

function createScatterPlot(data) {
  const svgWidth = window.innerWidth / 2;
  const svgHeight = 350;
  const margin = 70;
  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.budget)])
    .range([margin, svgWidth - margin]);
  const yScale = d3
    .scaleLinear()
    .domain([10, 0])
    .range([margin * 0.09, svgHeight - margin]);
  d3.select(".ScatterPlot")
    .append("h3")
    .style("margin-left", `${margin}px`)
    .text("Correlation between budget and rating");
  const svg = d3
    .select(".ScatterPlot")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);
  svg
    .selectAll("circle")
    .data(data, (d) => d.title)
    .enter()
    .append("circle")
    .attr("class", "dataItem")
    .attr("r", 10)
    .attr("cx", (d) => xScale(d.budget))
    .attr("cy", (d) => yScale(d.rating))
    .style("fill", "steelblue")
    .style("stroke", "black")
    .style("stroke-width", 1)
    .on("mouseover", mouseOverFunction)
    .on("mouseleave", mouseLeaveFunction)
    .append("title")
    .text((d) => d.title);
  svg
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", `translate(0,${svgHeight - margin})`)
    .call(d3.axisBottom(xScale).tickSizeOuter(0).tickFormat(d3.format(".2s")));
  svg
    .append("g")
    .attr("class", "yAxis")
    .attr("transform", `translate(${margin},0)`)
    .call(d3.axisLeft(yScale));
  svg
    .append("text")
    .attr("x", svgWidth / 2)
    .attr("y", svgHeight - margin / 3)
    .attr("text-anchor", "middle")
    .text("Budget");
  svg
    .append("text")
    .attr("x", -svgHeight / 2 + margin / 2)
    .attr("y", margin / 2)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Rating");
}

function createLineChart(data) {
  const svgWidth = window.innerWidth;
  const svgHeight = 350;
  const margin = 70;

  const xScale = d3
    .scalePoint()
    .domain(data.map((d) => d.oscar_year).reverse())
    .range([margin, svgWidth - margin]);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.budget)].reverse())
    .range([margin * 0.09, svgHeight - margin]);
  d3.select(".LineChart")
    .append("h3")
    .style("margin-left", `${margin}px`)
    .text("Evolution of budget across the years");
  const svg = d3
    .select(".LineChart")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);
  const line = d3
    .line()
    .x((d) => xScale(d.oscar_year))
    .y((d) => yScale(d.budget));
  svg
    .append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2);
  svg
    .selectAll("circle")
    .data(data, (d) => d.title)
    .enter()
    .append("circle")
    .attr("class", "dataItem")
    .attr("r", 5)
    .attr("cx", (d) => xScale(d.oscar_year))
    .attr("cy", (d) => yScale(d.budget))
    .style("fill", "steelblue")
    .style("stroke", "black")
    .style("stroke-width", 1)
    .on("mouseover", mouseOverFunction)
    .on("mouseleave", mouseLeaveFunction)
    .append("title")
    .text((d) => d.title);
  svg
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", `translate(0,${svgHeight - margin})`)
    .call(d3.axisBottom(xScale));
  svg
    .append("g")
    .attr("class", "yAxis")
    .attr("transform", `translate(${margin},0)`)
    .call(d3.axisLeft(yScale).tickSizeOuter(0).tickFormat(d3.format(".2s")));
  svg
    .append("text")
    .attr("x", svgWidth / 2)
    .attr("y", svgHeight - margin / 3)
    .attr("text-anchor", "middle")
    .text("Oscar Year");
  svg
    .append("text")
    .attr("x", -svgHeight / 2 + margin / 2)
    .attr("y", margin / 3)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Budget");
}

// Update visual idioms

function updateDashboard(button) {
  d3.selectAll("button").attr("disabled", true);
  let newData;
  switch (button) {
    case "old":
      newData = globalData.slice(Math.ceil(globalData.length / 2));
      break;
    case "new":
      newData = globalData.slice(0, Math.ceil(globalData.length / 2));
      break;
    case "all":
      newData = globalData;
      break;

    default:
      break;
  }
  updateBarChart(newData);
  updateScatterPlot(newData);
  updateLineChart(newData);
}

function updateBarChart(data) {
  const svgWidth = window.innerWidth / 2;
  const svgHeight = 350;
  const margin = 70;
  const xScale = d3
    .scaleLinear()
    .domain([0, 10])
    .range([margin, svgWidth - margin]);
  const yScale = d3
    .scaleBand()
    .domain(data.map((d) => d.oscar_year))
    .range([0, svgHeight - margin])
    .padding(0.3);
  const colorScale = d3
    .scaleLinear()
    .domain([d3.min(data, (d) => d.budget), d3.max(data, (d) => d.budget)])
    .range([0, 1]);
  const svg = d3.select(".BarChart").select("svg");
  svg
    .selectAll("rect.dataItem")
    .data(data, (d) => d.title)
    .exit()
    .transition()
    .duration(1000)
    .style("opacity", 0)
    .remove()
    .end()
    .then(() => {
      svg
        .selectAll("rect.dataItem")
        .data(data, (d) => d.title)
        .transition()
        .duration(1000)
        .attr("x", margin)
        .attr("y", (d) => yScale(d.oscar_year))
        .attr("width", (d) => xScale(d.rating) - margin)
        .attr("height", yScale.bandwidth())
        .end()
        .then(() => {
          const allRect = svg
            .selectAll("rect.dataItem")
            .data(data, (d) => d.title)
            .enter()
            .append("rect")
            .attr("class", "dataItem")
            .attr("x", margin)
            .attr("y", (d) => yScale(d.oscar_year))
            .attr("width", (d) => xScale(d.rating) - margin)
            .attr("height", yScale.bandwidth())
            .style("fill", (d) => d3.interpolateBlues(colorScale(d.budget)))
            .style("stroke", "black")
            .style("stroke-width", 1)
            .style("opacity", 0)
            .on("mouseover", mouseOverFunction)
            .on("mouseleave", mouseLeaveFunction);
          allRect
            .transition()
            .duration(1000)
            .style("opacity", 1)
            .end()
            .then(() => {
              d3.selectAll("button").attr("disabled", null);
            });
          allRect.append("title").text((d) => d.title);
        });
    });
  svg
    .select("g.yAxis")
    .attr("transform", `translate(${margin},0)`)
    .transition()
    .duration(1000)
    .call(
      d3
        .axisLeft(yScale)
        .tickValues(data.map((d) => d.oscar_year))
        .tickSizeOuter(0)
    );
}

function updateScatterPlot(data) {
  const svgWidth = window.innerWidth / 2;
  const svgHeight = 350;
  const margin = 70;
  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.budget)])
    .range([margin, svgWidth - margin]);
  const yScale = d3
    .scaleLinear()
    .domain([10, 0])
    .range([margin * 0.09, svgHeight - margin]);
  const svg = d3
    .select(".ScatterPlot")
    .select("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);
  svg
    .selectAll("circle.dataItem")
    .data(data, (d) => d.title)
    .exit()
    .transition()
    .duration(1000)
    .style("opacity", 0)
    .remove()
    .end()
    .then(() => {
      svg
        .selectAll("circle.dataItem")
        .data(data, (d) => d.title)
        .transition()
        .duration(1000)
        .attr("r", 10)
        .attr("cx", (d) => xScale(d.budget))
        .attr("cy", (d) => yScale(d.rating))
        .end()
        .then(() => {
          const allCircle = svg
            .selectAll("circle.dataItem")
            .data(data, (d) => d.title)
            .enter()
            .append("circle")
            .attr("class", "dataItem")
            .attr("r", 10)
            .attr("cx", (d) => xScale(d.budget))
            .attr("cy", (d) => yScale(d.rating))
            .style("fill", "steelblue")
            .style("stroke", "black")
            .style("stroke-width", 1)
            .style("opacity", 0)
            .on("mouseover", mouseOverFunction)
            .on("mouseleave", mouseLeaveFunction);
          allCircle.transition().duration(1000).style("opacity", 1);
          allCircle.append("title").text((d) => d.title);
        });
    });

  svg
    .select("g.xAxis")
    .attr("transform", `translate(0,${svgHeight - margin})`)
    .transition()
    .duration(1000)
    .call(d3.axisBottom(xScale).tickSizeOuter(0).tickFormat(d3.format(".2s")));
}

function updateLineChart(data) {
  const svgWidth = window.innerWidth;
  const svgHeight = 350;
  const margin = 70;

  const xScale = d3
    .scalePoint()
    .domain(data.map((d) => d.oscar_year).reverse())
    .range([margin, svgWidth - margin]);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.budget)].reverse())
    .range([margin * 0.09, svgHeight - margin]);
  const svg = d3
    .select(".LineChart")
    .select("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);
  const line = d3
    .line()
    .x((d) => xScale(d.oscar_year))
    .y((d) => yScale(d.budget));
  svg
    .selectAll("circle.dataItem")
    .data(data, (d) => d.title)
    .exit()
    .remove();
  svg
    .select("path")
    .datum(data)
    .attr("class", "line")
    .transition()
    .duration(1000)
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2);
  svg
    .selectAll("circle.dataItem")
    .data(data, (d) => d.title)
    .transition()
    .duration(1000)
    .attr("r", 5)
    .attr("cx", (d) => xScale(d.oscar_year))
    .attr("cy", (d) => yScale(d.budget))
    .end()
    .then(() => {
      const allCircle = svg
        .selectAll("circle.dataItem")
        .data(data, (d) => d.title)
        .enter()
        .append("circle")
        .attr("class", "dataItem")
        .attr("r", 5)
        .attr("cx", (d) => xScale(d.oscar_year))
        .attr("cy", (d) => yScale(d.budget))
        .style("fill", "steelblue")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("opacity", 0)
        .on("mouseover", mouseOverFunction)
        .on("mouseleave", mouseLeaveFunction);
      allCircle.transition().duration(1000).style("opacity", 1);

      allCircle.append("title").text((d) => d.title);
    });

  svg
    .select("g.xAxis")
    .transition()
    .duration(1000)
    .attr("transform", `translate(0,${svgHeight - margin})`)
    .call(d3.axisBottom(xScale));
  svg
    .select("g.yAxis")
    .transition()
    .duration(1000)
    .attr("transform", `translate(${margin},0)`)
    .call(d3.axisLeft(yScale).tickSizeOuter(0).tickFormat(d3.format(".2s")));
}

// Triggered events

function mouseOverFunction(event, d) {
  d3.selectAll("circle.dataItem")
    .filter(function (elem) {
      return d.title == elem.title;
    })
    .style("fill", "red")
    .style("stroke-width", 3);
  d3.selectAll("rect.dataItem")
    .filter(function (elem) {
      elem["origColor"] = d3.select(this).style("fill");
      return d.title == elem.title;
    })
    .style("fill", "red")
    .style("stroke-width", 3);
}

function mouseLeaveFunction(event, d) {
  d3.selectAll("circle.dataItem")
    .style("fill", "steelblue")
    .style("stroke-width", 1);
  d3.selectAll("rect.dataItem")
    .style("fill", (d) => d.origColor)
    .style("stroke-width", 1);
}
