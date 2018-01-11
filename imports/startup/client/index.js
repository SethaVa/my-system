// Import client startup through a single index entry point

// import './routes.js';


import { Meteor } from 'meteor/meteor';
import Vue from 'vue';
import _ from 'lodash';

// ------------Router-----------
import VueRouter from 'vue-router';

Vue.use(VueRouter);

// -------------Element UI----------------

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import locale from 'element-ui/lib/locale/lang/en';


Vue.use(ElementUI, {
    locale,
    size: 'medium'
})
// -------------Data Table---------------
import DataTables from 'vue-data-tables';
Vue.use(DataTables)

// ---------------create router--------------
import routes from './routes';
const router = new VueRouter({
    mode: 'history',
    routes: routes
});

// --------------App layout component---------------

import App from '../../client/pages/index.vue';

Meteor.startup(() => {

    new Vue({
        router,
        ...App
    }).$mount('app');
})