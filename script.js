// Separate function for creating the layout of the graph
function createBarChartLayout(headers, values) {
  var maxValue = Math.max(...values);
  var uniqueUserIds = new Set(values);
  var numOfUniqueUserIds = uniqueUserIds.size;

  // Calculate the desired width and height based on the number of categories. 
  // This way all graphs have the same formatting
  var desiredWidth = Math.max(800, 80 * numOfUniqueUserIds);
  var desiredHeight = Math.max(600, 40 * values.length);

  // Basic layout formatting
  return {
    title: 'Average Response Times for users',
    barmode: 'stack',
    bargap: 0.5,
    bargroupwidth: 1,
    autosize: true,
    width: desiredWidth,
    height: desiredHeight,
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    xaxis: {
      title: 'Average Response Time',
      fixedrange: true,
      zeroline: false,
      showgrid: false,
    },
    yaxis: {
      title: {
        text: 'userId',
        standoff: 30,
      },
      automargin: true,
      showgrid: false,
      gridwidth: 3,
      zeroline: false,
      tickfont: {
        size: 10,
      },
    },
    margin: {
      l: 150,
    },
  };
}

// Parse the JSON data and log to console if it is successful
function readJSONFile(inputFile) {
  const fileReader = new FileReader();

  fileReader.onload = function (userId) {
    try {
      const jsonData = JSON.parse(userId.target.result);
      console.log("JSON file successfully parsed:", jsonData);
      createBarChart(jsonData);
    } catch (error) {
      console.error("Error parsing JSON file:", error);
    }
  };

  fileReader.readAsText(inputFile);
}

