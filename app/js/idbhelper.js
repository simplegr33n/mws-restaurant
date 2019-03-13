import { openDb, deleteDb } from 'idb'; // https://github.com/jakearchibald/idb

const dbPromise = openDb('udacity-restaurant-db', 1, upgradeDB => {
    switch (upgradeDB.oldVersion) {
        case 0:
            upgradeDB.createObjectStore('restaurants');
    }
});
self.dbPromise = dbPromise;

// IndexedDB object with getter / setter
const idbKeyVal = {
    get(key) {
        return dbPromise.then(db => {
            return db
                .transaction('restaurants')
                .objectStore('restaurants')
                .get(key);
        });
    },
    set(key, val) {
        return dbPromise.then(db => {
            const tx = db.transaction('restaurants', 'readwrite');
            tx.objectStore('restaurants').put(val, key);
            return tx.complete;
        });
    }
};