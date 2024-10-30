const urlParams = new URLSearchParams(window.location.search);
const userName = urlParams.get('u');
var data;
var breweryContainer;
var venueContainer;

if (userName) {
  loadData(userName);
} else {
  showUserSelect();
}

function showUserSelect() {
  fetch('/data/users.json')
    .then(response => response.json())
    .then(data => {
      const users = data;
      const ulElement = document.createElement('ul');
      ulElement.classList.add('user-selector');
      users.forEach(user => {
        const liElement = document.createElement('li');
        liElement.classList.add('clickable');
        liElement.addEventListener('click', () => {
          window.location.href = `?u=${user.displayname}`;
        });
        const linkElement = document.createElement('a');
        linkElement.href = `?u=${user.displayname}`;
        linkElement.innerText = user.displayname;
        liElement.appendChild(linkElement);
        ulElement.appendChild(liElement);
      });
      document.getElementById('content').appendChild(ulElement);
    })
    .catch(error => console.error('Error fetching users:', error));
}

function loadData(userName) {
  fetch(`data/${userName}.json`)
    .then(response => response.json())
    .then(data => {
      this.data = data;
      renderStats();
    })
    .catch(error => console.error('Error fetching user data:', error));
}

function renderStats() {
  const content = document.getElementById('content');

  const profileTitle = document.createElement('div');
  profileTitle.innerHTML = `<h1>${data.displayname} has ${data.totalCheckins} check-ins 
    to ${data.uniqueBeers} beers from ${Object.keys(data.breweryCounts).length} breweries 
    in ${Object.keys(data.breweryCountries).length} countries 
    at ${Object.keys(data.venueCounts).length} venues 
    in ${Object.keys(data.venueCountries).length} counties 
    with an average rating of ${data.averageRating}.</h1>`;
  content.appendChild(profileTitle);
  const chartContainer = document.createElement('div');
  chartContainer.classList.add('chart-container');
  chartContainer.appendChild(makeDiagram("Ratings", 'line', 'white', [data.ratingDistribution]));
  chartContainer.appendChild(makeDiagram("Beer style", 'pie', 'yellow', [Object.fromEntries(Object.entries(data.styleCategoryPercentages).filter(([key, value]) => value > 1))]));
  chartContainer.appendChild(makeDiagram("Serving style", 'bar', 'white', [data.servingCounts]));
  chartContainer.appendChild(makeDiagram("ABV", 'bar', 'yellow', [data.alcoholDistribution]));
  chartContainer.appendChild(makeDiagram("Check-ins By Day", 'bar', 'white', [data.weekdayCounts]));
  chartContainer.appendChild(makeDiagram("Check-ins By Hour", 'bar', 'white', [data.hourCounts]));  
  content.appendChild(chartContainer);
  
  const tabBar = document.createElement('div');
  tabBar.classList.add('tab-bar');
  tabBar.innerHTML = `<span class="tab-element tab-element-active">Beers</span>
  <span class="tab-element">Breweries</span>
  <span class="tab-element">Venues</span>`;

  tabBar.addEventListener('click', (event) => {
    const tabElements = Array.from(tabBar.children);
    tabElements.forEach(tabElement => tabElement.classList.remove('tab-element-active'));
    event.target.classList.add('tab-element-active');
    const tabContainers = Array.from(content.getElementsByClassName('tab-container'));
    tabContainers.forEach(tabContainer => tabContainer.style.display = 'none');
    const index = tabElements.indexOf(event.target);
    tabContainers[index].style.display = 'block';
  });
  content.appendChild(tabBar);

  const beerContainer = document.createElement('div');
  beerContainer.classList.add('tab-container');
  beerContainer.innerHTML = `<h3>Beers</h3>`;
  content.appendChild(beerContainer);

  breweryContainer = document.createElement('div');
  breweryContainer.classList.add('tab-container');
  breweryContainer.style.display = 'none';
  breweryContainer.appendChild(makeFilterList(data.breweryList));
  breweryContainer.appendChild(makeButtonList(data.breweryCountries));
  content.appendChild(breweryContainer);

  venueContainer = document.createElement('div');
  venueContainer.classList.add('tab-container');
  venueContainer.style.display = 'none';
  venueContainer.appendChild(makeList("Venue checked-ins", 'list', data.venueCounts));
  venueContainer.appendChild(makeButtonList(data.venueCountries));
  content.appendChild(venueContainer);

  content.appendChild(document.createElement('script')).src = `https://maps.googleapis.com/maps/api/js?key=${data.mapsKey}&libraries=maps&v=beta&loading=async&libraries=visualization&callback=initMap`;
}

function makeDiagram(title, type, colors, data, labels) {
  const diagram = document.createElement('div');
  diagram.classList.add('chart-box');
  diagram.innerHTML = `<h2>${title}</h2>`;
  const canvas = document.createElement('canvas');
  canvas.height = 300;
  diagram.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const count = Object.keys(data[0]).length;
  const colorPaletteRainbow = Array.from({ length: count }, (v, i) => `hsl(${i * 360 / count}, 100%, 50%)`);
  const colorPaletteYellow = Array.from({ length: count }, (v, i) => `hsl(50, 100%, ${100 - i * 100 / count}%)`);
  const chart = new Chart(ctx, {
    plugins: [ChartDataLabels],
    type: type,
    data: {
      labels: Object.keys(data[0]),
      datasets: data.map((dataset, index) => ({
        label: labels ? labels[index] : title,
        data: Object.values(dataset),
        borderColor: index === 0 ? 'white' : 'gray',
        borderWidth: 1,
        backgroundColor: colors === 'yellow' ? colorPaletteYellow : colors === 'rainbow' ? colorPaletteRainbow : index === 0 ? 'white' : 'gray'
      }))
    },
    options: {
        maintainAspectRatio: true,
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
            datalabels: {
              color: '#000',
              formatter: function(value, ctx) {
                return type === 'pie' ? ctx.chart.data.labels[ctx.dataIndex] : '';
              }
            }
        }
    }
  });
  return diagram;
}

