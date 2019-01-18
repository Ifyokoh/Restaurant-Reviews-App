let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoiaWZ5eSIsImEiOiJjamwweWhyeGIxNjcwM3FwMmt3cHN2c2g3In0.z2C4K0l11WDw8CqkZ1oNFQ',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  
 
/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}


/**
 * Get restaurant reviews from page URL.
 */
const fetchReviewsFromURL = (callback) => {
  if (self.reviews) { // review already fetched!
    callback(null, self.reviews)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No review id in URL'
    console.log('no id found')
    callback(error, null);
  } else {
    DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        fillReviewsHTML(null);
        return;
      }
      fillReviewsHTML();
    });
  }
}


/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.tabIndex = '0';

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `${restaurant.name} Restaurant`;
  image.tabIndex = '0';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');
    row.tabIndex = '0';

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = () => {
  const container = document.getElementById('reviews-container');
  // const title = document.createElement('h3');
  // title.innerHTML = 'Reviews';
  // container.appendChild(title);
  DBHelper.fetchReviewsByRestaurantId(self.restaurant.id)
  .then(reviews => {
  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.reverse().forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
})
.catch(error => {
  console.log(error);
});
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');

  const header = document.createElement('div');
  header.className = 'review-header';
  li.appendChild(header);

  const name = document.createElement('span');
  name.className = 'reviewer';
  name.innerHTML = review.name;
  header.appendChild(name);

  const date = document.createElement('span');
  date.className = 'review-date';
  date.innerHTML = realDate(review.createdAt);
  header.appendChild(date);

  const body = document.createElement('div');
  body.className = 'review-body';
  li.appendChild(body);

  const rating = document.createElement('span');
  rating.className = 'review-rating';
  rating.innerHTML = `Rating: ${review.rating}`;
  body.appendChild(rating);

  const comments = document.createElement('p');
  comments.className = 'review-comments';
  comments.innerHTML = review.comments;
  body.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
realDate = d => {
  const date = new Date(d);
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December',];
  const day = date.getDate();
  const index = date.getMonth();
  const year = date.getFullYear();
  return `${day} ${months[index]} ${year}`;
};

/**
 * Review form.
 */
  const form = document.querySelector('form');
  form.addEventListener('submit', e => {
  e.preventDefault();
  let formData = new FormData(form);
  let name = document.getElementById("review-name").value;
  let rating = document.getElementById("review-rating").value;
  let message = document.getElementById("review-comment").value;

  
    let review = {
      restaurant_id: self.restaurant.id,      
      name: name,
      rating: rating,
      comments: message,
      createdAt: new Date(),
    }

    fetch("http://localhost:1337/reviews/", {
      method: "POST",
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(review),
    }).then(function() {
      newReview(review);
    })
    .catch(function(error) {
      console.log('Request failed', error);
      newReview(review);
    });
    
  })



newReview = (review) => {
  const ul = document.getElementById('reviews-list');
  var newItem = document.createElement("li");

  const textnode = document.createElement('li');

  const header = document.createElement('div');
  header.className = 'review-header';
  textnode.appendChild(header);

  const name = document.createElement('span');
  name.className = 'reviewer';
  name.innerHTML = review.name;
  header.appendChild(name);

  const date = document.createElement('span');
  date.className = 'review-date';
  date.innerHTML = realDate(review.createdAt);
  header.appendChild(date);

  const body = document.createElement('div');
  body.className = 'review-body';
  textnode.appendChild(body);

  const rating = document.createElement('span');
  rating.className = 'review-rating';
  rating.innerHTML = `Rating: ${review.rating}`;
  body.appendChild(rating);

  const comments = document.createElement('p');
  comments.className = 'review-comments';
  comments.innerHTML = review.comments;
  body.appendChild(comments);

  newItem.appendChild(textnode);
  ul.insertBefore(newItem, ul.childNodes[0]);

};

  
  