function createBarChart(jsonData) {
  // Calculate the average totalActivityTime for each userId
  const userTotals = {};
  const userCount = {};
  jsonData.forEach((item) => {
    const userId = item.properties.userId;
    const avgResponseTime = item.properties.avgResponseTime;
    if (avgResponseTime && typeof avgResponseTime === "string") {
      const responseTimes = JSON.parse(avgResponseTime);
      const totalResponseTime = responseTimes.reduce((acc, time) => acc + time, 0);
      const count = responseTimes.length;

      userTotals[userId] = (userTotals[userId] || 0) + totalResponseTime;
      userCount[userId] = (userCount[userId] || 0) + count;
    }
  });

  // Calculate the average totalActivityTime for each userId
  const userAverages = {};
  for (const userId in userTotals) {
    userAverages[userId] = userTotals[userId] / userCount[userId];
    console.log(userAverages);
  }

  // Sort userIds by their average totalActivityTime values
  const sortedUserIds = Object.keys(userAverages) 
    .filter((userId) => userAverages[userId] !== undefined)
    .sort((a, b) => userAverages[b] - userAverages[a]);
  

  const reversedUserIds = sortedUserIds.reverse();

  // Prepare data for the bar chart
  const chartData = [
    {
      x: reversedUserIds.map((userId) => userAverages[userId]),
      y: reversedUserIds,
      type: "bar",
      orientation: "h",
      text: reversedUserIds.map((userId) => userAverages[userId].toFixed(2)), // Add the text with the average values
      textposition: "auto",
      textfont_size: 20,
      textposition: "outside",
      cliponaxis: false,
      marker: {
        color: "rgba(31, 119, 180, 0.8)", // Set initial color for all bars
      },
      hoverinfo: "none",
    },
  ];

  // Set layout options for the bar chart
  const layout = createBarChartLayout("userId", "Average Total Activity Time");

  function parseDate(time) {
    // Convert the epoch time to a Date object
    const date = new Date(Number(time) * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    return `${month} ${day}, ${year}, at ${hour}:${minute}:${second}`;
  
    };


  // Create the bar chart

  Plotly.newPlot("chartContainer", chartData, layout).then(function () {
    // Initialize all bars to have the same colors
    var colors = Array(sortedUserIds.length).fill("rgba(31, 119, 180, 0.8)");
    var clickedIndex = null;
  
    // Get clicked bar's index
    chartContainer.on("plotly_click", function (data) {
      var currentClickedIndex = data.points[0].pointIndex;
      var userId = reversedUserIds[currentClickedIndex];
      var clickedBarData = jsonData.filter((item) => item.properties.userId === userId);
      var dates = clickedBarData.map((entry) => parseDate(entry.properties.time));
      var responseTimesArrays = clickedBarData.map((entry) => {
        if (entry.event === "exercise" && entry.properties.avgResponseTime) {
          return JSON.parse(entry.properties.avgResponseTime);
        }
        return null;
      });
  
      // function to make sure all data points are seperated and easier to read
      function addJitter(arr, index, numPlots) {
        var jitterFactor = 0.3; // can be adjusted, i thought this made the most sense
        var jitteredArr = arr.map((val) => {
          var jitter = (Math.random() - 0.5) * jitterFactor;
          return val + (jitter * (index + 1 - numPlots / 2)); // Spread points along the x-axis
        });
        return jitteredArr;
      }
  
      dates = dates.filter((date, index) => responseTimesArrays[index] !== null);
      var lineChartData = [];
  
      //plot each scatter point
      responseTimesArrays.forEach((responseTimesArray, index) => {
        if (responseTimesArray) {
          var scatterData = {
            x: addJitter(dates, index, responseTimesArrays.length),
            y: responseTimesArray,
            type: "scatter",
            mode: "markers",
            marker: {
              size: 8,
            },
            name: "Session: " + (index + 1),
          };
          lineChartData.push(scatterData);
        }
      });
  

      /* *** insert averages code here (refer to line 250) *** */
  
      // layout
      var lineChartLayout = {
        title: "User Response Times Over Various Sessions",
        autosize: true,
        width: 1600,
        height: 900, 
        xaxis: {
          title: {
            text: "Date",
            standoff: 30,
            tickangle: -45,
            gridcolor: 'rgba(0,0,0, 0.3)',
          },
          automargin: true,
          zeroline: false,
          tickfont: {
            size: 10,
          },
        },
        yaxis: {
          title: "Response Times (in seconds)",
          gridcolor: 'rgba(0,0,0, 0.3)',
        },
        margin: {
          1: 150,
        }
      };
  
      Plotly.newPlot("lineChartContainer", lineChartData, lineChartLayout);
  
      // Set clicked bar to blue, other bars to gray
      if (clickedIndex === currentClickedIndex) {
        colors.fill("rgba(31, 119, 180, 0.8)");
        clickedIndex = null;
      } else {
        colors.fill("gray");
        colors[currentClickedIndex] = "rgba(31, 119, 180, 0.8)";
        clickedIndex = currentClickedIndex;
      }
  
      // Update graph to contain new color format
      var update = {
        marker: { color: colors },
      };
  
      Plotly.update("chartContainer", update);
  
      // Display bar's data on page when clicked
      if (clickedIndex !== null) {
        var clickedBarData = data.points[0];
        var clickedBarName = clickedBarData.y;
        var clickedBarValue = clickedBarData.x;
  
        var statement =
          "Selected User: " + clickedBarName + "<br>Average Response Time: " + clickedBarValue.toFixed(2);
        outputInfo.innerHTML = statement;
        outputInfo.style.border = "2px solid rgb(173, 216, 230)";
      } else {
        outputInfo.innerHTML = "";
        outputInfo.style.border = "none";
      }
    });
  });
}


 // Calculate the average response times for the clicked user. This section currently has bugs where the line is not 
 // displayed along side the other data points. I will be working to fix this
      /*
      function calculateAverage(arr) {
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
  }
      var averageResponseTimes = responseTimesArrays.map((responseTimesArray) => {
        if (responseTimesArray) {
          return calculateAverage(responseTimesArray);
        }
        return null;
      });
  
      // Add trace for averages
      var averageScatterData = {
        x: dates,
        y: averageResponseTimes,
        type: "scatter",
        mode: "markers+lines",
        line: {
          color: "rgba(31, 119, 180, 0.8)",
          width: 2,
        },
        marker: {
          size: 10,
          color: "rgba(31, 119, 180, 0.8)",
        },
        name: "Averages",
      };
      lineChartData.push(averageScatterData);
      */