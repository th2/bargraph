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
    at ${data.venues.length} venues 
    in ${Object.keys(data.venueCountries).length} counties 
    with an average rating of ${data.averageRating}.</h1>`;
  content.appendChild(profileTitle);
  const chartContainer = document.createElement('div');
  chartContainer.classList.add('chart-container');
  chartContainer.appendChild(makeDiagram("Ratings", 'line', 'white', data.ratings));
  chartContainer.appendChild(makeDiagram("Styles", 'pie', 'yellow', data.beerStyles.filter(item => item.percentage > 1).sort((a, b) => a.darkness - b.darkness)));
  chartContainer.appendChild(makeList("Top Styles", data.beerStyles.filter(item => item.percentage > 1).sort((a, b) => b.average - a.average)));
  chartContainer.appendChild(makeDiagram("Serving", 'bar', 'white', data.serving.filter(item => item.percentage > 1).sort((a, b) => b.count - a.count)));
  chartContainer.appendChild(makeList("Serving Rating", data.serving.filter(item => item.percentage > 1).sort((a, b) => b.average - a.average)));
  chartContainer.appendChild(makeDiagram("ABV", 'bar', 'yellow', data.abv));
  chartContainer.appendChild(makeDiagram("ABV Rating", 'line', 'yellow', data.abv.filter(item => item.name !== 'N/A').map(item => ({ name: item.name, percentage: item.average }))));
  chartContainer.appendChild(makeDiagram("Check-ins By Day", 'bar', 'white', data.weekdays));
  chartContainer.appendChild(makeDiagram("Day Rating", 'line', 'yellow', data.weekdays.map(item => ({ name: item.name, percentage: item.average }))));
  chartContainer.appendChild(makeDiagram("Check-ins By Hour", 'bar', 'white', data.hours));
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
  beerContainer.appendChild(makeFilterList(data.beerList)); 
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
  venueContainer.appendChild(makeList("Top Venues", data.venues.sort((a, b) => b.count - a.count)));  
  venueContainer.appendChild(makeButtonList(data.venueCountries));
  content.appendChild(venueContainer);

  content.appendChild(document.createElement('script')).src = `https://maps.googleapis.com/maps/api/js?key=${data.mapsKey}&libraries=maps&v=beta&loading=async&libraries=visualization&callback=initMap`;
}

function makeDiagram(title, type, colors, data) {
  const diagram = makeElement('div', `<h2>${title}</h2>`, 'chart-box');
  const canvas = document.createElement('canvas');
  canvas.height = 300;
  diagram.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    plugins: [ChartDataLabels],
    type: type,
    data: {
      labels: data.map(item => item.name),
      datasets: [{
        label: 'Percent',
        data: data.map(item => item.percentage),
        borderColor: 'white',
        borderWidth: 1,
        backgroundColor: getColorPalette(colors, data.length)
      }]
    },
    options: {
        maintainAspectRatio: true,
        responsive: true,
        plugins: {
            legend: { display: false },
            datalabels: { color: '#000', formatter: (value, ctx) => type === 'pie' ? ctx.chart.data.labels[ctx.dataIndex] : '' }
        }
    }
  });
  return diagram;
}

function getColorPalette(colors, count) {
  const colorPaletteRainbow = Array.from({ length: count }, (v, i) => `hsl(${i * 360 / count}, 100%, 50%)`);
  const colorPaletteYellow = Array.from({ length: count }, (v, i) => `hsl(50, 100%, ${100 - i * 100 / count}%)`);
  return colors === 'yellow' ? colorPaletteYellow : colors === 'rainbow' ? colorPaletteRainbow : 'white';
}

function makeList(title, data) {
  const list = makeElement('div', `<h2>${title}</h2>`, 'chart-box');
  const ol = makeElement('ol', '', 'number-list');
  data.forEach(item => ol.appendChild(makeElement('li', `<span>${item.name}</span> <span class="tag"> ${item.average ? item.average + ' in ' : ''}${item.count} </span>`)));
  list.appendChild(ol);
  return list;
}

function makeElement(type, content) {
  const element = document.createElement(type);
  element.innerHTML = content;
  return element;
}

function makeElement(type, content, className) {
  const element = document.createElement(type);
  element.classList.add(className);
  element.innerHTML = content;
  return element;
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
  const ul = document.createElement('ol');
  list.appendChild(makeRatingSlider(data, ul));
  setFilterListData(data, ul);
  list.appendChild(ul);
  return list;
}

function setFilterListData(data, ul) {
  Object.keys(data)
    .sort((a, b) => data[b].average - data[a].average)
    .slice(0, 20)
    .forEach(key => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${data[key].name}</span> 
      <span class="tag">${data[key].average} in ${data[key].count}</span>
      <span class="tag">${data[key].style}</span>`;
      if (data[key].address) {
        li.innerHTML += ` <span class="tag">${data[key].address}</span>`;
      }
      ul.appendChild(li);
    });
}

function makeRatingSlider(data, ul) {
  const sliderContainer = document.createElement('div');
  const hihestRatingCount = Math.max(...data.map(element => element.count));
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
    const filteredData = data.filter(element => element.count >= slider.value);
    ul.innerHTML = '';
    setFilterListData(filteredData, ul);
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
