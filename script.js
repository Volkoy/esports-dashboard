var globalData;
var genres;
var selectedGenres;
var years;
var selectedLines = [];
var colorScheme = {
  Strategy: "#a7cde3",
  "First-Person Shooter": "#2b77b3",
  Sports: "#afdd8f",
  "Fighting Game": "#299d39",
  Racing: "#fb9f97",
  "Multiplayer Online Battle Arena": "#e23703",
  "Role-Playing Game": "#fbc171",
  "Third-Person Shooter": "#fe8600",
  "Music / Rhythm Game": "#cbb3d5",
  "Collectible Card Game": "#6d4198",
  "Puzzle Game": "#fcfe9e",
  "Battle Royale": "#b05e26",
};
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

var minRange, maxRange;
var isAdjusted = false;

function yearFilter() {
  let minRangeValueGap = 2;

  const range = document.getElementById("range_track");
  const minval = document.querySelector(".minvalue");
  const maxval = document.querySelector(".maxvalue");
  const rangeInput = document.querySelectorAll(".min, .max");

  let minYear = 1998; // Set the starting year
  let maxYear = 2023; // Set the ending year

  const minRangeFill = () => {
    // Calculate the left position based on the current year range
    range.style.left =
      ((rangeInput[0].value - minYear) / (maxYear - minYear)) * 100 + "%";
  };
  const maxRangeFill = () => {
    // Calculate the right position based on the current year range
    range.style.right =
      100 - ((rangeInput[1].value - minYear) / (maxYear - minYear)) * 100 + "%";
  };

  const setMinValueOutput = () => {
    minRange = parseInt(rangeInput[0].value);
    minval.innerHTML = rangeInput[0].value;
  };
  const setMaxValueOutput = () => {
    maxRange = parseInt(rangeInput[1].value);
    maxval.innerHTML = rangeInput[1].value;
  };

  setMinValueOutput();
  setMaxValueOutput();
  minRangeFill();
  maxRangeFill();

  rangeInput.forEach((input) => {
    input.addEventListener("input", (e) => {
      let filtered = globalData;
      setMinValueOutput();
      setMaxValueOutput();
      minRangeFill();
      maxRangeFill();
      filtered = globalData.filter(
        (d) => d.Year >= minRange && d.Year <= maxRange
      );
      years = [...new Set(filtered.map((d) => d.Year))];
      updateLineChart(switchEarningData(filtered));
      if (maxRange - minRange < minRangeValueGap) {
        if (e.target.className === "min") {
          rangeInput[0].value = maxRange - minRangeValueGap;
          setMinValueOutput();
          minRangeFill();
          e.target.style.zIndex = "2";
        } else {
          rangeInput[1].value = minRange + minRangeValueGap;
          e.target.style.zIndex = "2";
          setMaxValueOutput();
          maxRangeFill();
        }
      }
    });
  });
}

// Initialization of the dashboard
function init() {
  d3.json("esports.json").then(function (data) {
    globalData = data;
    yearFilter();
    createLineChart(globalData);
    createJitterPlot(globalData);
  });
}

