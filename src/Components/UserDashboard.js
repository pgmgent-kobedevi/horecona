/*
* register component
*/

import 'regenerator-runtime/runtime';

import firebase from 'firebase/app';
import 'firebase/firestore';

import checkout from '../img/icons/checkout.svg';

import mapbox from '../lib/mapbox';

import Elements from '../lib/Elements';
import Component from '../lib/Component';
import User from '../lib/User';

class UserDashboard extends Component {
  constructor() {
    super({
      name: 'Dashboard',
      model: {
        profileInfo: null,
        checkin: null,
      },
      routerPath: '/dashboard',
    });
    this.userLoaded = false;
  }

  // get userdata
  async getUserData() {
    if (!this.userLoaded) {
      const tempUser = new User();
      await tempUser.getThisUser()
        .then(async (data) => {
          // check if user is checked in
          await tempUser.getCheckinData(data)
            .then((checkinData) => {
              this.model.profileInfo = data;
              this.model.checkin = checkinData;
            });
          this.userLoaded = true;
        });
    }
  }

  async checkout() {
    const tempUser = new User();
    await tempUser.checkout(this.model.profileInfo, this.model.checkin);
  }

  // get businessInfo
  async businessInfo() {
    const db = firebase.firestore();
    const query = await db.collection('users').doc(this.model.profileInfo.docid).collection('info').get()
      .then(async (data) => data.docs[0].data());
    return query;
  }

  // generate map
  async mapbox(container) {
    // div loads in to slow, promise to solve this
    const myPromise = new Promise((myResolve) => {
      const div = document.createElement('div');
      div.id = 'map';
      container.append(div);
      myResolve(); // when successful
    });
    // when mapcontainer is ready load in map
    myPromise.then(() => {
      mapbox.load();
    });
  }

  // dashboard for users
  userDashboard(container) {
    // header
    if (!this.model.checkin) {
      container.insertAdjacentHTML('beforeend', Elements.createHeader({
        size: 1,
        title: 'Not checked in',
        subtitle: 'You\'re currently not checked in',
      }));
    } else {
      container.insertAdjacentHTML('beforeend', Elements.createHeader({
        size: 1,
        title: 'Checked in',
        subtitle: `You\'re checked in at ${this.model.checkin.data.name}`,
      }));
    }

    const main = document.createElement('main');
    main.classList.add('left');

    main.insertAdjacentHTML('beforeend', Elements.subsubtitle({ textContent: 'Corona proof locations' }));
    this.mapbox(main);

    main.insertAdjacentHTML('beforeend', Elements.subsubtitle({ textContent: 'Actions' }));
    // if user is not checked in checked in show check in button
    if (this.model.checkin === null) {
      main.appendChild(Elements.actionBtn({ textContent: 'Check in', icon: 'checkin', href: '/scanner' }));
    } else {
      // else check out button
      // Handlebars is shit with this so I create the element once here...
      const button = document.createElement('a');
      button.href = '#';
      button.classList.add('m-button__action');
      const div = document.createElement('div');
      div.classList.add('m-action__container');
      button.appendChild(div);
      const img = document.createElement('img');
      img.classList.add('a-container__img');
      img.src = checkout;
      img.alt = 'icon';
      div.appendChild(img);
      const text = document.createElement('p');
      text.innerHTML = 'Check out';
      div.appendChild(text);
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.checkout();
      });
      main.append(button);
    }

    main.appendChild(Elements.actionBtn({ textContent: 'History', icon: 'history', href: '/history' }));
    main.insertAdjacentHTML('beforeend', Elements.navigation({ active: 'home' }));

    container.insertAdjacentHTML('beforeend', '<script src="https://www.gstatic.com/firebasejs/8.2.1/firebase-app.js"></script>');
    container.appendChild(main);
  }

  // dashboard for businesses
  async businessDashboard(container) {
    // get business name & manager name
    const businessInfo = await this.businessInfo();
    // header
    container.insertAdjacentHTML('beforeend', Elements.createHeader({
      size: 1,
      title: businessInfo.Business,
      subtitle: `${businessInfo.firstName} ${businessInfo.surName}`,
    }));

    const main = document.createElement('main');
    main.classList.add('left');

    main.insertAdjacentHTML('beforeend', Elements.subsubtitle({ textContent: 'Actions' }));
    main.appendChild(Elements.actionBtn({ textContent: 'Generate QR-code', icon: 'generate', href: '/generate' }));
    main.appendChild(Elements.actionBtn({ textContent: 'Active users', icon: 'users', href: '/activeUsers' }));
    main.appendChild(Elements.actionBtn({ textContent: 'History', icon: 'history', href: '/history' }));

    main.insertAdjacentHTML('beforeend', Elements.navigation({ active: 'home' }));

    container.insertAdjacentHTML('beforeend', '<script src="https://www.gstatic.com/firebasejs/8.2.1/firebase-app.js"></script>');
    container.appendChild(main);
  }

  render() {
    // create a container
    const container = document.createElement('section');
    container.classList.add('pageContainer');

    if (!this.model.profileInfo) {
      this.getUserData();
    } else if (this.model.profileInfo.type === 'user') {
      this.userDashboard(container);
    } else if (this.model.profileInfo.type === 'Business') {
      this.businessDashboard(container);
    }

    return container;
  }
}

export default UserDashboard;
