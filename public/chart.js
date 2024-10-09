const ctx = document.getElementById("mainchart").getContext("2d");
let fulldatasets = [];
let fulldatasetsDistance = [];
let starttime = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();
let useRelativeValues = true;
let useCheckins = true;
const chartdata = { datasets: [] };
const mainchart = new Chart(ctx, {
  type: "line",
  data: chartdata,
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { type: "time" },
      y: {
        beginAtZero: true,
        display: true,
        text: "value",
        grid: {
          color: (context) => {
            if (context.tick.value === 0) return "white";
          },
        },
      },
    },
  },
});

function initialize() {
  fetch("/data/checkins.json")
    .then((response) => response.json())
    .then((data) => {
      fulldatasets = data;
      displayData();
    });

  fetch("/data/distance.json")
    .then((response) => response.json())
    .then((data) => {
      fulldatasetsDistance = data;
    });

  fetch("/data/users.json")
    .then((response) => response.json())
    .then((users) => users.forEach((user) => makeUserButton(user)));

  fetch("/data/lastupdate.json")
    .then((response) => response.text())
    .then((data) => {
      var dateLastUpdate = new Date(data);
      var dateNow = new Date();
      document.getElementById("lastupdate").innerText = dateLastUpdate
        .toISOString()
        .split(".")[0]
        .replace("T", " ");
      if (dateNow - dateLastUpdate > 1000 * 60 * 60 * 24) {
        fetch("/update").finally(() => window.location.reload());
      }
    })
    .catch((error) => fetch("/update").finally(() => window.location.reload()));

  document.getElementById("toggleRelativeAbsolute").onclick = (event) => {
    useRelativeValues = !useRelativeValues;
    event.srcElement.innerHTML = useRelativeValues ? "Relative" : "Absolute";
    displayData();
  };

  document.getElementById("toggleCheckinsDistance").onclick = (event) => {
    useCheckins = !useCheckins;
    event.srcElement.innerHTML = useCheckins ? "Checkins" : "Distance";
    displayData();
  };
}

function makeUserButton(user) {
  var btn = document.createElement("button");
  btn.innerText = user.displayname;
  btn.onclick = () => setTimeframe(user.startDate);
  document.getElementById("title").appendChild(btn);
}

function displayData() {
  fulldatasets.forEach((fullDataset) => {
    var datasetToUpdate = chartdata.datasets.find(
      (existingDataset) => existingDataset.label === fullDataset.label
    );
    if (datasetToUpdate == undefined) {
      chartdata.datasets.push({
        label: fullDataset.label,
        backgroundColor: fullDataset.backgroundColor,
        borderColor: fullDataset.backgroundColor,
        data: getRelevantData(fullDataset.data),
        stepped: fullDataset.stepped,
      });
    } else {
      datasetToUpdate.data = getRelevantData(fullDataset.data);
    }
  });
  mainchart.update();
}

function getRelevantData(data) {
  var result = data.filter((data) => data.x > starttime);
  if (useCheckins) {
    if (useRelativeValues) {
      var count = 0;
      result = result.map((value) => {
        return { x: value.x, y: ++count };
      });
    }
  } else {
    return fulldatasetsDistance
      .filter((data) => data.date > starttime)
      .map((data) => {
        return { x: data.date, y: data.distance };
      });
  }
  return result;
}

function setTimeframe(newStarttime) {
  starttime = newStarttime;
  document.getElementById("starttimeInput").value = newStarttime.split("T", 1)[0];
  displayData();
}

initialize();
