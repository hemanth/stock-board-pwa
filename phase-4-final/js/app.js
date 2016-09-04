(function(){

  const app = {
      visibleCards: {},
      stocksList: [],
      failedFetchList: [],
      currentStock: '',
      cardTemplate: document.querySelector('.cardTemplate'),
      container: document.querySelector('.stocks'),
      addDialog: document.querySelector('.dialog-container'),
  };

  //Hard coding for the demo.
  app.companyName = {
    "ITC": "Indian Tobacco Company",
    "MARUTI": "Maruti",
    "BHARTIARTL": "Bharti Airtel Ltd",
    "RELIANCE": "Reliance Industries Limited.",
    "ONGC": "Oil and Natural Gas Corporation Ltd",
    "NTPC": "NTPC Ltd",
    "SBIN": "State Bank of India"
  };

  // Event handler for the fab icon.
  document.getElementById('fab').addEventListener('click', function() {
    app.toggleAddDialog(true);
  });

  // On click of the add button of the select list.
  document.getElementById('addStock').addEventListener('click', function() {
    var select = document.getElementById('stockToAdd');
    var selected = select.options[select.selectedIndex];
    var key = selected.value;
    app.fetchStock(key).then(() => app.saveSelectedStock());
    app.toggleAddDialog(false);
  });

  // On the click cancel button on the select list.
  document.getElementById('addStockCancl').addEventListener('click', function() {
    app.toggleAddDialog(false);
  });

  // For toggling the stock list div.
  app.toggleAddDialog = function(visible) {
    if (visible) {
      app.addDialog.classList.add('dialog-container--visible');
    } else {
      app.addDialog.classList.remove('dialog-container--visible');
    }
  };

  // To store it localStorage, P.S: That localStorage is a sync call.
  // For production use something like indexDB.https://developer.mozilla.org/en/docs/Web/API/IndexedDB_API 
  app.saveSelectedStock = () => localStorage.selectedStocks = JSON.stringify(app.stocksList);;
  app.saveFailedFetch = () => localStorage.failedFetchList = JSON.stringify(app.failedFetchList);

  // ❤️ of the app, that would data for the stock.
  app.fetchStock = function(stock) {

    // Save it to list.
    app.stocksList.push(stock);

    // Current stokc name.
    app.currentStock = stock;
    
    // Proxy for Google fin API.
    // Sticking with NSE, as we are coding this in the BSE building ;)
    const API_URI = 'https://google-stocks.herokuapp.com/?code=NSE:';
    
    // Query endpoint
    const API = `${API_URI}${stock}`;

    const templateData = fetch(API)
    .then(resp => {
      return resp.json();
    })
    .then(stocks => {
      return stocks.forEach(stock => {
        var stockName = stock.t;
        var card = app.visibleCards[stockName];
        //Check if the stock card already added.
        if(!card) {
          card = app.cardTemplate.cloneNode(true);
          card.classList.remove('cardTemplate');
          card.removeAttribute('hidden');
          app.container.appendChild(card);
          app.visibleCards[stock.t] = card;
        }
        var stockUp = (stock.c_fix > 0) ? '<span class="up">▲</span>' : '<span class="down">▼</span>';
        card.querySelector('.company__name').classList.add(stockName);
        card.querySelector('.company__name').textContent = app.companyName[stockName];
        card.querySelector('.stock__name').textContent = `${stock.e}: ${stock.t}`;
        card.querySelector('.stock__fix').innerHTML = `₹${stock.pcls_fix}`;
        card.querySelector('.stock__curr').innerHTML = `${stock.l_cur}`;
        card.querySelector('.stock__symbol').innerHTML = `${stockUp}`;
        card.querySelector('.stock__symbol').classList.add((stock.c_fix > 0) ? 'up': 'down');
        card.querySelector('.stock__percentage').textContent = `${stock.c}`;
        card.querySelector('.stock__time').textContent = stock.lt;
      });
    })
    .catch(err => {
      app.failedFetchList.push(app.currentStock);
      app.saveFailedFetch();
    });

    return templateData;
  }

  const updateNetworkStatus = function() {
    let isOnline = navigator.onLine;

    let body = document.querySelector('body');

    if(isOnline && body.classList.contains('offline')) {
      body.classList.remove('offline')
    }

    if(!isOnline) {
      body.classList.add('offline');
    }
  };

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

/*
****************************
****************************

ServiceWorker Magic!

****************************
****************************
*/
  // Check if serviceWorker is present in the browser.
  if ('serviceWorker' in navigator) {
    // Regsiter Sw, the file is in the root.
    navigator.serviceWorker.register('../sw.js', { scope: '/' })
    .then((reg) => {
      if (reg.installing) {
        console.log('Service worker installing');
      } else if(reg.waiting) {
        console.log('Service worker installed');
      } else if(reg.active) {
        console.log('Service worker active');
      }
    }).catch((error) => {
      console.log('Registration failed with ' + error); // Registration failed
    });
  }

  // Push notifications.
  navigator.serviceWorker.ready.then(registration => {
    // Check if the browser has push notification support.
    if (!registration.pushManager) {
      alert('Your browser doesn\'t support push notifications');
      return;
    }
    // Prompt the user for push notification.
    registration.pushManager.subscribe({userVisibleOnly: true})
    .then((subscription) => {
      console.log('Successfully subscribed: ', subscription);
    })
    .catch((error) => {
      console.error(error);
    })
  });

  // Background Sync.
  navigator.serviceWorker.ready.then(function(registration) {
    // Register for `fetchStocks`
    registration.sync.register('fetchStocks').then(function(event) {
      console.log('BackgroundSync registered');
    }, function() {
      console.log('BackgroundSync registration failed');
    });
  });

  // This is when the sw sends a postMessage
  navigator.serviceWorker.addEventListener('message', function handler (event) {
    console.log('From BackgroundSync:', event.data);
    app.failedFetchList = JSON.parse(localStorage.failedFetchList || []);
    app.failedFetchList.forEach(function(stock) {
      app.fetchStock(stock);
    });
  });

}());