function switchEarningData(data) {
  let aggregatedData;
  if (isAdjusted) {
    selectedLines = [];
    aggregatedData = d3.rollup(
      data,
      (v) => d3.sum(v, (d) => d.AdjustedEarnings),
      (d) => d.Genre,
      (d) => d.Year
    );
  } else {
    selectedLines = [];
    aggregatedData = d3.rollup(
      data,
      (v) => d3.sum(v, (d) => d.Earnings),
      (d) => d.Genre,
      (d) => d.Year
    );
  }
  const formattedData = Array.from(aggregatedData, ([genre, yearMap]) => ({
    genre: genre,
    values: Array.from(yearMap, ([year, earnings]) => ({
      Year: year,
      Earnings: earnings,
    })),
  }));
  return formattedData;
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

  const formattedData = switchEarningData(data, false);
  years = [...new Set(data.map((d) => d.Year))];
  genres = [...new Set(data.map((d) => d.Genre))];
  selectedGenres = [];
  selectedGenres = genres;

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
    .style("margin-right", "1em");

  d3.select(".linechart-buttons")
    .append("button")
    .text("Not Adjusted")
    .attr("class", "not-adjusted")
    .style("background-color", "blue")
    .style("border", "none")
    .style("border-radius", ".5em")
    .style("color", "white")
    .property("disabled", true)
    .on("click", function () {
      isAdjusted = false;
      d3.select(".not-adjusted")
        .style("background-color", "blue")
        .style("color", "white")
        .property("disabled", true);
      d3.select(".adjusted")
        .style("background-color", "lightgrey")
        .style("color", "black")
        .property("disabled", false);
      let updatedData = switchEarningData(data);
      updatedData = updatedData.filter((g) => selectedGenres.includes(g.genre));
      updateLineChart(updatedData);
    });
  d3.select(".linechart-buttons")
    .append("button")
    .text("Adjusted")
    .style("cursor", "pointer")
    .attr("class", "adjusted")
    .style("background-color", "lightgrey")
    .style("border", "none")
    .style("border-radius", ".5em")
    .property("disabled", false)
    .on("click", function () {
      isAdjusted = true;
      d3.select(".adjusted")
        .style("background-color", "blue")
        .style("color", "white")
        .property("disabled", true);
      d3.select(".not-adjusted")
        .style("background-color", "lightgrey")
        .style("color", "black")
        .property("disabled", false);
      let updatedData = switchEarningData(data);
      updatedData = updatedData.filter((g) => selectedGenres.includes(g.genre));
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
      if (checked) {
        selectedGenres = genres;
        let updatedData = formattedData.filter((g) =>
          selectedGenres.includes(g.genre)
        );
        updateLineChart(updatedData);
      } else {
        selectedGenres = [];
        let updatedData = formattedData.filter((g) =>
          selectedGenres.includes(g.genre)
        );
        updateLineChart(updatedData);
      }
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
          if (checked) {
            selectedGenres.push(d.genre);
            let updatedData = formattedData.filter((g) =>
              selectedGenres.includes(g.genre)
            );
            updateLineChart(updatedData);
          } else {
            selectedGenres = selectedGenres.filter(
              (genre) => genre !== d.genre
            );
            let updatedData = formattedData.filter((g) =>
              selectedGenres.includes(g.genre)
            );
            updateLineChart(updatedData);
          }
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

  // Draw lines and circles for each genre
  formattedData.forEach((genreData, index) => {
    const genreColor = colorScheme[genreData.genre];
    const path = svg
      .append("path")
      .datum(genreData.values)
      .attr("class", `line line-${index}`)
      .attr("id", `${genreData.genre}`)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", genreColor)
      .attr("stroke-width", 3)
      .style("opacity", 1) // Set initial opacity to full
      .style("cursor", "pointer") // Change cursor to pointer
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 8)
          .attr("stroke-width", 5);
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(`Genre: ${genreData.genre}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
        d3.selectAll(".jitter-dot")
          .filter((dot) => dot.Genre === genreData.genre)
          .transition()
          .duration(200)
          .attr("r", 6.5)
          .style("stroke", "black")
          .style("stroke-width", 1.5);
      })
      .on("mouseleave", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 5)
          .attr("stroke-width", 3);
        tooltip.transition().duration(200).style("opacity", 0);
        d3.selectAll(".jitter-dot")
          .filter((dot) => dot.Genre === genreData.genre)
          .transition()
          .duration(200)
          .attr("r", 5)
          .style("stroke", "#777")
          .style("stroke-width", 1);
      })
      .on("click", function () {
        const isSelected = selectedLines.includes(genreData.genre);

        if (isSelected) {
          // If the line is already selected, remove it from the array
          selectedLines.splice(selectedLines.indexOf(genreData.genre), 1);
        } else {
          // If not, add it to the selected array
          selectedLines.push(genreData.genre);
        }

        // Set opacity for all lines
        svg.selectAll(".line").each(function () {
          const lineGenre = d3.select(this).attr("id"); // Get genre from line ID
          d3.select(this).style(
            "opacity",
            selectedLines.includes(lineGenre) ? 1 : 0.2
          );
        });

        // Set opacity for all circles
        svg.selectAll(".circle").each(function () {
          const circleGenre = d3.select(this).attr("id"); // Assuming circles have IDs matching their genres
          d3.select(this).style(
            "opacity",
            selectedLines.includes(circleGenre) ? 1 : 0.2
          );
        });
      });

    svg
      .selectAll(`.circle-${index}`)
      .data(genreData.values)
      .enter()
      .append("circle")
      .attr("class", `circle circle-${index}`)
      .attr("id", `${genreData.genre}`)
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
          .html(
            `Genre: ${genreData.genre} <br> Year: ${d.Year} <br>Earnings: $${formattedEarnings}`
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
        d3.selectAll(".jitter-dot")
          .filter((dot) => dot.Genre === genreData.genre)
          .transition()
          .duration(200)
          .attr("r", 6.5)
          .style("stroke", "black")
          .style("stroke-width", 1.5);
      })
      .on("mouseleave", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 5)
          .style("stroke", "none");
        tooltip.transition().duration(200).style("opacity", 0);
        d3.selectAll(".jitter-dot")
          .filter((dot) => dot.Genre === genreData.genre)
          .transition()
          .duration(200)
          .attr("r", 5)
          .style("stroke", "#777")
          .style("stroke-width", 1);
      })
      .on("click", function () {
        const isSelected = selectedLines.includes(genreData.genre);

        if (isSelected) {
          // If the line is already selected, remove it from the array
          selectedLines.splice(selectedLines.indexOf(genreData.genre), 1);
        } else {
          // If not, add it to the selected array
          selectedLines.push(genreData.genre);
        }

        // Set opacity for all lines
        svg.selectAll(".line").each(function () {
          const lineGenre = d3.select(this).attr("id"); // Get genre from line ID
          d3.select(this).style(
            "opacity",
            selectedLines.includes(lineGenre) ? 1 : 0.2
          );
        });

        // Set opacity for all circles
        svg.selectAll(".circle").each(function () {
          const circleGenre = d3.select(this).attr("id"); // Assuming circles have IDs matching their genres
          d3.select(this).style(
            "opacity",
            selectedLines.includes(circleGenre) ? 1 : 0.2
          );
        });
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

function createJitterPlot(data) {
  const container = d3.select(".JitterPlot");

  const svgWidth = container.node().getBoundingClientRect().width;
  const svgHeight = container.node().getBoundingClientRect().height;
  const margin = 70;

  const color = d3.scaleOrdinal(d3.schemePaired);

  const aggregatedData = Array.from(
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

  const genres = [...new Set(data.map((d) => d.Genre))];
  const genreName = genres.map((genre) => acronyms[genre]);
  const offset = margin * 0.5;
  const genreScale = d3
    .scalePoint()
    .domain(genreName)
    .range([margin + offset, svgWidth - margin * 0.5]);

  const playerScale = d3
    .scaleLinear()
    .domain([0, d3.max(aggregatedData, (d) => d.TotalPlayers)])
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

  svg
    .selectAll("circle")
    .data(aggregatedData)
    .enter()
    .append("circle")
    .attr("class", "jitter-dot")
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
    .style("fill", (d) => color(d.Genre))
    .style("cursor", "pointer") // Change cursor to pointer
    .style("stroke", "#777")
    .style("stroke-width", 1)
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", 8)
        .style("stroke", "black")
        .style("stroke-width", 2);
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip
        .html(
          `Game: ${d.Game} <br>Players: ${d.TotalPlayers} <br>Genre: ${d.Genre}`
        )
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
    })
    .on("mouseleave", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", 5)
        .style("stroke", "#777")
        .style("stroke-width", 1);
      tooltip.transition().duration(200).style("opacity", 0);
    });

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
    .call(d3.axisLeft(playerScale).tickFormat(d3.format(".2s")));

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

function updateLineChart(data) {
  const container = d3.select(".LineChart");
  console.log("update data");
  d3.select("svg").remove();

  const svgWidth = container.node().getBoundingClientRect().width;
  const svgHeight = container.node().getBoundingClientRect().height;
  const margin = 70;

  const color = d3.scaleOrdinal(d3.schemePaired);

  const xScale = d3
    .scalePoint()
    .domain(years)
    .range([margin, svgWidth - margin * 0.5]);

  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, (genreData) => d3.max(genreData.values, (d) => d.Earnings)),
    ])
    .range([svgHeight - margin, margin * 0.15]);

  const svg = d3
    .select(".LineChart")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const line = d3
    .line()
    .x((d) => xScale(d.Year))
    .y((d) => yScale(d.Earnings));

  console.log(xScale);

  data.forEach((genreData, index) => {
    const genreColor = colorScheme[genreData.genre];

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

    svg
      .append("path")
      .datum(genreData.values)
      .attr("class", `line line-${index}`)
      .attr("id", `${genreData.genre}`)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", genreColor)
      .attr("stroke-width", 3)
      .style("opacity", 1) // Set initial opacity to full
      .style("cursor", "pointer") // Change cursor to pointer
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 8)
          .attr("stroke-width", 5);
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(`Genre: ${genreData.genre}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mouseleave", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 5)
          .attr("stroke-width", 3);
        tooltip.transition().duration(200).style("opacity", 0);
      })
      .on("click", function () {
        const isSelected = selectedLines.includes(genreData.genre);

        if (isSelected) {
          // If the line is already selected, remove it from the array
          selectedLines.splice(selectedLines.indexOf(genreData.genre), 1);
        } else {
          // If not, add it to the selected array
          selectedLines.push(genreData.genre);
        }

        // Set opacity for all lines
        svg.selectAll(".line").each(function () {
          const lineGenre = d3.select(this).attr("id"); // Get genre from line ID
          d3.select(this).style(
            "opacity",
            selectedLines.includes(lineGenre) ? 1 : 0.2
          );
        });

        // Set opacity for all circles
        svg.selectAll(".circle").each(function () {
          const circleGenre = d3.select(this).attr("id"); // Assuming circles have IDs matching their genres
          d3.select(this).style(
            "opacity",
            selectedLines.includes(circleGenre) ? 1 : 0.2
          );
        });
      });

    svg
      .selectAll(`.circle-${index}`)
      .data(genreData.values)
      .enter()
      .append("circle")
      .attr("class", `circle circle-${index}`)
      .attr("id", `${genreData.genre}`)
      .attr("r", 5)
      .style("cursor", "pointer")
      .attr("cx", (d) => xScale(d.Year))
      .attr("cy", (d) => yScale(d.Earnings))
      .style("fill", genreColor)
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
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mouseleave", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 5)
          .style("stroke", "none");
        tooltip.transition().duration(200).style("opacity", 0);
      })
      .on("click", function () {
        const isSelected = selectedLines.includes(genreData.genre);

        if (isSelected) {
          // If the line is already selected, remove it from the array
          selectedLines.splice(selectedLines.indexOf(genreData.genre), 1);
        } else {
          // If not, add it to the selected array
          selectedLines.push(genreData.genre);
        }

        // Set opacity for all lines
        svg.selectAll(".line").each(function () {
          const lineGenre = d3.select(this).attr("id"); // Get genre from line ID
          d3.select(this).style(
            "opacity",
            selectedLines.includes(lineGenre) ? 1 : 0.2
          );
        });

        // Set opacity for all circles
        svg.selectAll(".circle").each(function () {
          const circleGenre = d3.select(this).attr("id"); // Assuming circles have IDs matching their genres
          d3.select(this).style(
            "opacity",
            selectedLines.includes(circleGenre) ? 1 : 0.2
          );
        });
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
    // Check if "All" checkbox should be checked/unchecked
    checkAllBoxState();
  }

  // Function to toggle all lines
  function toggleAllLinesVisibility(visible) {
    data.forEach((_, index) => {
      d3.select(`#checkbox-${index}`).property("checked", visible);
      toggleLineVisibility(index, visible);
    });
  }

  // Function to check/uncheck "All" checkbox based on individual selections
  function checkAllBoxState() {
    const allChecked = data.every((_, index) =>
      d3.select(`#checkbox-${index}`).property("checked")
    );
    d3.select("#checkbox-all").property("checked", allChecked);
  }
}
