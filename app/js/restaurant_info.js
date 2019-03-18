let restaurant;
var newMap;
var focusBeforeModal;
const modalOverlay = document.querySelector('.modal-overlay');

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
				mapboxToken: 'pk.eyJ1IjoiZ2Nnb2xkYSIsImEiOiJjanJvNHJjajYwZms5NDlsOWJiMHBqZDNsIn0.w_YXdoqxO8EZ8tZZgM9aVA',
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
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;

	const favButton = document.getElementById('details-fav');
	if (restaurant.is_favourite === 'true') {
		favButton.classList.add('active');
		favButton.setAttribute('aria-pressed', 'true');
		favButton.title = `Remove ${restaurant.name} from favourite`;
	} else {
		favButton.setAttribute('aria-pressed', 'false');
		favButton.title = `Add ${restaurant.name} to favourite`;
	}
	favButton.addEventListener('click', (event) => {
		event.preventDefault();
		if (favButton.classList.contains('active')) {
			favButton.setAttribute('aria-pressed', 'false');
			favButton.title = `Add ${restaurant.name} to favourites`;
			DBHelper.removeFavourite(restaurant.id);
		} else {
			favButton.setAttribute('aria-pressed', 'true');
			favButton.title = `Remove ${restaurant.name} from favourites`;
			DBHelper.setFavourite(restaurant.id);
		}
		favButton.classList.toggle('active');
	});

	const image = document.getElementById('restaurant-img');
	image.className = 'restaurant-img'
	image.src = DBHelper.imageUrlForRestaurant(restaurant);
	image.alt = restaurant.name + ' image';
	// image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
	// image.sizes = "(max-width: 320px) 300px, (max-width: 425px) 400px, (max-width: 635px) 600px, (min-width: 636px) 800px";

	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
	// fill reviews
	DBHelper.fetchRestaurantReviewsById(restaurant.id, fillReviewsHTML);
	// fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	for (let key in operatingHours) {
		const row = document.createElement('tr');

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
fillReviewsHTML = (error, reviews) => {
	self.restaurant.reviews = reviews;

	if (error) {
		console.log('Error getting reviews: ', error);
	}
	const header = document.getElementById('reviews-header');
	const title = document.createElement('h2');
	title.innerHTML = 'Reviews';
	header.appendChild(title);

	const addReviewButton = document.createElement('button');
	addReviewButton.classList.add('add-review-btn');
	addReviewButton.innerHTML = '+ Add Review';
	addReviewButton.setAttribute('aria-label', 'add review');
	addReviewButton.title = 'Add Review';
	addReviewButton.addEventListener('click', openAddReviewModal);
	header.appendChild(addReviewButton);

	const container = document.getElementById('reviews-container');

	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}
	const ul = document.getElementById('reviews-list');
	reviews.forEach(review => {
		ul.appendChild(createReviewHTML(review));
	});
	container.appendChild(ul);


}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
	const li = document.createElement('li');
	const name = document.createElement('p');
	name.innerHTML = review.name;
	name.style.fontWeight = 'bold';
	name.style.fontStyle = 'italic';
	li.appendChild(name);

	const createdAt = document.createElement('p');
	const createdDate = new Date(review.createdAt).toLocaleDateString();
	createdAt.innerHTML = `Added:<strong>${createdDate}</strong>`;
	li.appendChild(createdAt);

	const updatedAt = document.createElement('p');
	const updatedDate = new Date(review.updatedAt).toLocaleDateString();
	updatedAt.innerHTML = `Updated:<strong>${updatedDate}</strong>`;
	updatedAt.style.color = '#178621';
	li.appendChild(updatedAt);

	const rating = document.createElement('p');
	rating.innerHTML = `Rating: ${review.rating}`;
	li.appendChild(rating);

	const comments = document.createElement('p');
	comments.innerHTML = review.comments;
	li.appendChild(comments);

	return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
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
}


const addReview = (event) => {
	event.preventDefault();
	const form = event.target;

	if (form.checkValidity()) {
		console.log('is valid');

		const restaurant_id = self.restaurant._id;
		const name = document.querySelector('#reviewName').value;
		const rating = document.querySelector('input[name=rate]:checked').value;
		const comments = document.querySelector('#reviewComments').value;

		// Try saving to server database
		DBHelper.createRestaurantReview(restaurant_id, name, rating, comments, (error, review) => {
			form.reset();
			if (error) {
				console.log('Review queued while offline');
				// showOffline();
			} else {
				console.log('Received updated database record from server', review);
				DBHelper.createIDBReview(review); // write record to local IDB store
			}
			idbKeyVal.getAllIdx('reviews', 'restaurant_id', restaurant_id)
				.then(reviews => {
					console.log('New Review!', reviews);
					fillReviewsHTML(null, reviews);
					closeAddReviewModal();
				});
		});
	}
};

/**
 * Open Modal Windows
 */
const openAddReviewModal = () => {
	const modal = document.getElementById('modal-add-review');
	configureModal(modal, closeAddReviewModal);

	document.getElementById('add-review-header').innerText = 'Add Review';

	// submit form
	const form = document.getElementById('review-form');
	form.addEventListener('submit', addReview, false);

};


const configureModal = (modal, closeModal) => {
	// Save current focus
	focusBeforeModal = document.activeElement;

	// Listen for and trap the keyboard
	modal.addEventListener('keydown', trapTabKey);

	// Listen for indicators to close the modal
	modalOverlay.addEventListener('click', closeModal);
	// Close btn
	let exitBtns = document.querySelectorAll('.exit-btn');
	// closeBtn.addEventListener('click', closeModal);
	exitBtns = Array.prototype.slice.call(exitBtns);
	exitBtns.forEach(btn => btn.addEventListener('click', closeModal));

	// Find all focusable children
	var focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
	var focusableElements = modal.querySelectorAll(focusableElementsString);
	// Convert NodeList to Array
	focusableElements = Array.prototype.slice.call(focusableElements);

	var firstTabStop = focusableElements[0];
	var lastTabStop = focusableElements[focusableElements.length - 1];

	// Show the modal and overlay
	modal.classList.add('show');
	modalOverlay.classList.add('show');

	// Focus second child
	setTimeout(() => {
		firstTabStop.focus();
		focusableElements[1].focus();
	}, 200);
	function trapTabKey(e) {
		// Check for TAB key press
		if (e.keyCode === 9) {

			// SHIFT + TAB
			if (e.shiftKey) {
				if (document.activeElement === firstTabStop) {
					e.preventDefault();
					lastTabStop.focus();
				}

				// TAB
			} else {
				if (document.activeElement === lastTabStop) {
					e.preventDefault();
					firstTabStop.focus();
				}
			}
		}

		// ESCAPE
		if (e.keyCode === 27) {
			closeModal();
		}
	}
};

const closeAddReviewModal = () => {
	const modal = document.getElementById('modal-add-review');
	// Hide the modal and overlay
	modal.classList.remove('show');
	modalOverlay.classList.remove('show');

	const form = document.getElementById('review-form');
	form.reset();
	form.removeEventListener('submit', addReview, false);

	// Set focus back to element that had it before the modal was opened
	focusBeforeModal.focus();
};