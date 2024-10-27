var globalData;
var originalData;

var brushedYearStart = null;
var brushedYearEnd = null;

var isSelected;

var parallelSelected = false;

var genres = [
  "Strategy",
  "First-Person Shooter",
  "Sports",
  "Fighting Game",
  "Racing",
  "Multiplayer Online Battle Arena",
  "Role-Playing Game",
  "Third-Person Shooter",
  "Music / Rhythm Game",
  "Collectible Card Game",
  "Puzzle Game",
  "Battle Royale",
];

var acronyms = {
  Strategy: "Strategy",
  "First-Person Shooter": "FPS",
  Sports: "Sports",
  "Fighting Game": "FTG",
  Racing: "Racing",
  "Multiplayer Online Battle Arena": "MOBA",
  "Role-Playing Game": "RPG",
  "Third-Person Shooter": "TPS",
  "Music / Rhythm Game": "Music",
  "Collectible Card Game": "TCG",
  "Puzzle Game": "Puzzle",
  "Battle Royale": "BR",
};

function getGenreByAcronym(acronym) {
  for (const [genre, acr] of Object.entries(acronyms)) {
    if (acr === acronym) {
      return genre; // Return the genre name if it matches
    }
  }
  return null; // Return null if the acronym does not exist
}

var selectedGenres = [...genres];

var years = Array.from({ length: 2024 - 1998 }, (_, i) => 1998 + i);

var colorScheme = {
  Strategy: "#a7cde3",
  "First-Person Shooter": "#2b77b3",
  Sports: "#afdd8f",
  "Fighting Game": "#299d39",
  Racing: "#fb9f97",
  "Multiplayer Online Battle Arena": "#EC0000",
  "Role-Playing Game": "#fbc171",
  "Third-Person Shooter": "#fe8600",
  "Music / Rhythm Game": "#cbb3d5",
  "Collectible Card Game": "#6d4198",
  "Puzzle Game": "#ECDC00",
  "Battle Royale": "#b05e26",
};
var minRange, maxRange;
var isAdjusted = false;

// Initialization of the dashboard
function init() {
  d3.json("esports.json").then(function (data) {
    globalData = data;
    originalData = data;
    createGenreFilter(globalData);
    createLineChart(globalData);
    createJitterPlot(globalData);
    createParallelCoordinates(globalData);
  });
}

function switchEarningData(data) {
  let aggregatedData;
  if (isAdjusted) {
    aggregatedData = d3.rollup(
      data,
      (v) => d3.sum(v, (d) => d.AdjustedEarnings),
      (d) => d.Genre,
      (d) => d.Year
    );
  } else {
    aggregatedData = d3.rollup(
      data,
      (v) => d3.sum(v, (d) => d.Earnings),
      (d) => d.Genre,
      (d) => d.Year
    );
  }
  return aggregatedData;
}

function createGenreFilter(data) {
  // Checkbox container
  const checkboxContainer = d3
    .select(".filter_container")
    .append("div")
    .attr("class", "checkbox-container")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("justify-content", "space-between")
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
      if (checked) {
        globalData = originalData;
        selectedGenres = [...genres];
        updateCharts(originalData);
      } else {
        globalData = originalData;
        selectedGenres = [];
        globalData = data.filter((g) => selectedGenres.includes(g.Genre));
        updateCharts(globalData);
      }
    });

  const checkAll = d3.select("#all");
  checkAll.append("label").attr("for", "checkbox-all").text("All");

  // Checkboxes for each genre
  checkboxContainer
    .selectAll(".checkbox")
    .data(genres)
    .enter()
    .append("div")
    .attr("class", "checkbox-item")
    .each(function (d, i) {
      const box = d3.select(this);
      box
        .append("input")
        .attr("type", "checkbox")
        .attr("id", `checkbox-${i}`)
        .attr("checked", true)
        .on("change", function () {
          const checked = d3.select(this).property("checked");
          toggleLineVisibility(d, checked);
          if (checked) {
            globalData = originalData;
            selectedGenres.push(d);
            globalData = data.filter((g) => selectedGenres.includes(g.Genre));
            updateCharts(globalData);
          } else {
            globalData = originalData;
            selectedGenres = selectedGenres.filter((genre) => genre !== d);
            globalData = data.filter((g) => selectedGenres.includes(g.Genre));
            updateCharts(globalData);
          }
        });

      // Add color circle before checkbox
      box
        .append("span")
        .style("display", "inline-block")
        .style("width", "12px")
        .style("height", "12px")
        .style("background-color", colorScheme[d])
        .style("border-radius", "50%")
        .style("margin-right", "6px");

      // Add label
      box
        .append("label")
        .attr("for", `checkbox-${i}`)
        .text(d)
        .style("font-size", "1em");
    });

  function toggleLineVisibility(genre, visible) {
    // Check if "All" checkbox should be checked/unchecked
    checkAllBoxState();
  }

  // Function to toggle all lines
  function toggleAllLinesVisibility(visible) {
    genres.forEach((_, index) => {
      d3.select(`#checkbox-${index}`).property("checked", visible);
      toggleLineVisibility(index, visible);
    });
  }

  // Function to check/uncheck "All" checkbox based on individual selections
  function checkAllBoxState() {
    const allChecked = genres.every((_, index) =>
      d3.select(`#checkbox-${index}`).property("checked")
    );
    d3.select("#checkbox-all").property("checked", allChecked);
  }
}

function createClassNames(name) {
  return name
    .toLowerCase() // Convert to lowercase
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, ""); // Remove any non-alphanumeric characters (excluding hyphens)
}

function updateCharts(data) {
  updateLineChart(data);
  updateJitterPlot(data);
  updateParallelCoordinates(data);
}

