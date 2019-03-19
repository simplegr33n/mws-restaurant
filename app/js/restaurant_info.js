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

	console.log("isfav?" + restaurant.is_favourite);

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

	console.log("fillin with: " + reviews);

	if (error) {
		console.log('Error getting reviews: ', error);
	}
	const header = document.getElementById('reviews-header');
	var x = document.getElementsByClassName('add-review-btn');

	if (x.length < 1) {
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
	}

	const container = document.getElementById('reviews-container');

	const reviewsList = document.getElementById('reviews-list');
	reviewsList.innerHTML = "";


	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}
	const ul = document.getElementById('reviews-list');
	let reviewIndex = 0;
	reviews.forEach(review => {
		reviewIndex++;
		ul.appendChild(createReviewHTML(review, reviewIndex));
	});
	container.appendChild(ul);


}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review, reviewIndex) => {
	const li = document.createElement('li');
	const reviewCtrls = document.createElement('div');
	reviewCtrls.classList.add('review-edit-delete');

	const name = document.createElement('p');
	name.innerHTML = review.name;
	name.style.fontWeight = 'bold';
	name.style.fontSize = '20px';
	name.style.fontStyle = 'italic';
	reviewCtrls.appendChild(name);

	const editReviewBtn = document.createElement('button');
	editReviewBtn.id = 'review-edit-btn' + reviewIndex;
	editReviewBtn.classList.add('review_btn');
	editReviewBtn.classList.add('review-edit-btn');
	editReviewBtn.dataset.reviewId = review.id;
	editReviewBtn.dataset.restaurantId = review.restaurant_id;
	editReviewBtn.innerHTML = 'Edit';
	editReviewBtn.setAttribute('aria-label', 'edit review');
	editReviewBtn.title = 'Edit Review';
	editReviewBtn.addEventListener('click', (e) => openEditReviewModal(e, review));
	reviewCtrls.appendChild(editReviewBtn);

	const delReviewBtn = document.createElement('button');
	delReviewBtn.id = 'review-del-btn' + reviewIndex;
	delReviewBtn.classList.add('review_btn');
	delReviewBtn.classList.add('review-del-btn');
	delReviewBtn.dataset.reviewId = review.id;
	delReviewBtn.dataset.restaurantId = review.restaurant_id;
	delReviewBtn.dataset.reviewName = review.name;
	delReviewBtn.innerHTML = 'x';
	delReviewBtn.setAttribute('aria-label', 'delete review');
	delReviewBtn.title = 'Delete Review';
	delReviewBtn.addEventListener('click', openConfirmDeleteModal);
	reviewCtrls.appendChild(delReviewBtn);

	li.appendChild(reviewCtrls);



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

//  Add Review
const addReview = (event) => {
	event.preventDefault();
	const form = event.target;

	if (form.checkValidity()) {
		console.log('Form is valid');

		const restaurant_id = self.restaurant.id;
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
				console.log('Received updated record from server', review);
				DBHelper.createIDBReview(review); // write record to local IndexedDB store
			}

			DBHelper.fetchRestaurantReviewsById(restaurant_id, fillReviewsHTML);
			closeAddReviewModal();

		});
	}
};

const editReview = (e) => {
	e.preventDefault();

	console.log("editreview: " + e.target.dataset.reviewId)

	const form = e.target;
	const review_id = e.target.dataset.reviewId;
	const restaurant_id = e.target.dataset.restaurantId;
	

	if (form.checkValidity()) {
		const name = document.querySelector('#reviewName').value;
		const rating = document.querySelector('input[name=rate]:checked').value;
		const comments = document.querySelector('#reviewComments').value;

		console.log('review_id: ', review_id);
		console.log('restaurant_id: ', restaurant_id);
		console.log('name: ', name);
		console.log('rating: ', rating);
		console.log('comments: ', comments);

		// attempt save to database server
		DBHelper.updateRestaurantReview(review_id, restaurant_id, name, rating, comments, (error, review) => {
			console.log('Received update callback');
			//form.reset();
			if (error) {
				console.log('Offline. Review sent to queue.');
				//showOffline();
			} else {
				console.log('Received updated record from server', review);
				DBHelper.updateIDBReview(review_id, restaurant_id, review);
			}

			DBHelper.fetchRestaurantReviewsById(restaurant_id, fillReviewsHTML);
			closeEditReviewModal();

		});
	}
};


const deleteReview = (e) => {
	const review_id = e.target.dataset.reviewId;
	const restaurant_id = e.target.dataset.restaurantId;

	DBHelper.deleteRestaurantReview(review_id, restaurant_id, (error, result) => {
		console.log('got delete callback');
		if (error) {
			showOffline();
		} else {
			console.log(result);
			DBHelper.delIDBReview(review_id, restaurant_id);
		}
		DBHelper.fetchRestaurantReviewsById(restaurant_id, fillReviewsHTML);
		closeConfirmDeleteModal();
	});
};

