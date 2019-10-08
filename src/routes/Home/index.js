import HomeContainer from './container/HomeContainer';
import {browserHistory} from 'react-router';


// export default {
//   path: '/Home',
//   component : HomeContainer
//
// };

export default (store) => ({
  /*  Async getComponent is only invoked when route matches   */

  component : HomeContainer

});