function updateLineChart(data) {
  const container = d3.select(".LineChart");

  const svgWidth = container.node().getBoundingClientRect().width;
  const svgHeight = container.node().getBoundingClientRect().height;
  const margin = 70;

  const svg = d3.select("#line-chart");

  // Prepare formatted data
  const formattedData = Array.from(
    switchEarningData(data, isAdjusted),
    ([genre, yearMap]) => ({
      genre: genre,
      values: Array.from(yearMap, ([year, earnings]) => ({
        Year: year,
        Earnings: earnings,
      })),
    })
  );

  years = [
    ...new Set(
      formattedData.flatMap((d) => d.values.map((v) => Number(v.Year)))
    ),
  ].sort((a, b) => a - b);

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

  // Update lines
  const line = d3
    .line()
    .x((d) => xScale(d.Year))
    .y((d) => yScale(d.Earnings));

  const lines = svg.selectAll(".line").data(formattedData, (d) => d.genre);

  // Enter selection: Create new lines for new genres
  lines
    .enter()
    .append("path")
    .attr("class", (d) => `line ${acronyms[d.genre]}`)
    .attr("d", (d) => line(d.values))
    .attr("fill", "none")
    .attr("stroke", (d) => `${colorScheme[d.genre]}`)
    .attr("stroke-width", 3)
    .style("opacity", 1)
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      const tooltip = d3.select(".tooltip");
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip
        .html(`Genre: ${d.genre}`)
        .style("left", `${event.pageX}px`)
        .style("top", `${event.pageY}px`);
      
      if (isSelected || parallelSelected) {
        d3.select(this).style("stroke-width", 5);
      } else {
        const classes = d3.select(this).attr("class").split(" ");
        const genre = classes[1];
        d3.select("#line-chart").selectAll(".line")
          .style("stroke", "grey")
          .style("opacity", 0.2);
        d3.select("#line-chart").selectAll(".circle")
          .style("fill", "grey")
          .style("opacity", 0.2);
  
        d3.select("#jitter-plot").selectAll(".circle")
          .style("fill", "grey")
          .style("opacity", 0.2);

        d3.select("#parallel-coordinates").selectAll(`.line-coordinate`)
          .style("stroke", "grey")
          .style("opacity", 0.2);

        d3.select(`.line.${genre}`)
          .style("stroke", colorScheme[getGenreByAcronym(genre)])
          .style("opacity",1)
          .style("stroke-width", 5)
        d3.select("#line-chart").selectAll(`.circle.${genre}`)
          .style("fill", colorScheme[getGenreByAcronym(genre)])
          .style("opacity",1)

        d3.select("#jitter-plot").selectAll(`.circle.${genre}`)
          .style("fill", colorScheme[getGenreByAcronym(genre)])
          .style("opacity", 1);

        d3.select("#parallel-coordinates").selectAll(`.line-coordinate.${genre}`)
          .style("stroke", colorScheme[getGenreByAcronym(genre)])
          .style("opacity", 1);
        
      }
    })
    .on("mouseleave", function (event, d) {
      const tooltip = d3.select(".tooltip");
      tooltip.transition().duration(200).style("opacity", 0);
      if (isSelected || parallelSelected) {
        d3.select(this).style("stroke-width", 3);
      } else {
        d3.select("#line-chart").selectAll(".line").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("stroke", colorScheme[getGenreByAcronym(genre)])
            .style("stroke-width", 3)
            .style("opacity", 1);
        })
        d3.select("#line-chart").selectAll(".circle").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("fill", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        })

        d3.select("#jitter-plot").selectAll(".circle").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("fill", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        })

        d3.select("#parallel-coordinates").selectAll(`.line-coordinate`).each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("stroke", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        })

      }
    });

  // Update selection: Update existing lines
  lines
    .transition()
    .duration(500)
    .attr("d", (d) => line(d.values));

  // Exit selection: Remove lines that no longer have data
  lines.exit().transition().duration(500).style("opacity", 0).remove();

  // Bind data to circles
  const circles = svg.selectAll(".circle").data(
    formattedData.flatMap((genreData) =>
      genreData.values.map((d) => ({ ...d, genre: genreData.genre }))
    ),
    (d) => d.Year + d.genre
  );

  // Enter selection: Create new circles for new data points
  circles
    .enter()
    .append("circle")
    .attr("class", (d) => `circle ${acronyms[d.genre]}`)
    .attr("r", 5)
    .style("cursor", "pointer")
    .attr("cx", (d) => xScale(d.Year))
    .attr("cy", (d) => yScale(d.Earnings))
    .style("fill", (d) => `${colorScheme[d.genre]}`)
    .on("mouseover", function (event, d) {
      const formattedEarnings = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(d.Earnings);
      const tooltip = d3.select(".tooltip");

      tooltip.transition().duration(200).style("opacity", 1);
      tooltip
        .html(
          `Genre: ${d.genre} <br> Year: ${d.Year} <br>Earnings: $${formattedEarnings}`
        )
        .style("left", `${event.pageX}px`)
        .style("top", `${event.pageY}px`);

      const color = d3.select(this).style("fill");
      const classes = d3.select(this).attr("class").split(" ");
      const genre = classes[1];

      if (isSelected || parallelSelected) {
        d3.select(this).attr("r", 8);
      } else {
        d3.select(this).attr("r", 8);
        const classes = d3.select(this).attr("class").split(" ");
        const genre = classes[1];
        d3.select("#line-chart").selectAll(".line")
          .style("stroke", "grey")
          .style("opacity", 0.2);
        d3.select("#line-chart").selectAll(".circle")
          .style("fill", "grey")
          .style("opacity", 0.2);

        d3.select("#jitter-plot").selectAll(".circle")
          .style("fill", "grey")
          .style("opacity", 0.2);

        d3.select("#parallel-coordinates").selectAll(`.line-coordinate`)
          .style("stroke", "grey")
          .style("opacity", 0.2);

        d3.select(`.line.${genre}`)
          .style("stroke", colorScheme[getGenreByAcronym(genre)])
          .style("opacity",1)
          .style("stroke-width", 5)
        d3.select("#line-chart").selectAll(`.circle.${genre}`)
          .style("fill", colorScheme[getGenreByAcronym(genre)])
          .style("opacity",1)

        d3.select("#jitter-plot").selectAll(`.circle.${genre}`)
          .style("fill", colorScheme[getGenreByAcronym(genre)])
          .style("opacity", 1);

        d3.select("#parallel-coordinates").selectAll(`.line-coordinate.${genre}`)
          .style("stroke", colorScheme[getGenreByAcronym(genre)])
          .style("opacity", 1);
      }
    })
    .on("mouseleave", function (event, d) {
      const tooltip = d3.select(".tooltip");
      tooltip.transition().duration(200).style("opacity", 0);
      if (isSelected || parallelSelected) {
        d3.select(this).attr("r", 5);
      } else {
        d3.select(this).attr("r", 5);
        d3.select("#line-chart").selectAll(".line").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("stroke", colorScheme[getGenreByAcronym(genre)])
            .style("stroke-width", 3)
            .style("opacity", 1);
        })
        d3.select("#line-chart").selectAll(".circle").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("fill", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        })
        d3.select("#jitter-plot").selectAll(".circle").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("fill", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        })

        d3.select("#parallel-coordinates").selectAll(`.line-coordinate`).each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("stroke", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        })
      }
    });

  // Update selection: Update existing circles
  circles
    .transition()
    .duration(500)
    .attr("cx", (d) => xScale(d.Year))
    .attr("cy", (d) => yScale(d.Earnings));

  // Exit selection: Remove circles that no longer have data
  circles.exit().transition().duration(500).style("opacity", 0).remove();

  // Update the axes
  const xAxis = svg.select(".xAxis");
  const yAxis = svg.select(".yAxis");

  // If axes do not exist, create them
  if (xAxis.empty()) {
    svg
      .append("g")
      .attr("class", "xAxis")
      .attr("transform", `translate(0,${svgHeight - margin})`)
      .call(d3.axisBottom(xScale));
  } else {
    xAxis.transition().duration(500).call(d3.axisBottom(xScale));
  }

  if (yAxis.empty()) {
    svg
      .append("g")
      .attr("class", "yAxis")
      .attr("transform", `translate(${margin},0)`)
      .call(d3.axisLeft(yScale).tickFormat(d3.format(".2s")));
  } else {
    yAxis
      .transition()
      .duration(500)
      .call(d3.axisLeft(yScale).tickFormat(d3.format(".2s")));
  }
  d3.selectAll(".grey-out").raise();
}