const getIDBReviews = function (restaurant_id) {
	idbKeyVal.getAllIdx('reviews', 'restaurant_id', restaurant_id)
		.then(reviews => {
			// console.log(reviews);
			fillReviewsHTML(null, reviews);
			closeConfirmDeleteModal();
			document.getElementById('review-add-btn').focus();
		});
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

	// Listen for modal close
	modalOverlay.addEventListener('click', closeModal);
	// Close btns
	let exitBtns = document.querySelectorAll('.exit-btn');
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

const closeConfirmDeleteModal = () => {
	const modal = document.getElementById('confirm-delete-modal');
	// Hide the modal and overlay
	modal.classList.remove('show');
	modalOverlay.classList.remove('show');

	// Set focus back to element that had it before the modal was opened
	focusBeforeModal.focus();
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

const closeEditReviewModal = () => {
	const modal = document.getElementById('modal-add-review');
	// Hide the modal and overlay
	modal.classList.remove('show');
	modalOverlay.classList.remove('show');

	const form = document.getElementById('review-form');
	form.reset();
	delete form.dataset.reviewId;
	form.removeEventListener('submit', editReview, false);

	// Set focus back to element that had it before the modal was opened
	focusBeforeModal.focus();
};

// Star Rating Control
const setFocus = (event) => {
	const rateRadios = document.getElementsByName('rate');
	const rateRadiosArr = Array.from(rateRadios);
	const anyChecked = rateRadiosArr.some(radio => { return radio.checked === true; });
	// console.log('anyChecked', anyChecked);
	if (!anyChecked) {
		const star1 = document.getElementById('star1');
		star1.focus();
		// star1.checked = true;
	}
};

const openConfirmDeleteModal = (e) => {
	const modal = document.getElementById('confirm-delete-modal');
	configureModal(modal, closeConfirmDeleteModal);

	const nameContainer = document.getElementById('review-name');
	nameContainer.textContent = e.target.dataset.reviewName;

	const cancelBtn = document.getElementById('cancel-btn');
	cancelBtn.onclick = closeConfirmDeleteModal;

	const delConfirmBtn = document.getElementById('delete-confirm-btn');
	delConfirmBtn.dataset.reviewId = e.target.dataset.reviewId;
	delConfirmBtn.dataset.restaurantId = e.target.dataset.restaurantId;

	delConfirmBtn.addEventListener("click", deleteReview);
};

const openEditReviewModal = (e, review) => {

	console.log("openERM: " + review.id);

	const modal = document.getElementById('modal-add-review');
	configureModal(modal, closeEditReviewModal);

	document.querySelector('#reviewComments').value = review.comments;

	document.getElementById('add-review-header').innerText = 'Edit Review';

	document.querySelector('#reviewName').value = review.name;
	switch (review.rating) {
		case 1:
			document.getElementById('star1').checked = true;
			break;
		case 2:
			document.getElementById('star2').checked = true;
			break;
		case 3:
			document.getElementById('star3').checked = true;
			break;
		case 4:
			document.getElementById('star4').checked = true;
			break;
		case 5:
			document.getElementById('star5').checked = true;
			break;
	}

	// submit form
	const form = document.getElementById('review-form');
	//form.addEventListener('submit', editReview, false);

	const editSaveButton = document.getElementById('submit-review-btn');
	editSaveButton.dataset.reviewId = review.id;
	editSaveButton.dataset.restaurantId = review.restaurant_id;
	editSaveButton.addEventListener("click", editReview);
}


// allows a11y & keyboard navigation
const navRadioGroup = (evt) => {
	const star1 = document.getElementById('star1');
	const star2 = document.getElementById('star2');
	const star3 = document.getElementById('star3');
	const star4 = document.getElementById('star4');
	const star5 = document.getElementById('star5');

	if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(evt.key)) {
		evt.preventDefault();
		if (evt.key === 'ArrowRight' || evt.key === 'ArrowDown') {
			switch (evt.target.id) {
				case 'star1':
					star2.focus();
					star2.checked = true;
					break;
				case 'star2':
					star3.focus();
					star3.checked = true;
					break;
				case 'star3':
					star4.focus();
					star4.checked = true;
					break;
				case 'star4':
					star5.focus();
					star5.checked = true;
					break;
				case 'star5':
					star1.focus();
					star1.checked = true;
					break;
			}
		} else if (evt.key === 'ArrowLeft' || evt.key === 'ArrowUp') {
			switch (evt.target.id) {
				case 'star1':
					star5.focus();
					star5.checked = true;
					break;
				case 'star2':
					star1.focus();
					star1.checked = true;
					break;
				case 'star3':
					star2.focus();
					star2.checked = true;
					break;
				case 'star4':
					star3.focus();
					star3.checked = true;
					break;
				case 'star5':
					star4.focus();
					star4.checked = true;
					break;
			}
		}
	}
}