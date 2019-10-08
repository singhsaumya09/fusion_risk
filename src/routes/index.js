// We only need to import the modules necessary for initial render
import CoreLayout from '../layouts/CoreLayout';
import Home from './Home';


/*  Note: Instead of using JSX, we recommend using react-router
    PlainRoute objects to build route definitions.   */
console.log('localStorage from routes main.js :: ',localStorage);
export const createRoutes = (store) => ({
  path: '/',
  component: CoreLayout,
  indexRoute: Home(store),
  childRoutes: [
  ]
})


export default createRoutes;