function createLineChart(data) {
  const container = d3.select(".LineChart");

  const svgWidth = container.node().getBoundingClientRect().width;
  const svgHeight = container.node().getBoundingClientRect().height;
  const margin = 70;

  const color = d3.scaleOrdinal(d3.schemePaired);

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

  const formattedData = Array.from(
    switchEarningData(data, false),
    ([genre, yearMap]) => ({
      genre: genre,
      values: Array.from(yearMap, ([year, earnings]) => ({
        Year: year,
        Earnings: earnings,
      })),
    })
  );

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
    .text("Earnings per Year by Genre");

  d3.select(".title_line")
    .append("div")
    .attr("class", "linechart-buttons")
    .style("background-color", "lightgrey")
    .style("border-radius", ".5em")
    .style("padding", ".125em")
    .style("display", "flex")
    .style("margin-right", "1em");

  d3.select(".linechart-buttons")
    .append("button")
    .text("Not Adjusted")
    .attr("class", "not-adjusted")
    .style("background-color", "blue")
    .style("border", "none")
    .style("border-radius", ".5em")
    .style("color", "white")
    .style("font-size", "0.75em")
    .property("disabled", true)
    .on("click", function () {
      isAdjusted = false;
      d3.select(".not-adjusted")
        .style("background-color", "blue")
        .style("color", "white")
        .style("cursor", "default")
        .property("disabled", true);
      d3.select(".adjusted")
        .style("background-color", "lightgrey")
        .style("color", "black")
        .style("cursor", "pointer")
        .property("disabled", false);

      if (brushedYearStart !== null && brushedYearEnd !== null) {
        const filteredData = globalData.filter(
          (d) => d.Year >= brushedYearStart && d.Year <= brushedYearEnd
        );
        updateLineChart(globalData);
        updateJitterPlot(filteredData); // Update the charts with filtered data
        updateParallelCoordinates(filteredData);
      } else {
        updateCharts(globalData); // Update with unfiltered data if no brushing
      }
    });

  d3.select(".linechart-buttons")
    .append("button")
    .text("Adjusted")
    .style("cursor", "pointer")
    .attr("class", "adjusted")
    .style("background-color", "lightgrey")
    .style("border", "none")
    .style("border-radius", ".5em")
    .style("font-size", "0.75em")
    .property("disabled", false)
    .on("click", function () {
      isAdjusted = true;
      d3.select(".adjusted")
        .style("background-color", "blue")
        .style("color", "white")
        .style("cursor", "default")
        .property("disabled", true);
      d3.select(".not-adjusted")
        .style("background-color", "lightgrey")
        .style("color", "black")
        .style("cursor", "pointer")
        .property("disabled", false);

      if (brushedYearStart !== null && brushedYearEnd !== null) {
        const filteredData = globalData.filter(
          (d) => d.Year >= brushedYearStart && d.Year <= brushedYearEnd
        );
        updateLineChart(globalData);
        updateJitterPlot(filteredData); // Update the charts with filtered data
      } else {
        updateCharts(globalData); // Update with unfiltered data if no brushing
      }
    });

  const svg = d3
    .select(".LineChart")
    .append("svg")
    .attr("id", "line-chart")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const line = d3
    .line()
    .x((d) => xScale(d.Year))
    .y((d) => yScale(d.Earnings));

  const brush = d3
    .brushX()
    .extent([
      [margin, 0],
      [svgWidth - margin / 3, svgHeight - margin],
    ]) // Define the extent of the brush
    .on("brush end", brushed);

  // Append a group for the brush
  const brushGroup = svg
    .append("g")
    .attr("class", "brush")
    .style("opacity", "0")
    .call(brush);

  // Draw lines and circles for each genre
  formattedData.forEach((genreData, index) => {
    const genreColor = colorScheme[genreData.genre];
    const path = svg
      .append("path")
      .datum(genreData.values)
      .attr("class", `line ${acronyms[genreData.genre]}`)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", genreColor)
      .attr("stroke-width", 3)
      .style("opacity", 1)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(`Genre: ${genreData.genre}`)
          .style("left", `${event.pageX}px`)
          .style("top", `${event.pageY}px`);

        if (isSelected || parallelSelected) {
          d3.select(this).style("stroke-width", 5);
        } else {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select("#line-chart").selectAll(".line")
            .style("stroke", "grey")
            .style("opacity", 0.2);
          d3.select("#line-chart").selectAll(".circle")
            .style("fill", "grey")
            .style("opacity", 0.2);
    
          d3.select("#jitter-plot").selectAll(".circle")
            .style("fill", "grey")
            .style("opacity", 0.2);

          d3.select("#parallel-coordinates").selectAll(`.line-coordinate`)
            .style("stroke", "grey")
            .style("opacity", 0.2);

          d3.select(`.line.${genre}`)
            .style("stroke", colorScheme[getGenreByAcronym(genre)])
            .style("opacity",1)
            .style("stroke-width", 5)
          d3.select("#line-chart").selectAll(`.circle.${genre}`)
            .style("fill", colorScheme[getGenreByAcronym(genre)])
            .style("opacity",1)

          d3.select("#jitter-plot").selectAll(`.circle.${genre}`)
            .style("fill", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);

          d3.select("#parallel-coordinates").selectAll(`.line-coordinate.${genre}`)
            .style("stroke", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
          
        }
      })
      .on("mouseleave", function (event, d) {
        if (isSelected || parallelSelected) {
          d3.select(this).style("stroke-width", 3);
        } else {
          d3.select("#line-chart").selectAll(".line").each(function (d) {
            const classes = d3.select(this).attr("class").split(" ");
            const genre = classes[1];
            d3.select(this)
              .style("stroke", colorScheme[getGenreByAcronym(genre)])
              .style("stroke-width", 3)
              .style("opacity", 1);
          })
          d3.select("#line-chart").selectAll(".circle").each(function (d) {
            const classes = d3.select(this).attr("class").split(" ");
            const genre = classes[1];
            d3.select(this)
              .style("fill", colorScheme[getGenreByAcronym(genre)])
              .style("opacity", 1);
          })

          d3.select("#jitter-plot").selectAll(".circle").each(function (d) {
            const classes = d3.select(this).attr("class").split(" ");
            const genre = classes[1];
            d3.select(this)
              .style("fill", colorScheme[getGenreByAcronym(genre)])
              .style("opacity", 1);
          })

          d3.select("#parallel-coordinates").selectAll(`.line-coordinate`).each(function (d) {
            const classes = d3.select(this).attr("class").split(" ");
            const genre = classes[1];
            d3.select(this)
              .style("stroke", colorScheme[getGenreByAcronym(genre)])
              .style("opacity", 1);
          })

        }
        tooltip.transition().duration(200).style("opacity", 0);
      });

    svg
      .selectAll(`.circle-${index}`)
      .data(genreData.values)
      .enter()
      .append("circle")
      .attr("class", `circle ${acronyms[genreData.genre]}`)
      .attr("r", 5)
      .style("cursor", "pointer")
      .attr("cx", (d) => xScale(d.Year))
      .attr("cy", (d) => yScale(d.Earnings))
      .style("fill", color(index))
      .on("mouseover", function (event, d) {
        const formattedEarnings = new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(d.Earnings);
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(
          `Genre: ${genreData.genre} <br> Year: ${d.Year} <br>Earnings: $${formattedEarnings}`
        );
        const color = d3.select(this).style("fill");
        const classes = d3.select(this).attr("class").split(" ");
        const genre = classes[1];

        if (isSelected || parallelSelected) {
          d3.select(this).attr("r", 8);
        } else {
          d3.select(this).attr("r", 8);
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select("#line-chart").selectAll(".line")
            .style("stroke", "grey")
            .style("opacity", 0.2);
          d3.select("#line-chart").selectAll(".circle")
            .style("fill", "grey")
            .style("opacity", 0.2);

          d3.select("#jitter-plot").selectAll(".circle")
            .style("fill", "grey")
            .style("opacity", 0.2);

          d3.select("#parallel-coordinates").selectAll(`.line-coordinate`)
            .style("stroke", "grey")
            .style("opacity", 0.2);

          d3.select(`.line.${genre}`)
            .style("stroke", colorScheme[getGenreByAcronym(genre)])
            .style("opacity",1)
            .style("stroke-width", 5)
          d3.select("#line-chart").selectAll(`.circle.${genre}`)
            .style("fill", colorScheme[getGenreByAcronym(genre)])
            .style("opacity",1)

          d3.select("#jitter-plot").selectAll(`.circle.${genre}`)
            .style("fill", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);

          d3.select("#parallel-coordinates").selectAll(`.line-coordinate.${genre}`)
            .style("stroke", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        }
      })
      .on("mouseleave", function (event, d) {
        if (isSelected || parallelSelected) {
          d3.select(this).attr("r", 5);
        } else {
          d3.select(this).attr("r", 5);
          d3.select("#line-chart").selectAll(".line").each(function (d) {
            const classes = d3.select(this).attr("class").split(" ");
            const genre = classes[1];
            d3.select(this)
              .style("stroke", colorScheme[getGenreByAcronym(genre)])
              .style("stroke-width", 3)
              .style("opacity", 1);
          })
          d3.select("#line-chart").selectAll(".circle").each(function (d) {
            const classes = d3.select(this).attr("class").split(" ");
            const genre = classes[1];
            d3.select(this)
              .style("fill", colorScheme[getGenreByAcronym(genre)])
              .style("opacity", 1);
          })
          d3.select("#jitter-plot").selectAll(".circle").each(function (d) {
            const classes = d3.select(this).attr("class").split(" ");
            const genre = classes[1];
            d3.select(this)
              .style("fill", colorScheme[getGenreByAcronym(genre)])
              .style("opacity", 1);
          })

          d3.select("#parallel-coordinates").selectAll(`.line-coordinate`).each(function (d) {
            const classes = d3.select(this).attr("class").split(" ");
            const genre = classes[1];
            d3.select(this)
              .style("stroke", colorScheme[getGenreByAcronym(genre)])
              .style("opacity", 1);
          })
        }
        tooltip.transition().duration(200).style("opacity", 0);
        tooltip.transition().duration(500).style("opacity", 0);
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
    .call(d3.axisLeft(yScale).tickFormat(d3.format(".0s")));

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
    
  // Create left and right overlay rectangles for greying out
  const greyLeft = svg
    .append("rect")
    .attr("class", "grey-out left")
    .attr("x", 0)
    .attr("y", 0)
    .attr("transform", `translate(${margin},0)`)
    .attr("height", svgHeight - margin)
    .attr("width", 0) // Start with no width
    .attr("fill", "grey")
    .attr("opacity", 0.7)
    .attr("filter", "url(#desaturate-filter)");

  const greyRight = svg
    .append("rect")
    .attr("class", "grey-out right")
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", svgHeight - margin)
    .attr("width", 0) // Start with no width
    .attr("fill", "grey")
    .attr("opacity", 0.7);

  // Helper function to find the closest year
  function findClosestYear(position, scale) {
    const domain = scale.domain(); // The array of years
    const range = scale.range(); // The corresponding pixel positions

    // Calculate the relative position as a percentage along the x-axis
    const relativePosition =
      (position - range[0]) / (range[range.length - 1] - range[0]);

    // Determine the index of the closest year in the domain array
    const closestIndex = Math.round(relativePosition * (domain.length - 1));

    // Return the year that corresponds to the closest index
    return domain[closestIndex];
  }

  // The brushed function to handle brush event
  function brushed(event) {
    if (!event.selection) return; // Exit if no selection is made

    const [x0, x1] = event.selection;

    // Map the brush pixel values to the actual years
    const xScale = d3
      .scalePoint()
      .domain(years)
      .range([margin, svgWidth - margin * 0.5]);
    const yearStart = findClosestYear(x0, xScale);
    const yearEnd = findClosestYear(x1, xScale);

    brushedYearStart = yearStart;
    brushedYearEnd = yearEnd;

    // Filter the globalData to only include games within the selected year range
    const filteredData = globalData.filter(
      (d) => d.Year >= yearStart && d.Year <= yearEnd
    );

    // Update the jitter plot with the filtered data
    updateJitterPlot(filteredData);

    // Update the grey-out areas in the line chart (optional visual feedback)
    greyLeft.attr("width", x0 - margin); // Grey out the area before the brush
    greyRight.attr("x", x1).attr("width", svgWidth - margin / 3 - x1); // Grey out the area after the brush

    updateParallelCoordinates(filteredData);
  }

  // Optional: To clear the brush and reset grey areas
  svg.on("dblclick", () => {
    brushGroup.call(brush.move, null); // Clear brush selection
    greyLeft.attr("width", 0); // Reset left grey area
    greyRight.attr("x", svgWidth).attr("width", 0); // Reset right grey area
    brushedYearEnd = null;
    brushedYearStart = null;
    updateCharts(globalData);
  });
}

function createJitterPlot(data) {
  const container = d3.select(".JitterPlot");

  const svgWidth = container.node().getBoundingClientRect().width;
  const svgHeight = container.node().getBoundingClientRect().height;
  const margin = 70;

  const jitterData = Array.from(
    d3.rollup(
      data,
      (v) => d3.sum(v, (d) => d.Players), // Sum the player base for each game
      (d) => d.Game, // Group by game
      (d) => d.Genre // Map genre as well
    ),
    ([game, genreMap]) => ({
      Game: game,
      Genre: Array.from(genreMap.keys())[0], // Extract genre (assuming a game belongs to one genre)
      TotalPlayers: Array.from(genreMap.values())[0], // Sum of players across all years
    })
  );

  const aggregatedData = jitterData.filter((d) => d.TotalPlayers > 0);
  const genres = [...new Set(data.map((d) => d.Genre))];
  const genreName = genres.map((genre) => acronyms[genre]);
  const offset = margin * 0.5;
  const genreScale = d3
    .scalePoint()
    .domain(genreName)
    .range([margin + offset, svgWidth - margin * 0.5]);

  const playerScale = d3
    .scaleLog()
    .domain([1, d3.max(aggregatedData, (d) => d.TotalPlayers) * 1.1])
    .range([svgHeight - margin, margin * 0.15]);

  const horizontalJitter = 40;
  const verticalJitter = 0;

  d3.select(".JitterPlot")
    .append("div")
    .attr("class", "title_jitter")
    .style("display", "flex")
    .style("width", "100%")
    .style("justify-content", "space-between");

  d3.select(".title_jitter")
    .append("h3")
    .style("margin-left", `42px`)
    .text("Player distribution per Game by Genre");

  const svg = container
    .append("svg")
    .attr("id", "jitter-plot")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const tooltip = d3
    .select(".JitterPlot")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Create a brush
  const brush = d3
    .brush()
    .extent([
      [0, 0],
      [svgWidth, svgHeight],
    ])
    .on("start brush end", brushed);

  svg.append("g").attr("class", "brush").call(brush);

  svg
    .selectAll("circle")
    .data(aggregatedData)
    .enter()
    .append("circle")
    .attr(
      "class",
      (d) => `circle ${acronyms[d.Genre]} ${createClassNames(d.Game)}`
    )
    .attr(
      "cx",
      (d) =>
        genreScale(acronyms[d.Genre]) + (Math.random() - 0.5) * horizontalJitter
    )
    .attr(
      "cy",
      (d) =>
        playerScale(d.TotalPlayers) + (Math.random() - 0.5) * verticalJitter
    )
    .attr("r", 5)
    .style("fill", (d) => colorScheme[d.Genre])
    .style("cursor", "pointer") // Change cursor to pointer
    .style("stroke", "#777")
    .style("stroke-width", 1)
    .on("mouseover", function (event, d) {
      const color = d3.select(this).style("fill");
      const classes = d3.select(this).attr("class").split(" ");
      const genre = classes[1];
      const game = classes[2];
      if (isSelected || parallelSelected) {
        d3.select(this).attr("r", 8);
      } else {
        const classes = d3.select(this).attr("class").split(" ");
        const genre = classes[1];
        d3.select(this).attr("r", 8);
        d3.select("#jitter-plot").selectAll(".circle").style("opacity", 0.2).style("fill", "grey");
        d3.select("#jitter-plot").selectAll(`.circle.${genre}`).style("opacity", 0.2).style("fill", colorScheme[getGenreByAcronym(genre)]);
        d3.select(this).style("opacity", 1);

        d3.select("#line-chart").selectAll(".line")
          .style("stroke", "grey")
          .style("opacity", 0.2);
        d3.select("#line-chart").selectAll(".circle")
          .style("fill", "grey")
          .style("opacity", 0.2);

        d3.select("#parallel-coordinates").selectAll(`.line-coordinate`)
          .style("stroke", "grey")
          .style("opacity", 0.2);

        d3.select(`.line.${genre}`)
          .style("stroke", colorScheme[getGenreByAcronym(genre)])
          .style("opacity",1)
        d3.select("#line-chart").selectAll(`.circle.${genre}`)
          .style("fill", colorScheme[getGenreByAcronym(genre)])
          .style("opacity",1);

        d3.select("#parallel-coordinates").selectAll(`.line-coordinate.${genre}`)
          .style("stroke", colorScheme[getGenreByAcronym(genre)])
          .style("opacity", 1);
        
      }

      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(`Game: ${d.Game}<br>Players: ${d.TotalPlayers}`)
        .style("left", event.pageX - 145 + "px")
        .style("top", event.pageY - 75 + "px")
        .style("z-index", "2");
    })
    .on("mouseleave", function (event, d) {
      const game = createClassNames(d.Game);
      if (isSelected || parallelSelected) {
        d3.select(this).attr("r", 5);
      } else {
        d3.select("#jitter-plot").selectAll(".circle").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("fill", colorScheme[getGenreByAcronym(genre)])
            .attr("r", 5)
            .style("opacity", 1);
        });
        d3.select("#line-chart").selectAll(".line").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("stroke", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        })
        d3.select("#line-chart").selectAll(".circle").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("fill", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        });
        d3.select("#parallel-coordinates").selectAll(`.line-coordinate`).each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("stroke", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        })
      }

      tooltip.transition().duration(500).style("opacity", 0);
    });

  function brushed(event) {
    // Make sure the selector is correct, i.e. your circles have class="circle"
    const circles = d3.select("#jitter-plot").selectAll(".circle");
    const selection = event.selection;

    if (selection) {
      isSelected = true;
      const [[x0, y0], [x1, y1]] = selection;
      const selected = [];
      const selectGames = [];
      const gameNames = [];
      circles.each(function (d) {
        const cx = parseFloat(d3.select(this).attr("cx"));
        const cy = parseFloat(d3.select(this).attr("cy"));
        if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          const game = classes[2];
          const game_name = d.Game;
          if (!selected.includes(genre)) {
            selected.push(genre);
          }
          if (!selectGames.includes(game)) {
            selectGames.push([genre, game]);
          }
          if (!gameNames.includes(game_name)) {
            gameNames.push(game_name);
          }
        }
      });
      const filteredData = data.filter(d =>
        gameNames.some((name) => d.Game == name)
      );
      updateLineChart(filteredData);
      updateParallelCoordinates(filteredData);
      d3.selectAll(".line").style("stroke", "grey").style("opacity", "0.2");
      d3.selectAll(".circle").style("fill", "grey").style("opacity", "0.2");

      selected.forEach((genre) => {
        d3.selectAll(`.line.${genre}`)
          .style("stroke", colorScheme[getGenreByAcronym(genre)])
          .style("opacity", "1");
        d3.selectAll(`.circle.${genre}`)
          .style("fill", colorScheme[getGenreByAcronym(genre)])
          .style("opacity", "1");
      });

      
      // Highlight circles within the brushed area
      circles.style("opacity", function (d) {
        // Check that d contains data and has a Genre property
        if (!d) return;
        const cx = parseFloat(d3.select(this).attr("cx"));
        const cy = parseFloat(d3.select(this).attr("cy"));
        // Ensure colorScheme[d.Genre] exists
        return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1
          ? "1"
          : colorScheme[d.Genre] || "grey";
      });

      // Optionally, grey out non-selected circles
      circles.style("opacity", function (d) {
        const cx = parseFloat(d3.select(this).attr("cx"));
        const cy = parseFloat(d3.select(this).attr("cy"));
        return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1 ? 1 : 0.2;
      });

      circles.style("fill", function (d) {
        const cx = parseFloat(d3.select(this).attr("cx"));
        const cy = parseFloat(d3.select(this).attr("cy"));
        return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1
          ? colorScheme[d.Genre]
          : "grey";
      });
    } else {
      updateLineChart(data);
      updateParallelCoordinates(data);
      isSelected = false;
      circles.style("opacity", "1");
      circles.each(function (d) {
        const classes = d3.select(this).attr("class").split(" ");
        const genre = classes[1];
        d3.select(this)
          .style("fill", colorScheme[getGenreByAcronym(genre)]) // Restore based on genre
          .style("opacity", "1");
      });
      const linechart = d3.select("#line-chart");
      linechart.selectAll(".line").each(function (d) {
        const classes = d3.select(this).attr("class").split(" ");
        const genre = classes[1];
        d3.select(this)
          .style("stroke", colorScheme[getGenreByAcronym(genre)]) // Restore based on genre
          .style("opacity", "1");
      });

      linechart.selectAll(".circle").each(function (d) {
        const classes = d3.select(this).attr("class").split(" ");
        const genre = classes[1];
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", "5")
          .style("fill", colorScheme[getGenreByAcronym(genre)]) // Restore based on genre
          .style("opacity", "1");
      });

      d3.selectAll(".line-coordinate").each(function (d) {
        const classes = d3.select(this).attr("class").split(" ");
        const genre = classes[1];
        d3.select(this)
          .style("stroke", colorScheme[getGenreByAcronym(genre)]) // Restore based on genre
          .style("opacity", "1")
          .style("stroke-width", "3");
      });
    }
  }
  // Axes
  svg
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", `translate(0,${svgHeight - margin})`)
    .call(d3.axisBottom(genreScale));

  svg
    .append("g")
    .attr("class", "yAxis")
    .attr("transform", `translate(${margin},0)`)
    .call(
      d3
        .axisLeft(playerScale)
        .tickValues([1, 10, 100, 1000, 10000, 100000])
        .tickFormat(d3.format(".0s"))
    );

  svg
    .append("text")
    .attr("x", svgWidth / 2)
    .attr("y", svgHeight - margin / 2)
    .attr("text-anchor", "middle")
    .text("Genres");

  svg
    .append("text")
    .attr("x", -svgHeight / 2 + margin / 2)
    .attr("y", margin / 3)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Player Base");
}

