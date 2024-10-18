const download = (filename, text) => {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

const load = () => {
  if($('.more_checkins')[0].style.display !== "none") {  
    $('.more_checkins')[0].click(); 
    setTimeout(load, 2000);
  } else {
    var checkins = $('#main-stream .item').map((i, item) => ({
      checkinId: $(item).attr('data-checkin-id'),
      time: $(item).find('.checkin .bottom .time').attr('data-gregtime'),
      imageSmall: $(item).find('.checkin .top img').attr('src'),
      beer: $(item).find('.checkin .top p a').eq(1).text(),
      beerLink: $(item).find('.checkin .top p a').eq(1).attr('href'),
      brewery: $(item).find('.checkin .top p a').eq(2).text(),
      breweryLink: $(item).find('.checkin .top p a').eq(2).attr('href'),
      venue: $(item).find('.checkin .top p a').eq(3).text(),
      venueLink: $(item).find('.checkin .top p a').eq(3).attr('href'),
      rating: $(item).find('.checkin .checkin-comment .rating-serving .caps').attr('data-rating'),
      serving: $(item).find('.checkin .checkin-comment .rating-serving .serving span').text(),
      badges: $(item).find('.checkin .checkin-comment .badge').map((b, el) => $(el).find('span').text()).get(),
      tagged: $(item).find('.checkin .checkin-comment .tagged-friends').find('a').map((t, el) => $(el).attr('href').split('/').pop()).get(),
    })).get();
    console.log(JSON.stringify(checkins));
    download(`checkins-${window.location.pathname.split('/')[2]}.json`, JSON.stringify(checkins));
  }
}
load();