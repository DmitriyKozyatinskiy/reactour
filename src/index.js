import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
import 'custom-event-polyfill';
import smoothscroll from 'smoothscroll-polyfill';
import svg4everybody from 'svg4everybody';

smoothscroll.polyfill();
svg4everybody();

import Tour from './Tour';
export default Tour;