function updateJitterPlot(data) {
  const container = d3.select(".JitterPlot");

  const svgWidth = container.node().getBoundingClientRect().width;
  const svgHeight = container.node().getBoundingClientRect().height;
  const margin = 70;

  const jitterData = Array.from(
    d3.rollup(
      data,
      (v) => d3.sum(v, (d) => d.Players), // Sum the player base for each game
      (d) => d.Game, // Group by game
      (d) => d.Genre // Map genre as well
    ),
    ([game, genreMap]) => ({
      Game: game,
      Genre: Array.from(genreMap.keys())[0], // Extract genre (assuming a game belongs to one genre)
      TotalPlayers: Array.from(genreMap.values())[0], // Sum of players across all years
    })
  );

  const aggregatedData = jitterData.filter((d) => d.TotalPlayers > 0);
  const genres = [...new Set(data.map((d) => d.Genre))];
  const genreName = genres.map((genre) => acronyms[genre]);

  const offset = margin * 0.5;
  const genreScale = d3
    .scalePoint()
    .domain(genreName)
    .range([margin + offset, svgWidth - margin * 0.5]);

  const playerScale = d3
    .scaleLog()
    .domain([1, d3.max(aggregatedData, (d) => d.TotalPlayers) * 1.1])
    .range([svgHeight - margin, margin * 0.15]);

  const horizontalJitter = 40;
  const verticalJitter = 0;

  const svg = d3.select("#jitter-plot");

  // Bind data to circles
  const circles = svg.selectAll("circle").data(aggregatedData, (d) => d.Game); // Use game name as unique key

  // Update existing circles
  circles
    .transition()
    .duration(500)
    .attr(
      "cx",
      (d) =>
        genreScale(acronyms[d.Genre]) + (Math.random() - 0.5) * horizontalJitter
    )
    .attr(
      "cy",
      (d) =>
        playerScale(d.TotalPlayers) + (Math.random() - 0.5) * verticalJitter
    )
    .style("fill", (d) => colorScheme[d.Genre]);

  // Enter selection: Create new circles for new data points
  circles
    .enter()
    .append("circle")
    .style("cursor", "pointer")
    .attr(
      "class",
      (d) => `circle ${acronyms[d.Genre]} ${createClassNames(d.Game)}`
    )
    .attr("r", 5)
    .attr(
      "cx",
      (d) =>
        genreScale(acronyms[d.Genre]) + (Math.random() - 0.5) * horizontalJitter
    )
    .attr(
      "cy",
      (d) =>
        playerScale(d.TotalPlayers) + (Math.random() - 0.5) * verticalJitter
    )
    .style("fill", (d) => colorScheme[d.Genre])
    .style("stroke", "#777")
    .style("stroke-width", 1)
    .on("mouseover", function (event, d) {
      const tooltip = d3.select(".tooltip");
      const color = d3.select(this).style("fill");
      const classes = d3.select(this).attr("class").split(" ");
      const genre = classes[1];
      const game = classes[2];
      if (isSelected || parallelSelected) {
        d3.select(this).attr("r", 8);
      } else {
        const classes = d3.select(this).attr("class").split(" ");
        const genre = classes[1];
        d3.select(this).attr("r", 8);
        d3.select("#jitter-plot").selectAll(".circle").style("opacity", 0.2).style("fill", "grey");
        d3.select("#jitter-plot").selectAll(`.circle.${genre}`).style("opacity", 0.2).style("fill", colorScheme[getGenreByAcronym(genre)]);
        d3.select(this).style("opacity", 1);

        d3.select("#line-chart").selectAll(".line")
          .style("stroke", "grey")
          .style("opacity", 0.2);
        d3.select("#line-chart").selectAll(".circle")
          .style("fill", "grey")
          .style("opacity", 0.2);

        d3.select("#parallel-coordinates").selectAll(`.line-coordinate`)
          .style("stroke", "grey")
          .style("opacity", 0.2);

        d3.select(`.line.${genre}`)
          .style("stroke", colorScheme[getGenreByAcronym(genre)])
          .style("opacity",1)
        d3.select("#line-chart").selectAll(`.circle.${genre}`)
          .style("fill", colorScheme[getGenreByAcronym(genre)])
          .style("opacity",1);

        d3.select("#parallel-coordinates").selectAll(`.line-coordinate.${genre}`)
          .style("stroke", colorScheme[getGenreByAcronym(genre)])
          .style("opacity", 1);
        
      }

      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(`Game: ${d.Game}<br>Players: ${d.TotalPlayers}`)
        .style("left", event.pageX - 145 + "px")
        .style("top", event.pageY - 75 + "px")
        .style("z-index", "2");
    })
    .on("mouseleave", function (event, d) {
      const tooltip = d3.select(".tooltip");
      const game = createClassNames(d.Game);
      if (isSelected || parallelSelected) {
        d3.select(this).attr("r", 5);
      } else {
        d3.select("#jitter-plot").selectAll(".circle").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("fill", colorScheme[getGenreByAcronym(genre)])
            .attr("r", 5)
            .style("opacity", 1);
        });
        d3.select("#line-chart").selectAll(".line").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("stroke", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        })
        d3.select("#line-chart").selectAll(".circle").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("fill", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        });
        d3.select("#parallel-coordinates").selectAll(`.line-coordinate`).each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("stroke", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        })
      }

      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Exit selection: Remove circles that no longer have data
  circles.exit().transition().duration(500).style("opacity", 0).remove();

  // Update Axes
  const xAxis = svg.select(".xAxis");
  const yAxis = svg.select(".yAxis");

  if (xAxis.empty()) {
    svg
      .append("g")
      .attr("class", "xAxis")
      .attr("transform", `translate(0,${svgHeight - margin})`)
      .call(d3.axisBottom(genreScale));
  } else {
    xAxis.transition().duration(500).call(d3.axisBottom(genreScale));
  }

  if (yAxis.empty()) {
    svg
      .append("g")
      .attr("class", "yAxis")
      .attr("transform", `translate(${margin},0)`)
      .call(d3.axisLeft(playerScale));
  } else {
    yAxis
      .transition()
      .duration(500)
      .call(
        d3
          .axisLeft(playerScale)
          .tickValues([1, 10, 100, 1000, 10000, 100000])
          .tickFormat(d3.format(".0s"))
      );
  }
}

