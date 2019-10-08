import '../../styles/bootstrap/css/bootstrap.min.css';
import '../../styles/bootstrap/css/bootstrap-theme.min.css';
import '../../styles/core.scss';
import React from 'react'
import PropTypes from 'prop-types'
// import './CoreLayout.scss'
// import '../../styles/core.scss'


export const CoreLayout = ({ children }) => (
  <div>
    <div>
      {children}
    </div>
  </div>
)

CoreLayout.propTypes = {
  children : PropTypes.element.isRequired
}

export default CoreLayout