function makeList(title, type, data) {
  const list = document.createElement('div');
  list.classList.add('chart-box');
  list.innerHTML = `<h2>${title}</h2>`;
  const ul = document.createElement(type === 'list' ? 'ol' : 'ul');
  if (type === 'tags') {
    ul.classList.add('tag-list');
  } else if (type === 'list') {
    ul.classList.add('mumber-list');
    data = Object.fromEntries(Object.entries(data).slice(0, 15));
  }
  Object.keys(data).forEach(key => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${key}</span> <span ${type === 'tags' ? '' : 'class="tag"'}>${data[key]}</span>`;
    ul.appendChild(li);
  });
  list.appendChild(ul);
  return list;
}

function makeRatingList(title, type, data) {
  const list = document.createElement('div');
  list.classList.add('chart-box');
  list.innerHTML = `<h2>${title}</h2>`;
  const ul = document.createElement(type === 'list' ? 'ol' : 'ul');
  if (type === 'tags') {
    ul.classList.add('tag-list');
  } else if (type === 'list') {
    data = Object.fromEntries(Object.entries(data).slice(0, 15));
  }
  Object.keys(data).forEach(key => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${data[key].brewery}</span> <span ${type === 'tags' ? '' : 'class="tag"'}>${data[key].averageRating} in ${data[key].numberOfRatings}</span>`;
    ul.appendChild(li);
  });
  list.appendChild(ul);
  return list;
}

function makeButtonList(data) {
  const list = document.createElement('div');
  const ul = document.createElement('ul');
  ul.classList.add('tag-list');
  Object.keys(data).forEach(key => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${key}</span> <span'class="tag"'}>${data[key]}</span>`;
    li.addEventListener('click', () => {
      li.classList.toggle('tag-active');
    });
    ul.appendChild(li);
  });
  list.appendChild(ul);
  return list;
}

function makeFilterList(data) {
  const list = document.createElement('div');
  list.appendChild(makeRatingSlider(data));

  const ul = document.createElement('ol');
  ul.id = 'brewery-list';
  setBreweryList(data, ul);
  list.appendChild(ul);
  return list;
}

function setBreweryList(data, ul) {
  Object.keys(data)
    .sort((a, b) => data[b]['average-rating'] - data[a]['average-rating'])
    .slice(0, 20)
    .forEach(key => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${data[key].name}</span> 
      <span class="tag">${data[key]['average-rating']} in ${data[key]['number-of-ratings']}</span>
      <span class="tag">${data[key]['style']}</span>
      <span class="tag">${data[key]['address']}</span>`;
      li.addEventListener('click', () => {
        li.classList.toggle('tag-active');
      });
      ul.appendChild(li);
    });
}

function makeRatingSlider(data) {
  const sliderContainer = document.createElement('div');
  const hihestRatingCount = Math.max(...data.map(brewery => brewery['number-of-ratings']));
  const sliderLabel = document.createElement('label');
  sliderLabel.htmlFor = 'rating-slider';
  sliderLabel.innerText = 'Number of ratings:';
  sliderContainer.appendChild(sliderLabel);
  const slider = document.createElement('input');
  slider.id = 'rating-slider';
  slider.type = 'range';
  slider.min = 1;
  slider.max = hihestRatingCount;
  slider.value = 1;
  slider.addEventListener('input', () => {
    document.getElementById('rating-slider-value').innerText = slider.value;
    const filteredData = data.filter(brewery => brewery['number-of-ratings'] >= slider.value);
    const ul = document.getElementById('brewery-list');
    ul.innerHTML = '';
    setBreweryList(filteredData, ul);
  });
  sliderContainer.appendChild(slider);
  const sliderValue = document.createElement('span');
  sliderValue.id = 'rating-slider-value';
  sliderValue.innerText = slider.value;
  sliderContainer.appendChild(sliderValue);
  return sliderContainer;
}

function getFlagEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char =>  127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function initMap() {
  const venueHeatMapData = Object.keys(data.venueLocations).map((key) => {
    const [lat, lng] = key.split(",");
    return { location: new google.maps.LatLng(parseFloat(lat), parseFloat(lng)), weight: data.venueLocations[key] }
  });
  addMap(venueContainer, venueHeatMapData);

  const breweryHeatMapData = data.breweryList.map((brewery) => ({ 
    location: new google.maps.LatLng(brewery.location.lat, brewery.location.lng), 
    weight: brewery['number-of-ratings'] 
  }));
  addMap(breweryContainer, breweryHeatMapData);
}

function addMap(container, heatMapData) {
  const mapDiv = document.createElement("div");
  mapDiv.class = "map";
  mapDiv.style.height = "400px";
  mapDiv.style.width = "100vw";
  container.appendChild(mapDiv);
  map = new google.maps.Map(mapDiv, {
    center: new google.maps.LatLng(50.1108215, 8.6793665),
    zoom: 13
  });
  let heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatMapData,
    maxIntensity: 10,
    radius: 20,
    opacity: 0.8
  });
  heatmap.setMap(map);
}