function createParallelCoordinates(data) {
  const container = d3.select(".ParallelCoordinates");

  // Get container dimensions
  const svgWidth = container.node().getBoundingClientRect().width;
  const svgHeight = container.node().getBoundingClientRect().height;
  const margin = { top: 30, right: 10, bottom: 0, left: 50 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;
  const brushWidth = 20;
  const deselectedColor = "#ddd";

  // Create a dictionary to hold game data
  const genreDataMap = {};

  // Iterate over the data to aggregate values
  data.forEach((d) => {
    const game = d.Game;
    const genre = d.Genre;

    if (!genreDataMap[genre]) {
      genreDataMap[genre] = {
        Genre: genre, // Store genre
        TotalPlayers: 0,
        TotalTournaments: 0,
        TotalEarnings: 0,
        TotalReleaseYears: 0, // Sum of release years for averaging
        Count: 0, // Count of entries to calculate average
        OfflineEarnings: d.OfflineEarnings,
        OnlineEarnings: d.OnlineEarnings,
      };
    }
    genreDataMap[genre].TotalTournaments += d.Tournaments;
    genreDataMap[genre].TotalPlayers += d.Players;
    genreDataMap[genre].TotalEarnings += d.Earnings;
    genreDataMap[genre].OfflineEarnings += d.OfflineEarnings;
    genreDataMap[genre].OnlineEarnings += d.OnlineEarnings;

    // Accumulate total release years for averaging
    genreDataMap[genre].TotalReleaseYears += d.ReleaseYear;
    genreDataMap[genre].Count += 1; // Increment count for each entry
  });

  // Convert the gameDataMap to an array
  // Convert the genreDataMap to an array
  const coordinatesData = Object.values(genreDataMap);
  const aggregatedData = coordinatesData.map((d) => {
    const averagePlayers = d.Count > 0 ? d.TotalPlayers / d.Count : 0;
    const averageTournaments = d.Count > 0 ? d.TotalTournaments / d.Count : 0;
    const averageEarnings = d.Count > 0 ? d.TotalEarnings / d.Count : 0;
    const averageOfflineEarnings = d.Count > 0 ? d.OfflineEarnings / d.Count : 0;
    const averageOnlineEarnings = d.Count > 0 ? d.OnlineEarnings / d.Count : 0;

    return {
      Genre: d.Genre,
      AveragePlayers: Math.floor(averagePlayers), // Round down to the nearest integer
      AverageTournaments: Math.floor(averageTournaments), // Round down to the nearest integer
      AverageEarnings: Math.floor(averageEarnings), // Round down to the nearest integer
      AverageOfflineEarnings: Math.floor(averageOfflineEarnings), // Round down to the nearest integer
      AverageOnlineEarnings: Math.floor(averageOnlineEarnings), // Round down to the nearest integer
      AverageReleaseYear: d.Count > 0 ? Math.round(d.TotalReleaseYears / d.Count) : 0, // Calculate average release year and round to nearest integer
    };
  });

  const keys = [
    "AveragePlayers",
    "AverageTournaments",
    "AverageEarnings",
    "AverageReleaseYear",
    "AverageOfflineEarnings",
    "AverageOnlineEarnings",
  ];

  const y = new Map(
    keys.map((key) => [
      key, d3
            .scaleLinear() // Use time scale for ReleaseDate
            .domain(d3.extent(aggregatedData, (d) => d[key])) // Set domain using the extent of ReleaseDate
            .range([height - margin.bottom, margin.top])
    ])
  );

  const x = d3.scalePoint(keys, [margin.left, width - margin.right]);
  // Create the tooltip div
  var tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("background", "#f9f9f9")
    .style("padding", "8px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("visibility", "hidden");

  // Create SVG
  const svg = container
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .attr("id", "parallel-coordinates");

  // Create the line path generator
  const line = d3
    .line()
    .defined(([, value]) => value != null)
    .y(([key, value]) => y.get(key)(value))
    .x(([key]) => x(key));

  // Add lines to the SVG
  const path = svg
    .append("g")
    .attr("class", "path-group")
    .attr("fill", "none")
    .attr("stroke-width", 3)
    .attr("opacity", 1)
    .style("cursor", "pointer")
    .selectAll("path")
    .data(aggregatedData)
    .join("path")
    .attr(
      "class",
      (d) => `line-coordinate ${acronyms[d.Genre]}`
    )
    .attr("stroke", (d) => colorScheme[d.Genre])
    .attr("d", (d) => {
      const lineData = keys.map((key) => [key, d[key]]);
      return line(lineData); // Ensure proper mapping
    })
    .on("mouseover", function (event, d) {
      const formattedAverageEarnings= new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(d.AverageEarnings);
      const formattedAverageOnlineEarnings = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(d.AverageOnlineEarnings);
      const formattedAverageOfflineEarnings = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(d.AverageOfflineEarnings);

      tooltip.transition().duration(200).style("opacity", 1);
      const classes = d3.select(this).attr("class").split(" ");
      const genre = classes[1];
      const game = classes[2];

      if (isSelected || parallelSelected) {
        d3.select(this).style("stroke-width", 5);
      } else {
        const classes = d3.select(this).attr("class").split(" ");
        const genre = classes[1];
        d3.select("#parallel-coordinates").selectAll(`.line-coordinate`)
            .style("stroke", "grey")
            .style("opacity", 0.2);

        d3.select(this).style("stroke-width", 5)
          .style("stroke", colorScheme[getGenreByAcronym(genre)])
          .style("opacity", 1);

        d3.select("#line-chart").selectAll(".line")
            .style("stroke", "grey")
            .style("opacity", 0.2);
        d3.select("#line-chart").selectAll(".circle")
          .style("fill", "grey")
          .style("opacity", 0.2);
    
        d3.select("#jitter-plot").selectAll(".circle")
          .style("fill", "grey")
          .style("opacity", 0.2);

        d3.select(`.line.${genre}`)
          .style("stroke", colorScheme[getGenreByAcronym(genre)])
          .style("opacity",1)
          .style("stroke-width", 5)
        d3.select("#line-chart").selectAll(`.circle.${genre}`)
          .style("fill", colorScheme[getGenreByAcronym(genre)])
          .style("opacity",1)

        d3.select("#jitter-plot").selectAll(`.circle.${genre}`)
          .style("fill", colorScheme[getGenreByAcronym(genre)])
          .style("opacity", 1);
      }

      // Display game details (all attributes) on hover in a tooltip or info box
      d3.select("#tooltip")
        .style("visibility", "visible")
        .html(
          `
          <strong>Game Details:</strong><br/>
          Genre: ${d.Genre}<br/>
          AveragePlayers: ${d.AveragePlayers}<br/>
          AverageTournaments: ${d.AverageTournaments}<br/>
          AverageEarnings: ${formattedAverageEarnings}<br/>
          AverageReleaseYear: ${d.AverageReleaseYear}<br/>
          AverageOfflineEarnings: ${formattedAverageOfflineEarnings}<br/>
          AverageOnlineEarnings: ${formattedAverageOnlineEarnings}<br/>
        `
        );
      const container = d3
        .select(".ParallelCoordinates")
        .node()
        .getBoundingClientRect();
      const tooltipNode = tooltip.node();
      const tooltipWidth = tooltipNode.offsetWidth;
      const tooltipHeight = tooltipNode.offsetHeight;

      // Get cursor position relative to the container
      const cursorX = event.pageX - container.left;
      const cursorY = event.pageY - container.top;

      // Dynamically calculate offsets based on cursor position
      let offsetX = 15; // Default horizontal offset
      let offsetY = 15; // Default vertical offset

      // Check if cursor is near the right edge
      if (cursorX + tooltipWidth + offsetX > container.width) {
        offsetX = -tooltipWidth - 15; // Move to the left of the cursor
      }

      // Check if cursor is near the bottom edge
      if (cursorY + tooltipHeight + offsetY > container.height) {
        offsetY = -tooltipHeight - 15; // Move above the cursor
      }

      // Calculate the tooltip's position based on mouse event and dynamic offset
      let tooltipX = event.pageX + offsetX;
      let tooltipY = event.pageY + offsetY;

      // Ensure the tooltip does not overflow the container on the top or left
      if (tooltipX < container.left) tooltipX = container.left + 15;
      if (tooltipY < container.top) tooltipY = container.top + 15;

      // Apply the adjusted position to the tooltip
      tooltip.style("top", tooltipY + "px").style("left", tooltipX + "px");
    })
    .on("mouseleave", function () {
      
      if (isSelected || parallelSelected) {
        d3.select(this).style("stroke-width", 3);
      } else {
        d3.select(this).style("stroke-width", 3);

        d3.select("#line-chart").selectAll(".line").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("stroke", colorScheme[getGenreByAcronym(genre)])
            .style("stroke-width", 3)
            .style("opacity", 1);
        })
        d3.select("#line-chart").selectAll(".circle").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("fill", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        })

        d3.select("#jitter-plot").selectAll(".circle").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("fill", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        })
        d3.select("#parallel-coordinates").selectAll(`.line-coordinate`).each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("stroke", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        })
      }
      d3.select("#tooltip").style("visibility", "hidden");
    });

  const drag = d3
    .drag()
    .on("start", function (event, d) {
      d3.select(this.parentNode).style("stroke", "black");
    })
    .on("drag", function (event, d) {
      const mouseX = event.sourceEvent.clientX;
  
      const closestIndex = keys.reduce((closestIdx, key, index) => {
        const currentDistance = Math.abs(mouseX - x(key)); // Use the x function to get the position of the key
        const closestDistance = Math.abs(mouseX - x(keys[closestIdx]));

        // Update closest index if the current distance is less than the closest distance
        return currentDistance < closestDistance ? index : closestIdx;
    }, 0);
      
  
      // Only move the axis if the new index is different and mouse has moved beyond threshold
      if (closestIndex !== this.initialIndex) {
        const currentIndex = keys.indexOf(d);
  
        if (closestIndex !== currentIndex) {
          // Rearrange the keys array based on the new index
          keys.splice(currentIndex, 1); // Remove the dragged key
          keys.splice(closestIndex, 0, d); // Insert at the new position
  
          x.domain(keys); // Update the scale domain with the new order
          updateAxesAndLines(); // Redraw the axes and lines based on new order
  
          // Update initial values for smooth behavior
          this.initialX = mouseX;
          this.initialIndex = closestIndex;
        }
      }
    })
    .on("end", function (event, d) {
      d3.select(this.parentNode).style("stroke", "none"); // Reset stroke on drag end
    });
  d3.select("#parallel-coordinates").selectAll(".axis text").call(drag);

  // Add axis for each key
  const axes = svg
    .append("g")
    .attr("class", "axes")
    .selectAll("g")
    .data(keys)
    .join("g")
    .attr("class", "axis")
    .attr("transform", (d) => `translate(${x(d)},0)`)
    .each(function (d) {
      const axis = d3.axisLeft(y.get(d));

      // Set ticks count
      const tickCount = 5;
      axis.ticks(tickCount);
      if (d === "AverageReleaseYear")
        axis.tickFormat((AverageReleaseYear) => AverageReleaseYear.toString().replace(/,/g, ''));

      d3.select(this)
        .call(axis)
        .selectAll("text") // Customize tick text
        .attr("fill", "currentColor")
        .attr("font-size", "10px");
    })
    .call((g) =>
      g
        .append("text")
        .attr("y", margin.top - 12)
        .attr("x", -32)
        .attr("text-anchor", "start")
        .attr("fill", "currentColor")
        .text((d) => d)
        .style("cursor", "grabbing")
        .call(drag)
    )
    .call((g) =>
      g
        .selectAll("text")
        .clone(true)
        .lower()
        .attr("fill", "none")
        .attr("stroke-width", 5)
        .attr("stroke-linejoin", "round")
        .attr("stroke", "white")
    );

  // Add brush functionality
  const brush = d3
    .brushY()
    .extent([
      [-(brushWidth / 2), margin.top],
      [brushWidth / 2, height - margin.bottom],
    ])
    .on("start brush end", brushed);

  axes.call(brush);

  const selections = new Map();

  function brushed({ selection }, key) {
    if (selection === null) {
      parallelSelected = false;
      selections.delete(key); // Remove selection if no brush
    } else {
      parallelSelected = true;
      const selectedRange = selection.map(y.get(key).invert);
      selections.set(key, selectedRange); // Store the selection range for this axis
    }

    const selected = [];
    path.each(function (d) {
      const active = Array.from(selections).every(
        ([key, [min, max]]) => d[key] <= min && d[key] >= max
      );

      d3.select(this).style(
        "stroke",
        active ? colorScheme[d.Genre] : deselectedColor
      ).style(
        "stroke-opacity",
        active ? 1 : 0.2
      );
      if (active) {
        d3.select(this).raise();
        selected.push(d);
      }
    });

    if (selected != []) {
      d3.select("#line-chart")
        .selectAll(".line")
        .style("stroke", "grey")
        .style("opacity", "0.2");
      d3.selectAll(".circle").style("fill", "grey").style("opacity", "0.2");

      selected.forEach(selectedItem => {
        const genre = selectedItem.Genre;
        d3.select("#line-chart").selectAll(`.line.${acronyms[genre]}`)
          .style("stroke", colorScheme[genre])
          .style("opacity", "1");
        d3.select("#line-chart").selectAll(`.circle.${acronyms[genre]}`)
          .style("fill", colorScheme[genre])
          .style("opacity", "1");
        d3.selectAll(`.circle.${acronyms[genre]}`)
          .style("fill", colorScheme[genre])
          .style("opacity", "1");
  
      })
    }
    svg.property("value", selected).dispatch("input");
  }

  function updateAxesAndLines() {
    // Update axes positions
    svg
      .selectAll(".axis")
      .transition() // Add a transition for smoother movement
      .duration(200) // Duration of the transition
      .attr("transform", (d) => `translate(${x(d)},0)`);

    // Update line paths
    svg
      .selectAll("path.line-coordinate") // Select the individual line paths directly
      .transition()
      .duration(200) // Duration of the transition
      .attr("d", (d) => {
        const lineData = keys.map((key) => [key, d[key]]);
        return line(lineData);
      });
  }
}

