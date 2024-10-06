var globalData;

// Initialization of the dashboard
function init() {
  d3.json("esports.json").then(function (data) {
    globalData = data;
    createLineChart(globalData);
  });
}

// Create visual idioms
function createLineChart(data) {
  const container = d3.select(".LineChart");

  const svgWidth = container.node().getBoundingClientRect().width;
  const svgHeight = container.node().getBoundingClientRect().height;
  const margin = 70;

  const color = d3.scaleOrdinal(d3.schemePaired);

  // Tooltip
  const tooltip = d3
    .select(".LineChart")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Aggregate data by Genre and Year, summing Earnings
  const aggregatedData = d3.rollup(
    data,
    (v) => d3.sum(v, (d) => d.Earnings),
    (d) => d.Genre,
    (d) => d.Year
  );

  // Format data
  const formattedData = Array.from(aggregatedData, ([genre, yearMap]) => ({
    genre: genre,
    values: Array.from(yearMap, ([year, earnings]) => ({
      Year: year,
      Earnings: earnings,
    })),
  }));

  const years = [...new Set(data.map((d) => d.Year))];

  const xScale = d3
    .scalePoint()
    .domain(years)
    .range([margin, svgWidth - margin * 0.5]);

  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(formattedData, (genreData) =>
        d3.max(genreData.values, (d) => d.Earnings)
      ),
    ])
    .range([svgHeight - margin, margin * 0.15]);

  // Chart title
  d3.select(".LineChart")
    .append("div")
    .attr("class", "title_line")
    .style("display", "flex")
    .style("width", "100%")
    .style("justify-content", "space-between");

  d3.select(".title_line")
    .append("h3")
    .style("margin-left", `42px`)
    .text("Earnings per Year per Genre");

  d3.select(".title_line")
    .append("div")
    .attr("class", "linechart-buttons")
    .style("background-color", "lightgrey")
    .style("border-radius", ".5em")
    .style("padding", ".125em")
    .style("margin-right", "1em");
  d3.select(".linechart-buttons")
    .append("button")
    .text("Not Adjusted")
    .attr("class", "not-adjusted")
    .style("background-color", "blue")
    .style("border", "none")
    .style("border-radius", ".5em")
    .style("color", "white")
    .on("click", function () {
      d3.select(".not-adjusted")
        .style("background-color", "blue")
        .style("color", "white");
      d3.select(".adjusted")
        .style("background-color", "lightgrey")
        .style("color", "black");
    });
  d3.select(".linechart-buttons")
    .append("button")
    .text("Adjusted")
    .style("cursor", "pointer")
    .attr("class", "adjusted")
    .style("background-color", "lightgrey")
    .style("border", "none")
    .style("border-radius", ".5em")
    .on("click", function () {
      d3.select(".adjusted")
        .style("background-color", "blue")
        .style("color", "white");
      d3.select(".not-adjusted")
        .style("background-color", "lightgrey")
        .style("color", "black");

      const adjusteddData = d3.rollup(
        data,
        (v) => d3.sum(v, (d) => d.AdjustedEarnings),
        (d) => d.Genre,
        (d) => d.Year
      );
      const updatedData = Array.from(adjusteddData, ([genre, yearMap]) => ({
        genre: genre,
        values: Array.from(yearMap, ([year, AdjustedEarnings]) => ({
          Year: year,
          Earnings: AdjustedEarnings,
        })),
      }));

      updateLineChart(updatedData);
    });

  const svg = d3
    .select(".LineChart")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const line = d3
    .line()
    .x((d) => xScale(d.Year))
    .y((d) => yScale(d.Earnings));

  // Checkbox container
  const checkboxContainer = d3
    .select(".filter_container")
    .append("div")
    .attr("class", "checkbox-container")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("height", "100%");

  // Add "All" checkbox
  checkboxContainer
    .append("div")
    .attr("class", "checkbox-item")
    .attr("id", "all")
    .append("input")
    .attr("type", "checkbox")
    .attr("id", "checkbox-all")
    .attr("checked", true)
    .on("change", function () {
      const checked = d3.select(this).property("checked");
      toggleAllLinesVisibility(checked);
    });

  const checkAll = d3.select("#all");

  checkAll.append("label").attr("for", "checkbox-all").text("All");

  // Checkboxes for each genre
  checkboxContainer
    .selectAll(".checkbox")
    .data(formattedData)
    .enter()
    .append("div")
    .attr("class", "checkbox-item")
    .each(function (d, i) {
      const div = d3.select(this);

      // Add checkbox
      div
        .append("input")
        .attr("type", "checkbox")
        .attr("id", `checkbox-${i}`)
        .attr("checked", true) // Default checked
        .on("change", function () {
          const checked = d3.select(this).property("checked");
          toggleLineVisibility(i, checked);
        });

      // Add color circle before checkbox
      div
        .append("span")
        .style("display", "inline-block")
        .style("width", "12px")
        .style("height", "12px")
        .style("background-color", color(i))
        .style("border-radius", "50%")
        .style("margin-right", "6px");

      // Add label
      div.append("label").attr("for", `checkbox-${i}`).text(d.genre);
    });

  const selectedLines = [];
  // Draw lines and circles for each genre
  formattedData.forEach((genreData, index) => {
    const path = svg
      .append("path")
      .datum(genreData.values)
      .attr("class", `line line-${index}`)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", color(index))
      .attr("stroke-width", 3)
      .style("opacity", 1) // Set initial opacity to full
      .style("cursor", "pointer") // Change cursor to pointer
      .on("mouseover", function () {
        d3.select(this).transition().duration(200).attr("stroke-width", 5);

        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(`Genre: ${genreData.genre}`)
          .style("left", `${d3.event.pageX + 10}px`)
          .style("top", `${d3.event.pageY - 20}px`);
      })
      .on("mousemove", function () {
        tooltip
          .style("left", `${d3.event.pageX + 10}px`)
          .style("top", `${d3.event.pageY - 20}px`);
      })
      .on("mouseleave", function () {
        d3.select(this).transition().duration(200).attr("stroke-width", 3);
        tooltip.transition().duration(200).style("opacity", 0);
      })
      .on("click", function () {
        const isSelected = selectedLines.includes(index);

        if (isSelected) {
          // If the line is already selected, remove it from the array
          selectedLines.splice(selectedLines.indexOf(index), 1);
        } else {
          // If not, add it to the selected array
          selectedLines.push(index);
        }

        // Set opacity for all lines
        svg.selectAll(".line").each(function (_, i) {
          if (selectedLines.includes(i)) {
            d3.select(this).style("opacity", 1); // Full opacity for selected lines
          } else {
            d3.select(this).style(
              "opacity",
              selectedLines.length > 0 ? 0.2 : 1
            ); // Lower opacity for unselected lines, full opacity if no selection
          }
        });

        // Set opacity for all circles
        svg.selectAll(".circle").each(function (_, i) {
          if (selectedLines.includes(i)) {
            d3.select(this).style("opacity", 1); // Full opacity for selected circles
          } else {
            d3.select(this).style(
              "opacity",
              selectedLines.length > 0 ? 0.2 : 1
            ); // Lower opacity for unselected circles, full opacity if no selection
          }
        });
      });

    svg
      .selectAll(`.circle-${index}`)
      .data(genreData.values)
      .enter()
      .append("circle")
      .attr("class", `circle circle-${index}`)
      .attr("r", 5)
      .style("cursor", "pointer")
      .attr("cx", (d) => xScale(d.Year))
      .attr("cy", (d) => yScale(d.Earnings))
      .style("fill", color(index))
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 8)
          .style("stroke", "black")
          .style("stroke-width", 2);
        const formattedEarnings = new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(d.Earnings);
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(`Year: ${d.Year} <br>Earnings: $${formattedEarnings}`)
          .style("left", `${d3.event.pageX + 10}px`)
          .style("top", `${d3.event.pageY - 20}px`);
      })
      .on("mousemove", function () {
        tooltip
          .style("left", `${d3.event.pageX + 10}px`)
          .style("top", `${d3.event.pageY - 20}px`);
      })
      .on("mouseleave", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 5)
          .style("stroke", "none");

        tooltip.transition().duration(200).style("opacity", 0);
      });
  });

  // X and Y axes
  svg
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", `translate(0,${svgHeight - margin})`)
    .call(d3.axisBottom(xScale));

  svg
    .append("g")
    .attr("class", "yAxis")
    .attr("transform", `translate(${margin},0)`)
    .call(d3.axisLeft(yScale).tickFormat(d3.format(".2s")));

  svg
    .append("text")
    .attr("x", svgWidth / 2)
    .attr("y", svgHeight - margin / 2)
    .attr("text-anchor", "middle")
    .text("Years");

  svg
    .append("text")
    .attr("x", -svgHeight / 2 + margin / 2)
    .attr("y", margin / 3)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Earnings");

  function toggleLineVisibility(index, visible) {
    const display = visible ? null : "none"; // 'null' shows, 'none' hides
    d3.select(`.line-${index}`).style("display", display);
    d3.selectAll(`.circle-${index}`).style("display", display);

    // Check if "All" checkbox should be checked/unchecked
    checkAllBoxState();
  }

  // Function to toggle all lines
  function toggleAllLinesVisibility(visible) {
    formattedData.forEach((_, index) => {
      d3.select(`#checkbox-${index}`).property("checked", visible);
      toggleLineVisibility(index, visible);
    });
  }

  // Function to check/uncheck "All" checkbox based on individual selections
  function checkAllBoxState() {
    const allChecked = formattedData.every((_, index) =>
      d3.select(`#checkbox-${index}`).property("checked")
    );
    d3.select("#checkbox-all").property("checked", allChecked);
  }
}