function updateParallelCoordinates(data) {
  const container = d3.select(".ParallelCoordinates");

  // Get container dimensions
  const svgWidth = container.node().getBoundingClientRect().width;
  const svgHeight = container.node().getBoundingClientRect().height;
  const margin = { top: 30, right: 10, bottom: 0, left: 50 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;
  const brushWidth = 20;
  const deselectedColor = "#ddd";

  // Create the tooltip div
  var tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("background", "#f9f9f9")
    .style("padding", "8px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("visibility", "hidden");

   // Create a dictionary to hold game data
   const genreDataMap = {};

   // Iterate over the data to aggregate values
   data.forEach((d) => {
     const genre = d.Genre;
 
     if (!genreDataMap[genre]) {
      genreDataMap[genre] = {
        Genre: genre, // Store genre
        TotalPlayers: 0,
        TotalTournaments: 0,
        TotalEarnings: 0,
        TotalReleaseYears: 0, // Sum of release years for averaging
        Count: 0, // Count of entries to calculate average
        OfflineEarnings: d.OfflineEarnings,
        OnlineEarnings: d.OnlineEarnings,
      };
    }
    genreDataMap[genre].TotalTournaments += d.Tournaments;
    genreDataMap[genre].TotalPlayers += d.Players;
    genreDataMap[genre].TotalEarnings += d.Earnings;
    genreDataMap[genre].OfflineEarnings += d.OfflineEarnings;
    genreDataMap[genre].OnlineEarnings += d.OnlineEarnings;

    // Accumulate total release years for averaging
    genreDataMap[genre].TotalReleaseYears += d.ReleaseYear;
    genreDataMap[genre].Count += 1; // Increment count for each entry
  });

  // Convert the gameDataMap to an array
  // Convert the genreDataMap to an array
  const coordinatesData = Object.values(genreDataMap);
  const aggregatedData = coordinatesData.map((d) => {
    const averagePlayers = d.Count > 0 ? d.TotalPlayers / d.Count : 0;
    const averageTournaments = d.Count > 0 ? d.TotalTournaments / d.Count : 0;
    const averageEarnings = d.Count > 0 ? d.TotalEarnings / d.Count : 0;
    const averageOfflineEarnings = d.Count > 0 ? d.OfflineEarnings / d.Count : 0;
    const averageOnlineEarnings = d.Count > 0 ? d.OnlineEarnings / d.Count : 0;

    return {
      Genre: d.Genre,
      AveragePlayers: Math.floor(averagePlayers), // Round down to the nearest integer
      AverageTournaments: Math.floor(averageTournaments), // Round down to the nearest integer
      AverageEarnings: Math.floor(averageEarnings), // Round down to the nearest integer
      AverageOfflineEarnings: Math.floor(averageOfflineEarnings), // Round down to the nearest integer
      AverageOnlineEarnings: Math.floor(averageOnlineEarnings), // Round down to the nearest integer
      AverageReleaseYear: d.Count > 0 ? Math.round(d.TotalReleaseYears / d.Count) : 0, // Calculate average release year and round to nearest integer
    };
  });

  const keys = [
    "AveragePlayers",
    "AverageTournaments",
    "AverageEarnings",
    "AverageReleaseYear",
    "AverageOfflineEarnings",
    "AverageOnlineEarnings",
  ];

  const y = new Map(
    keys.map((key) => [
      key, d3
            .scaleLinear() // Use time scale for ReleaseDate
            .domain(d3.extent(aggregatedData, (d) => d[key])) // Set domain using the extent of ReleaseDate
            .range([height - margin.bottom, margin.top])
    ])
  );

  const x = d3.scalePoint(keys, [margin.left, width - margin.right]);


  const drag = d3
    .drag()
    .on("start", function (event, d) {
      d3.select(this.parentNode).style("stroke", "black");
    })
    .on("drag", function (event, d) {
      const mouseX = event.sourceEvent.clientX;
  
      const closestIndex = keys.reduce((closestIdx, key, index) => {
        const currentDistance = Math.abs(mouseX - x(key)); // Use the x function to get the position of the key
        const closestDistance = Math.abs(mouseX - x(keys[closestIdx]));

        // Update closest index if the current distance is less than the closest distance
        return currentDistance < closestDistance ? index : closestIdx;
    }, 0);
      
  
      // Only move the axis if the new index is different and mouse has moved beyond threshold
      if (closestIndex !== this.initialIndex) {
        const currentIndex = keys.indexOf(d);
  
        if (closestIndex !== currentIndex) {
          // Rearrange the keys array based on the new index
          keys.splice(currentIndex, 1); // Remove the dragged key
          keys.splice(closestIndex, 0, d); // Insert at the new position
  
          x.domain(keys); // Update the scale domain with the new order
          updateAxesAndLines(); // Redraw the axes and lines based on new order
  
          // Update initial values for smooth behavior
          this.initialX = mouseX;
          this.initialIndex = closestIndex;
        }
      }
    })
    .on("end", function (event, d) {
      d3.select(this.parentNode).style("stroke", "none"); // Reset stroke on drag end
    });
  d3.select("#parallel-coordinates").selectAll(".axis text").call(drag);

  // Create or update axes
  const axesGroup = container.select(".axes");
  const axisSelection = axesGroup.selectAll("g.axis").data(keys, (d) => d);

  // Enter selection: add new axes
  const enterAxes = axisSelection
    .enter()
    .append("g")
    .attr("class", "axis")
    .attr("transform", (d) => `translate(${x(d)}, 0)`)
    .each(function (d) {
      const axis = d3.axisLeft(y.get(d));
      const tickCount = 5;

      axis.ticks(tickCount);
      if (d === "AverageReleaseYear")
        axis.tickFormat((AverageReleaseYear) => AverageReleaseYear.toString().replace(/,/g, ''));


      d3.select(this)
        .call(axis)
        .selectAll("text") // Customize tick text
        .attr("fill", "currentColor")
        .attr("font-size", "10px");
    });

  // Update selection: update existing axes
  const updateAxes = enterAxes
    .merge(axisSelection)
    .attr("transform", (d) => `translate(${x(d)}, 0)`)
    .each(function (d) {
      const axis = d3.axisLeft(y.get(d));
      const tickCount = 5;

      axis.ticks(tickCount);
      if (d === "AverageReleaseYear")
        axis.tickFormat((AverageReleaseYear) => AverageReleaseYear.toString().replace(/,/g, ''));

      d3.select(this)
        .call(axis)
        .selectAll("text") // Customize tick text
        .attr("fill", "currentColor")
        .attr("font-size", "10px");
    });

  // Exit selection: remove any axes that are no longer needed
  axisSelection.exit().remove();

  const line = d3
    .line()
    .defined(([, value]) => value != null)
    .y(([key, value]) => y.get(key)(value))
    .x(([key]) => x(key));

  const svg = d3.select("#parallel-coordinates");

  const paths = svg
    .select(".path-group")
    .selectAll("path.line-coordinate")
    .data(aggregatedData, (d) => d.Genre); // Use a key function based on Game to identify data points

  // Handle the enter selection: create new path elements for new data points
  paths
    .enter()
    .append("path")
    .attr(
      "class",
      (d) => `line-coordinate ${acronyms[d.Genre]}}`
    )
    .attr("stroke", (d) => colorScheme[d.Genre])
    .attr("d", (d) => {
      const lineData = keys.map((key) => [key, d[key]]);
      return line(lineData);
    })
    .merge(paths) // Merge updates for existing data
    .attr("d", (d) => {
      const lineData = keys.map((key) => [key, d[key]]);
      return line(lineData);
    })
    .on("mouseover", function (event, d) {
      const formattedAverageEarnings= new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(d.AverageEarnings);
      const formattedAverageOnlineEarnings = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(d.AverageOnlineEarnings);
      const formattedAverageOfflineEarnings = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(d.AverageOfflineEarnings);

      tooltip.transition().duration(200).style("opacity", 1);
      const classes = d3.select(this).attr("class").split(" ");
      const genre = classes[1];
      const game = classes[2];

      if (isSelected || parallelSelected) {
        d3.select(this).style("stroke-width", 5);
      } else {
        const classes = d3.select(this).attr("class").split(" ");
        const genre = classes[1];
        d3.select("#parallel-coordinates").selectAll(`.line-coordinate`)
            .style("stroke", "grey")
            .style("opacity", 0.2);

        d3.select(this).style("stroke-width", 5)
          .style("stroke", colorScheme[getGenreByAcronym(genre)])
          .style("opacity", 1);

        d3.select("#line-chart").selectAll(".line")
            .style("stroke", "grey")
            .style("opacity", 0.2);
        d3.select("#line-chart").selectAll(".circle")
          .style("fill", "grey")
          .style("opacity", 0.2);
    
        d3.select("#jitter-plot").selectAll(".circle")
          .style("fill", "grey")
          .style("opacity", 0.2);

        d3.select(`.line.${genre}`)
          .style("stroke", colorScheme[getGenreByAcronym(genre)])
          .style("opacity",1)
          .style("stroke-width", 5)
        d3.select("#line-chart").selectAll(`.circle.${genre}`)
          .style("fill", colorScheme[getGenreByAcronym(genre)])
          .style("opacity",1)

        d3.select("#jitter-plot").selectAll(`.circle.${genre}`)
          .style("fill", colorScheme[getGenreByAcronym(genre)])
          .style("opacity", 1);
      }

      // Display game details (all attributes) on hover in a tooltip or info box
      d3.select("#tooltip")
        .style("visibility", "visible")
        .html(
          `
          <strong>Game Details:</strong><br/>
          Genre: ${d.Genre}<br/>
          AveragePlayers: ${d.AveragePlayers}<br/>
          AverageTournaments: ${d.AverageTournaments}<br/>
          AverageEarnings: ${formattedAverageEarnings}<br/>
          AverageReleaseYear: ${d.AverageReleaseYear}<br/>
          AverageOfflineEarnings: ${formattedAverageOfflineEarnings}<br/>
          AverageOnlineEarnings: ${formattedAverageOnlineEarnings}<br/>
        `
        );
      const container = d3
        .select(".ParallelCoordinates")
        .node()
        .getBoundingClientRect();
      const tooltipNode = tooltip.node();
      const tooltipWidth = tooltipNode.offsetWidth;
      const tooltipHeight = tooltipNode.offsetHeight;

      // Get cursor position relative to the container
      const cursorX = event.pageX - container.left;
      const cursorY = event.pageY - container.top;

      // Dynamically calculate offsets based on cursor position
      let offsetX = 15; // Default horizontal offset
      let offsetY = 15; // Default vertical offset

      // Check if cursor is near the right edge
      if (cursorX + tooltipWidth + offsetX > container.width) {
        offsetX = -tooltipWidth - 15; // Move to the left of the cursor
      }

      // Check if cursor is near the bottom edge
      if (cursorY + tooltipHeight + offsetY > container.height) {
        offsetY = -tooltipHeight - 15; // Move above the cursor
      }

      // Calculate the tooltip's position based on mouse event and dynamic offset
      let tooltipX = event.pageX + offsetX;
      let tooltipY = event.pageY + offsetY;

      // Ensure the tooltip does not overflow the container on the top or left
      if (tooltipX < container.left) tooltipX = container.left + 15;
      if (tooltipY < container.top) tooltipY = container.top + 15;

      // Apply the adjusted position to the tooltip
      tooltip.style("top", tooltipY + "px").style("left", tooltipX + "px");
    })
    .on("mouseleave", function () {
      
      if (isSelected || parallelSelected) {
        d3.select(this).style("stroke-width", 3);
      } else {
        d3.select(this).style("stroke-width", 3);

        d3.select("#line-chart").selectAll(".line").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("stroke", colorScheme[getGenreByAcronym(genre)])
            .style("stroke-width", 3)
            .style("opacity", 1);
        })
        d3.select("#line-chart").selectAll(".circle").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("fill", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        })

        d3.select("#jitter-plot").selectAll(".circle").each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("fill", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        })
        d3.select("#parallel-coordinates").selectAll(`.line-coordinate`).each(function (d) {
          const classes = d3.select(this).attr("class").split(" ");
          const genre = classes[1];
          d3.select(this)
            .style("stroke", colorScheme[getGenreByAcronym(genre)])
            .style("opacity", 1);
        })
      }
      d3.select("#tooltip").style("visibility", "hidden");
    });

  // Handle the exit selection: remove any paths that are no longer needed
  paths.exit().remove();

  const brush = d3
    .brushY()
    .extent([
      [-(brushWidth / 2), margin.top],
      [brushWidth / 2, height - margin.bottom],
    ])
    .on("start brush end", brushed);

  axisSelection.call(brush);

  function updateAxesAndLines() {
    // Update axes positions
    svg
      .selectAll(".axis")
      .transition() // Add a transition for smoother movement
      .duration(200) // Duration of the transition
      .attr("transform", (d) => `translate(${x(d)},0)`);

    // Update line paths
    svg
      .selectAll("path.line-coordinate") // Select the individual line paths directly
      .transition()
      .duration(200) // Duration of the transition
      .attr("d", (d) => {
        const lineData = keys.map((key) => [key, d[key]]);
        return line(lineData);
      });
  }

  const selections = new Map();

  function brushed({ selection }, key) {
    if (selection === null) {
      selections.delete(key); // Remove selection if no brush
    } else {
      const selectedRange = selection.map(y.get(key).invert);
      selections.set(key, selectedRange); // Store the selection range for this axis
    }

    const selected = [];
    paths.each(function (d) {
      const active = Array.from(selections).every(
        ([key, [min, max]]) => d[key] <= min && d[key] >= max
      );

      d3.select(this).style(
        "stroke",
        active ? colorScheme[d.Genre] : deselectedColor
      );
      if (active) {
        d3.select(this).raise();
        selected.push(d);
      }
    });
    if (selected != []) {
      d3.select("#line-chart")
        .selectAll(".line")
        .style("stroke", "grey")
        .style("opacity", "0.2");
      d3.selectAll(".circle").style("fill", "grey").style("opacity", "0.2");

      selected.forEach(selectedItem => {
        const genre = selectedItem.Genre;
        d3.select("#line-chart").selectAll(`.line.${acronyms[genre]}`)
          .style("stroke", colorScheme[genre])
          .style("opacity", "1");
        d3.select("#line-chart").selectAll(`.circle.${acronyms[genre]}`)
          .style("fill", colorScheme[genre])
          .style("opacity", "1");
        d3.selectAll(`.circle.${acronyms[genre]}`)
          .style("fill", colorScheme[genre])
          .style("opacity", "1");
  
      })
    }
    svg.property("value", selected).dispatch("input");
  }
}
